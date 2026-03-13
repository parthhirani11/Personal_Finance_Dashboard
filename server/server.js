import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/account.js";
import exportRoutes from "./routes/exportRoutes.js";
import dashboardRoutes from "./routes/dashboard.js"
import settlementRoutes from "./routes/settlement.js";
import notificationRoutes from "./routes/notification.js";
import userRoutes from "./routes/userRoutes.js";

// import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(
  session({
    name: "session-id",
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true only for HTTPS
    },
  })
);

// connectDB();
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"));

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/account", exportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settlement", settlementRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads", express.static("uploads"));

const io = new Server(server,{
  cors:{
    origin: process.env.FRONTEND_URL,
    credentials:true
  }
});
export { io };

io.on("connection",(socket)=>{

  socket.on("join",(userId)=>{
    socket.join(userId);
  });

});
// server connection
const PORT = process.env.PORT || 6000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

server.listen(PORT,()=>{
 console.log(`Server running on port ${PORT}`);
});
