// src/components/layouts/Footer.jsx
import React from 'react';
import { Layout, Typography, Space, Row, Col } from 'antd';
import {
  CopyrightOutlined,
  GithubOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useSettings } from '../../contexts/SettingsContext';

const { Footer } = Layout;
const { Text, Link } = Typography;

const AppFooter = () => {
  const currentYear = new Date().getFullYear();
  const { darkMode } = useSettings();

  const textStyle = {
    color: darkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
    transition: 'color 0.3s ease',
  };

  const secondaryTextStyle = {
    fontSize: '12px',
    color: darkMode ? 'rgba(255, 255, 255, 0.30)' : 'rgba(0, 0, 0, 0.30)',
    transition: 'color 0.3s ease',
  };

  return (
    <Footer style={{
      textAlign: 'center',
      background: darkMode ? '#141414' : '#f0f2f5',
      padding: '24px 50px',
      borderTop: darkMode
        ? '1px solid rgba(255, 255, 255, 0.06)'
        : '1px solid #e8e8e8',
      transition: 'all 0.3s ease',
    }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space direction="vertical" size="small">
          <Text style={textStyle}>
            <CopyrightOutlined style={{ marginRight: 4 }} />
            {currentYear} Timali - Sistema de Gestão de Créditos
          </Text>
          <Text style={secondaryTextStyle}>
            Versão 1.0.0 | Todos os direitos reservados
          </Text>
        </Space>

        <Space size="large">
          <Link
            href="mailto:suporte@timali.com"
            style={{ ...textStyle, fontSize: '12px' }}
          >
            <MailOutlined style={{ marginRight: 4 }} />
            suporte@timali.com
          </Link>
          <Link
            href="tel:+258000000000"
            style={{ ...textStyle, fontSize: '12px' }}
          >
            <PhoneOutlined style={{ marginRight: 4 }} />
            +258 XX XXX XXXX
          </Link>
        </Space>
      </Space>
    </Footer>
  );
};

export default AppFooter;