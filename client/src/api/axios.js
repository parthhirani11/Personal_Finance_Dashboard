// route common path
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

api.interceptors.response.use(
  res => res,
  err => {
    return Promise.reject(err); // ❌ no redirect here
  }
);

export default api;
