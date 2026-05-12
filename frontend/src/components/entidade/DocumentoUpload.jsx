// frontend/src/components/entidade/DocumentoUpload.jsx
import React, { useState, useEffect } from 'react';
import { Upload, Button, Modal, List, Card, Space, Tag, message, Popconfirm, Typography, Select, Input } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined, FileOutlined, PictureOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const DocumentoUpload = ({ entidadeId, visible, onClose }) => {
  const [documentos, setDocumentos] = useState([]);
  const [tipo, setTipo] = useState('OUTRO');
  const [descricao, setDescricao] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (visible && entidadeId) {
      carregarDocumentos();
    }
  }, [visible, entidadeId]);

  const carregarDocumentos = async () => {
    try {
      const token = localStorage.getItem('timali_token');
      const response = await fetch(`http://localhost:8080/api/documentos?entidadeId=${entidadeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const dados = await response.json();
        setDocumentos(dados);
      }
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const token = localStorage.getItem('timali_token');
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('entidadeId', entidadeId);
      formData.append('tipo', tipo);
      formData.append('descricao', descricao);

      const response = await fetch('http://localhost:8080/api/documentos/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        message.success('Documento enviado com sucesso!');
        carregarDocumentos();
        setDescricao('');
      } else {
        message.error('Erro ao enviar documento');
      }
    } catch (err) {
      message.error('Erro ao enviar documento');
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
      message.error('Erro ao baixar documento');
    }
  };

  const handleDelete = async (documentoId) => {
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

  const getIcon = (tipo) => {
    if (tipo === 'FOTO') return <PictureOutlined />;
    return <FileOutlined />;
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      title="Documentos da Entidade"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      <div style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select value={tipo} onChange={setTipo} style={{ width: 200 }} placeholder="Tipo de documento">
            <Option value="BI">Bilhete de Identidade</Option>
            <Option value="PASSAPORTE">Passaporte</Option>
            <Option value="FOTO">Foto</Option>
            <Option value="CONTRATO">Contrato</Option>
            <Option value="OUTRO">Outro</Option>
          </Select>
          <Input.TextArea
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
          />
          <Upload beforeUpload={handleUpload} showUploadList={false}>
            <Button icon={<UploadOutlined />} loading={uploading} type="primary">
              Selecionar e Enviar Arquivo
            </Button>
          </Upload>
        </Space>
      </div>

      <List
        dataSource={documentos}
        locale={{ emptyText: 'Nenhum documento anexado' }}
        renderItem={doc => (
          <List.Item
            actions={[
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(doc.id, doc.nomeOriginal)}
              >
                Download
              </Button>,
              <Popconfirm
                title="Excluir documento?"
                onConfirm={() => handleDelete(doc.id)}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Excluir
                </Button>
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              avatar={getIcon(doc.tipo)}
              title={
                <Space>
                  {doc.nomeOriginal}
                  <Tag color="blue">{doc.tipo}</Tag>
                </Space>
              }
              description={
                <Space>
                  <Text type="secondary">{formatBytes(doc.tamanho)}</Text>
                  <Text type="secondary">•</Text>
                  <Text type="secondary">{doc.dataUpload}</Text>
                  {doc.descricao && <Text type="secondary">• {doc.descricao}</Text>}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default DocumentoUpload;