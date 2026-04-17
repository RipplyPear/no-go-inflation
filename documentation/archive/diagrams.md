# Arhitectura

``` mermaid
flowchart LR
    subgraph Client["Client de joc (Godot)"]
        UI["UI / HUD"]
        GameLogic["Gameplay Logic"]
        NetClient["WebSocket Client"]
    end

    subgraph Server["Server aplicație (Node.js + TypeScript)"]
        WS["WebSocket Server"]
        GameServerLogic["Game & Economy Logic"]
        Auth["Session / Player Management"]
    end

    subgraph Database["Persistență date"]
        DB["PostgreSQL"]
    end

    UI --> GameLogic
    GameLogic --> NetClient

    NetClient <-->|"mesaje real-time"| WS

    WS --> GameServerLogic
    GameServerLogic --> Auth
    GameServerLogic <-->|"queries"| DB

```

# Use Cases

``` mermaid
flowchart LR
    Player["Player"]

    subgraph GameSystem["Sistem joc economic"]
        UC1["Join game session"]
        UC2["Manage economy"]
        UC3["Produce resources"]
        UC4["Trade with other players"]
        UC5["Adjust prices / policies"]
        UC6["Monitor inflation indicators"]
        UC7["Trigger selfish ending"]
    end

    Player --> UC1
    Player --> UC2
    Player --> UC3
    Player --> UC4
    Player --> UC5
    Player --> UC6
    Player --> UC7

```

# Activity Diagram

***

``` mermaid
flowchart TD
    Start([Start game day])

    PlayerAction["Players make economic decisions"]
    SendToServer["Send actions to server"]
    Validate["Server validates actions"]
    ApplyEconomy["Apply economy & inflation rules"]
    Broadcast["Broadcast updated state to players"]

    CheckEnd{"End game condition?"}
    NextDay["Advance to next game day"]
    EndGame([End game])

    Start --> PlayerAction
    PlayerAction --> SendToServer
    SendToServer --> Validate
    Validate --> ApplyEconomy
    ApplyEconomy --> Broadcast
    Broadcast --> CheckEnd

    CheckEnd -- No --> NextDay
    NextDay --> PlayerAction

    CheckEnd -- Yes --> EndGame

```

# Sequence Diagram - Trade

***

``` mermaid
sequenceDiagram
    participant PlayerA as Player A (Client)
    participant PlayerB as Player B (Client)
    participant Server as Game Server
    participant DB as PostgreSQL

    PlayerA->>Server: Send trade offer
    Server->>DB: Validate resources & balance
    DB-->>Server: Validation result

    alt Trade valid
        Server->>PlayerB: Forward trade offer
        PlayerB->>Server: Accept trade
        Server->>DB: Persist transaction
        Server->>PlayerA: Trade confirmed
        Server->>PlayerB: Trade confirmed
    else Trade invalid
        Server->>PlayerA: Trade rejected
    end

```

# ERD

***

``` mermaid
erDiagram
    PLAYER {
        uuid id PK
        string username
        float balance
        float inflation_score
    }

    GAME_SESSION {
        uuid id PK
        datetime start_time
        datetime end_time
        string status
    }

    RESOURCE {
        uuid id PK
        string name
        float base_price
    }

    ECONOMY_STATE {
        uuid id PK
        float global_inflation
        datetime timestamp
    }

    TRADE {
        uuid id PK
        float amount
        float price
        datetime created_at
    }

    PLAYER ||--o{ TRADE : initiates
    PLAYER ||--o{ TRADE : participates
    GAME_SESSION ||--o{ PLAYER : contains
    GAME_SESSION ||--o{ ECONOMY_STATE : tracks
    TRADE }o--|| RESOURCE : involves

```
