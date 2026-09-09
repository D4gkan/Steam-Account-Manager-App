const REVOKED_JTIS = [];
const JWKS = [
	// kid:2 — new key, generated 2026-05-29
	{"crv":"P-256","ext":true,"key_ops":["verify"],"kty":"EC","x":"6JyuRLQ19icX7uGqH9xy34qly6JrEcDxM-8pCsktSmQ","y":"QdQTizo_WT8WamV-8j2dTujKgrG1PaqVSr_bARiuTc8","kid":"2"}
];
const ISSUER = '4a9a1079-a8be-410f-9f2e-e6a045bf58ff';

export async function verifyDomainJwt(jwt, domain) {
	const [header, payload, signature] = jwt.split('.');
	if (!header || !payload || !signature) {
		throw new Error('Invalid JWT format');
	}

	const decodedHeader = JSON.parse(base64UrlDecode(header));
	if (decodedHeader.typ != 'JWT' || decodedHeader.alg != 'ES256' || !decodedHeader.kid) {
		throw new Error('Invalid JWT header');
	}

	const jwk = JWKS.find(key => key.kid === decodedHeader.kid);
	if (!jwk) {
		throw new Error(`JWK not found for the given kid (${decodedHeader.kid})`);
	}

	// Verify claims
	const claims = JSON.parse(base64UrlDecode(payload));
	if (claims.iss !== ISSUER) {
		throw new Error('Invalid issuer');
	}

	if (!claims.jti) {
		throw new Error('JWT does not contain jti claim');
	}

	if (REVOKED_JTIS.includes(claims.jti)) {
		throw new Error('JWT has been revoked');
	}

	const now = Math.floor(Date.now() / 1000);
	if (!claims.exp) {
		throw new Error('JWT does not contain exp claim');
	}
	if (claims.exp < now) {
		throw new Error('JWT has expired');
	}
	if (claims.nbf && claims.nbf > now) {
		throw new Error('JWT is not yet valid');
	}

	const domains = claims.domains || [];
	if (!domains.some(pattern => domainMatchesPattern(pattern, domain))) {
		throw new Error('Domain does not match any allowed patterns');
	}

	// Validate that tokenEndpoint and statusEndpoint are relative paths (must start with /)
	// This ensures they are always resolved against the verified tab origin, never an external domain.
	for (const key of ['tokenEndpoint', 'statusEndpoint']) {
		if (!claims[key]) {
			throw new Error(`JWT does not contain ${key} claim`);
		}
		if (!claims[key].startsWith('/')) {
			throw new Error(`${key} in JWT must be a relative path starting with /`);
		}
	}

	// Verify signature
	const signedText = [header, payload].join('.');
	const signatureBuffer = base64UrlDecodeToArrayBuffer(signature);

	const publicKey = await crypto.subtle.importKey('jwk', jwk, {name: 'ECDSA', namedCurve: jwk.crv}, true, ['verify']);
	const verified = await crypto.subtle.verify({name: 'ECDSA', hash: {name: 'SHA-256'}}, publicKey, signatureBuffer, new TextEncoder().encode(signedText));
	if (!verified) {
		throw new Error('JWT signature verification failed');
	}

	return {claims};
}

function base64UrlDecode(str) {
	return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

function base64UrlDecodeToArrayBuffer(str) {
	const decoded = base64UrlDecode(str);
	const buffer = new ArrayBuffer(decoded.length);
	const view = new Uint8Array(buffer);
	for (let i = 0; i < decoded.length; i++) {
		view[i] = decoded.charCodeAt(i);
	}
	return buffer;
}

function domainMatchesPattern(pattern, domain) {
	if (pattern.startsWith('*.')) {
		// Match subdomains and also root domain (eliminate need for redundant *.example.com and example.com)
		return domain.endsWith(pattern.slice(1)) || domain === pattern.slice(2);
	}
	return domain === pattern;
}
