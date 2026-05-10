// src/components/layouts/MainLayout.jsx
import React, { useState } from 'react';
import { Layout, theme } from 'antd';
import { useLocation } from 'react-router-dom';
import AppHeader from './Header';
import AppSidebar from './Sidebar';
import AppFooter from './Footer';
import { useSettings } from '../../contexts/SettingsContext';

const { Content } = Layout;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { darkMode } = useSettings();
  const { token } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar />
      <Layout>
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <Content style={{
          margin: '16px',
          padding: 24,
          minHeight: 280,
          background: token.colorBgContainer,
          borderRadius: token.borderRadiusLG || 8,
          transition: 'all 0.3s ease',
          // Adiciona uma leve sombra que funciona em ambos os temas
          boxShadow: darkMode
            ? '0 1px 2px 0 rgba(255, 255, 255, 0.03), 0 1px 6px -1px rgba(255, 255, 255, 0.02), 0 2px 4px 0 rgba(255, 255, 255, 0.02)'
            : '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        }}>
          {children}
        </Content>
        <AppFooter />
      </Layout>
    </Layout>
  );
};

export default MainLayout;