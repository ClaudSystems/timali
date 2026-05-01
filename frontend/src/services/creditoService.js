// src/services/creditoService.js

const BASE_URL = 'http://localhost:8080/api';

const request = async (url, options = {}) => {
  const token = localStorage.getItem('timali_token');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${BASE_URL}${url}`;
  console.log('Requisição para:', fullUrl);

  const response = await fetch(fullUrl, { ...options, headers });

  console.log('Status:', response.status);
  console.log('Content-Type:', response.headers.get('content-type'));

  const text = await response.text();
  console.log('Resposta (primeiros 500 chars):', text.substring(0, 500));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('timali_token');
      localStorage.removeItem('timali_user');
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }
    throw new Error(text || `Erro ${response.status}`);
  }

  if (!text || text.trim() === '') {
    return [];
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Falha ao parsear JSON:', text);
    throw new Error(`Resposta não é JSON válido: ${text.substring(0, 100)}`);
  }
};

const creditoService = {
  buscarClientes: (termo) => request(`/creditos/buscarClientes?termo=${encodeURIComponent(termo)}`),
  // NOVO: Buscar créditos por cliente
    buscarCreditosPorCliente: (termo) => request(`/creditos/buscarCreditosPorCliente?termo=${encodeURIComponent(termo)}`),


  // creditoService.js
  criar: (data) => {
    return request('/creditos', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  listarDefinicoes: () => request('/definicoesCredito'),

  listar: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/creditos?${queryString}` : '/creditos';
    return request(url);
  },

  buscar: (id) => request(`/creditos/${id}`),

  listarParcelas: (creditoId) => request(`/creditos/${creditoId}/parcelas`),

  invalidar: (id) => request(`/creditos/${id}/invalidar`, { method: 'PUT' }),

  arquivar: (id) => request(`/creditos/${id}/arquivar`, { method: 'PUT' }),

  registrarPagamento: (creditoId, parcelaId, data) =>
    request(`/creditos/${creditoId}/parcelas/${parcelaId}/pagar`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  extrato: (id) => request(`/creditos/${id}/extrato`),
      buscarPagamentosPorCredito: (creditoId) =>
          request(`/creditos/${creditoId}/pagamentos`),

      // Histórico geral de pagamentos
      historicoPagamentos: (params = {}) => {
          const queryString = new URLSearchParams(params).toString();
          const url = queryString ? `/creditos/historicoPagamentos?${queryString}` : '/creditos/historicoPagamentos';
          return request(url);
      },

      // Pagamentos por período
      pagamentosPorPeriodo: (dataInicio, dataFim) =>
          request(`/creditos/pagamentosPorPeriodo?dataInicio=${dataInicio}&dataFim=${dataFim}`)

};

export default creditoService;