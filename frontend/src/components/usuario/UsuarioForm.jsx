import React, { useState, useEffect } from 'react';
import {
  Form, Input, Button, Card, Space, Switch, message,
  Typography, Divider, Row, Col, Spin, Tabs, Select, Tag  // ADICIONADO Tag aqui
} from 'antd';
import {
  SaveOutlined, ArrowLeftOutlined, UserOutlined,
  LockOutlined, TeamOutlined, SafetyOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import usuarioService from '../../services/usuarioService';
import roleService from '../../services/roleService';
import roleGroupService from '../../services/roleGroupService';

const { Title } = Typography;
const { TabPane } = Tabs;

const UsuarioForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const isEditing = !!id;

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [rolesData, groupsData] = await Promise.all([
        roleService.list(),
        roleGroupService.list()
      ]);

      setRoles(Array.isArray(rolesData) ? rolesData : rolesData.data || []);
      setGroups(Array.isArray(groupsData) ? groupsData : groupsData.data || []);

      if (isEditing) {
        const userData = await usuarioService.getById(id);
        form.setFieldsValue({
          username: userData.username,
          enabled: userData.enabled,
          accountExpired: userData.accountExpired,
          accountLocked: userData.accountLocked,
          passwordExpired: userData.passwordExpired
        });
        setSelectedRoles(userData.roles?.map(r => r.id) || []);
        setSelectedGroups(userData.groups?.map(g => g.id) || []);
      }
    } catch (error) {
      message.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        username: values.username,
        enabled: values.enabled,
        accountExpired: values.accountExpired || false,
        accountLocked: values.accountLocked || false,
        passwordExpired: values.passwordExpired || false
      };

      if (values.password) {
        payload.password = values.password;
      } else if (!isEditing) {
        payload.password = 'temp123';
      }

      let userData;
      if (isEditing) {
        userData = await usuarioService.update(id, payload);
      } else {
        userData = await usuarioService.create(payload);
      }

      const userId = userData.id || id;

      await Promise.all([
        usuarioService.updateGroups(userId, selectedGroups),
        usuarioService.updateRoles(userId, selectedRoles)
      ]);

      message.success(`Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/usuarios');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Erro ao salvar usuário';
      message.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleSelect = (roleIds) => {
    setSelectedRoles(roleIds);
  };

  const handleGroupSelect = (groupIds) => {
    setSelectedGroups(groupIds);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="Carregando..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/usuarios')}>
                Voltar
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                <UserOutlined /> {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
              </Title>
            </Space>
          </Col>
        </Row>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            enabled: true,
            accountExpired: false,
            accountLocked: false,
            passwordExpired: false
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: 'Username é obrigatório' },
                  { min: 3, message: 'Mínimo 3 caracteres' }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Nome de usuário" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="password"
                label={isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                rules={!isEditing ? [{ required: true, message: 'Senha é obrigatória' }] : []}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Senha" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="enabled" label="Usuário Ativo" valuePropName="checked">
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="accountExpired" label="Conta Expirada" valuePropName="checked">
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="accountLocked" label="Conta Bloqueada" valuePropName="checked">
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="passwordExpired" label="Senha Expirada" valuePropName="checked">
                <Switch checkedChildren="Sim" unCheckedChildren="Não" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Permissões</Divider>

          <Tabs defaultActiveKey="groups">
            <TabPane
              tab={
                <span>
                  <TeamOutlined />
                  Grupos ({selectedGroups.length})
                </span>
              }
              key="groups"
            >
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Selecione os grupos"
                value={selectedGroups}
                onChange={handleGroupSelect}
                options={groups.map(g => ({
                  label: g.name,
                  value: g.id
                }))}
              />
              <div style={{ marginTop: 16 }}>
                {groups
                  .filter(g => selectedGroups.includes(g.id))
                  .map(group => (
                    <Card key={group.id} size="small" style={{ marginBottom: 8 }}>
                      <Space>
                        <TeamOutlined />
                        <strong>{group.name}</strong>
                      </Space>
                      <div style={{ marginTop: 4 }}>
                        <small>{group.description}</small>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {group.roles?.map(role => (
                          <Tag key={role.id} color="blue" style={{ marginBottom: 4 }}>
                            {role.authority}
                          </Tag>
                        ))}
                      </div>
                    </Card>
                  ))}
              </div>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <SafetyOutlined />
                  Roles Individuais ({selectedRoles.length})
                </span>
              }
              key="roles"
            >
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Selecione as roles"
                value={selectedRoles}
                onChange={handleRoleSelect}
                options={roles.map(r => ({
                  label: r.authority,
                  value: r.id
                }))}
              />
            </TabPane>
          </Tabs>

          <Divider />

          <Row justify="end">
            <Space>
              <Button onClick={() => navigate('/usuarios')}>
                Cancelar
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
                size="large"
              >
                {isEditing ? 'Atualizar' : 'Criar'} Usuário
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default UsuarioForm;