// src/pages/RelatoriosPage.jsx
import React, { useState } from 'react';
import { Layout, Menu, Typography, theme } from 'antd';
import {
    DashboardOutlined,
    FileTextOutlined,
    UserOutlined,
    TeamOutlined,
    DollarOutlined,
    WalletOutlined,
    BookOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import DashboardAnalitico from '../components/relatorios/DashboardAnalitico';
import RelatorioCreditosEmitidos from '../components/relatorios/RelatorioCreditosEmitidos';
import RelatorioCreditosPorGestor from '../components/relatorios/RelatorioCreditosPorGestor';
import RelatorioPrestacoes from '../components/relatorios/RelatorioPrestacoes';
import RelatorioPagamentos from '../components/relatorios/RelatorioPagamentos';
import RelatorioSaidas from '../components/relatorios/RelatorioSaidas';
import RelatorioDiarios from '../components/relatorios/RelatorioDiarios';
import RelatorioCreditosEmMora from '../components/relatorios/RelatorioCreditosEmMora';
import RelatorioUsuarios from '../components/relatorios/RelatorioUsuarios';
import RelatorioClientesAtrasados from '../components/relatorios/RelatorioClientesAtrasados';

const { Sider, Content } = Layout;
const { Title } = Typography;
const { useToken } = theme;

const RelatoriosPage = () => {
    const { token } = useToken();
    const [selectedReport, setSelectedReport] = useState('dashboard');

    const menuItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard Analítico' },
        { type: 'divider' },
        { key: 'creditos-emitidos', icon: <FileTextOutlined />, label: 'Créditos Emitidos' },
        { key: 'creditos-gestor', icon: <UserOutlined />, label: 'Créditos por Gestor' },
        { key: 'prestacoes', icon: <ClockCircleOutlined />, label: 'Prestações por Vencimento' },
        { key: 'pagamentos', icon: <DollarOutlined />, label: 'Pagamentos Recebidos' },
        { key: 'saidas', icon: <WalletOutlined />, label: 'Saídas/Gastos' },
        { key: 'diarios', icon: <BookOutlined />, label: 'Diários' },
        { type: 'divider' },
        { key: 'em-mora', icon: <WarningOutlined />, label: 'Créditos em Mora' },
        { key: 'clientes-atrasados', icon: <TeamOutlined />, label: 'Clientes com Atrasos' },
        { type: 'divider' },
        { key: 'usuarios', icon: <UserOutlined />, label: 'Todos os Usuários' },
        { key: 'usuarios-creditos', icon: <CheckCircleOutlined />, label: 'Usuários c/ Créditos' },
    ];

    const renderReport = () => {
        switch (selectedReport) {
            case 'dashboard': return <DashboardAnalitico />;
            case 'creditos-emitidos': return <RelatorioCreditosEmitidos />;
            case 'creditos-gestor': return <RelatorioCreditosPorGestor />;
            case 'prestacoes': return <RelatorioPrestacoes />;
            case 'pagamentos': return <RelatorioPagamentos />;
            case 'saidas': return <RelatorioSaidas />;
            case 'diarios': return <RelatorioDiarios />;
            case 'em-mora': return <RelatorioCreditosEmMora />;
            case 'clientes-atrasados': return <RelatorioClientesAtrasados />;
            case 'usuarios': return <RelatorioUsuarios />;
            case 'usuarios-creditos': return <RelatorioUsuarios />; // Reutiliza com filtro
            default: return <DashboardAnalitico />;
        }
    };

    return (
        <Layout style={{ minHeight: 'calc(100vh - 64px)', background: token.colorBgLayout }}>
            {/* Sidebar */}
            <Sider
                width={250}
                theme="light"
                style={{
                    background: token.colorBgContainer,
                    borderRight: `1px solid ${token.colorBorderSecondary}`,
                    boxShadow: token.boxShadowSecondary
                }}
            >
                <div style={{
                    padding: '16px',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`
                }}>
                    <Title level={4} style={{
                        margin: 0,
                        color: token.colorText,
                        fontWeight: 600
                    }}>📊 Relatórios</Title>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedReport]}
                    items={menuItems}
                    onClick={({ key }) => setSelectedReport(key)}
                    style={{
                        borderRight: 0,
                        background: token.colorBgContainer,
                        color: token.colorText
                    }}
                />
            </Sider>

            {/* Content */}
            <Content style={{
                padding: '24px',
                background: token.colorBgLayout,
                minHeight: 'calc(100vh - 64px)'
            }}>
                <div style={{
                    background: token.colorBgContainer,
                    padding: '24px',
                    borderRadius: token.borderRadiusLG,
                    boxShadow: token.boxShadowSecondary,
                    minHeight: 'calc(100vh - 112px)',
                    color: token.colorText
                }}>
                    {renderReport()}
                </div>
            </Content>
        </Layout>
    );
};

export default RelatoriosPage;