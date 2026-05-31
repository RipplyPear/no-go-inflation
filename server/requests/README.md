# Server Requests
***
Cereri HTTP pentru testarea serverului prin WebStorm.

## Pași
1. Pornire server
    ``` bash
    npm run dev
    ```
2. `00-health.http`
3. `01-auth.http`
4. Token JWT în `http-client.private.env.json` sau `http-client.env.json`
5. `02-user.http`
6. `10-ws-smoke.http`
7. `11-ws-gameplay.http` CREATE_DEMO_SESSION
8. `sessionId` din `SESSION_STATE` in `http-client.private.env.json`
9. `11-ws-gameplay.http` -> Basic gameplay actions
10. `12-ws-market-dev.http`