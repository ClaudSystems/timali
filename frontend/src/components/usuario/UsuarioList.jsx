import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Tag, Tooltip, Popconfirm, Card, message, Switch, Typography, Badge, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, SearchOutlined, TeamOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import usuarioService from '../../services/usuarioService';

const { Title, Text } = Typography;

const UsuarioList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const params = {
        max: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize
      };
      if (search) params.search = search;

      const response = await usuarioService.list(params);
      setUsuarios(Array.isArray(response) ? response : response.data || []);
      setTotalCount(response.totalCount || (Array.isArray(response) ? response.length : 0));
    } catch (error) {
      message.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [pagination.current, pagination.pageSize]);

  const handleSearch = (value) => {
    setSearch(value);
    setPagination({ ...pagination, current: 1 });
  };

  const handleDelete = async (id) => {
    try {
      await usuarioService.delete(id);
      message.success('Usuário deletado com sucesso!');
      fetchUsuarios();
    } catch (error) {
      message.error('Erro ao deletar usuário');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await usuarioService.toggleStatus(id);
      message.success('Status alterado!');
      fetchUsuarios();
    } catch (error) {
      message.error('Erro ao alterar status');
    }
  };

  const getRoleColor = (authority) => {
    if (!authority) return 'default';
    if (authority.includes('ADMIN')) return 'red';
    if (authority.includes('GERENTE')) return 'blue';
    if (authority.includes('GESTOR')) return 'green';
    if (authority.includes('CAIXA')) return 'orange';
    return 'default';
  };

  const getGroupColor = (name) => {
    if (!name) return 'default';
    if (name === 'ADMIN') return 'red';
    if (name === 'GERENTE') return 'blue';
    if (name === 'GESTOR') return 'green';
    if (name === 'CAIXA') return 'orange';
    return 'purple';
  };

  const columns = [
    {
      title: 'Usuário',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <Badge status={record.enabled ? 'success' : 'error'} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      align: 'center',
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggleStatus(record.id)}
          checkedChildren="Ativo"
          unCheckedChildren="Inativo"
        />
      ),
    },
    {
      title: 'Grupos',
      dataIndex: 'groups',
      key: 'groups',
      render: (groups) => {
        if (!groups || groups.length === 0) {
          return <Text type="secondary">Sem grupo</Text>;
        }
        return (
          <Space wrap>
            {groups.map(group => (
              <Tag color={getGroupColor(group.name)} key={group.id}>
                <TeamOutlined /> {group.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles) => {
        if (!roles || roles.length === 0) {
          return <Text type="secondary">Sem roles</Text>;
        }
        const visibleRoles = roles.slice(0, 3);
        const hiddenRoles = roles.slice(3);

        return (
          <Space wrap>
            {visibleRoles.map(role => (
              <Tag color={getRoleColor(role.authority)} key={role.id}>
                {role.description || role.authority?.replace('ROLE_', '')}
              </Tag>
            ))}
            {hiddenRoles.length > 0 && (
              <Tooltip
                title={hiddenRoles.map(r => r.description || r.authority?.replace('ROLE_', '')).join(', ')}
              >
                <Tag>+{hiddenRoles.length} mais</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Status da Conta',
      key: 'accountStatus',
      width: 130,
      align: 'center',
      render: (_, record) => {
        const issues = [];
        if (record.accountExpired) issues.push('Expirada');
        if (record.accountLocked) issues.push('Bloqueada');
        if (record.passwordExpired) issues.push('Senha Expirada');

        return issues.length > 0 ? (
          <Space direction="vertical" size="small">
            {issues.map(issue => (
              <Tag color="error" key={issue}>{issue}</Tag>
            ))}
          </Space>
        ) : (
          <Tag color="success">Normal</Tag>
        );
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/usuarios/${record.id}`)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Tem certeza que deseja deletar este usuário?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <UserOutlined /> Gestão de Usuários
            </Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Buscar usuário..."
                allowClear
                onSearch={handleSearch}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchUsuarios}>
                Atualizar
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/usuarios/novo')}
              >
                Novo Usuário
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={usuarios}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total: totalCount,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} usuários`,
            pageSizeOptions: ['10', '20', '50']
          }}
          onChange={(pag) => setPagination(pag)}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default UsuarioList;