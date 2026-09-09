/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ExecuteScriptOnPage: () => (/* binding */ ExecuteScriptOnPage)
/* harmony export */ });
/* harmony import */ var _main__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
/* harmony import */ var _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);



const ExecuteScriptOnPage = new _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__.PrivilegedHandler(new _main__WEBPACK_IMPORTED_MODULE_0__.EmptyResponseHandler(_types__WEBPACK_IMPORTED_MODULE_1__.RequestType.EXECUTE_SCRIPT_ON_PAGE, async (req, sender) => {
    var _a, _b;
    // We need to inject the extension ID dynamically so the client knows who to
    // communicate with.
    //
    // On Firefox, extension IDs are random, so this is necessary.
    await chrome.scripting.executeScript({
        target: { tabId: (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id },
        world: 'MAIN',
        args: [chrome.runtime.id],
        func: function ExtensionId(extensionId) {
            window.CSFLOAT_EXTENSION_ID = extensionId;
        },
    });
    await chrome.scripting.executeScript({
        target: { tabId: (_b = sender.tab) === null || _b === void 0 ? void 0 : _b.id },
        files: [req.path],
        world: 'MAIN',
    });
}));


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EmptyResponseHandler: () => (/* binding */ EmptyResponseHandler),
/* harmony export */   SimpleHandler: () => (/* binding */ SimpleHandler)
/* harmony export */ });
/* unused harmony export EmptyRequestHandler */
class SimpleHandler {
    constructor(type, handler) {
        this.type = type;
        this.handler = handler;
    }
    getType() {
        return this.type;
    }
    handleRequest(request, sender) {
        return this.handler(request, sender);
    }
}
class EmptyRequestHandler {
    constructor(type, handler) {
        this.type = type;
        this.handler = handler;
    }
    getType() {
        return this.type;
    }
    handleRequest(request, sender) {
        return this.handler(sender);
    }
}
class EmptyResponseHandler {
    constructor(type, handler) {
        this.type = type;
        this.handler = handler;
    }
    getType() {
        return this.type;
    }
    handleRequest(request, sender) {
        return this.handler(request, sender);
    }
}


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RequestType: () => (/* binding */ RequestType)
/* harmony export */ });
var RequestType;
(function (RequestType) {
    RequestType[RequestType["EXECUTE_SCRIPT_ON_PAGE"] = 0] = "EXECUTE_SCRIPT_ON_PAGE";
    RequestType[RequestType["EXECUTE_CSS_ON_PAGE"] = 1] = "EXECUTE_CSS_ON_PAGE";
    RequestType[RequestType["FETCH_INSPECT_INFO"] = 2] = "FETCH_INSPECT_INFO";
    RequestType[RequestType["FETCH_STALL"] = 3] = "FETCH_STALL";
    RequestType[RequestType["STORAGE_GET"] = 4] = "STORAGE_GET";
    RequestType[RequestType["STORAGE_SET"] = 5] = "STORAGE_SET";
    RequestType[RequestType["STORAGE_REMOVE"] = 6] = "STORAGE_REMOVE";
    RequestType[RequestType["FETCH_PENDING_TRADES"] = 7] = "FETCH_PENDING_TRADES";
    RequestType[RequestType["FETCH_EXTENSION_FILE"] = 8] = "FETCH_EXTENSION_FILE";
    RequestType[RequestType["ANNOTATE_OFFER"] = 9] = "ANNOTATE_OFFER";
    RequestType[RequestType["EXTENSION_VERSION"] = 10] = "EXTENSION_VERSION";
    RequestType[RequestType["TRADE_HISTORY_STATUS"] = 11] = "TRADE_HISTORY_STATUS";
    RequestType[RequestType["TRADE_OFFER_STATUS"] = 12] = "TRADE_OFFER_STATUS";
    RequestType[RequestType["HAS_PERMISSIONS"] = 13] = "HAS_PERMISSIONS";
    RequestType[RequestType["PING_SETUP_EXTENSION"] = 14] = "PING_SETUP_EXTENSION";
    RequestType[RequestType["PING_EXTENSION_STATUS"] = 15] = "PING_EXTENSION_STATUS";
    RequestType[RequestType["PING_CANCEL_TRADE"] = 16] = "PING_CANCEL_TRADE";
    RequestType[RequestType["CREATE_TRADE_OFFER"] = 17] = "CREATE_TRADE_OFFER";
    RequestType[RequestType["FETCH_STEAM_USER"] = 18] = "FETCH_STEAM_USER";
    RequestType[RequestType["PING_TRADE_STATUS"] = 19] = "PING_TRADE_STATUS";
    RequestType[RequestType["PING_STATUS"] = 20] = "PING_STATUS";
    RequestType[RequestType["FETCH_OWN_INVENTORY"] = 21] = "FETCH_OWN_INVENTORY";
    RequestType[RequestType["CANCEL_TRADE_OFFER"] = 22] = "CANCEL_TRADE_OFFER";
    RequestType[RequestType["FETCH_STEAM_TRADES"] = 23] = "FETCH_STEAM_TRADES";
    RequestType[RequestType["FETCH_BLOCKED_USERS"] = 24] = "FETCH_BLOCKED_USERS";
    RequestType[RequestType["PING_BLOCKED_USERS"] = 25] = "PING_BLOCKED_USERS";
    RequestType[RequestType["FETCH_BLUEGEM"] = 26] = "FETCH_BLUEGEM";
    RequestType[RequestType["LIST_ITEM"] = 27] = "LIST_ITEM";
    RequestType[RequestType["FETCH_RECOMMENDED_PRICE"] = 28] = "FETCH_RECOMMENDED_PRICE";
    RequestType[RequestType["FETCH_CSFLOAT_ME"] = 29] = "FETCH_CSFLOAT_ME";
    RequestType[RequestType["PING_ROLLBACK_TRADE"] = 30] = "PING_ROLLBACK_TRADE";
    RequestType[RequestType["FETCH_TRADE_HISTORY"] = 31] = "FETCH_TRADE_HISTORY";
    RequestType[RequestType["FETCH_SLIM_TRADES"] = 32] = "FETCH_SLIM_TRADES";
    RequestType[RequestType["NOTARY_PROVE"] = 33] = "NOTARY_PROVE";
    RequestType[RequestType["FETCH_NOTARY_META"] = 34] = "FETCH_NOTARY_META";
    RequestType[RequestType["FETCH_NOTARY_TOKEN"] = 35] = "FETCH_NOTARY_TOKEN";
    RequestType[RequestType["FETCH_STEAM_POWERED_INVENTORY"] = 36] = "FETCH_STEAM_POWERED_INVENTORY";
    RequestType[RequestType["FETCH_REVERSAL_STATUS"] = 37] = "FETCH_REVERSAL_STATUS";
    RequestType[RequestType["FETCH_INSPECT_INFO_BATCH"] = 38] = "FETCH_INSPECT_INFO_BATCH";
})(RequestType || (RequestType = {}));


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PrivilegedHandler: () => (/* binding */ PrivilegedHandler)
/* harmony export */ });
/**
 * Restricts a given handler such that it can only run if the sender is
 * verified to be from the extension's origin (ie. content script)
 */
