# No-go Inflation

No-go Inflation este un joc video multiplayer **cooperativ** în care jucătorii gestionează economii locale, produc resurse și fac comerț între ei, încercând să își dezvolte economiile fără să destabilizeze piața și fără să provoace inflație excesivă.

## Descriere pe scurt

Fiecare jucător primește o hartă proprie, cu loturi pe care poate construi clădiri de producție. Clădirile generează resurse în timp, iar jucătorii trebuie să decidă cum își folosesc resursele: pentru dezvoltare, pentru comerț sau pentru menținerea lichidității.

Componenta principală a jocului este cooperativă: succesul nu depinde doar de performanța individuală, ci și de menținerea stabilității economice generale a sesiunii.

## Obiectiv

Scopul jocului este:
- dezvoltarea propriei economii;
- realizarea unor tranzacții eficiente;
- cooperarea cu ceilalți jucători;
- evitarea creșterii excesive a inflației;
- atingerea pragului minim de performanță economică până la finalul sesiunii.

## Gameplay de bază

Fluxul principal al aplicației este:

1. jucătorul își creează cont sau se autentifică;
2. host-ul creează un lobby;
3. al doilea jucător se alătură lobby-ului folosind codul generat;
4. host-ul pornește sesiunea;
5. fiecare jucător primește o hartă proprie generată dinamic;
6. jucătorii construiesc și îmbunătățesc clădiri;
7. clădirile produc resurse în timp;
8. jucătorii colectează resursele produse;
9. jucătorii creează și acceptă oferte pe piață;
10. tranzacțiile influențează economia sesiunii și indicatorii de inflație;
11. la finalul sesiunii sunt afișate rezultatele.

## Scenariu demonstrativ

Pentru demonstrarea aplicației se poate rula jocul în două instanțe Godot conectate la același server local.

Pași:

1. se pornește serverul Node.js;
2. se pornesc două instanțe ale clientului Godot;
3. în prima instanță se autentifică utilizatorul `user1`;
4. în a doua instanță se autentifică utilizatorul `user2`;
5. `user1` creează un lobby;
6. `user2` se alătură lobby-ului folosind codul generat;
7. `user1`, ca host, pornește sesiunea;
8. fiecare jucător primește o hartă proprie;
9. jucătorii pot construi clădiri, colecta resurse și interacționa cu piața;
10. un jucător creează o ofertă de vânzare/cumpărare;
11. celălalt jucător acceptă oferta;
12. serverul procesează tranzacția și actualizează starea jocului pentru ambii participanți.

## Rulare locală

### Server
```bash
npm install
npm run dev
```
Serverul pornește pe portul 3000.

### Client
Se lanseaza proiectul din Godot Editor cu opțiunea de instanțe multiple.

### Bază de date
Aplicația folosește PostgreSQL. Înainte de rulare trebuie configurat fișierul `.env` al serverului pe baza fișierului `.env.example`.

### Resurse
- Grâne
- Piatră
- Lemn

### Monedă
- Galbeni

### Clădiri
- Fermă
- Mină
- Lemnărie

## Actori principali

### Jucător
Actorul principal al sistemului. Controlează o economie locală și interacționează cu interfața jocului.

### Bot
Actor software controlat de server. Susține activitatea economică minimă a pieței și poate completa sesiunile mici.

### Server
Componenta autoritativă a sistemului. Validează acțiunile, procesează logica economică, sincronizează sesiunile și persistă datele relevante.

## Stack tehnologic

### Frontend
- Godot
- GDScript

### Backend
- Node.js
- TypeScript
- WebSocket
- REST pentru operații pre-game / administrative

### Bază de date
- PostgreSQL

### Librării / tool-uri posibile
- ws
- Express.js
- Prisma
- jsonwebtoken
- bcrypt
- Zod
- Docker
- ESLint
- Prettier

## Arhitectură pe scurt

Proiectul urmează un model cu **server autoritativ**:
- clientul afișează interfața și trimite intenții;
- serverul validează și procesează acțiunile;
- baza de date persistă informațiile importante;
- starea runtime a sesiunii este gestionată în principal de server.

## Scope-ul versiunii curente

În scope:
- autentificare;
- creare joc/lobby;
- alăturare prin cod;
- pornire sesiune;
- hartă generată dinamic;
- clădiri: construire, upgrade, colectare;
- piață cu oferte;
- tranzacții între participanți;
- indicatori economici;
- final de joc;
- persistență PostgreSQL;
- comunicare realtime prin WebSocket.

În afara scope-ului:
- matchmaking automat;
- sesiuni cu mai mult de 8 jucători;
- export pe mobil;
- scalare orizontală reală;
- sisteme economice foarte avansate.

## Structură generală

```text
/client           # proiectul Godot
/server           # backend Node.js + TypeScript
/documentation    # documentație tehnică și funcțională
```

## Status implementare

Funcționalități implementate în versiunea curentă:

- autentificare utilizatori;
- creare lobby;
- alăturare la lobby prin cod;
- pornire sesiune multiplayer de către host;
- generare hartă individuală pentru fiecare participant;
- construire clădiri;
- upgrade clădiri;
- producție și colectare resurse;
- piață cu oferte;
- acceptare oferte între jucători;
- tranzacții procesate server-side;
- actualizare stare joc prin WebSocket;
- calcul și afișare indicatori economici;
- final de joc și afișare rezultate.