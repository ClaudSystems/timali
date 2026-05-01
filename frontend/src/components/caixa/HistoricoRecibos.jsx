// src/components/caixa/HistoricoRecibos.jsx
import React, { useState } from 'react';
import {
    Card,
    Table,
    Button,
    DatePicker,
    Space,
    Input,
    Typography,
    Tag,
    message,
    Modal
} from 'antd';
import {
    SearchOutlined,
    PrinterOutlined,
    FilePdfOutlined,
    HistoryOutlined
} from '@ant-design/icons';
import moment from 'moment';
import creditoService from '../../services/creditoService';
import ReciboPagamento from './ReciboPagamento';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2
    }).format(valor || 0);
};

const HistoricoRecibos = () => {
    const [loading, setLoading] = useState(false);
    const [pagamentos, setPagamentos] = useState([]);
    const [periodo, setPeriodo] = useState(null);
    const [reciboModal, setReciboModal] = useState(false);
    const [reciboSelecionado, setReciboSelecionado] = useState(null);

    // Buscar pagamentos
    const buscarPagamentos = async (datas) => {
        try {
            setLoading(true);
            let data;

            if (datas && datas.length === 2) {
                const dataInicio = datas[0].format('YYYY-MM-DD');
                const dataFim = datas[1].format('YYYY-MM-DD');
                data = await creditoService.pagamentosPorPeriodo(dataInicio, dataFim);
            } else {
                data = await creditoService.historicoPagamentos({ max: 100 });
            }

            setPagamentos(Array.isArray(data) ? data : []);
        } catch (error) {
            message.error('Erro ao buscar pagamentos');
            setPagamentos([]);
        } finally {
            setLoading(false);
        }
    };

    // Reimprimir recibo
    const handleReimprimir = (pagamento) => {
        const recibo = {
            numeroRecibo: `REC-${moment(pagamento.dataPagamento).format('YYYYMMDD')}-${String(pagamento.id).padStart(4, '0')}`,
            cliente: pagamento.cliente,
            documento: pagamento.documento || pagamento.nuit,
            nuit: pagamento.nuit,
            valorPago: pagamento.valorPago,
            totalAlocado: pagamento.valorPago,
            troco: 0,
            formaPagamento: pagamento.formaPagamento || 'DINHEIRO',
            dataPagamento: pagamento.dataPagamento,
            parcelasPagas: [{
                numero: pagamento.numero,
                valorAlocado: pagamento.valorPago
            }],
            operador: 'Operador',
            nomeOperador: 'Operador',
            saldoDevedor: pagamento.saldoDevedor || 0,
            credito: pagamento.creditoNumero,
            numeroCredito: pagamento.creditoNumero
        };

        setReciboSelecionado(recibo);
        setReciboModal(true);
    };

    const columns = [
        {
            title: 'Data',
            dataIndex: 'dataPagamento',
            key: 'dataPagamento',
            render: (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : '-',
            sorter: (a, b) => moment(a.dataPagamento).unix() - moment(b.dataPagamento).unix()
        },
        {
            title: 'Cliente',
            dataIndex: 'cliente',
            key: 'cliente'
        },
        {
            title: 'Crédito',
            dataIndex: 'creditoNumero',
            key: 'creditoNumero'
        },
        {
            title: 'Parcela',
            dataIndex: 'numero',
            key: 'numero',
            render: (num) => `#${num}`
        },
        {
            title: 'Valor Pago',
            dataIndex: 'valorPago',
            key: 'valorPago',
            render: (valor) => formatarMoeda(valor),
            align: 'right'
        },
        {
            title: 'Forma',
            dataIndex: 'formaPagamento',
            key: 'formaPagamento',
            render: (forma) => <Tag>{forma || 'N/A'}</Tag>
        },
        {
            title: 'Ação',
            key: 'action',
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<PrinterOutlined />}
                    onClick={() => handleReimprimir(record)}
                >
                    Reimprimir
                </Button>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>
                <HistoryOutlined /> Histórico de Recibos
            </Title>

            <Card style={{ marginBottom: 16 }}>
                <Space size="middle">
                    <RangePicker
                        onChange={(datas) => {
                            setPeriodo(datas);
                            buscarPagamentos(datas);
                        }}
                        format="DD/MM/YYYY"
                        placeholder={['Data Início', 'Data Fim']}
                    />
                    <Button
                        type="primary"
                        icon={<SearchOutlined />}
                        onClick={() => buscarPagamentos(periodo)}
                    >
                        Buscar
                    </Button>
                    <Button onClick={() => buscarPagamentos(null)}>
                        Todos (Últimos 100)
                    </Button>
                </Space>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={pagamentos}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 20 }}
                    locale={{ emptyText: 'Nenhum pagamento encontrado' }}
                />
            </Card>

            {/* Modal de Reimpressão */}
            <Modal
                title={null}
                open={reciboModal}
                onCancel={() => setReciboModal(false)}
                footer={null}
                width="100%"
                style={{ maxWidth: 950, top: 10 }}
                destroyOnClose
            >
                {reciboSelecionado && (
                    <ReciboPagamento
                        pagamento={reciboSelecionado}
                        onClose={() => setReciboModal(false)}
                    />
                )}
            </Modal>
        </div>
    );
};

export default HistoricoRecibos;