// src/components/layouts/Header.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Space, Typography, Dropdown, Avatar, Switch, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  BulbOutlined,
  BulbFilled,
} from '@ant-design/icons';
import { useSettings } from '../../contexts/SettingsContext';
import { theme } from 'antd';
import headerBg from '../../assets/images/header_bg.png';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useSettings();
  const user = localStorage.getItem('timali_user') || 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('timali_token');
    localStorage.removeItem('timali_user');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Perfil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configurações',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        padding: '0 24px',
        background: darkMode
          ? 'linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85))'
          : `linear-gradient(rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)),
             url(${headerBg}) center/cover no-repeat`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: darkMode
          ? '0 1px 4px rgba(255, 255, 255, 0.1)'
          : '0 1px 4px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1,
        borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{
          fontSize: '16px',
          width: 48,
          height: 48,
          color: darkMode ? '#fff' : 'inherit',
        }}
      />

      <Space size="middle">
        {/* Dark Mode Toggle */}
        <Tooltip title={darkMode ? 'Modo Claro' : 'Modo Escuro'}>
          <Space size={8}>
            {darkMode ? (
              <BulbFilled style={{ color: '#fadb14', fontSize: '16px' }} />
            ) : (
              <BulbOutlined style={{ fontSize: '16px' }} />
            )}
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              checkedChildren="🌙"
              unCheckedChildren="☀️"
              size="small"
            />
          </Space>
        </Tooltip>

        <Button
          type="text"
          icon={<BellOutlined />}
          style={{
            fontSize: '16px',
            color: darkMode ? '#fff' : 'inherit',
          }}
        />

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <Text strong style={{ color: darkMode ? '#fff' : 'inherit' }}>
              {user}
            </Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader;