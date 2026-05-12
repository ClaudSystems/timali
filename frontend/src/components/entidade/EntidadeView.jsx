// frontend/src/components/entidade/EntidadeView.jsx
import React, { useState, useEffect } from 'react';
import {
  Descriptions, Card, Tabs, Tag, Button, Space,
  message, Modal, Spin, Badge, Upload,
  List, Popconfirm, Select, Input, Typography, Empty
} from 'antd';
import {
  EditOutlined, CloseOutlined,
  UserOutlined, IdcardOutlined, PhoneOutlined,
  FileTextOutlined, UploadOutlined, DownloadOutlined,
  DeleteOutlined, FileOutlined,
  PaperClipOutlined, FilePdfOutlined, FileImageOutlined
} from '@ant-design/icons';
import EntidadeForm from './EntidadeForm';
import entidadeService from '../../services/entidadeService';

const { Text } = Typography;
const { Option } = Select;

const EntidadeView = ({ entidadeId, isModal, onClose, onUpdate }) => {
  const [entidade, setEntidade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  // Documentos
  const [documentos, setDocumentos] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadTipo, setUploadTipo] = useState('OUTRO');
  const [uploadDescricao, setUploadDescricao] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (entidadeId) carregarEntidade(entidadeId);
  }, [entidadeId]);

  useEffect(() => {
    if (entidade?.id && !editMode) carregarDocumentos();
  }, [entidade?.id, editMode]);

  const carregarEntidade = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('timali_token');
      const response = await fetch(`http://localhost:8080/api/entidades/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao carregar');
      const data = await response.json();
      setEntidade(data);
    } catch (error) {
      message.error('Erro ao carregar entidade');
    } finally {
      setLoading(false);
    }
  };

  const carregarDocumentos = async () => {
    setLoadingDocs(true);
    try {
      const token = localStorage.getItem('timali_token');
      const response = await fetch(`http://localhost:8080/api/documentos?entidadeId=${entidade.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const dados = await response.json();
        setDocumentos(dados);
      }
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSave = async (values) => {
    try {
      await entidadeService.atualizar(entidade.id, values);
      message.success('Entidade atualizada com sucesso!');
      setEditMode(false);
      carregarEntidade(entidade.id);
      if (onUpdate) onUpdate();
    } catch (error) {
      message.error('Erro ao atualizar: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const token = localStorage.getItem('timali_token');
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('entidadeId', entidade.id);
      formData.append('tipo', uploadTipo);
      formData.append('descricao', uploadDescricao);

      const response = await fetch('http://localhost:8080/api/documentos/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        message.success('Documento enviado!');
        carregarDocumentos();
        setUploadTipo('OUTRO');
        setUploadDescricao('');
      } else {
        message.error('Erro ao enviar documento');
      }
    } catch (err) {
      message.error('Erro de conexão');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleDownload = async (documentoId, nomeOriginal) => {
    try {
      const token = localStorage.getItem('timali_token');
      const response = await fetch(`http://localhost:8080/api/documentos/${documentoId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeOriginal;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      message.error('Erro ao baixar');
    }
  };

  const handleDeleteDoc = async (documentoId) => {
    try {
      const token = localStorage.getItem('timali_token');
      const response = await fetch(`http://localhost:8080/api/documentos/${documentoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        message.success('Documento excluído!');
        carregarDocumentos();
      }
    } catch (err) {
      message.error('Erro ao excluir');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (extensao, tipo) => {
    if (tipo === 'FOTO' || ['jpg', 'jpeg', 'png', 'gif'].includes(extensao)) {
      return <FileImageOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
    }
    if (extensao === 'pdf') {
      return <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
    }
    return <FileOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'NAO_CLASSIFICADO': 'default', 'MAU': 'error', 'REGULAR': 'warning',
      'BOM': 'success', 'MUITO_BOM': 'green', 'EXCELENTE': 'blue',
      'VIP': 'purple', 'PREMIUM': 'gold'
    };
    return colors[status] || 'default';
  };

  const getTipoPessoaColor = (tipo) => {
    const colors = { 'CLIENTE': 'blue', 'ASSINANTE': 'green', 'FORNECEDOR': 'orange', 'FUNCIONARIO': 'cyan' };
    return colors[tipo] || 'default';
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-MZ', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });
  };

  // ===== SEÇÕES DE VISUALIZAÇÃO =====

  const renderBasicInfo = () => (
    <Descriptions bordered column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
      title={<Space><UserOutlined /><span>Informações Básicas</span></Space>}>
      <Descriptions.Item label="Nome" span={2}>{entidade?.nome || '—'}</Descriptions.Item>
      <Descriptions.Item label="Código">
        <Tag color="blue">{entidade?.codigo || '—'}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Tipo de Pessoa">
        <Tag color={getTipoPessoaColor(entidade?.tipoDePessoa)}>{entidade?.tipoDePessoa || '—'}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Classificação">
        <Tag color={getStatusColor(entidade?.classificacao)}>{entidade?.classificacao || '—'}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Status">
        <Badge status={entidade?.ativo ? 'success' : 'error'} text={entidade?.ativo ? 'Ativo' : 'Inativo'} />
      </Descriptions.Item>
      <Descriptions.Item label="Usuário Gestor">
        {entidade?.usuario?.nome || entidade?.usuario?.username || '—'}
      </Descriptions.Item>
    </Descriptions>
  );

  const renderPersonalInfo = () => {
    const dp = entidade?.dadosPessoais;
    const ct = entidade?.contacto;
    return (
      <Descriptions bordered column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        title={<Space><UserOutlined /><span>Dados Pessoais</span></Space>}>
        <Descriptions.Item label="Gênero">{dp?.genero || '—'}</Descriptions.Item>
        <Descriptions.Item label="Estado Civil">{dp?.estadoCivil || '—'}</Descriptions.Item>
        <Descriptions.Item label="Data de Nascimento">{formatDate(dp?.dataDeNascimento)}</Descriptions.Item>
        <Descriptions.Item label="Nacionalidade">{ct?.nacionalidade || '—'}</Descriptions.Item>
        <Descriptions.Item label="Profissão">{ct?.profissao || '—'}</Descriptions.Item>
        <Descriptions.Item label="Local de Trabalho">{ct?.localDeTrabalho || '—'}</Descriptions.Item>
      </Descriptions>
    );
  };

  const renderIdentificationInfo = () => {
    const ident = entidade?.identificacao;
    return (
      <Descriptions bordered column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        title={<Space><IdcardOutlined /><span>Identificação</span></Space>}>
        <Descriptions.Item label="Tipo">{ident?.tipoDeIdentificao || '—'}</Descriptions.Item>
        <Descriptions.Item label="Número">{ident?.numeroDeIdentificao || '—'}</Descriptions.Item>
        <Descriptions.Item label="NUIT">{ident?.nuit || '—'}</Descriptions.Item>
        <Descriptions.Item label="Data de Emissão">{formatDate(ident?.dataDeEmissao)}</Descriptions.Item>
        <Descriptions.Item label="Data de Validade">{formatDate(ident?.dataDeValidade)}</Descriptions.Item>
        <Descriptions.Item label="Arquivo">{ident?.arquivoDeIdentificao || '—'}</Descriptions.Item>
      </Descriptions>
    );
  };

  const renderContactInfo = () => {
    const ct = entidade?.contacto;
    return (
      <Descriptions bordered column={{ xxl: 3, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        title={<Space><PhoneOutlined /><span>Contactos</span></Space>}>
        <Descriptions.Item label="Telefone">{ct?.telefone || '—'}</Descriptions.Item>
        <Descriptions.Item label="Tel. Alt 1">{ct?.telefone1 || '—'}</Descriptions.Item>
        <Descriptions.Item label="Tel. Alt 2">{ct?.telefone2 || '—'}</Descriptions.Item>
        <Descriptions.Item label="Email" span={2}>{ct?.email || '—'}</Descriptions.Item>
        <Descriptions.Item label="Residência" span={3}>{ct?.residencia || '—'}</Descriptions.Item>
      </Descriptions>
    );
  };

  const renderDocumentos = () => (
    <div>
      <Card title={<Space><UploadOutlined /><span>Upload</span></Space>} style={{ marginBottom: 24 }} size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <Select value={uploadTipo} onChange={setUploadTipo} style={{ width: 200 }}>
              <Option value="BI">BI</Option>
              <Option value="PASSAPORTE">Passaporte</Option>
              <Option value="FOTO">Foto</Option>
              <Option value="CONTRATO">Contrato</Option>
              <Option value="OUTRO">Outro</Option>
            </Select>
            <Upload beforeUpload={handleUpload} showUploadList={false}>
              <Button icon={<UploadOutlined />} loading={uploading} type="primary">Selecionar</Button>
            </Upload>
          </Space>
          <Input.TextArea value={uploadDescricao} onChange={e => setUploadDescricao(e.target.value)}
            placeholder="Descrição (opcional)" rows={2} style={{ maxWidth: 400 }} />
        </Space>
      </Card>

      <Card title={<Space><PaperClipOutlined /><span>Documentos ({documentos.length})</span></Space>}>
        {loadingDocs ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
        ) : documentos.length === 0 ? (
          <Empty description="Nenhum documento" />
        ) : (
          <List dataSource={documentos} renderItem={doc => (
            <List.Item actions={[
              <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(doc.id, doc.nomeOriginal)}>Download</Button>,
              <Popconfirm title="Excluir?" onConfirm={() => handleDeleteDoc(doc.id)}>
                <Button type="link" danger icon={<DeleteOutlined />}>Excluir</Button>
              </Popconfirm>
            ]}>
              <List.Item.Meta
                avatar={getFileIcon(doc.extensao, doc.tipo)}
                title={<Space><Text strong>{doc.nomeOriginal}</Text><Tag color="blue">{doc.tipo}</Tag></Space>}
                description={
                  <Space split={<Text type="secondary">•</Text>}>
                    <Text type="secondary">{formatBytes(doc.tamanho)}</Text>
                    <Text type="secondary">{doc.dataUpload}</Text>
                    {doc.descricao && <Text type="secondary">{doc.descricao}</Text>}
                  </Space>
                }
              />
            </List.Item>
          )} />
        )}
      </Card>
    </div>
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  }

  // 👇 SE ESTIVER EM MODO EDIÇÃO, MOSTRA O FORMULÁRIO
  if (editMode) {
    return (
      <EntidadeForm
        entidade={entidade}
        onSubmit={handleSave}
        onCancel={() => setEditMode(false)}
      />
    );
  }

  const content = (
    <>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => setEditMode(true)}>
            Editar Dados
          </Button>
          {isModal && (
            <Button icon={<CloseOutlined />} onClick={onClose}>Fechar</Button>
          )}
        </Space>
      </div>

      <Tabs activeKey={activeSection} onChange={setActiveSection} type="card"
        items={[
          { key: 'basic', label: <Space><UserOutlined />Básico</Space>, children: renderBasicInfo() },
          { key: 'personal', label: <Space><UserOutlined />Pessoais</Space>, children: renderPersonalInfo() },
          { key: 'identification', label: <Space><IdcardOutlined />Identificação</Space>, children: renderIdentificationInfo() },
          { key: 'contacts', label: <Space><PhoneOutlined />Contactos</Space>, children: renderContactInfo() },
          { key: 'documents', label: <Space><PaperClipOutlined />Documentos</Space>, children: renderDocumentos() },
        ]}
      />
    </>
  );

  if (isModal) {
    return (
      <Modal title={entidade?.nome || 'Detalhes'} open={true} onCancel={onClose} footer={null} width={1000} destroyOnHidden>
        {content}
      </Modal>
    );
  }

  return <Card title={entidade?.nome || 'Detalhes'}>{content}</Card>;
};

export default EntidadeView;