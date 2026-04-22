// src/components/feriados/FeriadoForm.jsx
import React, { useState, useEffect } from 'react';
import {
  TIPO_FERIADO_OPTIONS,
  TIPO_FERIADO,
  TIPO_ABRANGENCIA_OPTIONS,
  TIPO_ABRANGENCIA,
  PROVINCIAS
} from '../../utils/constants';
import './FeriadoForm.css';

const FeriadoForm = ({ feriado, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: TIPO_FERIADO.FIXO,
    abrangencia: TIPO_ABRANGENCIA.NACIONAL,
    dataFixa: '',
    dataCompleta: '',
    ano: new Date().getFullYear(),
    localidade: '',
    ativo: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (feriado) {
      setFormData({
        nome: feriado.nome || '',
        descricao: feriado.descricao || '',
        tipo: feriado.tipo || TIPO_FERIADO.FIXO,
        abrangencia: feriado.abrangencia || TIPO_ABRANGENCIA.NACIONAL,
        dataFixa: feriado.dataFixa || '',
        dataCompleta: feriado.dataCompleta ? feriado.dataCompleta.split('T')[0] : '',
        ano: feriado.ano || new Date().getFullYear(),
        // Se for nacional, localidade fica vazia
        localidade: feriado.abrangencia === TIPO_ABRANGENCIA.NACIONAL ? '' : (feriado.localidade || ''),
        ativo: feriado.ativo !== undefined ? feriado.ativo : true
      });
    }
  }, [feriado]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Quando mudar para NACIONAL, limpa a localidade
    if (name === 'abrangencia' && value === TIPO_ABRANGENCIA.NACIONAL) {
      setFormData(prev => ({
        ...prev,
        abrangencia: value,
        localidade: ''
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

    // Se mudar a abrangência, limpa o erro de localidade também
    if (name === 'abrangencia') {
      setErrors(prev => ({ ...prev, localidade: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validação do nome
    if (!formData.nome?.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    // Validação por tipo de feriado
    if (formData.tipo === TIPO_FERIADO.FIXO) {
      if (!formData.dataFixa) {
        newErrors.dataFixa = 'Data fixa é obrigatória';
      } else if (!/^\d{2}-\d{2}$/.test(formData.dataFixa)) {
        newErrors.dataFixa = 'Formato inválido. Use MM-DD';
      } else {
        const [mes, dia] = formData.dataFixa.split('-').map(Number);
        if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
          newErrors.dataFixa = 'Data inválida';
        }
      }
    }

    if ([TIPO_FERIADO.MOVEL, TIPO_FERIADO.PONTE, TIPO_FERIADO.EXCEPCIONAL].includes(formData.tipo)) {
      if (!formData.dataCompleta) {
        newErrors.dataCompleta = 'Data completa é obrigatória';
      }
    }

    if (formData.tipo === TIPO_FERIADO.EXCEPCIONAL && !formData.ano) {
      newErrors.ano = 'Ano é obrigatório para feriado excepcional';
    }

    // Validação de localidade - SÓ se NÃO for nacional
    if (formData.abrangencia !== TIPO_ABRANGENCIA.NACIONAL) {
      if (!formData.localidade || formData.localidade.trim() === '') {
        newErrors.localidade = 'Localidade é obrigatória para feriados não nacionais';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Garante que localidade seja null para feriados nacionais
      const dataToSubmit = {
        ...formData,
        localidade: formData.abrangencia === TIPO_ABRANGENCIA.NACIONAL ? null : formData.localidade
      };
      onSubmit(dataToSubmit);
    }
  };

  const renderCamposEspecificos = () => {
    switch (formData.tipo) {
      case TIPO_FERIADO.FIXO:
        return (
          <div className="form-field">
            <label>Data Fixa (Mês-Dia) <span className="required">*</span></label>
            <input
              type="text"
              name="dataFixa"
              value={formData.dataFixa}
              onChange={handleChange}
              placeholder="Ex: 06-25 (25 de Junho)"
              maxLength="5"
              className={errors.dataFixa ? 'error' : ''}
            />
            {errors.dataFixa && <span className="error-text">{errors.dataFixa}</span>}
            <small className="field-hint">
              Formato: MM-DD (Ex: 12-25 para Natal)
            </small>
          </div>
        );

      case TIPO_FERIADO.MOVEL:
      case TIPO_FERIADO.PONTE:
        return (
          <div className="form-field">
            <label>Data Completa <span className="required">*</span></label>
            <input
              type="date"
              name="dataCompleta"
              value={formData.dataCompleta}
              onChange={handleChange}
              className={errors.dataCompleta ? 'error' : ''}
            />
            {errors.dataCompleta && <span className="error-text">{errors.dataCompleta}</span>}
          </div>
        );

      case TIPO_FERIADO.EXCEPCIONAL:
        return (
          <>
            <div className="form-field">
              <label>Data Completa <span className="required">*</span></label>
              <input
                type="date"
                name="dataCompleta"
                value={formData.dataCompleta}
                onChange={handleChange}
                className={errors.dataCompleta ? 'error' : ''}
              />
              {errors.dataCompleta && <span className="error-text">{errors.dataCompleta}</span>}
            </div>
            <div className="form-field">
              <label>Ano <span className="required">*</span></label>
              <input
                type="number"
                name="ano"
                value={formData.ano}
                onChange={handleChange}
                min="2020"
                max="2100"
                className={errors.ano ? 'error' : ''}
              />
              {errors.ano && <span className="error-text">{errors.ano}</span>}
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="feriado-form">
      <div className="form-section">
        <h3 className="section-title">Informações Básicas</h3>

        <div className="form-field">
          <label>Nome do Feriado <span className="required">*</span></label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Ex: Dia da Independência"
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
            placeholder="Descrição opcional do feriado"
            rows="2"
          />
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-title">Configuração do Feriado</h3>

        <div className="form-row">
          <div className="form-field">
            <label>Tipo de Feriado <span className="required">*</span></label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="select-modern"
            >
              {TIPO_FERIADO_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Abrangência <span className="required">*</span></label>
            <select
              name="abrangencia"
              value={formData.abrangencia}
              onChange={handleChange}
              className="select-modern"
            >
              {TIPO_ABRANGENCIA_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {renderCamposEspecificos()}

        {formData.abrangencia !== TIPO_ABRANGENCIA.NACIONAL && (
          <div className="form-field">
            <label>Localidade <span className="required">*</span></label>
            <select
              name="localidade"
              value={formData.localidade}
              onChange={handleChange}
              className={errors.localidade ? 'error' : ''}
            >
              <option value="">Selecione uma localidade...</option>
              {PROVINCIAS.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
            {errors.localidade && <span className="error-text">{errors.localidade}</span>}
          </div>
        )}
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
            <span className="checkbox-text">Feriado ativo</span>
          </label>
          <small className="field-hint">
            Apenas feriados ativos são considerados nos cálculos de datas de pagamento
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
          {loading ? 'Salvando...' : (feriado?.id ? 'Atualizar Feriado' : 'Criar Feriado')}
        </button>
      </div>
    </form>
  );
};

export default FeriadoForm;