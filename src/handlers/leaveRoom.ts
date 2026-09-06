import { WebSocket } from "ws";
import { rooms, broadcastToRoom, getParticipantsList } from "../rooms.js";

export function handleLeaveRoom(currentRoomId: string | null, currentUserId: string | null, socket?: WebSocket) {
    if (!currentRoomId || !currentUserId) return;

    const room = rooms.get(currentRoomId);
    if (!room) return;

    const participant = room.participants.get(currentUserId);

    if (socket && participant && participant.socket !== socket) {
        return;
    }

    room.participants.delete(currentUserId);

    broadcastToRoom(currentRoomId, {
        event: "user_left",
        payload: {
            userId: currentUserId,
            participants: getParticipantsList(room)
        }
    });
}