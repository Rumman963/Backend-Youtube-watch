import express from "express"
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { userModel } from "./db.js";
import bcrypt from "bcrypt"


const app = express();
app.use(express.json())




app.post("/signup" , async (req , res)=>{

    const username=req.body.username;
    const password= req.body.password;
    
    try{
        const hashedPassword = await bcrypt.hash(password , 10);
        
        await userModel.create({
            username:username,
            password:hashedPassword
        });

        res.json({
            message:"You have Signup"
        })
    }catch(e){
        res.status(411).json({
            message:"user already exist"
        })
    }

} 

)




app.post("/signin" , (req,res)=>{

    const username=req.body.username;
    const password= req.body.password;

})





app.listen(3000);
