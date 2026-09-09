#!/usr/bin/env node
/**
 * Generates an RSA keypair for the companion extension and computes the
 * Chrome/Chromium extension ID that keypair will produce when the public
 * key is embedded in manifest.json's "key" field.
 *
 * Why this matters: none of the eight supplied third-party extensions
 * declare a "key" field, so their unpacked-load IDs are derived from the
 * absolute install path and are NOT stable across machines. We cannot fix
 * that for third-party packages we don't control. We CAN and MUST fix it
 * for our own companion extension, because the native messaging host
 * manifest has to allowlist a specific extension ID
 * (chrome-extension://<id>/) -- an unstable ID would break native
 * messaging on every reinstall or path change.
 *
 * Run once per build/release (not per machine): `node generate-companion-key.js`
 * Commit the resulting `key` field into companion-extension/manifest.json
 * and use the printed extension ID in native-bridge's host manifest
 * template and in ipc/bridge auth allowlists. Keep the private key out of
 * version control; only the derived public "key" field and ID are needed
 * at runtime.
 */
const crypto = require("node:crypto");

function computeChromeExtensionId(publicKeyDer) {
  const hash = crypto.createHash("sha256").update(publicKeyDer).digest();
  const first16Bytes = hash.subarray(0, 16);
  const hex = first16Bytes.toString("hex");
  // Chrome maps hex nibbles 0-9,a-f to letters a-p.
  return hex.replace(/[0-9a-f]/g, (c) => String.fromCharCode(97 + parseInt(c, 16)));
}

function main() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const keyFieldBase64 = publicKey.toString("base64");
  const extensionId = computeChromeExtensionId(publicKey);

  console.log("Extension ID (stable, deterministic from the keypair):");
  console.log("  " + extensionId);
  console.log();
  console.log('manifest.json "key" field (paste into companion-extension/manifest.json):');
  console.log("  " + keyFieldBase64);
  console.log();
  console.log("Private key (PKCS8 PEM) -- store securely OUTSIDE version control.");
  console.log("Only needed if you ever need to re-sign/re-derive; not required at runtime");
  console.log("since the public key embedded via the manifest's \"key\" field is sufficient");
  console.log("for Chromium to compute the same ID on every load:");
  console.log(privateKey);
}

main();
