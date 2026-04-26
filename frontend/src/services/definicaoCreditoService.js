// src/services/definicaoCreditoService.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/definicoesCredito';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Função auxiliar para extrair valor de Enum
const extractEnumValue = (value) => {
  if (!value) return null;
  // Se for objeto com name (Enum serializado), retorna o name
  if (typeof value === 'object' && value.name) {
    return value.name;
  }
  // Se for string, retorna a string
  return value;
};

// Função para processar dados vindos da API
const processarDadosRecebidos = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => processarItem(item));
  }
  return processarItem(data);
};

const processarItem = (item) => {
  if (!item) return item;

  return {
    ...item,
    periodicidade: extractEnumValue(item.periodicidade),
    formaDeCalculo: extractEnumValue(item.formaDeCalculo),
    periodicidadeMora: extractEnumValue(item.periodicidadeMora),
    // Processa a taxa também se existir
    taxa: item.taxa ? {
      ...item.taxa,
      tipoCalculo: extractEnumValue(item.taxa?.tipoCalculo)
    } : null
  };
};

export const definicaoCreditoService = {
  async listar(params = {}) {
    try {
      const response = await api.get('', { params });
      return processarDadosRecebidos(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async buscar(id) {
    try {
      const response = await api.get(`/${id}`);
      return processarDadosRecebidos(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async criar(definicao) {
    try {
      const dadosLimpos = this.limparDados(definicao);
      console.log('📤 Criando definição:', dadosLimpos);
      const response = await api.post('', dadosLimpos);
      return processarDadosRecebidos(response.data);
    } catch (error) {
      console.error('❌ Erro ao criar:', error.response?.data);
      throw this.handleError(error);
    }
  },

  async atualizar(id, definicao) {
    try {
      const dadosLimpos = this.limparDados(definicao);
      console.log('📤 Atualizando definição:', id, dadosLimpos);
      const response = await api.put(`/${id}`, dadosLimpos);
      return processarDadosRecebidos(response.data);
    } catch (error) {
      console.error('❌ Erro ao atualizar:', error.response?.data);
      throw this.handleError(error);
    }
  },

  async deletar(id) {
    try {
      await api.delete(`/${id}`);
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  limparDados(definicao) {
    const dados = {
      nome: definicao.nome?.trim(),
      descricao: definicao.descricao?.trim() || null,
      numeroDePrestacoes: parseInt(definicao.numeroDePrestacoes),
      periodicidade: definicao.periodicidade,
      formaDeCalculo: definicao.formaDeCalculo,
      percentualDeJuros: parseFloat(definicao.percentualDeJuros) || 0,
      percentualJurosDeDemora: parseFloat(definicao.percentualJurosDeDemora) || 0,
      taxa: definicao.taxa?.id ? { id: definicao.taxa.id } : null,
      maximoCobrancasMora: parseInt(definicao.maximoCobrancasMora) || 0,
      excluirSabados: definicao.excluirSabados === true,
      excluirDomingos: definicao.excluirDomingos === true,
      excluirDiaDePagNoSabado: definicao.excluirDiaDePagNoSabado === true,
      excluirDiaDePagNoDomingo: definicao.excluirDiaDePagNoDomingo === true,
      ativo: definicao.ativo === true
    };

    if (dados.maximoCobrancasMora > 0 && definicao.periodicidadeMora) {
      dados.periodicidadeMora = definicao.periodicidadeMora;
    } else {
      dados.periodicidadeMora = null;
    }

    Object.keys(dados).forEach(key => {
      if (dados[key] === undefined) {
        delete dados[key];
      }
    });

    return dados;
  },

  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 400) {
        return { type: 'VALIDATION', errors: data.errors || data };
      }
      return { type: 'SERVER', message: data.message || `Erro ${status}` };
    }
    return { type: 'NETWORK', message: 'Erro de conexão' };
  }
};