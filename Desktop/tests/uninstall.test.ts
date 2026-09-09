import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const fixtures: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'sam-uninstall-test-'));
  fixtures.push(root);
  const data = join(root, 'SteamAccountManagerApp');
  const unrelated = join(root, 'other-app');
  mkdirSync(data); mkdirSync(unrelated);
  writeFileSync(join(data, 'account-fixture'), 'test');
  writeFileSync(join(unrelated, 'keep'), 'test');
  return { root, data, unrelated };
}
afterEach(() => { for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe.skipIf(process.platform !== 'win32')('Windows consented data cleanup', () => {
  function remove(root: string) {
    return spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', resolve('packaging/uninstall-data.ps1'), '-AppDataRoot', root], { encoding: 'utf8' });
  }
  it('erases only the app directory after consent', () => {
    const f = fixture();
    const result = remove(f.root);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(existsSync(f.data)).toBe(false);
    expect(existsSync(join(f.unrelated, 'keep'))).toBe(true);
  });
  it('preserves linked directories and their targets', () => {
    const f = fixture();
    symlinkSync(f.unrelated, join(f.data, 'linked'), 'junction');
    expect(remove(f.root).status).toBe(1);
    expect(existsSync(join(f.unrelated, 'keep'))).toBe(true);
    expect(existsSync(join(f.data, 'account-fixture'))).toBe(true);
  });
  it('rejects relative paths', () => { expect(remove('relative').status).toBe(1); });
});

describe.skipIf(process.platform !== 'linux')('Linux uninstall consent', () => {
  function remove(root: string, consent: boolean) {
    return spawnSync('bash', ['-c', 'source "$1"; sam_confirm() { ' + (consent ? 'return 0;' : 'return 1;') + ' }; sam_remove_data', 'test', resolve('packaging/uninstall-linux.sh')], {
      env: { ...process.env, XDG_CONFIG_HOME: root, DISPLAY: '', WAYLAND_DISPLAY: '' }, encoding: 'utf8',
    });
  }
  it('keeps data when the user declines', () => {
    const f = fixture();
    expect(remove(f.root, false).status).toBe(0);
    expect(existsSync(join(f.data, 'account-fixture'))).toBe(true);
  });
  it('erases only app data when the user agrees', () => {
    const f = fixture();
    const result = remove(f.root, true);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(existsSync(f.data)).toBe(false);
    expect(existsSync(join(f.unrelated, 'keep'))).toBe(true);
  });
  it('preserves a linked app root', () => {
    const f = fixture();
    rmSync(f.data, { recursive: true });
    symlinkSync(f.unrelated, f.data);
    expect(remove(f.root, true).status).toBe(1);
    expect(existsSync(join(f.unrelated, 'keep'))).toBe(true);
  });
  it('keeps data during noninteractive uninstall', () => {
    const f = fixture();
    const result = spawnSync('bash', [resolve('packaging/uninstall-linux.sh'), '--data-only'], {
      env: { ...process.env, XDG_CONFIG_HOME: f.root, DISPLAY: '', WAYLAND_DISPLAY: '' }, encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(existsSync(join(f.data, 'account-fixture'))).toBe(true);
  });
});
