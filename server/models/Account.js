import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required:true },
  type: { type: String, enum: ["income", "expense"], required: true },
  amount: { type: Number, required: true },
  person: { type: String, default: null },
  description: { type: String },
  paymentMode: {type: String,enum: ["Cash", "Bank", "UPI"],default: "Cash"},
  bankDetails: {bankName: String,accountNumber: String},
  upiDetails: {appName: String,upiId: String},
  tags: { type: [String], default: [] },
  date: { type: Date, default: Date.now },
  attachment: {type: String,default: null},
  originalName: {type: String}, 
},{ timestamps: true });

export default mongoose.model("Account", accountSchema);