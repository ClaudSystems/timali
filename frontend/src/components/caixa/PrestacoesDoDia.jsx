// src/components/caixa/PrestacoesDoDia.jsx
import React, { useState, useCallback } from 'react';
import { Card, Row, Col, Table, Button, Typography, Space, Tag, message, DatePicker, Statistic } from 'antd';
import {
    CalendarOutlined, ReloadOutlined, DollarOutlined,
    BankOutlined, CreditCardOutlined, MobileOutlined, FilePdfOutlined
} from '@ant-design/icons';
import moment from 'moment';
import creditoService from '../../services/creditoService';
import RelatorioPagamentosPDF from './RelatorioPagamentosPDF';

const { Title, Text } = Typography;
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

const PrestacoesDoDia = ({ onAbrirRecibo }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    // CORRIGIDO: Usar null como padrão para evitar datas malucas
    const [periodo, setPeriodo] = useState(null);
    const [totais, setTotais] = useState({ quantidade: 0, valorTotal: 0 });

    const buscar = useCallback(async () => {
        if (!periodo || periodo.length !== 2) {
            message.warning('Selecione um período');
            return;
        }
        try {
            setLoading(true);
            const dataInicio = periodo[0].format('YYYY-MM-DD');
            const dataFim = periodo[1].format('YYYY-MM-DD');

            const d = await creditoService.pagamentosPorPeriodo(dataInicio, dataFim);
            const arr = Array.isArray(d) ? d : [];
            setData(arr);
            setTotais({
                quantidade: arr.length,
                valorTotal: arr.reduce((s, p) => s + (p.valorPago || p.valorParcela || 0), 0)
            });
        } catch (e) {
            console.error('Erro ao buscar:', e);
            message.error('Erro ao buscar pagamentos');
            setData([]);
            setTotais({ quantidade: 0, valorTotal: 0 });
        } finally {
            setLoading(false);
        }
    }, [periodo]);

    // NÃO buscar automaticamente - só quando clicar em "Buscar"
    // Removido o useEffect que buscava automaticamente

    const handleHoje = () => {
        const hoje = moment();
        setPeriodo([hoje.clone().startOf('day'), hoje.clone().endOf('day')]);
    };

    const columns = [
        { title: 'Data Venc..', dataIndex: 'dataVencimento', render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-', width: 140 },
        { title: 'Cliente', dataIndex: 'cliente', ellipsis: true },
        { title: 'Crédito', dataIndex: 'creditoNumero', width: 100 },
        { title: 'Parcela', dataIndex: 'numero', render: (n) => <Tag>#{n}</Tag>, width: 60 },
        { title: 'Valor Pago', dataIndex: 'valorPago', render: (v, r) => formatarMoeda(v || r.valorParcela), align: 'right', width: 120 },
        { title: 'Forma', dataIndex: 'formaPagamento', render: (f) => <Tag color={FORMAS_PAGAMENTO[f]?.color}>{FORMAS_PAGAMENTO[f]?.label || f}</Tag>, width: 130 },
    ];

    const periodoValido = periodo && periodo.length === 2;

    return (
        <div>
            <Title level={4} style={{ marginTop: 0 }}><CalendarOutlined /> Prestações do Período</Title>

            <Card size="small" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={8}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>Período</Text>
                        <RangePicker
                            value={periodo}
                            onChange={(dates) => {
                                console.log('Datas selecionadas:', dates);
                                setPeriodo(dates);
                            }}
                            format="DD/MM/YYYY"
                            style={{ width: '100%' }}
                            allowClear
                            placeholder={['Data Início', 'Data Fim']}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Text strong style={{ display: 'block', marginBottom: 4 }}>&nbsp;</Text>
                        <Space>
                            <Button
                                type="primary"
                                icon={<CalendarOutlined />}
                                onClick={buscar}
                                disabled={!periodoValido}
                            >
                                Buscar
                            </Button>
                            <Button icon={<ReloadOutlined />} onClick={handleHoje}>Hoje</Button>
                            {periodoValido && (
                                <RelatorioPagamentosPDF
                                    dataInicio={periodo[0].format('YYYY-MM-DD')}
                                    dataFim={periodo[1].format('YYYY-MM-DD')}
                                >
                                    <Button icon={<FilePdfOutlined />} size="small">PDF</Button>
                                </RelatorioPagamentosPDF>
                            )}
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}><Card size="small"><Statistic title="Total Prestações" value={totais.quantidade} suffix="pagamentos" /></Card></Col>
                <Col xs={12} sm={6}><Card size="small"><Statistic title="Valor Total" value={totais.valorTotal} formatter={(v) => formatarMoeda(v)} /></Card></Col>
            </Row>

            <Card>
                <Table columns={columns} dataSource={data} rowKey="id" size="small" loading={loading}
                    pagination={{ pageSize: 20, showTotal: t => `Total: ${t} registos` }}
                    scroll={{ x: 700 }} locale={{ emptyText: 'Selecione um período e clique em Buscar' }} />
            </Card>
        </div>
    );
};

export default PrestacoesDoDia;