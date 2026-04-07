---
title: Masterdoc
status: draft
version: 0.3
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
Publicul principal al jocului este format din jucători interesați de jocuri de strategie, gestionare de resurse și luarea de decizii într-un sistem economic dinamic. Jocul se adresează celor care apreciază planificarea, optimizarea și adaptarea la schimbările din piață.

### 6.2 Grupuri mici de jucători
Jocul este conceput în special pentru sesiuni multiplayer în grupuri mici, în care jucătorii pot comunica ușor și se pot coordona în jurul unui obiectiv comun. Din acest motiv, experiența este potrivită pentru grupuri de prieteni care caută un joc cooperativ cu o componentă strategică pronunțată.

### 6.3 Context educațional secundar
Deși jocul nu este conceput în primul rând ca instrument educațional, acesta include în mod implicit concepte economice elementare, precum cererea, oferta, schimbul și inflația. Prin urmare, proiectul poate avea și o valoare demonstrativă sau academică secundară.

## 7. Actorii sistemului

### 7.1 Jucător
Jucătorul este actorul principal al sistemului. Acesta controlează o economie locală în cadrul unei sesiuni multiplayer și poate desfășura următoarele acțiuni:
- își creează cont și se autentifică în sistem;
- creează sau se alătură unui lobby;
- părăsește un lobby înainte de începerea sesiunii;
- își marchează statusul ca Ready / Not Ready;
- poate avea rolul de Host într-un lobby, cu responsabilitatea de a lansa sesiunea;
- construiește și îmbunătățește clădiri pe loturile corespunzătoare;
- colectează resursele produse;
- lansează oferte de cumpărare și vânzare pe piață;
- acceptă ofertele altor jucători sau răspunde la acestea;
- urmărește indicatorii economici relevanți;
- participă activ la menținerea stabilității economice generale.

### 7.2 Bot
Botul este un actor software controlat de server, cu rolul de a susține funcționarea ecosistemului economic al jocului. Acesta poate participa la sesiune pentru a completa numărul de jucători sau pentru a menține activitatea economică a pieței. Botul poate:
- produce resurse într-un mod controlat;
- lansa și accepta oferte pe piață;
- contribui la dinamica economică a sesiunii;
- respecta aceleași reguli economice de bază ca jucătorii umani, în limitele stabilite de sistem.

### 7.3 Server
Serverul este actorul tehnic autoritativ al sistemului. Acesta are responsabilitatea de a valida, procesa și sincroniza toate acțiunile relevante din joc. Serverul:
- validează acțiunile trimise de jucători;
- gestionează lobby-urile și sesiunile multiplayer;
- sincronizează starea jocului între toți participanții;
- calculează și actualizează indicatorii economici, inclusiv inflația;
- procesează producția, tranzacțiile și alte evenimente de gameplay;
- controlează comportamentul boților;
- persistă datele necesare aplicației și sesiunilor de joc;
- gestionează conectările, deconectările și eventualele reconectări.

### 7.4 Responsabilități și limite
Fiecare actor are un rol bine definit în sistem:
- jucătorul ia decizii economice și interacționează cu interfața jocului;
- botul simulează participare economică suplimentară în cadrul regulilor impuse de sistem;
- serverul decide starea validă a jocului și reprezintă singura sursă autoritativă pentru evoluția sesiunii.

### 7.5 Matrice de permisiuni

| Activitate                           | Jucător   | Bot | Server                  |
| ------------------------------------ | --------- | --- | ----------------------- |
| Înregistrare / autentificare         | Da        | Nu  | Nu                      |
| Creare lobby                         | Da        | Nu  | Da                      |
| Alăturare la lobby                   | Da        | Da  | Da                      |
| Părăsire lobby                       | Da        | Nu  | Da                      |
| Ready / Not Ready                    | Da        | Nu  | Da                      |
| Lansare sesiune                      | Da (Host) | Nu  | Da                      |
| Producție de resurse                 | Da        | Da  | Nu                      |
| Construire / upgrade                 | Da        | Nu  | Validare                |
| Colectare resurse                    | Da        | Nu  | Validare                |
| Lansare ofertă pe piață              | Da        | Da  | Administrare / validare |
| Acceptare ofertă                     | Da        | Da  | Administrare / validare |
| Vizualizare indicatori economici     | Da        | Da  | Da                      |
| Calcul inflație / procesare economie | Nu        | Nu  | Da                      |
| Persistență date                     | Nu        | Nu  | Da                      |
| Gestionare boți                      | Nu        | Nu  | Da                      |

