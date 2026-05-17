---
title: Arhitectura sistemului
status: draft
version: 0.1
lastUpdated: 17-05-2026
description: Document tehnic pentru arhitectura aplicației No-go Inflation
---

# Arhitectura sistemului

## 1. Scopul documentului

Acest document descrie arhitectura tehnică a aplicației **No-go Inflation**, cu accent pe relația dintre clientul Godot, serverul aplicației, comunicarea realtime și baza de date.

Documentul are rolul de a clarifica:

- componentele principale ale sistemului;
- responsabilitățile fiecărei componente;
- modul de comunicare dintre client și server;
- modul de persistare a datelor;
- structura generală a fluxurilor de autentificare, sesiune și tranzacționare;
- deciziile tehnice relevante pentru implementarea proiectului.

Arhitectura este gândită pentru un proiect de licență, deci urmărește claritate, stabilitate și demonstrabilitate, fără a introduce complexitate inutilă.

---

## 2. Vedere generală asupra sistemului

Sistemul este format din trei componente principale:

1. **Clientul de joc**, implementat în Godot;
2. **Serverul aplicației**, implementat în Node.js + TypeScript;
3. **Baza de date**, implementată în PostgreSQL.

Clientul este responsabil pentru interfață, input și afișarea stării jocului. Serverul este componenta autoritativă care validează acțiunile, procesează logica de joc și sincronizează participanții. Baza de date persistă informațiile importante, precum utilizatorii, sesiunile, participanții, tranzacțiile și rezultatele finale.

```mermaid
flowchart LR
    subgraph Client["Client Godot"]
        UI["UI / HUD"]
        Input["Input jucător"]
        LocalView["Afișare hartă, resurse și piață"]
        WSClient["WebSocket Client"]
        RESTClient["REST Client"]
    end

    subgraph Server["Server Node.js + TypeScript"]
        RESTAPI["REST API"]
        WSGateway["WebSocket Gateway"]
        Auth["Auth Module"]
        Session["Lobby & Session Module"]
        GameEngine["Game Engine"]
        Market["Market / Trading Module"]
        Economy["Economy & Inflation Module"]
        Persistence["Persistence Layer"]
    end

    subgraph Database["PostgreSQL"]
        Users["users"]
        Sessions["game_sessions"]
        State["state snapshots"]
        Trades["trade_transactions"]
        Results["player_session_results"]
    end

    UI --> Input
    Input --> RESTClient
    Input --> WSClient
    LocalView --> UI

    RESTClient <-->|register / login / bootstrap| RESTAPI
    WSClient <-->|gameplay realtime| WSGateway

    RESTAPI --> Auth
    RESTAPI --> Session

    WSGateway --> Session
    WSGateway --> GameEngine
    GameEngine --> Market
    GameEngine --> Economy

    Auth --> Persistence
    Session --> Persistence
    Market --> Persistence
    Economy --> Persistence
    Persistence --> Database
```

---

## 3. Principii arhitecturale

### 3.1 Server autoritativ

Serverul reprezintă singura sursă validă pentru starea jocului. Clientul nu modifică direct starea economică, resursele, clădirile sau piața. Clientul trimite doar intenții, iar serverul decide dacă acestea sunt valide.

Exemple de intenții trimise de client:

- construire clădire;
- upgrade clădire;
- colectare resurse;
- creare ofertă;
- acceptare ofertă;
- reciclare resurse;
- părăsire sesiune.

Serverul verifică regulile jocului, actualizează starea validă și trimite rezultatul către client.

### 3.2 Client subțire

Clientul Godot are rol de prezentare și interacțiune. El afișează harta, resursele, clădirile, piața și indicatorii economici, dar nu decide validitatea acțiunilor importante.

Clientul poate păstra temporar informații locale doar pentru interfață, animații sau feedback vizual. Starea relevantă de gameplay trebuie confirmată de server.

### 3.3 Backend modular

Serverul este implementat ca un **monolit modular**. Aplicația rulează ca un singur backend, dar codul este organizat pe module clare.

Această alegere evită complexitatea microserviciilor, dar păstrează separarea responsabilităților.

Modulele principale sunt:

- `auth` - înregistrare, autentificare, token-uri;
- `lobby/session` - lobby-uri, participanți, start sesiune;
- `websocket` - comunicare realtime;
- `game` - timp, hartă, clădiri, producție, state runtime;
- `market` - oferte, acceptări, tranzacții;
- `economy` - inflație, prețuri medii, indicatori;
- `persistence` - acces la baza de date.

