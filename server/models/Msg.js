import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  nname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true
    },
});

export default mongoose.model("Msg", accountSchema);