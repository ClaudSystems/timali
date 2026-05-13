import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import loginBackground from '../assets/images/login.jpg';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8080/api/login', {
        username: values.username,
        password: values.password
      });

      if (response.data.access_token) {
        localStorage.setItem('timali_token', response.data.access_token);
        localStorage.setItem('timali_user', response.data.username || values.username);
        localStorage.setItem('timali_user_data', JSON.stringify(response.data));

        message.success({
          content: `Bem-vindo, ${response.data.username || values.username}!`,
          duration: 2,
        });

        setTimeout(() => {
          navigate('/');
        }, 500);
      }
    } catch (err) {
      console.error('Login error:', err);

      if (err.response?.status === 401) {
        setError('Usuário ou senha inválidos!');
      } else if (err.response?.status === 403) {
        setError('Acesso não autorizado!');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Erro de conexão com o servidor. Verifique se o backend está rodando.');
        // Fallback para desenvolvimento
        handleDevLogin(values);
      } else {
        setError('Erro ao realizar login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Login temporário para desenvolvimento
  const handleDevLogin = (values) => {
    console.warn('⚠️ Usando login de desenvolvimento');
    localStorage.setItem('timali_token', 'dev-token-123456');
    localStorage.setItem('timali_user', values.username);
    message.warning('Modo desenvolvimento: Login simulado');
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      position: 'relative',
      background: `url(${loginBackground}) center/cover no-repeat`,
    }}>
      {/* Overlay escuro sobre a imagem */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%)',
        zIndex: 1,
      }} />

      {/* Container do Card de Login */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}>
        <Card
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
          bodyStyle={{
            padding: '40px 32px',
          }}
        >
          <Space
            direction="vertical"
            size="large"
            style={{ width: '100%' }}
          >
            {/* Logo e Título */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
              }}>
                <LoginOutlined style={{ fontSize: 32, color: 'white' }} />
              </div>

              <Title level={2} style={{
                margin: 0,
                color: '#1a1a1a',
                fontWeight: 700,
              }}>
                TIMALI
              </Title>
              <Text style={{
                color: '#666',
                fontSize: 16,
                display: 'block',
                marginTop: 4,
              }}>
                Sistema de Gestão de Créditos
              </Text>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <Alert
                message="Erro de Autenticação"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError('')}
                style={{
                  borderRadius: 8,
                  border: 'none',
                  background: '#fff2f0',
                }}
              />
            )}

            {/* Formulário */}
            <Form
              name="login"
              onFinish={handleLogin}
              layout="vertical"
              size="large"
              autoComplete="off"
            >
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: 'Por favor, insira o utilizador!' },
                  { min: 3, message: 'Mínimo 3 caracteres!' }
                ]}
                style={{ marginBottom: 20 }}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Utilizador"
                  style={{
                    borderRadius: 8,
                    height: 48,
                    borderColor: '#d9d9d9',
                    fontSize: 16,
                  }}
                  onFocus={(e) => {
                    e.target.parentElement.style.borderColor = '#667eea';
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: 'Por favor, insira a senha!' },
                  { min: 4, message: 'Mínimo 4 caracteres!' }
                ]}
                style={{ marginBottom: 24 }}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Senha"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                  style={{
                    borderRadius: 8,
                    height: 48,
                    borderColor: '#d9d9d9',
                    fontSize: 16,
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LoginOutlined />}
                  loading={loading}
                  block
                  style={{
                    height: 48,
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </Form.Item>
            </Form>

            {/* Rodapé */}
            <div style={{ textAlign: 'center' }}>
              <Text style={{
                fontSize: 13,
                color: '#999',
              }}>
                © {new Date().getFullYear()} Timali. Todos os direitos reservados.
              </Text>
              <br />
              <Text style={{
                fontSize: 12,
                color: '#bfbfbf',
              }}>
                Versão 1.0.0
              </Text>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;