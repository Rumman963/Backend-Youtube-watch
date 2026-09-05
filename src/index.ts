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
import { rooms, generateRoomId, broadcastToRoom, getParticipantsList } from "./rooms.js";


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



wss.on("connection" , function(socket){

    let currentUserId: string | null = null;
    let currentRoomId: string | null = null;


    socket.on("message", (raw)=>{

        let data;
        try{
            data = JSON.parse(raw.toString());
        }catch(e){
            return;

        }

         const { event, payload } = data;


         if(event === "join_room"){
            const {roomId , username} = payload;
            const userId = Math.random().toString(36).substring(2,10);

            let room = roomId ? rooms.get(roomId): undefined;
            let isNewRoom = false;
            
            if(!room){
                const newRoomId = roomId  || generateRoomId();
                room={
                    roomId: newRoomId,
                    hostId:userId,
                    currentVideoId:"",
                    playState:"paused",
                    currentTime:0,
                    participants:new Map()

                };

                rooms.set(newRoomId , room);
                isNewRoom = true;
            }

            const role = isNewRoom ? "host" : "participant";

             room.participants.set(userId, 
                { userId, 
                  username, 
                  role, 
                  socket 
                });

               currentUserId = userId;
               currentRoomId = room.roomId;

               socket.send(JSON.stringify({
                event: "room_joined",
                payload: {
                    roomId: room.roomId,
                    userId,
                    role,
                    participants: getParticipantsList(room)
                }
            }));



            broadcastToRoom(room.roomId, {
                event: "user_joined",
                payload: {
                    username,
                    userId,
                    role,
                    participants: getParticipantsList(room)
                }
            }, userId);

         }
        
         if (event === "leave_room") {

            if (currentRoomId && currentUserId) {

                const room = rooms.get(currentRoomId);

                if (room) {

                    room.participants.delete(currentUserId);

                    broadcastToRoom(currentRoomId, {

                        event: "user_left",

                        payload: {

                            userId: currentUserId,
                            participants: getParticipantsList(room)
                            
                        }
                    });
                }
            }
        }
    }) 


    socket.on("close", () => {
        console.log("Client disconnected");
    });
})    



server.listen(3000);
