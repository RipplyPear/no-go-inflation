---
title: Masterdoc
status: stable
version: 1.0
lastUpdated: 17-04-2026
description: Project source of truth
---

# Masterdoc - No-go Inflation
***
> **Status:** referință istorică de proiectare. Documentul surprinde decizii și idei din perioada de dezvoltare; pentru funcționalitățile implementate și documentația actuală, consultați [prezentarea proiectului](../project-overview-ro.md) și codul sursă.

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

Versiunea de licență a proiectului urmărește implementarea unui MVP funcțional al jocului No-go Inflation, cu accent pe mecanicile principale de multiplayer, producție, tranzacționare și stabilitate economică.

În scope intră:

* sistem de autentificare pentru jucători;
* creare și alăturare la lobby-uri prin cod;
* lansarea unei sesiuni multiplayer de către host;
* hartă individuală pentru fiecare jucător;
* hartă generată dinamic la începutul sesiunii;
* producția a 3 resurse de bază: lemn, piatră și grâne;
* construire și upgrade de clădiri;
* colectarea resurselor produse;
* piață comună pentru tranzacții, bazată pe oferte;
* tranzacții între jucători;
* calcul și afișare a indicatorilor economici, inclusiv inflația;
* final de joc și evaluare individuală pe ranguri;
* server autoritativ pentru validarea acțiunilor;
* persistență de bază în baza de date pentru utilizatori, sesiuni, participanți, clădiri, oferte, tranzacții și rezultate.

### 4.2 Out of scope

Pentru a menține proiectul într-un scope realist pentru o lucrare de licență, următoarele funcționalități nu intră în versiunea curentă:

* matchmaking automat;
* listă publică de lobby-uri;
* suport pentru sesiuni cu mai mult de 8 jucători;
* export pe mobil;
* chat între jucători;
* sistem de prieteni sau invitații;
* reconectare avansată la sesiuni întrerupte;
* ranking global între sesiuni;
* scalare orizontală reală;
* sisteme economice foarte avansate;
* variante alternative complexe de reguli;
* interfață grafică la nivel de produs comercial.

### 4.3 Nice to have / extensii ulterioare

Următoarele funcționalități pot fi dezvoltate ulterior, dar nu sunt necesare pentru validarea MVP-ului:

* boți pentru completarea sesiunilor sau susținerea activității economice minime;
* comportamente complexe pentru boți;
* „Bilet spre Bahamas” - final greedy, individual;
* contraoferte și negociere mai avansată;
* piață mai sofisticată;
* statistici și istorice detaliate, inclusiv grafice;
* mod solo extins;
* evenimente economice speciale de tip „wildcard”;
* îmbunătățiri vizuale și animații suplimentare.


## 5. Principii canonice de design
- **Server autoritativ**  
  Serverul validează și procesează acțiunile relevante. Clientul afișează starea și trimite intenții.

- **Gameplay cooperativ cu componentă individuală**  
  Jocul este în primul rând cooperativ, dar fiecare jucător își dezvoltă propria economie și primește o evaluare individuală la final.

- **Stabilitatea economică are prioritate față de profitul agresiv**

- **Economie accesibilă conceptual, dar interesantă strategic**

- **Informații economice relevante vizibile jucătorilor**  
  - resursele proprii;
  - starea pieței;
  - starea inflației;
  - cererea și oferta relevante, dacă sunt expuse în UI;
  - ofertele lansate de ceilalți jucători.

- **Inacțiunea este penalizată prin performanță economică slabă**  
  Jucătorii trebuie să atingă un prag minim de performanță economică.

- **Rejucabilitate prin generare de hartă și dinamica pieței**

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
Botul este un actor software controlat exclusiv de server, cu rolul de a susține funcționarea ecosistemului economic al jocului. În varianta canonică a proiectului, boții au două roluri principale:
- completarea sesiunilor mici, atunci când este necesar;
- menținerea unui nivel minim de activitate economică pe piață.

Boții sunt adăugați de server la începutul sesiunii, dacă regulile de configurare ale partidei o cer. Ei nu au client propriu și nu interacționează cu jocul printr-o interfață separată.

În versiunea de bază, boții pot:
- produce resurse într-un mod controlat;
- lansa oferte de cumpărare și vânzare pe piață;
- accepta oferte compatibile cu regulile lor interne;
- reacționa la prețurile de referință și la nivelul inflației.

În versiunea de bază, boții nu:
- construiesc clădiri;
- realizează upgrade-uri;
- urmăresc strategii complexe pe termen lung;
- destabilizează intenționat economia.

Comportamentul boților este bazat pe reguli simple definite de server. Scopul lor nu este să înlocuiască fidel un jucător uman, ci să susțină funcționarea sesiunii și să reducă riscul unei piețe complet inactive.

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

| Activitate                           | Jucător   | Bot               | Server                  |
| ------------------------------------ | --------- | ----------------- | ----------------------- |
| Înregistrare / autentificare         | Da        | Nu                | Nu                      |
| Creare lobby                         | Da        | Nu                | Da                      |
| Alăturare la lobby                   | Da        | Adăugat de sistem | Da                      |
| Părăsire lobby                       | Da        | Nu                | Da                      |
| Ready / Not Ready                    | Da        | Nu                | Da                      |
| Lansare sesiune                      | Da (Host) | Nu                | Da                      |
| Producție de resurse                 | Da        | Da                | Nu                      |
| Construire / upgrade                 | Da        | Nu                | Validare                |
| Colectare resurse                    | Da        | Nu                | Validare                |
| Lansare ofertă pe piață              | Da        | Da                | Administrare / validare |
| Acceptare ofertă                     | Da        | Da                | Administrare / validare |
| Vizualizare indicatori economici     | Da        | Da                | Da                      |
| Calcul inflație / procesare economie | Nu        | Nu                | Da                      |
| Persistență date                     | Nu        | Nu                | Da                      |
| Gestionare boți                      | Nu        | Nu                | Da                      |

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

Boții pot fi adăugați de server la începutul unei sesiuni pentru a completa sesiunile mici sau pentru a susține activitatea economică minimă a pieței. Prezența boților nu este obligatorie pentru pornirea unei sesiuni.

În versiunea de bază, boții participă la economie într-un mod limitat și controlat. Ei pot produce resurse și tranzacționa pe piață, dar nu construiesc clădiri și nu realizează upgrade-uri.

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

Toate ofertele active sunt vizibile tuturor jucătorilor și boților. Piața poate fi consultată de jucători prin interfața dedicată de piață, accesată din ecranul principal de joc.

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

Inflația urmează un model **hibrid de actualizare**:
- are o **recalculare periodică** la fiecare **30 de minute in-game**;
- poate primi **impulsuri imediate** în urma unor acțiuni economice cu impact puternic, precum reciclarea excesivă sau tranzacțiile realizate la prețuri mult peste media de referință.

La fiecare recalculare periodică, serverul actualizează inflația pe baza unei formule conceptuale de forma:

> inflație nouă = inflație veche + presiune cerere/ofertă + presiune de suprapreț + presiune din reciclare - factor de stabilizare

În mod canonic, cei trei factori care cresc inflația sunt:
- **presiunea cerere/ofertă**, generată de dezechilibre semnificative între cererea și oferta de pe piață;
- **presiunea de suprapreț**, generată de tranzacții realizate semnificativ peste media de referință a resursei tranzacționate;
- **presiunea din reciclare**, generată de utilizarea repetată și agresivă a reciclării într-un interval scurt de timp.

Inflația poate și **scădea**, dar nu în mod automat sau arbitrar. Scăderea are loc doar în perioade în care economia este relativ stabilă, iar piața nu prezintă dezechilibre puternice. În mod conceptual, factorul de stabilizare apare atunci când:
- diferențele dintre cerere și ofertă rămân moderate;
- tranzacțiile recente nu se abat puternic de la media pieței;
- reciclarea nu este folosită excesiv.

Pentru a evita variațiile haotice, serverul limitează inflația în intervalul **0–100** și o actualizează într-un ritm controlat, astfel încât aceasta să reacționeze vizibil la comportamente economice problematice, dar fără oscilații disproporționate produse de un număr foarte mic de acțiuni.

Pentru interpretare, inflația este împărțită în următoarele praguri:
- **0–24**: stabilă;
- **25–49**: ridicată;
- **50–74**: critică;
- **75–100**: colaps iminent.

Nivelul inflației influențează direct starea generală a economiei și afectează dinamica pieței, inclusiv **prețurile medii de referință** ale resurselor. De asemenea, inflația contribuie direct la evaluarea rezultatului final al sesiunii și poate influența comportamentul sistemelor auxiliare, inclusiv al boților, în funcție de implementarea aleasă.

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

În varianta canonică minimă, la finalul unei sesiuni sunt determinate și pot fi salvate sau afișate cel puțin următoarele informații:
- rezultatul colectiv al sesiunii;
- valoarea finală a inflației;
- rangul fiecărui jucător;
- scorul economic individual;
- numărul de tranzacții realizate de fiecare jucător;
- valoarea totală tranzacționată de fiecare jucător;
- cantitatea totală reciclată de fiecare jucător.

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
- dacă alăturarea este permisă, jucătorul este adăugat în lobby-ul activ.

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

### 12.1 Principii generale de UI
Interfața jocului urmărește să ofere jucătorului acces rapid la informațiile esențiale despre propria economie, despre starea pieței și despre progresul sesiunii, fără a încărca excesiv ecranul principal.

