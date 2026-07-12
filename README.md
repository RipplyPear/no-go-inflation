# No-go Inflation

[![Server CI](https://github.com/RipplyPear/2d-collaborative-game/actions/workflows/server-ci.yml/badge.svg?branch=polish)](https://github.com/RipplyPear/2d-collaborative-game/actions/workflows/server-ci.yml?query=branch%3Apolish)

> A cooperative multiplayer economic strategy game built as a client-server application.

No-go Inflation is a 2D multiplayer game in which players build local economies, collect resources, trade through a shared market, and try to grow without destabilizing the session economy through excessive inflation.

Built as my Bachelor's degree project at the Bucharest University of Economic Studies (ASE).

![Gameplay map](documentation/screenshots/game-start-map.png)

## Highlights

- Real-time multiplayer gameplay through WebSockets
- Authoritative Node.js server that validates all game actions
- Lobby creation and joining via a shareable code
- Individual maps generated for each player
- Resource production, collection, building upgrades, and recycling
- Shared market for player-to-player buy and sell offers
- Inflation, average prices, economic score, rankings, and end-of-session results
- JWT authentication via REST
- Local-network support: clients can select the server's IPv4 address from the game menu

## Gameplay

Players receive their own map containing fields, forests, and quarries.

- Build farms, lumber mills, and mines on the appropriate terrain.
- Collect wood, stone, and grain produced over time.
- Spend resources to build and upgrade production buildings.
- Trade resources with other players through the shared market.
- Recycle resources for gold, affecting the session's inflation.
- At the end of the session, the server calculates individual scores and the collective economic outcome.

| Lobby | Multiplayer session |
| --- | --- |
| ![Lobby with two players](documentation/screenshots/lobby-two-players.png) | ![Final results](documentation/screenshots/end-game-results.png) |

## Architecture

The application follows an authoritative client-server design:

- **Godot client**: UI, player input, and rendering of server state.
- **Node.js / TypeScript server**: authentication, lobby management, game rules, economy calculations, and WebSocket communication.
- **PostgreSQL**: persistent users, sessions, maps, resources, buildings, market offers, trades, and results.

![System architecture](documentation/diagrams/architecture.png)

## Tech stack

| Area | Technologies |
| --- | --- |
| Client | Godot 4, GDScript, `HTTPRequest`, `WebSocketPeer` |
| Server | Node.js, TypeScript, Express, `ws` |
| Database | PostgreSQL, `pg`, SQL migrations |
| Security and validation | JWT, bcrypt, Zod |
| Tooling | npm, dotenv, draw\.io |

## Run locally

### Prerequisites

- Node.js and npm
- PostgreSQL
- Godot 4.x

### 1. Configure the database

```bash
createdb no_go_inflation

cd server
psql -U postgres -d no_go_inflation -f db/migrations/01_users.sql
psql -U postgres -d no_go_inflation -f db/migrations/02_game_state_tables.sql
```

### 2. Configure and start the server

Create `server/.env`:
```
HOST=0.0.0.0
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=no_go_inflation
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=replace_with_a_secure_value
NODE_ENV=development
```
Then start the server:
```
cd server
npm install
npm run dev
```
### 3. Start the Godot client

Open `client/no-go-inflation` in Godot and run the project.

By default, the client connects to `localhost`. To play on the same local network, enter the IPv4 address printed by the server in Server Configuration - for example, `192.168.1.144` - then verify and save it.

### Documentation
- [Academic project overview (Romanian)](./documentation/academic-project-overview-ro.md)
- [Technical and functional documentation](./documentation/)
- [Database migrations](./server/db/migrations/)

### Development notes

The game includes debug-only controls for local testing and demonstrations. They are available only in debug client builds and are rejected by the server when `NODE_ENV=production`.
