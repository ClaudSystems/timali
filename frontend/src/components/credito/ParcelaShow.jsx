// src/pages/credito/ParcelaShow.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, Alert, Tag, Space, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import creditoService from '../../services/creditoService';
import moment from 'moment';

const ParcelaShow = () => {
  const { creditoId, parcelaId } = useParams();
  const navigate = useNavigate();
  const [parcela, setParcela] = useState(null);
  const [credito, setCredito] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (creditoId && parcelaId) carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creditoId, parcelaId]);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [creditoData, parcelasData] = await Promise.all([
        creditoService.buscar(creditoId),
        creditoService.listarParcelas(creditoId)
      ]);

      setCredito(creditoData);

      const parcelaEncontrada = parcelasData.find(
        p => String(p.id) === String(parcelaId)
      );

      if (parcelaEncontrada) {
        parcelaEncontrada.creditoInfo = creditoData;
        setParcela(parcelaEncontrada);
      } else {
        setError('Parcela não encontrada');
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados');
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
      'Pendente': 'orange', 'PENDENTE': 'orange',
      'Pago': 'green', 'PAGA': 'green', 'PAGO': 'green',
      'VENCIDA': 'red', 'Vencida': 'red',
      'ATIVO': 'green', 'QUITADO': 'blue'
    };
    return <Tag color={map[status] || 'default'}>{status || 'N/A'}</Tag>;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
  if (error) return <Alert message="Erro" description={error} type="error" showIcon />;
  if (!parcela) return <Alert message="Parcela não encontrada" type="warning" showIcon />;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
      <Card
        title={`Parcela Nº ${parcela.numero || '-'}`}
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(`/creditos/${creditoId}/parcelas`)}
            >
              Voltar às Parcelas
            </Button>
          </Space>
        }
      >
        {/* ── DADOS DO CRÉDITO ── */}
        <Divider orientation="left" style={{ fontSize: 13, fontWeight: 'bold', margin: '8px 0 12px' }}>
          DADOS DO CRÉDITO
        </Divider>

        {credito && (
          <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Crédito Nº">{credito.numero || '-'}</Descriptions.Item>
            <Descriptions.Item label="Cliente">{credito.entidade?.nome || '-'}</Descriptions.Item>
            <Descriptions.Item label="Valor Concedido">{formatarMoeda(credito.valorConcedido)}</Descriptions.Item>
            <Descriptions.Item label="Valor Total">{formatarMoeda(credito.valorTotal)}</Descriptions.Item>
          </Descriptions>
        )}

        {/* ── DADOS DA PARCELA ── */}
        <Divider orientation="left" style={{ fontSize: 13, fontWeight: 'bold', margin: '8px 0 12px' }}>
          DADOS DA PARCELA
        </Divider>

        <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Nº Parcela">{parcela.numero || '-'}</Descriptions.Item>
          <Descriptions.Item label="Status">{getStatusTag(parcela.status)}</Descriptions.Item>

          <Descriptions.Item label="Data Vencimento">
            {formatarData(parcela.dataVencimento)}
          </Descriptions.Item>
          <Descriptions.Item label="Dias Atraso">
            {parcela.diasAtraso > 0 ? (
              <Tag color="red">{parcela.diasAtraso} dias</Tag>
            ) : (
              <Tag color="green">0 dias</Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Parcela Paga?">
            {parcela.pago ? <Tag color="green">Sim</Tag> : <Tag color="orange">Não</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Quitado?">
            {credito?.quitado ? <Tag color="green">Sim</Tag> : <Tag color="orange">Não</Tag>}
          </Descriptions.Item>
        </Descriptions>

        {/* ── VALORES ── */}
        <Divider orientation="left" style={{ fontSize: 13, fontWeight: 'bold', margin: '8px 0 12px' }}>
          VALORES
        </Divider>

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Valor da Prestação">
            <span style={{ fontWeight: 'bold' }}>{formatarMoeda(parcela.valorParcela)}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Valor Pago">
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
              {formatarMoeda(parcela.valorPago)}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Valor Amortização">
            {formatarMoeda(parcela.valorAmortizacao)}
          </Descriptions.Item>
          <Descriptions.Item label="Valor Juros">
            {formatarMoeda(parcela.valorJuros)}
          </Descriptions.Item>

          <Descriptions.Item label="Valor Multa">
            {formatarMoeda(parcela.valorMulta || 0)}
          </Descriptions.Item>
          <Descriptions.Item label="Juros Demora">
            {formatarMoeda(parcela.valorJurosDemora || 0)}
          </Descriptions.Item>

          <Descriptions.Item label="Saldo Devedor" span={2}>
            <span style={{
              color: (parcela.saldoDevedor || 0) > 0 ? '#ff4d4f' : '#52c41a',
              fontWeight: 'bold',
              fontSize: 14
            }}>
              {formatarMoeda(parcela.saldoDevedor || 0)}
            </span>
          </Descriptions.Item>
        </Descriptions>

        {/* ── INFORMAÇÕES ADICIONAIS ── */}
        {credito && (
          <>
            <Divider orientation="left" style={{ fontSize: 13, fontWeight: 'bold', margin: '16px 0 12px' }}>
              INFORMAÇÕES ADICIONAIS
            </Divider>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Taxa de Juros">
                {formatarPercentagem(credito.percentualDeJuros)}
              </Descriptions.Item>
              <Descriptions.Item label="Juros de Demora">
                {formatarPercentagem(credito.percentualJurosDeDemora)}
              </Descriptions.Item>
              <Descriptions.Item label="Periodicidade">{credito.periodicidade || '-'}</Descriptions.Item>
              <Descriptions.Item label="Forma de Cálculo">{credito.formaDeCalculo || '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>
    </div>
  );
};

export default ParcelaShow;