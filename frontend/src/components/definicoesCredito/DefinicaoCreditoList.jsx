// src/components/definicoesCredito/DefinicaoCreditoList.jsx
import React, { useState } from 'react';
import './DefinicaoCreditoList.css';

const DefinicaoCreditoList = ({ definicoes, onEdit, onDelete, loading }) => {
  const [filter, setFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredDefinicoes = definicoes.filter(def => {
    const matchesSearch = def.nome?.toLowerCase().includes(filter.toLowerCase()) ||
                          def.descricao?.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = showInactive ? true : def.ativo;
    return matchesSearch && matchesStatus;
  });

  const getPeriodicidadeLabel = (periodicidade) => {
    const labels = {
      DIARIO: '📆 Diário',
      SEMANAL: '📅 Semanal',
      QUINZENAL: '📊 Quinzenal',
      MENSAL: '📈 Mensal'
    };
    return labels[periodicidade] || periodicidade;
  };

  const getFormaCalculoLabel = (forma) => {
    const labels = {
      TAXA_FIXA: '💰 Taxa Fixa',
      PMT: '📊 PMT',
      SAC: '📉 SAC',
      JUROS_SIMPLES: '📈 Juros Simples',
      JUROS_COMPOSTOS: '📊 Juros Compostos'
    };
    return labels[forma] || forma;
  };

  const getResumoMora = (def) => {
    if (!def.maximoCobrancasMora || def.maximoCobrancasMora === 0) {
      return 'Não cobra mora';
    }
    const periodicidade = def.periodicidadeMora?.toLowerCase() || '';
    return `Até ${def.maximoCobrancasMora}x ${periodicidade}`;
  };

  if (loading) {
    return <div className="loading">Carregando definições...</div>;
  }

  return (
    <div className="definicao-list">
      <div className="list-header">
        <input
          type="text"
          placeholder="Buscar definição..."
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

      {filteredDefinicoes.length === 0 ? (
        <div className="empty-state">
          <p>📦 Nenhuma definição de crédito encontrada</p>
        </div>
      ) : (
        <div className="definicoes-grid">
          {filteredDefinicoes.map(def => (
            <div key={def.id} className={`definicao-card ${!def.ativo ? 'inactive' : ''}`}>
              <div className="card-header">
                <h3>{def.nome}</h3>
                <span className={`status-badge ${def.ativo ? 'active' : 'inactive'}`}>
                  {def.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              <div className="card-body">
                {def.descricao && (
                  <p className="descricao">{def.descricao}</p>
                )}

                <div className="info-row">
                  <span className="label">📊 Prestações:</span>
                  <span className="value">{def.numeroDePrestacoes}x {getPeriodicidadeLabel(def.periodicidade)}</span>
                </div>

                <div className="info-row">
                  <span className="label">🧮 Cálculo:</span>
                  <span className="value">{getFormaCalculoLabel(def.formaDeCalculo)}</span>
                </div>

                <div className="info-row">
                  <span className="label">💰 Juros:</span>
                  <span className="value">{def.percentualDeJuros || 0}%</span>
                </div>

                <div className="info-row">
                  <span className="label">⏰ Mora:</span>
                  <span className="value">{getResumoMora(def)} {def.percentualJurosDeDemora > 0 && `(${def.percentualJurosDeDemora}%)`}</span>
                </div>

                {def.taxa && (
                  <div className="info-row">
                    <span className="label">📋 Taxa:</span>
                    <span className="value">{def.taxa.nome}</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <div className="actions">
                  <button onClick={() => onEdit(def)} className="btn-edit" title="Editar">
                    ✏️ Editar
                  </button>
                  <button onClick={() => onDelete(def)} className="btn-delete" title="Excluir">
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DefinicaoCreditoList;