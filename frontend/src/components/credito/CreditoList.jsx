// src/components/credito/CreditoList.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Card, Tag, Space, message, AutoComplete, Input, Row, Col, Empty } from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  SearchOutlined,
  ClearOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import  entidadeService  from '../../services/entidadeService';
import creditoService from '../../services/creditoService';

// ====================================================================
// HOOK: Debounce manual
// ====================================================================
const useDebounce = (callback, delay) => {
  const timeoutRef = React.useRef(null);
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

// ====================================================================
// FUNÇÕES AUXILIARES
// ====================================================================
const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined) return 'MT 0,00';
  return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(valor);
};

const getStatusTag = (status) => {
  const statusStr = typeof status === 'string' ? status : status?.name || status?.toString() || 'ATIVO';
  const statusMap = {
    'ATIVO': { color: 'green', text: 'Ativo' },
    'Ativo': { color: 'green', text: 'Ativo' },
    'EM_ATRASO': { color: 'red', text: 'Em Atraso' },
    'Em Atraso': { color: 'red', text: 'Em Atraso' },
    'QUITADO': { color: 'blue', text: 'Quitado' },
    'CANCELADO': { color: 'orange', text: 'Cancelado' },
    'RASCUNHO': { color: 'default', text: 'Rascunho' },
    'RENEGOCIADO': { color: 'purple', text: 'Renegociado' }
  };
  const config = statusMap[statusStr] || { color: 'default', text: statusStr };
  return <Tag color={config.color}>{config.text}</Tag>;
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
const CreditoList = () => {
  const navigate = useNavigate();
  const savedState = JSON.parse(localStorage.getItem('creditoListState') || 'null');

  const [creditos, setCreditos] = useState(savedState?.creditos || []);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(savedState?.total || 0);
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(savedState?.clienteSelecionado || null);
  const [valorInput, setValorInput] = useState(savedState?.valorInput || '');
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [pesquisou, setPesquisou] = useState(savedState?.pesquisou || false);

  useEffect(() => {
    if (pesquisou && creditos.length > 0) {
      localStorage.setItem('creditoListState', JSON.stringify({ creditos, total, clienteSelecionado, valorInput, pesquisou }));
    }
  }, [creditos, total, clienteSelecionado, valorInput, pesquisou]);

  useEffect(() => {
    if (savedState?.clienteSelecionado && savedState?.creditos?.length > 0) {
      setCreditos(savedState.creditos);
      setTotal(savedState.total);
      setClienteSelecionado(savedState.clienteSelecionado);
      setValorInput(savedState.valorInput);
      setPesquisou(savedState.pesquisou);
    }
  }, []);

  // ====================================================================
  // BUSCAR CLIENTES (AutoComplete)
  // ====================================================================
  const buscarClientes = async (searchText) => {
      if (!searchText || searchText.length < 2) { setClientes([]); return; }
      setBuscandoClientes(true);
      try {
          const token = localStorage.getItem('timali_token');
          const response = await fetch(`http://localhost:8080/api/entidades/buscar?query=${encodeURIComponent(searchText)}`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          const data = await response.json();

          const opcoes = data.map(cliente => ({
              value: cliente.nome,
              label: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span><UserOutlined style={{ marginRight: 8 }} />{cliente.nome}</span>
                      {cliente.codigo && <Tag color="blue" style={{ marginLeft: 8 }}>{cliente.codigo}</Tag>}
                  </div>
              ),
              cliente: cliente,
          }));
          setClientes(opcoes);
      } catch (error) {
          setClientes([]);
      } finally {
          setBuscandoClientes(false);
      }
  };

  const buscarClientesDebounced = useDebounce(buscarClientes, 300);

  // ====================================================================
  // HANDLERS
  // ====================================================================
  const handleSelecionarCliente = (value, option) => {
    if (option?.cliente) {
      setClienteSelecionado(option.cliente);
      setValorInput(value);
      setClientes([]);
      buscarCreditosDoCliente(option.cliente);
    }
  };

  const handleChange = (value) => {
    setValorInput(value);
    buscarClientesDebounced(value);
    if (!value) limparPesquisa();
  };

  // Buscar por número de crédito ao pressionar Enter ou clicar no ícone
  const handlePesquisar = () => {
    if (!valorInput || valorInput.length < 2) return;
    if (clienteSelecionado) return;

    setLoading(true);
    setPesquisou(true);
    creditoService.listar({ max: 500 })
      .then(response => {
        let todosCreditos = [];
        if (Array.isArray(response)) todosCreditos = response;
        else if (response?.content) todosCreditos = response.content;
        else if (response?.data) todosCreditos = response.data;
        const termo = valorInput.toLowerCase();
        const creditosFiltrados = todosCreditos.filter(c => (c.numero || '').toLowerCase().includes(termo));
        setCreditos(creditosFiltrados);
        setTotal(creditosFiltrados.length);
        if (creditosFiltrados.length === 0) message.info(`Nenhum crédito encontrado com "${valorInput}"`);
      })
      .catch(() => message.error('Erro ao buscar créditos'))
      .finally(() => setLoading(false));
  };

  // ====================================================================
  // BUSCAR CRÉDITOS DO CLIENTE
  // ====================================================================
  const buscarCreditosDoCliente = async (cliente) => {
    if (!cliente?.id) return;
    setLoading(true);
    setPesquisou(true);
    try {
      const response = await creditoService.listar({ max: 500 });
      let todosCreditos = [];
      if (Array.isArray(response)) todosCreditos = response;
      else if (response?.content) todosCreditos = response.content;
      else if (response?.data) todosCreditos = response.data;
      const creditosDoCliente = todosCreditos.filter(c => {
        const entidadeId = c.entidade?.id || c.entidadeId;
        return entidadeId == cliente.id && !c.quitado;
      });
      const creditosCorrigidos = creditosDoCliente.map(c => ({
        ...c,
        totalEmDivida: c.totalEmDivida > 0 ? c.totalEmDivida : (c.valorTotal || 0) - (c.totalPago || 0)
      }));
      setCreditos(creditosCorrigidos);
      setTotal(creditosCorrigidos.length);
      if (creditosCorrigidos.length === 0) message.info(`Nenhum crédito ativo para "${cliente.nome}"`);
      else message.success(`Encontrados ${creditosCorrigidos.length} créditos`);
    } catch (error) {
      message.error('Erro ao buscar créditos');
      setCreditos([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const limparPesquisa = () => {
    setValorInput('');
    setClienteSelecionado(null);
    setClientes([]);
    setCreditos([]);
    setTotal(0);
    setPesquisou(false);
    localStorage.removeItem('creditoListState');
  };

  const verDetalhes = (id) => {
    localStorage.setItem('creditoListState', JSON.stringify({ creditos, total, clienteSelecionado, valorInput, pesquisou }));
    navigate(`/creditos/${id}`);
  };

  // ====================================================================
  // COLUNAS
  // ====================================================================
  const columns = [
    { title: 'Número', dataIndex: 'numero', key: 'numero', width: 180 },
    { title: 'Cliente', key: 'entidade', render: (_, r) => r.entidade?.nome || 'N/A', ellipsis: true },
    { title: 'Valor Total', dataIndex: 'valorTotal', key: 'valorTotal', render: v => formatarMoeda(v), width: 140 },
    { title: 'Pago', dataIndex: 'totalPago', key: 'totalPago', render: v => formatarMoeda(v), width: 130 },
    { title: 'Saldo Devedor', dataIndex: 'totalEmDivida', key: 'totalEmDivida',
      render: v => <span style={{ color: Math.abs(v||0) > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>{formatarMoeda(Math.abs(v||0))}</span>, width: 150 },
    { title: 'Prestações', dataIndex: 'numeroDePrestacoes', key: 'numeroDePrestacoes', width: 100 },
    { title: 'Status', dataIndex: 'status', key: 'status', render: s => getStatusTag(s), width: 120 },
    { title: 'Ações', key: 'acoes', fixed: 'right', width: 80,
      render: (_, r) => <Button type="link" icon={<EyeOutlined />} onClick={() => verDetalhes(r.id)}>Ver</Button> },
  ];

  // ====================================================================
  // RENDER
  // ====================================================================
  return (
    <Card
      title={<Space><span>Créditos Ativos</span>{clienteSelecionado && <Tag color="green" closable onClose={limparPesquisa}>{clienteSelecionado.nome}</Tag>}</Space>}
      extra={<Space><Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/creditos/novo')}>Novo Crédito</Button></Space>}
    >
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={16} md={12} lg={8}>
          <AutoComplete value={valorInput} options={clientes} onSelect={handleSelecionarCliente} onChange={handleChange}
            style={{ width: '100%' }}
            notFoundContent={buscandoClientes ? 'Buscando...' : valorInput.length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum cliente encontrado'}>
            <Input placeholder="Digite o nome do cliente ou nº do crédito..." prefix={<SearchOutlined />} size="large" allowClear onClear={limparPesquisa}
              onPressEnter={handlePesquisar}
              suffix={<Button type="text" icon={<SearchOutlined />} onClick={handlePesquisar} size="small" />} />
          </AutoComplete>
        </Col>
        <Col xs={24} sm={8} md={6} lg={4}>
          {pesquisou && <Button icon={<ClearOutlined />} onClick={limparPesquisa} size="large">Limpar</Button>}
        </Col>
      </Row>

      {!pesquisou ? (
        <Empty description="Digite o nome do cliente para buscar créditos ativos" style={{ padding: '40px 0' }} />
      ) : (
        <Table columns={columns} dataSource={creditos} loading={loading} rowKey="id" pagination={false} scroll={{ x: 1000 }}
          locale={{ emptyText: `Nenhum crédito ativo para "${clienteSelecionado?.nome || ''}"` }}
          summary={() => {
            if (creditos.length === 0) return null;
            const totalSaldo = creditos.reduce((acc, c) => acc + (parseFloat(c.totalEmDivida) || 0), 0);
            const totalPago = creditos.reduce((acc, c) => acc + (parseFloat(c.totalPago) || 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}><strong>Totais ({creditos.length} créditos)</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={1} colSpan={2}><strong>Pago: {formatarMoeda(totalPago)}</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={2} colSpan={2}><strong style={{ color: '#ff4d4f' }}>Saldo: {formatarMoeda(totalSaldo)}</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={3} colSpan={4} />
              </Table.Summary.Row>
            );
          }}
        />
      )}
    </Card>
  );
};

export default CreditoList;