// frontend/src/components/entidade/EntidadeView.jsx
import React, { useState, useEffect } from 'react';
import pdfService from '../../services/pdfService';
import {
  Descriptions, Card, Tabs, Tag, Button, Space,
  message, Modal, Spin, Badge, Upload,
  Popconfirm, Select, Input, Typography, Empty
} from 'antd';
import {
  EditOutlined, CloseOutlined,
  UserOutlined, IdcardOutlined, PhoneOutlined,
  UploadOutlined, DownloadOutlined,
  DeleteOutlined, FileOutlined,
  PaperClipOutlined, FilePdfOutlined, FileImageOutlined,
  FileTextOutlined, PrinterOutlined
} from '@ant-design/icons';
import EntidadeForm from './EntidadeForm';
import EntidadeFicha from './EntidadeFicha';
import entidadeService from '../../services/entidadeService';

const { Text } = Typography;
const { Option } = Select;

const EntidadeView = ({ entidadeId, isModal, onClose, onUpdate }) => {
  // TODOS os hooks AQUI no topo, SEMPRE na mesma ordem
  const [fotoDocumento, setFotoDocumento] = useState(null);
  const [entidade, setEntidade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [fichaVisible, setFichaVisible] = useState(false);
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
    if (!entidade?.id) return;
    setLoadingDocs(true);
    try {
      const token = localStorage.getItem('timali_token');
      const response = await fetch(`http://localhost:8080/api/documentos?entidadeId=${entidade.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const dados = await response.json();
        setDocumentos(dados);

        const foto = dados.find(d => d.tipo === 'FOTO');
        if (foto) {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', `http://localhost:8080/api/documentos/${foto.id}/download`, true);
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.responseType = 'blob';
          xhr.onload = () => {
            if (xhr.status === 200) {
              setFotoDocumento({ ...foto, imageUrl: URL.createObjectURL(xhr.response) });
            }
          };
          xhr.send();
        } else {
          setFotoDocumento(null);
        }
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
      message.success('Entidade atualizada!');
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
      a.download = nomeOriginal || 'documento';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      message.error('Erro ao baixar');
    }
  };

  const handleDeleteDoc = async (documentoId) => {
    try {
      const token = localStorage.getItem('timali_token');
      await fetch(`http://localhost:8080/api/documentos/${documentoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      message.success('Documento excluído!');
      if (fotoDocumento?.id === documentoId) setFotoDocumento(null);
      carregarDocumentos();
    } catch (err) {
      message.error('Erro ao excluir');
    }
  };

const imprimirFicha = async () => {
    try {
        await pdfService.gerarFichaEntidade(entidade, fotoDocumento?.imageUrl);
        message.success('PDF gerado com sucesso!');
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        message.error('Erro ao gerar PDF');
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
    if (tipo === 'FOTO' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extensao?.toLowerCase())) {
      return <FileImageOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
    }
    if (extensao?.toLowerCase() === 'pdf') {
      return <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
    }
    return <FileOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
  };

  const getStatusColor = (s) => {
    const colors = { 'NAO_CLASSIFICADO': 'default', 'MAU': 'error', 'REGULAR': 'warning', 'BOM': 'success', 'MUITO_BOM': 'green', 'EXCELENTE': 'blue', 'VIP': 'purple', 'PREMIUM': 'gold' };
    return colors[s] || 'default';
  };

  const getTipoPessoaColor = (t) => {
    const c = { 'CLIENTE': 'blue', 'ASSINANTE': 'green', 'FORNECEDOR': 'orange', 'FUNCIONARIO': 'cyan' };
    return c[t] || 'default';
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-MZ', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—';

  // Renderizações parciais
  const renderFotoSection = () => {
    if (!fotoDocumento) return null;
    return (
      <Card title={<Space><FileImageOutlined />Foto</Space>} style={{ marginBottom: 24 }} size="small">
        <div style={{ textAlign: 'center' }}>
          <img src={fotoDocumento.imageUrl} alt="Foto" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8 }} />
          <div style={{ marginTop: 8 }}>
            <Space>
              <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(fotoDocumento.id, fotoDocumento.nomeOriginal || fotoDocumento.nome)}>Download</Button>
              <Popconfirm title="Remover foto?" onConfirm={() => handleDeleteDoc(fotoDocumento.id)}>
                <Button type="link" danger icon={<DeleteOutlined />}>Remover</Button>
              </Popconfirm>
            </Space>
          </div>
        </div>
      </Card>
    );
  };

  const renderBasicInfo = () => (
    <Descriptions bordered column={2} title={<Space><UserOutlined />Informações Básicas</Space>}>
      <Descriptions.Item label="Nome" span={2}>{entidade?.nome || '—'}</Descriptions.Item>
      <Descriptions.Item label="Código"><Tag color="blue">{entidade?.codigo || '—'}</Tag></Descriptions.Item>
      <Descriptions.Item label="Tipo"><Tag color={getTipoPessoaColor(entidade?.tipoDePessoa)}>{entidade?.tipoDePessoa || '—'}</Tag></Descriptions.Item>
      <Descriptions.Item label="Classificação"><Tag color={getStatusColor(entidade?.classificacao)}>{entidade?.classificacao || '—'}</Tag></Descriptions.Item>
      <Descriptions.Item label="Status"><Badge status={entidade?.ativo ? 'success' : 'error'} text={entidade?.ativo ? 'Ativo' : 'Inativo'} /></Descriptions.Item>
      <Descriptions.Item label="Usuário" span={2}>{entidade?.usuario?.nome || entidade?.usuario?.username || '—'}</Descriptions.Item>
    </Descriptions>
  );

  const renderPersonalInfo = () => {
    const dp = entidade?.dadosPessoais;
    const ct = entidade?.contacto;
    return (
      <Descriptions bordered column={2} title={<Space><UserOutlined />Dados Pessoais</Space>}>
        <Descriptions.Item label="Gênero">{dp?.genero || '—'}</Descriptions.Item>
        <Descriptions.Item label="Estado Civil">{dp?.estadoCivil || '—'}</Descriptions.Item>
        <Descriptions.Item label="Nascimento">{formatDate(dp?.dataDeNascimento)}</Descriptions.Item>
        <Descriptions.Item label="Nacionalidade">{ct?.nacionalidade || '—'}</Descriptions.Item>
        <Descriptions.Item label="Profissão">{ct?.profissao || '—'}</Descriptions.Item>
        <Descriptions.Item label="Local Trabalho">{ct?.localDeTrabalho || '—'}</Descriptions.Item>
      </Descriptions>
    );
  };

  const renderIdentificationInfo = () => {
    const ident = entidade?.identificacao;
    return (
      <Descriptions bordered column={2} title={<Space><IdcardOutlined />Identificação</Space>}>
        <Descriptions.Item label="Tipo">{ident?.tipoDeIdentificao || '—'}</Descriptions.Item>
        <Descriptions.Item label="Número">{ident?.numeroDeIdentificao || '—'}</Descriptions.Item>
        <Descriptions.Item label="NUIT">{ident?.nuit || '—'}</Descriptions.Item>
        <Descriptions.Item label="Emissão">{formatDate(ident?.dataDeEmissao)}</Descriptions.Item>
        <Descriptions.Item label="Validade">{formatDate(ident?.dataDeValidade)}</Descriptions.Item>
        <Descriptions.Item label="Arquivo">{ident?.arquivoDeIdentificao || '—'}</Descriptions.Item>
      </Descriptions>
    );
  };

  const renderContactInfo = () => {
    const ct = entidade?.contacto;
    return (
      <Descriptions bordered column={2} title={<Space><PhoneOutlined />Contactos</Space>}>
        <Descriptions.Item label="Telefone">{ct?.telefone || '—'}</Descriptions.Item>
        <Descriptions.Item label="Alt 1">{ct?.telefone1 || '—'}</Descriptions.Item>
        <Descriptions.Item label="Alt 2">{ct?.telefone2 || '—'}</Descriptions.Item>
        <Descriptions.Item label="Email">{ct?.email || '—'}</Descriptions.Item>
        <Descriptions.Item label="Residência" span={2}>{ct?.residencia || '—'}</Descriptions.Item>
      </Descriptions>
    );
  };

  const renderDocumentos = () => (
    <div>
      {renderFotoSection()}
      <Card title={<Space><UploadOutlined />Upload</Space>} style={{ marginBottom: 24 }} size="small">
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
          <Input.TextArea value={uploadDescricao} onChange={e => setUploadDescricao(e.target.value)} placeholder="Descrição (opcional)" rows={2} style={{ maxWidth: 400 }} />
        </Space>
      </Card>
      <Card title={<Space><PaperClipOutlined />Documentos ({documentos.length})</Space>}>
        {loadingDocs ? <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div> :
         documentos.length === 0 ? <Empty description="Nenhum documento" /> :
         <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
           {documentos.map(doc => (
             <Card key={doc.id} size="small" hoverable>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   {getFileIcon(doc.extensao, doc.tipo)}
                   <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <Text strong>{doc.nomeOriginal || doc.nome}</Text>
                       <Tag color="blue">{doc.tipo}</Tag>
                     </div>
                     <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                       {formatBytes(doc.tamanho)} • {doc.dataUpload} {doc.descricao && '• ' + doc.descricao}
                     </div>
                   </div>
                 </div>
                 <Space>
                   <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(doc.id, doc.nomeOriginal || doc.nome)}>Download</Button>
                   <Popconfirm title="Excluir?" onConfirm={() => handleDeleteDoc(doc.id)}>
                     <Button type="link" danger icon={<DeleteOutlined />}>Excluir</Button>
                   </Popconfirm>
                 </Space>
               </div>
             </Card>
           ))}
         </div>
        }
      </Card>
    </div>
  );

  // Loading state
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  }

  // ID inválido
  if (!entidadeId || !entidade) {
    return <Empty description="Entidade não encontrada" />;
  }

  // Modo Edição
  if (editMode) {
    return <EntidadeForm entidade={entidade} onSubmit={handleSave} onCancel={() => setEditMode(false)} />;
  }

  // Conteúdo principal
  const content = (
    <>
      <div style={{ marginBottom: 16, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <Button icon={<FileTextOutlined />} onClick={() => setFichaVisible(true)}>Ficha</Button>
        <Button icon={<PrinterOutlined />} onClick={imprimirFicha}>Imprimir</Button>
        <Button type="primary" icon={<EditOutlined />} onClick={() => setEditMode(true)}>Editar</Button>
        {isModal && <Button icon={<CloseOutlined />} onClick={onClose}>Fechar</Button>}
      </div>

      <Tabs activeKey={activeSection} onChange={setActiveSection} type="card" items={[
        { key: 'basic', label: <Space><UserOutlined />Básico</Space>, children: renderBasicInfo() },
        { key: 'personal', label: <Space><UserOutlined />Pessoais</Space>, children: renderPersonalInfo() },
        { key: 'identification', label: <Space><IdcardOutlined />Identificação</Space>, children: renderIdentificationInfo() },
        { key: 'contacts', label: <Space><PhoneOutlined />Contactos</Space>, children: renderContactInfo() },
        { key: 'documents', label: <Space><PaperClipOutlined />Documentos</Space>, children: renderDocumentos() },
      ]} />

      <Modal title="Ficha Completa" open={fichaVisible} onCancel={() => setFichaVisible(false)} footer={null} width={900} destroyOnHidden>
        <EntidadeFicha entidadeId={entidade.id} />
      </Modal>
    </>
  );

  if (isModal) {
    return <Modal title={entidade?.nome || 'Detalhes'} open={true} onCancel={onClose} footer={null} width={1000} destroyOnHidden>{content}</Modal>;
  }

  return <Card title={entidade?.nome || 'Detalhes'}>{content}</Card>;
};

export default EntidadeView;