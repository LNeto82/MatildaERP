import axios from 'axios';

// Cria a instância do Axios apontando para o nosso backend
const api = axios.create({
    baseURL: 'https://matildaerp-production.up.railway.app/api'
});

// Interceptor: Antes de qualquer requisição sair, ele injeta o Token JWT se o usuário estiver logado
api.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;