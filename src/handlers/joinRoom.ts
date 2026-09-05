import { WebSocket } from "ws";
import { rooms, generateRoomId, broadcastToRoom, getParticipantsList } from "../rooms.js";

export function handleJoinRoom(socket: WebSocket, payload: any, setSession: (userId: string, roomId: string) => void) {
    const { roomId, username } = payload;
    const userId = Math.random().toString(36).substring(2, 10);

    let room = roomId ? rooms.get(roomId) : undefined;
    let isNewRoom = false;

    if (!room) {
        const newRoomId = roomId || generateRoomId();
        room = {
            roomId: newRoomId,
            hostId: userId,
            currentVideoId: "",
            playState: "paused",
            currentTime: 0,
            participants: new Map()
        };
        rooms.set(newRoomId, room);
        isNewRoom = true;
    }

    const role = isNewRoom ? "host" : "participant";

    room.participants.set(userId, { userId, username, role, socket });

    setSession(userId, room.roomId);

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