La nivel general, UI-ul respectă următoarele principii:
- informațiile critice pentru gameplay trebuie să fie vizibile permanent sau accesibile printr-un număr minim de interacțiuni;
- ecranul principal de joc rămâne centrul experienței in-session;
- funcționalitățile secundare, precum piața, chat-ul și setările, sunt accesibile fără părăsirea contextului curent de joc;
- elementele de interfață trebuie să susțină claritatea deciziilor economice, nu să distragă atenția de la hartă și de la resurse;
- navigarea dintre ecrane trebuie să fie simplă și previzibilă.

În timpul unei sesiuni, piața este accesată sub forma unui overlay dedicat, iar chat-ul sub forma unui panel lateral retractabil. Astfel, jucătorul poate interacționa cu sistemele importante ale jocului fără a pierde complet contextul gameplay-ului.

### 12.2 Splash screen
**Scop:** introducerea vizuală în joc și tranziția către meniul principal.

**Elemente afișate:**
- titlul jocului;
- identitatea vizuală de bază a proiectului;
- mesaj de tipul „Press any button to continue”.

**Acțiuni posibile:**
- continuarea către meniul principal prin apăsarea unei taste sau prin click / tap.

**Tranziții:**
- către **Meniul principal**.

Splash screen-ul are rol minimalist și nu reprezintă un spațiu de interacțiune complexă. Rolul său este de a marca intrarea în joc și de a oferi o introducere vizuală scurtă înaintea accesării meniului principal.

### 12.3 Meniu principal
**Scop:** punctul central de acces către funcționalitățile principale disponibile în afara sesiunii de joc.

**Elemente afișate:**
- titlul jocului;
- buton pentru **Join Game**;
- buton pentru **Host Game**;
- buton pentru **Setări**;
- buton pentru **Despre**;
- opțiune de logout, dacă utilizatorul este autentificat.

**Acțiuni posibile:**
- navigarea către alăturarea la un lobby existent;
- navigarea către crearea unui lobby nou;
- deschiderea meniului de setări;
- deschiderea ecranului „Despre”;
- delogarea din contul curent.

**Tranziții:**
- către **Ecran Join Game**;
- către **Ecran Host Game**;
- către **Setări**;
- către **Despre**;
- către fluxul de autentificare, în cazul logout-ului.

Meniul principal funcționează ca hub pentru toate activitățile premergătoare unei sesiuni de joc.

### 12.4 Ecran Join Game
**Scop:** alăturarea unui jucător la un lobby existent.

**Elemente afișate:**
- câmp pentru introducerea codului unui lobby privat;
- listă a lobby-urilor publice disponibile;
- informații minimale despre fiecare lobby public, precum codul sau identificatorul, numărul curent de participanți și starea acestuia;
- buton de join pentru lobby-urile eligibile;
- buton de întoarcere la meniul principal.

**Acțiuni posibile:**
- introducerea unui cod de acces pentru un lobby privat;
- selectarea unui lobby public din listă;
- alăturarea la un lobby valid;
- întoarcerea la meniul principal.

**Tranziții:**
- către **lobby-ul activ**, după join reușit;
- către **Meniul principal**, prin acțiunea de back.

Acest ecran este dedicat exclusiv descoperirii și accesării unui lobby deja existent. El nu include opțiuni de creare sau administrare a unui lobby nou.

### 12.5 Ecran Host Game
**Scop:** crearea și administrarea unui lobby înainte de începerea sesiunii.

**Elemente afișate:**
- opțiune pentru alegerea caracterului **public** sau **privat** al lobby-ului;
- codul lobby-ului, dacă acesta este privat;
- lista participanților curenți;
- statusul fiecărui participant: **Ready / Not Ready**;
- evidențierea jucătorului care are rolul de **Host**;
- buton pentru lansarea sesiunii;
- buton pentru anularea / părăsirea lobby-ului.

**Acțiuni posibile:**
- crearea unui lobby nou;
- schimbarea stării lobby-ului între public și privat, dacă regulile implementării permit acest lucru;
- vizualizarea participanților și a statusului lor;
- marcarea propriului status ca Ready / Not Ready;
- lansarea sesiunii de către Host, dacă sunt îndeplinite condițiile de start;
- anularea și revenirea la meniul principal.

**Tranziții:**
- către **Ecranul principal de joc**, după lansarea sesiunii;
- către **Meniul principal**, dacă lobby-ul este părăsit sau anulat.

Acest ecran funcționează și ca spațiu de așteptare înaintea începerii sesiunii. Pentru jucătorii care nu sunt Host, el rămâne locul în care pot vedea componența lobby-ului și își pot actualiza starea de pregătire.

În practică, acest ecran reprezintă și forma principală de afișare a lobby-ului activ înainte de startul sesiunii.

### 12.6 Setări
**Scop:** configurarea preferințelor generale de utilizare și a opțiunilor de bază ale jocului.

**Elemente afișate:**
- controale pentru volum;
- controale pentru luminozitate sau alte ajustări vizuale de bază;
- eventuale opțiuni suplimentare de configurare a experienței locale;
- buton de închidere / întoarcere.

**Acțiuni posibile:**
- modificarea parametrilor audio;
- modificarea parametrilor vizuali;
- salvarea sau aplicarea locală a preferințelor;
- închiderea ecranului de setări.

**Tranziții:**
- către **Meniul principal**, dacă setările sunt accesate din afara jocului;
- înapoi către **Ecranul principal de joc**, dacă setările sunt accesate în timpul sesiunii.

Setările sunt accesibile atât din meniul principal, cât și din timpul jocului. În timpul sesiunii, ele apar ca overlay și nu schimbă structura de bază a gameplay-ului.

### 12.7 Despre
**Scop:** prezentarea informațiilor descriptive despre proiect.

**Elemente afișate:**
- scurtă descriere a jocului;
- informații despre scopul proiectului;
- eventual informații despre autor și contextul de realizare;
- buton de întoarcere.

**Acțiuni posibile:**
- consultarea informațiilor prezentate;
- revenirea la meniul principal.

**Tranziții:**
- către **Meniul principal**.

Acest ecran are rol exclusiv informativ și nu influențează în mod direct fluxurile de gameplay.

### 12.8 Ecran principal de joc
**Scop:** spațiul principal în care jucătorul își desfășoară activitatea economică pe parcursul sesiunii.

**Elemente afișate:**
- harta individuală a jucătorului;
- loturile și clădirile construite pe acestea;
- HUD cu resursele deținute de jucător;
- indicator pentru ziua și ora curentă din joc;
- acces rapid către piață;
- acces rapid către chat;
- acces rapid către setări;
- acces rapid către acțiunea de părăsire a sesiunii;
- indicatori economici relevanți, în forma aleasă pentru implementare.

**Acțiuni posibile:**
- selectarea loturilor și a clădirilor;
- construirea unei clădiri pe un lot valid;
- realizarea de upgrade-uri pentru clădirile existente;
- colectarea resurselor stocate în clădiri;
- deschiderea overlay-ului de piață;
- deschiderea sau ascunderea panel-ului de chat;
- deschiderea overlay-ului de setări;
- părăsirea sesiunii;
- consultarea stării economice proprii și a unor indicatori globali relevanți.

**Tranziții:**
- către **Piață**, sub formă de overlay;
- către **Setări**, sub formă de overlay;
- către **Meniul principal** sau fluxul corespunzător, dacă sesiunea este părăsită;
- către ecranul sau starea de final de joc, la încheierea sesiunii.

Ecranul principal de joc este centrul experienței in-session. Toate celelalte componente importante ale interfeței din timpul sesiunii sunt gândite astfel încât să poată fi accesate fără a scoate complet jucătorul din contextul acestui ecran.

### 12.9 Piață
**Scop:** consultarea stării pieței și realizarea interacțiunilor comerciale dintre participanți.

**Tip de interfață:** overlay deschis din ecranul principal de joc.

**Elemente afișate:**
- prețurile medii de referință ale resurselor;
- starea curentă a inflației;
- lista ofertelor active;
- informațiile relevante ale fiecărei oferte, precum tipul, resursa, prețul, limitele de cantitate și valabilitatea;
- acțiuni pentru lansarea unei oferte noi;
- acțiuni pentru acceptarea unei oferte existente;
- acțiuni pentru formularea unei contraoferte, unde este permis.

**Acțiuni posibile:**
- consultarea pieței globale;
- lansarea unei oferte de cumpărare;
- lansarea unei oferte de vânzare;
- acceptarea unei oferte existente;
- trimiterea unei contraoferte către creatorul unei oferte;
- închiderea overlay-ului și revenirea imediată la ecranul principal de joc.

**Tranziții:**
- deschidere din **Ecranul principal de joc**;
- închidere înapoi către **Ecranul principal de joc**.

Piața nu este tratată ca ecran complet separat la nivel de experiență, ci ca o interfață contextuală peste gameplay. Astfel, jucătorul poate verifica rapid starea economică și poate reveni imediat la gestionarea propriei hărți.

### 12.10 Chat
**Scop:** comunicarea rapidă dintre participanții unei sesiuni.

**Tip de interfață:** panel lateral retractabil disponibil în timpul jocului.

**Elemente afișate:**
- istoricul recent al mesajelor;
- identificarea autorilor mesajelor;
- câmp de introducere a unui mesaj nou;
- control pentru trimiterea mesajului;
- control pentru ascunderea sau redeschiderea panel-ului.

