// src/components/taxas/TaxaForm.jsx
import React, { useState, useEffect } from 'react';
import { TIPO_CALCULO_OPTIONS, TIPO_CALCULO } from '../../utils/constants';
import '../../styles/TaxaForm.css';

const TaxaForm = ({ taxa, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipoCalculo: TIPO_CALCULO.PERCENTUAL,
    percentual: '',
    valorFixo: '',
    faixasJson: '',
    valorMinimo: '',
    valorMaximo: '',
    ativo: true
  });

  const [errors, setErrors] = useState({});
  const [faixas, setFaixas] = useState([]);
  const [novaFaixa, setNovaFaixa] = useState({ min: '', max: '', perc: '' });

  useEffect(() => {
    if (taxa) {
      setFormData({
        nome: taxa.nome || '',
        descricao: taxa.descricao || '',
        tipoCalculo: taxa.tipoCalculo || TIPO_CALCULO.PERCENTUAL,
        percentual: taxa.percentual || '',
        valorFixo: taxa.valorFixo || '',
        faixasJson: taxa.faixasJson || '',
        valorMinimo: taxa.valorMinimo || '',
        valorMaximo: taxa.valorMaximo || '',
        ativo: taxa.ativo !== undefined ? taxa.ativo : true
      });

      if (taxa.faixasJson) {
        try {
          setFaixas(JSON.parse(taxa.faixasJson));
        } catch (e) {
          setFaixas([]);
        }
      }
    }
  }, [taxa]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // CORRIGIDO: Converte para maiúsculas automaticamente no campo nome
    if (name === 'nome') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase().replace(/[^A-Z_]/g, '') // Remove caracteres inválidos
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Limpa erro do campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAddFaixa = () => {
    const perc = parseFloat(novaFaixa.perc);
    if (!novaFaixa.perc || isNaN(perc)) {
      alert('Percentual é obrigatório e deve ser um número válido');
      return;
    }

    if (perc < 0 || perc > 100) {
      alert('Percentual deve estar entre 0 e 100');
      return;
    }

    const min = parseFloat(novaFaixa.min) || 0;
    const max = novaFaixa.max ? parseFloat(novaFaixa.max) : null;

    // Valida se o máximo é maior que o mínimo
    if (max !== null && max <= min) {
      alert('Valor máximo deve ser maior que o valor mínimo');
      return;
    }

    // Verifica sobreposição de faixas
    const sobreposicao = faixas.some(faixa => {
      const faixaMax = faixa.max || Infinity;
      const novoMax = max || Infinity;
      return (min >= faixa.min && min <= faixaMax) ||
             (novoMax >= faixa.min && novoMax <= faixaMax);
    });

    if (sobreposicao) {
      alert('Esta faixa sobrepõe com uma faixa existente');
      return;
    }

    const nova = { min, perc };
    if (max !== null) nova.max = max;

    const novasFaixas = [...faixas, nova].sort((a, b) => a.min - b.min);
    setFaixas(novasFaixas);
    setFormData(prev => ({
      ...prev,
      faixasJson: JSON.stringify(novasFaixas)
    }));
    setNovaFaixa({ min: '', max: '', perc: '' });
  };

  const handleRemoveFaixa = (index) => {
    const novasFaixas = faixas.filter((_, i) => i !== index);
    setFaixas(novasFaixas);
    setFormData(prev => ({
      ...prev,
      faixasJson: novasFaixas.length ? JSON.stringify(novasFaixas) : ''
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // CORRIGIDO: Validação do nome - permite maiúsculas e underscore
    if (!formData.nome?.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (!/^[A-Z][A-Z0-9_]*$/.test(formData.nome)) {
      newErrors.nome = 'Deve começar com letra maiúscula e conter apenas maiúsculas, números e underscore';
    }

    if (formData.tipoCalculo === TIPO_CALCULO.PERCENTUAL) {
      const perc = parseFloat(formData.percentual);
      if (!formData.percentual) {
        newErrors.percentual = 'Percentual é obrigatório';
      } else if (isNaN(perc) || perc < 0 || perc > 100) {
        newErrors.percentual = 'Percentual deve estar entre 0 e 100';
      }
    }

    if (formData.tipoCalculo === TIPO_CALCULO.VALOR_FIXO) {
      const valor = parseFloat(formData.valorFixo);
      if (!formData.valorFixo) {
        newErrors.valorFixo = 'Valor fixo é obrigatório';
      } else if (isNaN(valor) || valor < 0) {
        newErrors.valorFixo = 'Valor deve ser maior ou igual a zero';
      }
    }

    if (formData.tipoCalculo === TIPO_CALCULO.FAIXA_PERCENTUAL && faixas.length === 0) {
      newErrors.faixasJson = 'Adicione pelo menos uma faixa de percentual';
    }

    if (formData.valorMinimo) {
      const min = parseFloat(formData.valorMinimo);
      if (isNaN(min) || min < 0) {
        newErrors.valorMinimo = 'Valor mínimo deve ser maior ou igual a zero';
      }
    }

    if (formData.valorMaximo) {
      const max = parseFloat(formData.valorMaximo);
      if (isNaN(max) || max < 0) {
        newErrors.valorMaximo = 'Valor máximo deve ser maior ou igual a zero';
      }
    }

    if (formData.valorMinimo && formData.valorMaximo) {
      const min = parseFloat(formData.valorMinimo);
      const max = parseFloat(formData.valorMaximo);
      if (min >= max) {
        newErrors.valorMaximo = 'Valor máximo deve ser maior que o mínimo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const renderFieldsByType = () => {
    switch (formData.tipoCalculo) {
      case TIPO_CALCULO.PERCENTUAL:
        return (
          <div className="form-field">
            <label>Percentual (%) <span className="required">*</span></label>
            <div className="input-with-suffix">
              <input
                type="number"
                name="percentual"
                value={formData.percentual}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                placeholder="Ex: 3.5"
                className={errors.percentual ? 'error' : ''}
              />
              <span className="input-suffix">%</span>
            </div>
            {errors.percentual && <span className="error-text">{errors.percentual}</span>}
          </div>
        );

      case TIPO_CALCULO.VALOR_FIXO:
        return (
          <div className="form-field">
            <label>Valor Fixo (MT) <span className="required">*</span></label>
            <div className="input-with-prefix">
              <span className="input-prefix">MT</span>
              <input
                type="number"
                name="valorFixo"
                value={formData.valorFixo}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="Ex: 200.00"
                className={errors.valorFixo ? 'error' : ''}
              />
            </div>
            {errors.valorFixo && <span className="error-text">{errors.valorFixo}</span>}
          </div>
        );

      case TIPO_CALCULO.FAIXA_PERCENTUAL:
        return (
          <div className="form-field">
            <label>Faixas de Percentual <span className="required">*</span></label>

            {faixas.length > 0 && (
              <div className="faixas-card">
                <table className="faixas-table">
                  <thead>
                    <tr>
                      <th>Valor Mínimo</th>
                      <th>Valor Máximo</th>
                      <th>Percentual</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {faixas.map((faixa, index) => (
                      <tr key={index}>
                        <td>{faixa.min.toFixed(2)} MT</td>
                        <td>{faixa.max ? `${faixa.max.toFixed(2)} MT` : 'Sem limite'}</td>
                        <td className="percent-cell">{faixa.perc}%</td>
                        <td className="action-cell">
                          <button
                            type="button"
                            onClick={() => handleRemoveFaixa(index)}
                            className="btn-icon btn-delete"
                            title="Remover faixa"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="add-faixa-form">
              <div className="faixa-inputs">
                <input
                  type="number"
                  placeholder="Valor mínimo"
                  value={novaFaixa.min}
                  onChange={(e) => setNovaFaixa({ ...novaFaixa, min: e.target.value })}
                  step="0.01"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Valor máximo (opcional)"
                  value={novaFaixa.max}
                  onChange={(e) => setNovaFaixa({ ...novaFaixa, max: e.target.value })}
                  step="0.01"
                  min="0"
                />
                <div className="percent-input-wrapper">
                  <input
                    type="number"
                    placeholder="Percentual"
                    value={novaFaixa.perc}
                    onChange={(e) => setNovaFaixa({ ...novaFaixa, perc: e.target.value })}
                    step="0.01"
                    min="0"
                    max="100"
                  />
                  <span className="percent-symbol">%</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddFaixa}
                  className="btn-add-faixa"
                >
                  + Adicionar
                </button>
              </div>
            </div>

            {errors.faixasJson && <span className="error-text">{errors.faixasJson}</span>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="taxa-form">
      <div className="form-section">
        <h3 className="section-title">Informações Básicas</h3>

        <div className="form-row">
          <div className="form-field">
            <label>Nome da Taxa <span className="required">*</span></label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Ex: IOF, TARIFA_ABERTURA"
              className={errors.nome ? 'error' : ''}
              maxLength="50"
            />
            {errors.nome && <span className="error-text">{errors.nome}</span>}
            <small className="field-hint">
              Use maiúsculas e underscore. Ex: TAXA_CREDITO, IOF
            </small>
          </div>

          <div className="form-field">
            <label>Tipo de Cálculo <span className="required">*</span></label>
            <select
              name="tipoCalculo"
              value={formData.tipoCalculo}
              onChange={handleChange}
              className="select-modern"
            >
              {TIPO_CALCULO_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label>Descrição</label>
          <textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Descreva a finalidade desta taxa (opcional)"
            rows="2"
            className="textarea-modern"
          />
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Configuração da Taxa</h3>
        {renderFieldsByType()}
      </div>

      <div className="form-section">
        <h3 className="section-title">Limites (Opcional)</h3>
        <div className="form-row">
          <div className="form-field">
            <label>Valor Mínimo (MT)</label>
            <div className="input-with-prefix">
              <span className="input-prefix">MT</span>
              <input
                type="number"
                name="valorMinimo"
                value={formData.valorMinimo}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="Ex: 10.00"
              />
            </div>
            {errors.valorMinimo && <span className="error-text">{errors.valorMinimo}</span>}
          </div>

          <div className="form-field">
            <label>Valor Máximo (MT)</label>
            <div className="input-with-prefix">
              <span className="input-prefix">MT</span>
              <input
                type="number"
                name="valorMaximo"
                value={formData.valorMaximo}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="Ex: 1000.00"
                className={errors.valorMaximo ? 'error' : ''}
              />
            </div>
            {errors.valorMaximo && <span className="error-text">{errors.valorMaximo}</span>}
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-field checkbox-modern">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="ativo"
              checked={formData.ativo}
              onChange={handleChange}
            />
            <span className="checkbox-text">Taxa ativa</span>
          </label>
          <small className="field-hint">
            Apenas taxas ativas podem ser aplicadas em novos créditos
          </small>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Salvando...' : (taxa?.id ? 'Atualizar Taxa' : 'Criar Taxa')}
        </button>
      </div>
    </form>
  );
};

export default TaxaForm;