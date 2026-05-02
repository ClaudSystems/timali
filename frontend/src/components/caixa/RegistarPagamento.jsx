// src/components/caixa/RegistarPagamento.jsx
import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    Card, Row, Col, AutoComplete, Input, Table, Button, Select,
    InputNumber, Typography, Divider, Space, Tag, Statistic, message, Alert, Descriptions, DatePicker
} from 'antd';
import {
    SearchOutlined, DollarOutlined, CheckCircleOutlined,
    WalletOutlined, BankOutlined, CreditCardOutlined, MobileOutlined, CalendarOutlined
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
            let data = [];
            try { data = await creditoService.buscarCreditosPorCliente(query); } catch (e) {
                const clientes = await creditoService.buscarClientes(query);
                if (clientes?.length) data = clientes.map(c => ({ id: c.id, numero: c.codigo, cliente: c.nome, saldo: 0, status: 'CLIENTE' }));
            }
            if (data?.length) {
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
            } else setClientesOptions([]);
        } catch (error) { console.error('Erro ao buscar:', error); setClientesOptions([]); } finally { setLoading(false); }
    }, []);

    const carregarParcelas = useCallback(async (creditoId) => {
        try {
            setLoading(true);
            const data = await creditoService.listarParcelas(creditoId);
            if (Array.isArray(data)) setParcelas(data);
            else if (data && typeof data === 'object') { const arr = data.parcelas || data.data || data.list || []; setParcelas(Array.isArray(arr) ? arr : []); }
            else setParcelas([]);
        } catch (error) { console.error('Erro ao carregar parcelas:', error); setParcelas([]); } finally { setLoading(false); }
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
    // EFFECTS
    // ============================================
    useEffect(() => { if (buscaClienteDebounced?.length >= 2) buscarCreditos(buscaClienteDebounced); else setClientesOptions([]); }, [buscaClienteDebounced, buscarCreditos]);
    useEffect(() => { if (creditoSelecionado) carregarParcelas(creditoSelecionado.id); }, [creditoSelecionado, carregarParcelas]);

    // ============================================
    // HANDLERS
    // ============================================
    const handleSelectCredito = (value, option) => { setCreditoSelecionado(option.credito); setParcelaSelecionada(null); setParcelas([]); resetFormPagamento(); };

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
        { title: 'Status', render: (_, r) => r.pago ? <Tag color="green">Pago</Tag> : r.emMora ? <Tag color="red">Em Mora</Tag> : <Tag color="blue">Pendente</Tag> },
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
        <Row gutter={[16, 16]}>
            <Col xs={24}>
                <Card title="Buscar Cliente/Crédito" size="small">
                    <AutoComplete style={{ width: '100%' }} options={clientesOptions} onSelect={handleSelectCredito} onSearch={setBuscaCliente}
                        placeholder="Digite o nome do cliente, NUIT ou número do crédito..." allowClear value={buscaCliente}>
                        <Input prefix={<SearchOutlined />} size="large" />
                    </AutoComplete>
                </Card>
            </Col>
            {creditoSelecionado && (
                <>
                    <Col xs={24}>
                        <Card title="Crédito Selecionado" size="small" extra={<Tag color={creditoSelecionado.ativo !== false ? 'green' : 'red'}>{creditoSelecionado.status || (creditoSelecionado.ativo ? 'ATIVO' : 'INATIVO')}</Tag>}>
                            <Descriptions size="small" column={{ xs: 1, sm: 2, md: 4 }}>
                                <Descriptions.Item label="Cliente">{creditoSelecionado.cliente || creditoSelecionado.entidade?.nome || 'N/A'}</Descriptions.Item>
                                <Descriptions.Item label="NUIT">{creditoSelecionado.nuit || creditoSelecionado.entidade?.nuit || '-'}</Descriptions.Item>
                                <Descriptions.Item label="Crédito">{creditoSelecionado.numero}</Descriptions.Item>
                                <Descriptions.Item label="Data Emissão">{creditoSelecionado.dataEmissao ? moment(creditoSelecionado.dataEmissao).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
                            </Descriptions>
                            <Row gutter={16} style={{ marginTop: 16 }}>
                                <Col xs={24} sm={8}><Statistic title="Valor Total" value={creditoSelecionado.valorTotal || 0} formatter={(v) => formatarMoeda(v)} /></Col>
                                <Col xs={24} sm={8}><Statistic title="Total Pago" value={creditoSelecionado.totalPago || 0} formatter={(v) => formatarMoeda(v)} valueStyle={{ color: '#3f8600' }} /></Col>
                                <Col xs={24} sm={8}><Statistic title="Saldo Devedor" value={creditoSelecionado.totalEmDivida || 0} formatter={(v) => formatarMoeda(v)} valueStyle={{ color: '#cf1322' }} /></Col>
                            </Row>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card title="Parcelas" size="small" extra={<Text type="secondary">{parcelas.filter(p => !p.pago).length} pendentes</Text>}>
                            <Table columns={columnsParcelas} dataSource={parcelas} rowKey="id" size="small" loading={loading} pagination={false} scroll={{ y: 300 }} locale={{ emptyText: 'Nenhuma parcela' }} />
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card title="Registrar Pagamento" size="small">
                            {parcelaSelecionada ? (
                                <Space style={{ width: '100%', display: 'flex', flexDirection: 'column' }} size="middle">
                                    <Alert message={`Parcela #${parcelaSelecionada.numero} - Vencimento: ${moment(parcelaSelecionada.dataVencimento).format('DD/MM/YYYY')}`} type="info" showIcon />

                                    <div><Text strong>Valor Devido</Text>
                                        <InputNumber style={{ width: '100%' }} value={valorParcelaOriginal} size="large" readOnly
                                            formatter={v => `MZN ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/MZN\s?|(,*)/g, '')} />
                                    </div>

                                    <div><Text strong>Valor Pago</Text>
                                        <InputNumber style={{ width: '100%' }} value={valorPago} onChange={handleValorPagoChange} size="large" min={0} step={0.01}
                                            formatter={v => `MZN ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/MZN\s?|(,*)/g, '')} />
                                        <Text type="secondary" style={{ fontSize: 12 }}>{valorPago > valorParcelaOriginal ? '✅ Excedente distribuído' : valorPago < valorParcelaOriginal ? '⚠️ Pagamento parcial' : '✅ Valor exato'}</Text>
                                    </div>

                                    {distribuicao.length > 0 && (
                                        <>
                                            <Divider titlePlacement="left"  style={{ borderColor: '#1890ff' }}>Distribuição</Divider>
                                            <Table columns={columnsDistribuicao} dataSource={distribuicao} rowKey="parcelaId" size="small" pagination={false}
                                                summary={() => (
                                                    <Table.Summary><Table.Summary.Row>
                                                        <Table.Summary.Cell colSpan={3}><Text strong>Total</Text></Table.Summary.Cell>
                                                        <Table.Summary.Cell align="right"><Text strong style={{ color: '#1890ff' }}>{formatarMoeda(distribuicao.reduce((s, d) => s + d.valorAlocado, 0))}</Text></Table.Summary.Cell>
                                                        <Table.Summary.Cell align="right">{calcularTroco() > 0 ? <Tag color="orange">Troco: {formatarMoeda(calcularTroco())}</Tag> : <Tag color="green">Sem troco</Tag>}</Table.Summary.Cell>
                                                    </Table.Summary.Row></Table.Summary>
                                                )} />
                                        </>
                                    )}

                                    {/* NOVO: Data de Pagamento condicional */}
                                    {podeAlterarData && (
                                        <div>
                                            <Text strong><CalendarOutlined /> Data do Pagamento</Text>
                                            <DatePicker
                                                style={{ width: '100%', marginTop: 4 }}
                                                value={dataPagamento}
                                                onChange={setDataPagamento}
                                                format="DD/MM/YYYY"
                                                placeholder="Selecione a data (padrão: hoje)"
                                                allowClear
                                                disabledDate={(current) => current && current > moment().endOf('day')}
                                            />
                                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                                                {dataPagamento ? `✅ Pagamento registado em: ${dataPagamento.format('DD/MM/YYYY')}` : 'ℹ️ Se não selecionar, será usada a data de hoje'}
                                            </Text>
                                        </div>
                                    )}

                                    <div><Text strong>Forma de Pagamento</Text>
                                        <Select style={{ width: '100%' }} value={formaPagamento} onChange={setFormaPagamento} size="large">
                                            {Object.entries(FORMAS_PAGAMENTO).map(([k, v]) => <Option key={k} value={k}>{v.icon} {v.label}</Option>)}
                                        </Select>
                                    </div>

                                    <div><Text strong>Referência</Text><Input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Nº comprovativo" /></div>

                                    <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleRegistrarPagamento} loading={loading} block
                                        style={{ height: 50, fontSize: 16 }} disabled={!valorPago || distribuicao.length === 0}>
                                        Registrar Pagamento
                                    </Button>
                                </Space>
                            ) : (
                                <div style={{ textAlign: 'center', padding: 40 }}><WalletOutlined style={{ fontSize: 48, color: '#d9d9d9' }} /><p style={{ marginTop: 16 }}>Selecione uma parcela</p></div>
                            )}
                        </Card>
                    </Col>
                </>
            )}
            {!creditoSelecionado && (
                <Col xs={24}><Card><div style={{ textAlign: 'center', padding: 60 }}><SearchOutlined style={{ fontSize: 64, color: '#d9d9d9' }} /><h3>Busque um cliente para começar</h3></div></Card></Col>
            )}
        </Row>
    );
};

export default RegistarPagamento;