## 8. Gameplay loop

### 8.1 Bucla principală
În timpul unei sesiuni, jucătorul parcurge în mod repetat o buclă de decizie economică. Producția de resurse are loc automat, în timp ce colectarea, investițiile și tranzacțiile sunt realizate manual de către jucător. În mod tipic, bucla de gameplay presupune:
- colectarea resurselor produse;
- construirea de clădiri noi sau îmbunătățirea celor existente;
- lansarea sau acceptarea de tranzacții pe piață;
- verificarea stării pieței și a indicatorilor economici;
- reevaluarea situației și adaptarea strategiei.

Ordinea exactă a acestor acțiuni nu este impusă. Jucătorul poate decide în orice moment ce acțiune este mai potrivită în funcție de propriile resurse, de starea pieței și de comportamentul celorlalți participanți.

### 8.2 Deciziile principale ale jucătorului
Principalele decizii ale jucătorului privesc:
- momentul în care colectează resursele produse;
- alegerea între investiții în dezvoltarea economiei proprii și păstrarea resurselor pentru tranzacții;
- momentul și condițiile în care cumpără sau vinde resurse;
- modul în care își adaptează strategia la schimbările din piață;
- măsura în care urmărește profitul propriu fără a afecta stabilitatea economică generală.

### 8.3 Presiuni și constrângeri
Gameplay-ul este influențat de mai multe presiuni simultane:
- timpul limitat al sesiunii;
- resursele limitate disponibile fiecărui jucător;
- necesitatea participării active la piață;
- riscul creșterii inflației;
- dependența de deciziile și comportamentul celorlalți jucători.

Aceste constrângeri obligă jucătorii să își adapteze constant planurile și să coopereze pentru menținerea echilibrului economic.

## 9. Entități canonice

### 9.1 Resurse
În joc există trei resurse principale care pot fi produse și tranzacționate:
- **Grâne**
- **Piatră**
- **Lemn**

Aceste resurse reprezintă baza economiei jocului. Ele sunt utilizate pentru construire, upgrade și comerț între jucători.

### 9.2 Moneda
Moneda jocului este reprezentată de **galbeni**. Aceasta este utilizată în tranzacții și reflectă valoarea economică lichidă deținută de un jucător.

### 9.3 Loturi
Harta fiecărui jucător este alcătuită din loturi de trei tipuri:
- **Câmp**
- **Carieră**
- **Pădure**

Fiecare tip de lot permite plasarea și funcționarea unei clădiri corespunzătoare resursei asociate.

### 9.4 Clădiri
În joc există trei tipuri principale de clădiri de producție:
- **Fermă**, construită pe loturi de tip Câmp;
- **Mină**, construită pe loturi de tip Carieră;
- **Lemnărie**, construită pe loturi de tip Pădure.

Clădirile produc automat resurse și pot fi îmbunătățite pentru a crește randamentul de producție.

### 9.5 Jucător
Jucătorul este entitatea controlată de utilizatorul uman. Acesta deține resurse, galbeni, clădiri și o hartă proprie, participă la lobby-uri și sesiuni de joc și ia decizii economice pe parcursul partidei. Un jucător poate avea și rolul de **Host** în cadrul unui lobby.

### 9.6 Lobby
Lobby-ul este spațiul premergător unei sesiuni de joc, în care jucătorii se pot reuni înainte de începerea partidei. În lobby se gestionează participarea jucătorilor, statusul Ready / Not Ready și lansarea sesiunii de către Host.

### 9.7 Sesiune de joc
Sesiunea de joc reprezintă instanța activă a unei partide multiplayer. Aceasta include jucătorii participanți, hărțile individuale, starea economiei, piața, indicatorii economici și evoluția timpului de joc.

