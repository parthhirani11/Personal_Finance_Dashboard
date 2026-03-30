import { io } from "socket.io-client";
//  http://localhost:5000

export const socket = io("/", {
  autoConnect:false,
  withCredentials:true
});
