# No-go Inflation

No-go Inflation este un joc 2D multiplayer cooperativ în care jucătorii gestionează economii locale, construiesc clădiri de producție, colectează resurse și tranzacționează între ei printr-o piață comună. Obiectivul este dezvoltarea economiei proprii fără destabilizarea economiei globale a sesiunii prin inflație excesivă.

Aplicația este realizată ca proiect client-server:

* clientul este implementat în Godot;
* serverul este implementat în Node.js + TypeScript;
* baza de date este PostgreSQL;
* autentificarea se face prin REST;
* gameplay-ul realtime se face prin WebSocket.

## Descriere generală

Fiecare jucător primește o hartă proprie, generată la începutul sesiunii. Harta este formată din loturi de tip:

* câmp;
* carieră;
* pădure.

Pe fiecare tip de lot se poate construi o clădire potrivită:

* pe câmp se construiește o fermă;
* pe carieră se construiește o mină;
* pe pădure se construiește o lemnărie.

Clădirile produc resurse în timp. Jucătorii pot colecta resursele produse, le pot folosi pentru construcții și upgrade-uri sau le pot tranzacționa pe piața comună.

## Resurse și monedă

Resursele de bază sunt:

* lemn;
* piatră;
* grâne.

Moneda folosită în joc este galbenul.

## Obiectivul jocului

Scopul jocului este ca jucătorii să își dezvolte economia și să mențină economia sesiunii într-o stare stabilă.

La finalul sesiunii, serverul calculează:

* inflația finală;
* scorul economic al fiecărui participant;
* rangul individual;
* rezultatul colectiv al sesiunii.

Rezultatul nu depinde doar de un singur jucător, ci de stabilitatea generală a economiei.

## Funcționalități implementate

Versiunea curentă include:

* înregistrare și autentificare utilizatori;
* autentificare cu token JWT;
* creare lobby de către host;
* generare cod lobby;
* alăturare la lobby prin cod;
* pornirea sesiunii de către host;
* conectare client-server prin WebSocket;
* hartă individuală pentru fiecare participant;
* generare dinamică a hărților pe server;
* construire clădiri;
* upgrade clădiri până la nivelul 3;
* producție automată de resurse în timp;
* colectare resurse din clădiri;
* piață comună de oferte;
* creare ofertă de cumpărare sau vânzare;
* acceptare ofertă;
* retragere ofertă proprie;
* validare server-side pentru resurse, bani și stare sesiune;
* tranzacții procesate pe server;
* actualizare realtime a stării prin WebSocket;
* calcul inflație și prețuri medii;
* reciclare resurse pentru obținere de galbeni și influențarea inflației;
* finalizare sesiune;
* afișare rezultate finale;
* comenzi DEV pentru testare rapidă.

## Funcționalități de test / dezvoltare

În interfața de joc există un panou DEV folosit pentru demonstrație și testare locală.

Acesta permite:

* generarea rapidă a unei oferte de bot;
* finalizarea forțată a sesiunii.

Aceste comenzi sunt utile pentru prezentare, deoarece permit testarea pieței și a ecranului de final fără a aștepta terminarea naturală a sesiunii.

Comenzile DEV nu fac parte din fluxul normal de gameplay și sunt blocate de server când `NODE_ENV=production`.

## Funcționalități care nu sunt în scope

Versiunea curentă nu include:

* matchmaking automat;
* listă publică de lobby-uri;
* chat între jucători;
* sistem de prieteni;
* ranking global între sesiuni;
* suport pentru sesiuni foarte mari;
* scalare orizontală reală;
* export mobil;
* sisteme economice foarte avansate;
* interfață la nivel de produs comercial final.

## Arhitectură pe scurt

Proiectul folosește o arhitectură client-server cu server autoritativ.

Clientul Godot:

* afișează interfața;
* preia inputul jucătorului;
* trimite intenții către server;
* afișează starea primită de la server.

Serverul Node.js:

* validează autentificarea;
* gestionează lobby-urile;
* gestionează sesiunile active;
* generează hărțile;
* procesează construcțiile, upgrade-urile și colectările;
* procesează piața și tranzacțiile;
* calculează indicatorii economici;
* salvează datele importante în PostgreSQL.

Baza de date PostgreSQL:

