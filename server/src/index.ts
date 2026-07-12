import 'dotenv/config';
import { createServer } from 'node:http';

import app from './app';
import { pool } from './config/db';
import { setupWebSocketServer } from './websocket/wsServer';
import { env } from './config/env';
import { getLanIpv4Addresses } from './network/lanAddresses';

const HOST = env.host;
const PORT = env.port;

function logServerAddresses(port: number | string): void {
  console.log(`Local: http://localhost:${port}`);

  const lanAddresses = getLanIpv4Addresses();

  if (lanAddresses.length === 0) {
    console.log('LAN: no external IPv4 addresses detected');
    return;
  }

  console.log('LAN addresses:');

  for (const { interfaceName, address } of lanAddresses) {
    console.log(`  ${interfaceName}: http://${address}:${port}`);
  }
}

async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Query OK');

    const server = createServer(app);

    setupWebSocketServer(server);

    server.listen(PORT, HOST, () => {
      console.log(`Server listening on ${HOST}:${PORT}`);
      logServerAddresses(PORT);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

void startServer();
