// src/layouts/MainLayout.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, theme } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  SettingOutlined,
  CreditCardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogout = () => {
    localStorage.removeItem('timali_token');
    localStorage.removeItem('timali_user');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/entidades',
      icon: <TeamOutlined />,
      label: 'Entidades',
    },
    {
      key: '/creditos',
      icon: <DollarOutlined />,
      label: 'Créditos',
    },
    {
      key: '/taxas',
      icon: <CreditCardOutlined />,
      label: 'Taxas',
    },
    {
      key: '/feriados',
      icon: <CalendarOutlined />,
      label: 'Feriados',
    },
    {
      key: '/definicoes-credito',
      icon: <SettingOutlined />,
      label: 'Def. Crédito',
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/creditos')) return '/creditos';
    if (path.startsWith('/entidades')) return '/entidades';
    if (path.startsWith('/taxas')) return '/taxas';
    if (path.startsWith('/feriados')) return '/feriados';
    if (path.startsWith('/definicoes-credito')) return '/definicoes-credito';
    return '/';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{
          height: 32,
          margin: 16,
          color: 'white',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {collapsed ? 'T' : 'TIMALI'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 16px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ fontSize: '16px' }}
          >
            Sair
          </Button>
        </Header>
        <Content style={{
          margin: '24px 16px',
          padding: 24,
          minHeight: 280,
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;