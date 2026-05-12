import React, { useState, useEffect } from 'react';
import {
  Form, Input, Button, Card, Space, Switch, message,
  Typography, Divider, Row, Col, Spin, Tabs, Select, Tag
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
      console.log('🔄 Carregando dados...', isEditing ? `Editando ID: ${id}` : 'Novo usuário');

      // Carregar roles e grupos disponíveis
      const [rolesData, groupsData] = await Promise.all([
        roleService.list(),
        roleGroupService.list()
      ]);

      console.log('📦 Roles carregadas:', rolesData);
      console.log('📦 Grupos carregados:', groupsData);

      const rolesList = Array.isArray(rolesData) ? rolesData : rolesData.data || [];
      const groupsList = Array.isArray(groupsData) ? groupsData : groupsData.data || [];

      setRoles(rolesList);
      setGroups(groupsList);

      if (isEditing) {
        // Carregar dados do usuário para edição
        console.log('🔍 Buscando usuário ID:', id);
        const userData = await usuarioService.getById(id);
        console.log('👤 Dados do usuário:', userData);

        // Preencher formulário com dados do usuário
        form.setFieldsValue({
          username: userData.username,
          enabled: userData.enabled !== undefined ? userData.enabled : true,
          accountExpired: userData.accountExpired || false,
          accountLocked: userData.accountLocked || false,
          passwordExpired: userData.passwordExpired || false
        });

        // Definir roles e grupos selecionados
        const userRoles = userData.roles?.map(r => r.id) || [];
        const userGroups = userData.groups?.map(g => g.id) || [];

        console.log('🔑 Roles do usuário:', userRoles);
        console.log('👥 Grupos do usuário:', userGroups);

        setSelectedRoles(userRoles);
        setSelectedGroups(userGroups);
      } else {
        // Novo usuário - limpar formulário
        form.resetFields();
        setSelectedRoles([]);
        setSelectedGroups([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      message.error('Erro ao carregar dados do usuário');
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

      // Só enviar senha se foi preenchida
      if (values.password && values.password.trim() !== '') {
        payload.password = values.password;
      } else if (!isEditing) {
        payload.password = 'temp123'; // Senha padrão para novo usuário
      }

      console.log('💾 Salvando payload:', payload);

      let userData;
      if (isEditing) {
        userData = await usuarioService.update(id, payload);
        console.log('✅ Usuário atualizado:', userData);
      } else {
        userData = await usuarioService.create(payload);
        console.log('✅ Usuário criado:', userData);
      }

      const userId = userData.id || id;
      console.log('🔄 Atualizando permissões para userId:', userId);
      console.log('👥 Grupos selecionados:', selectedGroups);
      console.log('🔑 Roles selecionadas:', selectedRoles);

      // Atualizar grupos e roles
      await Promise.all([
        usuarioService.updateGroups(userId, selectedGroups),
        usuarioService.updateRoles(userId, selectedRoles)
      ]);

      message.success(`Usuário ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/usuarios');
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Erro ao salvar usuário';
      message.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleSelect = (roleIds) => {
    console.log('🔑 Roles alteradas:', roleIds);
    setSelectedRoles(roleIds);
  };

  const handleGroupSelect = (groupIds) => {
    console.log('👥 Grupos alterados:', groupIds);
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
                label={isEditing ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha'}
                rules={!isEditing ? [{ required: true, message: 'Senha é obrigatória' }] : []}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder={isEditing ? "Nova senha (opcional)" : "Senha"}
                />
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