class PrivilegedHandler {
    constructor(handler) {
        this.handler = handler;
    }
    getType() {
        return this.handler.getType();
    }
    handleRequest(request, sender) {
        if (sender.id !== chrome.runtime.id) {
            throw new Error('Attempt to access restricted method outside of secure context (ie. content script)');
        }
        return this.handler.handleRequest(request, sender);
    }
}


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ClientSend: () => (/* binding */ ClientSend)
/* harmony export */ });
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6);
/* harmony import */ var _utils_detect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/* harmony import */ var _utils_snips__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _bus_post_message_bus__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(9);




function canUseSendMessage() {
    // Not supported in Firefox Page Context
    return !((0,_utils_detect__WEBPACK_IMPORTED_MODULE_1__.isFirefox)() && (0,_utils_snips__WEBPACK_IMPORTED_MODULE_2__.inPageContext)());
}
/**
 * Send a request to be handled by the background worker
 *
 * Can be called from a content script or page itself
 */
async function ClientSend(handler, args) {
    const bundle = {
        version: _types__WEBPACK_IMPORTED_MODULE_0__.Version.V1,
        request_type: handler.getType(),
        request: args,
        id: Math.ceil(Math.random() * 100000000000),
    };
    if (canUseSendMessage()) {
        return new Promise((resolve, reject) => {
            // @ts-ignore Bad types
            (0,_utils_detect__WEBPACK_IMPORTED_MODULE_1__.runtimeNamespace)().runtime.sendMessage(window.CSFLOAT_EXTENSION_ID || chrome.runtime.id, bundle, (resp) => {
                if (resp === null || resp === void 0 ? void 0 : resp.error) {
                    reject(resp.error);
                }
                else {
                    resolve(resp === null || resp === void 0 ? void 0 : resp.response);
                }
            });
        });
    }
    else {
        // Fallback to postmessage bus for browsers that don't implement
        // specs fully
        return _bus_post_message_bus__WEBPACK_IMPORTED_MODULE_3__.g_PostMessageBus.sendRequest(bundle);
    }
}


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Version: () => (/* binding */ Version)
/* harmony export */ });
var Version;
(function (Version) {
    Version["V1"] = "CSFLOAT_V1";
})(Version || (Version = {}));


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isFirefox: () => (/* binding */ isFirefox),
/* harmony export */   runtimeNamespace: () => (/* binding */ runtimeNamespace)
/* harmony export */ });
function isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}
/**
 * Thanks to our browser overlords, we have two namespaces for `x.runtime.fn()`
 */
function runtimeNamespace() {
    if (isFirefox()) {
        return browser;
    }
    else {
        return chrome;
    }
}


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   inPageContext: () => (/* binding */ inPageContext)
/* harmony export */ });
/* unused harmony export wait */
function inPageContext() {
    return typeof chrome === 'undefined' || !chrome.extension;
}
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   g_PostMessageBus: () => (/* binding */ g_PostMessageBus)
/* harmony export */ });
/* harmony import */ var _bridge_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6);
/* harmony import */ var _utils_detect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);


/**
 * Message bus that uses `postMessage` in order to communicate with the background
 * service worker/script.
 *
 * Why? Because the client page (ie. Steam page) on Firefox is not capable of
 * sending a message directly to the extension background.
 *
 * So it requires us to do the following dance:
 * page <--(postmessage)--> content script <--(sendmessage)--> background script
 *
 * This dance is abstracted in `ClientSend`, and only uses this bus if
 * `sendmessage` is not supported in the page.
 */
class PostMessageBus {
    /**
     * For the requester (ie. page), to wait until it gets a response
     * from the content script via. postMessage for the given request ID
     *
     * @param id Request ID
     */
    waitUntilResponseFor(id) {
        return new Promise((resolve, reject) => {
            const handler = (e) => {
                const resp = e.data;
                if (resp.id !== id || !resp.response) {
                    return;
                }
                // Prevent leaks
                window.removeEventListener('message', handler, false);
                if (resp === null || resp === void 0 ? void 0 : resp.response) {
                    resolve(resp.response);
                }
                else {
                    reject(resp === null || resp === void 0 ? void 0 : resp.error);
                }
            };
            window.addEventListener('message', handler);
        });
    }
    /**
     * Sends a request to be done through the bus, returns the appropriate
     * response for the input bundle handler
     *
     * @param bundle Request Bundle
     */
    sendRequest(bundle) {
        window.postMessage(bundle);
        return this.waitUntilResponseFor(bundle.id);
    }
    /**
     * Request handler (content script) for new requests from the page.
     *
     * Each request is effectively "proxied" to the background script/worker
     * to actually execute it's handler.
     */
    handleRequests() {
        const h = (e) => {
            if (e.data.version !== _bridge_types__WEBPACK_IMPORTED_MODULE_0__.Version.V1 || !e.data.request) {
                // Ignore messages that aren't for this bridge
                return;
            }
            // Send to the background script
            // @ts-ignore Bad types
            (0,_utils_detect__WEBPACK_IMPORTED_MODULE_1__.runtimeNamespace)().runtime.sendMessage(chrome.runtime.id, e.data, 
            // @ts-ignore Bad types
            (resp) => {
                window.postMessage(resp);
            });
        };
        window.addEventListener('message', h);
    }
}
const g_PostMessageBus = new PostMessageBus();


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ExecuteCssOnPage: () => (/* binding */ ExecuteCssOnPage)
/* harmony export */ });
/* harmony import */ var _main__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
/* harmony import */ var _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);



const ExecuteCssOnPage = new _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__.PrivilegedHandler(new _main__WEBPACK_IMPORTED_MODULE_0__.EmptyResponseHandler(_types__WEBPACK_IMPORTED_MODULE_1__.RequestType.EXECUTE_CSS_ON_PAGE, async (req, sender) => {
    var _a;
    await chrome.scripting.insertCSS({
        target: { tabId: (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id },
        files: [req.path],
    });
}));


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FetchExtensionFile: () => (/* binding */ FetchExtensionFile)
/* harmony export */ });
/* harmony import */ var _main__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(2);
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3);
/* harmony import */ var _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(4);



