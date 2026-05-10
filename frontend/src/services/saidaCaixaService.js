// src/services/saidaCaixaService.js

const BASE_URL = 'http://localhost:8080/api';

const request = async (url, options = {}) => {
  const token = localStorage.getItem('timali_token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const fullUrl = `${BASE_URL}${url}`;
  console.log('Requisição para:', fullUrl);

  const response = await fetch(fullUrl, { ...options, headers });
  console.log('Status:', response.status);

  const text = await response.text();

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('timali_token');
      localStorage.removeItem('timali_user');
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }
    console.error('Erro:', text.substring(0, 300));
    throw new Error(text || `Erro ${response.status}`);
  }

  if (!text || text.trim() === '') return [];
  try { return JSON.parse(text); } catch (e) {
    console.error('Resposta não JSON:', text.substring(0, 300));
    throw new Error('Resposta não é JSON válido');
  }
};

const saidaCaixaService = {
    listar: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return request(`/saidasCaixa${queryString ? '?' + queryString : ''}`);
    },

    buscar: (id) => request(`/saidasCaixa/${id}`),

    criar: (data) => request('/saidasCaixa', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    atualizar: (id, data) => request(`/saidasCaixa/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    excluir: (id) => request(`/saidasCaixa/${id}`, {
        method: 'DELETE'
    }),

    porPeriodo: (dataInicio, dataFim, tipo = null) => {
        let url = `/saidasCaixa/porPeriodo?dataInicio=${dataInicio}&dataFim=${dataFim}`;
        if (tipo) url += `&tipo=${tipo}`;
        return request(url);
    },

    resumo: (dataInicio, dataFim) =>
        request(`/saidasCaixa/resumo?dataInicio=${dataInicio}&dataFim=${dataFim}`),
};

export default saidaCaixaService;