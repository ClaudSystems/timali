import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Input, Tag, Popconfirm, Card, message,
  Modal, Form, Typography, Row, Col
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined,
  SearchOutlined, ReloadOutlined, SafetyOutlined
} from '@ant-design/icons';
import roleService from '../../services/roleService';

const { Title, Text } = Typography;

const RoleList = () => {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;

      const response = await roleService.list(params);
      setRoles(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      message.error('Erro ao carregar roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [search]);

  const handleDelete = async (id) => {
    try {
      await roleService.delete(id);
      message.success('Role deletada com sucesso!');
      fetchRoles();
    } catch (error) {
      message.error('Erro ao deletar role');
    }
  };

  const openModal = (role = null) => {
    setEditingRole(role);
    if (role) {
      form.setFieldsValue({ authority: role.authority });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      // Garantir que authority tenha prefixo ROLE_
      const authority = values.authority.toUpperCase().startsWith('ROLE_')
        ? values.authority.toUpperCase()
        : `ROLE_${values.authority.toUpperCase()}`;

      if (editingRole) {
        await roleService.update(editingRole.id, { authority });
        message.success('Role atualizada!');
      } else {
        await roleService.create({ authority });
        message.success('Role criada!');
      }
      setModalVisible(false);
      fetchRoles();
    } catch (error) {
      if (error.errorFields) {
        message.error('Preencha o campo corretamente');
      } else {
        message.error('Erro ao salvar role');
      }
    }
  };

  const handleInitDefaults = async () => {
    try {
      await roleService.initDefaults();
      message.success('Roles padrão inicializadas!');
      fetchRoles();
    } catch (error) {
      message.error('Erro ao inicializar roles padrão');
    }
  };

  const getRoleColor = (authority) => {
    if (!authority) return 'default';
    if (authority.includes('ADMIN')) return 'red';
    if (authority.includes('GERENTE')) return 'blue';
    if (authority.includes('GESTOR')) return 'green';
    if (authority.includes('CAIXA')) return 'orange';
    if (authority.includes('CREATE')) return 'geekblue';
    if (authority.includes('READ')) return 'cyan';
    if (authority.includes('UPDATE')) return 'purple';
    if (authority.includes('DELETE')) return 'magenta';
    return 'default';
  };

  const columns = [
    {
      title: 'Authority',
      dataIndex: 'authority',
      key: 'authority',
      render: (text) => (
        <Text strong>
          <SafetyOutlined style={{ marginRight: 8 }} />
          <Tag color={getRoleColor(text)}>{text}</Tag>
        </Text>
      ),
    },
    {
      title: 'Descrição',
      dataIndex: 'authority',
      key: 'description',
      render: (authority) => {
        const descriptions = {
          'ROLE_ADMIN': 'Administrador do sistema',
          'ROLE_USER': 'Usuário básico',
          'ROLE_GERENTE': 'Gerente - Gestão financeira',
          'ROLE_GESTOR': 'Gestor - Supervisão',
          'ROLE_CAIXA': 'Caixa - Operações',
        };
        return <Text type="secondary">{descriptions[authority] || authority.replace('ROLE_', '').replace('_', ' ')}</Text>;
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
            onClick={() => openModal(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Tem certeza que deseja deletar esta role?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
            okButtonProps={{ danger: true }}
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
              <KeyOutlined /> Roles (Permissões)
            </Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Buscar role..."
                allowClear
                onSearch={setSearch}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchRoles}>
                Atualizar
              </Button>
              <Button onClick={handleInitDefaults}>
                Inicializar Padrões
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
              >
                Nova Role
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} roles`
          }}
        />
      </Card>

      <Modal
        title={editingRole ? 'Editar Role' : 'Nova Role'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={500}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="authority"
            label="Authority"
            rules={[
              { required: true, message: 'Authority é obrigatória' },
              { min: 5, message: 'Mínimo 5 caracteres' },
              {
                pattern: /^ROLE_[A-Z_]+$/,
                message: 'Formato: ROLE_EXEMPLO (letras maiúsculas e underscore)'
              }
            ]}
            help="Ex: ROLE_ADMIN, ROLE_CREDITO_CREATE"
          >
            <Input
              placeholder="ROLE_EXEMPLO"
              onChange={(e) => {
                // Auto-prefix ROLE_ se não tiver
                let value = e.target.value.toUpperCase();
                if (!value.startsWith('ROLE_')) {
                  value = 'ROLE_' + value;
                }
                form.setFieldsValue({ authority: value });
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleList;