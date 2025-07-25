import axios from "axios";

export default axios.create({
  baseURL: "http://localhost:8000",
  //baseURL: "https://server.prosoftsynergies.com/",
  //baseURL: process.env.BACKEND_SERVER_API || 'https://server.prosoftsynergies.com',
  //baseURL: "https://backend.prosoftsynergies.com",
  //withCredentials: true,
  //credentials: "include",
});