* salvează utilizatorii;
* salvează sesiunile;
* salvează participanții;
* salvează hărțile, resursele și clădirile;
* salvează ofertele și tranzacțiile;
* salvează starea economiei;
* salvează rezultatele finale.

## Stack tehnologic

### Client

* Godot 4.x
* GDScript
* WebSocketPeer
* HTTPRequest

### Server

* Node.js
* TypeScript
* Express
* ws
* pg
* bcrypt
* jsonwebtoken
* zod
* dotenv
* cors

### Bază de date

* PostgreSQL
* migrații SQL simple în `server/db/migrations`

## Structura proiectului

```text
/client/no-go-inflation      # proiectul Godot
/server                      # backend Node.js + TypeScript
/server/db/migrations        # scripturi SQL pentru baza de date
/server/requests             # cereri HTTP/WebSocket pentru testare în WebStorm
/documentation               # documentație tehnică și funcțională
```

## Configurare locală

### 1. Cerințe

Pentru rulare locală sunt necesare:

* Node.js și npm;
* PostgreSQL;
* Godot 4.x;
* un editor pentru server, de exemplu WebStorm sau VS Code.

## 2. Configurarea bazei de date
```bash
createdb no_go_inflation

cd server

psql -U postgres -d no_go_inflation -f db/migrations/01_users.sql
psql -U postgres -d no_go_inflation -f db/migrations/02_game_state_tables.sql
```

Migrațiile creează:

* tabela `users`;
* tabelele pentru sesiuni;
* participanți;
* hărți;
* clădiri;
* resurse;
* oferte;
* tranzacții;
* stare economică;
* snapshot-uri economice;
* rezultate finale.

## 3. Configurarea serverului

În folderul `server`, se creează un fișier `.env`.

Exemplu:

```env
HOST=0.0.0.0
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=no_go_inflation
DB_USER=postgres
DB_PASSWORD=parola_ta

JWT_SECRET=schimba_aceasta_valoare
NODE_ENV=development
```

Observații:

* `HOST=0.0.0.0` permite conectarea și de pe alte dispozitive din aceeași rețea locală;
* pentru rulare doar pe calculatorul local, se poate folosi și `localhost`;
* `JWT_SECRET` trebuie schimbat cu o valoare proprie;
* `NODE_ENV=development` permite folosirea comenzilor DEV.

## 4. Instalarea și pornirea serverului

Din folderul `server`:

```bash
npm install
npm run dev
```

Serverul pornește implicit pe portul `3000`.

La pornire, serverul verifică conexiunea la baza de date și montează serverul WebSocket pe ruta:

```text
/ws
```

Endpoint-uri REST importante:

```text
GET  /health
POST /auth/register
POST /auth/login
GET  /users/me
```

Endpoint WebSocket:

```text
ws://HOST:PORT/ws?token=TOKEN
```

### Conectare în rețeaua locală

La pornire, serverul afișează atât adresa locală, cât și adresele IPv4 disponibile în rețeaua locală:

```text
Local: http://localhost:3000
LAN: http://192.168.x.x:3000
```

Pentru a conecta un alt calculator din aceeași rețea:

1. Se pornește serverul cu `HOST=0.0.0.0`;
2. În client, se deschide "Configurare server" din meniul principal;
3. Se introduce adresa IPv4 afișată de server, de exemplu `192.168.x.x`;
4. Se apasă "Verifică și salvează".

Dacă câmpul este lăsat gol, clientul folosește implicit `localhost`. Adresa selectată este salvată local și este folosită atât pentru cererile REST, cât și pentru WebSocket.

Dacă verificarea eșuează, se recomandă următoarele verificări:
- dispozitivele sunt în aceeași rețea;
- firewall-ul permite conexiuni pe portul `3000`.

## 5. Build server

Pentru compilarea TypeScript:

```bash
cd server
npm run build
```

Pentru pornirea versiunii compilate:

```bash
npm start
```

`npm start` rulează fișierul generat în `dist/index.js`, deci trebuie rulat după `npm run build`.

## 6. Configurarea clientului Godot

Clientul se află în:

```text
client/no-go-inflation
```

Se deschide acest folder în Godot.
Configurarea adresei serverului se face în:

```text
client/no-go-inflation/scripts/client_config.gd
```

În implementarea curentă, configurarea este de forma:

