
import axios from 'axios';
const API = axios.create({
  baseURL: 'http://localhost:8000', 
});

// Add a request interceptor to include token in Authorization header
API.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('userAuthDetails');
    if (authData) {
      const parsedAuth = JSON.parse(authData);
      if (parsedAuth.token) {
        config.headers.Authorization = `Bearer ${parsedAuth.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
