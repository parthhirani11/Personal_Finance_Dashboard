// transection recode models data type value
import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  
  dashboardIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dashboard",
    required: true
  }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required:true },
  type: { type: String, enum: ["income", "expense"], required: true },
  amount: { type: Number, required: true },
  relatedDetails: { type: String, default: "" },
  person: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
},

manualPersonName: {
  type: String,
  default: null
},
  description: { type: String },
  tags: { type: [String], default: [] },
  paymentMode: {
  type: String,
  required: false,
  default: null
},
  date: { type: Date, default: Date.now },
  attachment: {type: String,default: null},
  originalName: {type: String}, 
  // ADD BELOW existing fields

settlementId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Settlement",
  default: null
},

settlementRole: {
  type: String,
  enum: ["none", "receivable", "payable"],
  default: "none"
},

settlementStatus: {
  type: String,
  enum: ["none", "pending", "settled"],
  default: "none"
},

otherUserId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
},

otherDashboardId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Dashboard",
  default: null
},

createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User"
}
},{ timestamps: true });

export default mongoose.model("Account", accountSchema);