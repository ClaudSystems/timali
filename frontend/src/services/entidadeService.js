// src/services/entidadeService.js
const BASE_URL = 'http://localhost:8080/api/entidades';

const getToken = () => localStorage.getItem('timali_token');

const headers = () => {
  const token = getToken();
  console.log('🔑 Token:', token ? 'Presente' : 'AUSENTE');

  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

const handleResponse = async (response) => {
  console.log('📡 Status:', response.status);

  if (!response.ok) {
    // Tentar ler o erro como JSON
    let errorMessage = `Erro ${response.status}`;

    try {
      const errorData = await response.json();
      console.error('❌ Erro JSON:', errorData);

      // Pegar mensagem de erro do Grails
      if (errorData.errors) {
        // Erros de validação do Grails
        const messages = errorData.errors.map(e => e.message || e.defaultMessage).join(', ');
        errorMessage = messages;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // Se não for JSON, ler como texto
      const errorText = await response.text();
      console.error('❌ Erro texto:', errorText);
      if (errorText) errorMessage = errorText;
    }

    throw new Error(errorMessage);
  }

  // Verificar se tem conteúdo
  const text = await response.text();
  console.log('✅ Resposta:', text.substring(0, 100));

  return text ? JSON.parse(text) : {};
};

const entidadeService = {
  listar: async () => {
    console.log('📥 GET:', BASE_URL);
    const response = await fetch(BASE_URL, { headers: headers() });
    return handleResponse(response);
  },

  buscar: async (id) => {
    console.log('📥 GET:', `${BASE_URL}/${id}`);
    const response = await fetch(`${BASE_URL}/${id}`, { headers: headers() });
    return handleResponse(response);
  },

  buscarPorNome: async (query) => {
    console.log('📥 GET:', `${BASE_URL}/buscar?query=${query}`);
    const response = await fetch(`${BASE_URL}/buscar?query=${encodeURIComponent(query)}`, {
      headers: headers()
    });
    return handleResponse(response);
  },

  criar: async (data) => {
    console.log('➕ POST:', BASE_URL);
    console.log('📤 Dados:', JSON.stringify(data, null, 2));

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });

    return handleResponse(response);
  },

  buscarUsuarios: async () => {
    console.log('📥 GET: /api/usuarios');
    const response = await fetch('http://localhost:8080/api/usuarios', {
      headers: headers()
    });
    return handleResponse(response);
  },

  atualizar: async (id, data) => {
    console.log('✏️ PUT:', `${BASE_URL}/${id}`);
    console.log('📤 Dados:', JSON.stringify(data, null, 2));

    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    });

    return handleResponse(response);
  },

  excluir: async (id) => {
    console.log('🗑️ DELETE:', `${BASE_URL}/${id}`);
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: headers()
    });
    return handleResponse(response);
  }
};

export default entidadeService;