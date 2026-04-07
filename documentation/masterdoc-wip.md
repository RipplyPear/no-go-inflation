---
title: Masterdoc
status: draft
version: 0.2
lastUpdated: 07-04-2026
description: Project source of truth
---

# Masterdoc - No-go Inflation
***

## 1. Scopul documentului
Acest document reprezintă sursa unică de adevăr pentru proiectul de licență. El definește varianta canonică a jocului: viziunea produsului, regulile de gameplay, entitățile, fluxurile utilizatorului, limitele de scope și deciziile tehnice de nivel înalt.

## 2. Pitch
Proiectul este un joc video multiplayer **cooperativ** în care jucătorii gestionează câte o economie locală și fac comerț între ei. Obiectivul comun al jucătorilor este să își dezvolte economiile pe parcursul unei săptămâni de joc, fără a destabiliza piața și fără a provoca inflație excesivă.

## 3. Obiectivul jocului
### 3.1 Obiectiv general
Obiectivul principal al jocului are atât o componentă individuală, prin dezvoltarea propriei economii și obținerea de profit, cât și o componentă colectivă, prin menținerea stabilității economice generale și evitarea unei creșteri excesive a inflației.

### 3.2 Ce înseamnă „a juca bine”
- Investirea inteligentă în clădiri și upgrade-uri;
- Realizarea unor tranzacții eficiente;
- Participarea activă la piață;
- Evitarea creșterii excesive a inflației;
- Cooperarea cu ceilalți jucători în vederea menținerii echilibrului economic.

### 3.3 Condiții de succes / eșec
- Succes = jucătorii obțin profit, reușesc să mențină stabilitatea economică generală pe toată durata jocului, ating pragul minim de creștere economică;
- Eșec = economia nu mai rămâne într-o stare suficient de stabilă până la finalul sesiunii.

## 4. Scope-ul proiectului de licență
### 4.1 In scope
- Sistem de autentificare pentru jucători;
- Creare și alăturare l lobby-uri;
- Lansarea unei sesiuni multiplayer;
- Hartă individuală pentru fiecare jucător;
- Hartă generată dinamic;
- Producția a 3 resurse de bază;
- Construire și upgrade de clădiri;
- Colectarea resurselor;
- Piață pentru tranzacții;
- Calcul și afișare a inflației;
- Final de joc și evaluare pe ranguri;
- Server autoritativ și persistență de bază;
- Boți pentru a atinge pragul minim (poate deveni out of scope în funcție de timp).

### 4.2 Out of scope
- Matchmaking automat;
- Suport pentru sesiuni cu mai mult de 8 jucători;
- Export pe mobil;
- Scalare orizontală reală;
- Sisteme economice foarte avansate;
- Variante alternative complexe de reguli.

### 4.3 Nice to have / extensii ulterioare
- "Bilet spre Bahamas" - final greedy, individual;
- Comportamente complexe pentru boți;
- Piață mai sofisticată;
- Statistici și istorice detaliate (grafice);
- Mod solo extins;
- Evenimente economice speciale ("wildcard").

## 5. Principii canonice de design
- Server autoritativ
Serverul validează și procesează acțiunile relevante. Clientul afișează starea și trimite intenții.
- Gameplay cooperativ cu componentă individuală
Jocul este în primul rând cooperativ, dar fiecare jucător își dezvoltă propria economie și primește o evaluare individuală la final.
- Stabilitatea economică are prioritate față de profitul agresiv
- Economie accesibilă conceptual, dar interesantă strategic
- Informații economice relevante vizibile jucătorilor
  - Resursele propii,
  - Starea pieței,
  - Starea inflației,
  - Poate cererea/oferta relevantă,
  - Ofertele lansate de ceilalți jucători.
- Inacțiunea este penalizată prin performanță economică slabă
Trebuie atins un prag minim de performanță economică.
- Rejucabilitate prin generare de hartă și dinamica pieței

## 6. Public țintă
### 6.1 Jucători de strategie
### 6.2 Context educațional / academic
### 6.3 Jucători interesați de co-op

