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

// Interceptor para adicionar o token JWT automaticamente
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('timali_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

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
      console.log('📤 Dados enviados:', JSON.stringify(dadosLimpos, null, 2));

      const response = await api.post('', dadosLimpos);
      console.log('✅ Feriado criado:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ ERRO COMPLETO:', error);

      if (error.response) {
        console.error('📋 Status HTTP:', error.response.status);
        console.error('📋 Headers:', JSON.stringify(error.response.headers));
        console.error('📋 Resposta completa:', JSON.stringify(error.response.data, null, 2));

        // Mostra cada erro de validação detalhadamente
        if (error.response.data && error.response.data.errors) {
          error.response.data.errors.forEach((err, i) => {
            console.error(`🔴 Erro #${i + 1}:`);
            console.error(`   Object: ${err.object}`);
            console.error(`   Campo: ${err.field}`);
            console.error(`   Mensagem: ${err.message}`);
            console.error(`   Valor rejeitado: ${JSON.stringify(err['rejected-value'])}`);
          });

          // ALERTA com o primeiro erro para fácil visualização
          const primeiroErro = error.response.data.errors[0];
          alert(`❌ Erro de validação!\n\nCampo: ${primeiroErro.field}\nMensagem: ${primeiroErro.message}\nValor rejeitado: ${JSON.stringify(primeiroErro['rejected-value'])}`);
        } else if (error.response.data && error.response.data.message) {
          alert(`❌ Erro: ${error.response.data.message}`);
        }
      } else {
        console.error('⚠️ Erro de rede (sem resposta do servidor)');
        alert('❌ Erro de conexão com o servidor. Verifique se o Grails está rodando.');
      }

      throw this.handleError(error);
    }
  },

  async atualizar(id, feriado) {
    try {
      const dadosLimpos = this.limparDados(feriado);
      console.log('📤 Atualizando feriado:', id, JSON.stringify(dadosLimpos, null, 2));

      const response = await api.put(`/${id}`, dadosLimpos);
      console.log('✅ Feriado atualizado:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ Erro ao atualizar:', error.response?.data);

      if (error.response?.data?.errors) {
        const primeiroErro = error.response.data.errors[0];
        alert(`❌ Erro ao atualizar!\n\nCampo: ${primeiroErro.field}\nMensagem: ${primeiroErro.message}`);
      }

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
      dados.dataFixa = feriado.dataFixa;
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

    // Remove campos undefined, null ou vazios
    Object.keys(dados).forEach(key => {
      if (dados[key] === undefined || dados[key] === null || dados[key] === '') {
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
      if (status === 401 || status === 403) {
        return { type: 'AUTH', message: 'Sessão expirada. Faça login novamente.' };
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