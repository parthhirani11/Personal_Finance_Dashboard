import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

export default api;

 // https://phpstack-1249340-6098543.cloudwaysapps.com