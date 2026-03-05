# Stack
***
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
	- Listă participanți curenți cu status (Ready / Not Ready
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
- Tip grid 10 × 15
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
