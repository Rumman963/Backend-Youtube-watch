import { rooms, broadcastToRoom, getParticipantsList } from "../rooms.js";

export function handleAssignRole(
    payload: any,
    currentRoomId: string | null,
    currentUserId: string | null,
    socket: any
) {
    if (!currentRoomId || !currentUserId) return;

    const room = rooms.get(currentRoomId);
    if (!room) return;

    const requester = room.participants.get(currentUserId);
    if (!requester || requester.role !== "host") {
        socket.send(JSON.stringify({
            event: "error",
            payload: { message: "Only the host can assign roles" }
        }));
        return;
    }

    const { userId, role } = payload;
    const target = room.participants.get(userId);
    if (!target) return;

    target.role = role;

    broadcastToRoom(currentRoomId, {
        event: "role_assigned",
        payload: {
            userId,
            username: target.username,
            role,
            participants: getParticipantsList(room)
        }
    });
}

export function handleRemoveParticipant(
    payload: any,
    currentRoomId: string | null,
    currentUserId: string | null,
    socket: any
) {
    if (!currentRoomId || !currentUserId) return;

    const room = rooms.get(currentRoomId);
    if (!room) return;

    const requester = room.participants.get(currentUserId);
    if (!requester || requester.role !== "host") {
        socket.send(JSON.stringify({
            event: "error",
            payload: { message: "Only the host can remove participants" }
        }));
        return;
    }

    const { userId } = payload;
    const target = room.participants.get(userId);
    if (!target) return;

    room.participants.delete(userId);

    target.socket.send(JSON.stringify({
        event: "removed_from_room",
        payload: { message: "You were removed from the room" }
    }));

    broadcastToRoom(currentRoomId, {
        event: "participant_removed",
        payload: {
            userId,
            participants: getParticipantsList(room)
        }
    });
}