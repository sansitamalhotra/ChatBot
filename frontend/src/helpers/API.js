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

export default API;

