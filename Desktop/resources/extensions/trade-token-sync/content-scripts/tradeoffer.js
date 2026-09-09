(function() {
	if (!window.g_rgCurrentTradeStatus) {
		// No trade offer on this page
		return;
	}

	const searchParams = new URLSearchParams(window.location.search);
	const theirItems = searchParams.getAll('for_item');
	const myItems = searchParams.getAll('my_item');

	let tradeWasModified = false;

	theirItems.forEach((item) => {
		const splitParts = item.split('_');
		if (splitParts.length !== 3) {
			// Invalid item ID
			return;
		}

		const [appid, contextid, assetid] = splitParts;
		if (isItemInList(window.g_rgCurrentTradeStatus.them.assets, appid, contextid, assetid)) {
			// They already have this item in the trade
			return;
		}

		tradeWasModified = true;
		window.g_rgCurrentTradeStatus.them.assets.push({
			appid,
			contextid,
			assetid,
			amount: 1
		});
	});

	myItems.forEach((item) => {
		const splitParts = item.split('_');
		if (splitParts.length !== 3) {
			// Invalid item ID
			return;
		}

		const [appid, contextid, assetid] = splitParts;
		if (isItemInList(window.g_rgCurrentTradeStatus.me.assets, appid, contextid, assetid)) {
			// We already have this item in the trade
			return;
		}

		tradeWasModified = true;
		window.g_rgCurrentTradeStatus.me.assets.push({
			appid,
			contextid,
			assetid,
			amount: 1
		});
	});

	if (tradeWasModified) {
		window.RedrawCurrentTradeStatus();
	}

	function isItemInList(list, appid, contextid, assetid) {
		appid = parseInt(appid);
		contextid = contextid.toString();
		assetid = assetid.toString();
		return list.some(asset => parseInt(asset.appid) === appid && asset.contextid.toString() === contextid && asset.assetid.toString() === assetid);
	}
})();
