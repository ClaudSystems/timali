import React, { useState, useEffect } from 'react';
import {
  Descriptions, Card, Tabs, Tag, Button, Space,
  message, Modal, Spin, Badge, Timeline
} from 'antd';
import {
  EditOutlined, SaveOutlined, CloseOutlined,
  UserOutlined, IdcardOutlined, PhoneOutlined,
  HomeOutlined, BriefcaseOutlined, FileTextOutlined
} from '@ant-design/icons';
import entidadeService from '../../services/entidadeService';
import EntidadeCompleteForm from './EntidadeCompleteForm';

const { TabPane } = Tabs;

const EntidadeView = ({ entidadeId, isModal, onClose, onUpdate }) => {
  const [entidade, setEntidade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');

  useEffect(() => {
    if (entidadeId) {
      carregarEntidade(entidadeId);
    } else if (isModal) {
      setLoading(false);
    }
  }, [entidadeId]);

  const carregarEntidade = async (id) => {
    try {
      setLoading(true);
      const data = await entidadeService.buscarPorId(id);
      setEntidade(data);
    } catch (error) {
      message.error('Erro ao carregar dados da entidade');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'NAO_CLASSIFICADO': 'default',
      'MAU': 'error',
      'REGULAR': 'warning',
      'BOM': 'success',
      'MUITO_BOM': 'green',
      'EXCELENTE': 'blue',
      'VIP': 'purple',
      'PREMIUM': 'gold'
    };
    return colors[status] || 'default';
  };

  const getTipoPessoaColor = (tipo) => {
    const colors = {
      'CLIENTE': 'blue',
      'ASSINANTE': 'green',
      'FORNECEDOR': 'orange',
      'FUNCIONARIO': 'cyan'
    };
    return colors[tipo] || 'default';
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-MZ', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  };

  const handleSave = async (values) => {
    try {
      const updatedEntidade = {
        ...entidade,
        ...values,
        id: entidade.id,
        version: entidade.version
      };

      await entidadeService.atualizar(entidade.id, updatedEntidade);
      message.success('Entidade atualizada com sucesso!');
      setEditMode(false);
      carregarEntidade(entidade.id);

      if (onUpdate) {
        onUpdate(updatedEntidade);
      }
    } catch (error) {
      message.error('Erro ao atualizar entidade');
      console.error(error);
    }
  };

  const renderPersonalInfo = () => (
    <Descriptions
      bordered
      column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
      title={
        <Space>
          <UserOutlined />
          <span>Informações Pessoais</span>
        </Space>
      }
    >
      <Descriptions.Item label="Nome Completo" span={2}>
        {entidade?.nome || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Código">
        <Tag color="blue">{entidade?.codigo || '—'}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Gênero">
        {entidade?.genero || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Estado Civil">
        {entidade?.estadoCivil || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Data de Nascimento">
        {formatDate(entidade?.dataDeNascimento)}
      </Descriptions.Item>
      <Descriptions.Item label="Nacionalidade">
        {entidade?.nacionalidade || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Profissão">
        {entidade?.profissao || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Local de Trabalho" span={2}>
        {entidade?.localDeTrabalho || '—'}
      </Descriptions.Item>
    </Descriptions>
  );

  const renderIdentificationInfo = () => (
    <Descriptions
      bordered
      column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
      title={
        <Space>
          <IdcardOutlined />
          <span>Identificação</span>
        </Space>
      }
    >
      <Descriptions.Item label="Tipo de Identificação">
        {entidade?.tipoDeIdentificao || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Nº de Identificação">
        {entidade?.numeroDeIdentificao || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="NUIT">
        {entidade?.nuit || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Data de Emissão">
        {formatDate(entidade?.dataDeEmissao)}
      </Descriptions.Item>
      <Descriptions.Item label="Data de Validade">
        {formatDate(entidade?.dataDeValidade)}
      </Descriptions.Item>
      <Descriptions.Item label="Arquivo">
        {entidade?.arquivoDeIdentificao || '—'}
      </Descriptions.Item>
    </Descriptions>
  );

  const renderContactInfo = () => (
    <Descriptions
      bordered
      column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
      title={
        <Space>
          <PhoneOutlined />
          <span>Contactos</span>
        </Space>
      }
    >
      <Descriptions.Item label="Telefone Principal">
        {entidade?.telefone || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Telefone Alternativo 1">
        {entidade?.telefone1 || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Telefone Alternativo 2">
        {entidade?.telefone2 || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Email" span={2}>
        {entidade?.email || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Residência" span={3}>
        {entidade?.residencia || '—'}
      </Descriptions.Item>
    </Descriptions>
  );

  const renderStatusInfo = () => (
    <Descriptions
      bordered
      column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
      title={
        <Space>
          <FileTextOutlined />
          <span>Status e Classificações</span>
        </Space>
      }
    >
      <Descriptions.Item label="Tipo de Pessoa">
        <Tag color={getTipoPessoaColor(entidade?.tipoDePessoa)}>
          {entidade?.tipoDePessoa || '—'}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Status">
        <Badge
          status={entidade?.ativo ? 'success' : 'error'}
          text={entidade?.ativo ? 'Ativo' : 'Inativo'}
        />
      </Descriptions.Item>
      <Descriptions.Item label="Classificação">
        <Tag color={getStatusColor(entidade?.classificacao)}>
          {entidade?.classificacao || 'Não Classificado'}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Em Dívida">
        <Tag color={entidade?.emDivida ? 'error' : 'success'}>
          {entidade?.emDivida ? 'Sim' : 'Não'}
        </Tag>
      </Descriptions.Item>
    </Descriptions>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (editMode) {
    return (
      <EntidadeCompleteForm
        entidade={entidade}
        onSave={handleSave}
        onCancel={() => setEditMode(false)}
        isModal={isModal}
      />
    );
  }

  const content = (
    <>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setEditMode(true)}
          >
            Completar/Editar Dados
          </Button>
          {isModal && (
            <Button icon={<CloseOutlined />} onClick={onClose}>
              Fechar
            </Button>
          )}
        </Space>
      </div>

      <Tabs
        activeKey={activeSection}
        onChange={setActiveSection}
        type="card"
      >
        <TabPane tab="Dados Pessoais" key="personal">
          {renderPersonalInfo()}
        </TabPane>
        <TabPane tab="Identificação" key="identification">
          {renderIdentificationInfo()}
        </TabPane>
        <TabPane tab="Contactos" key="contacts">
          {renderContactInfo()}
        </TabPane>
        <TabPane tab="Status" key="status">
          {renderStatusInfo()}
        </TabPane>
      </Tabs>

      <div style={{ marginTop: 16, padding: 12, background: '#f0f2f5', borderRadius: 6 }}>
        <Timeline>
          <Timeline.Item color="blue">
            Criado em: {formatDate(entidade?.dateCreated)}
          </Timeline.Item>
          <Timeline.Item color="green">
            Última atualização: {formatDate(entidade?.lastUpdated)}
          </Timeline.Item>
        </Timeline>
      </div>
    </>
  );

  if (isModal) {
    return (
      <Modal
        title={`Entidade: ${entidade?.nome || 'Nova'}`}
        visible={true}
        onCancel={onClose}
        footer={null}
        width={1000}
        destroyOnClose
      >
        {content}
      </Modal>
    );
  }

  return (
    <Card title={`Entidade: ${entidade?.nome || ''}`}>
      {content}
    </Card>
  );
};

export default EntidadeView;