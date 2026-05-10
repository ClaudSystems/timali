// src/components/caixa/DiarioResumo.jsx
import React from 'react';
import { Card, Row, Col, Tag, Descriptions, Typography, Statistic } from 'antd';
import moment from 'moment';

const { Text } = Typography;

const formatarMoeda = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN', minimumFractionDigits: 2 }).format(v || 0);

const DiarioResumo = ({ diario }) => {
    const totais = diario?.totais || {};

    return (
        <>
            <Card size="small" style={{ marginBottom: 16 }}>
                <Descriptions size="small" column={{ xs: 1, sm: 2, md: 4 }}>
                    <Descriptions.Item label="Diário Nº"><Text strong style={{ fontSize: 16 }}>{diario.numeroDiario}</Text></Descriptions.Item>
                    <Descriptions.Item label="Estado"><Tag color={diario.fechado ? 'green' : 'blue'}>{diario.fechado ? 'FECHADO' : 'ABERTO'}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Data Ref."><Text strong>{moment(diario.dataReferencia).format('DD/MM/YYYY')}</Text></Descriptions.Item>
                    <Descriptions.Item label="Gerado em">{diario.dateCreated ? moment(diario.dateCreated).format('DD/MM/YYYY HH:mm') : '-'}</Descriptions.Item>
                    {diario.fechado && (
                        <>
                            <Descriptions.Item label="Fechado em">{moment(diario.dateClosed).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                            {diario.fechadoPor && <Descriptions.Item label="Fechado por">{diario.fechadoPor}</Descriptions.Item>}
                        </>
                    )}
                </Descriptions>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}><Card size="small"><Statistic title="Recebimentos" value={totais.totalRecebimentos || 0} formatter={v => formatarMoeda(v)} valueStyle={{ color: '#3f8600' }} /></Card></Col>
                <Col xs={12} sm={6}><Card size="small"><Statistic title="Saídas" value={totais.totalSaidas || 0} formatter={v => formatarMoeda(v)} valueStyle={{ color: '#cf1322' }} /></Card></Col>
                <Col xs={12} sm={6}><Card size="small"><Statistic title="Saldo" value={totais.saldo || 0} formatter={v => formatarMoeda(v)} valueStyle={{ color: (totais.saldo || 0) >= 0 ? '#1890ff' : '#cf1322' }} /></Card></Col>
                <Col xs={12} sm={6}><Card size="small"><Statistic title="Fecho" value={totais.saldo || 0} formatter={v => formatarMoeda(v)} valueStyle={{ color: '#722ed1' }} /></Card></Col>
            </Row>
        </>
    );
};

export default DiarioResumo;