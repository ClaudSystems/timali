// frontend/src/components/entidade/EntidadeFormSimples.jsx
import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Space, Row, Col, Card, Typography, message } from 'antd';
import { SaveOutlined, CloseOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const EntidadeFormSimples = ({ entidade, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (entidade?.id) {
      console.log('📋 SIMPLES - Carregando:', entidade.nome);
      form.setFieldsValue({
        nome: entidade.nome || '',
        tipoDePessoa: entidade.tipoDePessoa || 'CLIENTE',
        telefone: entidade.telefone || '',
        email: entidade.email || '',
      });
    }
  }, [entidade, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        id: entidade?.id,
        version: entidade?.version || 0,
      };
      await onSubmit(data);
    } catch (error) {
      message.error('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <Title level={4}>{entidade ? 'Editar (Rápido)' : 'Nova Entidade (Rápido)'}</Title>

      <Form form={form} layout="vertical" onFinish={handleSubmit}
        initialValues={{ tipoDePessoa: 'CLIENTE' }}>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="nome" label="Nome Completo"
              rules={[{ required: true, message: 'Nome obrigatório' }]}>
              <Input prefix={<UserOutlined />} placeholder="Nome completo" size="large" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="tipoDePessoa" label="Tipo de Pessoa"
              rules={[{ required: true, message: 'Tipo obrigatório' }]}>
              <Select size="large">
                <Option value="CLIENTE">Cliente</Option>
                <Option value="ASSINANTE">Assinante</Option>
                <Option value="FORNECEDOR">Fornecedor</Option>
                <Option value="FUNCIONARIO">Funcionário</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="telefone" label="Telefone">
              <Input prefix={<PhoneOutlined />} placeholder="+258 XX XXX XXXX" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="email" label="Email">
              <Input placeholder="email@exemplo.com" />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button onClick={onCancel} icon={<CloseOutlined />}>Cancelar</Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
              Salvar
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default EntidadeFormSimples;