### 9.8 Ofertă / tranzacție
Oferta este entitatea prin care un jucător sau un bot propune cumpărarea sau vânzarea unei resurse pe piață. O ofertă are un tip, un preț, o cantitate și o perioadă limitată de disponibilitate. Aceasta poate fi acceptată direct de alt participant sau poate primi o contraofertă.

Tranzacția reprezintă rezultatul final al unei interacțiuni de piață încheiate cu succes între două părți.

### 9.9 Indicatori economici
Indicatorii economici reprezintă valorile folosite pentru evaluarea stării generale a economiei jocului. Indicatorii principali sunt:
- **inflația**, ca măsură a dezechilibrului economic global;
- **prețurile medii de piață**, ca referință pentru valoarea curentă a resurselor tranzacționate.

## 10. Reguli canonice de joc

### 10.1 Setup-ul sesiunii
O sesiune de joc poate fi inițiată într-un lobby multiplayer și poate începe cu un număr de participanți cuprins între 2 și 8 jucători. Dimensiunea țintă a unei sesiuni este de 4–8 jucători, însă jocul poate fi pornit și cu minimum 2 participanți.

Lansarea sesiunii este realizată de jucătorul cu rol de Host. Pentru ca sesiunea să poată începe, toți jucătorii prezenți în lobby trebuie să fie marcați ca Ready.

La începutul fiecărei sesiuni:
- fiecărui jucător îi este generată o hartă individuală;
- fiecare jucător primește aceleași resurse inițiale și aceeași cantitate inițială de galbeni;
- economia globală este inițializată într-o stare stabilă.

Boții pot fi adăugați într-o sesiune pentru a completa numărul de participanți sau pentru a susține activitatea economică a pieței. Prezența boților nu este obligatorie pentru pornirea unei sesiuni.

### 10.2 Timpul în joc
Timpul din joc urmează o convenție accelerată, în care **1 secundă reală corespunde unui minut în joc**.

O zi de joc începe la ora **08:00** și se încheie la ora **20:00**. O sesiune standard se desfășoară pe parcursul unei săptămâni lucrătoare, de **luni până vineri**.

Piața este deschisă zilnic în intervalul **09:00–17:00**. În acest interval, jucătorii și boții pot lansa, accepta sau negocia oferte de cumpărare și vânzare.

În afara programului pieței, tranzacțiile nu sunt permise. Totuși, celelalte activități ale jucătorului rămân disponibile, inclusiv:
- colectarea resurselor produse;
- construirea de clădiri;
- îmbunătățirea clădirilor existente;
- analizarea propriei economii și planificarea acțiunilor viitoare.

### 10.3 Harta
Fiecare jucător primește la începutul sesiunii o hartă individuală de dimensiune **8 x 10**. Hărțile sunt generate dinamic la inițializarea partidei.

Distribuția loturilor este aleatoare, dar controlată, astfel încât fiecare hartă să rămână jucabilă și să nu ofere un avantaj disproporționat unui anumit jucător. Hărțile nu sunt identice între jucători.

Pe hartă pot exista loturi de tip:
- **Câmp**
- **Carieră**
- **Pădure**

Numărul de loturi din fiecare tip poate varia de la un jucător la altul. În anumite cazuri, un tip de lot poate lipsi complet de pe harta unui jucător, însă pot lipsi **cel mult un singur tip de lot** pe aceeași hartă.

Loturile de același tip sunt generate în grupuri sau zone compacte, nu distribuite complet aleatoriu. Această structură urmărește să ofere coerență vizuală și să susțină diferențierea economică dintre jucători.

Asimetria controlată a hărților are rolul de a încuraja comerțul și interdependența economică dintre participanți, fără a compromite echilibrul general al sesiunii.

### 10.4 Producția
Clădirile de producție generează automat resurse în timp. Fiecare tip de clădire produce exclusiv resursa asociată:
- **Fermă** → grâne
- **Mină** → piatră
- **Lemnărie** → lemn

Ritmul de producție depinde de nivelul clădirii:
- **Nivel 1**: 1 unitate / minut
- **Nivel 2**: 2 unități / minut
- **Nivel 3**: 3 unități / minut

