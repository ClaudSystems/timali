// src/components/caixa/DiarioHistorico.jsx
import React from 'react';
import { Card, Table, Button, Tag, Typography } from 'antd';
import { HistoryOutlined, EyeOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Text } = Typography;

const formatarMoeda = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', minimumFractionDigits: 2 }).format(v || 0);

const columns = (onVisualizar) => [
    { title: 'Nº Diário', dataIndex: 'numeroDiario', width: 120, render: (t) => <Text strong>{t}</Text> },
    { title: 'Data Ref.', dataIndex: 'dataReferencia', render: (d) => d ? moment(d).format('DD/MM/YYYY') : '-', width: 100, sorter: (a, b) => moment(a.dataReferencia).unix() - moment(b.dataReferencia).unix(), defaultSortOrder: 'descend' },
    { title: 'Estado', dataIndex: 'estado', render: (e) => <Tag color={e === 'fechado' ? 'green' : 'blue'}>{e?.toUpperCase() || 'ABERTO'}</Tag>, width: 90 },
    { title: 'Recebimentos', dataIndex: 'totalRecebimentos', render: (v) => <Text style={{ color: '#3f8600' }}>{formatarMoeda(v)}</Text>, align: 'right', width: 110 },
    { title: 'Saídas', dataIndex: 'totalSaidas', render: (v) => <Text style={{ color: '#cf1322' }}>{formatarMoeda(v)}</Text>, align: 'right', width: 110 },
    { title: 'Saldo', dataIndex: 'saldo', render: (v) => <Text strong style={{ color: v >= 0 ? '#1890ff' : '#cf1322' }}>{formatarMoeda(v)}</Text>, align: 'right', width: 110 },
    { title: 'Fechado por', dataIndex: 'fechadoPor', width: 90 },
    { title: '', width: 50, render: (_, r) => <Button type="link" icon={<EyeOutlined />} onClick={() => onVisualizar(r)} size="small" /> }
];

const DiarioHistorico = ({ diarios, loading, onVisualizar, onFechar }) => (
    <Card title={<span><HistoryOutlined /> Histórico</span>} size="small"
        extra={<Button size="small" onClick={onFechar}>Voltar</Button>}>
        <Table columns={columns(onVisualizar)} dataSource={diarios} rowKey="id" size="small" loading={loading}
            pagination={{ pageSize: 10, showTotal: t => `Total: ${t} diários` }} scroll={{ x: 800 }} />
    </Card>
);

export default DiarioHistorico;