### 3.4 Separarea între runtime state și date persistente

Starea activă a jocului este menținută în principal în memoria serverului, pentru a permite procesare rapidă și sincronizare realtime.

Baza de date nu salvează fiecare stare intermediară a jocului, dar păstrează datele importante pentru autentificare, audit, reconectare, istoric și rezultate finale.

Pentru cerința de salvare a state-ului jocului curent, sistemul poate păstra snapshot-uri minime ale stării active, fără a transforma baza de date în motorul principal al simulării.

---

## 4. Componentele sistemului

## 4.1 Client Godot

Clientul Godot este aplicația cu care interacționează jucătorul. Acesta conține ecranele de autentificare, meniul principal, lobby-ul, harta de joc, HUD-ul și interfața pieței.

Responsabilități principale:

- afișarea interfeței;
- captarea inputului de la jucător;
- trimiterea intențiilor către server;
- afișarea stării primite de la server;
- gestionarea feedback-ului vizual local;
- menținerea conexiunii WebSocket în timpul sesiunii.

Clientul comunică cu serverul în două moduri:

- prin REST pentru register/login;
- prin WebSocket pentru gameplay și trading.

---

## 4.2 REST API

REST API-ul este folosit pentru operații clasice, rare și bine delimitate.

Operații gestionate prin REST:

- înregistrare utilizator;
- autentificare utilizator;
- verificare token;
- obținerea unor date inițiale de bootstrap, dacă este necesar.

REST este potrivit pentru aceste fluxuri deoarece nu necesită comunicare continuă în timp real.

---

## 4.3 WebSocket Gateway

WebSocket Gateway-ul gestionează comunicarea realtime dintre client și server în timpul unei sesiuni de joc.

Prin WebSocket se transmit:

- acțiuni de gameplay;
- actualizări de state;
- mesaje legate de piață;
- actualizări de timp;
- notificări despre tranzacții;
- mesaje de eroare;
- resincronizări după reconectare.

WebSocket-ul este canalul principal pentru gameplay deoarece acțiunile jucătorilor și schimbările economice trebuie propagate rapid către participanți.

---

## 4.4 Game Engine

Game Engine-ul reprezintă modulul server-side care aplică regulile principale ale jocului.

Responsabilități:

- menținerea timpului in-game;
- gestionarea sesiunilor active;
- gestionarea hărților jucătorilor;
- validarea construirii și upgrade-urilor;
- procesarea producției;
- procesarea colectării resurselor;
- actualizarea stării runtime;
- declanșarea finalului de sesiune.

Game Engine-ul nu este un motor grafic. Motorul grafic este Godot. În acest context, Game Engine-ul este modulul backend care procesează regulile jocului.

---

## 4.5 Market / Trading Module

Market Module-ul gestionează piața și tranzacțiile dintre participanți.

Responsabilități:

- crearea ofertelor de cumpărare;
- crearea ofertelor de vânzare;
- listarea ofertelor active;
- validarea acceptării unei oferte;
- actualizarea resurselor și a galbenilor;
- salvarea tranzacțiilor finalizate;
- notificarea participanților după tranzacție.

Piața funcționează ca un board global de oferte active. Ofertele pot fi create de jucători sau, în funcție de implementare, de boți.

---

## 4.6 Economy & Inflation Module

Economy Module-ul calculează indicatorii economici ai sesiunii.

Responsabilități:

- calcularea inflației;
- actualizarea prețurilor medii de referință;
- evaluarea presiunii cerere/ofertă;
- evaluarea impactului tranzacțiilor la suprapreț;
- evaluarea impactului reciclării;
- generarea snapshot-urilor economice relevante.

Acest modul poate fi apelat periodic, pe baza sistemului de tick-uri, dar poate reacționa și la evenimente importante, precum tranzacții sau reciclări.

---

## 4.7 Persistence Layer

Persistence Layer-ul intermediază accesul la baza de date.

Responsabilități:

- salvarea utilizatorilor;
- salvarea sesiunilor;
- salvarea participanților;
- salvarea tranzacțiilor;
- salvarea rezultatelor finale;
- salvarea snapshot-urilor minime ale stării curente;
- citirea datelor necesare pentru reconectare sau audit.