Producția are loc automat atât timp cât clădirea dispune de spațiu liber de stocare. Resursele produse se acumulează în stocarea internă a clădirii și trebuie colectate manual de jucător.

Dacă spațiul de stocare al unei clădiri este plin, producția suplimentară se pierde până la eliberarea spațiului prin colectare.

### 10.5 Construirea
Clădirile pot fi construite doar pe loturile corespunzătoare tipului lor de producție:
- **Fermă** pe **Câmp**;
- **Mină** pe **Carieră**;
- **Lemnărie** pe **Pădure**.

Pe un lot poate exista o singură clădire. Odată construită, aceasta ocupă lotul respectiv și devine activă în cadrul economiei jucătorului.

Construirea unei clădiri este instantanee și creează o clădire de **nivel 1**.

Costurile de construire sunt:
- **Fermă**: 10 lemn, 20 piatră;
- **Mină**: 20 lemn, 10 grâne;
- **Lemnărie**: 10 piatră, 20 grâne.

### 10.6 Upgrade-urile
Fiecare clădire poate fi îmbunătățită până la **nivelul 3**. Upgrade-urile se realizează secvențial, în ordinea:
- **nivel 1 → nivel 2**
- **nivel 2 → nivel 3**

Costul unui upgrade de la **nivelul 1 la nivelul 2** este egal cu **dublul costului de construire** al clădirii respective.

Costul unui upgrade de la **nivelul 2 la nivelul 3** este egal cu **dublul costului upgrade-ului anterior**.

Upgrade-urile sunt instantanee. Fiecare upgrade crește:
- ritmul de producție al clădirii;
- capacitatea de stocare a acesteia.

### 10.7 Stocarea și colectarea
Fiecare clădire de producție are o capacitate proprie de stocare pentru resursele generate. Capacitatea de stocare depinde de nivelul clădirii și este egală cu:

- **60 unități** pentru nivelul 1;
- **120 unități** pentru nivelul 2;
- **180 unități** pentru nivelul 3.

Stocarea este gestionată separat pentru fiecare clădire. Resursele produse automat se acumulează în stocarea internă a clădirii până în momentul colectării.

Colectarea resurselor se face manual, printr-o acțiune explicită a jucătorului. În momentul colectării, resursele acumulate în stocarea clădirii sunt transferate instant în stocul general al jucătorului.

Dacă o clădire atinge capacitatea maximă de stocare, producția suplimentară se pierde până când spațiul este eliberat prin colectare. 

### 10.8 Piața
Piața funcționează sub forma unui board global de oferte active, accesibil tuturor participanților din sesiune. În cadrul pieței pot exista două tipuri de oferte:
- **oferte de vânzare**;
- **oferte de cumpărare**.

Toate ofertele active sunt vizibile tuturor jucătorilor și boților. Piața poate fi consultată de jucători prin ecranul dedicat de vizualizare a pieței.

O ofertă conține cel puțin următoarele informații:
- tipul ofertei;
- resursa vizată;
- prețul per unitate;
- cantitatea minimă acceptată;
- cantitatea maximă disponibilă;
- perioada de valabilitate.

Atunci când un participant acceptă o ofertă, acesta selectează cantitatea dorită în limitele stabilite de creatorul ofertei. Tranzacția se finalizează doar dacă sunt respectate condițiile ofertei și dacă serverul validează resursele și fondurile implicate.

În locul acceptării directe, un participant poate trimite o **contraofertă** către creatorul ofertei inițiale. Contraoferta se adresează direct acestuia și poate modifica doar **prețul**, nu și intervalul de cantitate stabilit prin oferta originală. Creatorul ofertei inițiale poate accepta sau refuza contraoferta.

Fiecare ofertă are un timp limitat de disponibilitate. Creatorul unei oferte poate reînnoi perioada de valabilitate a acesteia printr-o acțiune de refresh.

Piața este deschisă doar în intervalul **09:00–17:00** in-game. În afara acestui interval nu pot fi lansate, acceptate sau negociate oferte.

Galbenii circulă în economie prin intermediul tranzacțiilor de piață și prin reciclarea resurselor.

