import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import ipaddr from 'ipaddr.js';
import { isSafeLaunchUrl } from '../../domain/validation';

export function publicAddress(address: string): boolean {
  try { const parsed = ipaddr.process(address); return parsed.range() === 'unicast'; } catch { return false; }
}
export async function safeFetch(raw: string, maxBytes = 2 * 1024 * 1024): Promise<{ bytes: Buffer; url: string; type: string }> {
  let current = raw;
  const deadline = Date.now() + 10000;
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (!isSafeLaunchUrl(current)) throw Error('Invalid fetch URL');
    const url = new URL(current);
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const addresses = await Promise.race([lookup(hostname, { all: true }), new Promise<never>((_, reject) => { const timer = setTimeout(() => reject(Error('DNS timeout')), 5000); timer.unref(); })]);
    if (!addresses.length || addresses.some(a => !publicAddress(a.address))) throw Error('Local and reserved network fetches are blocked');
    const address = addresses[0];
    const response = await new Promise<{ bytes: Buffer; location?: string; status: number; type: string }>((resolve, reject) => {
      // Pin the validated DNS answer for this connection; redirects are checked again.
      const req = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
        family: address.family,
        lookup: (_host, _opts, callback) => callback(null, address.address, address.family),
        headers: { 'User-Agent': 'SteamAccountManager/0.2', 'Accept': 'text/html,image/png,image/jpeg,image/x-icon;q=0.9' },
      }, res => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) { res.resume(); resolve({ bytes: Buffer.alloc(0), location: res.headers.location, status, type: '' }); return; }
        if (status !== 200 || Number(res.headers['content-length'] || 0) > maxBytes) { res.destroy(); reject(Error('Icon response rejected')); return; }
        const chunks: Buffer[] = []; let size = 0;
        res.on('data', chunk => { size += chunk.length; if (size > maxBytes) { res.destroy(Error('Download too large')); return; } chunks.push(chunk); });
        res.on('error', reject); res.on('end', () => resolve({ bytes: Buffer.concat(chunks), status, type: String(res.headers['content-type'] || '').split(';')[0] }));
      });
      const timer = setTimeout(() => req.destroy(Error('Fetch timeout')), Math.max(1, deadline - Date.now()));
      req.on('close', () => clearTimeout(timer)); req.on('error', reject); req.end();
    });
    if (response.location) { current = new URL(response.location, current).href; continue; }
    return { ...response, url: current };
  }
  throw Error('Too many redirects');
}
