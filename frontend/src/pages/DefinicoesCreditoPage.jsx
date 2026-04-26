// src/pages/DefinicoesCreditoPage.jsx
import React, { useState, useEffect } from 'react';
import { Button, Card, Space, message, Spin, Typography, ConfigProvider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import DefinicaoCreditoList from '../components/definicoesCredito/DefinicaoCreditoList';
import DefinicaoCreditoForm from '../components/definicoesCredito/DefinicaoCreditoForm';
import { definicaoCreditoService } from '../services/definicaoCreditoService';
import ptBR from 'antd/es/locale/pt_BR';

const { Title } = Typography;

// Função para extrair valor de Enum (garante string)
const normalizeEnum = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value.name) {
    return value.name;
  }
  return value;
};

// Função para normalizar uma definição completa
const normalizeDefinicao = (def) => {
  if (!def) return def;

  return {
    ...def,
    periodicidade: normalizeEnum(def.periodicidade),
    formaDeCalculo: normalizeEnum(def.formaDeCalculo),
    periodicidadeMora: normalizeEnum(def.periodicidadeMora),
    taxa: def.taxa ? {
      ...def.taxa,
      tipoCalculo: normalizeEnum(def.taxa?.tipoCalculo)
    } : null
  };
};

// Função para normalizar array de definições
const normalizeDefinicoes = (data) => {
  if (Array.isArray(data)) {
    return data.map(def => normalizeDefinicao(def));
  }
  return normalizeDefinicao(data);
};

const DefinicoesCreditoPage = () => {
  const [definicoes, setDefinicoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDefinicao, setSelectedDefinicao] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    carregarDefinicoes();
  }, []);

  const carregarDefinicoes = async () => {
    setLoading(true);
    try {
      const data = await definicaoCreditoService.listar();
      const dadosNormalizados = normalizeDefinicoes(data);
      console.log('📥 Dados normalizados:', dadosNormalizados);
      setDefinicoes(Array.isArray(dadosNormalizados) ? dadosNormalizados : []);
    } catch (err) {
      message.error('Erro ao carregar definições: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedDefinicao(null);
    setShowForm(true);
  };

  const handleEdit = (definicao) => {
    setSelectedDefinicao(definicao);
    setShowForm(true);
  };

  const handleDelete = async (definicao) => {
    try {
      await definicaoCreditoService.deletar(definicao.id);
      message.success('Definição excluída com sucesso!');
      await carregarDefinicoes();
    } catch (err) {
      message.error('Erro ao excluir: ' + err.message);
    }
  };

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (selectedDefinicao?.id) {
        await definicaoCreditoService.atualizar(selectedDefinicao.id, formData);
        message.success('Definição atualizada com sucesso!');
      } else {
        await definicaoCreditoService.criar(formData);
        message.success('Definição criada com sucesso!');
      }

      await carregarDefinicoes();
      setShowForm(false);
      setSelectedDefinicao(null);
    } catch (err) {
      message.error('Erro ao salvar: ' + (err.errors ? JSON.stringify(err.errors) : err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedDefinicao(null);
  };

  return (
    <ConfigProvider locale={ptBR}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24 }}>
        {/* Cabeçalho */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 30
        }}>
          <Title level={2} style={{ margin: 0 }}>
            📦 Definições de Crédito
          </Title>

          {!showForm && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              size="large"
            >
              Nova Definição
            </Button>
          )}
        </div>

        {/* Conteúdo */}
        {showForm ? (
          <Card
            title={selectedDefinicao ? 'Editar Definição' : 'Nova Definição de Crédito'}
            style={{ borderRadius: 12 }}
          >
            <DefinicaoCreditoForm
              definicao={selectedDefinicao}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={formLoading}
            />
          </Card>
        ) : (
          <DefinicaoCreditoList
            definicoes={definicoes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
          />
        )}
      </div>
    </ConfigProvider>
  );
};

export default DefinicoesCreditoPage;