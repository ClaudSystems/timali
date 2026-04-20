import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
});

// INTERCEPTOR: Adiciona o Token em cada pedido
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('timali_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// INTERCEPTOR: Trata erros de autenticação (ex: token expirado)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('timali_token');
            // Opcional: redirecionar para login
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