**Acțiuni posibile:**
- citirea mesajelor transmise de ceilalți participanți;
- redactarea și trimiterea unui mesaj nou;
- extinderea sau restrângerea zonei de chat;
- ascunderea temporară a panel-ului pentru a elibera spațiu vizual.

**Tranziții:**
- deschidere și închidere contextuală din **Ecranul principal de joc**.

Chat-ul nu reprezintă un ecran separat în sens clasic, ci o componentă UI persistentă și contextuală a sesiunii. Rolul său este de a susține cooperarea și coordonarea între jucători fără a întrerupe fluxul gameplay-ului.

### 12.11 Relația dintre ecrane
La nivel conceptual, navigarea principală dintre ecrane urmează structura:
- **Splash screen** → **Meniu principal**
- **Meniu principal** → **Join Game** / **Host Game** / **Setări** / **Despre**
- **Join Game** / **Host Game** → lobby activ
- lobby activ → **Ecran principal de joc**
- **Ecran principal de joc** → **Piață** / **Setări** / **Chat** (contextual) / părăsire sesiune

În afara sesiunii, navigarea este centrată pe meniul principal. În timpul sesiunii, navigarea este centrată pe ecranul principal de joc, iar celelalte componente sunt accesate contextual, sub formă de overlay sau panel.

### 12.12 Observații de implementare
La nivel de implementare în Godot, este recomandat ca ecranul principal de joc să rămână scena centrală a sesiunii, iar componente precum piața, chat-ul și setările să fie tratate drept interfețe auxiliare suprapuse peste aceasta.

Această organizare:
- reduce fragmentarea experienței utilizatorului;
- menține jucătorul conectat permanent la contextul propriei economii;
- simplifică navigarea in-session;
- se aliniază structurii canonice a gameplay-ului și priorității acordate hărții și stării economice curente.

## 13. Arhitectură logică de nivel înalt

### 13.1 Client
Clientul jocului este implementat în Godot și reprezintă componenta responsabilă de prezentarea interfeței, captarea inputului utilizatorului și afișarea stării curente a sesiunii.

Din punct de vedere logic, clientul are un rol deliberat limitat. Acesta:
- afișează ecranele și elementele de UI;
- redă harta, clădirile, resursele și indicatorii economici;
- transmite către server intențiile jucătorului, precum construirea, upgrade-ul, colectarea sau interacțiunile cu piața;
- primește de la server actualizări de stare și le reflectă în interfață;
- poate gestiona local doar stări de prezentare sau feedback vizual temporar.

Clientul nu reprezintă sursa de adevăr a jocului. El nu decide validitatea acțiunilor economice și nu actualizează definitiv starea sesiunii pe cont propriu. Orice modificare relevantă de gameplay devine validă doar după confirmarea serverului.

Această separare permite menținerea consistenței între participanți și reduce riscul apariției unor diferențe între starea afișată local și starea reală a sesiunii.

### 13.2 Server
Serverul reprezintă componenta centrală și autoritativă a sistemului. Acesta validează toate acțiunile relevante, menține starea sesiunilor active, procesează logica economică și sincronizează participanții conectați.

La nivel logic, serverul este împărțit în mai multe responsabilități principale:

- **Authentication Module**  
  gestionează înregistrarea, autentificarea, validarea identității și mecanismele asociate sesiunii utilizatorului;

- **Lobby & Session Management**  
  gestionează crearea lobby-urilor, alăturarea participanților, statusurile Ready / Not Ready, rolul de Host și tranziția către sesiunea activă;

- **Realtime Gateway / WebSocket Hub**  
  gestionează conexiunile active, trimiterea și primirea mesajelor realtime, broadcast-ul actualizărilor și resincronizarea stării;

- **Game Engine**  
  aplică regulile canonice ale jocului, gestionează timpul in-game, starea hărților, clădirile, producția și celelalte mecanici de bază;

- **Market / Trade Processing**  
  gestionează board-ul de oferte, validarea tranzacțiilor, acceptarea ofertelor și procesarea contraofertelor;

- **Economy & Inflation Module**  
  calculează și actualizează indicatorii economici relevanți, inclusiv inflația și valorile de referință folosite în piață;

- **Bot Manager**  
  controlează comportamentul boților și participarea acestora în sesiuni;

- **Persistence Layer**  
  intermediază salvarea și încărcarea datelor relevante din baza de date.

La nivel de procesare, arhitectura serverului urmează un model hibrid:
- **event-driven** pentru acțiunile inițiate explicit de jucători, precum login, join lobby, construire, colectare sau tranzacții;
- **tick-based** pentru evoluția timpului de joc și pentru actualizările economice periodice care trebuie evaluate la intervale regulate.

Această abordare permite menținerea unei logici clare și reactive, fără a transforma toate mecanismele jocului într-o simulare rigidă bazată exclusiv pe tick-uri.

### 13.3 Baza de date
Baza de date are rolul de a asigura persistența informațiilor importante ale sistemului și de a permite stocarea sigură a datelor necesare în afara sesiunilor active.

În arhitectura logică a proiectului, PostgreSQL este utilizat pentru:
- stocarea conturilor de utilizator și a datelor necesare autentificării;
- stocarea datelor persistente asociate jucătorilor;
- stocarea metadatelor relevante despre lobby-uri și sesiuni;
- logarea tranzacțiilor importante;
- salvarea rezultatelor finale și a informațiilor utile pentru analiză sau istoric.

Baza de date nu este tratată ca mecanism principal pentru menținerea întregii stări runtime a unei sesiuni active. În timpul jocului, starea curentă a sesiunii este menținută în principal de server, în memorie, pentru a permite actualizări rapide și sincronizare realtime eficientă.

Astfel, baza de date este responsabilă în primul rând de persistență și audit, nu de simularea directă a sesiunii active.

### 13.4 Comunicare realtime
Comunicarea dintre client și server este împărțită în două categorii principale, în funcție de natura interacțiunii:

- **comunicare de tip request / response pentru operații pre-game sau administrative**;
- **comunicare realtime pentru sesiunea de joc și sincronizarea stării**.

În mod canonic:
- operațiile de tip înregistrare, autentificare și alte interacțiuni de bootstrap pot fi tratate prin endpoint-uri REST;
- lobby-ul activ, gameplay-ul propriu-zis și actualizările de stare folosesc comunicare prin **WebSocket**.

Prin conexiunea WebSocket sunt transmise:
- intențiile de acțiune ale jucătorului;
- actualizările de stare ale sesiunii;
- modificările pieței;
- actualizările privind timpul in-game;
- mesajele de chat;
- evenimentele relevante de conectare, deconectare și resincronizare.

Această separare permite păstrarea unei structuri clare:
- operațiile clasice, rare și bine delimitate rămân în zona request / response;
- componentele dependente de latență redusă și frecvență mare de actualizare sunt tratate prin canal realtime dedicat.

### 13.5 Persistență
Persistența este proiectată astfel încât să rețină informațiile importante pentru continuitatea aplicației, pentru integritatea sistemului și pentru analiza ulterioară a sesiunilor, fără a încărca inutil infrastructura cu salvarea fiecărei stări tranzitorii.

În varianta canonică minimă a proiectului, sistemul persistă obligatoriu:
- datele utilizatorilor și informațiile necesare autentificării;
- sesiunile de joc și participanții asociați acestora;
- tranzacțiile finalizate relevante din punct de vedere economic;
- rezultatele finale individuale ale jucătorilor.

La nivel conceptual, entitățile persistente minime sunt:
- **User**
- **GameSession**
- **SessionParticipant**
- **TradeTransaction**
- **PlayerSessionResult**

Sistemul poate persista suplimentar, dacă este util pentru implementare:
- metadate relevante despre lobby-uri;
- loguri importante de audit sau debugging;
- statistici agregate de sesiune.

În varianta canonică de bază, nivelul de audit păstrat este unul **minim-mediu**. Auditul urmărește doar evenimente importante pentru trasabilitate, debugging și analiză post-sesiune, fără a încerca să persiste fiecare acțiune minoră sau fiecare stare intermediară a jocului.

În mod canonic, auditul poate include:
- începutul sesiunii;
- finalul sesiunii;
- tranzacțiile finalizate;
- reciclările;
- deconectările și reconectările;
- adăugarea boților la începutul sesiunii, dacă este relevantă pentru configurarea partidei.

În schimb, elementele strict tranzitorii ale unei partide sunt tratate în principal ca **runtime state** și sunt menținute de server în memorie pe durata sesiunii. În varianta canonică de bază, sistemul nu persistă obligatoriu:
- ofertele active sau expirate;
- istoricul complet al chat-ului;
- hărțile generate pentru sesiunea curentă;
- starea completă și continuă a clădirilor în timp;
- toate valorile intermediare ale inflației;
- fiecare eveniment minor de gameplay.

Această decizie simplifică arhitectura, reduce costul persistenței și este adecvată pentru scope-ul proiectului de licență.

### 13.6 Rolul boților
Boții sunt entități controlate exclusiv de server și fac parte din logica internă a sesiunii. Ei nu au client propriu și nu interacționează cu jocul printr-o interfață separată.

În varianta canonică a proiectului, boții au două roluri principale:
- completarea sesiunilor mici, atunci când este necesar;
- menținerea unui nivel minim de activitate economică pe piață.

