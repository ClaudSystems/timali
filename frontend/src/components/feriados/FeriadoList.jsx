// src/components/feriados/FeriadoList.jsx
import React, { useState } from 'react';
import { TIPO_FERIADO_LABELS, TIPO_ABRANGENCIA_LABELS } from '../../utils/constants';
import './FeriadoList.css';

const FeriadoList = ({ feriados, onEdit, onDelete, onView, loading }) => {
  const [filter, setFilter] = useState('');
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());

  const filteredFeriados = feriados.filter(feriado => {
    const matchesSearch = feriado.nome?.toLowerCase().includes(filter.toLowerCase()) ||
                          feriado.descricao?.toLowerCase().includes(filter.toLowerCase());

    // Filtro por ano (simplificado)
    if (feriado.ano && feriado.ano !== filtroAno) return false;

    return matchesSearch;
  });

  const formatDate = (feriado) => {
    if (feriado.dataCompleta) {
      return new Date(feriado.dataCompleta).toLocaleDateString('pt-BR');
    }
    if (feriado.dataFixa) {
      const [mes, dia] = feriado.dataFixa.split('-');
      return `${dia}/${mes}`;
    }
    return '-';
  };

  // CORRIGIDO: Função segura para obter classe do badge
  const getTipoBadgeClass = (tipo) => {
    if (!tipo) return '';

    const tipoLower = String(tipo).toLowerCase();

    if (tipoLower.includes('fixo')) return 'fixo';
    if (tipoLower.includes('movel') || tipoLower.includes('móvel')) return 'movel';
    if (tipoLower.includes('ponte')) return 'ponte';
    if (tipoLower.includes('excepcional')) return 'excepcional';

    return '';
  };

  // CORRIGIDO: Função segura para obter label do tipo
  const getTipoLabel = (tipo) => {
    if (!tipo) return 'Não definido';
    return TIPO_FERIADO_LABELS[tipo] || String(tipo).replace('_', ' ');
  };

  // CORRIGIDO: Função segura para obter label da abrangência
  const getAbrangenciaLabel = (abrangencia) => {
    if (!abrangencia) return 'Não definida';
    return TIPO_ABRANGENCIA_LABELS[abrangencia] || String(abrangencia);
  };

  if (loading) {
    return <div className="loading">Carregando feriados...</div>;
  }

  return (
    <div className="feriado-list">
      <div className="list-header">
        <input
          type="text"
          placeholder="Buscar feriado..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="search-input"
        />
        <select
          value={filtroAno}
          onChange={(e) => setFiltroAno(Number(e.target.value))}
          className="year-filter"
        >
          {[2024, 2025, 2026, 2027, 2028].map(ano => (
            <option key={ano} value={ano}>{ano}</option>
          ))}
        </select>
      </div>

      {filteredFeriados.length === 0 ? (
        <div className="empty-state">
          <p>📅 Nenhum feriado encontrado</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            Clique em "Novo Feriado" para começar
          </p>
        </div>
      ) : (
        <div className="feriados-grid">
          {filteredFeriados.map(feriado => (
            <div key={feriado.id} className={`feriado-card ${!feriado.ativo ? 'inactive' : ''}`}>
              <div className="card-header">
                <h3>{feriado.nome || 'Sem nome'}</h3>
                <span className={`tipo-badge ${getTipoBadgeClass(feriado.tipo)}`}>
                  {getTipoLabel(feriado.tipo)}
                </span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="label">📅 Data:</span>
                  <span className="value">{formatDate(feriado)}</span>
                </div>

                <div className="info-row">
                  <span className="label">📍 Abrangência:</span>
                  <span className="value">
                    {getAbrangenciaLabel(feriado.abrangencia)}
                    {feriado.localidade && ` - ${feriado.localidade}`}
                  </span>
                </div>

                {feriado.descricao && (
                  <div className="info-row">
                    <span className="label">📝 Descrição:</span>
                    <span className="value">{feriado.descricao}</span>
                  </div>
                )}

                {feriado.ano && (
                  <div className="info-row">
                    <span className="label">📆 Ano:</span>
                    <span className="value">{feriado.ano}</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <span className={`status ${feriado.ativo ? 'active' : 'inactive'}`}>
                  {feriado.ativo ? '✅ Ativo' : '❌ Inativo'}
                </span>
                <div className="actions">
                  <button onClick={() => onView && onView(feriado)} title="Ver detalhes">👁️</button>
                  <button onClick={() => onEdit(feriado)} title="Editar">✏️</button>
                  <button onClick={() => onDelete(feriado)} title="Excluir">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeriadoList;