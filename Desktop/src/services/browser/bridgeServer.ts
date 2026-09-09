import { createServer, Socket, Server } from "node:net";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

export class BridgeServer {
  private server?: Server;
  private clients = new Map<string, Socket>();
  private pending = new Map<string, { socket: Socket; resolve: (value: any) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();
  readonly secret: string;
  readonly socketPath: string;
  readonly infoPath: string;
  onIdentity: (accountId: string, signals: any) => void = () => {};
  constructor(private dataDir: string, private resolveToken: (token: string) => string | undefined) {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    const secretPath = path.join(dataDir, 'bridge-secret');
    if (!fs.existsSync(secretPath)) fs.writeFileSync(secretPath, randomBytes(32).toString('hex'), { mode: 0o600 });
    this.secret = fs.readFileSync(secretPath, 'utf8');
    this.socketPath = process.platform === 'win32' ? `\\\\.\\pipe\\sam-${this.secret.slice(0, 24)}` : path.join(dataDir, 'bridge.sock');
    this.infoPath = path.join(dataDir, 'bridge-connection.json');
  }
  async start(extensionId: string): Promise<void> {
    if (process.platform !== 'win32' && fs.existsSync(this.socketPath)) fs.unlinkSync(this.socketPath);
    this.server = createServer(socket => this.accept(socket));
    await new Promise<void>((resolve, reject) => { this.server!.once('error', reject); this.server!.listen(this.socketPath, resolve); });
    if (process.platform !== 'win32') fs.chmodSync(this.socketPath, 0o600);
    fs.writeFileSync(this.infoPath, JSON.stringify({ socketPath: this.socketPath, secret: this.secret, extensionId }), { mode: 0o600 });
  }
  private accept(socket: Socket) {
    let buffer = '', authenticated = false, accountId: string | undefined;
    socket.setEncoding('utf8');
    const timeout = setTimeout(() => { if (!accountId) socket.destroy(); }, 10000);
    socket.on('data', chunk => {
      buffer += chunk;
      if (Buffer.byteLength(buffer) > 1024 * 1024) return socket.destroy();
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
        try {
          const msg = JSON.parse(line);
          if (!authenticated) {
            if (msg.type !== 'auth' || typeof msg.secret !== 'string' || msg.secret.length !== this.secret.length || !timingSafeEqual(Buffer.from(msg.secret), Buffer.from(this.secret))) return socket.destroy();
            authenticated = true; socket.write(JSON.stringify({ type: 'auth_ok' }) + '\n'); continue;
          }
          if (!accountId) {
            if (msg.type !== 'hello' || typeof msg.token !== 'string') return socket.destroy();
            accountId = this.resolveToken(msg.token);
            if (!accountId) return socket.destroy();
            const prior = this.clients.get(accountId);
            if (prior && prior !== socket) prior.destroy();
            this.clients.set(accountId, socket); clearTimeout(timeout); continue;
          }
          if (msg.command === 'identity_signal') { this.onIdentity(accountId, msg.payload); continue; }
          const pending = this.pending.get(msg.id);
          if (!pending || pending.socket !== socket) continue;
          clearTimeout(pending.timer); this.pending.delete(msg.id);
          if (msg.ok === true) pending.resolve(msg.result); else pending.reject(new Error(typeof msg.error === 'string' ? msg.error : 'Browser command failed'));
        } catch { socket.destroy(); }
      }
    });
    socket.on('error', () => {});
    socket.on('close', () => {
      clearTimeout(timeout);
      if (accountId && this.clients.get(accountId) === socket) this.clients.delete(accountId);
      for (const [id, pending] of this.pending) if (pending.socket === socket) { clearTimeout(pending.timer); pending.reject(new Error('Browser bridge disconnected')); this.pending.delete(id); }
    });
  }
  connected(accountId: string) { return this.clients.has(accountId); }
  async wait(accountId: string, timeout = 30000) {
    const end = Date.now() + timeout;
    while (!this.connected(accountId)) { if (Date.now() > end) throw new Error('Browser companion did not connect. Close this account browser and retry setup.'); await new Promise(r => setTimeout(r, 200)); }
  }
  request<T = any>(accountId: string, command: string, payload: unknown = {}): Promise<T> {
    if (!['start_fresh', 'list_tabs', 'create_tab', 'arrange_tabs', 'close_windows', 'extensions', 'detect_identity'].includes(command)) return Promise.reject(new Error('Disallowed browser command'));
    const socket = this.clients.get(accountId);
    if (!socket) return Promise.reject(new Error('Account browser is not connected'));
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('Browser command timed out')); }, 20000);
      this.pending.set(id, { socket, resolve, reject, timer });
      socket.write(JSON.stringify({ id, command, payload }) + '\n');
    });
  }
  close() { for (const socket of this.clients.values()) socket.destroy(); this.server?.close(); }
}
