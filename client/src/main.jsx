import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import axios from "axios";
import "./styles/main.css";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <ToastContainer
      position="top-center"
      autoClose={3000}
      newestOnTop
      closeOnClick
      pauseOnHover
    />
  </React.StrictMode>
);
