import { rooms, broadcastToRoom, getParticipantsList } from "../rooms.js";

export function handleLeaveRoom(currentRoomId: string | null, currentUserId: string | null) {
    if (!currentRoomId || !currentUserId) return;

    const room = rooms.get(currentRoomId);
    if (!room) return;

    room.participants.delete(currentUserId);

    broadcastToRoom(currentRoomId, {
        event: "user_left",
        payload: {
            userId: currentUserId,
            participants: getParticipantsList(room)
        }
    });
}