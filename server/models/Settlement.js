import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema({

  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  fromDashboardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dashboard",
    required: true
  },

  toDashboardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dashboard",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "settled"],
    default: "pending"
  },

  settledAt: Date

}, { timestamps: true });

export default mongoose.model("Settlement", settlementSchema);