Acest strat izolează restul aplicației de detaliile SQL și permite păstrarea unei structuri mai clare în backend.

---

## 5. Comunicarea dintre client și server

Comunicarea este împărțită în două categorii:

| Tip comunicare | Tehnologie | Folosită pentru |
|---|---|---|
| Request / response | REST | Register, login, bootstrap |
| Realtime | WebSocket | Gameplay, trading, sincronizare state |

Această separare permite păstrarea unui model simplu: operațiile administrative folosesc REST, iar sesiunea activă folosește WebSocket.

---

## 6. Flux Register / Login

Fluxul de autentificare este realizat prin REST.

```mermaid
sequenceDiagram
    participant Player as Jucător
    participant Godot as Client Godot
    participant API as REST API
    participant Auth as Auth Module
    participant DB as PostgreSQL

    Player->>Godot: Completează formularul
    Godot->>API: POST /auth/register sau POST /auth/login
    API->>Auth: Validează datele
    Auth->>DB: Citește / salvează utilizator
    DB-->>Auth: Rezultat
    Auth-->>API: Token sau eroare
    API-->>Godot: Răspuns autentificare
    Godot-->>Player: Acces la meniul principal
```

După autentificare, clientul păstrează token-ul primit și îl folosește pentru operațiile următoare, inclusiv pentru inițializarea conexiunii WebSocket.

---

## 7. Flux WebSocket pentru sesiune

După autentificare, clientul se conectează la server prin WebSocket. La conectare, token-ul este trimis către server pentru validarea identității.

```mermaid
sequenceDiagram
    participant Godot as Client Godot
    participant WS as WebSocket Gateway
    participant Auth as Auth Module
    participant Session as Session Module
    participant Game as Game Engine

    Godot->>WS: Connect(token)
    WS->>Auth: Validează token
    Auth-->>WS: Token valid
    WS->>Session: Atașează conexiunea la utilizator
    Session-->>WS: Stare lobby / sesiune
    WS-->>Godot: SESSION_STATE
    Godot->>WS: PLAYER_ACTION
    WS->>Game: Procesează acțiunea
    Game-->>WS: Stare actualizată
    WS-->>Godot: STATE_UPDATE
```

---

## 8. Flux trading

Fluxul de trading este gestionat prin WebSocket, deoarece afectează starea runtime a sesiunii și trebuie comunicat rapid participanților.

```mermaid
sequenceDiagram
    participant Seller as Client vânzător
    participant Buyer as Client cumpărător
    participant WS as WebSocket Gateway
    participant Market as Market Module
    participant Game as Game Engine
    participant DB as PostgreSQL

    Seller->>WS: CREATE_OFFER
    WS->>Market: Validează și creează oferta
    Market->>Game: Verifică resurse / stare sesiune
    Game-->>Market: Validare OK
    Market-->>WS: Oferta creată
    WS-->>Seller: OFFER_CREATED
    WS-->>Buyer: MARKET_UPDATED

    Buyer->>WS: ACCEPT_OFFER
    WS->>Market: Procesează acceptarea
    Market->>Game: Verifică resurse și galbeni
    Game-->>Market: Validare OK
    Market->>Game: Transferă resurse și galbeni
    Market->>DB: Salvează TradeTransaction
    DB-->>Market: Confirmare salvare
    Market-->>WS: Tranzacție finalizată
    WS-->>Seller: TRADE_COMPLETED
    WS-->>Buyer: TRADE_COMPLETED
```

---

## 9. Persistența datelor

Sistemul folosește PostgreSQL pentru date persistente și pentru snapshot-uri minime ale stării curente.

### 9.1 Date persistente principale

Datele persistente principale sunt:

- utilizatorii;
- sesiunile de joc;
- participanții la sesiuni;
- tranzacțiile finalizate;
- rezultatele finale;
- snapshot-uri economice relevante.

### 9.2 Runtime state

Runtime state-ul este starea activă a unei sesiuni aflate în desfășurare. Aceasta este menținută în principal în memoria serverului.

Include:

- timpul curent al sesiunii;
- resursele curente ale jucătorilor;
- clădirile active;
- ofertele active;
- inflația curentă;
- prețurile medii curente;
- statusul participanților conectați.

### 9.3 Snapshot minim al stării curente