const FetchExtensionFile = new _wrappers_privileged__WEBPACK_IMPORTED_MODULE_2__.PrivilegedHandler(new _main__WEBPACK_IMPORTED_MODULE_0__.SimpleHandler(_types__WEBPACK_IMPORTED_MODULE_1__.RequestType.FETCH_EXTENSION_FILE, async (req) => {
    const url = chrome.runtime.getURL(req.path);
    const r = await fetch(url);
    const text = await r.text();
    return {
        text,
    };
}));


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/* unused harmony export init */
/* harmony import */ var _bridge_handlers_execute_script__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _bridge_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/* harmony import */ var _utils_snips__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _bridge_handlers_execute_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(10);
/* harmony import */ var _bridge_handlers_fetch_extension_file__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(11);
/* harmony import */ var _utils_detect__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7);
/* harmony import */ var _bus_post_message_bus__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(9);







async function initiateChromium(scriptPath) {
    (0,_bridge_client__WEBPACK_IMPORTED_MODULE_1__.ClientSend)(_bridge_handlers_execute_css__WEBPACK_IMPORTED_MODULE_3__.ExecuteCssOnPage, {
        path: 'src/global.css',
    });
    (0,_bridge_client__WEBPACK_IMPORTED_MODULE_1__.ClientSend)(_bridge_handlers_execute_script__WEBPACK_IMPORTED_MODULE_0__.ExecuteScriptOnPage, {
        path: scriptPath,
    });
}
async function initiateFirefox(scriptPath) {
    _bus_post_message_bus__WEBPACK_IMPORTED_MODULE_6__.g_PostMessageBus.handleRequests();
    // Why do we need to use manual DOM script injection and
    // fetch the text of the script?
    // See https://github.com/csfloat/extension/issues/155#issuecomment-1639781914
    // We want to inject the ID of the extension
    const id = browser.runtime.id;
    const entryScript = document.createElement('script');
    entryScript.appendChild(document.createTextNode(`
        window.CSFLOAT_EXTENSION_ID = '${id}';
    `));
    document.head.appendChild(entryScript);
    const scriptResp = await (0,_bridge_client__WEBPACK_IMPORTED_MODULE_1__.ClientSend)(_bridge_handlers_fetch_extension_file__WEBPACK_IMPORTED_MODULE_4__.FetchExtensionFile, {
        path: scriptPath,
    });
    const script = document.createElement('script');
    script.appendChild(document.createTextNode(scriptResp.text));
    document.head.appendChild(script);
    const styleResp = await (0,_bridge_client__WEBPACK_IMPORTED_MODULE_1__.ClientSend)(_bridge_handlers_fetch_extension_file__WEBPACK_IMPORTED_MODULE_4__.FetchExtensionFile, {
        path: 'src/global.css',
    });
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(styleResp.text));
    document.head.appendChild(style);
}
/**
 * Initializes a page script, executing it in the page context if necessary
 *
 * @param scriptPath Relative path of the script (always in .js)
 * @param ifPage Fn to run if we are in the page's execution context
 */
