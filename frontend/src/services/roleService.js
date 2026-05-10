import api from './api';

const roleService = {
  list: async (params = {}) => {
    const response = await api.get('/roles', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/roles', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/roles/${id}`);
  },

  initDefaults: async () => {
    const response = await api.post('/roles/initDefaults');
    return response.data;
  }
};

export default roleService;