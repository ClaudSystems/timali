// src/components/layouts/Footer.jsx
import React from 'react';
import { Layout, Typography, Space } from 'antd';
import {
  CopyrightOutlined,
} from '@ant-design/icons';

const { Footer } = Layout;
const { Text, Link } = Typography;

const AppFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Footer style={{
      textAlign: 'center',
      background: '#f0f2f5',
      padding: '16px 50px',
    }}>
      <Space direction="vertical" size="small">
        <Text type="secondary">
          <CopyrightOutlined /> {currentYear} Timali - Sistema de Gestão de Créditos
        </Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Versão 1.0.0 | Todos os direitos reservados
        </Text>
      </Space>
    </Footer>
  );
};

export default AppFooter;