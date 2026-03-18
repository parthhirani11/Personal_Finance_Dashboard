// user's data pass
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import Msg from "../models/Msg.js";
import { transporter } from "../utils/email.js";
import client from "../utils/twilio.js";

const router = express.Router();

/* ABOUT */
router.get("/about", (req, res) => {
 res.json({
    title: "About Us",
    features: [
      "Simple Interface",
      "Smart Features",
      "Fast & Secure"
    ]
  });
});

/* CONTACT */
router.post("/contact", async (req, res) => {
  const { nname, email, message } = req.body;

  try {
    await Msg.create({ nname, email, message });

    try {
      await client.messages.create({
        body: `📩 NEW CONTACT MESSAGE:\n\nName: ${nname}\nEmail: ${email}\nMessage: ${message}`,
        from: process.env.TWILIO_PHONE,
        to: process.env.MY_PHONE,
      });
    } catch (twilioErr) {
      console.error("TWILIO ERROR:", twilioErr.message);
      
    }

    //  response only ONCE
    return res.status(200).json({ msg: "Message sent successfully" });

  } catch (error) {
    console.error("CONTACT ERROR:", error);
    return res.status(500).json({ msg: "Failed to send message" });
  }
});



/* REGISTER */
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ msg: "All fields required" });

   const idExists = await User.findOne({ name });
    if (idExists)
      return res.status(400).json({ msg: "User ID already taken" });

  const exists = await User.findOne({ email });
  if (exists)
    return res.status(400).json({ msg: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashed,
  });

  res.status(201).json({ msg: "Registration successful" });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

/* LOGIN */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ msg: "Wrong password" });

    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.json({ msg: "Login success", user: req.session.user });
  } catch (err) {
    res.status(500).json({ msg: "Login failed" });
  }
});



// Get session user

router.get("/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

// Logout
router.post("/logout", (req, res) => {
  
  req.session.destroy(err => {
  if (err) {
    return res.status(500).json({ msg: "Logout failed" });
  }
  res.clearCookie("session-id");
  res.json({ msg: "Logged out" });
});
  // });
});


// FORGOT PASSWORD / SEND OTP
router.post("/forgot/send-otp", async (req, res) => {

  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email });
    await Otp.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    try {
      await transporter.sendMail({
        from: `"Income Expense App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset OTP",
        html: `<h2>Password Reset</h2><p>Your OTP is:</p><h1 style="color:green;">${otp}</h1> <p>This OTP is valid for 5 minutes.</p>`
      });
    } catch(mailErr) {
      console.error("Mail sending failed:", mailErr);
      return res.status(500).json({ msg: "Failed to send OTP" });
    }

    res.json({ msg: "OTP sent successfully" });
  } catch (error) {
    console.error("Forgot OTP ERROR:", error);
    res.status(500).json({ msg: "Failed to send OTP" });
  }
});


  // VERIFY OTP

router.post("/forgot/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const record = await Otp.findOne({ email });

  if (!record)
    return res.status(400).json({ message: "OTP not found" });

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ email });
    return res.status(400).json({ message: "OTP expired" });
  }

  if (record.otp !== otp)
    return res.status(400).json({ message: "Invalid OTP" });

  await Otp.deleteOne({ email });

  res.json({ message: "OTP verified" });
});


  // RESET PASSWORD

router.post("/reset", async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.updateOne({ email }, { password: hashedPassword });

  res.json({ message: "Password reset successful" });
});

router.get("/search", async(req,res)=>{

  const {email} = req.query;
  if(!email){
    return res.status(400).json({msg:"Email required"})
  }
  const user = await User.findOne({email}).select("_id name email");

  res.json(user);

});

export default router;
