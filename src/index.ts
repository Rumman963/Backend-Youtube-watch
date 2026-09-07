import dotenv from "dotenv";
dotenv.config();
import express from "express"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { userModel } from "./db.js";
import bcrypt from "bcrypt"
import { JWT_PASSWORD } from "./config.js";
import {WebSocketServer} from "ws";
import http from "http";
import { handleConnection } from "./handlers/connectionHandler.js"
import { verifyToken } from "./middleware.js";
import cors from "cors";

const app = express();
app.use(express.json())
app.use(cors());



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
                id:existingUser._id,
                username: existingUser.username
            },JWT_PASSWORD)

        res.json(
            { 
                token
             });
    });


    
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


wss.on("connection" , function(socket ,request){

    const user = verifyToken(request);

    if(!user){
        socket.close();
        return;
    }

    handleConnection(socket, user);

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
