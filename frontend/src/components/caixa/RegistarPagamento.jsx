// src/components/caixa/RegistarPagamento.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    Card, Row, Col, AutoComplete, Input, Table, Button, Select,
    InputNumber, Typography, Divider, Space, Tag, Statistic, message, Alert, Descriptions, DatePicker, Modal
} from 'antd';
import {
    SearchOutlined, DollarOutlined, CheckCircleOutlined,
    WalletOutlined, BankOutlined, CreditCardOutlined, MobileOutlined, CalendarOutlined, FilePdfOutlined
} from '@ant-design/icons';
import moment from 'moment';
import creditoService from '../../services/creditoService';
import { useDebounce } from '../../hooks/useDebounce';
import SettingsContext from '../../contexts/SettingsContext'; // ← CORRIGIDO: import default

const { Text } = Typography;
const { Option } = Select;

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency', currency: 'MZN', minimumFractionDigits: 2, maximumFractionDigits: 2
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

const decodeJWT = (token) => {
    try {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
};

const getNomeOperador = () => {
    try {
        const userRaw = localStorage.getItem('timali_user');
        if (userRaw && userRaw !== 'undefined' && userRaw !== 'null') {
            try {
                const user = JSON.parse(userRaw);
                if (user && typeof user === 'object') return user.nome || user.name || user.username || 'Operador';
            } catch (e) { return userRaw; }
        }
        const token = localStorage.getItem('timali_token');
        if (token) {
            const payload = decodeJWT(token);
            if (payload) return payload.sub || payload.username || payload.nome || 'Operador';
        }
        return 'Operador';
    } catch (e) { return 'Operador'; }
};

const RegistarPagamento = ({ onAbrirRecibo }) => {
    // ============================================
    // SETTINGS
    // ============================================
    const settingsContext = useContext(SettingsContext);
    const settings = settingsContext?.settings;
    const podeAlterarData = settings?.alterarDataPagamento === true;

    // ============================================
    // ESTADOS
    // ============================================
    const [loading, setLoading] = useState(false);
    const [buscaCliente, setBuscaCliente] = useState('');
    const [clientesOptions, setClientesOptions] = useState([]);
    const [creditoSelecionado, setCreditoSelecionado] = useState(null);
    const [parcelas, setParcelas] = useState([]);
    const [parcelaSelecionada, setParcelaSelecionada] = useState(null);
    const [valorPago, setValorPago] = useState(0);
    const [valorParcelaOriginal, setValorParcelaOriginal] = useState(0);
    const [formaPagamento, setFormaPagamento] = useState('DINHEIRO');
    const [referencia, setReferencia] = useState('');
    const [distribuicao, setDistribuicao] = useState([]);
    const [dataPagamento, setDataPagamento] = useState(null);
    const buscaClienteDebounced = useDebounce(buscaCliente, 300);

    // ============================================
    // FUNÇÕES
    // ============================================
    const buscarCreditos = useCallback(async (query) => {
        try {
            setLoading(true);
            console.log('🔍 Iniciando busca por:', query);
            
            let data = [];
            try {
                // Tenta buscar créditos diretamente
                console.log('📡 Tentando buscar créditos...');
                data = await creditoService.buscarCreditosPorCliente(query);
                console.log('✅ Créditos encontrados:', data?.length || 0);
            } catch (e) {
                console.warn('⚠️ Erro ao buscar créditos, tentando buscar clientes...', e.message);
                // Se falhar, tenta buscar clientes
                try {
                    const clientes = await creditoService.buscarClientes(query);
                    console.log('👥 Clientes encontrados:', clientes?.length || 0);
                    
                    if (clientes?.length) {
                        // Para cada cliente, buscar seus créditos
                        const creditosPromises = clientes.map(async (cliente) => {
                            try {
                                const creditosDoCliente = await creditoService.buscarCreditosPorCliente(cliente.codigo || cliente.nome);
                                return creditosDoCliente || [];
                            } catch (err) {
                                console.warn(`Erro ao buscar créditos do cliente ${cliente.nome}:`, err);
                                return [];
                            }
                        });
                        
                        const creditosArrays = await Promise.all(creditosPromises);
                        data = creditosArrays.flat();
                        console.log('✅ Total de créditos encontrados para os clientes:', data.length);
                    }
                } catch (err) {
                    console.error('❌ Erro ao buscar clientes:', err);
                }
            }
            
            if (data?.length) {
                console.log('📋 Formatando opções para autocomplete...');
                setClientesOptions(data.map(credito => ({
                    value: credito.numero || credito.id?.toString(),
                    label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                            <span><strong>{credito.cliente}</strong><br /><small>Crédito: {credito.numero}</small></span>
                            <span style={{ textAlign: 'right' }}><Text type="secondary">Saldo: {formatarMoeda(credito.totalEmDivida || credito.saldo || 0)}</Text><br /><Tag color={credito.ativo !== false ? 'green' : 'red'}>{credito.status || 'ATIVO'}</Tag></span>
                        </div>
                    ),
                    credito: credito
                })));
            } else {
                console.log('⚠️ Nenhum crédito encontrado');
                setClientesOptions([]);
            }
        } catch (error) { 
            console.error('❌ Erro geral ao buscar:', error); 
            setClientesOptions([]); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    const carregarParcelas = useCallback(async (creditoId) => {
        console.log('🔍 carregarParcelas chamado com creditoId:', creditoId);
        if (!creditoId) {
            console.warn('⚠️ creditoId é nulo ou indefinido');
            setParcelas([]);
            return;
        }
        try {
            setLoading(true);
            console.log('📡 Chamando API para listar parcelas do crédito:', creditoId);
            const data = await creditoService.listarParcelas(creditoId);
            console.log('📦 Resposta da API (parcelas):', data);
            
            if (Array.isArray(data)) {
                console.log('✅ Dados é array, tamanho:', data.length);
                setParcelas(data);
            } else if (data && typeof data === 'object') {
                const arr = data.parcelas || data.data || data.list || [];
                console.log('📋 Extraindo array do objeto, tamanho:', arr.length);
                setParcelas(Array.isArray(arr) ? arr : []);
            } else {
                console.warn('⚠️ Formato de dados desconhecido');
                setParcelas([]);
            }
        } catch (error) { 
            console.error('❌ Erro ao carregar parcelas:', error); 
            setParcelas([]); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    const calcularDistribuicao = useCallback((valorPagoTotal, parcelaInicial, todasParcelas) => {
        if (!parcelaInicial || !todasParcelas?.length) { setDistribuicao([]); return; }
        const parcelasPendentes = todasParcelas.filter(p => !p.pago).sort((a, b) => a.numero - b.numero);
        let saldo = valorPagoTotal;
        const dist = [];
        for (let i = 0; i < parcelasPendentes.length && saldo > 0; i++) {
            const p = parcelasPendentes[i];
            const valorDevido = p.valorParcela - (p.valorPago || 0);
            const valorAlocado = Math.min(saldo, valorDevido);
            if (valorAlocado > 0) { dist.push({ parcelaId: p.id, numero: p.numero, vencimento: p.dataVencimento, valorTotal: p.valorParcela, valorPagoAnterior: p.valorPago || 0, valorAlocado, restante: valorDevido - valorAlocado }); saldo -= valorAlocado; }
        }
        setDistribuicao(dist);
    }, []);

    const resetFormPagamento = useCallback(() => {
        setValorPago(0); setValorParcelaOriginal(0); setFormaPagamento('DINHEIRO'); setReferencia(''); setDistribuicao([]); setDataPagamento(null);
    }, []);

    const calcularTroco = () => {
        const td = distribuicao.reduce((s, d) => s + d.valorAlocado, 0);
        return valorPago - td > 0 ? valorPago - td : 0;
    };

    // ============================================
    // VER RECIBO DE PARCELA PAGA
    // ============================================
    const handleVerRecibo = async (parcela) => {
        try {
            setLoading(true);
            console.log('🔍 Buscando recibos da parcela:', parcela.id);
            
            // Buscar histórico de pagamentos da parcela
            const pagamentos = await creditoService.buscarPagamentosParcela(parcela.id);
            
            if (!pagamentos || pagamentos.length === 0) {
                message.warning('Nenhum recibo encontrado para esta parcela');
                return;
            }

            // Se houver múltiplos pagamentos (parciais), mostrar lista para seleção
            if (pagamentos.length > 1) {
                Modal.info({
                    title: `Múltiplos Pagamentos - Parcela #${parcela.numero}`,
                    width: 700,
                    content: (
                        <div>
                            <p>Esta parcela teve {pagamentos.length} pagamento(s):</p>
                            <Table 
                                dataSource={pagamentos} 
                                rowKey="id"
                                size="small"
                                pagination={false}
                                columns={[
                                    { title: 'Data', dataIndex: 'dataPagamento', render: (d) => moment(d).format('DD/MM/YYYY HH:mm') },
                                    { title: 'Valor', dataIndex: 'valorPago', render: (v) => formatarMoeda(v) },
                                    { title: 'Forma', dataIndex: 'formaPagamento' },
                                    { 
                                        title: 'Ação', 
                                        render: (_, pag) => (
                                            <Button 
                                                type="link" 
                                                icon={<FilePdfOutlined />}
                                                onClick={() => {
                                                    Modal.destroyAll();
                                                    onAbrirRecibo(pag);
                                                }}
                                            >
                                                Ver Recibo
                                            </Button>
                                        ) 
                                    }
                                ]}
                            />
                        </div>
                    ),
                    okText: 'Fechar'
                });
            } else {
                // Se só tem um pagamento, abrir diretamente
                onAbrirRecibo(pagamentos[0]);
            }
        } catch (error) {
            console.error('❌ Erro ao buscar recibos:', error);
            message.error('Erro ao carregar recibos da parcela');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // EFFECTS
    // ============================================
    useEffect(() => { 
        if (buscaClienteDebounced?.length >= 2) {
            console.log('🔎 Buscando clientes/créditos:', buscaClienteDebounced);
            buscarCreditos(buscaClienteDebounced); 
        } else {
            setClientesOptions([]); 
        }
    }, [buscaClienteDebounced, buscarCreditos]);
    
    useEffect(() => { 
        console.log('🔄 Efeito de carregar parcelas - creditoSelecionado mudou:', creditoSelecionado);
        if (creditoSelecionado) {
            console.log('   creditoSelecionado.id:', creditoSelecionado.id);
            carregarParcelas(creditoSelecionado.id); 
        } else {
            console.log('   creditoSelecionado é nulo, limpando parcelas');
            setParcelas([]);
        }
    }, [creditoSelecionado, carregarParcelas]);

    // ============================================
    // HANDLERS
    // ============================================
    const handleSelectCredito = (value, option) => { 
        console.log('🎯 handleSelectCredito chamado');
        console.log('   value:', value);
        console.log('   option:', option);
        console.log('   option.credito:', option?.credito);
        
        setCreditoSelecionado(option.credito); 
        setParcelaSelecionada(null); 
        setParcelas([]); 
        resetFormPagamento(); 
    };

    const handleSelectParcela = (parcela) => { if (parcela.pago) { message.warning('Parcela já paga'); return; } setParcelaSelecionada(parcela); const vd = parcela.valorParcela - (parcela.valorPago || 0); setValorParcelaOriginal(vd); setValorPago(vd); setDistribuicao([]); };

    const handleValorPagoChange = (nv) => { setValorPago(nv || 0); if (parcelaSelecionada && nv > 0) calcularDistribuicao(nv, parcelaSelecionada, parcelas); else setDistribuicao([]); };

    // ============================================
    // REGISTRAR PAGAMENTO
    // ============================================
    const handleRegistrarPagamento = async () => {
        if (!creditoSelecionado) { message.warning('Selecione um crédito'); return; }
        if (!valorPago || valorPago <= 0) { message.warning('Informe o valor pago'); return; }
        if (distribuicao.length === 0) { message.warning('Não há parcelas para alocar'); return; }

        try {
            setLoading(true);
            let totalAlocado = 0; const recibos = []; let erros = 0;
            const dataEfetiva = podeAlterarData && dataPagamento ? dataPagamento : moment();

            for (const item of distribuicao) {
                if (item.valorAlocado > 0) {
                    const pagamentoBody = { valorPago: item.valorAlocado, formaPagamento, comprovativo: referencia || null };
                    if (podeAlterarData && dataPagamento) pagamentoBody.dataPagamento = dataPagamento.toISOString();

                    try {
                        await creditoService.registrarPagamento(creditoSelecionado.id, item.parcelaId, pagamentoBody);
                        totalAlocado += item.valorAlocado; recibos.push({ ...item, valor: item.valorAlocado });
                    } catch (err) { erros++; console.error(`Erro parcela #${item.numero}:`, err); }
                }
            }

            if (totalAlocado > 0) {
                message.success(`Pagamento de ${formatarMoeda(totalAlocado)} registrado!`);
                let saldoAtualizado = creditoSelecionado.totalEmDivida || 0;
                try { const ca = await creditoService.buscar(creditoSelecionado.id); if (ca) { saldoAtualizado = ca.totalEmDivida || (ca.valorTotal - ca.totalPago) || 0; setCreditoSelecionado(prev => ({ ...prev, totalPago: ca.totalPago, totalEmDivida: saldoAtualizado })); } } catch (e) { saldoAtualizado = Math.max(0, (creditoSelecionado.valorTotal || 0) - ((creditoSelecionado.totalPago || 0) + totalAlocado)); }

                const nomeOperador = getNomeOperador();
                const entidade = creditoSelecionado.entidade || {};
                const recibo = {
                    numeroRecibo: `${moment().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
                    cliente: creditoSelecionado.cliente || entidade.nome || 'N/A', documento: entidade.numeroDeIdentificao || entidade.nuit || '', nuit: entidade.nuit || '',
                    valorPago, totalAlocado, troco: calcularTroco(), formaPagamento, dataPagamento: dataEfetiva.toDate(),
                    parcelasPagas: recibos, operador: nomeOperador, usuario: nomeOperador, nomeOperador,
                    saldoDevedor: saldoAtualizado, credito: creditoSelecionado.numero, numeroCredito: creditoSelecionado.numero
                };
                onAbrirRecibo(recibo);
                await carregarParcelas(creditoSelecionado.id); resetFormPagamento(); setParcelaSelecionada(null);
            } else message.error('Nenhum pagamento processado');
        } catch (error) { console.error('Erro:', error); message.error('Erro ao registrar pagamento'); } finally { setLoading(false); }
    };

    // ============================================
    // COLUNAS
    // ============================================
    const columnsParcelas = [
        { title: '#', dataIndex: 'numero', width: 50 },
        { title: 'Vencimento', dataIndex: 'dataVencimento', render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-' },
        { title: 'Valor', dataIndex: 'valorParcela', render: (v) => formatarMoeda(v), align: 'right' },
        { title: 'Pago', dataIndex: 'valorPago', render: (v) => formatarMoeda(v || 0), align: 'right' },
        { 
            title: 'Status', 
            render: (_, r) => {
                if (r.pago) {
                    return (
                        <Space size="small">
                            <Tag color="green">Pago</Tag>
                            <Button 
                                type="link" 
                                size="small" 
                                icon={<FilePdfOutlined />} 
                                onClick={() => handleVerRecibo(r)}
                            >
                                Recibo
                            </Button>
                        </Space>
                    );
                }
                return r.emMora ? <Tag color="red">Em Mora</Tag> : <Tag color="blue">Pendente</Tag>;
            } 
        },
        { title: 'Ação', render: (_, r) => <Button type={parcelaSelecionada?.id === r.id ? 'primary' : 'default'} size="small" disabled={r.pago} onClick={() => handleSelectParcela(r)}>{parcelaSelecionada?.id === r.id ? 'Selecionada' : 'Pagar'}</Button> }
    ];

    const columnsDistribuicao = [
        { title: '#', dataIndex: 'numero', width: 50 },
        { title: 'Vencimento', dataIndex: 'vencimento', render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-' },
        { title: 'Valor Total', dataIndex: 'valorTotal', render: (v) => formatarMoeda(v), align: 'right' },
        { title: 'Alocado', dataIndex: 'valorAlocado', render: (v) => <Text strong style={{ color: '#1890ff' }}>{formatarMoeda(v)}</Text>, align: 'right' },
        { title: 'Restante', dataIndex: 'restante', render: (v) => v > 0 ? formatarMoeda(v) : <Tag color="green">Quitado</Tag>, align: 'right' }
    ];

    // ============================================
    // RENDER
    // ============================================
    return (
        <Row gutter={[12, 12]}>
            {/* Busca de Cliente/Crédito */}
            <Col xs={24}>
                <Card size="small" style={{ marginBottom: 0 }}>
                    <AutoComplete 
                        style={{ width: '100%' }} 
                        options={clientesOptions} 
                        onSelect={handleSelectCredito} 
                        onSearch={setBuscaCliente}
                        placeholder="Digite nome do cliente, NUIT ou nº do crédito..." 
                        allowClear 
                        value={buscaCliente}
                    >
                        <Input prefix={<SearchOutlined />} size="large" />
                    </AutoComplete>
                </Card>
            </Col>

            {creditoSelecionado && (
                <>
                    {/* Informações do Crédito - Compacto */}
                    <Col xs={24}>
                        <Card size="small" style={{ marginBottom: 0 }}>
                            <Row gutter={16}>
                                <Col xs={24} sm={12} md={8}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Text strong>👤 {creditoSelecionado.cliente || creditoSelecionado.entidade?.nome || 'N/A'}</Text>
                                        <Tag color={creditoSelecionado.ativo !== false ? 'green' : 'red'}>{creditoSelecionado.status || (creditoSelecionado.ativo ? 'ATIVO' : 'INATIVO')}</Tag>
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>NUIT: {creditoSelecionado.nuit || creditoSelecionado.entidade?.nuit || '-'}</Text>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Text type="secondary">Crédito: </Text>
                                    <Text strong>{creditoSelecionado.numero}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 11 }}>Emissão: {creditoSelecionado.dataEmissao ? moment(creditoSelecionado.dataEmissao).format('DD/MM/YYYY') : '-'}</Text>
                                </Col>
                                <Col xs={24} sm={24} md={8}>
                                    <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 10 }}>Total</Text><br />
                                            <Text strong style={{ fontSize: 14 }}>{formatarMoeda(creditoSelecionado.valorTotal || 0)}</Text>
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 10 }}>Pago</Text><br />
                                            <Text strong style={{ fontSize: 14, color: '#3f8600' }}>{formatarMoeda(creditoSelecionado.totalPago || 0)}</Text>
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 10 }}>Saldo</Text><br />
                                            <Text strong style={{ fontSize: 14, color: '#cf1322' }}>{formatarMoeda(creditoSelecionado.totalEmDivida || 0)}</Text>
                                        </div>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {/* Parcelas e Pagamento lado a lado */}
                    <Col xs={24} md={14}>
                        <Card 
                            title={`Parcelas (${parcelas.filter(p => !p.pago).length} pendentes)`} 
                            size="small"
                            style={{ height: '100%' }}
                        >
                            <Table 
                                columns={columnsParcelas} 
                                dataSource={parcelas} 
                                rowKey="id" 
                                size="small" 
                                loading={loading} 
                                pagination={false} 
                                scroll={{ y: 400 }} 
                                locale={{ emptyText: 'Nenhuma parcela' }} 
                            />
                        </Card>
                    </Col>

                    <Col xs={24} md={10}>
                        <Card title="Registrar Pagamento" size="small" style={{ height: '100%' }}>
                            {parcelaSelecionada ? (
                                <Space style={{ width: '100%', display: 'flex', flexDirection: 'column' }} size="small">
                                    <Alert 
                                        message={`Parcela #${parcelaSelecionada.numero} | Venc: ${moment(parcelaSelecionada.dataVencimento).format('DD/MM/YYYY')}`} 
                                        type="info" 
                                        showIcon 
                                        style={{ fontSize: 12, padding: '4px 8px' }}
                                    />

                                    <div style={{ marginBottom: 8 }}>
                                        <Text strong style={{ fontSize: 12 }}>Valor Devido</Text>
                                        <InputNumber 
                                            style={{ width: '100%' }} 
                                            value={valorParcelaOriginal} 
                                            size="middle" 
                                            readOnly
                                            formatter={v => `MZN ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                                            parser={v => v.replace(/MZN\s?|(,*)/g, '')} 
                                        />
                                    </div>

                                    <div style={{ marginBottom: 8 }}>
                                        <Text strong style={{ fontSize: 12 }}>Valor Pago</Text>
                                        <InputNumber 
                                            style={{ width: '100%' }} 
                                            value={valorPago} 
                                            onChange={handleValorPagoChange} 
                                            size="middle" 
                                            min={0} 
                                            step={0.01}
                                            formatter={v => `MZN ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
                                            parser={v => v.replace(/MZN\s?|(,*)/g, '')} 
                                        />
                                        <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 2 }}>
                                            {valorPago > valorParcelaOriginal ? '✅ Excedente distribuído' : valorPago < valorParcelaOriginal ? '⚠️ Parcial' : '✅ Exato'}
                                        </Text>
                                    </div>

                                    {distribuicao.length > 0 && (
                                        <>
                                            <Divider style={{ margin: '8px 0' }} />
                                            <Text strong style={{ fontSize: 12 }}>Distribuição:</Text>
                                            <Table 
                                                columns={columnsDistribuicao.slice(0, 3)} 
                                                dataSource={distribuicao} 
                                                rowKey="parcelaId" 
                                                size="small" 
                                                pagination={false}
                                                scroll={{ y: 150 }}
                                            />
                                            <div style={{ textAlign: 'right', marginTop: 4 }}>
                                                <Text strong>Total: {formatarMoeda(distribuicao.reduce((s, d) => s + d.valorAlocado, 0))}</Text>
                                                {calcularTroco() > 0 && (
                                                    <Tag color="orange" style={{ marginLeft: 8 }}>Troco: {formatarMoeda(calcularTroco())}</Tag>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Data de Pagamento condicional */}
                                    {podeAlterarData && (
                                        <div style={{ marginBottom: 8 }}>
                                            <Text strong style={{ fontSize: 12 }}><CalendarOutlined /> Data</Text>
                                            <DatePicker
                                                style={{ width: '100%', marginTop: 4 }}
                                                value={dataPagamento}
                                                onChange={setDataPagamento}
                                                format="DD/MM/YYYY"
                                                placeholder="Data (padrão: hoje)"
                                                allowClear
                                                size="small"
                                                disabledDate={(current) => current && current > moment().endOf('day')}
                                            />
                                        </div>
                                    )}

                                    <div style={{ marginBottom: 8 }}>
                                        <Text strong style={{ fontSize: 12 }}>Forma Pagamento</Text>
                                        <Select 
                                            style={{ width: '100%' }} 
                                            value={formaPagamento} 
                                            onChange={setFormaPagamento} 
                                            size="small"
                                        >
                                            {Object.entries(FORMAS_PAGAMENTO).map(([k, v]) => (
                                                <Option key={k} value={k}>{v.icon} {v.label}</Option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div style={{ marginBottom: 8 }}>
                                        <Text strong style={{ fontSize: 12 }}>Referência</Text>
                                        <Input 
                                            value={referencia} 
                                            onChange={(e) => setReferencia(e.target.value)} 
                                            placeholder="Nº comprovativo" 
                                            size="small"
                                        />
                                    </div>

                                    <Button 
                                        type="primary" 
                                        size="middle" 
                                        icon={<CheckCircleOutlined />} 
                                        onClick={handleRegistrarPagamento} 
                                        loading={loading} 
                                        block
                                        disabled={!valorPago || distribuicao.length === 0}
                                    >
                                        Registrar Pagamento
                                    </Button>
                                </Space>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <WalletOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                                    <p style={{ marginTop: 16, fontSize: 12 }}>Selecione uma parcela para pagar</p>
                                </div>
                            )}
                        </Card>
                    </Col>
                </>
            )}

            {!creditoSelecionado && (
                <Col xs={24}>
                    <Card>
                        <div style={{ textAlign: 'center', padding: 60 }}>
                            <SearchOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                            <h3>Busque um cliente para começar</h3>
                        </div>
                    </Card>
                </Col>
            )}
        </Row>
    );
};

export default RegistarPagamento;