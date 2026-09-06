import { WebSocket } from "ws";
import { rooms, generateRoomId, broadcastToRoom, getParticipantsList } from "../rooms.js";

export function handleJoinRoom(socket: WebSocket, payload: any, setSession: (userId: string, roomId: string) => void) {
    const { roomId, username, userId } = payload;

    let room = roomId ? rooms.get(roomId) : undefined;

    if (roomId && !room) {
        socket.send(JSON.stringify({
            event: "error",
            payload: { message: "Room not found. It may have ended." }
        }));
        return;
    }

    let isNewRoom = false;

    if (!room) {
        const newRoomId = generateRoomId();
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


    const existingParticipant = room.participants.get(userId);

    let role: "host" | "moderator" | "participant";

    if (existingParticipant) {
        // Returning user — keep whatever role they already had
        role = existingParticipant.role;
    } else if (isNewRoom) {
        role = "host";
    } else {
        role = "participant";
    }

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