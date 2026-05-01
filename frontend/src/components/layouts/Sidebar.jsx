// src/components/layouts/Sidebar.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  PercentageOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  SettingOutlined,
  WalletOutlined,
  HistoryOutlined,        // ← ADICIONAR ESTA LINHA
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
      key: '/recibos',
      icon: <HistoryOutlined />,
      label: 'Recibos',
    },
    {
      key: '/taxas',
      icon: <PercentageOutlined />,
      label: 'Taxas',
    },
    {
      key: '/feriados',
      icon: <CalendarOutlined />,
      label: 'Feriados',
    },
    {
      key: '/definicoesCredito',
      icon: <FileTextOutlined />,
      label: 'Definições',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Configurações',
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
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};

export default Sidebar;