import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connect, Socket } from 'node:net';
import { BridgeServer } from '../src/services/browser/bridgeServer';
const resources: Array<BridgeServer | Socket> = [];
afterEach(() => { for (const r of resources.splice(0)) r instanceof BridgeServer ? r.close() : r.destroy(); });
async function setup() { const b = new BridgeServer(mkdtempSync(join(tmpdir(), 'sam-bridge-test-')), token => token === 'profile-capability' ? 'account-a' : undefined); await b.start('a'.repeat(32)); resources.push(b); return b; }
const wait = (ms = 30) => new Promise(r => setTimeout(r, ms));
describe('native bridge authentication', () => {
  it('rejects invalid install secrets without accepting a profile', async () => {
    const b = await setup(); const s = connect(b.socketPath); resources.push(s);
    const closed = new Promise(r => s.on('close', r)); s.on('error', () => {});
    s.write(JSON.stringify({ type: 'auth', secret: 'wrong' }) + '\n'); await closed;
    expect(b.connected('account-a')).toBe(false);
  });
  it('requires a profile capability even after install authentication', async () => {
    const b = await setup(); const s = connect(b.socketPath); resources.push(s); s.on('error', () => {}); s.resume();
    const closed = new Promise(r => s.on('close', r));
    s.write(JSON.stringify({ type: 'auth', secret: b.secret }) + '\n' + JSON.stringify({ type: 'hello', token: 'forged' }) + '\n'); await closed;
    expect(b.connected('account-a')).toBe(false);
  });
  it('maps a valid capability and correlates only same-socket replies', async () => {
    const b = await setup(); const s = connect(b.socketPath); resources.push(s); s.setEncoding('utf8');
    s.write(JSON.stringify({ type: 'auth', secret: b.secret }) + '\n' + JSON.stringify({ type: 'hello', token: 'profile-capability' }) + '\n');
    await b.wait('account-a', 1000);
    s.on('data', data => { for (const line of String(data).trim().split('\n')) { const msg = JSON.parse(line); if (msg.command) s.write(JSON.stringify({ id: msg.id, ok: true, result: { tabs: [] } }) + '\n'); } });
    expect(await b.request('account-a', 'list_tabs')).toEqual({ tabs: [] });
    expect(await b.request('account-a', 'start_fresh', { url: 'https://fixture.example/requested' })).toEqual({ tabs: [] });
    await expect(b.request('account-a', 'execute_script')).rejects.toThrow('Disallowed');
  });
});
