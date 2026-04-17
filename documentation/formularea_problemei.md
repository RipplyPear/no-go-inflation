# Formularea problemei

## 1. Cui i se adresează aplicația?

Aplicația se adresează în primul rând jucătorilor interesați de jocuri de strategie, management de resurse și luarea deciziilor într-un sistem economic dinamic. Experiența este construită pentru utilizatori care apreciază planificarea, optimizarea și adaptarea la schimbările din piață.

În mod particular, jocul este potrivit pentru grupuri mici de jucători care pot comunica ușor și se pot coordona în jurul unui obiectiv comun. Componenta cooperativă este esențială, deoarece participanții nu urmăresc doar dezvoltarea propriei economii, ci și menținerea stabilității economice generale.

În plan secundar, aplicația se adresează și unui context educațional sau demonstrativ. Prin integrarea unor concepte precum cererea, oferta, schimbul și inflația, jocul poate fi relevant și pentru studenți, profesori sau alte persoane interesate de reprezentarea interactivă a unor mecanisme economice de bază.

## 2. Ce roluri sunt implicate în cadrul sistemului?

În cadrul sistemului sunt implicate trei roluri principale:

### 2.1. Jucătorul

Jucătorul este actorul principal al aplicației. El controlează o economie locală în cadrul unei sesiuni multiplayer și ia deciziile economice relevante din timpul jocului.

### 2.2. Botul

Botul este un actor software controlat exclusiv de server. Rolul său este de a susține activitatea economică minimă a sesiunii și, atunci când este necesar, de a completa sesiunile mici. Botul nu are interfață proprie și nu funcționează ca utilizator uman.

### 2.3. Serverul

Serverul este actorul tehnic autoritativ al sistemului. El validează acțiunile, procesează logica de joc, sincronizează starea între participanți, calculează indicatorii economici și gestionează persistența datelor.

## 3. Ce activități poate realiza fiecare actor în parte?

### 3.1. Activități realizate de jucător

Jucătorul poate:

* să își creeze cont și să se autentifice în sistem;
* să creeze un lobby sau să se alăture unuia existent;
* să părăsească lobby-ul înainte de începerea sesiunii;
* să își marcheze statusul ca Ready sau Not Ready;
* să lanseze sesiunea dacă are rolul de Host;
* să construiască și să îmbunătățească clădiri pe loturile valide;
* să colecteze resursele produse;
* să lanseze oferte de cumpărare sau de vânzare pe piață;
* să accepte ofertele altor participanți sau să răspundă prin contraofertă;
* să urmărească indicatorii economici relevanți;
* să participe activ la menținerea stabilității economice generale.

### 3.2. Activități realizate de bot

Botul poate:

* să producă resurse într-un mod controlat;
* să lanseze oferte de cumpărare și de vânzare pe piață;
* să accepte oferte compatibile cu regulile sale interne;
* să reacționeze la prețurile de referință și la nivelul inflației;
* să contribuie la menținerea unei activități economice minime în sesiune.

În varianta de bază, botul nu construiește clădiri și nu realizează upgrade-uri.

### 3.3. Activități realizate de server

Serverul poate:

* să valideze acțiunile trimise de jucători;
* să gestioneze lobby-urile și sesiunile multiplayer;
* să sincronizeze starea jocului între participanți;
* să proceseze producția, tranzacțiile și celelalte evenimente importante de gameplay;
* să calculeze și să actualizeze indicatorii economici, inclusiv inflația;
* să controleze comportamentul boților;
* să gestioneze conectările, deconectările și reconectările;
* să persiste datele necesare aplicației și sesiunilor de joc.

## 4. Ce permisiuni are fiecare actor în parte? (matrice de permisiuni)

| Activitate                           | Jucător        | Bot               | Server                  |
| ------------------------------------ | -------------- | ----------------- | ----------------------- |
| Înregistrare / autentificare         | Da             | Nu                | Nu                      |
| Creare lobby                         | Da             | Nu                | Da                      |
| Alăturare la lobby                   | Da             | Adăugat de sistem | Da                      |
| Părăsire lobby                       | Da             | Nu                | Da                      |
| Ready / Not Ready                    | Da             | Nu                | Da                      |
| Lansare sesiune                      | Da (doar Host) | Nu                | Da                      |
| Producție de resurse                 | Da             | Da                | Nu                      |
| Construire / upgrade                 | Da             | Nu                | Validare                |
| Colectare resurse                    | Da             | Nu                | Validare                |
| Lansare ofertă pe piață              | Da             | Da                | Administrare / validare |
| Acceptare ofertă                     | Da             | Da                | Administrare / validare |
| Vizualizare indicatori economici     | Da             | Da                | Da                      |
| Calcul inflație / procesare economie | Nu             | Nu                | Da                      |
| Persistență date                     | Nu             | Nu                | Da                      |
| Gestionare boți                      | Nu             | Nu                | Da                      |

## 5. Observație finală

Sistemul este proiectat pe baza unui model autoritativ în care serverul reprezintă singura sursă validă pentru starea jocului. Jucătorul ia deciziile economice și interacționează cu interfața, botul susține funcționarea pieței în limitele stabilite de sistem, iar serverul validează, procesează și sincronizează întreaga sesiune.
