// import axios from "axios";

// export default axios.create({
//   baseURL: "http://localhost:8000",
//   //baseURL: "https://server.prosoftsynergies.com/",
//   //baseURL: process.env.BACKEND_SERVER_API || 'https://server.prosoftsynergies.com',
//   //baseURL: "https://backend.prosoftsynergies.com",
//   //withCredentials: true,
//   //credentials: "include",
// });


import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000', 
  //baseURL: "https://server.prosoftsynergies.com/",
  // withCredentials: true, // uncomment if your backend requires cookies
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
