import { networkInterfaces } from 'node:os';

export interface LanAddress {
  interfaceName: string;
  address: string;
}

export function getLanIpv4Addresses(): LanAddress[] {
  const interfaces = networkInterfaces();
  const addresses: LanAddress[] = [];

  for (const [interfaceName, entries] of Object.entries(interfaces)) {
    if (!entries) {
      continue;
    }

    for (const entry of entries) {
      if (entry.family !== 'IPv4' || entry.internal) {
        continue;
      }

      addresses.push({
        interfaceName,
        address: entry.address,
      });
    }
  }

  return addresses.sort((first, second) => {
    return first.interfaceName.localeCompare(second.interfaceName);
  });
}
