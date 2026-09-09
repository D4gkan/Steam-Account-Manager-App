import {verifyDomainJwt} from './jwt-verifier.js';
import {doSteamSync, getStatusPayload} from './service-worker.js';

const g_DomainTriggeredSyncTime = {};

export async function handleContentScriptMessage(message, sender, sendResponse) {
	const tabUrl = new URL(sender.tab.url);
	const payload = message.payload;

	try {
		let response = {};

		switch (message.type) {
			case 'checkTabAuthorized':
				response = await checkTabAuthorized(tabUrl, payload);
				break;

			case 'getDomainConfig':
				response = await getDomainConfig(tabUrl, payload);
				break;

			case 'setDomainConfig':
				response = await setDomainConfig(tabUrl, payload);
				break;

			case 'clearDomainConfig':
				response = await clearDomainConfig(tabUrl);
				break;

			case 'triggerSync':
				response = await triggerSync(tabUrl, payload);
				break;

			case 'getStatus':
				response = await getStatus(tabUrl);
				break;

			default:
				throw new Error(`Unknown message type: ${message.type}`);
		}

		sendResponse({response});
	} catch (ex) {
		sendResponse({error: ex.message});
	}
}

async function checkTabAuthorized(tabUrl, payload) {
	if (!payload || !payload.jwt) {
		return {authorized: false, message: 'Missing JWT'};
	}

	try {
		const {claims} = await verifyDomainJwt(payload.jwt, tabUrl.hostname);
		return {authorized: true, claims};
	} catch (ex) {
		return {authorized: false, message: ex.message};
	}
}

async function getDomainConfig(tabUrl, payload) {
	const domainStorageKey = getDomainStorageKey(tabUrl.hostname);
	const result = await chrome.storage.sync.get(domainStorageKey);
	const domainConfig = (result && result[domainStorageKey]) || null;
	return {domainConfig};
}

async function setDomainConfig(tabUrl, payload) {
	// Validate required fields from the page
	const requiredFieldTypes = {
		jwt: 'string',
		supportUrl: 'string',
		name: 'string'
	};

	for (const key in requiredFieldTypes) {
		if (typeof payload[key] !== requiredFieldTypes[key]) {
			throw new Error(`Invalid type for ${key}: expected ${requiredFieldTypes[key]}, got ${typeof payload[key]}`);
		}

		if (payload[key].trim().length === 0) {
			throw new Error(`Invalid value for ${key}: cannot be empty`);
		}
	}

	// Verify JWT — tokenEndpoint and statusEndpoint come from the signed claims, not the page payload
	const {authorized, message, claims} = await checkTabAuthorized(tabUrl, payload);
	if (!authorized) {
		throw new Error(message);
	}

	const tokenEndpoint = `https://${tabUrl.host}${claims.tokenEndpoint}`;
	const statusEndpoint = `https://${tabUrl.host}${claims.statusEndpoint}`;

	if (!tokenEndpoint || !statusEndpoint) {
		throw new Error('Missing tokenEndpoint or statusEndpoint');
	}

	// Build the config using page-supplied name/supportUrl, but endpoints from the verified JWT claims
	const domainConfig = {
		jwt: payload.jwt,
		name: payload.name,
		supportUrl: payload.supportUrl,
		tokenEndpoint,
		statusEndpoint,
	};

	const domainStorageKey = getDomainStorageKey(tabUrl.hostname);
	await chrome.storage.sync.set({[domainStorageKey]: domainConfig});
	await doSteamSync();
	return {success: true};
}

async function clearDomainConfig(tabUrl) {
	const domainStorageKey = getDomainStorageKey(tabUrl.hostname);
	await chrome.storage.sync.remove(domainStorageKey);
	await doSteamSync();
	return {success: true};
}

async function triggerSync(tabUrl, payload) {
	if (!payload || !payload.jwt) {
		throw new Error('Missing JWT');
	}

	const {authorized, message} = await checkTabAuthorized(tabUrl, payload);
	if (!authorized) {
		throw new Error(message);
	}

	// Check if a sync was triggered in the last minute
	const lastSyncTime = g_DomainTriggeredSyncTime[tabUrl.hostname] || 0;
	if (Date.now() - lastSyncTime < 60 * 1000) {
		throw new Error('Sync already triggered in the last minute');
	}

	g_DomainTriggeredSyncTime[tabUrl.hostname] = Date.now();
	await doSteamSync();
	return {success: true};
}

async function getStatus(tabUrl) {
	let statusPayload = getStatusPayload();
	let siteStatus = statusPayload.partnerSiteStatuses.find(site => site.configuredDomain === tabUrl.hostname);

	if (!siteStatus) {
		throw new Error('Domain is not configured');
	}

	return {
		siteStatus,
		steamAccessTokenData: {
			expiresAt: statusPayload.steamAccessTokenData?.expires_at || null,
			steamId: statusPayload.steamAccessTokenData?.steam_id || null,
		}
	};
}

function getDomainStorageKey(domain) {
	return `domain_registration:${domain}`;
}
