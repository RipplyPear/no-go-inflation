# Cerințe non-funcționale

## 1. Cerințe de performanță și paralelism

Aplicația trebuie să ofere o experiență fluentă pentru sesiuni multiplayer în grupuri mici, în care acțiunile jucătorilor și actualizările economice să fie percepute aproape în timp real. Din punct de vedere al performanței, sistemul urmărește o latență redusă între client și server, astfel încât acțiuni precum construirea, upgrade-ul, colectarea resurselor sau interacțiunile cu piața să fie reflectate rapid în interfață.

Ca valori orientative, sistemul urmărește o latență medie preferabil sub aproximativ **150 ms** în condiții normale de rețea. De asemenea, actualizările importante trebuie propagate suficient de rapid încât sesiunea să rămână coerentă atât vizual, cât și funcțional.

Din perspectiva paralelismului, backend-ul trebuie să poată gestiona simultan mai multe conexiuni active și mai multe evenimente generate de jucători în cadrul aceleiași sesiuni. Arhitectura serverului urmează un model hibrid:
- **event-driven** pentru acțiunile inițiate explicit de jucători, precum autentificare, join lobby, construire, colectare sau tranzacții;
- **tick-based** pentru evoluția timpului de joc și pentru actualizările economice periodice, cum este recalcularea inflației.

Această abordare permite procesarea concurentă a acțiunilor fără blocarea sistemului și fără transformarea întregii logici într-o simulare rigidă bazată exclusiv pe tick-uri.

## 2. Cerințe de securitate

Securitatea sistemului trebuie să fie adecvată unui joc multiplayer cu autentificare și schimb de date prin rețea. Sistemul trebuie să protejeze atât identitatea utilizatorilor, cât și corectitudinea acțiunilor economice desfășurate în timpul jocului.

### 2.1. Autentificare
Autentificarea utilizatorilor trebuie realizată prin mecanisme sigure, bazate pe token. Parolele nu sunt stocate în clar, ci într-o formă procesată securizat, prin hashing. După autentificare, utilizatorul primește acces doar la funcționalitățile permise de starea și rolul său în sistem.

### 2.2. Autorizare
Toate acțiunile relevante care pot modifica starea jocului trebuie validate server-side. Clientul trimite doar intenții de acțiune, iar serverul verifică resursele disponibile, rolul actorului și îndeplinirea condițiilor necesare. Astfel sunt prevenite acțiunile invalide, tranzacțiile incorecte și tentativele de manipulare a pieței.

### 2.3. Protecția datelor și a comunicației
Datele sensibile nu trebuie să circule în clar. Comunicarea dintre client și server trebuie realizată prin mecanisme sigure, iar inputul primit de la client trebuie validat și sanitizat. Sistemul trebuie să reducă posibilitatea trimiterii unor mesaje malițioase sau a unor stări economice modificate artificial din client.

### 2.4. Integritate
Corectitudinea economică a sesiunii este asigurată prin server autoritativ. Clientul nu poate impune direct stări de joc, rezultate economice sau valori ale indicatorilor. Tranzacțiile importante și rezultatele finale pot fi persistate pentru trasabilitate, audit și analiză ulterioară.

## 3. Cerințe de scalabilitate

Scalabilitatea este tratată într-un mod realist, raportat la scope-ul proiectului. Sistemul este proiectat în principal pentru sesiuni multiplayer mici, de aproximativ **2–8 jucători**, cu accent pe stabilitate și claritate arhitecturală, nu pe operare la scară mare.

Arhitectura aleasă trebuie să permită rularea coerentă a sesiunilor vizate pe o infrastructură simplă, fără distribuție complexă a componentelor. Pentru versiunea curentă, **scalarea orizontală reală** nu reprezintă un obiectiv principal, iar suportul pentru sesiuni foarte mari nu intră în aria de interes a aplicației.

Totuși, designul trebuie să rămână suficient de clar și modular încât să permită ulterior:
- optimizarea procesării conexiunilor;
- separarea mai clară a modulelor backend;
- extinderea mecanismelor de persistență și sincronizare;
- susținerea unor forme mai avansate de scalare, dacă proiectul este dezvoltat mai departe.

Prin urmare, cerința de scalabilitate este considerată satisfăcută dacă sistemul poate susține stabil și coerent numărul de participanți prevăzut de gameplay-ul canonic.

## 4. Cerințe de mentenabilitate

Mentenabilitatea este importantă deoarece aplicația include mai multe componente distincte: client, server, bază de date, piață, logică economică și gestionarea sesiunilor multiplayer. Sistemul trebuie proiectat astfel încât să rămână ușor de înțeles, testat și extins.

Pentru a susține mentenabilitatea, arhitectura trebuie să urmărească:
- separarea clară a responsabilităților între client, server și persistență;
- modularizarea backend-ului pe zone logice distincte;
- definirea coerentă a entităților și fluxurilor principale;
- evitarea duplicării inutile a logicii;
- păstrarea unei documentații consecvente pentru regulile de joc și deciziile tehnice importante.

La nivel practic, mentenabilitatea este susținută prin:
- organizarea codului în jurul responsabilităților esențiale ale sistemului;
- utilizarea TypeScript pe backend pentru modelare mai clară și mai sigură a datelor;
- posibilitatea izolării bug-urilor relativ ușor;
- posibilitatea testării individuale a componentelor importante;
- posibilitatea adăugării ulterioare de mecanici sau extensii fără rescriere totală a proiectului.

## 5. Platforme și browsere suportate

### 5.1. Platforme client
Partea de client a aplicației este realizată în Godot, ceea ce permite rularea jocului pe platforme desktop. Pentru versiunea de bază a proiectului, platforma vizată este în principal **Windows**. În funcție de evoluția proiectului, pot exista și posibilități de export pentru **Linux** și **macOS**, însă acestea nu reprezintă prioritatea principală a livrabilului curent.

### 5.2. Platforme server
Backend-ul realizat în Node.js poate rula pe sisteme de tip **Linux** sau **Windows**, în funcție de mediul de dezvoltare și de deployment ales. PostgreSQL este compatibil cu aceste platforme și susține persistența necesară aplicației.

### 5.3. Browsere suportate
Aplicația nu este concepută ca aplicație web care să ruleze direct într-un browser, ci ca joc desktop bazat pe Godot. Din acest motiv, cerința privind browserele suportate nu este una centrală pentru versiunea actuală. Accentul cade pe compatibilitatea cu platformele pe care rulează clientul și serverul, nu pe suport browser.

## 6. Observație finală

Cerințele non-funcționale trebuie înțelese în raport cu caracterul de proiect de licență al aplicației. Prioritatea principală este obținerea unui sistem multiplayer cooperativ coerent, stabil și demonstrabil tehnic, nu optimizarea pentru scenarii de producție la scară mare. Din acest motiv, accentul este pus pe consistență, securitate, claritate arhitecturală și funcționarea corectă a experienței de bază.