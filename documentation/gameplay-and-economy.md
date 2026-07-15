# Gameplay and Economy

[← Back to the documentation hub](./README.md)

## Goal

No-go Inflation is a cooperative economic strategy game. Players grow their own local economies while trying to keep the shared session economy stable.

Individual progress matters, but the final outcome also depends on collective inflation, market activity, and the economic performance of all participants.

## Gameplay loop

During a session, players repeatedly:

1. Collect resources produced by their buildings.
2. Build new production buildings or upgrade existing ones.
3. Review the market and economic indicators.
4. Create or accept resource offers.
5. Reassess their strategy based on available resources, prices, and inflation.

## Resources and buildings

| Resource | Terrain | Building |
| --- | --- | --- |
| Grain | Field | Farm |
| Stone | Quarry | Mine |
| Wood | Forest | Lumber mill |

Buildings produce resources over time. Players collect those resources and use them for construction, upgrades, recycling, or player-to-player trading.

## Shared market

Players create buy and sell offers for resources on a shared market. When an offer is accepted, the authoritative server validates both participants, their available resources or currency, and the active session state before completing the trade.

## Inflation and results

The server maintains session-wide economic indicators, including inflation and average prices. Recycling resources provides gold but affects the shared economy, so it creates a trade-off between immediate individual benefit and collective stability.

At the end of a session, the server calculates individual scores, rankings, and the collective result.