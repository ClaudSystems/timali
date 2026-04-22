// src/components/taxas/TaxaList.jsx
import React, { useState } from 'react';
import { TIPO_CALCULO_LABELS } from '../../utils/constants';

const TaxaList = ({ taxas, onEdit, onDelete, onView, loading }) => {
  const [filter, setFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredTaxas = taxas.filter(taxa => {
    const matchesSearch = taxa.nome.toLowerCase().includes(filter.toLowerCase()) ||
                          taxa.descricao?.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = showInactive ? true : taxa.ativo;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return `${Number(value).toFixed(2)} MT`;
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '-';
    return `${Number(value).toFixed(2)}%`;
  };

  const getTaxaValue = (taxa) => {
    switch (taxa.tipoCalculo) {
      case 'PERCENTUAL':
        return formatPercent(taxa.percentual);
      case 'VALOR_FIXO':
        return formatCurrency(taxa.valorFixo);
      case 'FAIXA_PERCENTUAL':
        return `${taxa.faixasJson ? JSON.parse(taxa.faixasJson).length : 0} faixas`;
      default:
        return '-';
    }
  };

  if (loading) {
    return <div className="loading">Carregando taxas...</div>;
  }

  return (
    <div className="taxa-list">
      <div className="list-header">
        <div className="filters">
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
          />
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Mostrar inativas
          </label>
        </div>
        <div className="list-stats">
          {filteredTaxas.length} taxa(s) encontrada(s)
        </div>
      </div>

      {filteredTaxas.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma taxa encontrada</p>
        </div>
      ) : (
        <table className="taxa-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Tipo</th>
              <th>Valor/Configuração</th>
              <th>Limites</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTaxas.map(taxa => (
              <tr key={taxa.id} className={!taxa.ativo ? 'inactive' : ''}>
                <td>
                  <strong>{taxa.nome}</strong>
                </td>
                <td>{taxa.descricao || '-'}</td>
                <td>{TIPO_CALCULO_LABELS[taxa.tipoCalculo]}</td>
                <td>{getTaxaValue(taxa)}</td>
                <td>
                  {taxa.valorMinimo && `Min: ${formatCurrency(taxa.valorMinimo)}`}
                  {taxa.valorMinimo && taxa.valorMaximo && <br />}
                  {taxa.valorMaximo && `Max: ${formatCurrency(taxa.valorMaximo)}`}
                  {!taxa.valorMinimo && !taxa.valorMaximo && 'Sem limites'}
                </td>
                <td>
                  <span className={`status-badge ${taxa.ativo ? 'active' : 'inactive'}`}>
                    {taxa.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="actions">
                  <button
                    onClick={() => onView(taxa)}
                    className="btn-view"
                    title="Visualizar"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => onEdit(taxa)}
                    className="btn-edit"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDelete(taxa)}
                    className="btn-delete"
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TaxaList;