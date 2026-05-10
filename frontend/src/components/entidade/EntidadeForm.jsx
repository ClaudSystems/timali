// frontend/src/components/entidade/EntidadeForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Form, Input, Select, DatePicker, Button, Space, Row, Col, Divider,
  Switch, Card, Typography, message, Alert, Spin
} from 'antd';
import {
  SaveOutlined, CloseOutlined, UserOutlined, IdcardOutlined,
  PhoneOutlined, FileTextOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const EntidadeForm = ({ entidade, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  useEffect(() => {
    if (entidade?.id) {
      console.log('📋 Carregando entidade:', entidade.nome);

      form.setFieldsValue({
        nome: entidade.nome || '',
        tipoDePessoa: entidade.tipoDePessoa || 'CLIENTE',
        classificacao: entidade.classificacao || undefined,
        genero: entidade.genero || undefined,
        estadoCivil: entidade.estadoCivil || undefined,
        tipoDeIdentificao: entidade.tipoDeIdentificao || undefined,
        email: entidade.email || undefined,
        telefone: entidade.telefone || undefined,
        telefone1: entidade.telefone1 || undefined,
        telefone2: entidade.telefone2 || undefined,
        nacionalidade: entidade.nacionalidade || undefined,
        profissao: entidade.profissao || undefined,
        localDeTrabalho: entidade.localDeTrabalho || undefined,
        residencia: entidade.residencia || undefined,
        nuit: entidade.nuit || undefined,
        numeroDeIdentificao: entidade.numeroDeIdentificao || undefined,
        arquivoDeIdentificao: entidade.arquivoDeIdentificao || undefined,
        dataDeEmissao: entidade.dataDeEmissao ? moment(entidade.dataDeEmissao) : null,
        dataDeValidade: entidade.dataDeValidade ? moment(entidade.dataDeValidade) : null,
        dataDeNascimento: entidade.dataDeNascimento ? moment(entidade.dataDeNascimento) : null,
        ativo: entidade.ativo ?? true,
        emDivida: entidade.emDivida ?? false,
        usuarioId: entidade.usuario?.id || undefined,
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
      console.error('Erro usuários:', err);
      setUsuarios([
        { id: 1, username: 'admin', nome: 'Administrador' },
        { id: 2, username: 'gerente', nome: 'Gerente' },
        { id: 3, username: 'caixa', nome: 'Caixa' },
      ]);
    } finally {
      setCarregandoUsuarios(false);
    }
  };

  const handleSubmit = (values) => {
    console.log('📤 VALORES:', JSON.stringify(values, null, 2));

    setLoading(true);

    const dataToSubmit = {
      nome: values.nome,
      tipoDePessoa: values.tipoDePessoa,
      classificacao: values.classificacao || null,
      genero: values.genero || null,
      estadoCivil: values.estadoCivil || null,
      tipoDeIdentificao: values.tipoDeIdentificao || null,
      email: values.email || null,
      telefone: values.telefone || null,
      telefone1: values.telefone1 || null,
      telefone2: values.telefone2 || null,
      nacionalidade: values.nacionalidade || null,
      profissao: values.profissao || null,
      localDeTrabalho: values.localDeTrabalho || null,
      residencia: values.residencia || null,
      nuit: values.nuit || null,
      numeroDeIdentificao: values.numeroDeIdentificao || null,
      arquivoDeIdentificao: values.arquivoDeIdentificao || null,
      dataDeEmissao: values.dataDeEmissao?.format?.('YYYY-MM-DD') || null,
      dataDeValidade: values.dataDeValidade?.format?.('YYYY-MM-DD') || null,
      dataDeNascimento: values.dataDeNascimento?.format?.('YYYY-MM-DD') || null,
      ativo: values.ativo ?? true,
      emDivida: values.emDivida ?? false,
      usuarioId: values.usuarioId || null,
      id: entidade?.id,
      version: entidade?.version || 0,
    };

    console.log('📤 ENVIANDO:', JSON.stringify(dataToSubmit, null, 2));
    onSubmit(dataToSubmit);
    setLoading(false);
  };

  return (
    <div style={{ padding: '24px 0', maxHeight: '70vh', overflowY: 'auto' }}>
      <Title level={4}>{entidade ? 'Editar Entidade' : 'Nova Entidade'}</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          ativo: true,
          emDivida: false,
          tipoDePessoa: 'CLIENTE'
        }}
      >
        {/* Código (se editando) */}
        {entidade?.codigo && (
          <Alert
            type="info"
            showIcon={false}
            style={{ marginBottom: 24 }}
            title={
              <Space>
                <Text strong>Código:</Text>
                <Text code style={{ fontSize: 16 }}>{entidade.codigo}</Text>
                <Text type="secondary">(gerado automaticamente)</Text>
              </Space>
            }
          />
        )}

        {/* ===== INFORMAÇÕES BÁSICAS ===== */}
        <Card title={<Space><UserOutlined /> Informações Básicas</Space>} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="nome" label="Nome Completo" rules={[{ required: true, message: 'Nome obrigatório' }]}>
                <Input prefix={<UserOutlined />} placeholder="Nome completo" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="tipoDePessoa" label="Tipo de Pessoa" rules={[{ required: true, message: 'Tipo obrigatório' }]}>
                <Select placeholder="Selecione o tipo" size="large">
                  <Option value="CLIENTE">Cliente</Option>
                  <Option value="ASSINANTE">Assinante</Option>
                  <Option value="FORNECEDOR">Fornecedor</Option>
                  <Option value="FUNCIONARIO">Funcionário</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="classificacao" label="Classificação">
                <Select placeholder="Selecione" allowClear>
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
              <Form.Item name="genero" label="Gênero">
                <Select placeholder="Selecione" allowClear>
                  <Option value="MASCULINO">Masculino</Option>
                  <Option value="FEMININO">Feminino</Option>
                  <Option value="OUTRO">Outro</Option>
                  <Option value="PREFIRO_NAO_DIZER">Prefiro não dizer</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="estadoCivil" label="Estado Civil">
                <Select placeholder="Selecione" allowClear>
                  <Option value="SOLTEIRO">Solteiro(a)</Option>
                  <Option value="CASADO">Casado(a)</Option>
                  <Option value="DIVORCIADO">Divorciado(a)</Option>
                  <Option value="VIUVO">Viúvo(a)</Option>
                  <Option value="UNIAO_ESTAVEL">União Estável</Option>
                  <Option value="SEPARADO">Separado(a)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dataDeNascimento" label="Data de Nascimento">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="nacionalidade" label="Nacionalidade">
                <Input placeholder="Ex: Moçambicana" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="profissao" label="Profissão">
                <Input placeholder="Profissão" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="localDeTrabalho" label="Local de Trabalho">
                <Input placeholder="Empresa ou local de trabalho" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ===== DOCUMENTAÇÃO ===== */}
        <Card title={<Space><IdcardOutlined /> Documentação</Space>} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="tipoDeIdentificao" label="Tipo de Identificação">
                <Select placeholder="Selecione" allowClear>
                  <Option value="BI">Bilhete de Identidade (BI)</Option>
                  <Option value="PASSAPORTE">Passaporte</Option>
                  <Option value="CEDULA">Cédula Pessoal</Option>
                  <Option value="CARTAO_ELEITOR">Cartão de Eleitor</Option>
                  <Option value="DIRE">DIRE</Option>
                  <Option value="NUIT">NUIT</Option>
                  <Option value="OUTRO">Outro</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="numeroDeIdentificao" label="Número de Identificação">
                <Input placeholder="Número do documento" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="nuit" label="NUIT">
                <Input placeholder="Número do NUIT" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="arquivoDeIdentificao" label="Arquivo">
                <Input placeholder="Referência do arquivo" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dataDeEmissao" label="Data de Emissão">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="dataDeValidade" label="Data de Validade">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ===== CONTATO ===== */}
        <Card title={<Space><PhoneOutlined /> Contato</Space>} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="telefone" label="Telefone Principal">
                <Input prefix={<PhoneOutlined />} placeholder="+258 XX XXX XXXX" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email inválido' }]}>
                <Input placeholder="email@exemplo.com" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="telefone1" label="Telefone Alternativo 1">
                <Input placeholder="+258 XX XXX XXXX" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="telefone2" label="Telefone Alternativo 2">
                <Input placeholder="+258 XX XXX XXXX" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="residencia" label="Residência">
                <TextArea rows={2} placeholder="Endereço completo" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ===== STATUS ===== */}
        <Card title={<Space><FileTextOutlined /> Status</Space>} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="ativo" label="Ativo" valuePropName="checked">
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="emDivida" label="Em Dívida" valuePropName="checked">
                <Switch checkedChildren="Sim" unCheckedChildren="Não" disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="usuarioId" label="Usuário Gestor">
                <Select
                  placeholder="Selecione"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent={carregandoUsuarios ? <Spin size="small" /> : "Nenhum"}
                >
                  {usuarios.map(u => (
                    <Option key={u.id} value={u.id}>{u.nome || u.username}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* BOTÕES */}
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onCancel} icon={<CloseOutlined />}>Cancelar</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading} size="large">
            {entidade ? 'Atualizar' : 'Salvar'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default EntidadeForm;