async function init(scriptPath, ifPage) {
    // Don't allow the page script to run this.
    if ((0,_utils_snips__WEBPACK_IMPORTED_MODULE_2__.inPageContext)()) {
        // @ts-ignore Set global identifier for other extensions to use
        window.csfloat = true;
        // @ts-ignore Deprecated name
        window.csgofloat = true;
        ifPage();
        return;
    }
    if ((0,_utils_detect__WEBPACK_IMPORTED_MODULE_5__.isFirefox)()) {
        await initiateFirefox(scriptPath);
    }
    else {
        await initiateChromium(scriptPath);
    }
    console.log(`%c CSFloat Market Checker (v${chrome.runtime.getManifest().version}) by Step7750 `, 'background: #004594; color: #fff;');
    console.log('%c Changelog can be found here: https://github.com/csfloat/extension ', 'background: #004594; color: #fff;');
}

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QWtCLEVBQUU7UUFDbkQsSUFBSSxFQUFFLGdCQUFnQjtLQUN6QixDQUFDLENBQUM7SUFFSCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMzRCxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyQyxDQUFDO0FBQ0Q7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsSUFBSSxDQUFDLFVBQWtCLEVBQUUsTUFBaUI7SUFDNUQsMkNBQTJDO0lBQzNDLElBQUksMkRBQWEsRUFBRSxFQUFFLENBQUM7UUFDbEIsK0RBQStEO1FBQy9ELE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLDZCQUE2QjtRQUM3QixNQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUV4QixNQUFNLEVBQUUsQ0FBQztRQUNULE9BQU87SUFDWCxDQUFDO0lBRUQsSUFBSSx3REFBUyxFQUFFLEVBQUUsQ0FBQztRQUNkLE1BQU0sZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7U0FBTSxDQUFDO1FBQ0osTUFBTSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQsT0FBTyxDQUFDLEdBQUcsQ0FDUCwrQkFBK0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLGdCQUFnQixFQUNuRixtQ0FBbUMsQ0FDdEMsQ0FBQztJQUNGLE9BQU8sQ0FBQyxHQUFHLENBQ1AsdUVBQXVFLEVBQ3ZFLG1DQUFtQyxDQUN0QyxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL2hhbmRsZXJzL2V4ZWN1dGVfc2NyaXB0LnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL2hhbmRsZXJzL21haW4udHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9icmlkZ2UvaGFuZGxlcnMvdHlwZXMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9icmlkZ2Uvd3JhcHBlcnMvcHJpdmlsZWdlZC50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2JyaWRnZS9jbGllbnQudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9icmlkZ2UvdHlwZXMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi91dGlscy9kZXRlY3QudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi91dGlscy9zbmlwcy50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2J1cy9wb3N0X21lc3NhZ2VfYnVzLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL2hhbmRsZXJzL2V4ZWN1dGVfY3NzLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL2hhbmRsZXJzL2ZldGNoX2V4dGVuc2lvbl9maWxlLnRzIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovLy8uL3NyYy9saWIvcGFnZV9zY3JpcHRzL3V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7RW1wdHlSZXNwb25zZUhhbmRsZXJ9IGZyb20gJy4vbWFpbic7XG5pbXBvcnQge1JlcXVlc3RUeXBlfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7UHJpdmlsZWdlZEhhbmRsZXJ9IGZyb20gJy4uL3dyYXBwZXJzL3ByaXZpbGVnZWQnO1xuXG5pbnRlcmZhY2UgRXhlY3V0ZVNjcmlwdFJlcXVlc3Qge1xuICAgIHBhdGg6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IEV4ZWN1dGVTY3JpcHRPblBhZ2UgPSBuZXcgUHJpdmlsZWdlZEhhbmRsZXIoXG4gICAgbmV3IEVtcHR5UmVzcG9uc2VIYW5kbGVyPEV4ZWN1dGVTY3JpcHRSZXF1ZXN0PihSZXF1ZXN0VHlwZS5FWEVDVVRFX1NDUklQVF9PTl9QQUdFLCBhc3luYyAocmVxLCBzZW5kZXIpID0+IHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBpbmplY3QgdGhlIGV4dGVuc2lvbiBJRCBkeW5hbWljYWxseSBzbyB0aGUgY2xpZW50IGtub3dzIHdobyB0b1xuICAgICAgICAvLyBjb21tdW5pY2F0ZSB3aXRoLlxuICAgICAgICAvL1xuICAgICAgICAvLyBPbiBGaXJlZm94LCBleHRlbnNpb24gSURzIGFyZSByYW5kb20sIHNvIHRoaXMgaXMgbmVjZXNzYXJ5LlxuICAgICAgICBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuICAgICAgICAgICAgdGFyZ2V0OiB7dGFiSWQ6IHNlbmRlci50YWI/LmlkIGFzIG51bWJlcn0sXG4gICAgICAgICAgICB3b3JsZDogJ01BSU4nLFxuICAgICAgICAgICAgYXJnczogW2Nocm9tZS5ydW50aW1lLmlkXSxcbiAgICAgICAgICAgIGZ1bmM6IGZ1bmN0aW9uIEV4dGVuc2lvbklkKGV4dGVuc2lvbklkKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LkNTRkxPQVRfRVhURU5TSU9OX0lEID0gZXh0ZW5zaW9uSWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuICAgICAgICAgICAgdGFyZ2V0OiB7dGFiSWQ6IHNlbmRlci50YWI/LmlkIGFzIG51bWJlcn0sXG4gICAgICAgICAgICBmaWxlczogW3JlcS5wYXRoXSxcbiAgICAgICAgICAgIHdvcmxkOiAnTUFJTicsXG4gICAgICAgIH0pO1xuICAgIH0pXG4pO1xuIiwiaW1wb3J0IHtSZXF1ZXN0SGFuZGxlcn0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IE1lc3NhZ2VTZW5kZXIgPSBjaHJvbWUucnVudGltZS5NZXNzYWdlU2VuZGVyO1xuaW1wb3J0IHtSZXF1ZXN0VHlwZX0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBjbGFzcyBTaW1wbGVIYW5kbGVyPFJlcSwgUmVzcD4gaW1wbGVtZW50cyBSZXF1ZXN0SGFuZGxlcjxSZXEsIFJlc3A+IHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSB0eXBlOiBSZXF1ZXN0VHlwZSxcbiAgICAgICAgcHJpdmF0ZSBoYW5kbGVyOiAocmVxdWVzdDogUmVxLCBzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpID0+IFByb21pc2U8UmVzcD5cbiAgICApIHt9XG5cbiAgICBnZXRUeXBlKCk6IFJlcXVlc3RUeXBlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZTtcbiAgICB9XG5cbiAgICBoYW5kbGVSZXF1ZXN0KHJlcXVlc3Q6IFJlcSwgc2VuZGVyOiBNZXNzYWdlU2VuZGVyKTogUHJvbWlzZTxSZXNwPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZXIocmVxdWVzdCwgc2VuZGVyKTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW1wdHkge31cblxuZXhwb3J0IGNsYXNzIEVtcHR5UmVxdWVzdEhhbmRsZXI8UmVzcD4gaW1wbGVtZW50cyBSZXF1ZXN0SGFuZGxlcjxFbXB0eSwgUmVzcD4ge1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIHR5cGU6IFJlcXVlc3RUeXBlLFxuICAgICAgICBwcml2YXRlIGhhbmRsZXI6IChzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpID0+IFByb21pc2U8UmVzcD5cbiAgICApIHt9XG5cbiAgICBnZXRUeXBlKCk6IFJlcXVlc3RUeXBlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZTtcbiAgICB9XG5cbiAgICBoYW5kbGVSZXF1ZXN0KHJlcXVlc3Q6IEVtcHR5LCBzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpOiBQcm9taXNlPFJlc3A+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlcihzZW5kZXIpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVtcHR5UmVzcG9uc2VIYW5kbGVyPFJlcT4gaW1wbGVtZW50cyBSZXF1ZXN0SGFuZGxlcjxSZXEsIHZvaWQ+IHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSB0eXBlOiBSZXF1ZXN0VHlwZSxcbiAgICAgICAgcHJpdmF0ZSBoYW5kbGVyOiAocmVxdWVzdDogUmVxLCBzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpID0+IFByb21pc2U8dm9pZD5cbiAgICApIHt9XG5cbiAgICBnZXRUeXBlKCk6IFJlcXVlc3RUeXBlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZTtcbiAgICB9XG5cbiAgICBoYW5kbGVSZXF1ZXN0KHJlcXVlc3Q6IFJlcSwgc2VuZGVyOiBNZXNzYWdlU2VuZGVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZXIocmVxdWVzdCwgc2VuZGVyKTtcbiAgICB9XG59XG4iLCJleHBvcnQgZW51bSBSZXF1ZXN0VHlwZSB7XG4gICAgRVhFQ1VURV9TQ1JJUFRfT05fUEFHRSA9IDAsXG4gICAgRVhFQ1VURV9DU1NfT05fUEFHRSA9IDEsXG4gICAgRkVUQ0hfSU5TUEVDVF9JTkZPID0gMixcbiAgICBGRVRDSF9TVEFMTCA9IDMsXG4gICAgU1RPUkFHRV9HRVQgPSA0LFxuICAgIFNUT1JBR0VfU0VUID0gNSxcbiAgICBTVE9SQUdFX1JFTU9WRSA9IDYsXG4gICAgRkVUQ0hfUEVORElOR19UUkFERVMgPSA3LFxuICAgIEZFVENIX0VYVEVOU0lPTl9GSUxFID0gOCxcbiAgICBBTk5PVEFURV9PRkZFUiA9IDksXG4gICAgRVhURU5TSU9OX1ZFUlNJT04gPSAxMCxcbiAgICBUUkFERV9ISVNUT1JZX1NUQVRVUyA9IDExLFxuICAgIFRSQURFX09GRkVSX1NUQVRVUyA9IDEyLFxuICAgIEhBU19QRVJNSVNTSU9OUyA9IDEzLFxuICAgIFBJTkdfU0VUVVBfRVhURU5TSU9OID0gMTQsXG4gICAgUElOR19FWFRFTlNJT05fU1RBVFVTID0gMTUsXG4gICAgUElOR19DQU5DRUxfVFJBREUgPSAxNixcbiAgICBDUkVBVEVfVFJBREVfT0ZGRVIgPSAxNyxcbiAgICBGRVRDSF9TVEVBTV9VU0VSID0gMTgsXG4gICAgUElOR19UUkFERV9TVEFUVVMgPSAxOSxcbiAgICBQSU5HX1NUQVRVUyA9IDIwLFxuICAgIEZFVENIX09XTl9JTlZFTlRPUlkgPSAyMSxcbiAgICBDQU5DRUxfVFJBREVfT0ZGRVIgPSAyMixcbiAgICBGRVRDSF9TVEVBTV9UUkFERVMgPSAyMyxcbiAgICBGRVRDSF9CTE9DS0VEX1VTRVJTID0gMjQsXG4gICAgUElOR19CTE9DS0VEX1VTRVJTID0gMjUsXG4gICAgRkVUQ0hfQkxVRUdFTSA9IDI2LFxuICAgIExJU1RfSVRFTSA9IDI3LFxuICAgIEZFVENIX1JFQ09NTUVOREVEX1BSSUNFID0gMjgsXG4gICAgRkVUQ0hfQ1NGTE9BVF9NRSA9IDI5LFxuICAgIFBJTkdfUk9MTEJBQ0tfVFJBREUgPSAzMCxcbiAgICBGRVRDSF9UUkFERV9ISVNUT1JZID0gMzEsXG4gICAgRkVUQ0hfU0xJTV9UUkFERVMgPSAzMixcbiAgICBOT1RBUllfUFJPVkUgPSAzMyxcbiAgICBGRVRDSF9OT1RBUllfTUVUQSA9IDM0LFxuICAgIEZFVENIX05PVEFSWV9UT0tFTiA9IDM1LFxuICAgIEZFVENIX1NURUFNX1BPV0VSRURfSU5WRU5UT1JZID0gMzYsXG4gICAgRkVUQ0hfUkVWRVJTQUxfU1RBVFVTID0gMzcsXG4gICAgRkVUQ0hfSU5TUEVDVF9JTkZPX0JBVENIID0gMzgsXG59XG4iLCJpbXBvcnQge1JlcXVlc3RIYW5kbGVyfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQge1JlcXVlc3RUeXBlfSBmcm9tICcuLi9oYW5kbGVycy90eXBlcyc7XG5pbXBvcnQgTWVzc2FnZVNlbmRlciA9IGNocm9tZS5ydW50aW1lLk1lc3NhZ2VTZW5kZXI7XG5cbi8qKlxuICogUmVzdHJpY3RzIGEgZ2l2ZW4gaGFuZGxlciBzdWNoIHRoYXQgaXQgY2FuIG9ubHkgcnVuIGlmIHRoZSBzZW5kZXIgaXNcbiAqIHZlcmlmaWVkIHRvIGJlIGZyb20gdGhlIGV4dGVuc2lvbidzIG9yaWdpbiAoaWUuIGNvbnRlbnQgc2NyaXB0KVxuICovXG5leHBvcnQgY2xhc3MgUHJpdmlsZWdlZEhhbmRsZXI8UmVxLCBSZXNwPiBpbXBsZW1lbnRzIFJlcXVlc3RIYW5kbGVyPFJlcSwgUmVzcD4ge1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgaGFuZGxlcjogUmVxdWVzdEhhbmRsZXI8UmVxLCBSZXNwPikge31cblxuICAgIGdldFR5cGUoKTogUmVxdWVzdFR5cGUge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVyLmdldFR5cGUoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVSZXF1ZXN0KHJlcXVlc3Q6IFJlcSwgc2VuZGVyOiBNZXNzYWdlU2VuZGVyKTogUHJvbWlzZTxSZXNwPiB7XG4gICAgICAgIGlmIChzZW5kZXIuaWQgIT09IGNocm9tZS5ydW50aW1lLmlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0F0dGVtcHQgdG8gYWNjZXNzIHJlc3RyaWN0ZWQgbWV0aG9kIG91dHNpZGUgb2Ygc2VjdXJlIGNvbnRleHQgKGllLiBjb250ZW50IHNjcmlwdCknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZXIuaGFuZGxlUmVxdWVzdChyZXF1ZXN0LCBzZW5kZXIpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7SW50ZXJuYWxSZXF1ZXN0QnVuZGxlLCBJbnRlcm5hbFJlc3BvbnNlQnVuZGxlLCBSZXF1ZXN0SGFuZGxlciwgVmVyc2lvbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge2lzRmlyZWZveCwgcnVudGltZU5hbWVzcGFjZX0gZnJvbSAnLi4vdXRpbHMvZGV0ZWN0JztcbmltcG9ydCB7aW5QYWdlQ29udGV4dH0gZnJvbSAnLi4vdXRpbHMvc25pcHMnO1xuaW1wb3J0IHtnX1Bvc3RNZXNzYWdlQnVzfSBmcm9tICcuLi9idXMvcG9zdF9tZXNzYWdlX2J1cyc7XG5cbmZ1bmN0aW9uIGNhblVzZVNlbmRNZXNzYWdlKCkge1xuICAgIC8vIE5vdCBzdXBwb3J0ZWQgaW4gRmlyZWZveCBQYWdlIENvbnRleHRcbiAgICByZXR1cm4gIShpc0ZpcmVmb3goKSAmJiBpblBhZ2VDb250ZXh0KCkpO1xufVxuXG4vKipcbiAqIFNlbmQgYSByZXF1ZXN0IHRvIGJlIGhhbmRsZWQgYnkgdGhlIGJhY2tncm91bmQgd29ya2VyXG4gKlxuICogQ2FuIGJlIGNhbGxlZCBmcm9tIGEgY29udGVudCBzY3JpcHQgb3IgcGFnZSBpdHNlbGZcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIENsaWVudFNlbmQ8UmVxLCBSZXNwPihoYW5kbGVyOiBSZXF1ZXN0SGFuZGxlcjxSZXEsIFJlc3A+LCBhcmdzOiBSZXEpOiBQcm9taXNlPFJlc3A+IHtcbiAgICBjb25zdCBidW5kbGU6IEludGVybmFsUmVxdWVzdEJ1bmRsZSA9IHtcbiAgICAgICAgdmVyc2lvbjogVmVyc2lvbi5WMSxcbiAgICAgICAgcmVxdWVzdF90eXBlOiBoYW5kbGVyLmdldFR5cGUoKSxcbiAgICAgICAgcmVxdWVzdDogYXJncyxcbiAgICAgICAgaWQ6IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDAwMDAwKSxcbiAgICB9O1xuXG4gICAgaWYgKGNhblVzZVNlbmRNZXNzYWdlKCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgQmFkIHR5cGVzXG4gICAgICAgICAgICBydW50aW1lTmFtZXNwYWNlKCkucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgICAgICAgICAgICB3aW5kb3cuQ1NGTE9BVF9FWFRFTlNJT05fSUQgfHwgY2hyb21lLnJ1bnRpbWUuaWQsXG4gICAgICAgICAgICAgICAgYnVuZGxlLFxuICAgICAgICAgICAgICAgIChyZXNwOiBJbnRlcm5hbFJlc3BvbnNlQnVuZGxlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwPy5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3AuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwPy5yZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWxsYmFjayB0byBwb3N0bWVzc2FnZSBidXMgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3QgaW1wbGVtZW50XG4gICAgICAgIC8vIHNwZWNzIGZ1bGx5XG4gICAgICAgIHJldHVybiBnX1Bvc3RNZXNzYWdlQnVzLnNlbmRSZXF1ZXN0KGJ1bmRsZSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IE1lc3NhZ2VTZW5kZXIgPSBjaHJvbWUucnVudGltZS5NZXNzYWdlU2VuZGVyO1xuaW1wb3J0IHtSZXF1ZXN0VHlwZX0gZnJvbSAnLi9oYW5kbGVycy90eXBlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVxdWVzdEhhbmRsZXI8UmVxLCBSZXNwPiB7XG4gICAgaGFuZGxlUmVxdWVzdChyZXF1ZXN0OiBSZXEsIHNlbmRlcjogTWVzc2FnZVNlbmRlcik6IFByb21pc2U8UmVzcD47XG4gICAgZ2V0VHlwZSgpOiBSZXF1ZXN0VHlwZTtcbn1cblxuZXhwb3J0IGVudW0gVmVyc2lvbiB7XG4gICAgVjEgPSAnQ1NGTE9BVF9WMScsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxSZXF1ZXN0QnVuZGxlIHtcbiAgICB2ZXJzaW9uOiBzdHJpbmc7XG5cbiAgICByZXF1ZXN0X3R5cGU6IFJlcXVlc3RUeXBlO1xuXG4gICAgLy8gSW5wdXQgcmVxdWVzdFxuICAgIHJlcXVlc3Q6IGFueTtcblxuICAgIC8vIFJhbmRvbSBJRCB0byBpZGVudGlmeSB0aGUgcmVxdWVzdFxuICAgIGlkOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxSZXNwb25zZUJ1bmRsZSB7XG4gICAgcmVxdWVzdF90eXBlOiBSZXF1ZXN0VHlwZTtcblxuICAgIC8vIFJlc3BvbnNlXG4gICAgcmVzcG9uc2U6IGFueTtcblxuICAgIGVycm9yOiBzdHJpbmc7XG5cbiAgICAvLyBSYW5kb20gSUQgdG8gaWRlbnRpZnkgdGhlIHJlcXVlc3RcbiAgICBpZDogbnVtYmVyO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGlzRmlyZWZveCgpIHtcbiAgICByZXR1cm4gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA+IC0xO1xufVxuXG4vKipcbiAqIFRoYW5rcyB0byBvdXIgYnJvd3NlciBvdmVybG9yZHMsIHdlIGhhdmUgdHdvIG5hbWVzcGFjZXMgZm9yIGB4LnJ1bnRpbWUuZm4oKWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJ1bnRpbWVOYW1lc3BhY2UoKSB7XG4gICAgaWYgKGlzRmlyZWZveCgpKSB7XG4gICAgICAgIHJldHVybiBicm93c2VyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjaHJvbWU7XG4gICAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGluUGFnZUNvbnRleHQoKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBjaHJvbWUgPT09ICd1bmRlZmluZWQnIHx8ICFjaHJvbWUuZXh0ZW5zaW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2FpdChtczogbnVtYmVyKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG59XG4iLCJpbXBvcnQge0ludGVybmFsUmVxdWVzdEJ1bmRsZSwgSW50ZXJuYWxSZXNwb25zZUJ1bmRsZSwgVmVyc2lvbn0gZnJvbSAnLi4vYnJpZGdlL3R5cGVzJztcbmltcG9ydCB7cnVudGltZU5hbWVzcGFjZX0gZnJvbSAnLi4vdXRpbHMvZGV0ZWN0JztcblxuLyoqXG4gKiBNZXNzYWdlIGJ1cyB0aGF0IHVzZXMgYHBvc3RNZXNzYWdlYCBpbiBvcmRlciB0byBjb21tdW5pY2F0ZSB3aXRoIHRoZSBiYWNrZ3JvdW5kXG4gKiBzZXJ2aWNlIHdvcmtlci9zY3JpcHQuXG4gKlxuICogV2h5PyBCZWNhdXNlIHRoZSBjbGllbnQgcGFnZSAoaWUuIFN0ZWFtIHBhZ2UpIG9uIEZpcmVmb3ggaXMgbm90IGNhcGFibGUgb2ZcbiAqIHNlbmRpbmcgYSBtZXNzYWdlIGRpcmVjdGx5IHRvIHRoZSBleHRlbnNpb24gYmFja2dyb3VuZC5cbiAqXG4gKiBTbyBpdCByZXF1aXJlcyB1cyB0byBkbyB0aGUgZm9sbG93aW5nIGRhbmNlOlxuICogcGFnZSA8LS0ocG9zdG1lc3NhZ2UpLS0+IGNvbnRlbnQgc2NyaXB0IDwtLShzZW5kbWVzc2FnZSktLT4gYmFja2dyb3VuZCBzY3JpcHRcbiAqXG4gKiBUaGlzIGRhbmNlIGlzIGFic3RyYWN0ZWQgaW4gYENsaWVudFNlbmRgLCBhbmQgb25seSB1c2VzIHRoaXMgYnVzIGlmXG4gKiBgc2VuZG1lc3NhZ2VgIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhlIHBhZ2UuXG4gKi9cbmNsYXNzIFBvc3RNZXNzYWdlQnVzIHtcbiAgICAvKipcbiAgICAgKiBGb3IgdGhlIHJlcXVlc3RlciAoaWUuIHBhZ2UpLCB0byB3YWl0IHVudGlsIGl0IGdldHMgYSByZXNwb25zZVxuICAgICAqIGZyb20gdGhlIGNvbnRlbnQgc2NyaXB0IHZpYS4gcG9zdE1lc3NhZ2UgZm9yIHRoZSBnaXZlbiByZXF1ZXN0IElEXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWQgUmVxdWVzdCBJRFxuICAgICAqL1xuICAgIHdhaXRVbnRpbFJlc3BvbnNlRm9yKGlkOiBudW1iZXIpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IChlOiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwID0gZS5kYXRhIGFzIEludGVybmFsUmVzcG9uc2VCdW5kbGU7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3AuaWQgIT09IGlkIHx8ICFyZXNwLnJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IGxlYWtzXG4gICAgICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBoYW5kbGVyLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzcD8ucmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwLnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzcD8uZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgaGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgcmVxdWVzdCB0byBiZSBkb25lIHRocm91Z2ggdGhlIGJ1cywgcmV0dXJucyB0aGUgYXBwcm9wcmlhdGVcbiAgICAgKiByZXNwb25zZSBmb3IgdGhlIGlucHV0IGJ1bmRsZSBoYW5kbGVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnVuZGxlIFJlcXVlc3QgQnVuZGxlXG4gICAgICovXG4gICAgc2VuZFJlcXVlc3QoYnVuZGxlOiBJbnRlcm5hbFJlcXVlc3RCdW5kbGUpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoYnVuZGxlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy53YWl0VW50aWxSZXNwb25zZUZvcihidW5kbGUuaWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgaGFuZGxlciAoY29udGVudCBzY3JpcHQpIGZvciBuZXcgcmVxdWVzdHMgZnJvbSB0aGUgcGFnZS5cbiAgICAgKlxuICAgICAqIEVhY2ggcmVxdWVzdCBpcyBlZmZlY3RpdmVseSBcInByb3hpZWRcIiB0byB0aGUgYmFja2dyb3VuZCBzY3JpcHQvd29ya2VyXG4gICAgICogdG8gYWN0dWFsbHkgZXhlY3V0ZSBpdCdzIGhhbmRsZXIuXG4gICAgICovXG4gICAgaGFuZGxlUmVxdWVzdHMoKSB7XG4gICAgICAgIGNvbnN0IGggPSAoZTogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZS5kYXRhLnZlcnNpb24gIT09IFZlcnNpb24uVjEgfHwgIWUuZGF0YS5yZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgLy8gSWdub3JlIG1lc3NhZ2VzIHRoYXQgYXJlbid0IGZvciB0aGlzIGJyaWRnZVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2VuZCB0byB0aGUgYmFja2dyb3VuZCBzY3JpcHRcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgQmFkIHR5cGVzXG4gICAgICAgICAgICBydW50aW1lTmFtZXNwYWNlKCkucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgICAgICAgICAgICBjaHJvbWUucnVudGltZS5pZCxcbiAgICAgICAgICAgICAgICBlLmRhdGEsXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBCYWQgdHlwZXNcbiAgICAgICAgICAgICAgICAocmVzcDogSW50ZXJuYWxSZXNwb25zZUJ1bmRsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UocmVzcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGdfUG9zdE1lc3NhZ2VCdXMgPSBuZXcgUG9zdE1lc3NhZ2VCdXMoKTtcbiIsImltcG9ydCB7RW1wdHlSZXNwb25zZUhhbmRsZXJ9IGZyb20gJy4vbWFpbic7XG5pbXBvcnQge1JlcXVlc3RUeXBlfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7UHJpdmlsZWdlZEhhbmRsZXJ9IGZyb20gJy4uL3dyYXBwZXJzL3ByaXZpbGVnZWQnO1xuXG5pbnRlcmZhY2UgRXhlY3V0ZUNzc1JlcXVlc3Qge1xuICAgIHBhdGg6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IEV4ZWN1dGVDc3NPblBhZ2UgPSBuZXcgUHJpdmlsZWdlZEhhbmRsZXIoXG4gICAgbmV3IEVtcHR5UmVzcG9uc2VIYW5kbGVyPEV4ZWN1dGVDc3NSZXF1ZXN0PihSZXF1ZXN0VHlwZS5FWEVDVVRFX0NTU19PTl9QQUdFLCBhc3luYyAocmVxLCBzZW5kZXIpID0+IHtcbiAgICAgICAgYXdhaXQgY2hyb21lLnNjcmlwdGluZy5pbnNlcnRDU1Moe1xuICAgICAgICAgICAgdGFyZ2V0OiB7dGFiSWQ6IHNlbmRlci50YWI/LmlkIGFzIG51bWJlcn0sXG4gICAgICAgICAgICBmaWxlczogW3JlcS5wYXRoXSxcbiAgICAgICAgfSk7XG4gICAgfSlcbik7XG4iLCJpbXBvcnQge1NpbXBsZUhhbmRsZXJ9IGZyb20gJy4vbWFpbic7XG5pbXBvcnQge1JlcXVlc3RUeXBlfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7UHJpdmlsZWdlZEhhbmRsZXJ9IGZyb20gJy4uL3dyYXBwZXJzL3ByaXZpbGVnZWQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEZldGNoRXh0ZW5zaW9uRmlsZVJlcXVlc3Qge1xuICAgIHBhdGg6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGZXRjaEV4dGVuc2lvbkZpbGVSZXNwb25zZSB7XG4gICAgdGV4dDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgRmV0Y2hFeHRlbnNpb25GaWxlID0gbmV3IFByaXZpbGVnZWRIYW5kbGVyKFxuICAgIG5ldyBTaW1wbGVIYW5kbGVyPEZldGNoRXh0ZW5zaW9uRmlsZVJlcXVlc3QsIEZldGNoRXh0ZW5zaW9uRmlsZVJlc3BvbnNlPihcbiAgICAgICAgUmVxdWVzdFR5cGUuRkVUQ0hfRVhURU5TSU9OX0ZJTEUsXG4gICAgICAgIGFzeW5jIChyZXEpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IGNocm9tZS5ydW50aW1lLmdldFVSTChyZXEucGF0aCk7XG4gICAgICAgICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsKTtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByLnRleHQoKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICApXG4pO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCJpbXBvcnQge0V4ZWN1dGVTY3JpcHRPblBhZ2V9IGZyb20gJy4uL2JyaWRnZS9oYW5kbGVycy9leGVjdXRlX3NjcmlwdCc7XG5pbXBvcnQge0NsaWVudFNlbmR9IGZyb20gJy4uL2JyaWRnZS9jbGllbnQnO1xuaW1wb3J0IHtpblBhZ2VDb250ZXh0fSBmcm9tICcuLi91dGlscy9zbmlwcyc7XG5pbXBvcnQge0V4ZWN1dGVDc3NPblBhZ2V9IGZyb20gJy4uL2JyaWRnZS9oYW5kbGVycy9leGVjdXRlX2Nzcyc7XG5pbXBvcnQge0ZldGNoRXh0ZW5zaW9uRmlsZX0gZnJvbSAnLi4vYnJpZGdlL2hhbmRsZXJzL2ZldGNoX2V4dGVuc2lvbl9maWxlJztcbmltcG9ydCB7aXNGaXJlZm94fSBmcm9tICcuLi91dGlscy9kZXRlY3QnO1xuaW1wb3J0IHtnX1Bvc3RNZXNzYWdlQnVzfSBmcm9tICcuLi9idXMvcG9zdF9tZXNzYWdlX2J1cyc7XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYXRlQ2hyb21pdW0oc2NyaXB0UGF0aDogc3RyaW5nKSB7XG4gICAgQ2xpZW50U2VuZChFeGVjdXRlQ3NzT25QYWdlLCB7XG4gICAgICAgIHBhdGg6ICdzcmMvZ2xvYmFsLmNzcycsXG4gICAgfSk7XG5cbiAgICBDbGllbnRTZW5kKEV4ZWN1dGVTY3JpcHRPblBhZ2UsIHtcbiAgICAgICAgcGF0aDogc2NyaXB0UGF0aCxcbiAgICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5pdGlhdGVGaXJlZm94KHNjcmlwdFBhdGg6IHN0cmluZykge1xuICAgIGdfUG9zdE1lc3NhZ2VCdXMuaGFuZGxlUmVxdWVzdHMoKTtcblxuICAgIC8vIFdoeSBkbyB3ZSBuZWVkIHRvIHVzZSBtYW51YWwgRE9NIHNjcmlwdCBpbmplY3Rpb24gYW5kXG4gICAgLy8gZmV0Y2ggdGhlIHRleHQgb2YgdGhlIHNjcmlwdD9cbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2NzZmxvYXQvZXh0ZW5zaW9uL2lzc3Vlcy8xNTUjaXNzdWVjb21tZW50LTE2Mzk3ODE5MTRcblxuICAgIC8vIFdlIHdhbnQgdG8gaW5qZWN0IHRoZSBJRCBvZiB0aGUgZXh0ZW5zaW9uXG4gICAgY29uc3QgaWQgPSBicm93c2VyLnJ1bnRpbWUuaWQ7XG4gICAgY29uc3QgZW50cnlTY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBlbnRyeVNjcmlwdC5hcHBlbmRDaGlsZChcbiAgICAgICAgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoYFxuICAgICAgICB3aW5kb3cuQ1NGTE9BVF9FWFRFTlNJT05fSUQgPSAnJHtpZH0nO1xuICAgIGApXG4gICAgKTtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGVudHJ5U2NyaXB0KTtcblxuICAgIGNvbnN0IHNjcmlwdFJlc3AgPSBhd2FpdCBDbGllbnRTZW5kKEZldGNoRXh0ZW5zaW9uRmlsZSwge1xuICAgICAgICBwYXRoOiBzY3JpcHRQYXRoLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgc2NyaXB0LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHNjcmlwdFJlc3AudGV4dCkpO1xuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcblxuICAgIGNvbnN0IHN0eWxlUmVzcCA9IGF3YWl0IENsaWVudFNlbmQoRmV0Y2hFeHRlbnNpb25GaWxlLCB7XG4gICAgICAgIHBhdGg6ICdzcmMvZ2xvYmFsLmNzcycsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoc3R5bGVSZXNwLnRleHQpKTtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbn1cbi8qKlxuICogSW5pdGlhbGl6ZXMgYSBwYWdlIHNjcmlwdCwgZXhlY3V0aW5nIGl0IGluIHRoZSBwYWdlIGNvbnRleHQgaWYgbmVjZXNzYXJ5XG4gKlxuICogQHBhcmFtIHNjcmlwdFBhdGggUmVsYXRpdmUgcGF0aCBvZiB0aGUgc2NyaXB0IChhbHdheXMgaW4gLmpzKVxuICogQHBhcmFtIGlmUGFnZSBGbiB0byBydW4gaWYgd2UgYXJlIGluIHRoZSBwYWdlJ3MgZXhlY3V0aW9uIGNvbnRleHRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXQoc2NyaXB0UGF0aDogc3RyaW5nLCBpZlBhZ2U6ICgpID0+IGFueSkge1xuICAgIC8vIERvbid0IGFsbG93IHRoZSBwYWdlIHNjcmlwdCB0byBydW4gdGhpcy5cbiAgICBpZiAoaW5QYWdlQ29udGV4dCgpKSB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgU2V0IGdsb2JhbCBpZGVudGlmaWVyIGZvciBvdGhlciBleHRlbnNpb25zIHRvIHVzZVxuICAgICAgICB3aW5kb3cuY3NmbG9hdCA9IHRydWU7XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgRGVwcmVjYXRlZCBuYW1lXG4gICAgICAgIHdpbmRvdy5jc2dvZmxvYXQgPSB0cnVlO1xuXG4gICAgICAgIGlmUGFnZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGlzRmlyZWZveCgpKSB7XG4gICAgICAgIGF3YWl0IGluaXRpYXRlRmlyZWZveChzY3JpcHRQYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBhd2FpdCBpbml0aWF0ZUNocm9taXVtKHNjcmlwdFBhdGgpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgJWMgQ1NGbG9hdCBNYXJrZXQgQ2hlY2tlciAodiR7Y2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKS52ZXJzaW9ufSkgYnkgU3RlcDc3NTAgYCxcbiAgICAgICAgJ2JhY2tncm91bmQ6ICMwMDQ1OTQ7IGNvbG9yOiAjZmZmOydcbiAgICApO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAnJWMgQ2hhbmdlbG9nIGNhbiBiZSBmb3VuZCBoZXJlOiBodHRwczovL2dpdGh1Yi5jb20vY3NmbG9hdC9leHRlbnNpb24gJyxcbiAgICAgICAgJ2JhY2tncm91bmQ6ICMwMDQ1OTQ7IGNvbG9yOiAjZmZmOydcbiAgICApO1xufVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9