// src/pages/credito/CreditoShow.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, Alert, Tag, Space, Modal } from 'antd';
import { ArrowLeftOutlined, DollarOutlined, FilePdfOutlined, FileSearchOutlined } from '@ant-design/icons';
import creditoService from '../../services/creditoService';
import pdfPlanoPagamentoService from '../../services/pdfPlanoPagamentoService';
import ExtratoCreditoModal from '../../components/credito/ExtratoCreditoModal';
import moment from 'moment';

// Adicione esta função auxiliar no topo do componente:

const safeString = (value) => {
    if (!value) return '-';
    if (typeof value === 'object' && value.name) return value.name; // Enum
    return String(value);
};

// Depois use safeString() nas propriedades que podem ser Enum:


const CreditoShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credito, setCredito] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extratoModal, setExtratoModal] = useState(false);

  useEffect(() => {
    if (id) carregarCredito();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const carregarCredito = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await creditoService.buscar(id);
      setCredito(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    const num = Number(valor) || 0;
    return num.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });
  };

  const getStatusTag = (status) => {
    const s = String(status || '');
    const map = {
      'ATIVO': 'green',
      'Ativo': 'green',
      'EM_ATRASO': 'red',
      'QUITADO': 'blue',
      'CANCELADO': 'orange',
      'RASCUNHO': 'default',
      'RENEGOCIADO': 'purple'
    };
    return <Tag color={map[s] || 'default'}>{s || 'N/A'}</Tag>;
  };

  const gerarPlanoPagamentoPDF = async () => {
    if (!credito) return;
    try {
      await pdfPlanoPagamentoService.gerarPlanoPagamento(credito);
    } catch (err) {
      console.error('Erro PDF:', err);
      alert('Erro: ' + err.message);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  if (error) return <Alert message="Erro" description={error} type="error" showIcon />;
  if (!credito) return <Alert message="Crédito não encontrado" type="warning" showIcon />;

  return (
    <>
      <Card
        title={'Crédito ' + credito.numero}
        extra={
          <Space>
            <Button icon={<FilePdfOutlined />} onClick={gerarPlanoPagamentoPDF} type="primary">
              Imprimir Plano
            </Button>
            <Button icon={<FileSearchOutlined />} onClick={() => setExtratoModal(true)}>
              Ver Extrato
            </Button>
            <Button icon={<DollarOutlined />} onClick={() => navigate('/creditos/' + id + '/parcelas')}>
              Ver Parcelas
            </Button>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/creditos')}>
              Voltar
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Número">{credito.numero}</Descriptions.Item>
          <Descriptions.Item label="Status">{getStatusTag(credito.status)}</Descriptions.Item>
          <Descriptions.Item label="Entidade" span={2}>
            {credito.entidade?.nome || 'N/A'}
            {credito.entidade?.codigo && ' (Cód: ' + credito.entidade.codigo + ')'}
          </Descriptions.Item>
          <Descriptions.Item label="Valor Concedido">{formatarMoeda(credito.valorConcedido)}</Descriptions.Item>
          <Descriptions.Item label="Valor Total">{formatarMoeda(credito.valorTotal)}</Descriptions.Item>
          <Descriptions.Item label="Total Pago">
            <span style={{ color: '#52c41a' }}>{formatarMoeda(credito.totalPago)}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Saldo Devedor">
            <span style={{ color: (credito.valorTotal - credito.totalPago) > 0 ? '#ff4d4f' : '#52c41a' }}>
              {formatarMoeda(Math.abs((credito.valorTotal || 0) - (credito.totalPago || 0)))}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Taxa de Juros">{credito.percentualDeJuros}%</Descriptions.Item>
          <Descriptions.Item label="Juros de Demora">{credito.percentualJurosDeDemora}%</Descriptions.Item>
          <Descriptions.Item label="Nº de Prestações">{credito.numeroDePrestacoes}</Descriptions.Item>
            <Descriptions.Item label="Periodicidade">
              {credito.periodicidade?.name || credito.periodicidade?.toString() || '-'}
            </Descriptions.Item>

            <Descriptions.Item label="Forma de Cálculo">
              {credito.formaDeCalculo?.name || credito.formaDeCalculo?.toString() || '-'}
            </Descriptions.Item>
          <Descriptions.Item label="Data de Emissão">
            {credito.dataEmissao || credito.dateConcecao || credito.dataConcessao
              ? moment(credito.dataEmissao || credito.dateConcecao || credito.dataConcessao).format('DD/MM/YYYY')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Quitado">
            {credito.quitado ? <Tag color="green">Sim</Tag> : 'Não'}
          </Descriptions.Item>
          <Descriptions.Item label="Em Mora">
            {credito.emMora ? <Tag color="red">Sim</Tag> : 'Não'}
          </Descriptions.Item>
          <Descriptions.Item label="Ativo">
            {credito.ativo ? <Tag color="green">Sim</Tag> : 'Não'}
          </Descriptions.Item>
          {credito.descricao && (
            <Descriptions.Item label="Descrição" span={2}>{credito.descricao}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Modal do Extrato */}
      <Modal
        title={null}
        open={extratoModal}
        onCancel={() => setExtratoModal(false)}
        footer={null}
        width="100%"
        style={{ maxWidth: 1000, top: 10 }}
        destroyOnHidden
      >
        <ExtratoCreditoModal
          creditoId={credito.id}
          onClose={() => setExtratoModal(false)}
        />
      </Modal>
    </>
  );
};

export default CreditoShow;