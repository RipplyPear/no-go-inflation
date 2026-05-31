import "dotenv/config";
import { createServer } from "node:http";

import app from "./app";
import { pool } from "./config/db";
import { setupWebSocketServer } from "./websocket/wsServer";
import { env } from "./config/env";

const PORT = env.port;

async function startServer() {
    try{
        await pool.query("SELECT NOW()");
        console.log("Query OK");

        const server = createServer(app);

        setupWebSocketServer(server);

        server.listen(PORT, () => {
            console.log(`Server started on port: ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

void startServer();