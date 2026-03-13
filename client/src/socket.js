// import { io } from "socket.io-client";

// export const socket = io(import.meta.env.VITE_API_URL_UPLOADS,{
//   withCredentials:true
// });

import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  autoConnect:false,
  withCredentials:true
});