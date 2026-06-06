import {type RawData, WebSocket} from "ws";
import type {ClientMessage} from "./ws.types";

/**
 * Trimite mesaj WebSocket catre client in formatul `{type, payload}`.
 * Foloseste `JSON.stringify()`.
 *
 * @param ws WebSocket catre client.
 * @param type Ex: `SESSION_STATE`, `ERROR` sau `MARKET_STATE`.
 * @param payload Daca e gol, se trimite {}
 */
export function sendJson(ws: WebSocket, type: string, payload: unknown = {}) {
    ws.send(
        JSON.stringify({
            type,
            payload,
        })
    );
}

export function parseClientMessage(rawMessage: RawData): ClientMessage | null {
    try {
        const text = rawMessage.toString();
        const parsed = JSON.parse(text);

        if (typeof parsed !== "object" || parsed === null) {
            return null;
        }

        if (typeof parsed.type !== "string") {
            return null;
        }

        return parsed as ClientMessage;
    } catch {
        return null;
    }
}

/**
 * Verifica daca `value` este un obiect simplu cu chei string.
 *
 * Pentru validarea formatului mesajelor de la client
 *
 * @param value Valoarea necunoscuta care trebuie verificata.
 * @returns `true` daca valoarea este un obiect nenul si nu este array.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}