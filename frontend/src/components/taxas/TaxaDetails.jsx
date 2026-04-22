// src/components/taxas/TaxaDetails.jsx
import React from 'react';
import { TIPO_CALCULO_LABELS } from '../../utils/constants';

const TaxaDetails = ({ taxa, onEdit, onClose, onToggleStatus }) => {
  if (!taxa) return null;

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-';
    return `${Number(value).toFixed(2)} MT`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const renderFaixas = () => {
    if (!taxa.faixasJson) return null;

    try {
      const faixas = JSON.parse(taxa.faixasJson);
      return (
        <div className="faixas-details">
          <h4>Faixas Configuradas:</h4>
          <table>
            <thead>
              <tr>
                <th>Valor Mínimo</th>
                <th>Valor Máximo</th>
                <th>Percentual</th>
              </tr>
            </thead>
            <tbody>
              {faixas.map((faixa, index) => (
                <tr key={index}>
                  <td>{formatCurrency(faixa.min)}</td>
                  <td>{faixa.max ? formatCurrency(faixa.max) : 'Sem limite'}</td>
                  <td>{faixa.perc}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } catch (e) {
      return <p>Erro ao carregar faixas</p>;
    }
  };

  return (
    <div className="taxa-details">
      <div className="details-header">
        <h2>{taxa.nome}</h2>
        <div className="header-actions">
          <button onClick={onEdit} className="btn-edit">Editar</button>
          <button onClick={onClose} className="btn-close">Fechar</button>
        </div>
      </div>

      <div className="details-content">
        <div className="detail-row">
          <label>Status:</label>
          <span>
            <span className={`status-badge ${taxa.ativo ? 'active' : 'inactive'}`}>
              {taxa.ativo ? 'Ativa' : 'Inativa'}
            </span>
            <button
              onClick={() => onToggleStatus(taxa)}
              className="btn-toggle-status"
            >
              {taxa.ativo ? 'Desativar' : 'Ativar'}
            </button>
          </span>
        </div>

        <div className="detail-row">
          <label>Descrição:</label>
          <span>{taxa.descricao || 'Sem descrição'}</span>
        </div>

        <div className="detail-row">
          <label>Tipo de Cálculo:</label>
          <span>{TIPO_CALCULO_LABELS[taxa.tipoCalculo]}</span>
        </div>

        {taxa.tipoCalculo === 'PERCENTUAL' && (
          <div className="detail-row">
            <label>Percentual:</label>
            <span>{taxa.percentual}%</span>
          </div>
        )}

        {taxa.tipoCalculo === 'VALOR_FIXO' && (
          <div className="detail-row">
            <label>Valor Fixo:</label>
            <span>{formatCurrency(taxa.valorFixo)}</span>
          </div>
        )}

        {taxa.tipoCalculo === 'FAIXA_PERCENTUAL' && renderFaixas()}

        <div className="detail-row">
          <label>Valor Mínimo:</label>
          <span>{formatCurrency(taxa.valorMinimo)}</span>
        </div>

        <div className="detail-row">
          <label>Valor Máximo:</label>
          <span>{formatCurrency(taxa.valorMaximo)}</span>
        </div>

        <div className="detail-row">
          <label>Data de Criação:</label>
          <span>{formatDate(taxa.dateCreated)}</span>
        </div>

        <div className="detail-row">
          <label>Última Atualização:</label>
          <span>{formatDate(taxa.lastUpdated)}</span>
        </div>

        {taxa.configuracaoResumida && (
          <div className="detail-row">
            <label>Resumo:</label>
            <span>{taxa.configuracaoResumida}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxaDetails;