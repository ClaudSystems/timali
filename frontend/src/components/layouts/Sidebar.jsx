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
import { useSettings } from '../../contexts/SettingsContext';
import logoDark from '../../assets/images/logo_dark.png'; // Opcional: logo para modo escuro
import logoLight from '../../assets/images/logo_light.png'; // Opcional: logo para modo claro

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useSettings();

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
        background: darkMode ? '#001529' : '#1677ff',
        boxShadow: darkMode
          ? '2px 0 8px rgba(0, 0, 0, 0.3)'
          : '2px 0 8px rgba(0, 0, 0, 0.15)',
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
        borderBottom: darkMode
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        paddingBottom: 16,
      }}>
        <WalletOutlined style={{
          marginRight: 8,
          fontSize: 24,
          color: '#fff'
        }} />
        <span style={{
          color: '#fff',
          textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
        }}>
          Timali
        </span>
      </div>

      <Menu
        theme={darkMode ? "dark" : "light"}
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['configuracoes']}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          background: 'transparent',
          borderRight: 0,
        }}
        // Personalização das cores baseado no tema
        {...(darkMode
          ? {} // Mantém o tema dark padrão
          : {
              style: {
                background: 'transparent',
                color: '#fff',
              }
            }
        )}
      />
    </Sider>
  );
};

export default Sidebar;