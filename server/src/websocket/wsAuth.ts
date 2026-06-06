import type {IncomingMessage} from "node:http";
import jwt from "jsonwebtoken";

import {env} from "../config/env";
import {sendJson} from "./wsProtocol";
import type {AuthenticatedUser, AuthenticatedWebSocket} from "./ws.types";

export function authenticateRequest(request: IncomingMessage): AuthenticatedUser | null {
    const requestUrl = request.url ?? "";
    const queryIndex = requestUrl.indexOf("?");

    if (queryIndex === -1) {
        return null;
    }

    const queryString = requestUrl.slice(queryIndex + 1);
    const searchParams = new URLSearchParams(queryString);

    const token = searchParams.get("token");

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(token, env.jwtSecret);

        if (typeof decoded === "string") {
            return null;
        }

        if (
            typeof decoded.userId !== "number" ||
            typeof decoded.username !== "string" ||
            typeof decoded.email !== "string"
        ) {
            return null;
        }

        return {
            id: decoded.userId,
            username: decoded.username,
            email: decoded.email,
        };
    } catch (error) {
        console.error("Invalid WebSocket token:", error);
        return null;
    }
}

export function requireWsUser(ws: AuthenticatedWebSocket): AuthenticatedUser | null {
    if (!ws.user) {
        sendJson(ws, "ERROR", {
            message: "WebSocket user is not authenticated.",
        });
        return null;
    }

    return ws.user;
}