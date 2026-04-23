// src/components/credito/CreditoFilters.jsx
import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Space,
  DatePicker
} from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const CreditoFilters = ({ onFilter }) => {
  const [form] = Form.useForm();

  const handleSearch = () => {
    const values = form.getFieldsValue();

    const filtros = {
      max: 20,
      offset: 0,
      sort: 'dataEmissao',
      order: 'desc'
    };

    if (values.numero) {
      filtros.numero = values.numero;
    }
    if (values.status) {
      filtros.status = values.status;
    }
    if (values.entidade) {
      filtros.entidade = values.entidade;
    }
    if (values.periodo) {
      filtros.dataInicio = values.periodo[0]?.format('YYYY-MM-DD');
      filtros.dataFim = values.periodo[1]?.format('YYYY-MM-DD');
    }

    onFilter(filtros);
  };

  const handleClear = () => {
    form.resetFields();
    onFilter({
      max: 20,
      offset: 0,
      sort: 'dataEmissao',
      order: 'desc'
    });
  };

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSearch}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="numero" label="Número do Crédito">
              <Input
                placeholder="Ex: CRED-2024-001"
                allowClear
              />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item name="entidade" label="Entidade/Cliente">
              <Input
                placeholder="Nome ou código"
                allowClear
              />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item name="status" label="Status">
              <Select
                placeholder="Selecione o status"
                allowClear
              >
                <Select.Option value="ATIVO">Ativo</Select.Option>
                <Select.Option value="EM_ATRASO">Em Atraso</Select.Option>
                <Select.Option value="QUITADO">Quitado</Select.Option>
                <Select.Option value="CANCELADO">Cancelado</Select.Option>
                <Select.Option value="RASCUNHO">Rascunho</Select.Option>
                <Select.Option value="RENEGOCIADO">Renegociado</Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item name="periodo" label="Período de Emissão">
              <RangePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={['Data Início', 'Data Fim']}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={24}>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SearchOutlined />}
                >
                  Filtrar
                </Button>
                <Button
                  onClick={handleClear}
                  icon={<ClearOutlined />}
                >
                  Limpar Filtros
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default CreditoFilters;