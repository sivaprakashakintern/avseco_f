import axios from './axiosConfig.js';

export const productsApi = {
  getAll: async () => {
    const { data } = await axios.get('/products');
    return data;
  },
  add: async (productData) => {
    const { data } = await axios.post('/products', productData);
    return data;
  },
  update: async (id, productData) => {
    const { data } = await axios.put(`/products/${id}`, productData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axios.delete(`/products/${id}`);
    return data;
  },
};

export const employeeApi = {
  getAll: async () => {
    const { data } = await axios.get('/employees');
    return data;
  },
  add: async (employeeData) => {
    const { data } = await axios.post('/employees', employeeData);
    return data;
  },
  update: async (id, employeeData) => {
    const { data } = await axios.put(`/employees/${id}`, employeeData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axios.delete(`/employees/${id}`);
    return data;
  },
};

export const clientApi = {
  getAll: async () => {
    const { data } = await axios.get('/clients');
    return data;
  },
  add: async (clientData) => {
    const { data } = await axios.post('/clients', clientData);
    return data;
  },
  update: async (id, clientData) => {
    const { data } = await axios.put(`/clients/${id}`, clientData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axios.delete(`/clients/${id}`);
    return data;
  },
};

export const expenseApi = {
  getAll: async () => {
    const { data } = await axios.get('/expenses');
    return data;
  },
  add: async (expenseData) => {
    const { data } = await axios.post('/expenses', expenseData);
    return data;
  },
  update: async (id, expenseData) => {
    const { data } = await axios.put(`/expenses/${id}`, expenseData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axios.delete(`/expenses/${id}`);
    return data;
  },
};

export const userApi = {
  getProfile: async () => {
    const { data } = await axios.get('/user/profile');
    return data;
  },
};

export const productionApi = {
  getAll: async () => {
    const { data } = await axios.get('/production');
    return data;
  },
  add: async (productionData) => {
    const { data } = await axios.post('/production', productionData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axios.delete(`/production/${id}`);
    return data;
  },
  clearAll: async () => {
    const { data } = await axios.delete('/production');
    return data;
  }
};

export const attendanceApi = {
  getByDate: async (date) => {
    const { data } = await axios.get(`/attendance/${date}`);
    return data;
  },
  saveBulk: async (date, records) => {
    const { data } = await axios.post('/attendance/bulk', { date, records });
    return data;
  }
};

export const productionTargetApi = {
  getAll: async () => {
    const { data } = await axios.get('/production-targets');
    return data;
  },
  save: async (targetData) => {
    const { data } = await axios.post('/production-targets', targetData);
    return data;
  },
  updateProduced: async (id, producedQty) => {
    const { data } = await axios.put(`/production-targets/${id}`, { producedQty });
    return data;
  },
  delete: async (id) => {
    const { data } = await axios.delete(`/production-targets/${id}`);
    return data;
  },
  clearAll: async () => {
    const { data } = await axios.delete('/production-targets');
    return data;
  }
};

export const salesApi = {
  getAll: async () => {
    const { data } = await axios.get('/sales');
    return data;
  },
  log: async (saleData) => {
    const { data } = await axios.post('/sales', saleData);
    return data;
  },
  update: async (id, saleData) => {
    const { data } = await axios.put(`/sales/${id}`, saleData);
    return data;
  },
  delete: async (id) => {
    const { data } = await axios.delete(`/sales/${id}`);
    return data;
  }
};
export const healthApi = {
  check: async () => {
    const { data } = await axios.get('/health');
    return data;
  }
};
