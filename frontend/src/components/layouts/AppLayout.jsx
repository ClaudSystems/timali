// frontend/src/components/Layout/AppLayout.jsx
import React, { useState } from 'react';
import { Layout, Button, Space, Typography, Menu } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  DashboardOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import headerBg from '../../assets/images/header_bg.png';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider collapsible collapsed={collapsed} trigger={null}>
        <div style={{ color: 'white', padding: '16px', fontWeight: 'bold' }}>
          Timali
        </div>
        <Menu theme="dark" mode="inline">
          <Menu.Item key="1" icon={<DashboardOutlined />}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="2" icon={<UserOutlined />}>
            Clientes
          </Menu.Item>
          <Menu.Item key="3" icon={<SettingOutlined />}>
            Configurações
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout>
        {/* Header com imagem de fundo */}
        <Header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 24px',
            background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
                         url(${headerBg}) center/cover no-repeat`,
            color: 'white',
          }}
        >
          {/* Botão para abrir/fechar sidebar */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: 'white', fontSize: 18 }}
          />

          <Space>
            <Space>
              <UserOutlined style={{ color: 'white' }} />
              <Text style={{ color: 'white' }}>
                {user?.username || user?.nome || 'Usuário'}
              </Text>
            </Space>

            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ color: 'white' }}
            >
              Sair
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: 24 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
