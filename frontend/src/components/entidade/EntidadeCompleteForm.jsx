import React, { useState, useEffect } from 'react';
import {
  Form, Input, Select, DatePicker, Button, Space,
  Row, Col, Divider, Switch, Card, message, InputNumber
} from 'antd';
import {
  SaveOutlined, CloseOutlined, UserOutlined,
  IdcardOutlined, PhoneOutlined, FileTextOutlined
} from '@ant-design/icons';
import entidadeService from '../../services/entidadeService';
import moment from 'moment';
import { formatPhone, formatNuit, formatBI } from '../../utils/formatters';

const { Option } = Select;
const { TextArea } = Input;

const EntidadeCompleteForm = ({ entidade, onSave, onCancel, isModal }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [codigoDisponivel, setCodigoDisponivel] = useState(true);

  useEffect(() => {
    if (entidade) {
      form.setFieldsValue({
        ...entidade,
        dataDeNascimento: entidade.dataDeNascimento ? moment(entidade.dataDeNascimento) : null,
        dataDeEmissao: entidade.dataDeEmissao ? moment(entidade.dataDeEmissao) : null,
        dataDeValidade: entidade.dataDeValidade ? moment(entidade.dataDeValidade) : null,
      });
    }
  }, [entidade]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const formattedValues = {
        ...values,
        dataDeNascimento: values.dataDeNascimento?.format('YYYY-MM-DD'),
        dataDeEmissao: values.dataDeEmissao?.format('YYYY-MM-DD'),
        dataDeValidade: values.dataDeValidade?.format('YYYY-MM-DD'),
        id: entidade?.id,
        version: entidade?.version
      };

      await onSave(formattedValues);
    } catch (error) {
      message.error('Erro ao salvar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const verificarCodigo = async (codigo) => {
    if (!codigo || codigo === entidade?.codigo) {
      setCodigoDisponivel(true);
      return;
    }
    try {
      const disponivel = await entidadeService.verificarCodigo(codigo);
      setCodigoDisponivel(disponivel);
    } catch (error) {
      console.error('Erro ao verificar código:', error);
    }
  };

  const renderPersonalSection = () => (
    <Card
      title={<><UserOutlined /> Dados Pessoais</>}
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="nome"
            label="Nome Completo"
            rules={[{ required: true, message: 'Nome é obrigatório' }]}
          >
            <Input placeholder="Nome completo da entidade" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item
            name="genero"
            label="Gênero"
          >
            <Select placeholder="Selecione o gênero">
              {['MASCULINO', 'FEMININO', 'OUTRO', 'PREFIRO_NAO_DIZER'].map(genero => (
                <Option key={genero} value={genero}>{genero}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item
            name="estadoCivil"
            label="Estado Civil"
          >
            <Select placeholder="Selecione">
              {['SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'UNIAO_ESTAVEL', 'SEPARADO'].map(estado => (
                <Option key={estado} value={estado}>{estado}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="dataDeNascimento" label="Data de Nascimento">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
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
      </Row>

      <Form.Item name="localDeTrabalho" label="Local de Trabalho">
        <Input placeholder="Empresa ou local de trabalho" />
      </Form.Item>
    </Card>
  );

  const renderIdentificationSection = () => (
    <Card
      title={<><IdcardOutlined /> Identificação</>}
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="tipoDeIdentificao" label="Tipo de Identificação">
            <Select placeholder="Tipo de documento">
              {['BI', 'PASSAPORTE', 'CEDULA', 'CARTAO_ELEITOR', 'DIRE', 'NUIT', 'OUTRO'].map(tipo => (
                <Option key={tipo} value={tipo}>{tipo}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="numeroDeIdentificao" label="Nº de Identificação">
            <Input
              placeholder="Número do documento"
              onChange={(e) => {
                if (form.getFieldValue('tipoDeIdentificao') === 'BI') {
                  form.setFieldsValue({
                    numeroDeIdentificao: formatBI(e.target.value)
                  });
                }
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="nuit" label="NUIT">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="NUIT"
              formatter={value => formatNuit(value)}
              parser={value => value.replace(/\D/g, '')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item name="dataDeEmissao" label="Data de Emissão">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="dataDeValidade" label="Data de Validade">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="arquivoDeIdentificao" label="Arquivo">
            <Input placeholder="Referência do arquivo" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderContactSection = () => (
    <Card
      title={<><PhoneOutlined /> Contactos</>}
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Form.Item
            name="telefone"
            label="Telefone Principal"
            getValueFromEvent={e => formatPhone(e.target.value)}
          >
            <Input placeholder="+258 XX XXX XXXX" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="telefone1" label="Telefone Alternativo 1">
            <Input
              placeholder="+258 XX XXX XXXX"
              onChange={e => form.setFieldsValue({
                telefone1: formatPhone(e.target.value)
              })}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="telefone2" label="Telefone Alternativo 2">
            <Input
              placeholder="+258 XX XXX XXXX"
              onChange={e => form.setFieldsValue({
                telefone2: formatPhone(e.target.value)
              })}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Email inválido' }]}
          >
            <Input placeholder="email@exemplo.com" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="residencia" label="Residência">
            <TextArea rows={2} placeholder="Endereço completo" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderStatusSection = () => (
    <Card
      title={<><FileTextOutlined /> Status e Classificação</>}
      style={{ marginBottom: 16 }}
    >
      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Form.Item name="tipoDePessoa" label="Tipo de Pessoa">
            <Select placeholder="Tipo de pessoa">
              {['CLIENTE', 'ASSINANTE', 'FORNECEDOR', 'FUNCIONARIO'].map(tipo => (
                <Option key={tipo} value={tipo}>{tipo}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item name="classificacao" label="Classificação">
            <Select placeholder="Classificação">
              {['NAO_CLASSIFICADO', 'MAU', 'REGULAR', 'BOM', 'MUITO_BOM', 'EXCELENTE', 'VIP', 'PREMIUM'].map(klass => (
                <Option key={klass} value={klass}>{klass}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item name="ativo" label="Ativo" valuePropName="checked">
            <Switch checkedChildren="Sim" unCheckedChildren="Não" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={6}>
          <Form.Item name="emDivida" label="Em Dívida" valuePropName="checked">
            <Switch checkedChildren="Sim" unCheckedChildren="Não" />
          </Form.Item>
        </Col>
      </Row>

      {!entidade?.id && (
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="codigo"
              label="Código"
              rules={[
                { max: 6, message: 'Máximo 6 caracteres' }
              ]}
              validateStatus={codigoDisponivel ? 'success' : 'error'}
              help={codigoDisponivel ? '' : 'Código já em uso'}
            >
              <Input
                placeholder="Gerado automaticamente"
                onChange={e => verificarCodigo(e.target.value)}
              />
            </Form.Item>
          </Col>
        </Row>
      )}
    </Card>
  );

  const formContent = (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        ativo: true,
        emDivida: false,
        classificacao: 'NAO_CLASSIFICADO',
        tipoDePessoa: entidade?.tipoDePessoa || 'CLIENTE'
      }}
    >
      {renderPersonalSection()}
      {renderIdentificationSection()}
      {renderContactSection()}
      {renderStatusSection()}

      <div style={{ textAlign: 'right', marginTop: 24 }}>
        <Space>
          <Button icon={<CloseOutlined />} onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
          >
            {entidade?.id ? 'Atualizar Entidade' : 'Criar Entidade'}
          </Button>
        </Space>
      </div>
    </Form>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div style={{ padding: '0 24px' }}>
      {formContent}
    </div>
  );
};

export default EntidadeCompleteForm;