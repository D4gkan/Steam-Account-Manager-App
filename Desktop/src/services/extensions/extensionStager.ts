import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash, generateKeyPairSync, randomUUID } from 'node:crypto';
import { computeDigest, inspectAllExtensions } from './extensionProvisioner';
export function extensionId(publicKey: string): string {
  return [...createHash('sha256').update(Buffer.from(publicKey, 'base64')).digest('hex').slice(0, 32)].map(c => String.fromCharCode(97 + parseInt(c, 16))).join('');
}
export function stageExtensions(sourceRoot: string, dataDir: string) {
  const records = inspectAllExtensions(sourceRoot);
  const keyRoot = path.join(dataDir, 'extension-keys'); fs.mkdirSync(keyRoot, { recursive: true, mode: 0o700 });
  return records.map(record => {
    if (record.compatibilityStatus !== 'installed' || !record.digest) return { ...record, path: null };
    const source = path.join(sourceRoot, record.key);
    const manifest = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
    if (!manifest.key) {
      const keyFile = path.join(keyRoot, record.key + '.pub');
      if (!fs.existsSync(keyFile)) {
        const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
        fs.writeFileSync(keyFile, publicKey.export({ type: 'spki', format: 'der' }).toString('base64'), { mode: 0o600 });
      }
      manifest.key = fs.readFileSync(keyFile, 'utf8');
    }
    const actualId = extensionId(manifest.key);
    // CSFloat's website addresses its Web Store ID directly.
    if (record.key === 'csfloat-market-checker' && actualId !== record.expectedLegacyId) {
      return { ...record, actualId, compatibilityStatus: 'incompatible' as const, path: null };
    }
    const destination = path.join(dataDir, 'extensions', record.key, `${record.digest.slice(0, 20)}-${actualId}`);
    if (!fs.existsSync(destination)) {
      const temporary = destination + '.staging-' + randomUUID();
      fs.mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
      fs.cpSync(source, temporary, { recursive: true, filter: file => !file.split(path.sep).includes('_metadata') });
      fs.writeFileSync(path.join(temporary, 'manifest.json'), JSON.stringify(manifest));
      fs.writeFileSync(path.join(temporary, 'sam-provenance.json'), JSON.stringify({ suppliedDigest: record.digest, suppliedVersion: record.version, legacyId: record.expectedLegacyId, actualId, publicKeyAdded: !JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8')).key, authenticity: 'User-supplied package; publisher signature not independently verified' }, null, 2));
      fs.renameSync(temporary, destination);
      fs.writeFileSync(destination + '.sha256', computeDigest(destination));
    }
    if (!fs.existsSync(destination + '.sha256') || fs.readFileSync(destination + '.sha256', 'utf8') !== computeDigest(destination)) throw Error(`Extension integrity check failed: ${record.key}. Restore its staged package while browsers are closed.`);
    return { ...record, actualId, path: destination };
  });
}
