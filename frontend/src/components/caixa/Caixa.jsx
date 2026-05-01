// src/components/caixa/Caixa.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Row,
    Col,
    AutoComplete,
    Input,
    Table,
    Button,
    Select,
    InputNumber,
    Typography,
    Divider,
    Space,
    Tag,
    Modal,
    Descriptions,
    Statistic,
    message,
    Alert
} from 'antd';
import {
    SearchOutlined,
    DollarOutlined,
    CheckCircleOutlined,
    PrinterOutlined,
    WalletOutlined,
    BankOutlined,
    CreditCardOutlined,
    MobileOutlined
} from '@ant-design/icons';
import moment from 'moment';
import creditoService from '../../services/creditoService';
import { useDebounce } from '../../hooks/useDebounce';
import ReciboPagamento from './ReciboPagamento';

// Logo após os imports e antes do componente Caixa:

// Função para decodificar JWT
const decodeJWT = (token) => {
    try {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

// Função para pegar o nome do operador
const getNomeOperador = () => {
    try {
        // Tentar do localStorage
        const userRaw = localStorage.getItem('timali_user');
        if (userRaw && userRaw !== 'undefined' && userRaw !== 'null') {
            try {
                const user = JSON.parse(userRaw);
                if (user && typeof user === 'object') {
                    return user.nome || user.name || user.username || 'Operador';
                }
            } catch (e) {
                // É string simples como "admin"
                return userRaw;
            }
        }

        // Tentar do token JWT
        const token = localStorage.getItem('timali_token');
        if (token) {
            const payload = decodeJWT(token);
            if (payload) {
                return payload.sub || payload.username || payload.nome || 'Operador';
            }
        }

        return 'Operador';
    } catch (e) {
        return 'Operador';
    }
};

const { Title, Text } = Typography;
const { Option } = Select;

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor || 0);
};

const FORMAS_PAGAMENTO = {
    'DINHEIRO': { label: 'Dinheiro', icon: <DollarOutlined />, color: 'green' },
    'PIX': { label: 'PIX', icon: <MobileOutlined />, color: 'blue' },
    'TRANSFERENCIA': { label: 'Transferência', icon: <BankOutlined />, color: 'purple' },
    'CARTAO_DEBITO': { label: 'Cartão Débito', icon: <CreditCardOutlined />, color: 'orange' },
    'CARTAO_CREDITO': { label: 'Cartão Crédito', icon: <CreditCardOutlined />, color: 'red' },
    'BOLETO': { label: 'Boleto', icon: <BankOutlined />, color: 'cyan' },
    'CARTERIA_MOVEL': { label: 'Carteira Móvel', icon: <MobileOutlined />, color: 'magenta' },
    'CHEQUE': { label: 'Cheque', icon: <BankOutlined />, color: 'geekblue' }
};

// Função segura para ler localStorage
const getLocalStorage = (key, defaultValue = {}) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
};

