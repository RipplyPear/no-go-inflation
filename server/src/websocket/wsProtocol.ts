import { type RawData, WebSocket } from "ws";
import type { ClientMessage } from "./ws.types";

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

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}