```gdscript
const SERVER_HOST := "192.168.1.144"
const SERVER_PORT := "3000"

const API_BASE_URL := "http://" + SERVER_HOST + ":" + SERVER_PORT
const WS_BASE_URL := "ws://" + SERVER_HOST + ":" + SERVER_PORT + "/ws"
```

Pentru rulare pe același calculator cu serverul, se poate folosi:

```gdscript
const SERVER_HOST := "localhost"
const SERVER_PORT := "3000"
```

Pentru rulare de pe alt dispozitiv din aceeași rețea, se folosește IP-ul calculatorului pe care rulează serverul.

Exemplu:

```gdscript
const SERVER_HOST := "192.168.1.144"
const SERVER_PORT := "3000"
```

## 7. Rularea clientului

În Godot:

1. se deschide proiectul din `client/no-go-inflation`;
2. se verifică scena principală;
3. se pornește proiectul cu Run.

Pentru demonstrație multiplayer locală, se rulează două instanțe ale jocului.

În Godot se poate activa rularea mai multor instanțe din opțiunile de debug ale editorului.

## 8. Flux principal de gameplay

Fluxul normal este:

```text
Register/Login
        ↓
Meniu jucător
        ↓
Creare lobby / Alăturare lobby
        ↓
Start sesiune
        ↓
Generare hartă individuală
        ↓
Construire / Upgrade / Colectare
        ↓
Piață / Tranzacții / Reciclare
        ↓
Actualizare inflație
        ↓
Final sesiune
        ↓
Rezultate finale
```

## 9. Mesaje WebSocket principale

Clientul trimite către server mesaje de tip:

```text
PING
CREATE_LOBBY
JOIN_LOBBY
LEAVE_LOBBY
START_SESSION
LEAVE_SESSION
BUILD_BUILDING
UPGRADE_BUILDING
COLLECT_BUILDING
RECYCLE_RESOURCE
GET_MARKET_STATE
CREATE_MARKET_OFFER
ACCEPT_MARKET_OFFER
CANCEL_MARKET_OFFER
DEV_SEED_BOT_OFFER
DEV_FORCE_FINISH_SESSION
```

Serverul poate răspunde cu:

```text
PONG
AUTHENTICATED
LOBBY_STATE
SESSION_STATE
MARKET_STATE
OFFER_CREATED
OFFER_CANCELLED
TRADE_COMPLETED
RESOURCE_RECYCLED
GAME_FINISHED
SESSION_CANCELLED
SESSION_LEFT
ERROR
```

## 10. Testare server din WebStorm

Folderul `server/requests` conține fișiere pentru testarea serverului:

```text
00-health.http
01-auth.http
02-user.http
10-ws-smoke.http
11-ws-gameplay.http
12-ws-market-dev.http
13-ws-lobby.http
http-client.env.json
```

## 11. Observații despre implementare

Aplicația folosește server autoritativ. Clientul nu modifică direct resurse, bani, clădiri sau oferte. Clientul trimite doar acțiuni intenționate, iar serverul validează și aplică modificările.

Exemple de validări realizate server-side:

* utilizatorul trebuie să fie autentificat;
* participantul trebuie să aparțină sesiunii;
* sesiunea trebuie să fie în starea potrivită;
* clădirea trebuie să corespundă tipului de lot;
* jucătorul trebuie să aibă resurse suficiente;
* oferta trebuie să fie activă;
* cumpărătorul trebuie să aibă galbeni suficienți;
* vânzătorul trebuie să aibă resurse suficiente;
* acțiunile DEV nu sunt permise în producție.

## 14. Assets

Proiectul folosește asset-uri grafice pentru:

* clădiri;
* resurse;
* tile-uri;
* interfață.

Asset-urile medievale provin din pachetul Kenney RTS Pack: Medieval, licențiat CC0.

Interfața folosește o temă Godot de tip soft retro, inclusiv fontul Righteous, conform fișierelor de licență incluse în proiect.

## 15. Status curent

Proiectul este într-o stare funcțională pentru demonstrație.

Sunt implementate mecanicile principale:

* autentificare;
* lobby;
* sesiune multiplayer;
* hartă individuală;
* clădiri;
* producție;
* colectare;
* piață;
* tranzacții;
* reciclare;
* inflație;
* rezultate finale.

Nu este o versiune comercială finală, ci un MVP funcțional care demonstrează arhitectura, fluxurile multiplayer și mecanicile economice principale.