### 10.9 Reciclarea / vânzarea în void
Reciclarea reprezintă mecanismul prin care un jucător poate converti direct resurse în galbeni fără a avea nevoie de un alt participant pe piață. Din punct de vedere funcțional, reciclarea echivalează cu o vânzare către sistem.

Valoarea obținută prin reciclare este intenționat inferioară valorii care ar putea fi obținute printr-o tranzacție avantajoasă pe piață. Din acest motiv, reciclarea are rolul de mecanism de rezervă sau de lichidare rapidă, nu de sursă optimă de profit.

Reciclarea este disponibilă permanent, inclusiv în afara programului pieței. Aceasta oferă jucătorului o modalitate sigură, dar mai puțin eficientă, de a obține galbeni atunci când nu găsește parteneri de tranzacție sau când are nevoie urgentă de lichiditate.

Utilizarea repetată și agresivă a reciclării poate contribui la creșterea presiunii inflaționiste din economie.

### 10.10 Inflația
Inflația este un indicator economic global, calculat exclusiv de server, care reflectă dezechilibrul general al economiei jocului. Valoarea inflației este exprimată printr-un index cuprins între **0** și **100**.

La începutul fiecărei sesiuni, inflația pornește de la o valoare fixă și redusă, egală cu **20**.

Inflația este influențată de mai mulți factori economici, printre care:
- dezechilibrul dintre cerere și ofertă;
- tranzacțiile realizate la prețuri semnificativ peste media pieței;
- utilizarea repetată și agresivă a reciclării.

În perioadele de stabilitate economică, inflația poate scădea gradual.

Pentru interpretare, inflația este împărțită în următoarele praguri:
- **0–24**: stabilă;
- **25–49**: ridicată;
- **50–74**: critică;
- **75–100**: colaps iminent.

Nivelul inflației influențează starea generală a economiei și afectează dinamica pieței, inclusiv prețurile medii de referință ale resurselor.

Inflația nu crește artificial din lipsa de activitate a jucătorilor. Inacțiunea este penalizată separat, prin neatingerea pragului minim de performanță economică necesar pentru succesul sesiunii.

### 10.11 Finalul jocului
O sesiune standard se încheie la finalul zilei de **vineri**, la ora **20:00** in-game.

Rezultatul unei sesiuni este evaluat în primul rând la nivel colectiv. Pentru ca sesiunea să fie considerată reușită, jucătorii trebuie să îndeplinească simultan două condiții:
- să mențină economia într-o stare suficient de stabilă, fără atingerea unui nivel incompatibil cu obiectivul colectiv al jocului;
- să atingă un prag minim de performanță economică până la finalul sesiunii.

Sesiunea este considerată pierdută dacă, la finalul acesteia:
- economia se află într-o stare de instabilitate severă, reflectată printr-un nivel prea ridicat al inflației; sau
- performanța economică totală a jucătorilor este insuficientă.

În versiunea de bază a jocului nu există condiții de eșec anticipat. Evaluarea finală are loc doar la încheierea naturală a sesiunii.

Pe lângă rezultatul colectiv, fiecare jucător primește la final și o evaluare individuală sub formă de **rang**. Acest rang este derivat din performanța economică proprie a jucătorului și din contribuția sa la evoluția generală a sesiunii.

## 11. Fluxurile utilizatorului

### 11.1 Register
**Scop:** crearea unui cont nou de utilizator.

**Pași principali:**
- utilizatorul accesează formularul de înregistrare;
- introduce datele necesare pentru crearea contului;
- sistemul validează datele introduse;
- dacă datele sunt valide, contul este creat și salvat.

**Rezultat:** utilizatorul obține un cont și poate continua către autentificare.

### 11.2 Login / Logout
**Scop:** accesul utilizatorului la funcționalitățile jocului prin autentificare.

**Pași principali:**
- utilizatorul introduce datele de autentificare;
- sistemul validează identitatea acestuia;
- la autentificare reușită, utilizatorul primește acces la meniul principal;
- utilizatorul poate alege ulterior să se delogheze.

**Rezultat:** utilizatorul intră sau iese din sesiunea sa autenticată.

