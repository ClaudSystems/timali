// src/services/relatorioService.js

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
  const response = await fetch(fullUrl, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('timali_token');
      localStorage.removeItem('timali_user');
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }
    throw new Error(`Erro ${response.status}`);
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    return [];
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Falha ao parsear JSON:', text);
    throw new Error(`Resposta não é JSON válido`);
  }
};

const relatorioService = {
    // Dashboard Analítico
    dashboardAnalitico: () =>
        request('/relatorios/dashboardAnalitico'),

    // Créditos Emitidos por Período
    creditosEmitidos: (dataInicio, dataFim) =>
        request(`/relatorios/creditosEmitidos?dataInicio=${dataInicio}&dataFim=${dataFim}`),

    // Créditos por Gestor
    creditosPorGestor: (dataInicio, dataFim, gestor = null) => {
        let url = `/relatorios/creditosPorGestor?dataInicio=${dataInicio}&dataFim=${dataFim}`;
        if (gestor) url += `&gestor=${gestor}`;
        return request(url);
    },

    // Prestações por Vencimento
    prestacoesPorVencimento: (dataInicio, dataFim) =>
        request(`/relatorios/prestacoesPorVencimento?dataInicio=${dataInicio}&dataFim=${dataFim}`),

    // Pagamentos Recebidos
    pagamentosRecebidos: (dataInicio, dataFim) =>
        request(`/relatorios/pagamentosRecebidos?dataInicio=${dataInicio}&dataFim=${dataFim}`),

    // Saídas/Gastos
    saidas: (dataInicio, dataFim) =>
        request(`/relatorios/saidas?dataInicio=${dataInicio}&dataFim=${dataFim}`),

    // Diários
    diarios: (dataInicio, dataFim) =>
        request(`/relatorios/diarios?dataInicio=${dataInicio}&dataFim=${dataFim}`),

    // Créditos em Mora
    creditosEmMora: () =>
        request('/relatorios/creditosEmMora'),

    // Todos os Usuários
    usuarios: () =>
        request('/relatorios/usuarios'),

    // Usuários com Créditos Ativos
    usuariosComCreditos: () =>
        request('/relatorios/usuariosComCreditos'),

    // Clientes com Atrasos
    clientesComAtrasos: () =>
        request('/relatorios/clientesComAtrasos'),

    // Avaliar Pontualidade do Cliente
    avaliarCliente: (clienteId) =>
        request(`/relatorios/avaliarCliente/${clienteId}`),

    // Buscar Gestores (usuários com role GESTOR)
    getGestores: () =>
        request('/relatorios/gestores'),
};

export default relatorioService;
