import "dotenv/config";
import app from "./app";
import { pool } from "./config/db";

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
    try{
        await pool.query("SELECT NOW()");
        console.log("Query OK");

        app.listen(PORT, () => {
            console.log("Server started on port: " + PORT);
        });
    } catch (error) {
        console.error("Failed to start server:" + error);
        process.exit(1);
    }
}

startServer();