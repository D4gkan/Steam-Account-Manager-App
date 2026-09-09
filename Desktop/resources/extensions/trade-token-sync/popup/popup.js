chrome.runtime.sendMessage({type: 'getStatus'});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
	if (sender.tab) {
		// Message from a content script. Ignore.
		return;
	}

	if (message.type !== 'status') {
		// Unknown message type
		return;
	}

	/** @var {{partnerSiteStatuses: PartnerSiteStatus[], steamAccessTokenData: SteamAccessTokenData|null}} payload */
	const payload = message.payload;

	const partnerSitesContainer = document.getElementById('partner-sites');
	const partnerSiteTemplate = document.getElementById('partner-site-template');
	partnerSitesContainer.innerHTML = ''; // Clear existing content

	if (payload.partnerSiteStatuses.length === 0) {
		partnerSitesContainer.innerHTML = '<div id="no-partner-sites">No sites are set up.<br>Visit a participating site to begin.</div>';
		return;
	}

	payload.partnerSiteStatuses.forEach((partnerSiteStatus) => {
		const container = partnerSiteTemplate.cloneNode(true);
		// delete container's id
		container.removeAttribute('id');
		container.classList.add('partner-site');
		partnerSitesContainer.appendChild(container);

		const partnerStatusBadge = container.querySelector('.status-badge-partner');
		const steamStatusBadge = container.querySelector('.status-badge-steam');
		const finalStatusBadge = container.querySelector('.status-badge-final');

		const partnerTreeBox = container.querySelector('.tree-box.partner');
		const steamTreeBox = container.querySelector('.tree-box.steam');
		const finalTreeBranch = container.querySelector('.tree-final');

		// Clear all status badges
		const statusClasses = ['success', 'warning', 'error'];
		statusClasses.forEach((className) => {
			partnerStatusBadge.classList.remove(className);
			steamStatusBadge.classList.remove(className);
			finalStatusBadge.classList.remove(className);
		});

		partnerStatusBadge.textContent = '';
		steamStatusBadge.textContent = '';

		// Fill in links and name for partner site.
		const partnerLinkElements = container.querySelectorAll('.partner-site-link');
		for (let i = 0; i < partnerLinkElements.length; i++) {
			partnerLinkElements[i].href = `https://${partnerSiteStatus.configuredDomain}`;
		}
		const partnerNameElements = container.querySelectorAll('.partner-site-name');
		for (let i = 0; i < partnerNameElements.length; i++) {
			partnerNameElements[i].textContent = partnerSiteStatus.name;
		}
		const supportLinkElements = container.querySelectorAll('.support-link');
		for (let i = 0; i < supportLinkElements.length; i++) {
			supportLinkElements[i].href = partnerSiteStatus.supportUrl;
		}

		// Partner site status
		let partnerStatusClass = 'error';
		let partnerStatusText = 'Logged out';
		let partnerTreeStyle = 'dotted';
		if (partnerSiteStatus.tokenStatus) {
			// Partner site is logged in
			partnerStatusClass = 'warning';
			partnerStatusText = 'Loading...';
			partnerTreeStyle = 'dotted';

			if (!partnerSiteStatus.tokenStatus.access_token_expires_at) {
				// Partner site has no access token but Steam is logged in and matches
				partnerStatusClass = 'warning';
				partnerStatusText = 'No token';
				partnerTreeStyle = 'dotted';
			} else {
				partnerStatusClass = 'success';
				partnerStatusText = 'Logged in';
				partnerTreeStyle = 'solid';
			}
		}
		partnerStatusBadge.classList.add(partnerStatusClass);
		partnerStatusBadge.textContent = partnerStatusText;
		partnerTreeBox.style.borderStyle = partnerTreeStyle;

		// Steam status
		let steamStatusClass = 'error';
		let steamStatusText = 'Logged out';
		let steamTreeStyle = 'dotted';
		if (payload.steamAccessTokenData) {
			steamStatusClass = 'success';
			steamStatusText = 'Logged in';
			steamTreeStyle = 'solid';
		}
		steamStatusBadge.classList.add(steamStatusClass);
		steamStatusBadge.textContent = steamStatusText;
		steamTreeBox.style.borderStyle = steamTreeStyle;

		// Final status
		let finalStatusClass = 'warning';
		let finalStatusText = 'Action needed';
		let finalTreeStyle = 'dotted';
		if (payload.steamAccessTokenData && payload.steamAccessTokenData.steam_id === partnerSiteStatus.tokenStatus?.steam_id) {
			// Both sites are logged into the same Steam account so the user has done everything correctly.
			finalStatusClass = 'success';
			finalStatusText = 'LIVE';
			finalTreeStyle = 'solid';
		} else if (
			payload.steamAccessTokenData
			&& partnerSiteStatus.tokenStatus?.steam_id
			&& partnerSiteStatus.tokenStatus.steam_id !== payload.steamAccessTokenData.steam_id
		) {
			// Steam account mismatch
			finalStatusClass = 'error';
			finalStatusText = 'Account mismatch';
			finalTreeStyle = 'dotted';
		}

		finalStatusBadge.classList.add(finalStatusClass);
		finalStatusBadge.textContent = finalStatusText;
		finalTreeBranch.style.borderStyle = finalTreeStyle;
	});
});
