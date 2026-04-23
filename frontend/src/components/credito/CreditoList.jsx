// src/components/credito/CreditoList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Card, Tag, Space, message } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import creditoService from '../../services/creditoService';
import CreditoFilters from './CreditoFilters';
import moment from 'moment';

// Função auxiliar para extrair valor de enum
const extrairValorEnum = (enumValue) => {
  if (!enumValue) return '-';
  if (typeof enumValue === 'string') return enumValue;
  if (enumValue.name) return enumValue.name;
  if (enumValue.descricao) return enumValue.descricao;
  if (typeof enumValue === 'object') {
    const keys = Object.keys(enumValue);
    if (keys.length > 0 && typeof enumValue[keys[0]] === 'string') {
      return enumValue[keys[0]];
    }
  }
  return '-';
};

// Função para formatar moeda
const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined) return 'MT 0,00';
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN'
  }).format(valor);
};

// Função para obter tag de status
const getStatusTag = (status) => {
  const statusStr = typeof status === 'string' ? status : extrairValorEnum(status);

  const statusMap = {
    'ATIVO': { color: 'green', text: 'Ativo' },
    'EM_ATRASO': { color: 'red', text: 'Em Atraso' },
    'QUITADO': { color: 'blue', text: 'Quitado' },
    'CANCELADO': { color: 'orange', text: 'Cancelado' },
    'RASCUNHO': { color: 'default', text: 'Rascunho' },
    'RENEGOCIADO': { color: 'purple', text: 'Renegociado' }
  };

  const config = statusMap[statusStr] || { color: 'default', text: statusStr };
  return <Tag color={config.color}>{config.text}</Tag>;
};

const CreditoList = () => {
  const navigate = useNavigate();
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState({
    max: 20,
    offset: 0,
    sort: 'dataEmissao',
    order: 'desc'
  });

  const carregarCreditos = async () => {
    setLoading(true);
    try {
      const response = await creditoService.listar(filtros);
      console.log('Resposta da API:', response);

      let dataArray = [];
      if (Array.isArray(response)) {
        dataArray = response;
      } else if (response && typeof response === 'object') {
        if (response._embedded?.creditos) {
          dataArray = response._embedded.creditos;
        } else if (response.data && Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (response.content) {
          dataArray = response.content;
        } else if (response.list) {
          dataArray = response.list;
        } else {
          dataArray = Object.values(response).filter(item => typeof item === 'object' && item.id);
        }
      }

      // Processar cada crédito para extrair enums e garantir dados válidos
      const creditosProcessados = dataArray.map(credito => ({
        ...credito,
        // Extrair enums
        periodicidade: extrairValorEnum(credito.periodicidade),
        formaDeCalculo: extrairValorEnum(credito.formaDeCalculo),
        status: extrairValorEnum(credito.status),
        // Garantir que entidade existe
        entidade: credito.entidade || { nome: 'N/A', codigo: '' },
        // Garantir valores numéricos
        valorConcedido: credito.valorConcedido || 0,
        valorTotal: credito.valorTotal || 0,
        totalPago: credito.totalPago || 0,
        totalEmDivida: credito.totalEmDivida || 0,
        numeroDePrestacoes: credito.numeroDePrestacoes || 0,
        // Formatar data
        dataEmissaoFormatada: credito.dataEmissao
          ? moment(credito.dataEmissao).format('DD/MM/YYYY')
          : '-'
      }));

      console.log('Créditos processados:', creditosProcessados.length);
      setCreditos(creditosProcessados);
      setTotal(response.total || response.totalElements || creditosProcessados.length);
    } catch (error) {
      console.error('Erro ao carregar créditos:', error);
      message.error('Erro ao carregar créditos');
      setCreditos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCreditos();
  }, [filtros]);

  const handleFilter = (novosFiltros) => {
    setFiltros({ ...filtros, ...novosFiltros, offset: 0 });
  };

  const handleTableChange = (pagination) => {
    setFiltros({
      ...filtros,
      max: pagination.pageSize,
      offset: (pagination.current - 1) * pagination.pageSize
    });
  };

  const columns = [
    {
      title: 'Número',
      dataIndex: 'numero',
      key: 'numero',
      width: 150,
    },
    {
      title: 'Entidade',
      key: 'entidade',
      render: (_, record) => record.entidade?.nome || 'N/A',
      ellipsis: true,
    },
    {
      title: 'Valor',
      dataIndex: 'valorConcedido',
      key: 'valorConcedido',
      render: (valor) => formatarMoeda(valor),
      width: 130,
    },
    {
      title: 'Total',
      dataIndex: 'valorTotal',
      key: 'valorTotal',
      render: (valor) => formatarMoeda(valor),
      width: 130,
    },
    {
      title: 'Pago',
      dataIndex: 'totalPago',
      key: 'totalPago',
      render: (valor) => formatarMoeda(valor),
      width: 130,
    },
    {
      title: 'Saldo',
      dataIndex: 'totalEmDivida',
      key: 'totalEmDivida',
      render: (valor) => {
        const saldo = Math.abs(valor || 0);
        return (
          <span style={{ color: valor > 0 ? '#ff4d4f' : '#52c41a' }}>
            {formatarMoeda(saldo)}
          </span>
        );
      },
      width: 130,
    },
    {
      title: 'Prestações',
      dataIndex: 'numeroDePrestacoes',
      key: 'numeroDePrestacoes',
      width: 100,
    },
    {
      title: 'Periodicidade',
      dataIndex: 'periodicidade',
      key: 'periodicidade',
      width: 100,
    },
    {
      title: 'Data Emissão',
      dataIndex: 'dataEmissaoFormatada',
      key: 'dataEmissao',
      width: 120,
    },
    {
      title: 'Status',
        dataIndex: 'status',  // ← Agora é uma string, pois foi processado
        key: 'status',
        render: (status) => getStatusTag(status),
        width: 120,

    },
    {
      title: 'Ações',
      key: 'acoes',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/creditos/${record.id}`)}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Créditos"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/creditos/novo')}
        >
          Novo Crédito
        </Button>
      }
    >
      <CreditoFilters onFilter={handleFilter} />

      <Table
        columns={columns}
        dataSource={creditos}
        loading={loading}
        rowKey="id"
        pagination={{
          total: total,
          pageSize: filtros.max,
          current: Math.floor(filtros.offset / filtros.max) + 1,
          showSizeChanger: true,
          showTotal: (total) => `Total de ${total} créditos`,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        onChange={handleTableChange}
        scroll={{ x: 1400 }}
        locale={{
          emptyText: 'Nenhum crédito encontrado'
        }}
      />
    </Card>
  );
};

export default CreditoList;