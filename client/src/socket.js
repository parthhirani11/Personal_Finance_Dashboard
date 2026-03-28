import { io } from "socket.io-client";
// import.meta.env.VITE_API_URL_UPLOADS or http://localhost:5000
// export const socket = io(import.meta.env.VITE_API_URL_UPLOADS, {
export const socket = io("/", {
  autoConnect:false,
  withCredentials:true
});

// C:\Users\parth\AppData\Local\nvm