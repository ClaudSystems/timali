// frontend/src/components/entidade/EntidadeList.jsx
import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Space, Input, Select, Tag,
  message, Tooltip, Row, Col, Badge, Typography,
  Empty, Modal, Dropdown, Spin
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ReloadOutlined, EyeOutlined,
  ClearOutlined, ThunderboltOutlined, FormOutlined,
  MoreOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import EntidadeForm from './EntidadeForm';
import EntidadeView from './EntidadeView';
import entidadeService from '../../services/entidadeService';

const { Title, Text } = Typography;
const { Option } = Select;

const EntidadeList = ({ onEdit, refreshTrigger }) => {
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [entidadeSelecionada, setEntidadeSelecionada] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);

  useEffect(() => {
    carregarEntidades();
  }, [refreshTrigger]);

  const carregarEntidades = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await entidadeService.listar();
      setEntidades(Array.isArray(dados) ? dados : []);
    } catch (err) {
      setError('Erro ao carregar entidades');
      message.error('Falha ao carregar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, nome) => {
    try {
      await entidadeService.excluir(id);
      setEntidades(entidades.filter(e => e.id !== id));
      message.success(`Entidade "${nome}" excluída!`);
    } catch (err) {
      message.error('Erro ao excluir');
    }
  };

  const getTipoPessoaColor = (tipo) => {
    const colors = { 'CLIENTE': 'blue', 'ASSINANTE': 'green', 'FORNECEDOR': 'orange', 'FUNCIONARIO': 'cyan' };
    return colors[tipo] || 'default';
  };

  const getClassificacaoColor = (classificacao) => {
    const colors = {
      'NAO_CLASSIFICADO': 'default', 'MAU': 'error', 'REGULAR': 'warning',
      'BOM': 'success', 'MUITO_BOM': 'cyan', 'EXCELENTE': 'blue',
      'VIP': 'purple', 'PREMIUM': 'gold'
    };
    return colors[classificacao] || 'default';
  };

  const entidadesFiltradas = entidades.filter(entidade => {
    const nome = entidade.nome || '';
    const codigo = entidade.codigo || '';
    const telefone = entidade.contacto?.telefone || '';
    const email = entidade.contacto?.email || '';

    const matchSearch =
      nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      telefone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTipo = filtroTipo === 'TODOS' || entidade.tipoDePessoa === filtroTipo;

    return matchSearch && matchTipo;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFiltroTipo('TODOS');
  };

  const openCreateModal = () => {
    setEntidadeSelecionada(null);
    setModoEdicao(false);
    setModalVisible(true);
  };

  const openEditModal = (record) => {
    setEntidadeSelecionada(record);
    setModoEdicao(true);
    setModalVisible(true);
  };

  const openViewModal = (record) => {
    setEntidadeSelecionada(record);
    setViewModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEntidadeSelecionada(null);
    setModoEdicao(false);
  };

const handleSubmit = async (values) => {
    try {
        if (modoEdicao && entidadeSelecionada) {
            await entidadeService.atualizar(entidadeSelecionada.id, values);
            message.success('Entidade atualizada!');
        } else {
            await entidadeService.criar(values);
            message.success('Entidade criada!');
        }
        closeModal();
        carregarEntidades();
    } catch (error) {
        message.error('Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
        throw error;
    }
};

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 100,
      render: (codigo) => codigo ? <Tag color="blue">{codigo}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      sorter: (a, b) => (a.nome || '').localeCompare(b.nome || ''),
      render: (nome, record) => (
        <a onClick={() => openViewModal(record)} style={{ fontWeight: 500 }}>{nome || '—'}</a>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoDePessoa',
      key: 'tipoDePessoa',
      width: 120,
      render: (tipo) => tipo ? <Tag color={getTipoPessoaColor(tipo)}>{tipo}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: 'Contacto',
      key: 'contacto',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.contacto?.telefone && <Text>{record.contacto.telefone}</Text>}
          {record.contacto?.email && <Text type="secondary">{record.contacto.email}</Text>}
          {!record.contacto?.telefone && !record.contacto?.email && <Text type="secondary">—</Text>}
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Badge status={record.ativo ? 'success' : 'error'} text={record.ativo ? 'Ativo' : 'Inativo'} />
      ),
    },
    {
      title: 'Classificação',
      dataIndex: 'classificacao',
      key: 'classificacao',
      width: 140,
      render: (classificacao) => {
        if (!classificacao) return <Text type="secondary">—</Text>;
        return <Tag color={getClassificacaoColor(classificacao)}>{classificacao}</Tag>;
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 60,
      fixed: 'right',
      render: (_, record) => {
        const items = [
          { key: 'view', icon: <EyeOutlined />, label: 'Visualizar', onClick: () => openViewModal(record) },
          { key: 'edit', icon: <EditOutlined />, label: 'Editar', onClick: () => openEditModal(record) },
          { type: 'divider' },
          {
            key: 'delete', icon: <DeleteOutlined />, label: 'Excluir', danger: true,
            onClick: () => Modal.confirm({
              title: 'Confirmar exclusão',
              icon: <ExclamationCircleOutlined />,
              content: `Excluir "${record.nome}"?`,
              okText: 'Sim', okType: 'danger', cancelText: 'Não',
              onOk: () => handleDelete(record.id, record.nome),
            }),
          },
        ];
        return <Dropdown menu={{ items }} trigger={['click']}><Button type="text" icon={<MoreOutlined />} /></Dropdown>;
      },
    },
  ];

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Text type="danger">{error}</Text>
          <br />
          <Button type="primary" onClick={carregarEntidades} style={{ marginTop: 16 }} icon={<ReloadOutlined />}>
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <Space>
            <Title level={3} style={{ margin: 0 }}>Entidades</Title>
            <Tag>{entidadesFiltradas.length} registros</Tag>
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={carregarEntidades}>Atualizar</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>Nova Entidade</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8}>
            <Input placeholder="Buscar..." prefix={<SearchOutlined />} value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)} allowClear size="large" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select style={{ width: '100%' }} value={filtroTipo} onChange={setFiltroTipo} size="large">
              <Option value="TODOS">Todos os tipos</Option>
              <Option value="CLIENTE">Cliente</Option>
              <Option value="ASSINANTE">Assinante</Option>
              <Option value="FORNECEDOR">Fornecedor</Option>
              <Option value="FUNCIONARIO">Funcionário</Option>
            </Select>
          </Col>
          {(searchTerm || filtroTipo !== 'TODOS') && (
            <Col xs={24} sm={24} md={4}>
              <Button icon={<ClearOutlined />} onClick={clearFilters} size="large" block>Limpar</Button>
            </Col>
          )}
        </Row>

        <Table columns={columns} dataSource={entidadesFiltradas} rowKey="id" loading={loading}
          pagination={{ showSizeChanger: true, showTotal: (total) => `Total: ${total}`, defaultPageSize: 10 }}
          scroll={{ x: 800 }} size="middle"
          locale={{ emptyText: <Empty description="Nenhuma entidade encontrada" /> }}
        />

        {/* Modal Visualização */}
        <Modal title={<Space><EyeOutlined />{entidadeSelecionada?.nome}</Space>}
          open={viewModalVisible} onCancel={() => setViewModalVisible(false)}
          footer={null} width={1000} destroyOnHidden>
          {entidadeSelecionada ? (
            <EntidadeView entidadeId={entidadeSelecionada.id} isModal={true}
              onClose={() => setViewModalVisible(false)}
              onUpdate={() => { setViewModalVisible(false); carregarEntidades(); }} />
          ) : <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>}
        </Modal>

        {/* Modal Criação/Edição */}
        <Modal title={modoEdicao ? 'Editar Entidade' : 'Nova Entidade'}
          open={modalVisible} onCancel={closeModal} footer={null} width={800} destroyOnHidden>
          <EntidadeForm entidade={entidadeSelecionada} onSubmit={handleSubmit} onCancel={closeModal} />
        </Modal>
      </Card>
    </div>
  );
};

export default EntidadeList;