Pentru a permite reconectare, debugging și demonstrarea salvării state-ului curent, serverul poate salva periodic sau la evenimente importante snapshot-uri minime.

Aceste snapshot-uri nu înlocuiesc starea runtime din memorie, ci oferă o copie persistentă simplificată.

Exemple de evenimente care pot declanșa salvarea unui snapshot:

- start sesiune;
- creare / acceptare tranzacție;
- modificare importantă de resurse;
- recalculare inflație;
- deconectare jucător;
- final sesiune.

---

## 10. Tabele propuse

Pentru implementarea minimă, sunt propuse următoarele tabele:

| Tabel | Rol |
|---|---|
| `users` | Conturi de utilizator și date de autentificare |
| `game_sessions` | Sesiuni de joc create sau finalizate |
| `session_participants` | Legătura dintre utilizatori și sesiuni |
| `player_states` | Snapshot minim al stării curente a unui participant |
| `player_resources` | Resursele curente ale unui participant |
| `player_buildings` | Clădirile construite pe harta unui participant |
| `market_offers` | Oferte active sau recent închise |
| `trade_transactions` | Tranzacții finalizate |
| `economy_snapshots` | Inflație și prețuri medii la anumite momente |
| `player_session_results` | Rezultatele finale individuale |

În implementarea de bază, nu este obligatoriu ca fiecare acțiune minoră să fie salvată. Se persistă doar datele relevante pentru funcționare, audit minim și evaluarea finală.

---

## 11. Model ERD propus

```mermaid
erDiagram
    USERS {
        uuid id PK
        string username
        string email
        string password_hash
        datetime created_at
    }

    GAME_SESSIONS {
        uuid id PK
        string status
        datetime started_at
        datetime ended_at
        int final_inflation
        string collective_result
    }

    SESSION_PARTICIPANTS {
        uuid id PK
        uuid session_id FK
        uuid user_id FK
        string role
        bool is_connected
        datetime joined_at
    }

    PLAYER_STATES {
        uuid id PK
        uuid session_id FK
        uuid participant_id FK
        int galbeni
        int economic_score
        datetime updated_at
    }

    PLAYER_RESOURCES {
        uuid id PK
        uuid participant_id FK
        string resource_type
        int amount
        datetime updated_at
    }

    PLAYER_BUILDINGS {
        uuid id PK
        uuid participant_id FK
        int tile_x
        int tile_y
        string building_type
        int level
        int stored_amount
    }

    MARKET_OFFERS {
        uuid id PK
        uuid session_id FK
        uuid creator_participant_id FK
        string offer_type
        string resource_type
        int min_quantity
        int max_quantity
        int remaining_quantity
        int price_per_unit
        string status
        datetime expires_at
        datetime created_at
    }

    TRADE_TRANSACTIONS {
        uuid id PK
        uuid session_id FK
        uuid seller_participant_id FK
        uuid buyer_participant_id FK
        string resource_type
        int quantity
        int price_per_unit
        int total_price
        datetime created_at
    }

    ECONOMY_SNAPSHOTS {
        uuid id PK
        uuid session_id FK
        int inflation
        int wood_avg_price
        int stone_avg_price
        int grain_avg_price
        datetime created_at
    }

    PLAYER_SESSION_RESULTS {
        uuid id PK
        uuid session_id FK
        uuid participant_id FK
        int economic_score
        string rank
        int trades_count
        int total_traded_value
        int total_recycled_amount
    }

    USERS ||--o{ SESSION_PARTICIPANTS : participates
    GAME_SESSIONS ||--o{ SESSION_PARTICIPANTS : contains
    SESSION_PARTICIPANTS ||--o{ PLAYER_STATES : has
    SESSION_PARTICIPANTS ||--o{ PLAYER_RESOURCES : owns
    SESSION_PARTICIPANTS ||--o{ PLAYER_BUILDINGS : owns
    GAME_SESSIONS ||--o{ MARKET_OFFERS : contains
    GAME_SESSIONS ||--o{ TRADE_TRANSACTIONS : contains
    GAME_SESSIONS ||--o{ ECONOMY_SNAPSHOTS : tracks
    GAME_SESSIONS ||--o{ PLAYER_SESSION_RESULTS : produces
    SESSION_PARTICIPANTS ||--o{ PLAYER_SESSION_RESULTS : receives
```

---

