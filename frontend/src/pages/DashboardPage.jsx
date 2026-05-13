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
  CalculatorOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = localStorage.getItem('timali_user') || 'Admin';
  
  // Detectar modo escuro
  const isDarkMode = document.body.classList.contains('dark-mode') || 
                     document.documentElement.getAttribute('data-theme') === 'dark';

  // Cards do menu principal
  const menuCards = [
    {
      title: 'Simulador de Crédito',
      description: 'Simule cenários e gere planos de pagamento',
      icon: <CalculatorOutlined style={{ fontSize: 56, color: '#eb2f96' }} />,
      path: '/simulador',
      color: 'linear-gradient(135deg, #fff0f6 0%, #ffadd2 100%)',
      borderColor: '#eb2f96',
      featured: true, // Card em destaque
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
      title: 'Entidades',
      description: 'Gerir clientes, fornecedores e funcionários',
      icon: <TeamOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      path: '/entidades',
      color: '#e6f7ff',
      borderColor: '#1890ff',
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
        borderBottom: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`
      }}>
        <Title level={2} style={{ margin: 0, color: isDarkMode ? '#fff' : undefined }}>
          Bem-vindo, {user}! 👋
        </Title>
        <Text style={{ fontSize: 16, color: isDarkMode ? '#rgba(255, 255, 255, 0.65)' : undefined }}>
          Sistema de Gestão de Créditos Timali
        </Text>
      </div>

      {/* Cards de Estatísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        {statistics.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card 
              hoverable
              style={{
                backgroundColor: isDarkMode ? '#1f1f1f' : undefined,
                borderColor: isDarkMode ? '#303030' : undefined
              }}
            >
              <Statistic
                title={<span style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : undefined }}>{stat.title}</span>}
                value={stat.value}
                prefix={React.cloneElement(stat.icon, { style: { color: stat.color } })}
                valueStyle={{ color: isDarkMode ? '#fff' : undefined }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Menu de Navegação */}
      <Title level={3} style={{ marginBottom: 24, color: isDarkMode ? '#fff' : undefined }}>
        Menu Principal
      </Title>

      <Row gutter={[16, 16]}>
        {menuCards.map((card, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card
              hoverable
              style={{
                height: '100%',
                borderLeft: card.featured ? `6px solid ${card.borderColor}` : `4px solid ${card.borderColor}`,
                background: card.color,
                transition: 'all 0.3s',
                boxShadow: card.featured ? '0 4px 12px rgba(235, 47, 150, 0.3)' : undefined,
                transform: card.featured ? 'scale(1.02)' : undefined,
              }}
              onClick={() => navigate(card.path)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = card.featured ? 'scale(1.05) translateY(-4px)' : 'translateY(-4px)';
                e.currentTarget.style.boxShadow = card.featured 
                  ? '0 12px 32px rgba(235, 47, 150, 0.4)' 
                  : '0 8px 24px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = card.featured ? 'scale(1.02)' : 'translateY(0)';
                e.currentTarget.style.boxShadow = card.featured 
                  ? '0 4px 12px rgba(235, 47, 150, 0.3)' 
                  : '0 2px 8px rgba(0,0,0,0.09)';
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                  {card.icon}
                </div>
                <div>
                  <Title level={4} style={{ 
                    margin: 0, 
                    textAlign: 'center', 
                    fontSize: card.featured ? 20 : undefined,
                    color: isDarkMode ? '#fff' : undefined
                  }}>
                    {card.title}
                  </Title>
                  <Text style={{ 
                    display: 'block', 
                    textAlign: 'center', 
                    marginTop: 8, 
                    fontSize: card.featured ? 14 : undefined,
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : undefined
                  }}>
                    {card.description}
                  </Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Button 
                    type={card.featured ? "primary" : "link"} 
                    icon={<ArrowRightOutlined />}
                    style={card.featured ? { backgroundColor: '#eb2f96', borderColor: '#eb2f96' } : {}}
                  >
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
        borderTop: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
        textAlign: 'center',
      }}>
        <Text style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : undefined }}>
          Timali v1.0.0 - Sistema de Gestão de Créditos
        </Text>
      </div>
    </div>
  );
};

export default DashboardPage;