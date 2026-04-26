// src/components/layouts/Sidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  SettingOutlined,
  CreditCardOutlined,
  ToolOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const AppSidebar = ({ collapsed, location }) => {
  const navigate = useNavigate();

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
      children: [
        {
          key: '/creditos',
          icon: <DollarOutlined />,
          label: 'Lista de Créditos',
        },
        {
          key: '/creditos/novo',
          icon: <CreditCardOutlined />,
          label: 'Novo Crédito',
        },
      ],
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
      key: '/definicoesCredito',
      icon: <SettingOutlined />,
      label: 'Def. Crédito',
    },
    {
      type: 'divider',
    },
    {
      key: '/settings',
      icon: <ToolOutlined />,
      label: 'Configurações',
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return '/';
    if (path.startsWith('/creditos/novo')) return '/creditos/novo';
    if (path.startsWith('/creditos')) return '/creditos';
    if (path.startsWith('/entidades')) return '/entidades';
    if (path.startsWith('/taxas')) return '/taxas';
    if (path.startsWith('/feriados')) return '/feriados';
    if (path.startsWith('/definicoesCredito')) return '/definicoesCredito';
    if (path.startsWith('/settings')) return '/settings';
    return '/';
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/creditos')) return ['/creditos'];
    return [];
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      theme="dark"
      width={220}
      style={{
        overflow: 'auto',
        height: '100vh',
      }}
    >
      <div style={{
        height: 64,
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h1 style={{
          color: 'white',
          fontSize: collapsed ? 20 : 24,
          fontWeight: 'bold',
          margin: 0,
          letterSpacing: 2,
          transition: 'all 0.2s',
        }}>
          {collapsed ? 'T' : 'TIMALI'}
        </h1>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
};

export default AppSidebar;