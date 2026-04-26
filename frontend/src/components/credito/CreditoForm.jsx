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
  Typography
} from 'antd';
import { SearchOutlined, SaveOutlined, RollbackOutlined, InfoCircleOutlined } from '@ant-design/icons';
import creditoService from '../../services/creditoService';
import moment from 'moment';
import ptBR from 'antd/es/locale/pt_BR';
import 'moment/locale/pt-br';

moment.locale('pt-br');

const { TextArea } = Input;
const { Text } = Typography;

const CreditoForm = () => {
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
        title="Novo Crédito"
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
        >
          {/* ============================================================ */}
          {/* SEÇÃO 1: BUSCA DO CLIENTE                                   */}
          {/* ============================================================ */}
          <Divider orientation="left">Cliente</Divider>

          <Form.Item
            label="Buscar Cliente"
            required
            tooltip="Digite pelo menos 2 caracteres para buscar"
          >
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
            />
          </Form.Item>

          {/* Dados do cliente (visualização) */}
          {clienteSelecionado && (
            <Alert
              message="Cliente Selecionado"
              description={
                <Row gutter={16}>
                  <Col span={8}>
                    <Text type="secondary">Código:</Text><br />
                    <Text strong>{clienteSelecionado.codigo || 'N/A'}</Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">Nome:</Text><br />
                    <Text strong>{clienteSelecionado.nome || 'N/A'}</Text>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary">Documento:</Text><br />
                    <Text strong>{clienteSelecionado.numero_de_identificao || clienteSelecionado.nuit || 'N/A'}</Text>
                  </Col>
                </Row>
              }
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Form.Item name="entidadeId" hidden>
            <Input />
          </Form.Item>

          {/* ============================================================ */}
          {/* SEÇÃO 2: CONFIGURAÇÃO DO CRÉDITO                            */}
          {/* ============================================================ */}
          <Divider orientation="left">Configuração do Crédito</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Usar Definição Pré-configurada"
                valuePropName="checked"
                tooltip="Ative para usar uma definição já cadastrada"
              >
                <Switch
                  checked={usarDefinicao}
                  onChange={handleUsarDefinicaoChange}
                  checkedChildren="Sim"
                  unCheckedChildren="Não - Personalizar"
                />
              </Form.Item>
            </Col>
          </Row>

          {usarDefinicao && (
            <Form.Item
              name="definicaoCreditoId"
              label="Definição de Crédito"
              rules={[{ required: usarDefinicao, message: 'Selecione uma definição' }]}
            >
              <Select
                placeholder="Selecione uma definição de crédito"
                onChange={handleDefinicaoChange}
                loading={loadingDefinicoes}
                options={opcoesDefinicoes}
                size="large"
              />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="valorConcedido"
                label="Valor Concedido (MT)"
                rules={[{ required: true, message: 'Informe o valor' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  size="large"
                  placeholder="0,00"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="numeroDePrestacoes"
                label="Número de Prestações"
                rules={[{ required: true, message: 'Informe o número de prestações' }]}
                extra={definicaoSelecionada ? `Máximo permitido: ${definicaoSelecionada.numeroDePrestacoes}` : ''}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={definicaoSelecionada?.numeroDePrestacoes || 360}
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
                <Select disabled={usarDefinicao} size="large" placeholder="Selecione a periodicidade">
                  <Select.Option value="MENSAL">Mensal</Select.Option>
                  <Select.Option value="QUINZENAL">Quinzenal</Select.Option>
                  <Select.Option value="SEMANAL">Semanal</Select.Option>
                  <Select.Option value="DIARIO">Diário</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="percentualDeJuros"
                label="Taxa de Juros (%)"
                rules={[{ required: true, message: 'Informe a taxa de juros' }]}
                tooltip="Percentual de juros ao mês"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  precision={4}
                  disabled={usarDefinicao}
                  size="large"
                  placeholder="0,00"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="formaDeCalculo"
                label="Forma de Cálculo"
                rules={[{ required: true, message: 'Selecione a forma de cálculo' }]}
              >
                <Select disabled={usarDefinicao} size="large" placeholder="Selecione a forma de cálculo">
                  <Select.Option value="TAXA_FIXA">Taxa Fixa</Select.Option>
                  <Select.Option value="PMT">PMT - Prestações Fixas</Select.Option>
                  <Select.Option value="JUROS_SIMPLES">Juros Simples</Select.Option>
                  <Select.Option value="JUROS_COMPOSTOS">Juros Compostos</Select.Option>
                  <Select.Option value="SAC">SAC - Amortização Constante</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="percentualJurosDeDemora"
                label="Juros de Demora (%)"
                tooltip="Percentual de juros por atraso"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  precision={4}
                  disabled={usarDefinicao}
                  size="large"
                  placeholder="0,00"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ============================================================ */}
          {/* SEÇÃO 3: DATA DE CONCESSÃO                                  */}
          {/* ============================================================ */}
          <Divider orientation="left">Data de Concessão</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dataEmissao"
                label="Data de Concessão/Desembolso"
                rules={[{ required: true, message: 'Selecione a data' }]}
                extra="Data em que o crédito foi concedido."
                getValueFromEvent={(date) => date}
                getValueProps={(value) => ({ value: value || moment() })}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  size="large"
                  disabledDate={(current) => {
                    return current && current.isAfter(moment(), 'day')
                  }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Alert
                message="Como funciona?"
                description="O primeiro vencimento será calculado automaticamente baseado na data de concessão + periodicidade selecionada."
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
              />
            </Col>
          </Row>

          {/* ============================================================ */}
          {/* SEÇÃO 4: INFORMAÇÕES ADICIONAIS                             */}
          {/* ============================================================ */}
          <Divider orientation="left">Informações Adicionais</Divider>

          <Form.Item name="descricao" label="Descrição/Observações">
            <TextArea
              rows={3}
              placeholder="Observações sobre este crédito (opcional)"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="ignorarPagamentosNoPrazo"
                label="Ignorar pagamentos no prazo para cálculo de mora"
                valuePropName="checked"
                tooltip="Se ativo, calcula mora sobre o valor total da parcela mesmo com pagamentos parciais"
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

export default CreditoForm;