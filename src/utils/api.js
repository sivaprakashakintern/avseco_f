import axios from './axiosConfig';

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

export const userApi = {
  getProfile: async () => {
    const { data } = await axios.get('/user/profile');
    return data;
  },
};
