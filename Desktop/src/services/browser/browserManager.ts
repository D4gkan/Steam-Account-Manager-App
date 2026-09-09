import { spawn, execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { randomBytes, createHash, generateKeyPairSync } from 'node:crypto';
import { Account, BrowserState, ExtensionKey } from '../../domain/types';
import { isManagedProfileSegment } from '../../domain/validation';
import { BridgeServer } from './bridgeServer';
import { computeDigest } from '../extensions/extensionProvisioner';
import { stageExtensions } from '../extensions/extensionStager';

export class BrowserManager {
  readonly bridge: BridgeServer;
  readonly extensionId: string;
  private tokens = new Map<string, string>();
  private launching = new Map<string, Promise<void>>();
  private processes = new Map<string, number>();
  private runtimeJob?: Promise<string>;
  private publicKey: string;
  setupStatus = 'Ready';
  private staged?: ReturnType<typeof stageExtensions>;
  extensionPackages() { return this.staged ??= stageExtensions(path.join(this.resources, 'extensions'), this.dataDir); }
  constructor(readonly dataDir: string, readonly resources: string, private executable: string, private accounts: () => Account[]) {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    const keyPath = path.join(dataDir, 'companion-key.json');
    if (!fs.existsSync(keyPath)) {
      const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
      fs.writeFileSync(keyPath, JSON.stringify({ publicKey: pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64') }), { mode: 0o600 });
    }
    this.publicKey = JSON.parse(fs.readFileSync(keyPath, 'utf8')).publicKey;
    this.extensionId = [...createHash('sha256').update(Buffer.from(this.publicKey, 'base64')).digest('hex').slice(0, 32)].map(c => String.fromCharCode(97 + parseInt(c, 16))).join('');
    for (const a of accounts()) {
      const tokenPath = path.join(dataDir, 'companions', a.id, 'token');
      if (fs.existsSync(tokenPath)) this.tokens.set(fs.readFileSync(tokenPath, 'utf8'), a.id);
    }
    this.bridge = new BridgeServer(dataDir, token => this.tokens.get(token));
  }
  async start() { await this.bridge.start(this.extensionId); this.registerHost(); }
  private registerHost(profileDir?: string) {
    const name = 'com.steamaccountmanager.bridge';
    const host = path.join(this.resources, 'native-bridge', 'bin', process.platform === 'win32' ? 'sam-native.exe' : 'sam-native');
    if (!fs.existsSync(host)) { this.setupStatus = 'Native host missing. Build the platform native host before launching accounts.'; return; }
    const manifest = { name, description: 'Steam Account Manager native bridge', path: host, type: 'stdio', allowed_origins: [`chrome-extension://${this.extensionId}/`] };
    const target = process.platform === 'win32' ? path.join(this.dataDir, name + '.json') : path.join(profileDir || path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'chromium'), 'NativeMessagingHosts', name + '.json');
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    fs.writeFileSync(target, JSON.stringify(manifest), { mode: 0o600 });
    if (process.platform === 'win32') execFileSync('reg.exe', ['ADD', `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${name}`, '/ve', '/t', 'REG_SZ', '/d', target, '/f'], { windowsHide: true, stdio: 'ignore' });
  }
  profile(a: Account): string {
    if (!isManagedProfileSegment(a.profileRelativePath)) throw Error('Invalid managed profile path');
    const root = path.resolve(this.dataDir, 'profiles');
    const target = path.resolve(root, a.profileRelativePath);
    if (path.dirname(target) !== root) throw Error('Profile outside managed storage');
    if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) throw Error('Linked profiles are not allowed');
    return target;
  }
  createProfile(a: Account) {
    const dir = this.profile(a);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const marker = path.join(dir, '.sam-owner');
    if (fs.existsSync(marker) && fs.readFileSync(marker, 'utf8') !== a.id) throw Error('Profile ownership mismatch');
    fs.writeFileSync(marker, a.id, { mode: 0o600 });
  }
  state(id: string): BrowserState {
    if (this.bridge.connected(id)) return 'open';
    if (this.launching.has(id)) return 'starting';
    const pid = this.processes.get(id);
    if (pid) { try { process.kill(pid, 0); return 'unknown'; } catch { this.processes.delete(id); return 'closed'; } }
    return 'unknown';
  }
  private companion(a: Account) {
    const root = path.join(this.dataDir, 'companions', a.id);
    fs.mkdirSync(root, { recursive: true, mode: 0o700 });
    const tokenFile = path.join(root, 'token');
    if (!fs.existsSync(tokenFile)) fs.writeFileSync(tokenFile, randomBytes(32).toString('hex'), { mode: 0o600 });
    const token = fs.readFileSync(tokenFile, 'utf8'); this.tokens.set(token, a.id);
    const source = path.join(this.resources, 'companion-extension');
    const dir = path.join(root, computeDigest(source).slice(0, 24));
    if (!fs.existsSync(dir)) {
      fs.cpSync(source, dir, { recursive: true });
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); manifest.key = this.publicKey;
      fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
      fs.writeFileSync(path.join(dir, 'profile-config.js'), `export const token = ${JSON.stringify(token)};`, { mode: 0o600 });
    }
    return dir;
  }
  private findRuntime(root: string): string | undefined {
    if (!fs.existsSync(root)) return;
    const revision = JSON.parse(fs.readFileSync(path.join(path.dirname(require.resolve('playwright-core/package.json')), 'browsers.json'), 'utf8')).browsers.find((b: any) => b.name === 'chromium').revision;
    const executable = process.platform === 'win32' ? 'chrome-win64/chrome.exe' : 'chrome-linux64/chrome';
    const candidate = path.join(root, `chromium-${revision}`, executable);
    if (fs.existsSync(candidate)) return candidate;
  }
  async runtime(): Promise<string> {
    const bundled = this.findRuntime(path.join(this.resources, 'runtime'));
    if (bundled) return bundled;
    const root = path.join(this.dataDir, 'runtime');
    const cached = this.findRuntime(root); if (cached) return cached;
    if (this.runtimeJob) return this.runtimeJob;
    this.runtimeJob = (async () => {
      this.setupStatus = 'Downloading Chromium. This may take several minutes; retry is available if it fails.';
      const cli = path.join(path.dirname(require.resolve('playwright-core/package.json')), 'cli.js');
      await new Promise<void>((resolve, reject) => {
        const child = spawn(this.executable, [cli, 'install', 'chromium'], { windowsHide: true, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', PLAYWRIGHT_BROWSERS_PATH: root }, stdio: ['ignore', 'pipe', 'pipe'] });
        child.stdout?.on('data', bytes => { const text = String(bytes).replace(/\x1b\[[0-9;]*m/g, '').trim(); if (text) this.setupStatus = text.slice(-300); });
        child.stderr?.on('data', () => {});
        child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(Error('Chromium download failed. Check connectivity and retry.')));
      });
      const result = this.findRuntime(root); if (!result) throw Error('Downloaded Chromium executable is missing');
      this.setupStatus = 'Ready'; return result;
    })();
    try { return await this.runtimeJob; } finally { this.runtimeJob = undefined; }
  }
  async ensure(a: Account, initialUrl?: string): Promise<void> {
    if (this.bridge.connected(a.id)) return;
    if (this.launching.has(a.id)) return this.launching.get(a.id);
    const job = this.launch(a, initialUrl); this.launching.set(a.id, job);
    try { await job; } finally { this.launching.delete(a.id); }
  }
  private async launch(a: Account, initialUrl?: string) {
    const profile = this.profile(a);
    if (!fs.existsSync(profile) || fs.readFileSync(path.join(profile, '.sam-owner'), 'utf8') !== a.id) throw Error('Profile is missing or ownership cannot be verified. Restore its data or remove the pending account.');
    // Linux resolves user-level native hosts inside the --user-data-dir, not
    // Chromium's default config directory. Refresh this after installation moves.
    if (process.platform === 'linux') this.registerHost(profile);
    if (this.running(a)) { await this.bridge.wait(a.id); return; }
    // Chromium owns profile locking; never delete its locks. Its singleton startup
    // reconnects an existing browser instead of opening concurrent profile owners.
    const exe = await this.runtime();
    const packages = this.extensionPackages();
    const missing = packages.filter(p => !p.path).map(p => p.key);
    this.setupStatus = missing.length ? `Degraded setup: required extensions unavailable: ${missing.join(', ')}` : 'All eight extension packages staged. Authenticated website functionality needs manual verification.';
    const dirs = packages.flatMap(p => p.path ? [p.path] : []);
    dirs.push(this.companion(a));
    if (dirs.some(p => p.includes(','))) throw Error('Extension paths containing commas are not supported. Move the app to another installation directory.');
    if (this.running(a)) { await this.bridge.wait(a.id); return; }
    // A blank window keeps Chromium alive while its companion starts. Launching
    // without a window can exit before the native bridge connects. The companion
    // replaces this window's tabs via start_fresh; live browsers are never reset.
    const args = [`--user-data-dir=${profile}`, `--disable-extensions-except=${dirs.join(',')}`, `--load-extension=${dirs.join(',')}`, '--no-first-run', '--disable-background-mode', '--no-default-browser-check', '--disable-session-crashed-bubble', 'about:blank'];
    const child = spawn(exe, args, { detached: true, stdio: 'ignore', windowsHide: false, env: { ...process.env, SAM_BRIDGE_INFO: this.bridge.infoPath } });
    await new Promise<void>((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    if (child.pid) this.processes.set(a.id, child.pid);
    child.unref();
    await this.bridge.wait(a.id);
    await this.bridge.request(a.id, 'start_fresh', { url: initialUrl || 'https://store.steampowered.com/' });
  }
  running(a: Account): boolean {
    const profile = this.profile(a);
    if (process.platform === 'win32') {
      const script = 'Get-CimInstance Win32_Process -Filter "Name = \'chrome.exe\'" | Select-Object -ExpandProperty CommandLine | ConvertTo-Json -Compress';
      const output = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { windowsHide: true, encoding: 'utf8' });
      const parsed: string[] | string | null = output.trim() ? JSON.parse(output) : [];
      return (Array.isArray(parsed) ? parsed : [parsed]).some(command => typeof command === 'string' && command.toLowerCase().includes(`--user-data-dir=${profile}`.toLowerCase()));
    }
    for (const pid of fs.readdirSync('/proc').filter(p => /^\d+$/.test(p))) {
      try { if (fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0').includes(`--user-data-dir=${profile}`)) return true; } catch {}
    }
    return false;
  }
  async deleteAccount(a: Account) {
    const profile = this.profile(a);
    if (this.bridge.connected(a.id)) throw Error('Close this account browser before deleting its data.');
    if (this.running(a)) throw Error('Close this account browser before deleting its data.');
    if (fs.existsSync(profile)) {
      if (fs.readFileSync(path.join(profile, '.sam-owner'), 'utf8') !== a.id) throw Error('Profile ownership mismatch');
      fs.rmSync(profile, { recursive: true });
    }
  }
}
