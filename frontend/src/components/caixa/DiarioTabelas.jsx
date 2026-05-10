// src/components/caixa/DiarioTabelas.jsx
import React from 'react';
import { Card, Table, Tag, Typography, Descriptions,Row, Col } from 'antd';
import { WalletOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;

const formatarMoeda = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', minimumFractionDigits: 2 }).format(v || 0);

const columnsRecebimentos = [
    { title: 'Recibo Nº', dataIndex: 'numeroRecibo', width: 100 },
    { title: 'Cliente', dataIndex: 'nomeCliente', ellipsis: true },
    { title: 'Descrição', dataIndex: 'descricao', ellipsis: true },
    { title: 'Data Pag.', dataIndex: 'dataPagamento', render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-', width: 100 },
    { title: 'Forma Pag.', dataIndex: 'formaPagamento', render: (f) => <Tag>{f}</Tag>, width: 100 },
    { title: 'Valor Pago', dataIndex: 'valorPago', render: (v) => formatarMoeda(v), align: 'right', width: 110 },
];

const columnsSaidas = [
    { title: 'Data', dataIndex: 'dateCreated', render: (d) => d ? moment(d).format('DD/MM HH:mm') : '-', width: 100 },
    { title: 'Descrição', dataIndex: 'descricao', ellipsis: true },
    { title: 'Tipo', dataIndex: 'destino', render: (d) => <Tag color="orange">{d}</Tag>, width: 100 },
    { title: 'Valor', dataIndex: 'valor', render: (v) => formatarMoeda(v), align: 'right', width: 100 },
];

const DiarioTabelas = ({ diario }) => {
    const totais = diario?.totais || {};

    return (
        <>
            <Card title={<span><WalletOutlined /> Recebimentos</span>} size="small" style={{ marginBottom: 16 }}
                extra={<Text strong style={{ color: '#3f8600' }}>Total: {formatarMoeda(totais.totalRecebimentos || 0)}</Text>}>
                <Table columns={columnsRecebimentos} dataSource={diario.recebimentos || []} rowKey="id" size="small" pagination={false} scroll={{ x: 700 }} locale={{ emptyText: 'Nenhum recebimento' }} />
            </Card>

            {diario.saidasAtivas?.length > 0 && (
                <Card title="Saídas Ativas" size="small" style={{ marginBottom: 16 }}
                    extra={<Text strong style={{ color: '#cf1322' }}>Total: {formatarMoeda(totais.totalSaidasAtivas || 0)}</Text>}>
                    <Table columns={columnsSaidas} dataSource={diario.saidasAtivas} rowKey="id" size="small" pagination={false} scroll={{ x: 500 }} />
                </Card>
            )}
            {diario.saidasPassivas?.length > 0 && (
                <Card title="Saídas Passivas" size="small" style={{ marginBottom: 16 }}
                    extra={<Text strong style={{ color: '#cf1322' }}>Total: {formatarMoeda(totais.totalSaidasPassivas || 0)}</Text>}>
                    <Table columns={columnsSaidas} dataSource={diario.saidasPassivas} rowKey="id" size="small" pagination={false} scroll={{ x: 500 }} />
                </Card>
            )}

            {diario.notas && <Card title="Notas" size="small" style={{ marginBottom: 16 }}><Text>{diario.notas}</Text></Card>}

            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
                <Title level={5} style={{ marginTop: 0 }}>Resumo Final</Title>
                <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Total Recebimentos"><Text strong style={{ color: '#3f8600', fontSize: 16 }}>{formatarMoeda(totais.totalRecebimentos || 0)}</Text></Descriptions.Item>
                    <Descriptions.Item label="Total Saídas"><Text strong style={{ color: '#cf1322', fontSize: 16 }}>{formatarMoeda(totais.totalSaidas || 0)}</Text></Descriptions.Item>
                    <Descriptions.Item label="Saldo em Caixa"><Text strong style={{ color: (totais.saldo || 0) >= 0 ? '#1890ff' : '#cf1322', fontSize: 18 }}>{formatarMoeda(totais.saldo || 0)}</Text></Descriptions.Item>
                </Descriptions>
            </Card>

            {diario.fechado && (
                <Card title="Validações" size="small">
                    <Row gutter={16}>
                        <Col span={12}><Text strong>Responsável da CAIXA</Text><div style={{ borderBottom: '1px solid #000', height: 40, marginTop: 40 }}></div><Text type="secondary" style={{ fontSize: 12 }}>{diario.fechadoPor || ''}</Text></Col>
                        <Col span={12}><Text strong>GERENTE</Text><div style={{ borderBottom: '1px solid #000', height: 40, marginTop: 40 }}></div></Col>
                    </Row>
                </Card>
            )}
        </>
    );
};

export default DiarioTabelas;