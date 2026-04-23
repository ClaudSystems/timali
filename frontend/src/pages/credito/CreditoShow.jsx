// src/pages/credito/CreditoShow.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, Alert, Tag, Space } from 'antd';
import { ArrowLeftOutlined, DollarOutlined } from '@ant-design/icons';
import creditoService from '../../services/creditoService';
import moment from 'moment';

const CreditoShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credito, setCredito] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      carregarCredito();
    }
  }, [id]);

  const carregarCredito = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await creditoService.buscar(id);
      setCredito(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar crédito:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(valor || 0);
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'ATIVO': { color: 'success', text: 'Ativo' },
      'EM_ATRASO': { color: 'error', text: 'Em Atraso' },
      'QUITADO': { color: 'default', text: 'Quitado' },
      'CANCELADO': { color: 'warning', text: 'Cancelado' },
      'RASCUNHO': { color: 'processing', text: 'Rascunho' },
      'RENEGOCIADO': { color: 'warning', text: 'Renegociado' }
    };

    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Erro"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (!credito) {
    return (
      <Alert
        message="Crédito não encontrado"
        description="O crédito solicitado não foi encontrado."
        type="warning"
        showIcon
      />
    );
  }

  return (
    <Card
      title={`Crédito ${credito.numero}`}
      extra={
        <Space>
          <Button
            icon={<DollarOutlined />}
            onClick={() => navigate(`/creditos/${id}/parcelas`)}
          >
            Ver Parcelas
          </Button>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/creditos')}
          >
            Voltar
          </Button>
        </Space>
      }
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="Número" span={1}>
          {credito.numero}
        </Descriptions.Item>

        <Descriptions.Item label="Status" span={1}>
          {getStatusTag(credito.status)}
        </Descriptions.Item>

        <Descriptions.Item label="Entidade" span={2}>
          {credito.entidade?.nome || 'N/A'}
          {credito.entidade?.codigo && ` (Código: ${credito.entidade.codigo})`}
        </Descriptions.Item>

        <Descriptions.Item label="Valor Concedido">
          {formatarMoeda(credito.valorConcedido)}
        </Descriptions.Item>

        <Descriptions.Item label="Valor Total">
          {formatarMoeda(credito.valorTotal)}
        </Descriptions.Item>

        <Descriptions.Item label="Total Pago">
          <span style={{ color: '#52c41a' }}>
            {formatarMoeda(credito.totalPago)}
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="Saldo Devedor">
          <span style={{ color: credito.totalEmDivida > 0 ? '#ff4d4f' : '#52c41a' }}>
            {formatarMoeda(Math.abs(credito.totalEmDivida || 0))}
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="Taxa de Juros">
          {credito.percentualDeJuros}%
        </Descriptions.Item>

        <Descriptions.Item label="Juros de Demora">
          {credito.percentualJurosDeDemora}%
        </Descriptions.Item>

        <Descriptions.Item label="Nº de Prestações">
          {credito.numeroDePrestacoes}
        </Descriptions.Item>

        <Descriptions.Item label="Periodicidade">
          {credito.periodicidade}
        </Descriptions.Item>

        <Descriptions.Item label="Forma de Cálculo">
          {credito.formaDeCalculo}
        </Descriptions.Item>

        <Descriptions.Item label="Data de Emissão">
          {credito.dataEmissao ? moment(credito.dataEmissao).format('DD/MM/YYYY') : '-'}
        </Descriptions.Item>


        <Descriptions.Item label="Data de Validade">
          {credito.dataValidade ? moment(credito.dataValidade).format('DD/MM/YYYY') : '-'}
        </Descriptions.Item>

        <Descriptions.Item label="Quitado">
          {credito.quitado ? <Tag color="success">Sim</Tag> : 'Não'}
        </Descriptions.Item>

        <Descriptions.Item label="Em Mora">
          {credito.emMora ? <Tag color="error">Sim</Tag> : 'Não'}
        </Descriptions.Item>

        <Descriptions.Item label="Ativo">
          {credito.ativo ? <Tag color="success">Sim</Tag> : 'Não'}
        </Descriptions.Item>

        {credito.descricao && (
          <Descriptions.Item label="Descrição" span={2}>
            {credito.descricao}
          </Descriptions.Item>
        )}

        {credito.motivoRemissao && (
          <Descriptions.Item label="Motivo Remissão" span={2}>
            {credito.motivoRemissao}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
};

export default CreditoShow;