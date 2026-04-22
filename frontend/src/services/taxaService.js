// src/services/taxaService.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/taxas';

// Configuração do Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para logs (opcional)
api.interceptors.request.use(
  config => {
    console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Operações CRUD
export const taxaService = {
  // Listar todas as taxas (com paginação opcional)
  async listar(params = {}) {
    try {
      const response = await api.get('', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Buscar uma taxa específica
  async buscar(id) {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Criar nova taxa
  async criar(taxa) {
    try {
      const response = await api.post('', this.formatarTaxa(taxa));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Atualizar taxa existente
  async atualizar(id, taxa) {
    try {
      const response = await api.put(`/${id}`, this.formatarTaxa(taxa));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Atualização parcial (PATCH)
  async patch(id, campos) {
    try {
      const response = await api.patch(`/${id}`, campos);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Deletar taxa
  async deletar(id) {
    try {
      await api.delete(`/${id}`);
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Buscar apenas taxas ativas
  async listarAtivas() {
    try {
      const response = await api.get('', {
        params: { ativo: true }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Formatar dados antes de enviar
  formatarTaxa(taxa) {
    const formatted = { ...taxa };

    // Remove campos vazios baseado no tipo de cálculo
    if (formatted.tipoCalculo !== 'PERCENTUAL') {
      delete formatted.percentual;
    }
    if (formatted.tipoCalculo !== 'VALOR_FIXO') {
      delete formatted.valorFixo;
    }
    if (formatted.tipoCalculo !== 'FAIXA_PERCENTUAL') {
      delete formatted.faixasJson;
    }

    // Garante que valores numéricos sejam enviados como número
    if (formatted.percentual) formatted.percentual = Number(formatted.percentual);
    if (formatted.valorFixo) formatted.valorFixo = Number(formatted.valorFixo);
    if (formatted.valorMinimo) formatted.valorMinimo = Number(formatted.valorMinimo);
    if (formatted.valorMaximo) formatted.valorMaximo = Number(formatted.valorMaximo);

    return formatted;
  },

  // Tratamento de erros
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 400) {
        return { type: 'VALIDATION', errors: data.errors || data };
      }
      if (status === 404) {
        return { type: 'NOT_FOUND', message: 'Taxa não encontrada' };
      }
      if (status === 409) {
        return { type: 'CONFLICT', message: 'Já existe uma taxa com este nome' };
      }

      return {
        type: 'SERVER',
        message: data.message || 'Erro no servidor',
        status
      };
    }

    return {
      type: 'NETWORK',
      message: 'Erro de conexão com o servidor'
    };
  }
};