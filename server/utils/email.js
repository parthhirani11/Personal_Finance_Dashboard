import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendEmail = async (
  to,
  senderName,
  amount,
  dashboardName
) => {
  try {

    const htmlTemplate = `
      <div style="font-family: Arial; background:#f4f6fb; padding:20px">
        <div style="max-width:600px;margin:auto;background:white;border-radius:10px;padding:25px">

          <h2 style="color:#2563eb;margin-bottom:10px">
            💰 Income Expense App
          </h2>

          <p style="font-size:16px">
            Hello,
          </p>

          <p style="font-size:16px">
            <b>${senderName}</b>  added a settlement in dashboard
            <b>${dashboardName}</b>.
          </p>

          <div style="background:#f1f5f9;padding:15px;border-radius:8px;margin:20px 0">
            <p style="font-size:18px;margin:0">
              Pending Amount: 
              <b style="color:#dc2626">₹${amount}</b>
            </p>
          </div>

          <p style="font-size:15px">
            Please open the app and complete the settlement.
          </p>

          <hr/>

          <p style="font-size:13px;color:#6b7280">
            This email was sent by Income Expense App.
          </p>

        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Income Expense App" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Settlement Pending Notification",
      html: htmlTemplate
    });

    // console.log("Email sent");

  } catch (error) {
    console.error("Email send error:", error);
  }
};

