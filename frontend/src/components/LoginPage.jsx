import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Simulação de login - Substitua pela sua API real
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('timali_token', data.access_token || 'token-temp');
        localStorage.setItem('timali_user', values.username);
        message.success('Login realizado com sucesso!');
        navigate('/');
      } else {
        message.error('Usuário ou senha inválidos!');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Login temporário para desenvolvimento
      localStorage.setItem('timali_token', 'dev-token-123');
      localStorage.setItem('timali_user', values.username);
      message.warning('Modo desenvolvimento: Login simulado');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card
        style={{
          width: 400,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          borderRadius: 8,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#667eea' }}>
              TIMALI
            </Title>
            <Text type="secondary">Sistema de Gestão de Créditos</Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Por favor, insira o usuário!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Usuário"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Por favor, insira a senha!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Senha"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<LoginOutlined />}
                loading={loading}
                block
              >
                Entrar
              </Button>
            </Form.Item>
          </Form>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Desenvolvimento - Credenciais: admin / admin123
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default LoginPage;