// src/components/credito/CreditoForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Divider,
  message,
  Spin,
  Switch,
  Alert,
  Space,
  ConfigProvider,
  Typography,
  theme
} from 'antd';
import { SearchOutlined, SaveOutlined, RollbackOutlined, InfoCircleOutlined } from '@ant-design/icons';
import creditoService from '../../services/creditoService';
import moment from 'moment';
import ptBR from 'antd/es/locale/pt_BR';
import 'moment/locale/pt-br';

moment.locale('pt-br');

const { TextArea } = Input;
const { Text } = Typography;
const { useToken } = theme;

const CreditoForm = () => {
  const { token } = useToken();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [todasEntidades, setTodasEntidades] = useState([]);
  const [searching, setSearching] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [usarDefinicao, setUsarDefinicao] = useState(true);

  const [definicoes, setDefinicoes] = useState([]);
  const [loadingDefinicoes, setLoadingDefinicoes] = useState(false);
  const [definicaoSelecionada, setDefinicaoSelecionada] = useState(null);

  useEffect(() => {
    carregarDefinicoes();
    carregarTodasEntidades();
  }, []);

  // ====================================================================
  // CARREGAR DEFINIÇÕES
  // ====================================================================
  const carregarDefinicoes = async () => {
    setLoadingDefinicoes(true);
    try {
      const data = await creditoService.listarDefinicoes();
      console.log('Definições carregadas:', data);

      let definicoesArray = [];
      if (Array.isArray(data)) {
        definicoesArray = data;
      } else if (data._embedded?.definicoesCredito) {
        definicoesArray = data._embedded.definicoesCredito;
      } else if (data.data) {
        definicoesArray = data.data;
      } else {
        definicoesArray = [];
      }

      setDefinicoes(definicoesArray);

      if (definicoesArray.length === 0) {
        message.warning('Nenhuma definição de crédito encontrada.');
      }
    } catch (error) {
      console.error('Erro ao carregar definições:', error);
      message.error('Erro ao carregar definições de crédito');
      setDefinicoes([]);
    } finally {
      setLoadingDefinicoes(false);
    }
  };

  // ====================================================================
  // CARREGAR ENTIDADES
  // ====================================================================
  const carregarTodasEntidades = async () => {
    try {
      const token = localStorage.getItem('timali_token');
      const response = await fetch('http://localhost:8080/api/entidades', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();

      let entidadesArray = [];
      if (Array.isArray(data)) {
        entidadesArray = data;
      } else if (data._embedded?.entidades) {
        entidadesArray = data._embedded.entidades;
      } else if (data.data) {
        entidadesArray = data.data;
      } else if (typeof data === 'object') {
        entidadesArray = Object.values(data);
      }

      console.log('Entidades carregadas:', entidadesArray.length);
      setTodasEntidades(entidadesArray);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
    }
  };

  // ====================================================================
  // BUSCAR CLIENTES
  // ====================================================================
  const buscarClientes = (termo) => {
    if (!termo || termo.length < 2) {
      setClientes([]);
      return;
    }

    setSearching(true);

    const termoLower = termo.toLowerCase();
    const filtrados = todasEntidades.filter(entidade => {
      const codigo = (entidade.codigo || '').toLowerCase();
      const nome = (entidade.nome || '').toLowerCase();
      return codigo.includes(termoLower) || nome.includes(termoLower);
    });

    setClientes(filtrados.slice(0, 20));
    setSearching(false);
  };

  const handleSelectCliente = (clienteId) => {
    const cliente = todasEntidades.find(c => c.id === clienteId);
    setClienteSelecionado(cliente);
    form.setFieldsValue({ entidadeId: clienteId });
  };

  // ====================================================================
  // EXTRAIR VALOR DE ENUM
  // ====================================================================
  const extrairValorEnum = (enumValue) => {
    if (!enumValue) return '';
    if (typeof enumValue === 'string') return enumValue;
    if (enumValue.name) return enumValue.name;
    if (enumValue.descricao) return enumValue.descricao;
    if (enumValue.toString && enumValue.toString() !== '[object Object]') return enumValue.toString();

    const keys = Object.keys(enumValue);
    if (keys.length > 0 && typeof enumValue[keys[0]] === 'string') {
      return enumValue[keys[0]];
    }

    return '';
  };

  // ====================================================================
  // HANDLER: MUDAR DEFINIÇÃO
  // ====================================================================
  const handleDefinicaoChange = (definicaoId) => {
    const definicao = definicoes.find(d => d.id === definicaoId);
    setDefinicaoSelecionada(definicao);

    if (definicao) {
      console.log('Definição selecionada:', definicao);

      const periodicidadeStr = extrairValorEnum(definicao.periodicidade) || 'MENSAL';
      const formaCalculoStr = extrairValorEnum(definicao.formaDeCalculo) || 'JUROS_SIMPLES';

      form.setFieldsValue({
        percentualDeJuros: definicao.percentualDeJuros,
        percentualJurosDeDemora: definicao.percentualJurosDeDemora,
        numeroDePrestacoes: definicao.numeroDePrestacoes,
        periodicidade: periodicidadeStr,
        formaDeCalculo: formaCalculoStr
      });
    }
  };

  // ====================================================================
  // HANDLER: USAR DEFINIÇÃO
  // ====================================================================
  const handleUsarDefinicaoChange = (checked) => {
    setUsarDefinicao(checked);

    if (checked && definicaoSelecionada) {
      const periodicidadeStr = extrairValorEnum(definicaoSelecionada.periodicidade) || 'MENSAL';
      const formaCalculoStr = extrairValorEnum(definicaoSelecionada.formaDeCalculo) || 'JUROS_SIMPLES';

      form.setFieldsValue({
        percentualDeJuros: definicaoSelecionada.percentualDeJuros,
        percentualJurosDeDemora: definicaoSelecionada.percentualJurosDeDemora,
        numeroDePrestacoes: definicaoSelecionada.numeroDePrestacoes,
        periodicidade: periodicidadeStr,
        formaDeCalculo: formaCalculoStr
      });
    }
  };

  // ====================================================================
  // HANDLER: SUBMIT DO FORMULÁRIO (CORRIGIDO)
  // ====================================================================
  const onFinish = async (values) => {
    console.log('Values do form:', values);

    if (!values.entidadeId) {
      message.error('Selecione um cliente');
      return;
    }

    if (definicaoSelecionada && values.numeroDePrestacoes > definicaoSelecionada.numeroDePrestacoes) {
      message.error(`O número de prestações não pode exceder ${definicaoSelecionada.numeroDePrestacoes}`);
      return;
    }

    const dadosParaEnviar = {
      entidadeId: Number(values.entidadeId),
      definicaoCreditoId: Number(values.definicaoCreditoId),
      valorConcedido: Number(values.valorConcedido),
      percentualDeJuros: Number(values.percentualDeJuros),
      percentualJurosDeDemora: Number(values.percentualJurosDeDemora),
      numeroDePrestacoes: Number(values.numeroDePrestacoes),
      periodicidade: extrairValorEnum(values.periodicidade) || values.periodicidade,
      formaDeCalculo: extrairValorEnum(values.formaDeCalculo) || values.formaDeCalculo,
      dataEmissao: values.dataEmissao?.format('YYYY-MM-DD'),
      descricao: values.descricao || null,
      ignorarPagamentosNoPrazo: values.ignorarPagamentosNoPrazo || false
    };

    console.log('Dados a enviar (convertidos):', dadosParaEnviar);

    setLoading(true);
    try {
      const response = await creditoService.criar(dadosParaEnviar);
      console.log('📦 Resposta completa da criação:', response);

      // ================================================================
      // CORREÇÃO: Extrair ID e redirecionar para CreditoShow
      // ================================================================
      let creditoId = null;

      if (response?.id) {
        creditoId = response.id;
      } else if (response?.data?.id) {
        creditoId = response.data.id;
      } else if (typeof response === 'number') {
        creditoId = response;
      }

      if (creditoId) {
        message.success(`✅ Crédito #${response?.numero || creditoId} criado com sucesso!`);

        // Pequeno delay para o backend processar as parcelas
        setTimeout(() => {
          // REDIRECIONAR PARA A PÁGINA DE DETALHES (CreditoShow)
          navigate(`/creditos/${creditoId}`);
        }, 800);
      } else {
        // Fallback: se não encontrou o ID, voltar para a lista
        console.warn('⚠️ ID do crédito não encontrado na resposta');
        message.success('Crédito criado com sucesso!');
        setTimeout(() => {
          navigate('/creditos');
        }, 1500);
      }

    } catch (error) {
      console.error('❌ Erro ao criar crédito:', error);
      message.error('Erro ao criar crédito: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  // ====================================================================
  // HANDLER: CANCELAR
  // ====================================================================
  const handleCancel = () => {
    navigate('/creditos');
  };

  // ====================================================================
  // OPÇÕES PARA OS SELECTS
  // ====================================================================
  const opcoesDefinicoes = definicoes.map(d => ({
    label: `${d.nome || 'Sem nome'} - Máx ${d.numeroDePrestacoes || 0}x`,
    value: d.id
  }));

  const opcoesClientes = clientes.map(c => ({
    label: `${c.codigo || 'Sem código'} - ${c.nome || 'Sem nome'}`,
    value: c.id
  }));

  // ====================================================================
  // RENDER
  // ====================================================================
  return (
    <ConfigProvider locale={ptBR}>
      <Card
        title={clienteSelecionado ? `Novo Crédito para: ${clienteSelecionado.nome}` : "Novo Crédito"}
        style={{ maxWidth: 1200, margin: '0 auto' }}
        extra={
          <Space>
            <Button icon={<RollbackOutlined />} onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={loading}
            >
              Salvar Crédito
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            dataEmissao: moment(),
            ignorarPagamentosNoPrazo: false,
            periodicidade: 'MENSAL',
            formaDeCalculo: 'JUROS_SIMPLES',
            numeroDePrestacoes: 12,
            percentualDeJuros: 0,
            percentualJurosDeDemora: 0
          }}
          style={{ marginTop: -8 }}
        >
          {/* ============================================================ */}
          {/* SEÇÃO 1: BUSCA DO CLIENTE                                   */}
          {/* ============================================================ */}
          <Row gutter={[16, 0]} align="middle" style={{ marginBottom: 16 }}>
            <Col span={3}>
              <Text strong style={{ fontSize: 14 }}>👤 Cliente:</Text>
            </Col>
            <Col span={21}>
              <Select
                showSearch
                placeholder="Digite o código ou nome do cliente"
                onSearch={buscarClientes}
                onSelect={handleSelectCliente}
                filterOption={false}
                notFoundContent={searching ? <Spin size="small" /> : 'Nenhum cliente encontrado'}
                options={opcoesClientes}
                suffixIcon={<SearchOutlined />}
                size="large"
                style={{ width: '100%' }}
              />
            </Col>
          </Row>

          <Form.Item name="entidadeId" hidden>
            <Input />
          </Form.Item>

          {/* ============================================================ */}
          {/* SEÇÃO 2: FORMULÁRIO PRINCIPAL (2 COLUNAS)                   */}
          {/* ============================================================ */}
          <Row gutter={24}>
            {/* COLUNA ESQUERDA: CAMPOS DE ENTRADA */}
            <Col span={14}>
              <Card 
                title="📝 Dados do Crédito" 
                size="small"
                style={{ backgroundColor: token.colorBgLayout }}
              >
                {/* Definição de Crédito */}
                <Form.Item
                  label="Def. De crédito"
                  name="definicaoCreditoId"
                  rules={[{ required: usarDefinicao, message: 'Selecione uma definição' }]}
                >
                  <Select
                    placeholder="Selecione uma definição de crédito"
                    onChange={handleDefinicaoChange}
                    loading={loadingDefinicoes}
                    options={opcoesDefinicoes}
                    size="large"
                    disabled={!usarDefinicao}
                  />
                </Form.Item>

                {/* Data de Concessão */}
                <Form.Item
                  label="Data de concessão"
                  name="dataEmissao"
                  rules={[{ required: true, message: 'Selecione a data' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    size="large"
                    defaultValue={moment()}
                    disabledDate={(current) => {
                      return current && current.isAfter(moment(), 'day')
                    }}
                  />
                </Form.Item>

                {/* Valor Creditado */}
                <Form.Item
                  label="Valor Creditado (MT)"
                  name="valorConcedido"
                  rules={[{ required: true, message: 'Informe o valor' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    size="large"
                    placeholder="0,00"
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\,/g, '')}
                  />
                </Form.Item>

                {/* Número de Prestações */}
                <Form.Item
                  label="Número de Prestações"
                  name="numeroDePrestacoes"
                  rules={[{ required: true, message: 'Informe o número de prestações' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    max={definicaoSelecionada?.numeroDePrestacoes || 360}
                    size="large"
                    placeholder="12"
                  />
                </Form.Item>

                <Divider style={{ margin: '12px 0' }} />

                {/* Botão Salvar */}
                <Form.Item>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => form.submit()}
                    loading={loading}
                    size="large"
                    block
                  >
                    💾 Salvar Crédito
                  </Button>
                </Form.Item>
              </Card>
            </Col>

            {/* COLUNA DIREITA: INFORMAÇÕES DA DEFINIÇÃO */}
            <Col span={10}>
              <Card 
                title="ℹ️ Informações da Definição" 
                size="small"
                style={{ backgroundColor: token.colorInfoBg }}
              >
                <div style={{ padding: '8px 0' }}>
                  <Row gutter={[8, 12]}>
                    <Col span={12}>
                      <Text type="secondary">Juros (%):</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                        {definicaoSelecionada?.percentualDeJuros || 0}%
                      </Text>
                    </Col>

                    <Col span={12}>
                      <Text type="secondary">Juros de Mora (%):</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong style={{ fontSize: 16, color: '#fa8c16' }}>
                        {definicaoSelecionada?.percentualJurosDeDemora || 0}%
                      </Text>
                    </Col>

                    <Col span={12}>
                      <Text type="secondary">Nº máx. prestações:</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong style={{ fontSize: 16 }}>
                        {definicaoSelecionada?.numeroDePrestacoes || '-'}
                      </Text>
                    </Col>

                    <Col span={12}>
                      <Text type="secondary">Forma de cálculo:</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong style={{ fontSize: 14 }}>
                        {definicaoSelecionada?.formaDeCalculo ? 
                          extrairValorEnum(definicaoSelecionada.formaDeCalculo) : '-'}
                      </Text>
                    </Col>

                    <Col span={12}>
                      <Text type="secondary">Periodicidade:</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong style={{ fontSize: 14 }}>
                        {definicaoSelecionada?.periodicidade ? 
                          extrairValorEnum(definicaoSelecionada.periodicidade) : '-'}
                      </Text>
                    </Col>
                  </Row>
                </div>

                {!definicaoSelecionada && (
                  <Alert
                    message="Selecione uma definição"
                    description="Escolha uma definição de crédito para ver os detalhes aqui"
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>

              {/* Opções Avançadas */}
              <Card 
                title="⚙️ Opções" 
                size="small"
                style={{ marginTop: 16, backgroundColor: token.colorWarningBg }}
              >
                <Form.Item
                  label="Usar Definição"
                  valuePropName="checked"
                  tooltip="Ative para usar uma definição já cadastrada"
                >
                  <Switch
                    checked={usarDefinicao}
                    onChange={handleUsarDefinicaoChange}
                    checkedChildren="Sim"
                    unCheckedChildren="Não"
                  />
                </Form.Item>

                <Form.Item
                  label="Calcular mora sobre valor total"
                  name="ignorarPagamentosNoPrazo"
                  valuePropName="checked"
                  tooltip="Se ativo, calcula mora sobre o valor total mesmo com pagamentos parciais"
                >
                  <Switch checkedChildren="Sim" unCheckedChildren="Não" />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          {/* ============================================================ */}
          {/* SEÇÃO 3: CAMPOS AVANÇADOS (EXPANSÍVEL)                      */}
          {/* ============================================================ */}
          {!usarDefinicao && (
            <Card 
              title="🔧 Configurações Personalizadas" 
              size="small"
              style={{ marginTop: 16 }}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="Taxa de Juros (%)"
                    name="percentualDeJuros"
                    rules={[{ required: true, message: 'Informe a taxa de juros' }]}
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

                <Col span={8}>
                  <Form.Item
                    label="Forma de Cálculo"
                    name="formaDeCalculo"
                    rules={[{ required: true, message: 'Selecione a forma de cálculo' }]}
                  >
                    <Select size="large" placeholder="Selecione">
                      <Select.Option value="TAXA_FIXA">💰 Taxa Fixa</Select.Option>
                      <Select.Option value="PMT">📊 PMT - Prestações Fixas</Select.Option>
                      <Select.Option value="JUROS_SIMPLES">📈 Juros Simples</Select.Option>
                      <Select.Option value="JUROS_COMPOSTOS">📉 Juros Compostos</Select.Option>
                      <Select.Option value="SAC">🔢 SAC - Amortização Constante</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    label="Juros de Demora (%)"
                    name="percentualJurosDeDemora"
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

              <Form.Item label="Descrição/Observações" name="descricao">
                <TextArea
                  rows={2}
                  placeholder="Observações sobre este crédito (opcional)"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Card>
          )}
        </Form>
      </Card>
    </ConfigProvider>
  );
};

export default CreditoForm;