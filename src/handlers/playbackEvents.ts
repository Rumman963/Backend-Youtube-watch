import { rooms, broadcastToRoom } from "../rooms.js";

export function handlePlaybackEvent(
    event: string,
    payload: any,
    currentRoomId: string | null,
    currentUserId: string | null,
    socket: any
) 

{
    if (!currentRoomId || !currentUserId) return;

    const room = rooms.get(currentRoomId);
    if (!room) return;

    const participant = room.participants.get(currentUserId);
    if (!participant) return;

    if (participant.role !== "host" && participant.role !== "moderator") {
        socket.send(JSON.stringify({
            event: "error",
            payload: { message: "You don't have permission to control playback" }
        }));
        return;
    }

    if (event === "play") room.playState = "playing";
    if (event === "pause") room.playState = "paused";
    if (event === "seek") room.currentTime = payload.time;
    if (event === "change_video") {
        room.currentVideoId = payload.videoId;
        room.currentTime = 0;
        room.playState = "paused";
    }

    broadcastToRoom(currentRoomId, {
        event: "sync_state",
        payload: {
            playState: room.playState,
            currentTime: room.currentTime,
            videoId: room.currentVideoId
        }
    });
}