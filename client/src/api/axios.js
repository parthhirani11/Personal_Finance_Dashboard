// route common path
import axios from "axios";

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_URL,
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

// 🔥 GLOBAL ERROR HANDLER
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ❌ server down / no response
    if (!error.response) {
      window.location.href = "/login";
    }

    // ❌ unauthorized
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// api.interceptors.response.use(
//   res => res,
//   err => {
//     return Promise.reject(err); // ❌ no redirect here
//   }
// );

export default api;