Boții sunt introduși de server la începutul sesiunii, conform regulilor de configurare ale partidei. În versiunea de bază, ei nu apar și nu dispar dinamic în timpul sesiunii.

Din perspectivă arhitecturală, boții:
- sunt generați și administrați de server;
- pot produce resurse într-un mod controlat;
- pot lansa și accepta oferte pe piață;
- folosesc aceleași reguli economice de bază ca jucătorii umani, în limitele definite de sistem;
- nu construiesc clădiri și nu realizează upgrade-uri în versiunea de bază;
- nu introduc o sursă separată de adevăr și nu ocolesc validarea logicii server-side.

Comportamentul boților este bazat pe reguli simple, nu pe strategii complexe sau pe o simulare avansată de tip AI. Boții reacționează la contextul economic al sesiunii, inclusiv la prețurile de referință și la nivelul inflației.

În condiții de inflație ridicată, boții adoptă un comportament mai prudent și evită acțiunile care ar accentua dezechilibrul economic. Astfel, ei pot contribui la stabilizarea pieței fără a deveni actori dominanți sau greu de controlat din punct de vedere al balancing-ului.

Bot Manager-ul decide acțiunile boților pe baza stării sesiunii și a regulilor economice urmărite de sistem. Scopul boților nu este să înlocuiască fidel jucătorii umani, ci să susțină funcționarea sesiunii și să reducă riscul unei piețe complet inactive.

### 13.7 Relația dintre componente
La nivel conceptual, arhitectura logică a sistemului urmează următorul model:
- clientul afișează și colectează input;
- serverul validează, procesează și sincronizează;
- baza de date persistă informațiile relevante;
- boții sunt gestionați intern de server;
- comunicarea realtime este realizată prin WebSocket, iar operațiile pre-game prin mecanisme request / response adecvate.

Această structură susține cerințele canonice ale proiectului:
- server autoritativ;
- gameplay multiplayer sincronizat;
- economie procesată centralizat;
- persistență sigură a informațiilor importante;
- separare clară între prezentare, logică și stocare.

### 13.8 Observații de implementare
Arhitectura logică descrisă în această secțiune este una de nivel înalt și nu impune o structură rigidă de directoare sau o implementare strict identică la nivel de cod. Rolul ei este de a defini responsabilitățile principale ale componentelor și relațiile dintre acestea.

Pentru proiectul de licență, prioritatea este păstrarea unui design clar, modular și suficient de simplu încât să poată fi implementat și testat realist în timpul disponibil. Din acest motiv, arhitectura urmărește separarea responsabilităților esențiale fără a introduce complexitate inutilă, precum microservicii reale sau sincronizări distribuite avansate.

## 14. Model de date conceptual

### 14.1 Entități persistente
Modelul de date conceptual separă entitățile care trebuie păstrate în timp de cele care există doar pe durata unei sesiuni active. Entitățile persistente sunt cele necesare pentru funcționarea aplicației dincolo de o partidă individuală, pentru autentificare, istoric, audit și evaluarea rezultatelor.
În varianta canonică minimă a proiectului, entitățile persistente obligatorii sunt: **User**, **GameSession**, **SessionParticipant**, **TradeTransaction** și **PlayerSessionResult**.

#### 14.1.1 User
Entitatea **User** reprezintă utilizatorul uman înregistrat în sistem. Aceasta păstrează informațiile necesare identificării și autentificării, precum și datele de bază asociate contului.

La nivel conceptual, un User:
- își poate crea cont și se poate autentifica;
- poate participa la mai multe sesiuni de joc în timp;
- poate crea sau se poate alătura la lobby-uri;
- poate avea rezultate individuale în sesiuni diferite.

#### 14.1.2 Lobby
Entitatea **Lobby** reprezintă spațiul premergător unei sesiuni de joc. Aceasta există pentru organizarea participanților înainte de startul partidei.

La nivel conceptual, un Lobby:
- are un creator sau Host;
- poate fi public sau privat;
- poate avea un cod de acces;
- conține o listă de participanți înainte de lansarea sesiunii;
- are o stare proprie, relevantă pentru etapa de așteptare și pregătire.

Lobby-ul este tratat în primul rând ca entitate de organizare a startului unei partide. Persistența sa nu trebuie să fie la fel de bogată precum cea a unei sesiuni finalizate, dar existența lui la nivel conceptual este utilă pentru descrierea fluxurilor de utilizator.

#### 14.1.3 GameSession
Entitatea **GameSession** reprezintă o partidă concretă a jocului, pornită dintr-un lobby și desfășurată pe durata sesiunii multiplayer.

La nivel conceptual, o GameSession:
- are un moment de start;
- poate avea un moment de final;
- are o stare generală;
- include participanții implicați;
- conține contextul economic global al partidei;
- constituie cadrul în care sunt generate hărțile individuale și se desfășoară gameplay-ul.

GameSession este una dintre entitățile centrale ale modelului de date, deoarece leagă utilizatorii, rezultatele, tranzacțiile și contextul economic al unei partide.

#### 14.1.4 SessionParticipant
Entitatea **SessionParticipant** reprezintă legătura dintre un **User** și o **GameSession**. Aceasta este necesară deoarece relația dintre utilizatori și sesiuni este de tip many-to-many: un utilizator poate participa la mai multe sesiuni, iar o sesiune conține mai mulți participanți.

La nivel conceptual, SessionParticipant:
- identifică participarea concretă a unui utilizator într-o sesiune;
- poate reține roluri sau atribute relevante pentru acea participare;
- separă identitatea persistentă a utilizatorului de starea specifică unei partide.

Această entitate permite definirea clară a relațiilor dintre jucători, rezultate finale și istoricul participărilor.

#### 14.1.5 TradeTransaction
Entitatea **TradeTransaction** reprezintă o tranzacție finalizată cu succes între două părți în cadrul unei sesiuni.

La nivel conceptual, o TradeTransaction:
- aparține unei sesiuni;
- implică un inițiator și o contraparte;
- vizează o anumită resursă;
- are o cantitate;
- are un preț sau o valoare totală;
- are un moment de realizare.

TradeTransaction este entitatea persistentă relevantă pentru istoric economic, audit și eventuale analize ulterioare. Oferta activă care a dus la tranzacție nu trebuie tratată în mod necesar ca entitate persistentă separată în modelul canonic.

#### 14.1.6 PlayerSessionResult
Entitatea **PlayerSessionResult** reprezintă evaluarea finală a unui jucător într-o anumită sesiune.

La nivel conceptual, PlayerSessionResult:
- este asociată unei GameSession;
- este asociată unui SessionParticipant;
- reflectă performanța economică individuală;
- poate include rangul final sau alte valori sintetice relevante pentru evaluare.

Această entitate permite separarea clară dintre desfășurarea sesiunii și evaluarea sa finală, păstrând în același timp rezultatele într-o formă persistentă și ușor de analizat.

#### 14.1.7 Loguri și date de audit
În funcție de nivelul de detaliu dorit la implementare, sistemul poate include și entități sau structuri persistente pentru loguri, evenimente sau audit.

În varianta canonică de bază, nivelul de audit păstrat este unul **minim-mediu** și vizează doar evenimentele importante ale sesiunii, nu întreaga evoluție completă a runtime state-ului.

La nivel conceptual, auditul poate fi folosit pentru:
- urmărirea evenimentelor importante;
- debugging;
- verificarea consistenței economice;
- analizarea sesiunilor după încheiere.

În mod canonic, auditul poate include:
- startul sesiunii;
- finalul sesiunii;
- tranzacțiile finalizate;
- reciclările;
- deconectările și reconectările;
- adăugarea boților la începutul sesiunii, dacă este relevantă.

Auditul nu urmărește în mod obligatoriu:
- fiecare acțiune minoră a jucătorului;
- fiecare click sau interacțiune de UI;
- fiecare modificare intermediară a stării sesiunii;
- fiecare variație intermediară a inflației;
- fiecare ofertă anulată sau expirată.

Aceste structuri completează partea de persistență acolo unde este util, dar nu transformă sistemul într-un mecanism de event sourcing complet.

### 14.2 Entități runtime
Entitățile runtime există în principal pe durata unei sesiuni active și sunt menținute de server în memorie pentru a permite procesare rapidă și sincronizare realtime eficientă. Ele descriu starea vie a jocului, nu istoricul său.

#### 14.2.1 SessionRuntimeState
Entitatea **SessionRuntimeState** reprezintă starea activă a unei sesiuni în desfășurare.

La nivel conceptual, aceasta include:
- timpul curent din joc;
- starea generală a economiei sesiunii;
- participanții activi;
- piața activă;
- stările runtime ale hărților, clădirilor și resurselor;
- alte valori tranzitorii necesare pentru simulare și sincronizare.

SessionRuntimeState este sursa operațională imediată a sesiunii active și este gestionată autoritativ de server.

#### 14.2.2 PlayerRuntimeState
Entitatea **PlayerRuntimeState** descrie starea curentă a unui participant în cadrul unei sesiuni active.

La nivel conceptual, aceasta poate include:
- resursele deținute în acel moment;
- galbenii disponibili;
- harta proprie din sesiune;
- clădirile active;
- statusul de conectare;
- alte informații necesare pentru gameplay-ul curent.

PlayerRuntimeState este distinctă de identitatea persistentă a utilizatorului. Ea există doar în contextul sesiunii active.

