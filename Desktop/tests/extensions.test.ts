import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspectExtensionFolder, computeDigest } from '../src/services/extensions/extensionProvisioner';
import { extensionId } from '../src/services/extensions/extensionStager';
describe('extension asset validation', () => {
  it('preserves the official CSFloat ID used by its website', () => {
    const manifest = JSON.parse(readFileSync('resources/extensions/csfloat-market-checker/manifest.json', 'utf8'));
    expect(extensionId(manifest.key)).toBe('jjicbefpemnphinccgikpdaagjebbnhg');
  });
  it('validates referenced assets including extension-root absolute paths', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sam-extension-test-'));
    mkdirSync(join(dir, 'css')); writeFileSync(join(dir, 'css/test.css'), 'body {}');
    writeFileSync(join(dir, 'index.html'), '<title>Popup</title>');
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ manifest_version: 3, name: 'Fixture', version: '1.0', action: { default_popup: 'index.html?page=popup' }, content_scripts: [{ css: ['/css/test.css'] }] }));
    expect(inspectExtensionFolder('cs2-trader', dir).compatibilityStatus).toBe('installed');
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ manifest_version: 3, name: 'Fixture', version: '1.0', background: { service_worker: 'missing.js' } }));
    expect(inspectExtensionFolder('cs2-trader', dir).compatibilityStatus).toBe('failed');
  });
  it('ignores only generated metadata while detecting code changes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sam-digest-test-')); writeFileSync(join(dir, 'code.js'), 'one');
    const digest = computeDigest(dir); mkdirSync(join(dir, '_metadata')); writeFileSync(join(dir, '_metadata/cache'), 'generated'); expect(computeDigest(dir)).toBe(digest);
    writeFileSync(join(dir, 'code.js'), 'two'); expect(computeDigest(dir)).not.toBe(digest);
  });
});
