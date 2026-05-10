import api from './api';

const usuarioService = {
  list: async (params = {}) => {
    const response = await api.get('/usuarios', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/usuarios', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/usuarios/${id}`);
  },

  toggleStatus: async (id) => {
    const response = await api.put(`/usuarios/${id}/toggleStatus`);
    return response.data;
  },

  updateGroups: async (id, groupIds) => {
    const response = await api.put(`/usuarios/${id}/groups`, { groupIds });
    return response.data;
  },

  updateRoles: async (id, roleIds) => {
    const response = await api.put(`/usuarios/${id}/roles`, { roleIds });
    return response.data;
  }
};

export default usuarioService;