#### 14.2.3 PlayerMap
Entitatea **PlayerMap** reprezintă harta individuală a unui participant în cadrul unei sesiuni.

La nivel conceptual, PlayerMap:
- aparține unui participant dintr-o sesiune;
- are dimensiune fixă, conform regulilor canonice;
- conține loturi de mai multe tipuri;
- este generată la începutul sesiunii;
- există în primul rând ca structură runtime.

Harta nu trebuie tratată ca entitate persistentă obligatorie în modelul canonic, deoarece are rol în principal pe durata partidei.

#### 14.2.4 Lot
Entitatea **Lot** reprezintă o unitate de teren de pe harta unui jucător.

La nivel conceptual, un Lot:
- aparține unei PlayerMap;
- are un tip;
- poate conține cel mult o clădire;
- determină ce tip de clădire poate fi construit pe el.

Lotul este o entitate esențială pentru modelarea gameplay-ului, deoarece leagă geometria hărții de regulile economice de construire și producție.

#### 14.2.5 Building
Entitatea **Building** reprezintă o clădire de producție activă în cadrul unei sesiuni.

La nivel conceptual, o Building:
- este plasată pe un anumit Lot;
- are un tip;
- are un nivel;
- produce automat o resursă asociată;
- are o capacitate proprie de stocare;
- deține o cantitate curentă de resursă necolectată.

Building este una dintre entitățile centrale ale gameplay-ului runtime, deoarece influențează direct producția și evoluția economică a jucătorului.

#### 14.2.6 MarketBoard
Entitatea **MarketBoard** reprezintă piața activă a unei sesiuni.

La nivel conceptual, MarketBoard:
- aparține unei sesiuni active;
- conține ofertele active vizibile participanților;
- permite publicarea, actualizarea, expirarea și eliminarea ofertelor;
- reflectă contextul comercial al momentului.

Această entitate este parte a stării runtime, deoarece piața activă trebuie să poată fi actualizată rapid și sincronizată în timp real.

#### 14.2.7 ActiveOffer
Entitatea **ActiveOffer** reprezintă o ofertă aflată în acel moment pe piață.

La nivel conceptual, o ActiveOffer:
- aparține unui participant sau unui bot din sesiunea curentă;
- are un tip de ofertă;
- vizează o resursă;
- include prețul per unitate;
- include o cantitate minimă și o cantitate maximă;
- are o perioadă de valabilitate;
- poate fi acceptată, respinsă, expirată sau poate primi o contraofertă.

ActiveOffer este tratată canonic ca entitate runtime. Dacă o ofertă se finalizează cu succes, efectul său persistent este capturat prin entitatea TradeTransaction.

#### 14.2.8 EconomyState
Entitatea **EconomyState** descrie starea economică globală a unei sesiuni active.

La nivel conceptual, aceasta poate include:
- valorile de referință pentru resurse;
- indicatori agregați privind piața;
- semnale privind echilibrul sau dezechilibrul economic;
- alte valori necesare pentru evaluarea stării generale a sesiunii.

EconomyState este menținută și actualizată de server și influențează atât dinamica pieței, cât și evaluarea finală a sesiunii.

#### 14.2.9 InflationState
Entitatea **InflationState** reprezintă componenta runtime responsabilă de valoarea curentă a inflației și de interpretarea acesteia.

La nivel conceptual, InflationState:
- este asociată unei sesiuni active;
- are o valoare curentă;
- poate fi recalculată periodic de server;
- reflectă starea de stabilitate economică a sesiunii.

InflationState poate fi privită fie ca subcomponentă a EconomyState, fie ca entitate logică separată, în funcție de nivelul de detaliu ales la implementare. În modelul conceptual, este utilă distinct pentru claritate.

#### 14.2.10 BotRuntimeState
Entitatea **BotRuntimeState** descrie starea curentă a unui bot într-o sesiune activă.

La nivel conceptual, aceasta poate include:
- resursele și galbenii controlați de bot;
- comportamentele active relevante pentru sesiune;
- ofertele lansate de bot;
- parametrii care influențează deciziile acestuia.

BotRuntimeState există doar în contextul unei sesiuni active și este gestionată exclusiv de server.

### 14.3 Relații între entități
La nivel conceptual, relațiile principale dintre entități sunt următoarele:

- un **User** poate participa la mai multe **GameSession** în timp;
- o **GameSession** poate include mai mulți utilizatori;
- relația dintre **User** și **GameSession** este modelată prin **SessionParticipant**;
- un **Lobby** poate preceda o **GameSession**;
- o **GameSession** are una sau mai multe instanțe de **SessionParticipant**;
- un **SessionParticipant** are, în runtime, un **PlayerRuntimeState**;
- un **PlayerRuntimeState** are o **PlayerMap** proprie;
- o **PlayerMap** conține mai multe **Lot**-uri;
- un **Lot** poate avea cel mult o **Building**;
- o **Building** produce o anumită resursă și aparține indirect unui participant din sesiune;
- o **GameSession** are un **SessionRuntimeState** asociat pe durata desfășurării;
- un **SessionRuntimeState** include un **MarketBoard**;
- un **MarketBoard** conține mai multe **ActiveOffer**;
- o **TradeTransaction** aparține unei **GameSession** și implică participanți ai acelei sesiuni;
- o **PlayerSessionResult** aparține unei **GameSession** și unui **SessionParticipant**;
- o **GameSession** are un **EconomyState**, iar acesta include sau se corelează cu un **InflationState**;
- o sesiune poate include una sau mai multe instanțe de **BotRuntimeState**.

### 14.4 Separarea dintre persistent și runtime
O decizie canonică importantă a modelului de date este separarea clară dintre:
- **date persistente**, necesare în afara sesiunii active;
- **date runtime**, necesare pentru simularea și sincronizarea partidei în desfășurare.

În această arhitectură:
- identitatea utilizatorului, participările, rezultatele finale și tranzacțiile importante sunt păstrate persistent;
- hărțile generate, stările curente ale clădirilor, ofertele active și valorile intermediare ale sesiunii sunt tratate în principal ca runtime state.

Această separare este în acord cu arhitectura autoritativă a serverului și cu nevoia de a menține performanță bună pentru procesarea sesiunilor active.

În mod explicit, ofertele active, chat-ul, hărțile generate și stările intermediare ale sesiunii nu fac parte din setul minim de date persistate al versiunii canonice de bază.

### 14.5 Observații de modelare
Modelul de date conceptual nu trebuie interpretat ca o schemă relațională finală unu-la-unu. Rolul său este de a defini obiectele esențiale ale domeniului, responsabilitățile lor și relațiile importante dintre ele.

În implementare:
- unele entități conceptuale pot deveni tabele distincte;
- altele pot fi modelate prin structuri compuse;
- anumite relații runtime pot exista doar în memorie, fără echivalent direct persistent;
- unele componente, precum EconomyState și InflationState, pot fi separate sau integrate în funcție de nevoile concrete ale codului.

Important este ca separarea dintre identitatea persistentă a aplicației și starea tranzitorie a unei sesiuni active să rămână clară și consecventă în întregul proiect.

## 15. Cerințe non-funcționale

### 15.1 Performanță
Proiectul trebuie să ofere o experiență suficient de fluidă pentru sesiuni multiplayer în grupuri mici, în care deciziile jucătorilor și actualizările economice sunt percepute ca fiind aproape în timp real.

Din punct de vedere al performanței, sistemul urmărește:
- latență suficient de redusă între client și server pentru ca acțiunile uzuale ale jucătorilor să fie reflectate rapid în interfață;
- actualizări realtime ale stării sesiunii la o frecvență adecvată pentru gameplay fluent;
- procesare server-side suficient de rapidă pentru acțiuni precum construire, upgrade, colectare, publicare de oferte și validarea tranzacțiilor;
- menținerea unei experiențe stabile în sesiuni de dimensiunea vizată de proiect.

Ca valori orientative, sistemul urmărește:
- latență medie redusă, preferabil sub aproximativ **150 ms** în condiții normale de rețea;
- propagarea actualizărilor importante într-un interval suficient de mic încât sesiunea să rămână coerentă vizual și funcțional;
- o frecvență a broadcast-urilor și recalculărilor adaptată nevoilor sesiunii, fără a încărca inutil clientul sau serverul.

Aceste valori au caracter orientativ și trebuie înțelese în raport cu scope-ul proiectului de licență, nu ca obiective de producție la scară mare.

### 15.2 Consistență
Consistența jocului este una dintre cerințele centrale ale proiectului, deoarece toate mecanicile economice relevante depind de existența unei stări comune și valide între participanți.

În mod canonic:
- serverul este **autoritativ**;
- clientul trimite intenții și afișează rezultatele confirmate;
- toate acțiunile economice relevante sunt validate server-side;
- starea sesiunii afișată jucătorilor poate fi ușor întârziată față de realitatea internă a serverului, dar nu trebuie să devină contradictorie cu aceasta.

Operațiile critice care necesită confirmare explicită din partea serverului includ cel puțin:
- construirea de clădiri;
- upgrade-urile;
- colectarea resurselor;
- lansarea și acceptarea ofertelor;
- procesarea contraofertelor;
- actualizarea indicatorilor economici;
- calculul inflației și al rezultatului final al sesiunii.

Din punct de vedere conceptual, sistemul urmărește o formă de **consistență eventuală controlată** pentru partea de afișare și sincronizare, combinată cu validare strictă pentru operațiile critice. Astfel, interfața poate reflecta starea cu o mică întârziere, dar regulile jocului și rezultatele economice rămân determinate exclusiv de server.

