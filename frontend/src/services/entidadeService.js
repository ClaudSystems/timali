const API_URL = 'http://localhost:8080/api';

const getToken = () => {
    return localStorage.getItem('timali_token');
};

const headers = () => ({
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
});

export const entidadeService = {
    // LISTAR
    listar: async () => {
        const response = await fetch(`${API_URL}/entidades`, {
            method: 'GET',
            headers: headers()
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('timali_token');
                localStorage.removeItem('timali_user');
                window.location.href = '/login';
                throw new Error('Sessão expirada');
            }
            throw new Error(`Erro ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    },

    // BUSCAR POR ID
    buscarPorId: async (id) => {
        const response = await fetch(`${API_URL}/entidades/${id}`, {
            method: 'GET',
            headers: headers()
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);
        return response.json();
    },

    // CRIAR
    criar: async (entidade) => {
        const response = await fetch(`${API_URL}/entidades`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(entidade)
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);
        return response.json();
    },

    // ATUALIZAR - COM version E id
    atualizar: async (id, entidade) => {
        // IMPORTANTE: Incluir id e version para o update funcionar
        const dadosCompletos = {
            ...entidade,
            id: id,                          // ID é obrigatório
            version: entidade.version        // VERSION é obrigatório!
        };

        console.log('📦 Enviando update para ID:', id);
        console.log('📦 Dados completos:', dadosCompletos);

        const response = await fetch(`${API_URL}/entidades/${id}`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify(dadosCompletos)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Erro no update:', error);
            throw new Error(`Erro ${response.status}: ${error}`);
        }

        const data = await response.json();
        console.log('✅ Update sucesso:', data);
        return data;
    },

    // EXCLUIR
    excluir: async (id) => {
        const response = await fetch(`${API_URL}/entidades/${id}`, {
            method: 'DELETE',
            headers: headers()
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);
        return true;
    },

    // VERIFICAR CÓDIGO
    verificarCodigo: async (codigo) => {
        const response = await fetch(`${API_URL}/entidades/verificar-codigo/${codigo}`, {
            method: 'GET',
            headers: headers()
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);
        return response.json();
    }
};