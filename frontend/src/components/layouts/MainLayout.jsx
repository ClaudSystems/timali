// src/components/layouts/MainLayout.jsx
import React, { useState } from 'react';
import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';
import AppHeader from './Header';
import AppSidebar from './Sidebar';
import AppFooter from './Footer';

const { Content } = Layout;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar
        collapsed={collapsed}
        location={location}
      />
      <Layout>
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
        <Content style={{
          margin: '16px',
          padding: 24,
          minHeight: 280,
          background: '#fff',
          borderRadius: 8,
        }}>
          {children}
        </Content>
        <AppFooter />
      </Layout>
    </Layout>
  );
};

export default MainLayout;