const Caixa = () => {
    const [loading, setLoading] = useState(false);
    const [buscaCliente, setBuscaCliente] = useState('');
    const [clientesOptions, setClientesOptions] = useState([]);
    const [creditoSelecionado, setCreditoSelecionado] = useState(null);
    const [parcelas, setParcelas] = useState([]);
    const [parcelaSelecionada, setParcelaSelecionada] = useState(null);

    const [valorPago, setValorPago] = useState(0);
    const [valorParcelaOriginal, setValorParcelaOriginal] = useState(0);
    const [formaPagamento, setFormaPagamento] = useState('DINHEIRO');
    const [descricao, setDescricao] = useState('');
    const [referencia, setReferencia] = useState('');

    // Distribuição do excedente
    const [distribuicao, setDistribuicao] = useState([]);

    const [reciboModal, setReciboModal] = useState(false);
    const [ultimoPagamento, setUltimoPagamento] = useState(null);

    const buscaClienteDebounced = useDebounce(buscaCliente, 300);

    // ============================================
    // BUSCAR CRÉDITOS
    // ============================================
    const buscarCreditos = useCallback(async (query) => {
        try {
            setLoading(true);
            let data = [];

            try {
                data = await creditoService.buscarCreditosPorCliente(query);
            } catch (e) {
                const clientes = await creditoService.buscarClientes(query);
                if (clientes && clientes.length > 0) {
                    data = clientes.map(c => ({
                        id: c.id,
                        numero: c.codigo,
                        cliente: c.nome,
                        saldo: 0,
                        status: 'CLIENTE'
                    }));
                }
            }

            if (data && data.length > 0) {
                const options = data.map(credito => ({
                    value: credito.numero || credito.id?.toString(),
                    label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                            <span>
                                <strong>{credito.cliente}</strong>
                                <br />
                                <small>Crédito: {credito.numero}</small>
                            </span>
                            <span style={{ textAlign: 'right' }}>
                                <Text type="secondary">
                                    Saldo: {formatarMoeda(credito.totalEmDivida || credito.saldo || 0)}
                                </Text>
                                <br />
                                <Tag color={credito.ativo !== false ? 'green' : 'red'}>
                                    {credito.status || 'ATIVO'}
                                </Tag>
                            </span>
                        </div>
                    ),
                    credito: credito
                }));

                setClientesOptions(options);
            } else {
                setClientesOptions([]);
            }
        } catch (error) {
            console.error('Erro ao buscar:', error);
            setClientesOptions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // ============================================
    // CARREGAR PARCELAS
    // ============================================
    const carregarParcelas = useCallback(async (creditoId) => {
        try {
            setLoading(true);
            const data = await creditoService.listarParcelas(creditoId);

            if (Array.isArray(data)) {
                setParcelas(data);
            } else if (data && typeof data === 'object') {
                const arr = data.parcelas || data.data || data.list || [];
                setParcelas(Array.isArray(arr) ? arr : []);
            } else {
                setParcelas([]);
            }
        } catch (error) {
            console.error('Erro ao carregar parcelas:', error);
            setParcelas([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // ============================================
    // CALCULAR DISTRIBUIÇÃO
    // ============================================
    const calcularDistribuicao = useCallback((valorPagoTotal, parcelaInicial, todasParcelas) => {
        if (!parcelaInicial || !todasParcelas || todasParcelas.length === 0) {
            setDistribuicao([]);
            return;
        }

        const parcelasPendentes = todasParcelas
            .filter(p => !p.pago)
            .sort((a, b) => a.numero - b.numero);

        let saldo = valorPagoTotal;
        const dist = [];

        for (let i = 0; i < parcelasPendentes.length && saldo > 0; i++) {
            const parcela = parcelasPendentes[i];
            const valorDevido = parcela.valorParcela - (parcela.valorPago || 0);
            const valorAlocado = Math.min(saldo, valorDevido);

            if (valorAlocado > 0) {
                dist.push({
                    parcelaId: parcela.id,
                    numero: parcela.numero,
                    vencimento: parcela.dataVencimento,
                    valorTotal: parcela.valorParcela,
                    valorPagoAnterior: parcela.valorPago || 0,
                    valorAlocado: valorAlocado,
                    restante: valorDevido - valorAlocado
                });
                saldo -= valorAlocado;
            }
        }

        setDistribuicao(dist);
    }, []);

    // ============================================
    // EFFECTS
    // ============================================
    useEffect(() => {
        if (buscaClienteDebounced && buscaClienteDebounced.length >= 2) {
            buscarCreditos(buscaClienteDebounced);
        } else {
            setClientesOptions([]);
        }
    }, [buscaClienteDebounced, buscarCreditos]);

    useEffect(() => {
        if (creditoSelecionado) {
            carregarParcelas(creditoSelecionado.id);
        }
    }, [creditoSelecionado, carregarParcelas]);

    // ============================================
    // HANDLERS
    // ============================================
    const handleSelectCredito = (value, option) => {
        const credito = option.credito;
        setCreditoSelecionado(credito);
        setParcelaSelecionada(null);
        setParcelas([]);
        resetFormPagamento();
    };

    const handleSelectParcela = (parcela) => {
        if (parcela.pago) {
            message.warning('Esta parcela já foi paga');
            return;
        }

        setParcelaSelecionada(parcela);
        const valorDevido = parcela.valorParcela - (parcela.valorPago || 0);
        setValorParcelaOriginal(valorDevido);
        setValorPago(valorDevido);
        setDistribuicao([]);
    };

    const handleValorPagoChange = (novoValor) => {
        setValorPago(novoValor || 0);
        if (parcelaSelecionada && novoValor > 0) {
            calcularDistribuicao(novoValor, parcelaSelecionada, parcelas);
        } else {
            setDistribuicao([]);
        }
    };

    const calcularTroco = () => {
        const totalDistribuido = distribuicao.reduce((sum, d) => sum + d.valorAlocado, 0);
        const troco = valorPago - totalDistribuido;
        return troco > 0 ? troco : 0;
    };

    const resetFormPagamento = useCallback(() => {
        setValorPago(0);
        setValorParcelaOriginal(0);
        setFormaPagamento('DINHEIRO');
        setDescricao('');
        setReferencia('');
        setDistribuicao([]);
    }, []);

    // ============================================
    // REGISTRAR PAGAMENTO
    // ============================================
    // ============================================
    // REGISTRAR PAGAMENTO
    // ============================================
    const handleRegistrarPagamento = async () => {
        if (!creditoSelecionado) {
            message.warning('Selecione um crédito');
            return;
        }

        if (!valorPago || valorPago <= 0) {
            message.warning('Informe o valor pago');
            return;
        }

        if (distribuicao.length === 0) {
            message.warning('Não há parcelas para alocar o pagamento');
            return;
        }

        try {
            setLoading(true);
            let totalAlocado = 0;
            const recibos = [];
            let erros = 0;

            // Processar cada parcela
            for (const item of distribuicao) {
                if (item.valorAlocado > 0) {
                    const pagamentoData = {
                        valorPago: item.valorAlocado,
                        formaPagamento: formaPagamento,
                        comprovativo: referencia || null
                    };

                    try {
                        await creditoService.registrarPagamento(
                            creditoSelecionado.id,
                            item.parcelaId,
                            pagamentoData
                        );
                        totalAlocado += item.valorAlocado;
                        recibos.push({
                            ...item,
                            valor: item.valorAlocado
                        });
                    } catch (err) {
                        erros++;
                        console.error(`Erro ao pagar parcela #${item.numero}:`, err);
                    }
                }
            }

            if (totalAlocado > 0) {
                message.success(
                    `Pagamento de ${formatarMoeda(totalAlocado)} registrado com sucesso!` +
                    (erros > 0 ? ` (${erros} erro(s))` : '')
                );

                // ============================================
                // BUSCAR SALDO ATUALIZADO
                // ============================================
                let saldoAtualizado = creditoSelecionado.totalEmDivida || 0;

                try {
                    const creditoAtualizado = await creditoService.buscar(creditoSelecionado.id);
                    if (creditoAtualizado) {
                        saldoAtualizado = creditoAtualizado.totalEmDivida ||
                                         creditoAtualizado.total_em_divida ||
                                         (creditoAtualizado.valorTotal - creditoAtualizado.totalPago) || 0;

                        setCreditoSelecionado(prev => ({
                            ...prev,
                            totalPago: creditoAtualizado.totalPago,
                            totalEmDivida: saldoAtualizado
                        }));
                    }
                } catch (e) {
                    console.warn('Não foi possível buscar saldo atualizado:', e);
                    saldoAtualizado = (creditoSelecionado.valorTotal || 0) -
                                      ((creditoSelecionado.totalPago || 0) + totalAlocado);
                    saldoAtualizado = Math.max(0, saldoAtualizado);
                }

                // ============================================
                // PEGAR NOME DO OPERADOR ← AQUI!!!
                // ============================================
                const nomeOperador = getNomeOperador();
                console.log('👤 Nome do operador:', nomeOperador);

                // ============================================
                // CRIAR RECIBO
                // ============================================
                const recibo = {
                    numeroRecibo: `${moment().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
                    cliente: creditoSelecionado.cliente || creditoSelecionado.entidade?.nome || 'N/A',
                    documento: creditoSelecionado.entidade?.numeroDeIdentificao || creditoSelecionado.entidade?.nuit || '',
                    nuit: creditoSelecionado.entidade?.nuit || '',
                    valorPago: valorPago,
                    totalAlocado: totalAlocado,
                    troco: calcularTroco(),
                    formaPagamento: formaPagamento,
                    dataPagamento: new Date(),
                    parcelasPagas: recibos,
                    operador: nomeOperador,        // ← USA AQUI
                    usuario: nomeOperador,          // ← E AQUI
                    nomeOperador: nomeOperador,     // ← E AQUI
                    saldoDevedor: saldoAtualizado,
                    credito: creditoSelecionado.numero,
                    numeroCredito: creditoSelecionado.numero
                };

                console.log('🧾 Recibo:', recibo);

                setUltimoPagamento(recibo);
                setReciboModal(true);

                await carregarParcelas(creditoSelecionado.id);
                resetFormPagamento();
                setParcelaSelecionada(null);

            } else {
                message.error('Nenhum pagamento foi processado');
            }
        } catch (error) {
            console.error('Erro ao registrar pagamento:', error);
            message.error('Erro ao registrar pagamento');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // COLUNAS - PARCELAS
    // ============================================
    const columnsParcelas = [
        {
            title: '#',
            dataIndex: 'numero',
            key: 'numero',
            width: 50
        },
        {
            title: 'Vencimento',
            dataIndex: 'dataVencimento',
            key: 'dataVencimento',
            render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-'
        },
        {
            title: 'Valor',
            dataIndex: 'valorParcela',
            key: 'valorParcela',
            render: (valor) => formatarMoeda(valor),
            align: 'right'
        },
        {
            title: 'Pago',
            dataIndex: 'valorPago',
            key: 'valorPago',
            render: (valor) => formatarMoeda(valor || 0),
            align: 'right'
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => {
                if (record.pago) {
                    return <Tag color="green">Pago</Tag>;
                }
                if (record.emMora) {
                    return <Tag color="red">Em Mora</Tag>;
                }
                return <Tag color="blue">Pendente</Tag>;
            }
        },
        {
            title: 'Ação',
            key: 'action',
            render: (_, record) => (
                <Button
                    type={parcelaSelecionada?.id === record.id ? 'primary' : 'default'}
                    size="small"
                    disabled={record.pago}
                    onClick={() => handleSelectParcela(record)}
                >
                    {parcelaSelecionada?.id === record.id ? 'Selecionada' : 'Pagar'}
                </Button>
            )
        }
    ];

    // ============================================
    // COLUNAS - DISTRIBUIÇÃO
    // ============================================
    const columnsDistribuicao = [
        {
            title: '#',
            dataIndex: 'numero',
            key: 'numero',
            width: 50
        },
        {
            title: 'Vencimento',
            dataIndex: 'vencimento',
            key: 'vencimento',
            render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-'
        },
        {
            title: 'Valor Total',
            dataIndex: 'valorTotal',
            key: 'valorTotal',
            render: (valor) => formatarMoeda(valor),
            align: 'right'
        },
        {
            title: 'Alocado',
            dataIndex: 'valorAlocado',
            key: 'valorAlocado',
            render: (valor) => <Text strong style={{ color: '#1890ff' }}>{formatarMoeda(valor)}</Text>,
            align: 'right'
        },
        {
            title: 'Restante',
            dataIndex: 'restante',
            key: 'restante',
            render: (valor) => valor > 0 ? formatarMoeda(valor) : <Tag color="green">Quitado</Tag>,
            align: 'right'
        }
    ];

    // ============================================
    // RENDER
    // ============================================
    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>
                <WalletOutlined /> Caixa - Módulo de Pagamentos
            </Title>

            <Row gutter={[16, 16]}>
                {/* Busca */}
                <Col xs={24}>
                    <Card title="Buscar Cliente/Crédito" size="small">
                        <AutoComplete
                            style={{ width: '100%' }}
                            options={clientesOptions}
                            onSelect={handleSelectCredito}
                            onSearch={setBuscaCliente}
                            placeholder="Digite o nome do cliente, NUIT ou número do crédito..."
                            allowClear
                            value={buscaCliente}
                        >
                            <Input prefix={<SearchOutlined />} size="large" />
                        </AutoComplete>
                    </Card>
                </Col>

                {/* Crédito Selecionado */}
                {creditoSelecionado && (
                    <>
                        <Col xs={24}>
                            <Card
                                title="Crédito Selecionado"
                                size="small"
                                extra={
                                    <Tag color={creditoSelecionado.ativo !== false ? 'green' : 'red'}>
                                        {creditoSelecionado.status || (creditoSelecionado.ativo ? 'ATIVO' : 'INATIVO')}
                                    </Tag>
                                }
                            >
                                <Descriptions size="small" column={{ xs: 1, sm: 2, md: 4 }}>
                                    <Descriptions.Item label="Cliente">
                                        {creditoSelecionado.cliente || creditoSelecionado.entidade?.nome || 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="NUIT">
                                        {creditoSelecionado.nuit || creditoSelecionado.entidade?.nuit || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Crédito">
                                        {creditoSelecionado.numero}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Data Emissão">
                                        {creditoSelecionado.dataEmissao ? moment(creditoSelecionado.dataEmissao).format('DD/MM/YYYY') : '-'}
                                    </Descriptions.Item>
                                </Descriptions>

                                <Row gutter={16} style={{ marginTop: 16 }}>
                                    <Col xs={24} sm={8}>
                                        <Statistic
                                            title="Valor Total"
                                            value={creditoSelecionado.valorTotal || 0}
                                            formatter={(value) => formatarMoeda(value)}
                                        />
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Statistic
                                            title="Total Pago"
                                            value={creditoSelecionado.totalPago || 0}
                                            formatter={(value) => formatarMoeda(value)}
                                            valueStyle={{ color: '#3f8600' }}
                                        />
                                    </Col>
                                    <Col xs={24} sm={8}>
                                        <Statistic
                                            title="Saldo Devedor"
                                            value={creditoSelecionado.totalEmDivida || 0}
                                            formatter={(value) => formatarMoeda(value)}
                                            valueStyle={{ color: '#cf1322' }}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>

                        {/* Tabela de Parcelas */}
                        <Col xs={24} md={12}>
                            <Card
                                title="Parcelas"
                                size="small"
                                extra={
                                    <Text type="secondary">
                                        {parcelas.filter(p => !p.pago).length} pendentes
                                    </Text>
                                }
                            >
                                <Table
                                    columns={columnsParcelas}
                                    dataSource={parcelas}
                                    rowKey="id"
                                    size="small"
                                    loading={loading}
                                    pagination={false}
                                    scroll={{ y: 300 }}
                                    locale={{ emptyText: 'Nenhuma parcela' }}
                                />
                            </Card>
                        </Col>

                        {/* Formulário de Pagamento */}
                        <Col xs={24} md={12}>
                            <Card title="Registrar Pagamento" size="small">
                                {parcelaSelecionada ? (
                                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                        <Alert
                                            message={`Parcela #${parcelaSelecionada.numero} selecionada - Vencimento: ${moment(parcelaSelecionada.dataVencimento).format('DD/MM/YYYY')}`}
                                            type="info"
                                            showIcon
                                        />

                                        <div>
                                            <Text strong>Valor Devido da Parcela</Text>
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                value={valorParcelaOriginal}
                                                size="large"
                                                min={0}
                                                step={0.01}
                                                readOnly
                                                formatter={value => `MZN ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={value => value.replace(/MZN\s?|(,*)/g, '')}
                                            />
                                        </div>

                                        <div>
                                            <Text strong>Valor Pago pelo Cliente</Text>
                                            <InputNumber
                                                style={{ width: '100%' }}
                                                value={valorPago}
                                                onChange={handleValorPagoChange}
                                                size="large"
                                                min={0}
                                                step={0.01}
                                                formatter={value => `MZN ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                parser={value => value.replace(/MZN\s?|(,*)/g, '')}
                                            />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {valorPago > valorParcelaOriginal
                                                    ? '✅ Valor excedente será distribuído nas próximas parcelas'
                                                    : valorPago < valorParcelaOriginal
                                                        ? '⚠️ Pagamento parcial da parcela'
                                                        : '✅ Valor exato da parcela'}
                                            </Text>
                                        </div>

                                        {/* Tabela de Distribuição */}
                                        {distribuicao.length > 0 && (
                                            <>
                                                <Divider titlePlacement="left">Distribuição do Pagamento</Divider>
                                                <Table
                                                    columns={columnsDistribuicao}
                                                    dataSource={distribuicao}
                                                    rowKey="parcelaId"
                                                    size="small"
                                                    pagination={false}
                                                    summary={() => (
                                                        <Table.Summary>
                                                            <Table.Summary.Row>
                                                                <Table.Summary.Cell colSpan={3}>
                                                                    <Text strong>Total Alocado</Text>
                                                                </Table.Summary.Cell>
                                                                <Table.Summary.Cell align="right">
                                                                    <Text strong style={{ color: '#1890ff' }}>
                                                                        {formatarMoeda(distribuicao.reduce((sum, d) => sum + d.valorAlocado, 0))}
                                                                    </Text>
                                                                </Table.Summary.Cell>
                                                                <Table.Summary.Cell align="right">
                                                                    {calcularTroco() > 0 ? (
                                                                        <Tag color="orange">Troco: {formatarMoeda(calcularTroco())}</Tag>
                                                                    ) : (
                                                                        <Tag color="green">Sem troco</Tag>
                                                                    )}
                                                                </Table.Summary.Cell>
                                                            </Table.Summary.Row>
                                                        </Table.Summary>
                                                    )}
                                                />
                                            </>
                                        )}

                                        <div>
                                            <Text strong>Forma de Pagamento</Text>
                                            <Select
                                                style={{ width: '100%' }}
                                                value={formaPagamento}
                                                onChange={setFormaPagamento}
                                                size="large"
                                            >
                                                {Object.entries(FORMAS_PAGAMENTO).map(([key, value]) => (
                                                    <Option key={key} value={key}>
                                                        {value.icon} {value.label}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </div>

                                        <div>
                                            <Text strong>Referência/Comprovativo</Text>
                                            <Input
                                                value={referencia}
                                                onChange={(e) => setReferencia(e.target.value)}
                                                placeholder="Nº do comprovativo ou referência"
                                            />
                                        </div>

                                        <div>
                                            <Text strong>Observação</Text>
                                            <Input.TextArea
                                                value={descricao}
                                                onChange={(e) => setDescricao(e.target.value)}
                                                rows={2}
                                                placeholder="Observações sobre o pagamento..."
                                            />
                                        </div>

                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<CheckCircleOutlined />}
                                            onClick={handleRegistrarPagamento}
                                            loading={loading}
                                            block
                                            style={{ height: 50, fontSize: 16 }}
                                            disabled={!valorPago || valorPago <= 0 || distribuicao.length === 0}
                                        >
                                            Registrar Pagamento
                                        </Button>
                                    </Space>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: 40 }}>
                                        <WalletOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                                        <p style={{ marginTop: 16, fontSize: 16 }}>
                                            Selecione uma parcela para começar
                                        </p>
                                        <Text type="secondary">
                                            Clique em "Pagar" na parcela desejada na tabela ao lado
                                        </Text>
                                    </div>
                                )}
                            </Card>
                        </Col>
                    </>
                )}

                {/* Estado inicial - sem crédito selecionado */}
                {!creditoSelecionado && (
                    <Col xs={24}>
                        <Card>
                            <div style={{ textAlign: 'center', padding: 60 }}>
                                <SearchOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                                <h3>Busque um cliente para começar</h3>
                                <p style={{ color: '#999' }}>
                                    Digite o nome do cliente, NUIT ou número do crédito no campo de busca acima
                                </p>
                            </div>
                        </Card>
                    </Col>
                )}
            </Row>

            {/* Modal Recibo */}
            <Modal
                title={null}
                open={reciboModal}
                onCancel={() => setReciboModal(false)}
                footer={null}
                width="100%"
                style={{ maxWidth: 950, top: 10 }}
                bodyStyle={{ padding: 0 }}
                destroyOnClose
            >
                {ultimoPagamento && (
                    <ReciboPagamento
                        pagamento={ultimoPagamento}
                        onClose={() => setReciboModal(false)}
                    />
                )}
            </Modal>
        </div>
    );
};

export default Caixa;