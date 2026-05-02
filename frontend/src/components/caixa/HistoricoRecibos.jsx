// src/components/caixa/HistoricoRecibos.jsx
import React, { useState, useCallback } from 'react';
import { Card, Row, Col, Table, Button, Select, Input, Typography, Space, Tag, message, DatePicker } from 'antd';
import { SearchOutlined, PrinterOutlined, FilterOutlined, ReloadOutlined, DollarOutlined, BankOutlined, CreditCardOutlined, MobileOutlined } from '@ant-design/icons';
import moment from 'moment';
import creditoService from '../../services/creditoService';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const formatarMoeda = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', minimumFractionDigits: 2 }).format(v || 0);

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
    try { if (!token) return null; const b = token.split('.')[1]; const j = decodeURIComponent(atob(b.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')); return JSON.parse(j); } catch (e) { return null; }
};

const getNomeOperador = () => {
    try {
        const ur = localStorage.getItem('timali_user');
        if (ur && ur !== 'undefined' && ur !== 'null') { try { const u = JSON.parse(ur); if (u && typeof u === 'object') return u.nome || u.name || u.username || 'Operador'; } catch (e) { return ur; } }
        const t = localStorage.getItem('timali_token');
        if (t) { const p = decodeJWT(t); if (p) return p.sub || p.username || p.nome || 'Operador'; }
        return 'Operador';
    } catch (e) { return 'Operador'; }
};

const HistoricoRecibos = ({ onAbrirRecibo }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [periodo, setPeriodo] = useState(null);
    const [cliente, setCliente] = useState('');
    const [credito, setCredito] = useState('');
    const [forma, setForma] = useState(null);
// No HistoricoRecibos.jsx, dentro da função buscar:

const buscar = useCallback(async () => {
    try {
        setLoading(true);
        let d = [];

        if (periodo && periodo.length === 2) {
            const dataInicio = periodo[0].format('YYYY-MM-DD');
            const dataFim = periodo[1].format('YYYY-MM-DD');
            // USAR O NOVO ENDPOINT PARA RECIBOS (por dataPagamento)
            d = await creditoService.recibosPorPeriodo(dataInicio, dataFim);
        } else {
            d = await creditoService.historicoPagamentos({ max: 200 });
        }

        let f = Array.isArray(d) ? d : [];
        if (cliente) f = f.filter(p => (p.cliente || '').toLowerCase().includes(cliente.toLowerCase()));
        if (credito) f = f.filter(p => (p.creditoNumero || '').toLowerCase().includes(credito.toLowerCase()));
        if (forma) f = f.filter(p => p.formaPagamento === forma);

        setData(f);
    } catch (e) {
        message.error('Erro ao buscar');
        setData([]);
    } finally {
        setLoading(false);
    }
}, [periodo, cliente, credito, forma]);

    // Buscar automaticamente quando os filtros mudarem
    React.useEffect(() => {
        buscar();
    }, [buscar]);

    const limparFiltros = () => {
        setPeriodo(null);
        setCliente('');
        setCredito('');
        setForma(null);
    };

    const handleRecibo = (p) => {
        const no = getNomeOperador();
        onAbrirRecibo({
            numeroRecibo: `REC-${moment(p.dataPagamento || p.dataVencimento).format('YYYYMMDD')}-${String(p.id).padStart(4, '0')}`,
            cliente: p.cliente || 'N/A',
            documento: p.documento || p.nuit || '',
            nuit: p.nuit || '',
            valorPago: p.valorPago || p.valorParcela || 0,
            totalAlocado: p.valorPago || p.valorParcela || 0,
            troco: 0,
            formaPagamento: p.formaPagamento || 'DINHEIRO',
            dataPagamento: p.dataPagamento || p.dataVencimento || new Date(),
            parcelasPagas: [{ numero: p.numero || 1, valorAlocado: p.valorPago || p.valorParcela || 0 }],
            operador: no,
            nomeOperador: no,
            saldoDevedor: p.saldoDevedor || 0,
            credito: p.creditoNumero || 'N/A',
            numeroCredito: p.creditoNumero || 'N/A'
        });
    };

    const columns = [
        { title: 'Data Pag.', dataIndex: 'dataPagamento', render: (d) => d ? moment(d).format('DD/MM/YYYY HH:mm') : '-', sorter: (a, b) => moment(a.dataPagamento).unix() - moment(b.dataPagamento).unix(), width: 140 },
        { title: 'Vencimento', dataIndex: 'dataVencimento', render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-', width: 100 },
        { title: 'Cliente', dataIndex: 'cliente', ellipsis: true },
        { title: 'Crédito', dataIndex: 'creditoNumero', width: 100 },
        { title: 'Parcela', dataIndex: 'numero', render: (n) => <Tag>#{n}</Tag>, width: 60 },
        { title: 'Valor', dataIndex: 'valorPago', render: (v, r) => formatarMoeda(v || r.valorParcela), align: 'right', width: 120 },
        { title: 'Forma', dataIndex: 'formaPagamento', render: (f) => <Tag color={FORMAS_PAGAMENTO[f]?.color}>{FORMAS_PAGAMENTO[f]?.label || f}</Tag>, width: 130 },
        { title: 'Comp.', dataIndex: 'comprovativo', render: (c) => c || '-', width: 80 },
        { title: 'Ação', fixed: 'right', width: 100, render: (_, r) => <Button type="primary" size="small" icon={<PrinterOutlined />} onClick={() => handleRecibo(r)}>Recibo</Button> }
    ];

    return (
        <div>
            <Title level={4} style={{ marginTop: 0 }}>Histórico de Recibos</Title>

            <Card size="small" style={{ marginBottom: 16 }}>
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} sm={12} md={6}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Período</Text>
                        <RangePicker
                            value={periodo}
                            onChange={setPeriodo}
                            format="DD/MM/YYYY"
                            style={{ width: '100%' }}
                            allowClear
                            placeholder={['Início', 'Fim']}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Cliente</Text>
                        <Input prefix={<SearchOutlined />} value={cliente} onChange={e => setCliente(e.target.value)} allowClear placeholder="Nome do cliente" />
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Crédito Nº</Text>
                        <Input value={credito} onChange={e => setCredito(e.target.value)} allowClear placeholder="Nº crédito" />
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Forma Pag.</Text>
                        <Select value={forma} onChange={setForma} allowClear style={{ width: '100%' }} placeholder="Todas">
                            {Object.entries(FORMAS_PAGAMENTO).map(([k, v]) => <Option key={k} value={k}>{v.label}</Option>)}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>&nbsp;</Text>
                        <Space>
                            <Button type="primary" icon={<FilterOutlined />} onClick={buscar}>Filtrar</Button>
                            <Button icon={<ReloadOutlined />} onClick={limparFiltros}>Limpar</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card>
                <div style={{ marginBottom: 12 }}>
                    <Text type="secondary">{data.length} registo(s) encontrado(s)</Text>
                </div>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    size="small"
                    loading={loading}
                    pagination={{ pageSize: 20, showTotal: t => `Total: ${t} registos` }}
                    scroll={{ x: 1100 }}
                    locale={{ emptyText: 'Selecione um período e clique em Filtrar' }}
                />
            </Card>
        </div>
    );
};

export default HistoricoRecibos;