import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  CreditCardOutlined,
  WalletOutlined,
  SettingOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  SafetyOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useSettings } from '../../contexts/SettingsContext';

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
      key: 'usuarios',
      icon: <UserOutlined />,
      label: 'Usuários',
      children: [
        {
          key: '/usuarios',
          icon: <UsergroupAddOutlined />,
          label: 'Gestão de Usuários',
        },
        {
          key: '/gruposRoles',
          icon: <SafetyOutlined />,
          label: 'Grupos de Roles',
        },
        {
          key: '/roles',
          icon: <KeyOutlined />,
          label: 'Roles',
        },
      ],
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

  // Função para encontrar submenus abertos baseado na rota atual
  const getOpenKeys = () => {
    const path = location.pathname;
    const openKeys = [];

    if (path.startsWith('/usuarios') || path === '/gruposRoles' || path === '/roles') {
      openKeys.push('usuarios');
    }
    if (['/taxas', '/feriados', '/definicoesCredito', '/settings'].includes(path)) {
      openKeys.push('configuracoes');
    }

    return openKeys;
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
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          background: 'transparent',
          borderRight: 0,
        }}
        {...(darkMode
          ? {}
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