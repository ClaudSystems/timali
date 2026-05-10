const BASE_URL = 'http://localhost:8080/api';

const getToken = () => localStorage.getItem('timali_token');

const handleResponse = async (response) => {
    const contentType = response.headers.get('content-type');

    if (!response.ok) {
        let errorMsg = `Erro ${response.status}`;

        if (contentType && contentType.includes('application/json')) {
            try {
                const errJson = await response.json();
                errorMsg = errJson.message || errJson.error || errorMsg;
            } catch (e) {
                console.error('Falha ao parsear erro JSON:', e);
            }
        } else {
            const text = await response.text();
            errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
    }

    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não-JSON:', text);
        throw new Error('Resposta do servidor não está em formato JSON');
    }

    return response.json();
};

export const caixaService = {
    gerarDiario: async (data) => {
        const response = await fetch(`${BASE_URL}/diarios/gerar?data=${data}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Accept': 'application/json'
            }
        });
        return handleResponse(response);
    },

    fecharDiario: async (diario) => {
        const response = await fetch(`${BASE_URL}/diarios/fechar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(diario)
        });
        return handleResponse(response);
    },

    listarDiarios: async () => {
        const response = await fetch(`${BASE_URL}/diarios`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Accept': 'application/json'
            }
        });
        return handleResponse(response);
    }
};