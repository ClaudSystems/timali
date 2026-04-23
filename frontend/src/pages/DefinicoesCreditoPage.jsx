// src/pages/DefinicoesCreditoPage.jsx
import React, { useState, useEffect } from 'react';
import DefinicaoCreditoList from '../components/definicoesCredito/DefinicaoCreditoList';
import DefinicaoCreditoForm from '../components/definicoesCredito/DefinicaoCreditoForm';
import { definicaoCreditoService } from '../services/definicaoCreditoService';
import './DefinicoesCreditoPage.css';

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
      // NORMALIZA os dados antes de colocar no estado
      const dadosNormalizados = normalizeDefinicoes(data);
      console.log('📥 Dados normalizados:', dadosNormalizados);
      setDefinicoes(Array.isArray(dadosNormalizados) ? dadosNormalizados : []);
    } catch (err) {
      alert('Erro ao carregar definições: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedDefinicao(null);
    setShowForm(true);
  };

  const handleEdit = (definicao) => {
    // A definição já está normalizada ao vir da lista
    setSelectedDefinicao(definicao);
    setShowForm(true);
  };

  const handleDelete = async (definicao) => {
    if (!window.confirm(`Excluir a definição "${definicao.nome}"?`)) return;

    try {
      await definicaoCreditoService.deletar(definicao.id);
      await carregarDefinicoes();
      alert('Definição excluída com sucesso!');
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    try {
      let result;
      if (selectedDefinicao?.id) {
        result = await definicaoCreditoService.atualizar(selectedDefinicao.id, formData);
        alert('Definição atualizada!');
      } else {
        result = await definicaoCreditoService.criar(formData);
        alert('Definição criada!');
      }

      await carregarDefinicoes();
      setShowForm(false);
      setSelectedDefinicao(null);
    } catch (err) {
      alert('Erro ao salvar: ' + (err.errors ? JSON.stringify(err.errors) : err.message));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="definicoes-page">
      <div className="page-header">
        <h1>📦 Definições de Crédito</h1>
        {!showForm && (
          <button onClick={handleCreate} className="btn-primary">
            + Nova Definição
          </button>
        )}
      </div>

      {showForm ? (
        <div className="form-container">
          <h2>{selectedDefinicao ? 'Editar Definição' : 'Nova Definição de Crédito'}</h2>
          <DefinicaoCreditoForm
            definicao={selectedDefinicao}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setSelectedDefinicao(null);
            }}
            loading={formLoading}
          />
        </div>
      ) : (
        <DefinicaoCreditoList
          definicoes={definicoes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      )}
    </div>
  );
};

export default DefinicoesCreditoPage;