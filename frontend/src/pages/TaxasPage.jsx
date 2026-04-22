// src/pages/TaxasPage.jsx
import React, { useState, useEffect } from 'react';
import TaxaList from '../components/taxas/TaxaList';
import TaxaForm from '../components/taxas/TaxaForm';
import TaxaDetails from '../components/taxas/TaxaDetails';
import { taxaService } from '../services/taxaService';

const TaxasPage = () => {
  const [taxas, setTaxas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTaxa, setSelectedTaxa] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    carregarTaxas();
  }, []);

  const carregarTaxas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taxaService.listar();
      setTaxas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erro ao carregar taxas: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedTaxa(null);
    setShowForm(true);
    setShowDetails(false);
  };

  const handleEdit = (taxa) => {
    setSelectedTaxa(taxa);
    setShowForm(true);
    setShowDetails(false);
  };

  const handleView = (taxa) => {
    setSelectedTaxa(taxa);
    setShowDetails(true);
    setShowForm(false);
  };

  const handleDelete = async (taxa) => {
    if (!window.confirm(`Tem certeza que deseja excluir a taxa "${taxa.nome}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await taxaService.deletar(taxa.id);
      await carregarTaxas();
      alert('Taxa excluída com sucesso!');
    } catch (err) {
      alert('Erro ao excluir taxa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (selectedTaxa?.id) {
        await taxaService.atualizar(selectedTaxa.id, formData);
        alert('Taxa atualizada com sucesso!');
      } else {
        await taxaService.criar(formData);
        alert('Taxa criada com sucesso!');
      }

      await carregarTaxas();
      setShowForm(false);
      setSelectedTaxa(null);
    } catch (err) {
      if (err.type === 'VALIDATION') {
        alert('Erro de validação: ' + JSON.stringify(err.errors));
      } else {
        alert('Erro ao salvar taxa: ' + err.message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowDetails(false);
    setSelectedTaxa(null);
  };

  const handleToggleStatus = async (taxa) => {
    try {
      await taxaService.patch(taxa.id, { ativo: !taxa.ativo });
      await carregarTaxas();
    } catch (err) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  return (
    <div className="taxas-page">
      <div className="page-header">
        <h1>Gerenciamento de Taxas</h1>
        {!showForm && !showDetails && (
          <button onClick={handleCreate} className="btn-primary">
            + Nova Taxa
          </button>
        )}
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={carregarTaxas}>Tentar novamente</button>
        </div>
      )}

      {showForm ? (
        <div className="form-container">
          <h2>{selectedTaxa ? 'Editar Taxa' : 'Nova Taxa'}</h2>
          <TaxaForm
            taxa={selectedTaxa}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={formLoading}
          />
        </div>
      ) : showDetails ? (
        <div className="details-container">
          <TaxaDetails
            taxa={selectedTaxa}
            onEdit={() => handleEdit(selectedTaxa)}
            onClose={handleCancel}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      ) : (
        <TaxaList
          taxas={taxas}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          loading={loading}
        />
      )}
    </div>
  );
};

export default TaxasPage;