### 15.3 Securitate
Securitatea sistemului trebuie să fie adecvată naturii proiectului: un joc multiplayer cu autentificare, schimb de date prin rețea și acțiuni economice care trebuie protejate împotriva manipulării triviale.

La nivel canonic, sistemul urmărește următoarele principii:
- autentificarea utilizatorilor se realizează prin mecanisme sigure, bazate pe token;
- parolele nu sunt stocate în clar, ci într-o formă procesată securizat;
- identitatea utilizatorului este verificată înainte de acordarea accesului la funcționalitățile protejate;
- toate acțiunile relevante care pot modifica starea jocului sunt validate server-side;
- inputul primit de la client este verificat și sanitizat;
- clientul nu poate impune direct stări economice sau rezultate ale jocului.

În mod concret, securitatea include:
- hashing pentru parole;
- autentificare bazată pe token, precum JWT sau un mecanism echivalent;
- verificarea resurselor, rolurilor și condițiilor necesare pentru fiecare acțiune importantă;
- protecție împotriva cererilor invalide sau malițioase prin validare strictă a inputului.

Mecanisme suplimentare precum refresh flow extins, rate limiting avansat sau audit detaliat pot fi adăugate în funcție de timpul disponibil, dar nu reprezintă condiții obligatorii pentru definirea versiunii canonice a proiectului.

### 15.4 Scalabilitate
Scalabilitatea este tratată în acest proiect într-un mod realist, raportat la scope-ul versiunii de licență.

Sistemul este proiectat în principal pentru:
- sesiuni multiplayer de dimensiuni mici;
- grupuri de aproximativ **2–8 jucători** într-o sesiune;
- rulare stabilă pe o infrastructură simplă, fără distribuție complexă a componentelor.

Arhitectura aleasă permite, la nivel conceptual, extinderi ulterioare, precum:
- optimizarea procesării conexiunilor;
- separarea mai clară a modulelor backend;
- îmbunătățirea mecanismelor de persistență și sincronizare;
- susținerea unor forme mai avansate de scalare.

Totuși, pentru proiectul de licență:
- **scalarea orizontală reală** nu este obiectiv principal;
- suportul pentru sesiuni foarte mari nu intră în scope;
- designul urmărește mai degrabă claritate și extensibilitate decât capacitate ridicată la scară mare.

Prin urmare, cerința de scalabilitate este satisfăcută dacă sistemul poate susține în mod coerent și stabil numărul de participanți vizat de gameplay-ul canonic.

### 15.5 Mentenabilitate
Mentenabilitatea este o cerință importantă, deoarece proiectul include mai multe componente distincte: client, server, bază de date, gameplay economic, piață și logică de sesiune.

Pentru a rămâne ușor de înțeles, testat și extins, sistemul trebuie să urmărească:
- separarea clară a responsabilităților între client, server și persistență;
- modularizarea backend-ului pe zone logice distincte;
- definirea coerentă a entităților și fluxurilor principale;
- evitarea duplicării inutile a logicii;
- păstrarea regulilor canonice într-o documentație centralizată și consecventă.

La nivel de proiectare și implementare, mentenabilitatea este susținută prin:
- structură modulară pentru componentele principale;
- utilizarea TypeScript pentru o modelare mai clară și mai sigură a datelor pe backend;
- organizarea codului în jurul responsabilităților esențiale ale sistemului;
- documentarea deciziilor importante în masterdoc și în documentele tehnice auxiliare;
- posibilitatea de a extinde ulterior sistemul fără rescriere totală a arhitecturii.

De asemenea, proiectul trebuie să rămână suficient de clar încât:
- bug-urile să poată fi izolate relativ ușor;
- componentele să poată fi testate individual;
- noile mecanici sau extensii să poată fi adăugate incremental.

### 15.6 Observații generale
Cerințele non-funcționale trebuie înțelese în raport cu versiunea de licență a proiectului și cu obiectivul principal al acestuia: realizarea unui joc multiplayer cooperativ, coerent și demonstrabil din punct de vedere tehnic și conceptual.

Din acest motiv, documentul urmărește:
- cerințe suficient de clare pentru a ghida implementarea;
- un nivel de ambiție realist pentru timpul și resursele disponibile;
- evitarea promisiunilor excesive care ar depăși scope-ul canonic al proiectului.

Versiunea de licență prioritizează robustețea arhitecturală, coerența regulilor și funcționarea corectă a experienței de bază, înaintea optimizărilor avansate sau a extinderilor de scară mare.

## 16. Stack tehnologic

### 16.1 Frontend
Partea de client a jocului este realizată în **Godot**, folosind **GDScript** ca limbaj principal pentru implementarea logicii de client și a interfeței.

Godot este utilizat pentru:
- gestionarea scenelor și a interfeței;
- randarea hărții și a elementelor vizuale ale jocului;
- captarea inputului jucătorului;
- comunicarea cu serverul prin componenta de rețea;
- integrarea logicii de gameplay de pe partea de client.

La nivelul versiunii de licență, Godot este ales ca tehnologie principală de frontend pentru că se potrivește foarte bine unui joc 2D multiplayer cu interfață relativ clară și prototipare rapidă.

### 16.2 Backend
Partea de server este realizată în **Node.js**, folosind **TypeScript** pentru implementarea logicii aplicației.

Backend-ul este responsabil de:
- autentificare și validarea identității utilizatorilor;
- gestionarea lobby-urilor și a sesiunilor de joc;
- sincronizarea stării între participanți;
- procesarea logicii economice;
- gestionarea pieței și a tranzacțiilor;
- calculul indicatorilor economici, inclusiv inflația;
- controlul boților;
- persistența datelor relevante.

Comunicarea realtime dintre client și server se bazează pe **WebSocket**, iar pentru operațiile de tip bootstrap sau autentificare pot fi utilizate și endpoint-uri de tip REST, conform arhitecturii canonice a proiectului.

### 16.3 Database
Pentru stocarea datelor persistente este utilizat **PostgreSQL**.

Baza de date este folosită pentru:
- conturile utilizatorilor;
- datele necesare autentificării;
- informațiile persistente despre sesiuni;
- tranzacțiile relevante;
- rezultatele finale și alte date utile pentru istoric sau audit.

PostgreSQL este potrivit pentru proiect deoarece oferă un model relațional robust și suport bun pentru consistența datelor, aspect important într-un joc care include tranzacții economice și logică multiplayer.

### 16.4 Tooling
Pe lângă tehnologiile principale ale aplicației, proiectul folosește un set de tool-uri și biblioteci auxiliare pentru dezvoltare, validare și organizare.

La nivelul implementării, stack-ul poate include:
- **ws** pentru comunicare WebSocket pe server;
- **Express.js** pentru endpoint-urile necesare în afara canalului realtime;
- **Prisma** ca strat ORM pentru lucrul cu PostgreSQL;
- **jsonwebtoken** pentru autentificare bazată pe token;
- **bcrypt** pentru procesarea securizată a parolelor;
- **Zod** sau alt mecanism echivalent pentru validarea inputului;
- **Docker** pentru rularea și izolarea componentelor de infrastructură, unde este util;
- **Git** și **GitHub** pentru version control;
- **ESLint** și **Prettier** pentru consistența codului;
- **DBeaver** pentru administrarea bazei de date.

Aceste instrumente susțin implementarea practică a arhitecturii definite în capitolele anterioare, fără a reprezenta toate elemente obligatorii în aceeași măsură pentru livrabilul final.

### 16.5 Justificare pe scurt
Stack-ul tehnologic ales urmărește un echilibru între:
- potrivirea cu tipul proiectului;
- viteza de dezvoltare;
- claritatea arhitecturală;
- ușurința de implementare în contextul unei lucrări de licență.

Pe scurt:
- **Godot + GDScript** oferă un mediu potrivit pentru un joc 2D cu prototipare rapidă;
- **Node.js + TypeScript** se potrivesc bine unei aplicații multiplayer realtime, cu logică server-side modulară;
- **WebSocket** este adecvat pentru sincronizarea rapidă a sesiunilor active;
- **PostgreSQL** oferă persistență sigură și coerentă pentru datele importante ale sistemului.

Documentul de față păstrează doar rezumatul canonic al stack-ului. Justificarea extinsă a alegerii tehnologiilor rămâne în documentația tehnică separată dedicată stack-ului.

## 17. Decizii canonice

Această secțiune centralizează deciziile de design, gameplay și arhitectură care definesc varianta canonică a proiectului. Rolul ei este de a oferi un punct rapid de referință pentru alegerile deja stabilite și de a reduce apariția contradicțiilor între documente.

