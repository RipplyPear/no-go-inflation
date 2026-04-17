# Clădiri

Documentul descrie relația dintre resurse, loturi și clădirile de producție din joc, împreună cu regulile de timp, producție, costuri și stocare.

## 1. Relația resursă → lot → clădire

| Resursă | Lot | Clădire | Nivel 1 | Nivel 2 | Nivel 3 |
|---|---|---|---|---|---|
| Grâne (G) | Câmp | Fermă | ![Fermă nivel 1](assets/frontend/buildings/farmer1.png) | ![Fermă nivel 2](assets/frontend/buildings/farmer2.png) | ![Fermă nivel 3](assets/frontend/buildings/farmer3.png) |
| Piatră (P) | Carieră | Mină | ![Mină nivel 1](assets/frontend/buildings/mine1.png) | ![Mină nivel 2](assets/frontend/buildings/mine2.png) | ![Mină nivel 3](assets/frontend/buildings/mine3.png) |
| Lemn (L) | Pădure | Lemnărie | ![Lemnărie nivel 1](assets/frontend/buildings/forester1.png) | ![Lemnărie nivel 2](assets/frontend/buildings/forester2.png) | ![Lemnărie nivel 3](assets/frontend/buildings/forester3.png) |

## 2. Convenție de timp

- **1 secundă reală = 1 minut în joc**

## 3. Producție pe minut

Producția unei clădiri depinde de nivelul ei:

- **Nivel 1:** 1 unitate / minut
- **Nivel 2:** 2 unități / minut
- **Nivel 3:** 3 unități / minut

Fiecare tip de clădire produce exclusiv resursa asociată:
- **Fermă** → grâne
- **Mină** → piatră
- **Lemnărie** → lemn

## 4. Costuri

### 4.1. Construire

- **Fermă:** 10 lemn, 20 piatră
- **Mină:** 20 lemn, 10 grâne
- **Lemnărie:** 10 piatră, 20 grâne

### 4.2. Upgrade

- **Nivel 1 → 2:** dublul costului inițial de construire
- **Nivel 2 → 3:** dublul costului upgrade-ului anterior

## 5. Stocare

Capacitatea de stocare depinde de nivelul clădirii:

- **Nivel 1:** 60 unități
- **Nivel 2:** 120 unități
- **Nivel 3:** 180 unități

Formula generală este:

```text
capacitate = 60 × nivel
```

Exemplu:
- nivel 2 → 120 unități

## 6. Reguli de producție și colectare

- Clădirile produc automat în timp.
- Resursele produse se acumulează în stocarea internă a clădirii.
- Dacă stocarea este plină, producția suplimentară se pierde.
- Colectarea se face manual, prin acțiunea **Collect** pe clădire.
