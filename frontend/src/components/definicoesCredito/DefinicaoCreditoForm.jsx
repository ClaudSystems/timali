// src/components/definicoesCredito/DefinicaoCreditoForm.jsx
// Substitua TODO o conteúdo por esta versão corrigida

import React, { useState, useEffect } from 'react';
import { taxaService } from '../../services/taxaService';
import './DefinicaoCreditoForm.css';

// Opções como strings simples (não objetos complexos)
const PERIODICIDADE_OPTIONS = [
  { value: 'DIARIO', label: '📆 Diário' },
  { value: 'SEMANAL', label: '📅 Semanal' },
  { value: 'QUINZENAL', label: '📊 Quinzenal' },
  { value: 'MENSAL', label: '📈 Mensal' }
];

const FORMA_CALCULO_OPTIONS = [
  { value: 'TAXA_FIXA', label: '💰 Taxa Fixa' },
  { value: 'PMT', label: '📊 PMT - Prestações Fixas' },
  { value: 'SAC', label: '📉 SAC - Amortização Constante' },
  { value: 'JUROS_SIMPLES', label: '📈 Juros Simples' },
  { value: 'JUROS_COMPOSTOS', label: '📊 Juros Compostos' }
];

const PERIODICIDADE_MORA_OPTIONS = [
  { value: '', label: 'Não cobrar mora' },
  { value: 'DIARIO', label: '📆 Diário' },
  { value: 'SEMANAL', label: '📅 Semanal' },
  { value: 'QUINZENAL', label: '📊 Quinzenal' },
  { value: 'MENSAL', label: '📈 Mensal' }
];

// Função segura para extrair valor
const safeString = (value, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return value.name;
  return defaultValue;
};

