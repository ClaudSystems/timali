// src/components/relatorios/DashboardAnalitico.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Alert, Typography, Spin, Tag, Space, theme } from 'antd';
import {
    DollarOutlined,
    RiseOutlined,
    FallOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import relatorioService from '../../services/relatorioService';
import moment from 'moment';

const { Title, Text } = Typography;

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2
    }).format(valor || 0);
};

const DashboardAnalitico = () => {
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Obter o token do tema atual
    const { token } = theme.useToken();

    useEffect(() => {
        carregarDashboard();

        // Atualizar a cada 30 segundos para dados em tempo real
        const interval = setInterval(carregarDashboard, 30000);

        return () => clearInterval(interval);
    }, []);

    const carregarDashboard = async () => {
        try {
            setLoading(true);
            const data = await relatorioService.dashboardAnalitico();
            setDados(data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!dados) {
        return (
            <div style={{
                textAlign: 'center',
                padding: 60,
                color: token.colorText // Adapta ao tema
            }}>
                <Spin size="large" tip="Carregando dashboard..." />
            </div>
        );
    }

    const { creditos, financeiro, esteMes, alertas } = dados;

    // Cores baseadas nos valores
    const corLucro = esteMes.lucro >= 0 ? '#52c41a' : '#ff4d4f';
    const corInadimplencia = creditos.taxaInadimplencia > 20 ? '#ff4d4f' :
                             creditos.taxaInadimplencia > 10 ? '#faad14' : '#52c41a';
    const corRecuperacao = financeiro.taxaRecuperacao >= 80 ? '#52c41a' :
                           financeiro.taxaRecuperacao >= 60 ? '#faad14' : '#ff4d4f';

    return (
        <div style={{ color: token.colorText }}>
            <div style={{
                marginBottom: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: token.colorText
            }}>
                <Title level={3} style={{ margin: 0, color: token.colorText }}>
                    📊 Dashboard Analítico
                </Title>
                <Space>
                    <Text style={{ color: token.colorTextSecondary }}>
                        Última atualização: {moment(lastUpdate).format('HH:mm:ss')}
                    </Text>
                    <Tag color="blue">Tempo Real</Tag>
                </Space>
            </div>

            {/* Alertas */}
            {(alertas.creditosEmMora > 0 || alertas.inadimplenciaAlta || alertas.lucroNegativo) && (
                <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
                    {alertas.creditosEmMora > 0 && (
                        <Alert
                            message={`⚠️ ${alertas.creditosEmMora} crédito(s) em mora`}
                            description="Existem créditos com pagamentos em atraso. Verifique o relatório de mora."
                            type="warning"
                            showIcon
                        />
                    )}
                    {alertas.inadimplenciaAlta && (
                        <Alert
                            message="Taxa de inadimplência alta"
                            description={`A taxa de inadimplência está em ${creditos.taxaInadimplencia}%, acima do limite recomendado de 20%.`}
                            type="error"
                            showIcon
                        />
                    )}
                    {alertas.lucroNegativo && (
                        <Alert
                            message="Lucro negativo este mês"
                            description={`As saídas estão maiores que as entradas. Lucro: ${formatarMoeda(esteMes.lucro)}`}
                            type="error"
                            showIcon
                        />
                    )}
                </Space>
            )}

            {/* Cards Principais - Visão Geral */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ backgroundColor: token.colorBgContainer }}>
                        <Statistic
                            title="Créditos Ativos"
                            value={creditos.ativos}
                            prefix={<CheckCircleOutlined />}
                            suffix={
                                <Tag color="red" style={{ marginLeft: 8 }}>
                                    {creditos.emMora} em mora
                                </Tag>
                            }
                            valueStyle={{ color: token.colorText }}
                            titleStyle={{ color: token.colorTextSecondary }}
                        />
                        <Progress
                            percent={100 - creditos.taxaInadimplencia}
                            size="small"
                            strokeColor={corInadimplencia}
                            format={() => `Adimplência: ${(100 - creditos.taxaInadimplencia).toFixed(1)}%`}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ backgroundColor: token.colorBgContainer }}>
                        <Statistic
                            title="Total Concedido"
                            value={financeiro.valorTotalConcedido}
                            precision={2}
                            prefix="MTn"
                            valueStyle={{ color: '#1890ff' }}
                            titleStyle={{ color: token.colorTextSecondary }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ backgroundColor: token.colorBgContainer }}>
                        <Statistic
                            title="Total Recebido"
                            value={financeiro.valorTotalPago}
                            precision={2}
                            prefix="MTn"
                            valueStyle={{ color: '#52c41a' }}
                            titleStyle={{ color: token.colorTextSecondary }}
                        />
                        <Progress
                            percent={financeiro.taxaRecuperacao}
                            size="small"
                            strokeColor={corRecuperacao}
                            format={() => `Recuperação: ${financeiro.taxaRecuperacao}%`}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ backgroundColor: token.colorBgContainer }}>
                        <Statistic
                            title="Saldo Devedor"
                            value={financeiro.saldoDevedor}
                            precision={2}
                            prefix="MTn"
                            valueStyle={{ color: '#ff4d4f' }}
                            titleStyle={{ color: token.colorTextSecondary }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Performance Este Mês */}
            <Title level={4} style={{ marginBottom: 16, color: token.colorText }}>
                📈 Performance Este Mês
            </Title>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ backgroundColor: token.colorBgContainer }}>
                        <Statistic
                            title="Créditos Emitidos"
                            value={esteMes.creditosEmitidos}
                            suffix="novos"
                            valueStyle={{ color: token.colorText }}
                            titleStyle={{ color: token.colorTextSecondary }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ backgroundColor: token.colorBgContainer }}>
                        <Statistic
                            title="Valor Concedido"
                            value={esteMes.valorConcedido}
                            precision={2}
                            prefix="MTn"
                            valueStyle={{ color: token.colorText }}
                            titleStyle={{ color: token.colorTextSecondary }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ backgroundColor: token.colorBgContainer }}>
                        <Statistic
                            title="Valor Recebido"
                            value={esteMes.valorRecebido}
                            precision={2}
                            prefix="MTn"
                            valueStyle={{ color: '#52c41a' }}
                            titleStyle={{ color: token.colorTextSecondary }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ backgroundColor: token.colorBgContainer }}>
                        <Statistic
                            title="Valor Gasto"
                            value={esteMes.valorGasto}
                            precision={2}
                            prefix="MTn"
                            valueStyle={{ color: '#ff4d4f' }}
                            titleStyle={{ color: token.colorTextSecondary }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Lucro/Prejuízo */}
            <Card style={{
                marginBottom: 24,
                backgroundColor: token.colorBgContainer
            }}>
                <Row align="middle" justify="space-between">
                    <Col>
                        <Title level={4} style={{ margin: 0, color: token.colorText }}>
                            {esteMes.lucro >= 0 ? '💰 Lucro' : '📉 Prejuízo'} Este Mês
                        </Title>
                        <Text style={{ color: token.colorTextSecondary }}>
                            Receitas - Despesas
                        </Text>
                    </Col>
                    <Col>
                        <Statistic
                            value={esteMes.lucro}
                            precision={2}
                            prefix={esteMes.lucro >= 0 ? <RiseOutlined /> : <FallOutlined />}
                            suffix="MTn"
                            valueStyle={{
                                color: corLucro,
                                fontSize: 32,
                                fontWeight: 'bold'
                            }}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Indicadores de Saúde */}
            <Title level={4} style={{ marginBottom: 16, color: token.colorText }}>
                🏥 Indicadores de Saúde Financeira
            </Title>
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card
                        title="Taxa de Inadimplência"
                        style={{ backgroundColor: token.colorBgContainer }}
                    >
                        <Progress
                            type="dashboard"
                            percent={creditos.taxaInadimplencia}
                            strokeColor={corInadimplencia}
                            format={(percent) => `${percent.toFixed(1)}%`}
                        />
                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                            <Text style={{ color: token.colorTextSecondary }}>
                                {creditos.emMora} de {creditos.ativos} créditos em mora
                            </Text>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        title="Taxa de Recuperação"
                        style={{ backgroundColor: token.colorBgContainer }}
                    >
                        <Progress
                            type="dashboard"
                            percent={financeiro.taxaRecuperacao}
                            strokeColor={corRecuperacao}
                            format={(percent) => `${percent.toFixed(1)}%`}
                        />
                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                            <Text style={{ color: token.colorTextSecondary }}>
                                {formatarMoeda(financeiro.valorTotalPago)} recebido de {formatarMoeda(financeiro.valorTotalAPagar)}
                            </Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardAnalitico;