import { WebsiteMatchConfig } from "./types";

const STEAMID64_RE = /^7656119\d{10}$/;

export function isValidSteamId64(value: string): boolean {
  return STEAMID64_RE.test(value);
}

/**
 * Website launch URLs must be http/https only. Never allow javascript:,
 * file:, data:, or shell-style strings to reach a browser launch call.
 */
export function isSafeLaunchUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password && raw.length <= 8192;
}

/**
 * Icon fetch URLs additionally must not target obviously local/private
 * network hosts, to reduce SSRF risk from user-entered or redirected URLs.
 * This is a best-effort blocklist, not a full SSRF defense -- production
 * use should also validate resolved IPs at connect time.
 */
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^\[::1\]$/,
  /^::1$/,
];

export function isSafeFetchUrl(raw: string): boolean {
  if (!isSafeLaunchUrl(raw)) return false;
  const url = new URL(raw);
  return !PRIVATE_HOST_PATTERNS.some((re) => re.test(url.hostname));
}

/** Normalizes an origin the same way for both catalog storage and live matching. */
export function normalizeOrigin(raw: string): string {
  const url = new URL(raw);
  return `${url.protocol}//${url.hostname}${url.port ? ":" + url.port : ""}`.toLowerCase();
}

export function buildMatchConfigFromUrl(
  raw: string,
  pathMode?: WebsiteMatchConfig["pathMode"],
  preserveQuery = true
): WebsiteMatchConfig {
  const url = new URL(raw);
  const origin = normalizeOrigin(raw);
  pathMode ??= url.pathname === "/" && !url.search ? "any" : "exact";
  if (pathMode === "any") {
    return { origin, pathMode, preserveQuery, query: url.search };
  }
  return { origin, pathMode, path: url.pathname, preserveQuery, query: url.search };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Used before any filesystem delete: the path segment must be a bare UUID we generated. */
export function isManagedProfileSegment(segment: string): boolean {
  return UUID_RE.test(segment);
}