## 12. Tipuri principale de mesaje WebSocket

### 12.1 Mesaje trimise de client

| Tip mesaj | Scop |
|---|---|
| `JOIN_SESSION` | Intrarea într-o sesiune activă |
| `BUILD_REQUEST` | Cerere de construire |
| `UPGRADE_REQUEST` | Cerere de upgrade |
| `COLLECT_REQUEST` | Cerere de colectare resurse |
| `CREATE_OFFER` | Crearea unei oferte de piață |
| `ACCEPT_OFFER` | Acceptarea unei oferte |
| `REFRESH_MARKET` | Cerere de actualizare a pieței |
| `LEAVE_SESSION` | Părăsirea sesiunii |

### 12.2 Mesaje trimise de server

| Tip mesaj | Scop |
|---|---|
| `SESSION_STATE` | Starea completă sau parțială a sesiunii |
| `PLAYER_STATE_UPDATED` | Actualizarea resurselor / clădirilor unui jucător |
| `MARKET_STATE` | Lista ofertelor active și indicatorii pieței |
| `OFFER_CREATED` | Confirmarea creării unei oferte |
| `TRADE_COMPLETED` | Confirmarea unei tranzacții finalizate |
| `ECONOMY_UPDATED` | Actualizarea inflației și a prețurilor medii |
| `ERROR` | Eroare de validare sau procesare |

---

## 13. Exemplu de mesaj WebSocket

### 13.1 Creare ofertă

```json
{
  "type": "CREATE_OFFER",
  "payload": {
    "sessionId": "session-id",
    "offerType": "sell",
    "resourceType": "wood",
    "minQuantity": 10,
    "maxQuantity": 50,
    "pricePerUnit": 3
  }
}
```

### 13.2 Răspuns după creare ofertă

```json
{
  "type": "OFFER_CREATED",
  "payload": {
    "offerId": "offer-id",
    "status": "active"
  }
}
```

### 13.3 Acceptare ofertă

```json
{
  "type": "ACCEPT_OFFER",
  "payload": {
    "sessionId": "session-id",
    "offerId": "offer-id",
    "quantity": 20
  }
}
```

### 13.4 Confirmare tranzacție

```json
{
  "type": "TRADE_COMPLETED",
  "payload": {
    "transactionId": "transaction-id",
    "resourceType": "wood",
    "quantity": 20,
    "pricePerUnit": 3,
    "totalPrice": 60
  }
}
```

---

## 14. Decizii arhitecturale

| Decizie | Alegere |
|---|---|
| Tip backend | Monolit modular |
| Client | Godot |
| Server | Node.js + TypeScript |
| Bază de date | PostgreSQL |
| Autentificare | REST + token |
| Gameplay realtime | WebSocket |
| Autoritate joc | Server autoritativ |
| State activ | În memoria serverului |
| State salvat | Snapshot minim în PostgreSQL |
| Trading | Procesat server-side |
| Tranzacții | Salvate în DB după finalizare |

---

## 15. Justificarea alegerilor

Arhitectura aleasă este potrivită pentru scope-ul proiectului deoarece oferă o separare clară între client, server și bază de date, fără a introduce complexitate inutilă.

Clientul Godot se ocupă de interfață și experiența vizuală, în timp ce serverul controlează regulile jocului și previne modificarea neautorizată a stării economice. WebSocket-ul permite sincronizarea rapidă necesară pentru gameplay și trading, iar REST rămâne potrivit pentru operațiile de autentificare.

PostgreSQL este folosit pentru datele importante și pentru snapshot-uri minime ale stării curente, dar nu devine motorul principal al simulării. Această separare permite sistemului să fie suficient de rapid pentru o sesiune multiplayer mică și suficient de clar pentru a fi documentat, testat și extins ulterior.

---

## 16. Observații finale

Arhitectura descrisă în acest document reprezintă baza tehnică pentru următoarele task-uri de implementare:

- register și login din Godot;
- comunicare Godot - server prin WebSocket;
- salvarea state-ului curent;
- implementarea sistemului de trading;
- salvarea tranzacțiilor în baza de date;
- calcularea prețurilor medii și a indicatorilor economici.

Documentul poate fi actualizat pe măsură ce implementarea avansează, dar principiile de bază rămân: server autoritativ, client subțire, backend modular, comunicare realtime prin WebSocket și persistență clar separată de runtime state.