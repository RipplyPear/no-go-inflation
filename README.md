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

În timpul unei sesiuni, jucătorii:
- colectează resurse produse automat;
- construiesc și îmbunătățesc clădiri;
- lansează și acceptă oferte pe piață;
- urmăresc indicatorii economici;
- își adaptează strategia în funcție de evoluția economiei.

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
- creare și alăturare la lobby-uri;
- lansare sesiune multiplayer;
- hartă individuală pentru fiecare jucător;
- producție de resurse;
- construire și upgrade de clădiri;
- piață pentru tranzacții;
- calcul și afișare a inflației;
- final de joc și evaluare pe ranguri.

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
