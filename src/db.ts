import mongoose from "mongoose";
import {model , Schema} from "mongoose";
import dotenv from "dotenv";
dotenv.config();
mongoose.connect(process.env.MONGO_URL as string);



const userSchema = new Schema ({
   
    username:{type:String, unique:true , required: true},
    password:{type:String ,  required: true}


})



export const userModel = model("users", userSchema);