import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/account.js";
import exportRoutes from "./routes/exportRoutes.js";
import connectDB from "./config/db.js";
dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// "https://phpstack-1249340-6098543.cloudwaysapps.com/ "
// process.env.FRONTEND_URL,
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(
  session({
    name: "session-id",
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
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
app.use("/uploads", express.static("uploads"));


const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