const DefinicaoCreditoForm = ({ definicao, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    numeroDePrestacoes: 12,
    periodicidade: 'MENSAL',
    formaDeCalculo: 'PMT',
    percentualDeJuros: '',
    percentualJurosDeDemora: '',
    taxa: null,
    periodicidadeMora: '',
    maximoCobrancasMora: 0,
    excluirSabados: false,
    excluirDomingos: true,
    excluirDiaDePagNoSabado: true,
    excluirDiaDePagNoDomingo: true,
    ativo: true
  });

  const [errors, setErrors] = useState({});
  const [taxas, setTaxas] = useState([]);
  const [loadingTaxas, setLoadingTaxas] = useState(false);

  useEffect(() => {
    carregarTaxas();
  }, []);

  useEffect(() => {
    if (definicao) {
      setFormData({
        nome: safeString(definicao.nome, ''),
        descricao: safeString(definicao.descricao, ''),
        numeroDePrestacoes: definicao.numeroDePrestacoes || 12,
        periodicidade: safeString(definicao.periodicidade, 'MENSAL'),
        formaDeCalculo: safeString(definicao.formaDeCalculo, 'PMT'),
        percentualDeJuros: definicao.percentualDeJuros || '',
        percentualJurosDeDemora: definicao.percentualJurosDeDemora || '',
        taxa: definicao.taxa || null,
        periodicidadeMora: safeString(definicao.periodicidadeMora, ''),
        maximoCobrancasMora: definicao.maximoCobrancasMora || 0,
        excluirSabados: definicao.excluirSabados === true,
        excluirDomingos: definicao.excluirDomingos !== false,
        excluirDiaDePagNoSabado: definicao.excluirDiaDePagNoSabado !== false,
        excluirDiaDePagNoDomingo: definicao.excluirDiaDePagNoDomingo !== false,
        ativo: definicao.ativo !== false
      });
    }
  }, [definicao]);

  const carregarTaxas = async () => {
    setLoadingTaxas(true);
    try {
      const data = await taxaService.listarAtivas();
      // Garante que as taxas sejam um array
      setTaxas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar taxas:', error);
      setTaxas([]);
    } finally {
      setLoadingTaxas(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'maximoCobrancasMora' && value === '0') {
      setFormData(prev => ({
        ...prev,
        maximoCobrancasMora: 0,
        periodicidadeMora: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleTaxaChange = (e) => {
    const taxaId = e.target.value;
    if (!taxaId) {
      setFormData(prev => ({ ...prev, taxa: null }));
      return;
    }
    const taxaSelecionada = taxas.find(t => t.id === parseInt(taxaId));
    setFormData(prev => ({
      ...prev,
      taxa: taxaSelecionada || null
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome?.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.numeroDePrestacoes || formData.numeroDePrestacoes < 1) {
      newErrors.numeroDePrestacoes = 'Número de prestações deve ser pelo menos 1';
    }

    if (formData.maximoCobrancasMora > 0 && !formData.periodicidadeMora) {
      newErrors.periodicidadeMora = 'Selecione a periodicidade da mora';
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

  return (
    <form onSubmit={handleSubmit} className="definicao-form">
      {/* Seção: Informações Básicas */}
      <div className="form-section">
        <h3 className="section-title">Informações Básicas</h3>

        <div className="form-field">
          <label>Nome da Definição <span className="required">*</span></label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Ex: Crédito Pessoal 12x"
            className={errors.nome ? 'error' : ''}
          />
          {errors.nome && <span className="error-text">{errors.nome}</span>}
        </div>

        <div className="form-field">
          <label>Descrição</label>
          <textarea
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Descreva este pacote de crédito"
            rows="2"
          />
        </div>
      </div>

      {/* Seção: Parâmetros do Crédito */}
      <div className="form-section">
        <h3 className="section-title">Parâmetros do Crédito</h3>

        <div className="form-row">
          <div className="form-field">
            <label>Nº de Prestações <span className="required">*</span></label>
            <input
              type="number"
              name="numeroDePrestacoes"
              value={formData.numeroDePrestacoes}
              onChange={handleChange}
              min="1"
              max="360"
              className={errors.numeroDePrestacoes ? 'error' : ''}
            />
            {errors.numeroDePrestacoes && <span className="error-text">{errors.numeroDePrestacoes}</span>}
          </div>

          <div className="form-field">
            <label>Periodicidade <span className="required">*</span></label>
            <select
              name="periodicidade"
              value={formData.periodicidade}
              onChange={handleChange}
              className="select-modern"
            >
              {PERIODICIDADE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label>Forma de Cálculo <span className="required">*</span></label>
          <select
            name="formaDeCalculo"
            value={formData.formaDeCalculo}
            onChange={handleChange}
            className="select-modern"
          >
            {FORMA_CALCULO_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Seção: Taxas e Juros */}
      <div className="form-section">
        <h3 className="section-title">Taxas e Juros</h3>

        <div className="form-row">
          <div className="form-field">
            <label>Juros do Crédito (%)</label>
            <div className="input-with-suffix">
              <input
                type="number"
                name="percentualDeJuros"
                value={formData.percentualDeJuros}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              <span className="input-suffix">%</span>
            </div>
          </div>

          <div className="form-field">
            <label>Juros de Mora (%)</label>
            <div className="input-with-suffix">
              <input
                type="number"
                name="percentualJurosDeDemora"
                value={formData.percentualJurosDeDemora}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              <span className="input-suffix">%</span>
            </div>
          </div>
        </div>

        <div className="form-field">
          <label>Taxa Adicional (Opcional)</label>
          <select
            name="taxa"
            value={formData.taxa?.id || ''}
            onChange={handleTaxaChange}
            className="select-modern"
            disabled={loadingTaxas}
          >
            <option value="">Nenhuma taxa adicional</option>
            {taxas.map(taxa => (
              <option key={taxa.id} value={taxa.id}>
                {taxa.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seção: Configuração de Mora */}
      <div className="form-section">
        <h3 className="section-title">Configuração de Mora</h3>

        <div className="form-row">
          <div className="form-field">
            <label>Periodicidade da Mora</label>
            <select
              name="periodicidadeMora"
              value={formData.periodicidadeMora}
              onChange={handleChange}
              className="select-modern"
            >
              {PERIODICIDADE_MORA_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.periodicidadeMora && <span className="error-text">{errors.periodicidadeMora}</span>}
          </div>

          <div className="form-field">
            <label>Máximo de Cobranças</label>
            <input
              type="number"
              name="maximoCobrancasMora"
              value={formData.maximoCobrancasMora}
              onChange={handleChange}
              min="0"
              max="100"
            />
            <small className="field-hint">
              Ex: 10 = cobra no máximo 10 vezes
            </small>
          </div>
        </div>
      </div>

      {/* Seção: Dias de Pagamento */}
      <div className="form-section">
        <h3 className="section-title">Dias de Pagamento</h3>

        <div className="form-row-checkboxes">
          <div className="form-field checkbox-modern">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="excluirSabados"
                checked={formData.excluirSabados}
                onChange={handleChange}
              />
              <span className="checkbox-text">Excluir Sábados como dia útil</span>
            </label>
          </div>

          <div className="form-field checkbox-modern">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="excluirDomingos"
                checked={formData.excluirDomingos}
                onChange={handleChange}
              />
              <span className="checkbox-text">Excluir Domingos como dia útil</span>
            </label>
          </div>

          <div className="form-field checkbox-modern">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="excluirDiaDePagNoSabado"
                checked={formData.excluirDiaDePagNoSabado}
                onChange={handleChange}
              />
              <span className="checkbox-text">Ajustar pagamento se cair no Sábado</span>
            </label>
          </div>

          <div className="form-field checkbox-modern">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="excluirDiaDePagNoDomingo"
                checked={formData.excluirDiaDePagNoDomingo}
                onChange={handleChange}
              />
              <span className="checkbox-text">Ajustar pagamento se cair no Domingo</span>
            </label>
          </div>
        </div>
      </div>

      {/* Seção: Status */}
      <div className="form-section">
        <div className="form-field checkbox-modern">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="ativo"
              checked={formData.ativo}
              onChange={handleChange}
            />
            <span className="checkbox-text">Definição ativa</span>
          </label>
        </div>
      </div>

      {/* Botões */}
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Salvando...' : (definicao?.id ? 'Atualizar' : 'Criar Definição')}
        </button>
      </div>
    </form>
  );
};

export default DefinicaoCreditoForm;