### 11.3 Creare lobby
**Scop:** inițierea unui spațiu de joc în care se pot reuni participanții înaintea sesiunii.

**Pași principali:**
- jucătorul selectează opțiunea de creare a unui lobby;
- stabilește caracterul public sau privat al lobby-ului;
- sistemul creează lobby-ul și, dacă este cazul, generează un cod de acces;
- jucătorul care a creat lobby-ul primește rolul de Host.

**Rezultat:** este creat un lobby nou, pregătit pentru alăturarea altor participanți.

### 11.4 Join lobby
**Scop:** alăturarea unui jucător la un lobby existent.

**Pași principali:**
- jucătorul selectează un lobby public sau introduce codul unui lobby privat;
- sistemul verifică disponibilitatea lobby-ului;
- dacă alăturarea este permisă, jucătorul este adăugat în lobby.

**Rezultat:** jucătorul devine participant în lobby și poate aștepta începerea sesiunii.

### 11.5 Ready / Unready
**Scop:** semnalarea stării de pregătire înaintea începerii sesiunii.

**Pași principali:**
- jucătorul își poate marca statusul ca Ready sau Not Ready;
- sistemul actualizează starea vizibilă în lobby;
- Host-ul poate verifica dacă toți participanții sunt pregătiți.

**Rezultat:** lobby-ul reflectă în orice moment starea de pregătire a fiecărui participant.

### 11.6 Lansare sesiune
**Scop:** începerea efectivă a partidei multiplayer.

**Pași principali:**
- Host-ul inițiază pornirea sesiunii;
- sistemul verifică îndeplinirea condițiilor de start;
- sunt generate hărțile individuale;
- sunt inițializate resursele, moneda și economia globală;
- jucătorii sunt transferați în sesiunea activă.

**Rezultat:** partida începe, iar toți participanții intră în gameplay-ul propriu-zis.

### 11.7 Gameplay in-session
**Scop:** desfășurarea activităților economice din timpul sesiunii.

**Pași principali:**
- jucătorul colectează resursele produse;
- construiește și îmbunătățește clădiri;
- consultă piața și indicatorii economici;
- lansează, acceptă sau negociază oferte;
- își adaptează strategia în funcție de evoluția economiei și de deciziile celorlalți jucători.

**Rezultat:** economia jucătorului și economia globală evoluează până la finalul sesiunii.

### 11.8 Părăsire sesiune
**Scop:** ieșirea unui jucător din lobby sau din sesiunea de joc.

**Pași principali:**
- jucătorul selectează opțiunea de părăsire;
- sistemul înregistrează ieșirea acestuia;
- dacă ieșirea are loc înainte de start, jucătorul este eliminat din lobby;
- dacă ieșirea are loc în timpul unei sesiuni, serverul gestionează impactul asupra stării jocului conform regulilor stabilite.

**Rezultat:** jucătorul nu mai participă la lobby sau la sesiunea curentă.

### 11.9 Reconnect / disconnect handling
**Scop:** gestionarea situațiilor în care un jucător pierde conexiunea și revine ulterior.

**Pași principali:**
- serverul detectează deconectarea jucătorului;
- starea jocului rămâne autoritativ gestionată de server;
- la reconectare, jucătorul este resincronizat cu starea curentă a sesiunii;
- dacă reconectarea nu este posibilă, sesiunea continuă conform regulilor stabilite de sistem.

**Rezultat:** întreruperile de conexiune sunt gestionate fără compromiterea consistenței jocului.

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
| ID       | Decizie                               | Status | Observații |
| -------- | ------------------------------------- | ------ | ---------- |
| GAME-001 | 1 secundă reală = 1 minut în joc      | Canon  |            |
| GAME-002 | Piața este deschisă între 09:00–17:00 | Canon  |            |
| GAME-003 | Serverul este autoritativ             | Canon  |            |

## 18. Întrebări deschise
- [x] Numărul final de jucători per sesiune
- [x] Piață globală vs P2P vs hibrid
- [ ] Formula exactă a inflației
- [ ] Rolul exact al boților
- [x] Condiții precise de win/lose

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
