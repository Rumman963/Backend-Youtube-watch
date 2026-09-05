import { WebSocket } from "ws";

export interface Participant {
    userId: string;
    username: string;
    role: "host" | "moderator" | "participant";
    socket: WebSocket;
}

export interface Room {
    roomId: string;
    hostId: string;
    currentVideoId: string;
    playState: "playing" | "paused";
    currentTime: number;
    participants: Map<string, Participant>;
}

export const rooms = new Map<string, Room>();

export function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8);
}

export function broadcastToRoom(roomId: string, message: object, excludeUserId?: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const data = JSON.stringify(message);
    room.participants.forEach((participant) => {
        if (participant.userId !== excludeUserId) {
            participant.socket.send(data);
        }
    });
}

export function getParticipantsList(room: Room) {
    return Array.from(room.participants.values()).map(p => ({
        userId: p.userId,
        username: p.username,
        role: p.role
    }));
}