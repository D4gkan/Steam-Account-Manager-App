/**
 * @typedef PartnerSiteStatus
 * @property {string} name
 * @property {string} configuredDomain
 * @property {string} tokenEndpoint
 * @property {string} statusEndpoint
 * @property {string} supportUrl
 * @property {null|{steam_id: string, access_token_expires_at: string|null}} tokenStatus
 * @property {null|string} tokenStatusFetchError
 */

/**
 * @typedef DomainConfig
 * @property {string} name
 * @property {string} tokenEndpoint
 * @property {string} statusEndpoint
 * @property {string} supportUrl
 */

/**
 * @returns {Promise<PartnerSiteStatus[]>}
 */
export async function getPartnerSiteStatuses() {
	const domainConfigs = await enumerateDomainConfigs();
	const domains = Object.keys(domainConfigs);
	return await Promise.all(domains.map(domain => fetchStatusFromSite(domain, domainConfigs[domain])));
}

/**
 * @param {SteamAccessTokenData} accessTokenData
 * @returns {Promise<PartnerSiteStatus[]>}
 */
export async function uploadNewAccessToken(accessTokenData) {
	const domainConfigs = await enumerateDomainConfigs();
	const domains = Object.keys(domainConfigs);
	return await Promise.all(domains.map(async (domain) => {
		const domainConfig = domainConfigs[domain];
		try {
			const status = await fetchStatusFromSite(domain, domainConfig);
			if (status.tokenStatus?.steam_id !== accessTokenData.steam_id) {
				console.warn(`Skipping upload for ${domain} - Steam ID mismatch: expected ${status.tokenStatus?.steam_id}, got ${accessTokenData.steam_id}`);
				return status;
			}

			// If the site's token is newer, skip upload
			if (
				status.tokenStatus?.access_token_expires_at
				&& new Date(status.tokenStatus.access_token_expires_at) >= new Date(accessTokenData.expires_at)
			) {
				console.log(`Skipping upload for ${domain} - existing token is newer`);
				return status;
			}

			// SteamID matches, proceed to upload the access token
			const response = await fetch(domainConfig.tokenEndpoint, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({access_token: accessTokenData.access_token})
			});

			if (!response.ok) {
				throw new Error(`HTTP status ${response.status} for token upload`);
			}

			const result = await response.json();
			if (!result || !result.success) {
				throw new Error('Failed to upload new access token');
			}

			// Token upload success, update status and return it
			return await fetchStatusFromSite(domain, domainConfig);
		} catch (ex) {
			return {
				name: domainConfig.name,
				configuredDomain: domain,
				tokenEndpoint: domainConfig.tokenEndpoint,
				statusEndpoint: domainConfig.statusEndpoint,
				tokenStatus: null,
				tokenStatusFetchError: ex.message || ex.toString()
			};
		}
	}));
}

/**
 * @returns {Promise<{[domain: string]: DomainConfig}>}
 */
export async function enumerateDomainConfigs() {
	const keys = (await chrome.storage.sync.getKeys()).filter(k => k.startsWith('domain_registration:'));
	const values = await chrome.storage.sync.get(keys);
	const output = {};

	for (const key in values) {
		output[key.replace(/^domain_registration:/, '')] = values[key];
	}

	return output;
}

/**
 *
 * @param {string} domain
 * @param {DomainConfig} domainConfig
 * @returns {Promise<PartnerSiteStatus>}
 */
async function fetchStatusFromSite(domain, domainConfig) {
	try {
		const domainStatus = await fetch(domainConfig.statusEndpoint);
		if (!domainStatus.ok) {
			throw new Error(`HTTP status ${domainStatus.status}`);
		}

		const result = await domainStatus.json();
		if (!result || !result.success || !result.data || !result.data.steam_id) {
			throw new Error('Invalid response format');
		}

		return {
			name: domainConfig.name,
			configuredDomain: domain,
			tokenEndpoint: domainConfig.tokenEndpoint,
			statusEndpoint: domainConfig.statusEndpoint,
			supportUrl: domainConfig.supportUrl,
			tokenStatus: {
				steam_id: result.data.steam_id,
				access_token_expires_at: result.data.access_token_expires_at || null
			},
			tokenStatusFetchError: null
		};
	} catch (ex) {
		return {
			name: domainConfig.name,
			configuredDomain: domain,
			tokenEndpoint: domainConfig.tokenEndpoint,
			statusEndpoint: domainConfig.statusEndpoint,
			supportUrl: domainConfig.supportUrl,
			tokenStatus: null,
			tokenStatusFetchError: ex.message || ex.toString()
		};
	}
}
