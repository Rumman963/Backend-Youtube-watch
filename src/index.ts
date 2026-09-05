import express from "express"
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { userModel } from "./db.js";
import bcrypt from "bcrypt"
import { JWT_PASSWORD } from "./config.js";
import {WebSocketServer} from "ws";
import http from "http";
import { handleConnection } from "./handlers/connectionHandler.js"

const app = express();
app.use(express.json())


const server = http.createServer(app);
const wss = new WebSocketServer({ server})


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




app.post("/signin" , async (req,res)=>{

    const username=req.body.username;
    const password= req.body.password;

        const existingUser = await userModel.findOne({ username });

        if(!existingUser){
            res.status(403).json({
                message:"Invalid credentials"
            });

            return;
        }


        const isPasswordValid = await bcrypt.compare(password , existingUser.password)


        if(!isPasswordValid){

        res.status(403).json({
             message:"Invalid credentials"

         });

         return;
         
        }

        const token = jwt.sign(
            {
                id:existingUser._id
            },JWT_PASSWORD)

        res.json(
            { 
                token
             });
    });



wss.on("connection" , handleConnection);

server.listen(3000);
