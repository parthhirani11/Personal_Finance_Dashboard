import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: String,

  message: String,

  type: {
    type: String,
    enum: ["settlement", "transaction"]
  },
  settlementId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Settlement"
  },
  status: {
    type: String,
    enum: ["pending", "settled"],
    default: "pending"
  },
  isRead: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);