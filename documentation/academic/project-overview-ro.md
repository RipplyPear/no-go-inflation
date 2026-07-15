# No-go Inflation — prezentare academică

[← Înapoi la documentația academică](./README-ro.md)

## Despre proiect

**No-go Inflation** este un joc 2D multiplayer cooperativ de strategie economică. Jucătorii își dezvoltă propriile economii locale, produc și colectează resurse, construiesc și îmbunătățesc clădiri, apoi tranzacționează pe o piață comună.

Obiectivul nu este doar obținerea unui rezultat individual bun, ci și menținerea stabilității economice a sesiunii. Deciziile privind producția, reciclarea și tranzacțiile influențează indicatori precum inflația și prețurile medii.

Proiectul a fost realizat ca lucrare de licență la Academia de Studii Economice din București, specializarea Informatică Economică.

## Obiective

Proiectul urmărește:

- transpunerea unor concepte economice de bază într-un sistem interactiv;
- implementarea unei experiențe multiplayer în timp real;
- separarea clară dintre interfața clientului și regulile validate de server;
- stocarea persistentă a informațiilor relevante pentru utilizatori și sesiuni;
- demonstrarea legăturii dintre informatica economică și dezvoltarea software.

## Funcționalități implementate

- înregistrare și autentificare cu JWT;
- creare și alăturare la lobby-uri prin cod;
- sesiuni multiplayer sincronizate prin WebSocket;
- hărți individuale generate pentru participanți;
- construire, upgrade și colectare de resurse;
- piață comună cu oferte de cumpărare și vânzare;
- reciclarea resurselor pentru monedă;
- calculul inflației, al prețurilor medii, al scorurilor și al rezultatelor finale;
- configurarea adresei serverului pentru joc în rețeaua locală;
- interfață disponibilă în română și engleză.

## Arhitectură

Aplicația folosește un model client-server autoritativ:

- clientul Godot gestionează interfața, inputul și afișarea stării;
- serverul Node.js și TypeScript validează acțiunile și sincronizează jocul;
- PostgreSQL persistă utilizatori, sesiuni, resurse, clădiri, oferte, tranzacții și rezultate.

REST este utilizat pentru autentificare, iar WebSocket pentru lobby, gameplay și actualizări în timp real.

## Limitări asumate

Versiunea actuală este un MVP funcțional și nu include matchmaking automat, chat, sistem de prieteni, ranking global, export mobil sau scalare orizontală.

## Documentație suplimentară

- [Arhitectura sistemului](./reference/system-architecture-ro.md)
- [Cerințe nefuncționale](./reference/non-functional-requirements-ro.md)
- [Reguli de clădiri și producție](./reference/buildings-and-production-ro.md)
- [Masterdoc — referință istorică de proiectare](./reference/masterdoc-ro.md)