| ID       | Decizie | Status | Observații |
|----------|---------|--------|------------|
| GAME-001 | 1 secundă reală = 1 minut în joc | Canon | Convenția oficială de timp a sesiunii |
| GAME-002 | Piața este deschisă între 09:00–17:00 in-game | Canon | În afara acestui interval nu pot fi lansate, acceptate sau negociate oferte |
| GAME-003 | Serverul este autoritativ | Canon | Clientul trimite intenții și afișează starea confirmată |
| GAME-004 | Jocul este în primul rând cooperativ, cu componentă individuală de performanță | Canon | Rezultatul principal este colectiv, dar fiecare jucător primește evaluare proprie |
| GAME-005 | O sesiune standard se desfășoară de luni până vineri, între 08:00 și 20:00 in-game | Canon | Evaluarea finală are loc la finalul sesiunii |
| GAME-006 | Nu există condiții de eșec anticipat în varianta de bază | Canon | Rezultatul se stabilește la încheierea naturală a sesiunii |
| GAME-007 | Dimensiunea canonică a sesiunii este 2–8 jucători | Canon | 4–8 reprezintă intervalul țintă, dar jocul poate porni și de la 2 |
| GAME-008 | Harta fiecărui jucător este individuală și are dimensiunea 8x10 | Canon | Hărțile sunt generate la începutul sesiunii |
| GAME-009 | Hărțile sunt asimetrice controlat | Canon | Pot diferi între jucători, dar trebuie să rămână jucabile și echilibrate |
| GAME-010 | Pe o hartă poate lipsi cel mult un singur tip de lot | Canon | Asigură varietate fără a compromite jucabilitatea |
| GAME-011 | Există trei resurse principale: grâne, piatră și lemn | Canon | Acestea sunt resursele de bază ale economiei |
| GAME-012 | Moneda jocului este reprezentată de galbeni | Canon | Galbenii circulă prin tranzacții și reciclare |
| GAME-013 | Există trei tipuri principale de loturi: Câmp, Carieră și Pădure | Canon | Fiecare lot corespunde unei clădiri de producție |
| GAME-014 | Există trei clădiri principale de producție: Fermă, Mină și Lemnărie | Canon | Fiecare produce o singură resursă asociată |
| GAME-015 | Clădirile produc automat resurse | Canon | Producția depinde de nivelul clădirii |
| GAME-016 | Colectarea resurselor se face manual de către jucător | Canon | Resursele necolectate rămân în stocarea internă a clădirii |
| GAME-017 | Capacitatea de stocare a clădirii depinde de nivel | Canon | 60 / 120 / 180 pentru nivelurile 1 / 2 / 3 |
| GAME-018 | Dacă stocarea unei clădiri este plină, producția suplimentară se pierde | Canon | Colectarea la timp face parte din gameplay |
| GAME-019 | Clădirile pot fi construite doar pe lotul corespunzător | Canon | Fermă pe Câmp, Mină pe Carieră, Lemnărie pe Pădure |
| GAME-020 | Construirea și upgrade-urile sunt instantanee în varianta de bază | Canon | Nu există timp de construcție separat |
| GAME-021 | Clădirile pot fi îmbunătățite până la nivelul 3 | Canon | Upgrade-urile sunt secvențiale |
| GAME-022 | Piața funcționează ca board global de oferte active | Canon | Toți participanții văd aceleași oferte active |
| GAME-023 | Există oferte de cumpărare și oferte de vânzare | Canon | Ambele sunt tratate în același sistem de piață |
| GAME-024 | Ofertele au cantitate minimă, cantitate maximă și perioadă de valabilitate | Canon | Structura canonică a unei oferte |
| GAME-025 | Contraoferta se adresează direct creatorului ofertei inițiale și poate modifica doar prețul | Canon | Limitele de cantitate ale ofertei originale rămân neschimbate |
| GAME-026 | Creatorul unei oferte poate reînnoi valabilitatea acesteia prin refresh | Canon | Ofertele nu sunt permanente |
| GAME-027 | Reciclarea reprezintă o vânzare către sistem la valoare inferioară pieței | Canon | Mecanism de rezervă pentru obținerea de galbeni |
| GAME-028 | Reciclarea este disponibilă și în afara programului pieței | Canon | Spre deosebire de tranzacțiile dintre participanți |
| GAME-029 | Inflația este un indicator global calculat exclusiv de server | Canon | Serverul este singura sursă validă pentru actualizarea sa |
| GAME-030 | Inflația are valori între 0 și 100 și pornește de la 20 | Canon | Pragurile de interpretare sunt definite în regulile jocului |
| GAME-031 | Inflația folosește un model hibrid: recalculare periodică + impulsuri imediate | Canon | Recalculare la fiecare 30 de minute in-game |
| GAME-032 | Inflația este influențată de cerere/ofertă, suprapreț și reciclare excesivă | Canon | Cei trei factori principali ai presiunii inflaționiste |
| GAME-033 | Inflația poate scădea doar în condiții de stabilitate economică relativă | Canon | Nu se reduce automat în absența presiunilor |
| GAME-034 | Inacțiunea nu crește artificial inflația | Canon | Este penalizată separat prin performanță economică slabă |
| GAME-035 | Succesul sesiunii depinde atât de stabilitatea economică, cât și de atingerea unui prag minim de performanță | Canon | Condiție colectivă de reușită |
| GAME-036 | Fiecare jucător primește la final o evaluare individuală sub formă de rang | Canon | Separată de rezultatul colectiv al sesiunii |
| GAME-037 | În versiunea de bază, boții pot produce și tranzacționa, dar nu construiesc și nu fac upgrade-uri | Canon | Rol economic limitat și controlat |
| GAME-038 | Comportamentul boților este bazat pe reguli simple și devine mai prudent la inflație ridicată | Canon | Nu urmăresc strategii complexe și nu destabilizează intenționat economia |
| GAME-039 | La finalul sesiunii se determină și se pot salva statistici finale minime per sesiune și per jucător | Canon | Include rezultat colectiv, inflație finală, rang și statistici economice de bază |
| UI-001   | Ecranul principal de joc este centrul experienței in-session | Canon | Piața și chat-ul nu scot jucătorul complet din contextul gameplay-ului |
| UI-002   | Piața este accesată ca overlay din ecranul principal de joc | Canon | Nu este tratată ca ecran full separat |
| UI-003   | Chat-ul este un panel lateral retractabil | Canon | Componentă contextuală a sesiunii |
| UI-004   | Setările sunt accesibile atât din meniul principal, cât și din timpul jocului | Canon | În timpul jocului apar ca overlay |
| UI-005   | Splash screen-ul are rol minimalist | Canon | Introducere vizuală și tranziție către meniul principal |
| ARCH-001 | Clientul este subțire și nu are autoritate economică | Canon | Gestionează UI, input și prezentarea stării |
| ARCH-002 | Serverul este modular la nivel logic | Canon | Auth, lobby, realtime, game engine, market, economy, bots, persistence |
| ARCH-003 | Serverul folosește un model hibrid event-driven + tick-based | Canon | Evenimente pentru acțiuni, tick-uri pentru timp și actualizări periodice |
| ARCH-004 | Starea activă a sesiunii este menținută în principal în memorie | Canon | Pentru procesare și sincronizare realtime |
| ARCH-005 | Baza de date persistă informațiile importante, nu întreaga stare runtime | Canon | Separare clară între persistent și runtime |
| ARCH-006 | WebSocket este canalul principal pentru comunicarea realtime | Canon | REST poate fi utilizat pentru bootstrap și autentificare |
| ARCH-007 | Boții sunt controlați exclusiv de server și nu au client propriu | Canon | Participă la economie fără infrastructură separată de UI |
| ARCH-008 | Boții sunt introduși la începutul sesiunii, nu dinamic în timpul acesteia | Canon | Simplifică implementarea și controlul sesiunii |
| DATA-001 | ActiveOffer este entitate runtime, nu persistentă canonic | Canon | Efectul persistent al unei oferte finalizate este TradeTransaction |
| DATA-002 | TradeTransaction este entitatea persistentă pentru tranzacțiile finalizate | Canon | Relevantă pentru istoric și audit |
| DATA-003 | Relația dintre User și GameSession este modelată prin SessionParticipant | Canon | Separă identitatea persistentă de participarea concretă |
| DATA-004 | PlayerSessionResult păstrează evaluarea finală individuală | Canon | Leagă sesiunea de performanța jucătorului |
| DATA-005 | Setul minim de entități persistente este format din User, GameSession, SessionParticipant, TradeTransaction și PlayerSessionResult | Canon | Nucleul minim al persistenței |
| DATA-006 | ActiveOffer, chat-ul, hărțile generate și runtime state-ul complet nu sunt persistate canonic | Canon | Rămân în principal în memorie pe durata sesiunii |
| DATA-007 | Nivelul de audit păstrat în varianta canonică de bază este minim-mediu | Canon | Audit orientat pe evenimente importante, nu pe toate stările intermediare |
| DATA-008 | Auditul poate include start/end sesiune, tranzacții, reciclări, disconnect/reconnect și adăugarea boților | Canon | Trasabilitate și debugging de bază |
| DATA-009 | Auditul nu urmărește fiecare acțiune minoră, fiecare click sau fiecare variație intermediară a sesiunii | Canon | Se evită complexitatea inutilă |
| NF-001   | Proiectul este optimizat pentru sesiuni multiplayer mici, nu pentru scară mare | Canon | Scope realist pentru lucrarea de licență |
| NF-002   | Scalarea orizontală reală nu intră în scope-ul versiunii de licență | Canon | Poate exista doar ca extensie ulterioară |
| NF-003   | Securitatea se bazează pe validare server-side, autentificare și procesarea securizată a parolelor | Canon | Nivel adecvat scopului proiectului |

## 18. Întrebări deschise

Această secțiune centralizează aspectele care nu sunt încă fixate complet la nivel canonic și care necesită o decizie finală înainte de considerarea masterdoc-ului ca variantă stabilă.

