// src/components/credito/CreditoDetails.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Spin, Alert, Button, Descriptions, Tag, Divider,
  Space, Row, Col, Statistic
} from 'antd';
import {
  ArrowLeftOutlined,
  DollarOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import creditoService from '../../services/creditoService';
import pdfPlanoPagamentoService from '../../services/pdfPlanoPagamentoService';
import moment from 'moment';

const CreditoDetails = ({ id }) => {
  const navigate = useNavigate();
  const [credito, setCredito] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) carregarCredito();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const carregarCredito = async () => {
    setLoading(true);
    try {
      const data = await creditoService.buscar(id);
      setCredito(data);
    } catch (err) {
      setError(err.message || 'Erro ao carregar crédito');
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (v) => {
    const num = Number(v) || 0;
    return num.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });
  };

  const formatarPercentagem = (v) => {
    const n = Number(v) || 0;
    return n.toFixed(2).replace('.', ',') + '%';
  };

  const formatarData = (d) => {
    if (!d) return '-';
    const m = moment(d);
    return m.isValid() ? m.format('DD/MM/YYYY') : String(d).substring(0, 10);
  };

  const getStatusTag = (s) => {
    const status = String(s || '');
    const map = {
      'ATIVO': 'green', 'Ativo': 'green',
      'EM_ATRASO': 'red', 'QUITADO': 'blue',
      'CANCELADO': 'orange', 'RASCUNHO': 'default',
      'RENEGOCIADO': 'purple'
    };
    return <Tag color={map[status] || 'default'}>{status || 'N/A'}</Tag>;
  };

  const gerarPDF = async () => {
    try {
      const parcelas = await creditoService.listarParcelas(id);
      pdfPlanoPagamentoService.gerarPlanoPagamento(credito, parcelas || []);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    }
  };

  const saldoDevedor = (credito?.valorTotal || 0) - (credito?.totalPago || 0);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '50px' }} />;
  if (error) return <Alert message="Erro" description={error} type="error" showIcon />;
  if (!credito) return <Alert message="Crédito não encontrado" type="warning" showIcon />;

  return (
    <div style={{ padding: 20 }}>
      <Card
        title={
          <Space>
            <span>Crédito {credito.numero}</span>
            {getStatusTag(credito.status)}
          </Space>
        }
        extra={
          <Space>
            {/* BOTÃO PDF - Chama o serviço */}
            <Button
              icon={<FilePdfOutlined />}
              onClick={gerarPDF}
              type="primary"
            >
              Imprimir Plano
            </Button>

            {/* BOTÃO PARCELAS - Link para ParcelaList */}
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
        {/* Valores principais */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="Valor Concedido" value={formatarMoeda(credito.valorConcedido)} />
          </Col>
          <Col span={6}>
            <Statistic title="Valor Total" value={formatarMoeda(credito.valorTotal)} />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Pago"
              value={formatarMoeda(credito.totalPago)}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Saldo Devedor"
              value={formatarMoeda(Math.abs(saldoDevedor))}
              valueStyle={{ color: saldoDevedor > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Col>
        </Row>

        <Divider>Informações do Crédito</Divider>

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Entidade" span={2}>
            <strong>{credito.entidade?.nome || 'N/A'}</strong>
            {credito.entidade?.codigo && ` (Cod: ${credito.entidade.codigo})`}
          </Descriptions.Item>
          <Descriptions.Item label="Criado por">{credito.criadoPor || '-'}</Descriptions.Item>
          <Descriptions.Item label="Definição">{credito.definicaoCredito?.nome || 'Personalizada'}</Descriptions.Item>
          <Descriptions.Item label="Nº Prestações">{credito.numeroDePrestacoes || 0}</Descriptions.Item>
          <Descriptions.Item label="Periodicidade">{credito.periodicidade || '-'}</Descriptions.Item>
          <Descriptions.Item label="Taxa de Juros">{formatarPercentagem(credito.percentualDeJuros)}</Descriptions.Item>
          <Descriptions.Item label="Juros de Demora">{formatarPercentagem(credito.percentualJurosDeDemora)}</Descriptions.Item>
          <Descriptions.Item label="Forma de Cálculo">{credito.formaDeCalculo || '-'}</Descriptions.Item>
          <Descriptions.Item label="Status">{getStatusTag(credito.status)}</Descriptions.Item>
          <Descriptions.Item label="Data Emissão">{formatarData(credito.dataEmissao)}</Descriptions.Item>
          <Descriptions.Item label="Data Validade">{formatarData(credito.dataValidade)}</Descriptions.Item>
          <Descriptions.Item label="Quitado">{credito.quitado ? <Tag color="green">Sim</Tag> : 'Não'}</Descriptions.Item>
          <Descriptions.Item label="Em Mora">{credito.emMora ? <Tag color="red">Sim</Tag> : 'Não'}</Descriptions.Item>
          <Descriptions.Item label="Ativo">{credito.ativo !== false ? <Tag color="green">Sim</Tag> : <Tag color="red">Não</Tag>}</Descriptions.Item>
          {credito.descricao && <Descriptions.Item label="Descrição" span={2}>{credito.descricao}</Descriptions.Item>}
        </Descriptions>
      </Card>
    </div>
  );
};

export default CreditoDetails;