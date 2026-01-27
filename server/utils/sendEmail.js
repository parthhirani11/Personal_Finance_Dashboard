// sendEmail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load .env variables
dotenv.config();

// Create transporter
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});