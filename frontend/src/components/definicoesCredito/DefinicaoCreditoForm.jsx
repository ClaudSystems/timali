// src/components/definicoesCredito/DefinicaoCreditoForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Switch,
  message,
  Spin,
   Alert,
  Space,
  ConfigProvider,
  Typography
} from 'antd';
import { SaveOutlined, RollbackOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { taxaService } from '../../services/taxaService';
import ptBR from 'antd/es/locale/pt_BR';

const { TextArea } = Input;
const { Text } = Typography;

const DefinicaoCreditoForm = ({ definicao, onSubmit, onCancel, loading }) => {
  const [form] = Form.useForm();
  const [taxas, setTaxas] = useState([]);
  const [loadingTaxas, setLoadingTaxas] = useState(false);

  useEffect(() => {
    carregarTaxas();
  }, []);

  useEffect(() => {
    if (definicao) {
      form.setFieldsValue({
        nome: definicao.nome || '',
        descricao: definicao.descricao || '',
        numeroDePrestacoes: definicao.numeroDePrestacoes || 12,
        periodicidade: definicao.periodicidade || 'MENSAL',
        formaDeCalculo: definicao.formaDeCalculo || 'PMT',
        percentualDeJuros: definicao.percentualDeJuros || 0,
        percentualJurosDeDemora: definicao.percentualJurosDeDemora || 0,
        taxa: definicao.taxa?.id || null,
        periodicidadeMora: definicao.periodicidadeMora || null,
        maximoCobrancasMora: definicao.maximoCobrancasMora || 0,
        excluirSabados: definicao.excluirSabados === true,
        excluirDomingos: definicao.excluirDomingos !== false,
        excluirDiaDePagNoSabado: definicao.excluirDiaDePagNoSabado !== false,
        excluirDiaDePagNoDomingo: definicao.excluirDiaDePagNoDomingo !== false,
        ativo: definicao.ativo !== false
      });
    }
  }, [definicao, form]);

  const carregarTaxas = async () => {
    setLoadingTaxas(true);
    try {
      const data = await taxaService.listarAtivas();
      setTaxas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar taxas:', error);
      setTaxas([]);
    } finally {
      setLoadingTaxas(false);
    }
  };

  const onFinish = (values) => {
    const dados = {
      ...values,
      taxa: values.taxa ? { id: values.taxa } : null
    };
    onSubmit(dados);
  };

  return (
    <ConfigProvider locale={ptBR}>
      <Card
        title={definicao?.id ? 'Editar Definição de Crédito' : 'Nova Definição de Crédito'}
        style={{ maxWidth: 1200, margin: '0 auto' }}
        extra={
          <Space>
            <Button icon={<RollbackOutlined />} onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={loading}
            >
              {definicao?.id ? 'Atualizar' : 'Criar Definição'}
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            numeroDePrestacoes: 12,
            periodicidade: 'MENSAL',
            formaDeCalculo: 'PMT',
            percentualDeJuros: 0,
            percentualJurosDeDemora: 0,
            maximoCobrancasMora: 0,
            excluirSabados: false,
            excluirDomingos: true,
            excluirDiaDePagNoSabado: true,
            excluirDiaDePagNoDomingo: true,
            ativo: true
          }}
        >
          {/* ============================================================ */}
          {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
          {/* ============================================================ */}
          <Divider orientation="left">Informações Básicas</Divider>

          <Form.Item
            name="nome"
            label="Nome da Definição"
            rules={[{ required: true, message: 'Informe o nome da definição' }]}
          >
            <Input placeholder="Ex: Crédito Pessoal 12x" size="large" maxLength={100} showCount />
          </Form.Item>

          <Form.Item
            name="descricao"
            label="Descrição"
          >
            <TextArea
              rows={3}
              placeholder="Descreva este pacote de crédito (opcional)"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ativo"
                label="Definição Ativa"
                valuePropName="checked"
              >
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
          </Row>

          {/* ============================================================ */}
          {/* SEÇÃO 2: PARÂMETROS DO CRÉDITO */}
          {/* ============================================================ */}
          <Divider orientation="left">Parâmetros do Crédito</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="numeroDePrestacoes"
                label="Nº de Prestações"
                rules={[{ required: true, message: 'Informe o número de prestações' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={360}
                  size="large"
                  placeholder="12"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="periodicidade"
                label="Periodicidade"
                rules={[{ required: true, message: 'Selecione a periodicidade' }]}
              >
                <Select size="large" placeholder="Selecione a periodicidade">
                  <Select.Option value="DIARIO">📆 Diário</Select.Option>
                  <Select.Option value="SEMANAL">📅 Semanal</Select.Option>
                  <Select.Option value="QUINZENAL">📊 Quinzenal</Select.Option>
                  <Select.Option value="MENSAL">📈 Mensal</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="formaDeCalculo"
                label="Forma de Cálculo"
                rules={[{ required: true, message: 'Selecione a forma de cálculo' }]}
              >
                <Select size="large" placeholder="Selecione a forma de cálculo">
                  <Select.Option value="TAXA_FIXA">💰 Taxa Fixa</Select.Option>
                  <Select.Option value="PMT">📊 PMT - Prestações Fixas</Select.Option>
                  <Select.Option value="SAC">📉 SAC - Amortização Constante</Select.Option>
                  <Select.Option value="JUROS_SIMPLES">📈 Juros Simples</Select.Option>
                  <Select.Option value="JUROS_COMPOSTOS">📊 Juros Compostos</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* ============================================================ */}
          {/* SEÇÃO 3: TAXAS E JUROS */}
          {/* ============================================================ */}
          <Divider orientation="left">Taxas e Juros</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="percentualDeJuros"
                label="Juros do Crédito (%)"
                rules={[{ required: true, message: 'Informe a taxa de juros' }]}
                tooltip="Percentual de juros ao mês"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={999.9999}
                  precision={4}
                  size="large"
                  placeholder="0,00"
                  addonAfter="%"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="percentualJurosDeDemora"
                label="Juros de Mora (%)"
                rules={[{ required: true, message: 'Informe a taxa de juros de mora' }]}
                tooltip="Percentual de juros por atraso"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  precision={4}
                  size="large"
                  placeholder="0,00"
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="taxa"
            label="Taxa Adicional (Opcional)"
          >
            <Select
              placeholder="Nenhuma taxa adicional"
              size="large"
              allowClear
              loading={loadingTaxas}
              options={taxas.map(t => ({ label: t.nome, value: t.id }))}
            />
          </Form.Item>

          {/* ============================================================ */}
          {/* SEÇÃO 4: CONFIGURAÇÃO DE MORA */}
          {/* ============================================================ */}
          <Divider orientation="left">Configuração de Mora</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="periodicidadeMora"
                label="Periodicidade da Mora"
              >
                <Select
                  size="large"
                  placeholder="Não cobrar mora"
                  allowClear
                >
                  <Select.Option value="DIARIO">📆 Diário</Select.Option>
                  <Select.Option value="SEMANAL">📅 Semanal</Select.Option>
                  <Select.Option value="QUINZENAL">📊 Quinzenal</Select.Option>
                  <Select.Option value="MENSAL">📈 Mensal</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="maximoCobrancasMora"
                label="Máximo de Cobranças"
                extra="Ex: 10 = cobra no máximo 10 vezes"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  size="large"
                  placeholder="0"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Alert
                message="Como funciona a mora?"
                description="Define quantas vezes a multa por atraso será aplicada. Após atingir o limite, não cobra mais."
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
              />
            </Col>
          </Row>

          {/* ============================================================ */}
          {/* SEÇÃO 5: DIAS DE PAGAMENTO */}
          {/* ============================================================ */}
          <Divider orientation="left">Dias de Pagamento</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="excluirSabados"
                label="Excluir Sábados como dia útil"
                valuePropName="checked"
              >
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="excluirDomingos"
                label="Excluir Domingos como dia útil"
                valuePropName="checked"
              >
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="excluirDiaDePagNoSabado"
                label="Ajustar pagamento se cair no Sábado"
                valuePropName="checked"
              >
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="excluirDiaDePagNoDomingo"
                label="Ajustar pagamento se cair no Domingo"
                valuePropName="checked"
              >
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </ConfigProvider>
  );
};

export default DefinicaoCreditoForm;