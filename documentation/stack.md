# Stack tehnologic

## 1. Tehnologia pentru frontend

Partea de client a aplicației este realizată în **Godot**, folosind **GDScript** pentru logica de client și interfață. Godot este potrivit pentru acest proiect deoarece oferă suport foarte bun pentru jocuri 2D, prototipare rapidă și integrare convenabilă cu elementele specifice unui joc multiplayer cu interfață proprie.

În cadrul aplicației, Godot este folosit pentru:
- gestionarea scenelor și a interfeței;
- randarea hărții și a elementelor vizuale;
- captarea inputului jucătorului;
- afișarea resurselor, clădirilor și indicatorilor economici;
- comunicarea cu serverul prin componenta de rețea.

Pentru versiunea curentă a proiectului, această alegere oferă un echilibru bun între viteză de dezvoltare, claritate și potrivirea cu tipul aplicației.

## 2. Tehnologia pentru backend

Partea de server este realizată în **Node.js**, folosind **TypeScript** pentru implementarea logicii aplicației. Backend-ul este responsabil de procesarea regulilor jocului și de menținerea stării autoritative a sesiunilor.

Serverul gestionează în principal:
- autentificarea și validarea identității utilizatorilor;
- lobby-urile și sesiunile multiplayer;
- sincronizarea stării între participanți;
- logica economică a jocului;
- piața și tranzacțiile;
- calculul inflației și al altor indicatori economici;
- controlul boților;
- persistența datelor relevante.

Pentru comunicarea realtime dintre client și server este utilizat **WebSocket**, iar pentru operațiile pre-game sau administrative pot fi folosite și endpoint-uri de tip REST.

## 3. Tehnologia pentru stocarea datelor

Pentru stocarea datelor persistente este utilizat **PostgreSQL**. Această bază de date este folosită pentru:
- conturile utilizatorilor;
- datele necesare autentificării;
- informațiile persistente despre sesiuni;
- tranzacțiile relevante;
- rezultatele finale și alte date utile pentru istoric sau audit.

PostgreSQL este potrivit pentru proiect deoarece oferă un model relațional robust și suport bun pentru consistența datelor, aspect important într-o aplicație care include tranzacții economice și logică multiplayer.

## 4. Limbajul / framework-ul de programare principal

La nivelul proiectului sunt folosite două zone tehnologice principale:

### 4.1. Frontend
- **Godot Engine** ca mediu principal de dezvoltare pentru client;
- **GDScript** ca limbaj principal pentru implementarea logicii de joc și a interfeței pe partea de client.

### 4.2. Backend
- **Node.js** ca runtime pentru server;
- **TypeScript** ca limbaj principal pentru logica server-side.

Această combinație separă clar responsabilitățile dintre client și server și este adecvată pentru un joc multiplayer 2D cu logică economică procesată centralizat.

## 5. Librării cunoscute în acest moment

În stadiul actual al proiectului, stack-ul poate include următoarele librării și tehnologii auxiliare:

### 5.1. Backend
- **ws** pentru comunicare WebSocket pe server;
- **Express.js** pentru endpoint-urile necesare în afara canalului realtime;
- **Prisma** ca strat ORM pentru lucrul cu PostgreSQL;
- **jsonwebtoken** pentru autentificare bazată pe token;
- **bcrypt** pentru procesarea securizată a parolelor;
- **Zod** sau un mecanism echivalent pentru validarea inputului.

### 5.2. Tooling și infrastructură
- **Docker** pentru rularea și izolarea componentelor de infrastructură, unde este util;
- **Git** și **GitHub** pentru version control;
- **ESLint** și **Prettier** pentru consistența codului;
- **DBeaver** pentru administrarea bazei de date.

Aceste elemente susțin implementarea practică a proiectului, fără ca toate să fie obligatorii în aceeași măsură pentru livrabilul final.

## 6. Tool-uri de development (IDE)

În cadrul proiectului pot fi utilizate următoarele instrumente de dezvoltare:

### 6.1. Pentru frontend
- **Godot Editor** pentru dezvoltarea scenelor, scripturilor și interfeței jocului.

### 6.2. Pentru backend
- **WebStorm** sau un alt editor potrivit pentru dezvoltarea aplicațiilor Node.js + TypeScript.

### 6.3. Pentru baza de date
- **DBeaver** pentru administrarea și inspectarea bazei de date PostgreSQL.

Aceste instrumente susțin implementarea, testarea și organizarea codului într-un mod eficient și ușor de gestionat.

## 7. Justificarea alegerii tehnologiilor în detrimentul alternativelor

### 7.1. Godot în locul altor opțiuni de frontend
Godot a fost ales deoarece se potrivește foarte bine unui joc 2D multiplayer cu interfață clară și prototipare rapidă. Pentru un astfel de proiect, un game engine dedicat este mai potrivit decât un stack clasic de interfață web, deoarece oferă direct mecanisme pentru scene, input, UI de joc și organizarea logicii vizuale.

### 7.2. Node.js + TypeScript în locul altor opțiuni de backend
Node.js este potrivit pentru aplicații realtime bazate pe conexiuni simultane și mesaje frecvente, iar TypeScript oferă un nivel mai bun de siguranță și claritate față de JavaScript simplu. Alegerea favorizează dezvoltarea rapidă, modelarea mai clară a entităților și o integrare bună cu comunicarea WebSocket.

### 7.3. PostgreSQL în locul altor baze de date
PostgreSQL este preferat deoarece oferă consistență bună pentru date tranzacționale, suport matur pentru model relațional și o bază solidă pentru persistența informațiilor importante ale aplicației. Pentru un sistem cu utilizatori, sesiuni și tranzacții economice, această alegere este mai potrivită decât o soluție orientată exclusiv pe documente sau pe flexibilitate în detrimentul consistenței.

### 7.4. TypeScript în locul JavaScript
TypeScript reduce riscul erorilor prin tipare statice, face modelele de date mai clare și susține mai bine mentenabilitatea unui proiect care include mai multe componente și reguli de joc.

## 8. Observație finală

Stack-ul tehnologic ales urmărește un echilibru între potrivirea cu tipul proiectului, viteza de dezvoltare, claritatea arhitecturală și realismul implementării în contextul unei lucrări de licență. Alegerea sa susține obiectivul principal al aplicației: realizarea unui joc multiplayer cooperativ, coerent din punct de vedere tehnic și suficient de clar pentru a putea fi implementat și demonstrat complet.