## 7. Actorii sistemului
### 7.1 Jucător
### 7.2 Bot
### 7.3 Server
### 7.4 Responsabilități și limite
### 7.5 Matrice de permisiuni

## 8. Gameplay loop
### 8.1 Bucla principală
[Ex: observă piața → produce → colectează → construiește/upgrade → tranzacționează → monitorizează inflația]
### 8.2 Deciziile principale ale jucătorului
### 8.3 Presiuni / constrângeri

## 9. Entități canonice
### 9.1 Resurse
### 9.2 Moneda
### 9.3 Loturi
### 9.4 Clădiri
### 9.5 Jucător
### 9.6 Lobby
### 9.7 Sesiune de joc
### 9.8 Ofertă / tranzacție
### 9.9 Indicatori economici

## 10. Reguli canonice de joc
### 10.1 Setup-ul sesiunii
- număr jucători
- rolul boților
- condiții de start

### 10.2 Timpul în joc
- conversie timp real / timp în joc
- programul zilei
- durata unei sesiuni

### 10.3 Harta
- dimensiune
- distribuția loturilor
- reguli de generare / alegere

### 10.4 Producția
- ce produce fiecare clădire
- ritm de producție
- condiții

### 10.5 Construirea
- unde se poate construi
- costuri
- restricții

### 10.6 Upgrade-urile
- niveluri
- costuri
- efecte

### 10.7 Stocarea și colectarea
- capacitate
- pierderi la overflow
- mecanism collect

### 10.8 Piața
- când e deschisă
- tipuri de oferte
- cine poate cumpăra / vinde
- cum se închide o tranzacție

### 10.9 Reciclarea / vânzarea în void
- cum funcționează
- de ce există

### 10.10 Inflația
- ce reprezintă în joc
- ce o influențează
- ce efecte are asupra jucătorilor / sesiunii

### 10.11 Finalul jocului
- când se termină
- ce se evaluează
- criterii de rezultat

## 11. Fluxurile utilizatorului
### 11.1 Register
### 11.2 Login / Logout
### 11.3 Creare lobby
### 11.4 Join lobby
### 11.5 Ready / Unready
### 11.6 Lansare sesiune
### 11.7 Gameplay in-session
### 11.8 Părăsire sesiune
### 11.9 Reconnect / disconnect handling

## 12. Ecrane și UI
### 12.1 Splash screen
### 12.2 Meniu principal
### 12.3 Ecran join game
### 12.4 Ecran host game
### 12.5 Setări
### 12.6 Despre
### 12.7 Ecran principal de joc
### 12.8 Piață
### 12.9 Chat
Pentru fiecare ecran:
- scop
- elemente afișate
- acțiuni posibile
- tranziții către alte ecrane

## 13. Arhitectură logică de nivel înalt
### 13.1 Client
### 13.2 Server
### 13.3 Baza de date
### 13.4 Comunicare realtime
### 13.5 Persistență
### 13.6 Rolul boților

## 14. Model de date conceptual
### 14.1 Entități persistente
### 14.2 Entități runtime
### 14.3 Relații între ele

## 15. Cerințe non-funcționale
### 15.1 Performanță
### 15.2 Consistență
### 15.3 Securitate
### 15.4 Scalabilitate
### 15.5 Mentenabilitate

## 16. Stack tehnologic
### 16.1 Frontend
### 16.2 Backend
### 16.3 Database
### 16.4 Tooling
### 16.5 Justificare pe scurt
> Aici doar rezumat. Documentul complet de justificare a stack-ului rămâne separat.

## 17. Decizii canonice
| ID | Decizie | Status | Observații |
|----|---------|--------|------------|
| GAME-001 | 1 secundă reală = 1 minut în joc | Canon | |
| GAME-002 | Piața este deschisă între 09:00–17:00 | Canon | |
| GAME-003 | Serverul este autoritativ | Canon | |

## 18. Întrebări deschise
- [ ] Numărul final de jucători per sesiune
- [ ] Piață globală vs P2P vs hibrid
- [ ] Formula exactă a inflației
- [ ] Rolul exact al boților
- [ ] Condiții precise de win/lose

