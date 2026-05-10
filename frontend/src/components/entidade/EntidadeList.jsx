import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Tooltip,
  Row,
  Col,
  Badge,
  Typography,
  Empty,
  Modal,
  Descriptions,
  Dropdown
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  EyeOutlined,
  FilterOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  FormOutlined,
  MoreOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import EntidadeForm from './EntidadeForm';
import EntidadeFormSimples from './EntidadeFormSimples';
import entidadeService from '../../services/entidadeService';
const { Title, Text } = Typography;
const { Option } = Select;

const EntidadeList = ({ onEdit, refreshTrigger }) => {
  // Estados
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [entidadeSelecionada, setEntidadeSelecionada] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [modoRapido, setModoRapido] = useState(false);

  // Efeitos
  useEffect(() => {
    carregarEntidades();
  }, [refreshTrigger]);

  // Funções
  const carregarEntidades = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await entidadeService.listar();
      setEntidades(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('❌ Erro ao carregar:', err);
      setError('Erro ao carregar entidades. Tente novamente.');
      message.error('Falha ao carregar entidades');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nome) => {
    try {
      await entidadeService.excluir(id);
      setEntidades(entidades.filter(e => e.id !== id));
      message.success(`Entidade "${nome}" excluída com sucesso!`);
    } catch (err) {
      message.error(`Erro ao excluir: ${err.message}`);
    }
  };

  const getValorTipoPessoa = (entidade) => {
    if (!entidade?.tipoDePessoa) return '';
    if (typeof entidade.tipoDePessoa === 'string') return entidade.tipoDePessoa;
    if (entidade.tipoDePessoa.name) return entidade.tipoDePessoa.name;
    return '';
  };

  const getTipoPessoaColor = (tipo) => {
    const colors = {
      'CLIENTE': 'blue',
      'ASSINANTE': 'green',
      'FORNECEDOR': 'orange',
      'FUNCIONARIO': 'cyan'
    };
    return colors[tipo] || 'default';
  };

  const getClassificacaoColor = (classificacao) => {
    const colors = {
      'NAO_CLASSIFICADO': 'default',
      'MAU': 'error',
      'REGULAR': 'warning',
      'BOM': 'success',
      'MUITO_BOM': 'cyan',
      'EXCELENTE': 'blue',
      'VIP': 'purple',
      'PREMIUM': 'gold'
    };
    return colors[classificacao] || 'default';
  };

  const entidadesFiltradas = entidades.filter(entidade => {
    const nome = entidade.nome || '';
    const codigo = entidade.codigo || '';
    const email = entidade.email || '';
    const telefone = entidade.telefone || entidade.telefone1 || '';

    const matchSearch =
      nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      telefone.toLowerCase().includes(searchTerm.toLowerCase());

    const tipoValue = getValorTipoPessoa(entidade);
    const matchTipo = filtroTipo === 'TODOS' || tipoValue === filtroTipo;

    return matchSearch && matchTipo;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFiltroTipo('TODOS');
  };

  const openCreateModal = (rapido = false) => {
    setEntidadeSelecionada(null);
    setModoEdicao(false);
    setModoRapido(rapido);
    setModalVisible(true);
  };

  const openEditModal = (record, rapido = false) => {
      console.log('🔍 DADOS COMPLETOS DA ENTIDADE:');
        console.log(JSON.stringify(record, null, 2));
        console.log('🔍 tipoDePessoa:', typeof record.tipoDePessoa, record.tipoDePessoa);
        console.log('🔍 classificacao:', typeof record.classificacao, record.classificacao);
        console.log('🔍 usuario:', record.usuario);
    setEntidadeSelecionada(record);
    setModoEdicao(true);
    setModoRapido(rapido);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEntidadeSelecionada(null);
    setModoEdicao(false);
    setModoRapido(false);
  };

  const handleSubmit = async (values) => {
    try {
      if (modoEdicao && entidadeSelecionada) {
        const dadosAtualizados = {
          ...entidadeSelecionada,
          ...values,
          id: entidadeSelecionada.id,
          version: entidadeSelecionada.version
        };
        await entidadeService.atualizar(entidadeSelecionada.id, dadosAtualizados);
        message.success('Entidade atualizada com sucesso!');
      } else {
        await entidadeService.criar(values);
        message.success('Entidade criada com sucesso!');
      }

      closeModal();
      carregarEntidades();
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      message.error('Erro ao salvar entidade');
    }
  };

  const openViewModal = (record) => {
    setEntidadeSelecionada(record);
    setViewModalVisible(true);
  };

  // Colunas da tabela - LIMPA E MODERNA
  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 100,
      render: (codigo) => (
        codigo ? <Tag color="blue">{codigo}</Tag> : <Text type="secondary">—</Text>
      ),
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      sorter: (a, b) => (a.nome || '').localeCompare(b.nome || ''),
      render: (nome, record) => (
        <a onClick={() => openViewModal(record)} style={{ fontWeight: 500 }}>
          {nome || '—'}
        </a>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoDePessoa',
      key: 'tipoDePessoa',
      width: 120,
      render: (tipo, record) => {
        const tipoValue = getValorTipoPessoa(record);
        return tipoValue ? (
          <Tag color={getTipoPessoaColor(tipoValue)}>{tipoValue}</Tag>
        ) : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Contacto',
      key: 'contacto',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.telefone && <Text>{record.telefone}</Text>}
          {record.email && <Text type="secondary">{record.email}</Text>}
          {!record.telefone && !record.email && <Text type="secondary">—</Text>}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Space>
          <Badge
            status={record.ativo ? 'success' : 'error'}
            text={record.ativo ? 'Ativo' : 'Inativo'}
          />
          {record.emDivida && (
            <Tooltip title="Em dívida">
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Classificação',
      dataIndex: 'classificacao',
      key: 'classificacao',
      width: 140,
      render: (classificacao) => {
        if (!classificacao) return <Text type="secondary">—</Text>;
        const classificacaoValue = typeof classificacao === 'object' ? classificacao.name : classificacao;
        return (
          <Tag color={getClassificacaoColor(classificacaoValue)}>
            {classificacaoValue}
          </Tag>
        );
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, record) => {
        const items = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'Visualizar',
            onClick: () => openViewModal(record),
          },
          {
            key: 'edit-complete',
            icon: <EditOutlined />,
            label: 'Editar (Completo)',
            onClick: () => openEditModal(record, false),
          },
          {
            key: 'edit-fast',
            icon: <ThunderboltOutlined />,
            label: 'Editar (Rápido)',
            onClick: () => openEditModal(record, true),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Excluir',
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: 'Confirmar exclusão',
                icon: <ExclamationCircleOutlined />,
                content: `Tem certeza que deseja excluir "${record.nome}"?`,
                okText: 'Sim, excluir',
                okType: 'danger',
                cancelText: 'Não',
                onOk: () => handleDelete(record.id, record.nome),
              });
            },
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="danger" style={{ fontSize: 16 }}>{error}</Text>
          <br />
          <Button
            type="primary"
            onClick={carregarEntidades}
            style={{ marginTop: 16 }}
            icon={<ReloadOutlined />}
          >
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* Cabeçalho LIMPO */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16
        }}>
          <Space>
            <Title level={3} style={{ margin: 0 }}>
              Entidades
            </Title>
            <Tag style={{ fontWeight: 'normal' }}>
              {entidadesFiltradas.length} registros
            </Tag>
          </Space>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={carregarEntidades}
            >
              Atualizar
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openCreateModal(false)}
            >
              Nova Entidade
            </Button>
          </Space>
        </div>

        {/* Filtros */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar por nome, código, email ou telefone..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              size="large"
            />
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filtrar por tipo"
              style={{ width: '100%' }}
              value={filtroTipo}
              onChange={(value) => setFiltroTipo(value)}
              size="large"
            >
              <Option value="TODOS">Todos os tipos</Option>
              <Option value="CLIENTE">Cliente</Option>
              <Option value="ASSINANTE">Assinante</Option>
              <Option value="FORNECEDOR">Fornecedor</Option>
              <Option value="FUNCIONARIO">Funcionário</Option>
            </Select>
          </Col>

          {(searchTerm || filtroTipo !== 'TODOS') && (
            <Col xs={24} sm={24} md={4}>
              <Button
                icon={<ClearOutlined />}
                onClick={clearFilters}
                size="large"
                block
              >
                Limpar
              </Button>
            </Col>
          )}
        </Row>

        {/* Tabela */}
        <Table
          columns={columns}
          dataSource={entidadesFiltradas}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} entidades`,
            pageSizeOptions: ['10', '20', '50'],
            defaultPageSize: 10,
          }}
          scroll={{ x: 900 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty
                description="Nenhuma entidade encontrada"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />

        {/* Modal de Criação/Edição */}
        {/* Modal RÁPIDO */}
        <Modal
          title="Entidade (Rápido)"
          open={modalVisible && modoRapido}
          onCancel={closeModal}
          footer={null}
          width={500}
          destroyOnHidden
        >
          <EntidadeFormSimples
            entidade={entidadeSelecionada}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>

        {/* Modal COMPLETO */}
        <Modal
          title="Entidade (Completo)"
          open={modalVisible && !modoRapido}
          onCancel={closeModal}
          footer={null}
          width={900}
          destroyOnHidden
        >
          <EntidadeForm
            entidade={entidadeSelecionada}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      </Card>
    </div>
  );
};

export default EntidadeList;