// src/pages/DashboardPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, Typography, Space, Button } from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  SettingOutlined,
  FileTextOutlined,
  BankOutlined,
  ToolOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = localStorage.getItem('timali_user') || 'Admin';

  // Cards do menu principal
  const menuCards = [
    {
      title: 'Entidades',
      description: 'Gerir clientes, fornecedores e funcionários',
      icon: <TeamOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      path: '/entidades',
      color: '#e6f7ff',
      borderColor: '#1890ff',
    },
    {
      title: 'Créditos',
      description: 'Conceder créditos e gerir pagamentos',
      icon: <DollarOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      path: '/creditos',
      color: '#f6ffed',
      borderColor: '#52c41a',
    },
    {
      title: 'Taxas',
      description: 'Configurar taxas e juros',
      icon: <CreditCardOutlined style={{ fontSize: 48, color: '#faad14' }} />,
      path: '/taxas',
      color: '#fffbe6',
      borderColor: '#faad14',
    },
    {
      title: 'Feriados',
      description: 'Gerir feriados nacionais e provinciais',
      icon: <CalendarOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
      path: '/feriados',
      color: '#f9f0ff',
      borderColor: '#722ed1',
    },
    {
      title: 'Def. Crédito',
      description: 'Templates de crédito e prestações',
      icon: <FileTextOutlined style={{ fontSize: 48, color: '#13c2c2' }} />,
      path: '/definicoesCredito',
      color: '#e6fffb',
      borderColor: '#13c2c2',
    },
    {
      title: 'Configurações',
      description: 'Parâmetros gerais do sistema',
      icon: <ToolOutlined style={{ fontSize: 48, color: '#ff7a00' }} />,
      path: '/settings',
      color: '#fff7e6',
      borderColor: '#ff7a00',
    },
  ];

  // Estatísticas rápidas (mock - você pode integrar com API depois)
  const statistics = [
    {
      title: 'Total de Entidades',
      value: 0,
      icon: <TeamOutlined />,
      color: '#1890ff',
    },
    {
      title: 'Créditos Ativos',
      value: 0,
      icon: <BankOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Taxas Configuradas',
      value: 0,
      icon: <CreditCardOutlined />,
      color: '#faad14',
    },
    {
      title: 'Feriados Cadastrados',
      value: 0,
      icon: <CalendarOutlined />,
      color: '#722ed1',
    },
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* Cabeçalho de Boas-vindas */}
      <div style={{
        marginBottom: 32,
        padding: '24px 0',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Title level={2} style={{ margin: 0 }}>
          Bem-vindo, {user}! 👋
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          Sistema de Gestão de Créditos Timali
        </Text>
      </div>

      {/* Cards de Estatísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {statistics.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card hoverable>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={React.cloneElement(stat.icon, { style: { color: stat.color } })}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Menu de Navegação */}
      <Title level={3} style={{ marginBottom: 24 }}>
        Menu Principal
      </Title>

      <Row gutter={[16, 16]}>
        {menuCards.map((card, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card
              hoverable
              style={{
                height: '100%',
                borderLeft: `4px solid ${card.borderColor}`,
                backgroundColor: card.color,
                transition: 'all 0.3s',
              }}
              onClick={() => navigate(card.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.09)';
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                  {card.icon}
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, textAlign: 'center' }}>
                    {card.title}
                  </Title>
                  <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>
                    {card.description}
                  </Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Button type="link" icon={<ArrowRightOutlined />}>
                    Acessar
                  </Button>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Rodapé do Dashboard */}
      <div style={{
        marginTop: 48,
        padding: '24px 0',
        borderTop: '1px solid #f0f0f0',
        textAlign: 'center',
      }}>
        <Text type="secondary">
          Timali v1.0.0 - Sistema de Gestão de Créditos
        </Text>
      </div>
    </div>
  );
};

export default DashboardPage;