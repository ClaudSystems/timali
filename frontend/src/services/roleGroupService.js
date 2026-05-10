import api from './api';

const roleGroupService = {
  list: async (params = {}) => {
    const response = await api.get('/roleGroups', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/roleGroups', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/roleGroups/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/roleGroups/${id}`);
  },

  initDefaults: async () => {
    const response = await api.post('/roleGroups/initDefaults');
    return response.data;
  }
};

export default roleGroupService;