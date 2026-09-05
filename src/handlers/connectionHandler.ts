import { WebSocket } from "ws";
import { handleJoinRoom } from "./joinRoom.js";
import { handleLeaveRoom } from "./leaveRoom.js";
import { handlePlaybackEvent } from "./playbackEvents.js"

export function handleConnection(socket: WebSocket) {

    let currentUserId: string | null = null;
    let currentRoomId: string | null = null;

    socket.on("message", (raw) => {
        let data;

        try {

            data = JSON.parse(raw.toString());

        }catch (e) {
            return;
        }

        const { event, payload } = data;

        if (event === "join_room") {

            handleJoinRoom(socket, payload, (userId, roomId) => {

                currentUserId = userId;
                currentRoomId = roomId;
                
            });
        }

        if (event === "leave_room") {
            handleLeaveRoom(currentRoomId, currentUserId);
        }

        if (["play", "pause", "seek", "change_video"].includes(event)) {
            handlePlaybackEvent(event, payload, currentRoomId, currentUserId, socket);
        }
    });

    socket.on("close", () => {
        handleLeaveRoom(currentRoomId, currentUserId);
    });
}