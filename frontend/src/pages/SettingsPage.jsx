// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Form, Input, Switch, Button, Card, message, Space, Divider, Typography, Row, Col, Spin
} from 'antd';
import { SaveOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { TextArea } = Input;

const SettingsPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState(null); // ← GUARDAR O ID

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/settings');
      const data = response.data;

      // A API retorna um array [{...}], pegar o primeiro
      const settingsData = Array.isArray(data) ? data[0] : data;

      if (settingsData) {
        setSettingsId(settingsData.id); // ← GUARDAR O ID
        form.setFieldsValue(settingsData);
      }
    } catch (error) {
      message.error('Erro ao carregar configurações');
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      // CORRIGIDO: Usar o ID correto
      if (!settingsId) {
        message.error('ID das configurações não encontrado');
        return;
      }

      console.log('🔧 Salvando settings ID:', settingsId);
      await axios.put(`/api/settings/${settingsId}`, values);
      message.success('Configurações salvas com sucesso!');
    } catch (error) {
      message.error('Erro ao salvar configurações');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadSettings();
    message.info('Configurações recarregadas');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <SettingOutlined />
            <Title level={4} style={{ margin: 0 }}>Configurações do Sistema</Title>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={loading}>
            Recarregar
          </Button>
        }
      >
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              nome: 'default',
              permitirDesembolsoComDivida: false,
              pagamentosEmOrdem: false,
              ignorarValorPagoNoPrazo: false,
              pagarEmSequencia: false,
              alterarDataPagamento: false
            }}
          >
            <Divider orientation="left">Informações Básicas</Divider>
            <Form.Item label="Nome da Configuração" name="nome" rules={[{ required: true }]}>
              <Input disabled />
            </Form.Item>

            <Divider orientation="left">Configurações Financeiras</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Conta 1" name="conta1">
                  <Input placeholder="Número da conta 1" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Conta 2" name="conta2">
                  <Input placeholder="Número da conta 2" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Conta 3" name="conta3">
                  <Input placeholder="Número da conta 3" />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Flags e Controles</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Permitir Desembolso com Dívida" name="permitirDesembolsoComDivida" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Pagamentos em Ordem" name="pagamentosEmOrdem" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Ignorar Valor Pago no Prazo" name="ignorarValorPagoNoPrazo" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Pagar em Sequência" name="pagarEmSequencia" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Alterar Data de Pagamento" name="alterarDataPagamento" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Configurações de Documentos</Divider>
            <Form.Item label="Rodapé Plano de Pagamento" name="rodaPePlanoDePagamento">
              <TextArea rows={4} placeholder="Insira o texto do rodapé..." />
            </Form.Item>
            <Form.Item label="NB Plano de Pagamento" name="nbPlanoDePagamento">
              <TextArea rows={4} placeholder="Insira o texto NB..." />
            </Form.Item>

            <Divider />
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">
                  Salvar Configurações
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset} size="large">
                  Resetar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default SettingsPage;