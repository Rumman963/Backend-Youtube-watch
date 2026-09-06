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

## Auth

### `POST /signup`
```json
{ "username": "rumman", "password": "test1234" }
```
![Signup success](./screenshots/Signup1.png)
![Duplicate user rejected](./screenshots/Signup2.png)

### `POST /signin`
```json
{ "username": "rumman", "password": "test1234" }
```
Returns `{ "token": "..." }`

![Signin success](./screenshots/Signin.png)
![Invalid credentials rejected](./screenshots/Invalidcredentials.png)

## WebSocket

Connect with the JWT as a query param:
```
ws://localhost:3000?token=<JWT>
```
No valid token, no connection.

![Rejected without token](./screenshots/wsnotoken.png)
![Accepted with valid token](./screenshots/wsToken.png)

Every message follows:
```json
{ "event": "event_name", "payload": { ... } }
```

### `join_room`

No `roomId` in payload → new room created, sender becomes Host. Existing `roomId` → sender joins as Participant.

![Host creates room](./screenshots/hostroom.png)
![Second user signup](./screenshots/SecondUserSignup.png)
![Second user signin](./screenshots/SecondUserSignin.png)
![Second user joins as participant, host notified](./screenshots/SecondUserParticipantJoinroom.png)

### `play` / `pause` / `seek` / `change_video`

Host and Moderator only. Broadcasts `sync_state` to the room.

![Participant rejected](./screenshots/SeconduserPlay.png)
![Host play succeeds](./screenshots/HostPlaying.png)

### `assign_role` (Host only)

![Host assigns moderator role](./screenshots/RoleAssignedbyHosttoSeconduser.png)
![Newly-promoted moderator pauses successfully](./screenshots/HostPaused.png)

### `remove_participant` (Host only)

![Host removes participant](./screenshots/HostremoveSecondUser.png)
![Non-host removal attempt rejected](./screenshots/ParticipantremovingParticipANTs.png)

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

## Test Coverage

| # | Scenario | Result |
|---|---|---|
| 1 | Signup — new user | ✅ |
| 2 | Signup — duplicate username | ✅ Rejected |
| 3 | Signin — correct credentials | ✅ JWT returned |
| 4 | Signin — wrong password | ✅ Rejected |
| 5 | WebSocket connect — no token | ✅ Rejected |
| 6 | WebSocket connect — valid token | ✅ Accepted |
| 7 | `join_room` — first user → Host | ✅ |
| 8-9 | Signup/signin — second user | ✅ |
| 10 | `join_room` — second user → Participant | ✅ Host notified |
| 11 | `play` as Participant | ✅ Rejected |
| 12 | `play` as Host | ✅ Broadcast |
| 13 | `assign_role` — Host promotes Participant to Moderator | ✅ Broadcast |
| 14 | `pause` as newly-promoted Moderator | ✅ Broadcast |
| 15 | `remove_participant` as Host | ✅ Both parties notified |
| 16 | `remove_participant` as non-Host | ✅ Rejected |

Tested manually via Postman (HTTP) and Hoppscotch (WebSocket).

## Deployment

Deployed on Render at https://backend-youtube-watch.onrender.com. `MONGO_URL` and `JWT_PASSWORD` set as environment variables in the Render dashboard.