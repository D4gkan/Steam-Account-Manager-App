/**
 * @typedef SteamAccessTokenData
 * @property {string} steam_id
 * @property {string} access_token
 * @property {Date} expires_at
 */

/**
 * @returns {Promise<null|SteamAccessTokenData>}
 */
export async function getSteamAccessToken() {
	const cookie = await getSteamLoginSecureCookie();
	if (!cookie) {
		// If no cookie exists, user is not logged into Steam. If their token is simply expired the cookie would still exist.
		return null;
	}

	const jwtExpiresAt = getJwtExpiry(cookie.access_token);
	if (jwtExpiresAt.getTime() - Date.now() < (60 * 60 * 1000)) {
		// If the JWT is expired or about to expire in less than 1 hour, refresh the session.
		// We abort here since another sync will be triggered by the cookie update.
		await refreshSteamSession();
		return null;
	}

	return await getSteamLoginSecureCookie();
}

/**
 *
 * @returns {Promise<null|{steam_id: string, access_token: string}>}
 */
async function getSteamLoginSecureCookie() {
	const cookie = await chrome.cookies.get({url: 'https://steamcommunity.com', name: 'steamLoginSecure'});
	if (!cookie) {
		return null;
	}

	const unencoded = decodeURIComponent(cookie.value);
	const [steamId, accessToken] = unencoded.split('||');

	return steamId && accessToken ? {steam_id: steamId, access_token: accessToken, expires_at: getJwtExpiry(accessToken)} : null;
}

async function refreshSteamSession() {
	// We need to open a background tab to trigger a refresh in order to set the appropriate Sec-Fetch-* headers.
	// Don't do this more frequently than once an hour no matter what, in case we enter some weird condition e.g. system clock is wrong
	let {lastSteamSessionRefreshTime} = await chrome.storage.session.get('lastSteamSessionRefreshTime');
	lastSteamSessionRefreshTime = lastSteamSessionRefreshTime || 0;
	if (Date.now() - lastSteamSessionRefreshTime < (60 * 60 * 1000)) {
		// throttle refreshes
		return;
	}

	// Record the time of this refresh attempt
	await chrome.storage.session.set({lastSteamSessionRefreshTime: Date.now()});

	// Pop open a tab to kick off the refresh. Set {active: false} to prevent taking focus away from the user's current tab.
	const tab = await chrome.tabs.create({url: 'https://login.steampowered.com/jwt/refresh?redir=https%3A%2F%2Fsteamcommunity.com', active: false});
	await new Promise(resolve => setTimeout(resolve, 5000));
	await chrome.tabs.remove(tab.id);
}

/**
 * @param {string} jwt
 * @returns {Date}
 */
function getJwtExpiry(jwt) {
	const splitJwt = jwt.split('.');
	if (splitJwt.length !== 3) {
		throw new Error('Invalid JWT format');
	}

	const claimsB64 = splitJwt[1].replace(/-/g, '+').replace(/_/g, '/');
	const claims = JSON.parse(atob(claimsB64));
	if (!claims.exp) {
		throw new Error('JWT does not contain an expiry claim');
	}

	return new Date(claims.exp * 1000);
}