- [x] Numărul final de jucători per sesiune
- [x] Piață globală vs P2P vs hibrid
- [x] Formula exactă a inflației
- [x] Gradul exact de complexitate al logicii boților
- [x] Condiții precise de win / lose
- [x] Structura principală a ecranelor și a navigării UI
- [x] Rolul arhitectural al clientului, serverului și bazei de date
- [x] Separarea dintre entitățile persistente și entitățile runtime
- [x] Lista minimă a datelor persistate
- [x] Lista minimă de statistici finale
- [x] Nivelul exact de audit păstrat
- [ ] Finețuri de balancing pentru economie, costuri și progresie

### 18.1 Prioritate ridicată
În acest moment nu mai există întrebări deschise critice care să blocheze considerarea documentului ca versiune aproape finală.

Aspectele rămase țin în principal de balancing, rafinare de implementare și eventuale extensii ulterioare.

### 18.2 Prioritate medie
Aceste aspecte pot fi rafinate mai târziu, fără a bloca structura generală a documentului:
- finețuri de balancing pentru costuri, progresie și ritmul economic;
- eventuale extensii ale sistemului de audit;
- detalii suplimentare privind afișarea statisticilor;
- ajustări ale comportamentului boților în urma playtesting-ului;
- rafinarea coeficienților concreți ai inflației la nivel de implementare.

### 18.3 Observație
Întrebările deschise din această secțiune trebuie să rămână cât mai puține și cât mai concrete. Orice decizie stabilită ulterior ar trebui mutată din această listă în secțiunile canonice relevante și, unde este cazul, adăugată și în tabelul de decizii canonice.

## 19. Glosar

### 19.1 Termeni de gameplay

**Clădire**  
Structură de producție plasată pe un lot valid. În varianta canonică a jocului, clădirile principale sunt Ferma, Mina și Lemnăria.

**Colectare**  
Acțiunea prin care jucătorul transferă manual în stocul propriu resursele acumulate în stocarea internă a unei clădiri.

**Contraofertă**  
Răspuns trimis direct creatorului unei oferte active, prin care se propune un alt preț pentru aceeași structură de cantitate deja stabilită în oferta inițială.

**Economie locală**  
Ansamblul resurselor, clădirilor, deciziilor și posibilităților de tranzacționare asociate unui jucător într-o sesiune.

**Economie globală**  
Starea agregată a pieței și a indicatorilor economici la nivelul întregii sesiuni de joc.

**Fermă**  
Clădire de producție construită pe loturi de tip Câmp, care produce grâne.

**Galbeni**  
Moneda jocului, utilizată în tranzacții și obținută prin schimburi de piață sau reciclare.

**Gameplay loop**  
Bucla principală de acțiuni repetate de jucător în timpul sesiunii, precum colectare, construire, upgrade, tranzacționare și analiză economică.

**Grâne**  
Una dintre cele trei resurse principale ale jocului.

**Hartă**  
Grid-ul individual al unui jucător, generat la începutul sesiunii și alcătuit din loturi de mai multe tipuri.

**Host**  
Jucătorul care creează lobby-ul și are dreptul de a lansa sesiunea de joc.

**Inflație**  
Indicator economic global calculat de server, care reflectă gradul de dezechilibru al economiei sesiunii.

**Lemn**  
Una dintre cele trei resurse principale ale jocului.

**Lemnărie**  
Clădire de producție construită pe loturi de tip Pădure, care produce lemn.

**Lobby**  
Spațiul premergător unei sesiuni de joc, în care participanții se reunesc, își marchează statusul și așteaptă lansarea partidei.

**Lot**  
Unitate de teren de pe harta unui jucător. Un lot are un tip specific și poate găzdui cel mult o clădire compatibilă.

**Mină**  
Clădire de producție construită pe loturi de tip Carieră, care produce piatră.

**Oferte active**  
Ofertele de cumpărare sau vânzare disponibile la un moment dat pe piața unei sesiuni.

**Piață**  
Sistemul global de tranzacționare al sesiunii, în care participanții pot lansa, accepta și negocia oferte.

**Piatră**  
Una dintre cele trei resurse principale ale jocului.

**Ready / Not Ready**  
Status folosit în lobby pentru a indica dacă un participant este pregătit pentru începerea sesiunii.

**Reciclare**  
Mecanism prin care un jucător poate converti direct resurse în galbeni printr-o vânzare către sistem, la o valoare inferioară celei de piață.

**Resursă**  
Element economic produs, stocat, colectat și tranzacționat în joc. În varianta canonică, resursele principale sunt grâne, piatră și lemn.

**Rang**  
Evaluarea individuală finală a unui jucător la încheierea unei sesiuni.

**Sesiune de joc**  
Instanța activă a unei partide multiplayer, desfășurată între începutul și finalul jocului.

**Stabilitate economică**  
Starea dorită a economiei sesiunii, în care inflația și dinamica pieței rămân în limite compatibile cu obiectivul colectiv.

**Tranzacție**  
Schimb economic finalizat cu succes între două părți, rezultat din acceptarea unei oferte sau a unei contraoferte.

**Upgrade**  
Îmbunătățirea unei clădiri existente la un nivel superior, pentru creșterea producției și a capacității de stocare.

### 19.2 Termeni de sistem și arhitectură

**Client**  
Componenta aplicației care rulează la utilizator și se ocupă de interfață, input și afișarea stării jocului.

**Server autoritativ**  
Model arhitectural în care serverul reprezintă singura sursă validă de adevăr pentru starea jocului și pentru rezultatul acțiunilor relevante.

**Persistență**  
Păstrarea datelor importante ale aplicației în afara duratei unei sesiuni active, de regulă în baza de date.

**Runtime state**  
Starea tranzitorie a unei sesiuni active, menținută în principal în memorie pe durata jocului.

**WebSocket**  
Mecanism de comunicare bidirecțională realtime între client și server, utilizat pentru sincronizarea sesiunii.

**REST**  
Stil de comunicare request / response utilizat pentru operații de tip bootstrap, autentificare sau administrare.

**SessionParticipant**  
Entitate conceptuală care leagă un utilizator de participarea sa concretă într-o sesiune.

**TradeTransaction**  
Entitate persistentă care reprezintă o tranzacție finalizată cu succes într-o sesiune.

**PlayerSessionResult**  
Entitate persistentă care reține evaluarea finală a unui jucător într-o sesiune.

**ActiveOffer**  
Entitate runtime care reprezintă o ofertă activă aflată pe piață la un moment dat.

### 19.3 Observație
Glosarul are rolul de a fixa sensul termenilor principali folosiți în document. Dacă, pe parcursul dezvoltării, apar termeni noi sau variante alternative de denumire, varianta canonică trebuie actualizată aici și păstrată consecvent în întregul masterdoc.

## 20. Anexe

### 20.1 Tabele de costuri

#### 20.1.1 Costuri de construire

| Clădire | Lot necesar | Cost |
|--------|-------------|------|
| Fermă | Câmp | 10 lemn, 20 piatră |
| Mină | Carieră | 20 lemn, 10 grâne |
| Lemnărie | Pădure | 10 piatră, 20 grâne |

#### 20.1.2 Costuri de upgrade

Regulile canonice pentru upgrade sunt:
- costul upgrade-ului de la nivelul 1 la nivelul 2 este egal cu dublul costului de construire;
- costul upgrade-ului de la nivelul 2 la nivelul 3 este egal cu dublul costului upgrade-ului anterior.

##### Fermă
- nivel 1 → 2: 20 lemn, 40 piatră
- nivel 2 → 3: 40 lemn, 80 piatră

##### Mină
- nivel 1 → 2: 40 lemn, 20 grâne
- nivel 2 → 3: 80 lemn, 40 grâne

##### Lemnărie
- nivel 1 → 2: 20 piatră, 40 grâne
- nivel 2 → 3: 40 piatră, 80 grâne

### 20.2 Tabele de producție

#### 20.2.1 Producție pe nivel

| Nivel clădire | Producție |
|--------------|-----------|
| Nivel 1 | 1 unitate / minut |
| Nivel 2 | 2 unități / minut |
| Nivel 3 | 3 unități / minut |

#### 20.2.2 Capacitate de stocare pe nivel

| Nivel clădire | Capacitate de stocare |
|--------------|------------------------|
| Nivel 1 | 60 unități |
| Nivel 2 | 120 unități |
| Nivel 3 | 180 unități |

#### 20.2.3 Asocierea resursă - lot - clădire

| Resursă | Lot | Clădire |
|--------|-----|---------|
| Grâne | Câmp | Fermă |
| Piatră | Carieră | Mină |
| Lemn | Pădure | Lemnărie |

### 20.3 Note de balancing

Această anexă are rolul de a centraliza observațiile de balancing care nu modifică regulile canonice de bază, dar pot influența reglajul fin al experienței de joc.

În această zonă pot fi notate ulterior:
- ajustări ale costurilor de construire;
- ajustări ale costurilor de upgrade;
- observații privind ritmul de producție;
- probleme observate în legătură cu distribuția loturilor pe hartă;
- observații privind reciclarea și impactul acesteia asupra economiei;
- ajustări ale pragurilor de performanță economică;
- ajustări ale relației dintre piață, lichiditate și presiunea inflaționistă.

### 20.4 Observație
Anexele completează regulile canonice ale documentului, dar nu le înlocuiesc. În caz de contradicție între o anexă și o secțiune canonică a masterdoc-ului, prevalează întotdeauna secțiunea canonică relevantă.