## 19. Glosar
[Termeni precum lobby, tick, ofertă, inflație, sesiune, lot, collect etc.]

## 20. Anexe
### 20.1 Tabele de costuri
### 20.2 Tabele de producție
### 20.3 Note de balancing





## 2. Stack
- Godot Engine/Editor + GDScript
- Node.js + Typescript
- Websockets
- PostgreSQL
- DBeaver (?)
# Game
***
- Overview: Joc multiplayer cooperativ tip gestionare resurse / comerț
- Jucători: 4-8 Jucători (se poate umple cu jucători boți în caz că nu se îndeplinește numărul minim)
- Scop: Generare, gestionare și comerț resurse în vederea obținerii de profit FĂRĂ a provoca inflație
# Jucătorul poate
***
## Înafara jocului
- Să se logheze / delogheze / creeze profil
- Găzdui o sesiune de joc -> creează lobby -> lanseaza sesiunea
- Se alătură unei sesiuni de joc -> se marchează drept "Ready" -> poate părăsi lobby-ul înaintea lansării sesiunii
- Accesa meniul de "Setări" sau ecranul "Despre"
## În joc
- Construi / îmbunătăți unitățile de producție (doar pe parcela adecvată fiecăreia)
- Colecta resurse de la unități
- Consulta piața pentru a vedea prețul mediu actual al fiecărei resurse
- Lansa oferte de vânzare/cumpărare pe market 
- Accepta oferte de vânzare/cumpărare
- Trimite mesaje pe chat
# Ecrane
***
- Splash screen -> titlu joc + "Press any button to continue"
- Meniu principal
	- Alătura-te unui joc
	- Găzduiește un joc
	- Setări
	- Despre
- Alăturare joc
	- Introdu cod (pentru un lobby specific): 
	- Listă lobby-uri publice ce nu s-au lansat încă + buton Join
	- Înapoi 
- Găzduire joc
	- Privat / Public ?
	- Cod: (generat de joc)
	- Listă participanți curenți cu status (Ready / Not Ready)
	- Lansează joc
	- Anulare
- Setări
	- Luminozitate
	- Volum
	- Înapoi
- Despre
	- Detalii despre joc
# Elemente ale jocului
***
## Resursele
- 3 resurse generabile: grâne, piatră, lemn -> câte 10 din fiecare la început de joc 
- 1 resurse de tranzacții: galbeni
	- 10 la început de joc
	- se pot obține prin comerț sau prin "reciclarea" resurselor -> vânzarea lor "în void" la subpreț
## Loturi
- Pădure -> Lemn
- Carieră -> Piatră 
- Câmp -> Grâne
## Unitățile
- Câte 1 per resursă:
	- Piatră -> Mină
	- Grâne -> Fermă
	- Lemn -> Lemnărie (WIP)
- Mină
	- Cost de bază (construcție): 3 piatră / 2 galbeni
	- Cost upgrade 1->2: 1 piatră 2 lemn / 3 galbeni
	- Cost upgrade 2->3: 3 lemn 2 grâne / 5 galbeni
- Similar și la Lemnărie / Fermă
## Harta -> Ecran principal
- Tip grid 8 x 10
- Fiecare jucător are harta sa
- Layout echilibrat între cele 3 tipuri de lot
- Numărul din fiecare lot aleator dar acestea sunt grupate
- Poate lipsi cel mult 1 tip de lot
## GUI
- HUD -> sus centru, numărul din fiecare resursă
- Widget ziua și ora -> sus stânga
- Chat -> coloană în partea stângă a ecranului, se poate ascunde
- Meniu mic din 3 butoane -> sus dreapta
	- Vezi piață
	- Reciclare
	- Setări 
	- Părăsește jocul
- Ecran Piață:
	- stânga -> ratele de schimb actuale + starea inflației
	- dreapta -> listă oferte + buton "Lansează ofertă"
## Timp
- Convenție de timp: 1 secundă reală = 1 minut în joc
- Jocul se desfășoară de-a lungul unei săptămâni lucrătoare (L-V)
- O zi începe la 8 și se termină la 20
- Piața e deschisă între 9 și 17
