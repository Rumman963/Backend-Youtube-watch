# YouTube Watch Party — Backend

Real-time backend for synchronized YouTube watch parties. Users create/join rooms via a room code, one becomes Host, others join as Participants, and playback (play/pause/seek/change video) stays in sync for everyone in the room.

**Live URL:** https://backend-youtube-watch.onrender.com

## Tech Stack

Express (TypeScript), `ws` (raw WebSocket), MongoDB, JWT, bcrypt

## Project Structure

```
src/
├── handlers/
│   ├── connectionHandler.ts   # Routes incoming WS messages
│   ├── joinRoom.ts            # join_room logic
│   ├── leaveRoom.ts           # leave/disconnect cleanup
│   ├── playbackEvents.ts      # play / pause / seek / change_video
│   └── roleManagement.ts      # assign_role, remove_participant
├── config.ts
├── db.ts                      # Mongoose connection + User schema
├── index.ts                   # Express app, HTTP + WS server, signup/signin
├── middleware.ts               # Verifies JWT from ?token= on WS connect
└── rooms.ts                   # In-memory room/participant state
```

Room state lives in memory (`rooms.ts`), not MongoDB. MongoDB only stores user accounts. Room state resets on server restart.

## Running locally

```bash
npm install
npm run dev
```

Requires a `.env` file:
```
MONGO_URL=your_mongodb_connection_string
JWT_PASSWORD=your_jwt_secret
```

## Event Reference

| Event (client → server) | Who can send it | Broadcasts |
|---|---|---|
| `join_room` | Anyone with a valid token | `room_joined` (sender), `user_joined` (room) |
| `play` / `pause` / `seek` / `change_video` | Host, Moderator | `sync_state` (room) |
| `assign_role` | Host only | `role_assigned` (room) |
| `remove_participant` | Host only | `participant_removed` (room), `removed_from_room` (removed user) |

| Event (server → client) | Meaning |
|---|---|
| `room_joined` | Sent after successfully joining/creating a room |
| `user_joined` | A new participant joined |
| `sync_state` | Playback state changed |
| `role_assigned` | A participant's role changed |
| `participant_removed` | Someone was removed |
| `removed_from_room` | You were removed |
| `error` | Action rejected |

## Test Evidence

Each test below was run manually — HTTP routes via Postman, WebSocket events via Postman/Hoppscotch.

### Test 1 — Signup succeeds for a new user
`POST /signup` with a new username returns `200 OK`.
![Signup success](./screenshots/Signup1.png)

### Test 2 — Signup rejects a duplicate username
Submitting the same username again is rejected instead of creating a duplicate account.
![Duplicate user rejected](./screenshots/Signup2.png)

### Test 3 — Signin succeeds and returns a JWT
`POST /signin` with correct credentials returns a signed token.
![Signin success](./screenshots/Signin.png)

### Test 4 — Signin rejects wrong credentials
An incorrect password is rejected with a 403, no token issued.
![Invalid credentials rejected](./screenshots/Invalidcredentials.png)

### Test 5 — WebSocket connection is rejected without a token
Connecting to the WebSocket with no `?token=` query param closes the connection immediately.
![Rejected without token](./screenshots/wsnotoken.png)

### Test 6 — WebSocket connection is accepted with a valid token
The same connection attempt, this time with a valid JWT, stays open.
![Accepted with valid token](./screenshots/wsToken.png)

### Test 7 — First user to join becomes Host
Sending `join_room` with no `roomId` creates a new room and assigns the sender the `host` role.
![Host creates room](./screenshots/hostroom.png)

### Test 8 — Second user signs up
A second account is created to test multi-user room behavior.
![Second user signup](./screenshots/SecondUserSignup.png)

### Test 9 — Second user signs in
JWT issued for the second account.
![Second user signin](./screenshots/SecondUserSignin.png)

### Test 10 — Second user joins the existing room as Participant, Host is notified
Sending `join_room` with the Host's `roomId` joins as `participant`. The Host's connection receives a `user_joined` broadcast in real time without polling.
![Second user joins as participant, host notified](./screenshots/SecondUserParticipantJoinroom.png)

### Test 11 — A Participant is rejected when trying to control playback
The Participant sends `play` and receives an `error` event — permission check enforced server-side.
![Participant rejected](./screenshots/SeconduserPlay.png)

### Test 12 — The Host successfully controls playback
The Host sends `play`; both connections receive a `sync_state` broadcast with the updated state.
![Host play succeeds](./screenshots/HostPlaying.png)

### Test 13 — The Host promotes the Participant to Moderator
`assign_role` broadcasts `role_assigned` to the whole room with the updated participant list.
![Host assigns moderator role](./screenshots/RoleAssignedbyHosttoSeconduser.png)

### Test 14 — The newly-promoted Moderator can now control playback
The same user who was rejected in Test 11 now successfully sends `pause` after being promoted.
![Newly-promoted moderator pauses successfully](./screenshots/HostPaused.png)

### Test 15 — The Host removes a participant
`remove_participant` notifies the removed user directly and broadcasts the updated participant list to the rest of the room.
![Host removes participant](./screenshots/HostremoveSecondUser.png)

### Test 16 — A non-Host is rejected when trying to remove a participant
Permission check enforced the same way as playback controls and role assignment.
![Non-host removal attempt rejected](./screenshots/ParticipantremovingParticipANTs.png)


## Bugs Found & Fixed During Testing

While testing multi-user scenarios beyond the basic flow, a few edge cases surfaced and were fixed:

- **Duplicate participants on re-join** — if a client sent `join_room` twice for a room it had already joined, the backend generated a new random `userId` each time, creating duplicate entries for the same person. Fixed by using the authenticated user's JWT-derived id as their persistent identity instead of a random per-connection string.
- **Phantom duplicate rooms** — joining with a `roomId` that no longer existed silently created a brand new room under that same code instead of returning an error, which could split two users into separate rooms that happened to share a code. Fixed by rejecting unknown room codes with an explicit `error` event.
- **Role reset on page refresh** — refreshing a client's page closed its old socket, which could delete that participant's entry before their reconnect's `join_room` message arrived, resetting a Host back to Participant. Fixed by only removing participants on an explicit `leave_room` event, not on socket close.



## Deployment

Deployed on Render at https://backend-youtube-watch.onrender.com. `MONGO_URL` and `JWT_PASSWORD` set as environment variables in the Render dashboard.

A `/health` endpoint is pinged every 10 minutes via a cron job to prevent Render's free-tier cold-start delay.

**Live frontend:** https://youtube-watch-fe.vercel.app/