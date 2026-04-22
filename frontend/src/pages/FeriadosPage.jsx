// src/pages/FeriadosPage.jsx
import React, { useState, useEffect } from 'react';
import FeriadoList from '../components/feriados/FeriadoList';
import FeriadoForm from '../components/feriados/FeriadoForm';
import { feriadoService } from '../services/feriadoService';
import './FeriadosPage.css';

const FeriadosPage = () => {
  const [feriados, setFeriados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedFeriado, setSelectedFeriado] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    carregarFeriados();
  }, []);

  const carregarFeriados = async () => {
    setLoading(true);
    try {
      const data = await feriadoService.listar();
      setFeriados(Array.isArray(data) ? data : []);
    } catch (err) {
      alert('Erro ao carregar feriados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedFeriado(null);
    setShowForm(true);
  };

  const handleEdit = (feriado) => {
    setSelectedFeriado(feriado);
    setShowForm(true);
  };

  const handleDelete = async (feriado) => {
    if (!window.confirm(`Excluir o feriado "${feriado.nome}"?`)) return;

    try {
      await feriadoService.deletar(feriado.id);
      await carregarFeriados();
      alert('Feriado excluído com sucesso!');
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (selectedFeriado?.id) {
        await feriadoService.atualizar(selectedFeriado.id, formData);
        alert('Feriado atualizado!');
      } else {
        await feriadoService.criar(formData);
        alert('Feriado criado!');
      }
      await carregarFeriados();
      setShowForm(false);
      setSelectedFeriado(null);
    } catch (err) {
      alert('Erro ao salvar: ' + (err.errors ? JSON.stringify(err.errors) : err.message));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="feriados-page">
      <div className="page-header">
        <h1>📅 Gerenciamento de Feriados</h1>
        {!showForm && (
          <button onClick={handleCreate} className="btn-primary">
            + Novo Feriado
          </button>
        )}
      </div>

      {showForm ? (
        <div className="form-container">
          <h2>{selectedFeriado ? 'Editar Feriado' : 'Novo Feriado'}</h2>
          <FeriadoForm
            feriado={selectedFeriado}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setSelectedFeriado(null);
            }}
            loading={formLoading}
          />
        </div>
      ) : (
        <FeriadoList
          feriados={feriados}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={() => {}}
          loading={loading}
        />
      )}
    </div>
  );
};

export default FeriadosPage;