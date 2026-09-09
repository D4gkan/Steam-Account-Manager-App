'use strict';
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const os = require('node:os');
const MAX = 1024 * 1024;
function main() {
  const infoPath = process.env.SAM_BRIDGE_INFO || path.join(process.platform === 'win32' ? process.env.APPDATA : (process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')), 'SteamAccountManagerApp', 'bridge-connection.json');
  const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
  if (!process.argv.some(arg => arg === `chrome-extension://${info.extensionId}/`)) return;
  const socket = net.connect(info.socketPath);
  let nativeBuffer = Buffer.alloc(0), managerBuffer = '', authenticated = false;
  const queued = [];
  const exit = () => process.exit(0);
  socket.on('error', exit); socket.on('close', exit); process.stdin.on('end', exit);
  socket.on('connect', () => socket.write(JSON.stringify({ type: 'auth', secret: info.secret }) + '\n'));
  socket.setEncoding('utf8');
  socket.on('data', chunk => {
    managerBuffer += chunk; if (Buffer.byteLength(managerBuffer) > MAX) return exit();
    let i;
    while ((i = managerBuffer.indexOf('\n')) >= 0) {
      const line = managerBuffer.slice(0, i); managerBuffer = managerBuffer.slice(i + 1);
      try {
        const msg = JSON.parse(line);
        if (!authenticated) { if (msg.type !== 'auth_ok') return exit(); authenticated = true; queued.forEach(m => socket.write(m)); continue; }
        const bytes = Buffer.from(JSON.stringify(msg)); if (bytes.length > MAX) return exit();
        const header = Buffer.alloc(4); header.writeUInt32LE(bytes.length); process.stdout.write(Buffer.concat([header, bytes]));
      } catch { return exit(); }
    }
  });
  process.stdin.on('data', chunk => {
    nativeBuffer = Buffer.concat([nativeBuffer, chunk]);
    while (nativeBuffer.length >= 4) {
      const size = nativeBuffer.readUInt32LE(); if (size > MAX) return exit();
      if (nativeBuffer.length < size + 4) break;
      const bytes = nativeBuffer.subarray(4, size + 4); nativeBuffer = nativeBuffer.subarray(size + 4);
      try { const line = JSON.stringify(JSON.parse(bytes.toString('utf8'))) + '\n'; if (authenticated) socket.write(line); else { if (queued.length >= 10) return exit(); queued.push(line); } } catch { return exit(); }
    }
  });
}
try { main(); } catch { process.exit(0); }
