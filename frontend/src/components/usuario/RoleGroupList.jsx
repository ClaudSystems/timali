import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Input, Tag, Popconfirm, Card, message,
  Modal, Form, Typography, Row, Col, Select, Descriptions
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined,
  SearchOutlined, ReloadOutlined, SafetyOutlined, EyeOutlined
} from '@ant-design/icons';
import roleGroupService from '../../services/roleGroupService';
import roleService from '../../services/roleService';

const { Title, Text } = Typography;

const RoleGroupList = () => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsData, rolesData] = await Promise.all([
        roleGroupService.list({ search }),
        roleService.list()
      ]);

      setGroups(Array.isArray(groupsData) ? groupsData : groupsData.data || []);
      setRoles(Array.isArray(rolesData) ? rolesData : rolesData.data || []);
    } catch (error) {
      message.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleDelete = async (id) => {
    try {
      await roleGroupService.delete(id);
      message.success('Grupo deletado com sucesso!');
      fetchData();
    } catch (error) {
      message.error('Erro ao deletar grupo');
    }
  };

  const openModal = (group = null) => {
    setEditingGroup(group);
    if (group) {
      form.setFieldsValue({
        name: group.name,
        description: group.description,
        roleIds: group.roles?.map(r => r.id) || []
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  const openDetail = (group) => {
    setSelectedGroup(group);
    setDetailVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingGroup) {
        await roleGroupService.update(editingGroup.id, values);
        message.success('Grupo atualizado!');
      } else {
        await roleGroupService.create(values);
        message.success('Grupo criado!');
      }
      setModalVisible(false);
      fetchData();
    } catch (error) {
      if (error.errorFields) {
        message.error('Preencha todos os campos obrigatórios');
      } else {
        message.error('Erro ao salvar grupo');
      }
    }
  };

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Text strong>
          <TeamOutlined style={{ marginRight: 8 }} />
          {text}
        </Text>
      ),
    },
    {
      title: 'Descrição',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles) => {
        if (!roles || roles.length === 0) {
          return <Text type="secondary">Nenhuma role</Text>;
        }
        const visibleRoles = roles.slice(0, 2);
        return (
          <Space wrap>
            {visibleRoles.map(role => (
              <Tag key={role.id} color="blue">
                <SafetyOutlined /> {role.authority}
              </Tag>
            ))}
            {roles.length > 2 && (
              <Tag>+{roles.length - 2} mais</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Total Roles',
      dataIndex: 'totalRoles',
      key: 'totalRoles',
      width: 110,
      align: 'center',
      render: (total) => (
        <Tag color={total > 10 ? 'red' : total > 5 ? 'orange' : 'green'}>
          {total || 0} roles
        </Tag>
      ),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => openDetail(record)}
          >
            Ver
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openModal(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="Tem certeza que deseja deletar este grupo?"
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
              <TeamOutlined /> Grupos de Roles
            </Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Buscar grupo..."
                allowClear
                onSearch={setSearch}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Button icon={<ReloadOutlined />} onClick={fetchData}>
                Atualizar
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
              >
                Novo Grupo
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={groups}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} grupos`
          }}
        />
      </Card>

      {/* Modal de Criar/Editar */}
      <Modal
        title={editingGroup ? 'Editar Grupo de Roles' : 'Novo Grupo de Roles'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nome do Grupo"
            rules={[
              { required: true, message: 'Nome é obrigatório' },
              { min: 3, message: 'Mínimo 3 caracteres' }
            ]}
          >
            <Input placeholder="Ex: ADMIN, GERENTE, CAIXA" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descrição"
            rules={[{ required: true, message: 'Descrição é obrigatória' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Descreva o propósito deste grupo"
            />
          </Form.Item>

          <Form.Item
            name="roleIds"
            label="Roles"
            rules={[{ required: true, message: 'Selecione pelo menos uma role' }]}
          >
            <Select
              mode="multiple"
              placeholder="Selecione as roles do grupo"
              options={roles.map(role => ({
                label: role.authority,
                value: role.id
              }))}
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        title="Detalhes do Grupo"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            Fechar
          </Button>
        ]}
        width={700}
      >
        {selectedGroup && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Nome">
              <Text strong>{selectedGroup.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Descrição">
              {selectedGroup.description}
            </Descriptions.Item>
            <Descriptions.Item label="Total de Roles">
              <Tag color="blue">{selectedGroup.totalRoles || selectedGroup.roles?.length || 0}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Roles">
              <Space wrap>
                {selectedGroup.roles?.map(role => (
                  <Tag key={role.id} color="blue" style={{ marginBottom: 4 }}>
                    <SafetyOutlined /> {role.authority}
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default RoleGroupList;