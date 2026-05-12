// frontend/src/components/entidade/EntidadeForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Form, Input, Select, DatePicker, Button, Space, Row, Col,
  Switch, Typography, message, Tabs, Spin, theme
} from 'antd';
import {
  SaveOutlined, UserOutlined, IdcardOutlined,
  PhoneOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Text } = Typography;
const { Option } = Select;

const EntidadeForm = ({ entidade, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [usuarios, setUsuarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const { token: themeToken } = theme.useToken();
  const isDark = themeToken.colorBgContainer === '#141414' || themeToken.colorBgBase === '#000';

  useEffect(() => {
    carregarUsuarios();
  }, []);

  useEffect(() => {
    if (entidade?.id) {
      form.setFieldsValue({
        nome: entidade.nome || '',
        tipoDePessoa: entidade.tipoDePessoa || 'CLIENTE',
        classificacao: entidade.classificacao || undefined,
        ativo: entidade.ativo ?? true,
        usuario: entidade.usuario?.id || undefined,
        genero: entidade.dadosPessoais?.genero || undefined,
        estadoCivil: entidade.dadosPessoais?.estadoCivil || undefined,
        dataDeNascimento: entidade.dadosPessoais?.dataDeNascimento
          ? moment(entidade.dadosPessoais.dataDeNascimento) : null,
        nacionalidade: entidade.contacto?.nacionalidade || undefined,
        profissao: entidade.contacto?.profissao || undefined,
        localDeTrabalho: entidade.contacto?.localDeTrabalho || undefined,
        tipoDeIdentificao: entidade.identificacao?.tipoDeIdentificao || undefined,
        numeroDeIdentificao: entidade.identificacao?.numeroDeIdentificao || undefined,
        nuit: entidade.identificacao?.nuit || undefined,
        arquivoDeIdentificao: entidade.identificacao?.arquivoDeIdentificao || undefined,
        dataDeEmissao: entidade.identificacao?.dataDeEmissao
          ? moment(entidade.identificacao.dataDeEmissao) : null,
        dataDeValidade: entidade.identificacao?.dataDeValidade
          ? moment(entidade.identificacao.dataDeValidade) : null,
        telefone: entidade.contacto?.telefone || undefined,
        telefone1: entidade.contacto?.telefone1 || undefined,
        telefone2: entidade.contacto?.telefone2 || undefined,
        email: entidade.contacto?.email || undefined,
        residencia: entidade.contacto?.residencia || undefined,
      });
    } else {
      form.resetFields();
    }
  }, [entidade, form]);

  const carregarUsuarios = async () => {
    setCarregandoUsuarios(true);
    try {
      const token = localStorage.getItem('timali_token');
      const response = await fetch('http://localhost:8080/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const dados = await response.json();
        setUsuarios(Array.isArray(dados) ? dados : []);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setCarregandoUsuarios(false);
    }
  };

const handleSubmit = async (values) => {
    if (loading) return;
    setLoading(true);

    const data = {
        nome: values.nome,
        tipoDePessoa: values.tipoDePessoa,
        classificacao: values.classificacao || null,
        ativo: values.ativo ?? true,
        usuario: values.usuario ? { id: values.usuario } : null,
        dadosPessoais: {
            genero: values.genero || null,
            estadoCivil: values.estadoCivil || null,
            dataDeNascimento: values.dataDeNascimento?.format('YYYY-MM-DD') || null,
        },
        identificacao: {
            tipoDeIdentificao: values.tipoDeIdentificao || null,
            numeroDeIdentificao: values.numeroDeIdentificao || null,
            nuit: values.nuit || null,
            arquivoDeIdentificao: values.arquivoDeIdentificao || null,
            dataDeEmissao: values.dataDeEmissao?.format('YYYY-MM-DD') || null,
            dataDeValidade: values.dataDeValidade?.format('YYYY-MM-DD') || null,
        },
        contacto: {
            telefone: values.telefone || null,
            telefone1: values.telefone1 || null,
            telefone2: values.telefone2 || null,
            email: values.email || null,
            residencia: values.residencia || null,
            nacionalidade: values.nacionalidade || null,
            profissao: values.profissao || null,
            localDeTrabalho: values.localDeTrabalho || null,
        },
        id: entidade?.id,
        version: entidade?.version || 0,
    };

    console.log('📤 Enviando:', JSON.stringify(data, null, 2));

    try {
        await onSubmit(data);
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        setLoading(false);
    }
};

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: '12px 16px',
    borderRadius: 8,
    border: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
    background: isDark ? '#1f1f1f' : '#fafafa',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const tabsItems = [
    {
      key: 'basic',
      label: <Space><UserOutlined />Básico</Space>,
      children: (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="nome" label="Nome Completo" rules={[{ required: true, message: 'Nome obrigatório' }]}>
              <Input size="large" placeholder="Nome completo" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="tipoDePessoa" label="Tipo de Pessoa" rules={[{ required: true, message: 'Tipo obrigatório' }]}>
              <Select size="large">
                <Option value="CLIENTE">Cliente</Option>
                <Option value="ASSINANTE">Assinante</Option>
                <Option value="FORNECEDOR">Fornecedor</Option>
                <Option value="FUNCIONARIO">Funcionário</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="classificacao" label="Classificação">
              <Select allowClear placeholder="Selecione">
                <Option value="NAO_CLASSIFICADO">Não Classificado</Option>
                <Option value="MAU">Mau</Option>
                <Option value="REGULAR">Regular</Option>
                <Option value="BOM">Bom</Option>
                <Option value="MUITO_BOM">Muito Bom</Option>
                <Option value="EXCELENTE">Excelente</Option>
                <Option value="VIP">VIP</Option>
                <Option value="PREMIUM">Premium</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="ativo" label="Ativo" valuePropName="checked">
              <Switch checkedChildren="Sim" unCheckedChildren="Não" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="usuario" label="Usuário Gestor">
              <Select
                allowClear
                placeholder="Selecione o gestor"
                showSearch
                optionFilterProp="label"
                loading={carregandoUsuarios}
                notFoundContent={carregandoUsuarios ? <Spin size="small" /> : "Nenhum usuário"}
              >
                {usuarios.map(u => (
                  <Option key={u.id} value={u.id} label={u.nome || u.username}>
                    {u.nome || u.username}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      )
    },
    {
      key: 'personal',
      label: <Space><UserOutlined />Pessoais</Space>,
      children: (
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="genero" label="Gênero">
              <Select allowClear placeholder="Selecione">
                <Option value="MASCULINO">Masculino</Option>
                <Option value="FEMININO">Feminino</Option>
                <Option value="OUTRO">Outro</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="estadoCivil" label="Estado Civil">
              <Select allowClear placeholder="Selecione">
                <Option value="SOLTEIRO">Solteiro(a)</Option>
                <Option value="CASADO">Casado(a)</Option>
                <Option value="DIVORCIADO">Divorciado(a)</Option>
                <Option value="VIUVO">Viúvo(a)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="dataDeNascimento" label="Data de Nascimento">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Selecione a data" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="nacionalidade" label="Nacionalidade">
              <Input placeholder="Ex: Moçambicana" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="profissao" label="Profissão">
              <Input placeholder="Profissão" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="localDeTrabalho" label="Local de Trabalho">
              <Input placeholder="Local de trabalho" />
            </Form.Item>
          </Col>
        </Row>
      )
    },
    {
      key: 'identification',
      label: <Space><IdcardOutlined />Identificação</Space>,
      children: (
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="tipoDeIdentificao" label="Tipo de Identificação">
              <Select allowClear placeholder="Selecione">
                <Option value="BI">BI</Option>
                <Option value="PASSAPORTE">Passaporte</Option>
                <Option value="DIRE">DIRE</Option>
                <Option value="NUIT">NUIT</Option>
                <Option value="OUTRO">Outro</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="numeroDeIdentificao" label="Nº Identificação">
              <Input placeholder="Número do documento" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="nuit" label="NUIT">
              <Input placeholder="NUIT" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="dataDeEmissao" label="Data de Emissão">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Selecione a data" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="dataDeValidade" label="Data de Validade">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Selecione a data" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="arquivoDeIdentificao" label="Arquivo">
              <Input placeholder="Referência do arquivo" />
            </Form.Item>
          </Col>
        </Row>
      )
    },
    {
      key: 'contact',
      label: <Space><PhoneOutlined />Contactos</Space>,
      children: (
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="telefone" label="Telefone Principal">
              <Input placeholder="+258 XX XXX XXXX" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="telefone1" label="Telefone Alternativo 1">
              <Input placeholder="+258 XX XXX XXXX" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="telefone2" label="Telefone Alternativo 2">
              <Input placeholder="+258 XX XXX XXXX" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email inválido' }]}>
              <Input placeholder="email@exemplo.com" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="residencia" label="Residência">
              <Input.TextArea rows={2} placeholder="Endereço completo" />
            </Form.Item>
          </Col>
        </Row>
      )
    }
  ];

  return (
    <div style={{ padding: '24px 0', maxHeight: '70vh', overflowY: 'auto' }}>

      {/* CABEÇALHO FIXO COM ÚNICO BOTÃO SALVAR */}
      <div style={headerStyle}>
        <Space>
          <Text strong style={{ color: isDark ? '#e8e8e8' : '#262626', fontSize: 16 }}>
            {entidade?.id ? 'Editar Entidade' : 'Nova Entidade'}
          </Text>
          {entidade?.codigo && (
            <Text code style={{
              fontSize: 14,
              background: isDark ? '#111d2c' : '#e6f7ff',
              color: isDark ? '#69c0ff' : '#1890ff',
              padding: '2px 8px'
            }}>
              {entidade.codigo}
            </Text>
          )}
        </Space>
        <Space>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            disabled={loading}
            size="large"
            onClick={() => form.submit()}
          >
            {entidade?.id ? 'Atualizar Entidade' : 'Criar Entidade'}
          </Button>
        </Space>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}
        initialValues={{ ativo: true, tipoDePessoa: 'CLIENTE' }}>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          items={tabsItems}
        />
      </Form>
    </div>
  );
};

export default EntidadeForm;