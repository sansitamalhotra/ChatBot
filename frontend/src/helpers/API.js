import axios from "axios";

export default axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  //baseURL: process.env.REACT_APP_API_URL || 'https://server.prosoftsynergies.com',
  //baseURL: "https://backend.prosoftsynergies.com",
  //withCredentials: true,
  //credentials: "include",
});


