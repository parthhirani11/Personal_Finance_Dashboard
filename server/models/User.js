// add new user models data type value
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^[A-Za-z0-9_@]+$/
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },


   
  categories: {
    type: [String],
    default: ["goods", "salary", "rent", "food"],
  },

  tags: {
    type: [String],
    default: ["personal", "office", "emi","home"],
  },
});

export default mongoose.model("User", userSchema);
