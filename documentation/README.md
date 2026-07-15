# Technical Documentation

[← Back to the project README](../README.md)

## Start here

- [Technical overview (English)](./technical-overview.md) - architecture, authoritative multiplayer model, LAN support, and verification.
- [Gameplay and economy (English)](./gameplay-and-economy.md) - core game loop, market, inflation, and session results.
- [Academic documentation hub (Romanian)](./academic/README-ro.md) - project material created for the Bachelor's thesis.

## Overview

**No-go Inflation** is a cooperative 2D economic strategy game built as a client-server application.

Players create or join a multiplayer lobby, develop individual maps, produce and collect resources, trade in a shared market, and work together to keep session-wide inflation under control.

The project was developed as a Bachelor's degree project at the Bucharest University of Economic Studies (ASE).

## System at a glance

| Component | Responsibility |
| --- | --- |
| Godot client | Interface, input handling, rendering, local configuration, and server communication |
| Node.js / TypeScript server | Authentication, lobby management, authoritative game rules, real-time synchronization, and economic calculations |
| PostgreSQL | Persistent users, sessions, maps, buildings, resources, offers, trades, and results |

The client uses REST endpoints for registration and login, then maintains a WebSocket connection for lobby events, gameplay actions, market operations, and state updates.

## System architecture

![No-go Inflation system architecture](./diagrams/en/architecture.png)

## Main features

- JWT-based registration and authentication
- Configurable server address, with `localhost` as the default
- LAN multiplayer through an IPv4 server address
- Lobby creation and joining through shareable codes
- Individual generated maps for each player
- Terrain-specific buildings, production, collection, and upgrades
- Shared player-to-player resource market
- Resource recycling for gold
- Inflation, average-price indicators, economic scores, rankings, and session results
- English and Romanian client interface

## Repository guide

| Area | Location |
| --- | --- |
| Godot client | [`client/no-go-inflation`](../client/no-go-inflation/) |
| Node.js server | [`server`](../server/) |
| Database migrations | [`server/db/migrations`](../server/db/migrations/) |
| Automated server checks | [`.github/workflows/server-ci.yaml`](../.github/workflows/server-ci.yaml) |
| Screenshots | [`screenshots/en`](./screenshots/en/) |
| Romanian screenshots | [`screenshots/ro`](./screenshots/ro/) |

## Running the project

Follow the setup instructions in the [main README](../README.md#run-locally).

The server starts on the configured host and port. The client connects to `localhost` by default; for local-network play, enter the server machine’s IPv4 address through **Server configuration** in the start menu.

## License

The source code is licensed under the [GNU General Public License v3.0](../LICENSE).

Third-party assets, themes, and fonts retain their respective licenses; see [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
