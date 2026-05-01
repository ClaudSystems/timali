// src/services/pagamentoService.js

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

const pagamentoService = {
  // Buscar créditos por nome/NUIT do cliente (SEM HÍFEN)
  buscarCreditosPorCliente: (query) =>
    request(`/pagamentos/buscarCreditos?query=${encodeURIComponent(query)}`),

  // Buscar parcelas pendentes de um crédito
  buscarParcelas: (creditoId) =>
    request(`/pagamentos/${creditoId}/parcelas`),

  // Calcular valores de mora para uma parcela
  calcularMora: (parcelaId) =>
    request(`/pagamentos/${parcelaId}/calcularMora`),

  // Registrar novo pagamento
  registrarPagamento: (data) =>
    request('/pagamentos/registrar', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Listar pagamentos do dia
  listarPagamentosDoDia: (data = null) => {
    const url = data ? `/pagamentos/caixa/hoje?data=${data}` : '/pagamentos/caixa/hoje';
    return request(url);
  },

  // Resumo do caixa do dia
  resumoCaixa: (data = null) => {
    const url = data ? `/pagamentos/caixa/resumo?data=${data}` : '/pagamentos/caixa/resumo';
    return request(url);
  },

  // Gerar recibo de um pagamento
  gerarRecibo: (pagamentoId) =>
    request(`/pagamentos/${pagamentoId}/recibo`),

  // Listar todos os pagamentos (com paginação)
  listar: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/pagamentos?${queryString}` : '/pagamentos';
    return request(url);
  },

  // Buscar pagamento por ID
  buscar: (id) => request(`/pagamentos/${id}`),
};

export default pagamentoService;