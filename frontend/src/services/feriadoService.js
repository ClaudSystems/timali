// src/services/feriadoService.js
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/feriados';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const feriadoService = {
  async listar(params = {}) {
    try {
      const response = await api.get('', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async buscar(id) {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async criar(feriado) {
    try {
      const dadosLimpos = this.limparDados(feriado);
      console.log('Criando feriado:', dadosLimpos);
      const response = await api.post('', dadosLimpos);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar:', error.response?.data);
      throw this.handleError(error);
    }
  },

  async atualizar(id, feriado) {
    try {
      const dadosLimpos = this.limparDados(feriado);
      console.log('Atualizando feriado:', id, dadosLimpos);
      const response = await api.put(`/${id}`, dadosLimpos);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar:', error.response?.data);
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

  async listarPorAno(ano) {
    try {
      const response = await api.get('', { params: { ano: ano } });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  limparDados(feriado) {
    const dados = {
      nome: feriado.nome?.trim(),
      descricao: feriado.descricao?.trim() || null,
      tipo: feriado.tipo,
      abrangencia: feriado.abrangencia,
      ativo: feriado.ativo === true
    };

    // Campos específicos por tipo
    if (feriado.tipo === 'FIXO' && feriado.dataFixa) {
      dados.dataFixa = feriado.dataFixa; // Formato: MM-DD
    }

    if (feriado.tipo === 'MOVEL' || feriado.tipo === 'EXCEPCIONAL' || feriado.tipo === 'PONTE') {
      if (feriado.dataCompleta) {
        dados.dataCompleta = feriado.dataCompleta;
      }
    }

    if (feriado.tipo === 'EXCEPCIONAL' && feriado.ano) {
      dados.ano = parseInt(feriado.ano);
    }

    // Localidade para feriados não nacionais
    if (feriado.abrangencia !== 'NACIONAL' && feriado.localidade) {
      dados.localidade = feriado.localidade;
    }

    // Remove campos undefined/null
    Object.keys(dados).forEach(key => {
      if (dados[key] === undefined || dados[key] === '') {
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
      if (status === 404) {
        return { type: 'NOT_FOUND', message: 'Feriado não encontrado' };
      }

      return {
        type: 'SERVER',
        message: data.message || `Erro ${status}`,
        status
      };
    }

    return {
      type: 'NETWORK',
      message: 'Erro de conexão com o servidor'
    };
  }
};