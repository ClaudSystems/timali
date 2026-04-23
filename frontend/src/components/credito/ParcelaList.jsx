// src/components/credito/ParcelaList.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Card,
  Tag,
  Space,
  message,
  Statistic,
  Row,
  Col,
  Spin,
  Alert
} from 'antd';
import { DollarOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import creditoService from '../../services/creditoService';
import moment from 'moment';

const ParcelaList = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estado local para parcelas
  const [parcelas, setParcelas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [credito, setCredito] = useState(null);

  // Carregar dados
  useEffect(() => {
    if (id) {
      carregarDados();
    }
  }, [id]);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      // Carregar crédito e parcelas em paralelo
      const [creditoData, parcelasData] = await Promise.all([
        creditoService.buscar(id),
        creditoService.listarParcelas(id)
      ]);

      setCredito(creditoData);
      setParcelas(Array.isArray(parcelasData) ? parcelasData : []);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao carregar dados:', err);
      message.error('Erro ao carregar parcelas');
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) => {
    if (!valor && valor !== 0) return 'MT 0,00';
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(valor);
  };

  const getStatusTag = (status, pago) => {
    if (pago) {
      return <Tag color="success">PAGA</Tag>;
    }

    const statusMap = {
      'PENDENTE': { color: 'default', text: 'Pendente' },
      'VENCIDA': { color: 'error', text: 'Vencida' },
      'PAGA_COM_ATRASO': { color: 'warning', text: 'Paga com Atraso' }
    };

    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Nº',
      dataIndex: 'numero',
      key: 'numero',
      width: 70,
    },
    {
      title: 'Vencimento',
      dataIndex: 'dataVencimento',
      key: 'dataVencimento',
      render: (data) => data ? moment(data).format('DD/MM/YYYY') : '-',
      width: 120,
    },
    {
      title: 'Valor Parcela',
      dataIndex: 'valorParcela',
      key: 'valorParcela',
      render: (valor) => formatarMoeda(valor),
      width: 130,
    },
    {
      title: 'Amortização',
      dataIndex: 'valorAmortizacao',
      key: 'valorAmortizacao',
      render: (valor) => formatarMoeda(valor),
      width: 130,
    },
    {
      title: 'Juros',
      dataIndex: 'valorJuros',
      key: 'valorJuros',
      render: (valor) => formatarMoeda(valor),
      width: 120,
    },
    {
      title: 'Multa/Mora',
      key: 'multaMora',
      render: (_, record) => {
        const total = (record.valorMulta || 0) + (record.valorJurosDemora || 0);
        return formatarMoeda(total);
      },
      width: 120,
    },
    {
      title: 'Valor Pago',
      dataIndex: 'valorPago',
      key: 'valorPago',
      render: (valor) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {formatarMoeda(valor)}
        </span>
      ),
      width: 130,
    },
    {
      title: 'Saldo Devedor',
      dataIndex: 'saldoDevedor',
      key: 'saldoDevedor',
      render: (valor) => formatarMoeda(valor),
      width: 130,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record.status, record.pago),
      width: 130,
    },
    {
      title: 'Dias Atraso',
      dataIndex: 'diasAtraso',
      key: 'diasAtraso',
      render: (dias) => dias > 0 ? (
        <Tag color="error">{dias} dias</Tag>
      ) : '-',
      width: 100,
    },
  ];

  // Calcular totais
  const totalPrevisto = parcelas.reduce((acc, p) => acc + (p.valorParcela || 0), 0);
  const totalPago = parcelas.reduce((acc, p) => acc + (p.valorPago || 0), 0);
  const totalPendente = totalPrevisto - totalPago;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Carregando parcelas..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Erro ao carregar parcelas"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={carregarDados}>
            Tentar novamente
          </Button>
        }
      />
    );
  }

  return (
    <Card
      title={
        <Space>
          <span>Parcelas do Crédito</span>
          {credito && <Tag color="blue">{credito.numero}</Tag>}
          {credito && (
            <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
              {credito.entidade?.nome}
            </span>
          )}
        </Space>
      }
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/creditos/${id}`)}
        >
          Voltar para Crédito
        </Button>
      }
    >
      {/* Resumo Financeiro */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Previsto"
              value={formatarMoeda(totalPrevisto)}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Pago"
              value={formatarMoeda(totalPago)}
              valueStyle={{ color: '#3f8600' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Saldo Pendente"
              value={formatarMoeda(totalPendente)}
              valueStyle={{ color: totalPendente > 0 ? '#cf1322' : '#3f8600' }}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabela de Parcelas */}
      <Table
        columns={columns}
        dataSource={parcelas}
        loading={loading}
        rowKey="id"
        pagination={false}
        scroll={{ x: 1400 }}
        locale={{
          emptyText: 'Nenhuma parcela encontrada'
        }}
        summary={(pageData) => {
          if (!pageData || pageData.length === 0) return null;

          let totalParcela = 0;
          let totalAmortizacao = 0;
          let totalJuros = 0;
          let totalMultaMora = 0;
          let totalPago = 0;
          let totalSaldo = 0;

          pageData.forEach(({ valorParcela, valorAmortizacao, valorJuros, valorMulta, valorJurosDemora, valorPago, saldoDevedor }) => {
            totalParcela += valorParcela || 0;
            totalAmortizacao += valorAmortizacao || 0;
            totalJuros += valorJuros || 0;
            totalMultaMora += (valorMulta || 0) + (valorJurosDemora || 0);
            totalPago += valorPago || 0;
            totalSaldo += saldoDevedor || 0;
          });

          return (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <strong>TOTAIS</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{formatarMoeda(totalParcela)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>{formatarMoeda(totalAmortizacao)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong>{formatarMoeda(totalJuros)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <strong>{formatarMoeda(totalMultaMora)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <strong style={{ color: '#52c41a' }}>
                    {formatarMoeda(totalPago)}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <strong>{formatarMoeda(totalSaldo)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} />
                <Table.Summary.Cell index={8} />
              </Table.Summary.Row>
            </Table.Summary>
          );
        }}
      />
    </Card>
  );
};

export default ParcelaList;