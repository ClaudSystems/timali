// frontend/src/components/entidade/EntidadeFicha.jsx
import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Badge, Space, Spin, Empty, Typography } from 'antd';
import {
  UserOutlined, IdcardOutlined, PhoneOutlined,
  FileImageOutlined, EnvironmentOutlined, MailOutlined,
  CalendarOutlined, NumberOutlined, TeamOutlined,
  SafetyCertificateOutlined, FlagOutlined, HomeOutlined
} from '@ant-design/icons';
import './EntidadeFicha.css';

const { Text, Title } = Typography;

const EntidadeFicha = ({ entidadeId }) => {
  const [entidade, setEntidade] = useState(null);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entidadeId) carregarDados();
  }, [entidadeId]);

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('timali_token');

      // Carregar entidade
      const response = await fetch(`http://localhost:8080/api/entidades/${entidadeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setEntidade(data);

      // Carregar foto
      const docsResponse = await fetch(`http://localhost:8080/api/documentos?entidadeId=${entidadeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (docsResponse.ok) {
        const docs = await docsResponse.json();
        const foto = docs.find(d => d.tipo === 'FOTO');
        if (foto) {
          const fotoResponse = await fetch(`http://localhost:8080/api/documentos/${foto.id}/download`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (fotoResponse.ok) {
            const blob = await fotoResponse.blob();
            setFotoUrl(URL.createObjectURL(blob));
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar ficha:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-MZ', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  }

  if (!entidade) {
    return <Empty description="Entidade não encontrada" />;
  }

  const ident = entidade.identificacao;
  const ct = entidade.contacto;
  const dp = entidade.dadosPessoais;

  return (
    <div className="entidade-ficha" style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      {/* Cabeçalho com Foto */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Foto */}
          <div style={{
            width: 150,
            height: 180,
            borderRadius: 8,
            overflow: 'hidden',
            border: '2px solid #f0f0f0',
            flexShrink: 0
          }}>
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={entidade.nome}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa'
              }}>
                <FileImageOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              </div>
            )}
          </div>

          {/* Informações principais */}
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0 }}>{entidade.nome}</Title>
            <Space size="large" style={{ marginTop: 8 }}>
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                {entidade.codigo}
              </Tag>
              <Tag color={getTipoPessoaColor(entidade.tipoDePessoa)} style={{ fontSize: 14 }}>
                {entidade.tipoDePessoa}
              </Tag>
              <Badge
                status={entidade.ativo ? 'success' : 'error'}
                text={entidade.ativo ? 'Ativo' : 'Inativo'}
              />
            </Space>

            <Descriptions bordered column={2} size="small" style={{ marginTop: 16 }}>
              <Descriptions.Item label={<><SafetyCertificateOutlined /> Classificação</>}>
                <Tag color={getStatusColor(entidade.classificacao)}>
                  {entidade.classificacao || 'Não classificado'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<><TeamOutlined /> Usuário Gestor</>}>
                {entidade.usuario?.nome || entidade.usuario?.username || '—'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      </Card>

      {/* Identificação */}
      {ident && (
        <Card
          title={<Space><IdcardOutlined />Documento de Identificação</Space>}
          style={{ marginBottom: 24 }}
        >
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Tipo">{ident.tipoDeIdentificao}</Descriptions.Item>
            <Descriptions.Item label={<><NumberOutlined /> Número</>}>{ident.numeroDeIdentificao}</Descriptions.Item>
            <Descriptions.Item label="NUIT">{ident.nuit}</Descriptions.Item>
            <Descriptions.Item label={<><CalendarOutlined /> Data de Emissão</>}>{formatDate(ident.dataDeEmissao)}</Descriptions.Item>
            <Descriptions.Item label={<><CalendarOutlined /> Data de Validade</>}>{formatDate(ident.dataDeValidade)}</Descriptions.Item>
            <Descriptions.Item label="Arquivo">{ident.arquivoDeIdentificao}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* Dados Pessoais */}
      {(dp || ct) && (
        <Card
          title={<Space><UserOutlined />Dados Pessoais</Space>}
          style={{ marginBottom: 24 }}
        >
          <Descriptions bordered column={2} size="small">
            {dp?.genero && <Descriptions.Item label="Gênero">{dp.genero}</Descriptions.Item>}
            {dp?.estadoCivil && <Descriptions.Item label="Estado Civil">{dp.estadoCivil}</Descriptions.Item>}
            {dp?.dataDeNascimento && (
              <Descriptions.Item label={<><CalendarOutlined /> Nascimento</>}>{formatDate(dp.dataDeNascimento)}</Descriptions.Item>
            )}
            {ct?.nacionalidade && (
              <Descriptions.Item label={<><FlagOutlined /> Nacionalidade</>}>{ct.nacionalidade}</Descriptions.Item>
            )}
            {ct?.profissao && <Descriptions.Item label="Profissão">{ct.profissao}</Descriptions.Item>}
            {ct?.localDeTrabalho && (
              <Descriptions.Item label="Local de Trabalho">{ct.localDeTrabalho}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Contactos */}
      {ct && (
        <Card
          title={<Space><PhoneOutlined />Contactos</Space>}
          style={{ marginBottom: 24 }}
        >
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label={<><PhoneOutlined /> Telefone</>}>{ct.telefone || '—'}</Descriptions.Item>
            <Descriptions.Item label={<><PhoneOutlined /> Tel. Alt 1</>}>{ct.telefone1 || '—'}</Descriptions.Item>
            <Descriptions.Item label={<><PhoneOutlined /> Tel. Alt 2</>}>{ct.telefone2 || '—'}</Descriptions.Item>
            <Descriptions.Item label={<><MailOutlined /> Email</>}>{ct.email || '—'}</Descriptions.Item>
            <Descriptions.Item label={<><HomeOutlined /> Residência</>} span={2}>
              {ct.residencia || '—'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default EntidadeFicha;