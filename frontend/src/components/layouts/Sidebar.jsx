// src/components/layouts/Sidebar.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  CreditCardOutlined,
  WalletOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      icon: <CreditCardOutlined />,
      label: 'Créditos',
    },
    {
      key: '/caixa',
      icon: <WalletOutlined />,
      label: 'Caixa',
    },
    {
      key: 'configuracoes',
      icon: <SettingOutlined />,
      label: 'Configurações',
      children: [
        {
          key: '/taxas',
          label: 'Taxas',
        },
        {
          key: '/feriados',
          label: 'Feriados',
        },
        {
          key: '/definicoesCredito',
          label: 'Definições de Crédito',
        },
        {
          key: '/settings',
          label: 'Geral',
        },
      ],
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Sider
      breakpoint="lg"
      collapsedWidth="80"
      style={{
        minHeight: '100vh',
        background: '#001529',
      }}
    >
      <div style={{
        height: 64,
        margin: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
      }}>
        <WalletOutlined style={{ marginRight: 8 }} />
        Timali
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['configuracoes']}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default Sidebar;