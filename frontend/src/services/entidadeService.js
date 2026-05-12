// frontend/src/services/entidadeService.js
const API_URL = 'http://localhost:8080/api';

const getToken = () => localStorage.getItem('timali_token');

const headers = () => ({
  'Authorization': `Bearer ${getToken()}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
});

const entidadeService = {
  listar: async () => {
    const response = await fetch(`${API_URL}/entidades`, {
      headers: headers()
    });
    if (!response.ok) throw new Error('Erro ao listar');
    return response.json();
  },

  buscar: async (id) => {
    const response = await fetch(`${API_URL}/entidades/${id}`, {
      headers: headers()
    });
    if (!response.ok) throw new Error('Erro ao buscar');
    return response.json();
  },

  criar: async (data) => {
    const response = await fetch(`${API_URL}/entidades`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    return response.json();
  },

  atualizar: async (id, data) => {
    console.log('✏️ PUT:', `${API_URL}/entidades/${id}`);
    console.log('📤 Dados:', JSON.stringify(data));

    const response = await fetch(`${API_URL}/entidades/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    });

    console.log('📡 Status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro:', error);
      throw new Error(error);
    }

    const result = await response.json();
    console.log('✅ Resposta:', JSON.stringify(result).substring(0, 100));
    return result;
  },

  excluir: async (id) => {
    const response = await fetch(`${API_URL}/entidades/${id}`, {
      method: 'DELETE',
      headers: headers()
    });
    if (!response.ok) throw new Error('Erro ao excluir');
  },

  verificarCodigo: async (codigo) => {
    const response = await fetch(`${API_URL}/entidades/verificarCodigo?codigo=${codigo}`, {
      headers: headers()
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.disponivel;
  }
};

export default entidadeService;