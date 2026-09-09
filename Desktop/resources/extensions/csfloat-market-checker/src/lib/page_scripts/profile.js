/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   init: () => (/* binding */ init)
/* harmony export */ });
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


/***/ }),
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


/***/ }),
/* 12 */,
/* 13 */,
/* 14 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LitElement: () => (/* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.LitElement),
/* harmony export */   css: () => (/* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.css),
/* harmony export */   html: () => (/* reexport safe */ lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__.html)
/* harmony export */ });
/* harmony import */ var _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(15);
/* harmony import */ var lit_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(17);
/* harmony import */ var lit_element_lit_element_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(18);
/* harmony import */ var lit_html_is_server_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(19);

//# sourceMappingURL=index.js.map


/***/ }),
/* 15 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ReactiveElement: () => (/* binding */ b),
/* harmony export */   css: () => (/* reexport safe */ _css_tag_js__WEBPACK_IMPORTED_MODULE_0__.css),
/* harmony export */   defaultConverter: () => (/* binding */ u),
/* harmony export */   notEqual: () => (/* binding */ f)
/* harmony export */ });
/* harmony import */ var _css_tag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(16);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:i,defineProperty:e,getOwnPropertyDescriptor:r,getOwnPropertyNames:h,getOwnPropertySymbols:o,getPrototypeOf:n}=Object,a=globalThis,c=a.trustedTypes,l=c?c.emptyScript:"",p=a.reactiveElementPolyfillSupport,d=(t,s)=>t,u={toAttribute(t,s){switch(s){case Boolean:t=t?l:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},f=(t,s)=>!i(t,s),y={attribute:!0,type:String,converter:u,reflect:!1,hasChanged:f};Symbol.metadata??=Symbol("metadata"),a.litPropertyMetadata??=new WeakMap;class b extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=y){if(s.state&&(s.attribute=!1),this._$Ei(),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(t,i,s);void 0!==r&&e(this.prototype,t,r)}}static getPropertyDescriptor(t,s,i){const{get:e,set:h}=r(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t}};return{get(){return e?.call(this)},set(s){const r=e?.call(this);h.call(this,s),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(d("elementProperties")))return;const t=n(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(d("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(d("properties"))){const t=this.properties,s=[...h(t),...o(t)];for(const i of s)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift((0,_css_tag_js__WEBPACK_IMPORTED_MODULE_0__.getCompatibleStyle)(s))}else void 0!==s&&i.push((0,_css_tag_js__WEBPACK_IMPORTED_MODULE_0__.getCompatibleStyle)(s));return i}static _$Eu(t,s){const i=s.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return (0,_css_tag_js__WEBPACK_IMPORTED_MODULE_0__.adoptStyles)(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach((t=>t.hostConnected?.()))}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach((t=>t.hostDisconnected?.()))}attributeChangedCallback(t,s,i){this._$AK(t,i)}_$EC(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:u).toAttribute(s,i.type);this._$Em=t,null==r?this.removeAttribute(e):this.setAttribute(e,r),this._$Em=null}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u;this._$Em=e,this[e]=r.fromAttribute(s,t.type),this._$Em=null}}requestUpdate(t,s,i){if(void 0!==t){if(i??=this.constructor.getPropertyOptions(t),!(i.hasChanged??f)(this[t],s))return;this.P(t,s,i)}!1===this.isUpdatePending&&(this._$ES=this._$ET())}P(t,s,i){this._$AL.has(t)||this._$AL.set(t,s),!0===i.reflect&&this._$Em!==t&&(this._$Ej??=new Set).add(t)}async _$ET(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t)!0!==i.wrapped||this._$AL.has(s)||void 0===this[s]||this.P(s,this[s],i)}let t=!1;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach((t=>t.hostUpdate?.())),this.update(s)):this._$EU()}catch(s){throw t=!1,this._$EU(),s}t&&this._$AE(s)}willUpdate(t){}_$AE(t){this._$EO?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EU(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Ej&&=this._$Ej.forEach((t=>this._$EC(t,this[t]))),this._$EU()}updated(t){}firstUpdated(t){}}b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[d("elementProperties")]=new Map,b[d("finalized")]=new Map,p?.({ReactiveElement:b}),(a.reactiveElementVersions??=[]).push("2.0.4");
//# sourceMappingURL=reactive-element.js.map


/***/ }),
/* 16 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   adoptStyles: () => (/* binding */ S),
/* harmony export */   css: () => (/* binding */ i),
/* harmony export */   getCompatibleStyle: () => (/* binding */ c)
/* harmony export */ });
/* unused harmony exports CSSResult, supportsAdoptingStyleSheets, unsafeCSS */
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o=new WeakMap;class n{constructor(t,e,o){if(this._$cssResult$=!0,o!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const s=this.t;if(e&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o.set(s,t))}return t}toString(){return this.cssText}}const r=t=>new n("string"==typeof t?t:t+"",void 0,s),i=(t,...e)=>{const o=1===t.length?t[0]:e.reduce(((e,s,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1]),t[0]);return new n(o,t,s)},S=(s,o)=>{if(e)s.adoptedStyleSheets=o.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const e of o){const o=document.createElement("style"),n=t.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o)}},c=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r(e)})(t):t;
//# sourceMappingURL=css-tag.js.map


/***/ }),
/* 17 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   html: () => (/* binding */ x),
/* harmony export */   noChange: () => (/* binding */ T),
/* harmony export */   render: () => (/* binding */ B)
/* harmony export */ });
/* unused harmony exports _$LH, mathml, nothing, svg */
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,i=t.trustedTypes,s=i?i.createPolicy("lit-html",{createHTML:t=>t}):void 0,e="$lit$",h=`lit$${Math.random().toFixed(9).slice(2)}$`,o="?"+h,n=`<${o}>`,r=document,l=()=>r.createComment(""),c=t=>null===t||"object"!=typeof t&&"function"!=typeof t,a=Array.isArray,u=t=>a(t)||"function"==typeof t?.[Symbol.iterator],d="[ \t\n\f\r]",f=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,v=/-->/g,_=/>/g,m=RegExp(`>|${d}(?:([^\\s"'>=/]+)(${d}*=${d}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),p=/'/g,g=/"/g,$=/^(?:script|style|textarea|title)$/i,y=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),x=y(1),b=y(2),w=y(3),T=Symbol.for("lit-noChange"),E=Symbol.for("lit-nothing"),A=new WeakMap,C=r.createTreeWalker(r,129);function P(t,i){if(!a(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==s?s.createHTML(i):i}const V=(t,i)=>{const s=t.length-1,o=[];let r,l=2===i?"<svg>":3===i?"<math>":"",c=f;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,y=0;for(;y<s.length&&(c.lastIndex=y,u=c.exec(s),null!==u);)y=c.lastIndex,c===f?"!--"===u[1]?c=v:void 0!==u[1]?c=_:void 0!==u[2]?($.test(u[2])&&(r=RegExp("</"+u[2],"g")),c=m):void 0!==u[3]&&(c=m):c===m?">"===u[0]?(c=r??f,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?m:'"'===u[3]?g:p):c===g||c===p?c=m:c===v||c===_?c=f:(c=m,r=void 0);const x=c===m&&t[i+1].startsWith("/>")?" ":"";l+=c===f?s+n:d>=0?(o.push(a),s.slice(0,d)+e+s.slice(d)+h+x):s+h+(-2===d?i:x)}return[P(t,l+(t[s]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),o]};class N{constructor({strings:t,_$litType$:s},n){let r;this.parts=[];let c=0,a=0;const u=t.length-1,d=this.parts,[f,v]=V(t,s);if(this.el=N.createElement(f,n),C.currentNode=this.el.content,2===s||3===s){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(r=C.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(e)){const i=v[a++],s=r.getAttribute(t).split(h),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:c,name:e[2],strings:s,ctor:"."===e[1]?H:"?"===e[1]?I:"@"===e[1]?L:k}),r.removeAttribute(t)}else t.startsWith(h)&&(d.push({type:6,index:c}),r.removeAttribute(t));if($.test(r.tagName)){const t=r.textContent.split(h),s=t.length-1;if(s>0){r.textContent=i?i.emptyScript:"";for(let i=0;i<s;i++)r.append(t[i],l()),C.nextNode(),d.push({type:2,index:++c});r.append(t[s],l())}}}else if(8===r.nodeType)if(r.data===o)d.push({type:2,index:c});else{let t=-1;for(;-1!==(t=r.data.indexOf(h,t+1));)d.push({type:7,index:c}),t+=h.length-1}c++}}static createElement(t,i){const s=r.createElement("template");return s.innerHTML=t,s}}function S(t,i,s=t,e){if(i===T)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=c(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(!1),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=S(t,h._$AS(t,i.values),h,e)),i}class M{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??r).importNode(i,!0);C.currentNode=e;let h=C.nextNode(),o=0,n=0,l=s[0];for(;void 0!==l;){if(o===l.index){let i;2===l.type?i=new R(h,h.nextSibling,this,t):1===l.type?i=new l.ctor(h,l.name,l.strings,this,t):6===l.type&&(i=new z(h,this,t)),this._$AV.push(i),l=s[++n]}o!==l?.index&&(h=C.nextNode(),o++)}return C.currentNode=r,e}p(t){let i=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++}}class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=E,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=S(this,t,i),c(t)?t===E||null==t||""===t?(this._$AH!==E&&this._$AR(),this._$AH=E):t!==this._$AH&&t!==T&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):u(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==E&&c(this._$AH)?this._$AA.nextSibling.data=t:this.T(r.createTextNode(t)),this._$AH=t}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=N.createElement(P(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else{const t=new M(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t}}_$AC(t){let i=A.get(t.strings);return void 0===i&&A.set(t.strings,i=new N(t)),i}k(t){a(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new R(this.O(l()),this.O(l()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e)}_$AR(t=this._$AA.nextSibling,i){for(this._$AP?.(!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=E,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=E}_$AI(t,i=this,s,e){const h=this.strings;let o=!1;if(void 0===h)t=S(this,t,i,0),o=!c(t)||t!==this._$AH&&t!==T,o&&(this._$AH=t);else{const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=S(this,e[s+n],i,n),r===T&&(r=this._$AH[n]),o||=!c(r)||r!==this._$AH[n],r===E?t=E:t!==E&&(t+=(r??"")+h[n+1]),this._$AH[n]=r}o&&!e&&this.j(t)}j(t){t===E?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class H extends k{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===E?void 0:t}}class I extends k{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==E)}}class L extends k{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5}_$AI(t,i=this){if((t=S(this,t,i,0)??E)===T)return;const s=this._$AH,e=t===E&&s!==E||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==E&&(s===E||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){S(this,t)}}const Z={M:e,P:h,A:o,C:1,L:V,R:M,D:u,V:S,I:R,H:k,N:I,U:L,B:H,F:z},j=t.litHtmlPolyfillSupport;j?.(N,R),(t.litHtmlVersions??=[]).push("3.2.1");const B=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new R(i.insertBefore(l(),t),t,void 0,s??{})}return h._$AI(t),h};
//# sourceMappingURL=lit-html.js.map


/***/ }),
/* 18 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LitElement: () => (/* binding */ r),
/* harmony export */   css: () => (/* reexport safe */ _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.css),
/* harmony export */   html: () => (/* reexport safe */ lit_html__WEBPACK_IMPORTED_MODULE_1__.html)
/* harmony export */ });
/* unused harmony export _$LE */
/* harmony import */ var _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(15);
/* harmony import */ var lit_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(17);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class r extends _lit_reactive_element__WEBPACK_IMPORTED_MODULE_0__.ReactiveElement{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=(0,lit_html__WEBPACK_IMPORTED_MODULE_1__.render)(s,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return lit_html__WEBPACK_IMPORTED_MODULE_1__.noChange}}r._$litElement$=!0,r["finalized"]=!0,globalThis.litElementHydrateSupport?.({LitElement:r});const i=globalThis.litElementPolyfillSupport;i?.({LitElement:r});const o={_$AK:(t,e,s)=>{t._$AK(e,s)},_$AL:t=>t._$AL};(globalThis.litElementVersions??=[]).push("4.1.1");
//# sourceMappingURL=lit-element.js.map


/***/ }),
/* 19 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* unused harmony export isServer */
/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const o=!1;
//# sourceMappingURL=is-server.js.map


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CustomElement: () => (/* binding */ CustomElement),
/* harmony export */   InjectAfter: () => (/* binding */ InjectAfter),
/* harmony export */   InjectionMode: () => (/* binding */ InjectionMode)
/* harmony export */ });
/* unused harmony exports InjectionPosition, defineInjectionScope, InjectAppend, InjectBefore, InjectIntoScope */
/* harmony import */ var lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(21);
/* harmony import */ var _utils_snips__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);


var InjectionMode;
(function (InjectionMode) {
    // Injects once at page load for elements matching the selector
    InjectionMode[InjectionMode["ONCE"] = 0] = "ONCE";
    // Continually injects whenever new elements that match the
    // selector exist that haven't been injected into yet
    //
    // Should be use for "dynamic" elements
    InjectionMode[InjectionMode["CONTINUOUS"] = 1] = "CONTINUOUS";
})(InjectionMode || (InjectionMode = {}));
var InjectionPosition;
(function (InjectionPosition) {
    InjectionPosition["Before"] = "beforebegin";
    InjectionPosition["Prepend"] = "afterbegin";
    InjectionPosition["Append"] = "beforeend";
    InjectionPosition["After"] = "afterend";
})(InjectionPosition || (InjectionPosition = {}));
var InjectionType;
(function (InjectionType) {
    InjectionType[InjectionType["Append"] = 0] = "Append";
    InjectionType[InjectionType["Before"] = 1] = "Before";
    InjectionType[InjectionType["After"] = 2] = "After";
})(InjectionType || (InjectionType = {}));
const InjectionConfigs = {
    [InjectionType.Append]: {
        exists: (anchor, selector) => Array.from(anchor.children).some((child) => child.matches(selector)),
        op: (anchor, target) => anchor.appendChild(target.elem()),
    },
    [InjectionType.Before]: {
        exists: (anchor, selector) => hasSiblingMatching(anchor, 'previousElementSibling', selector),
        op: (anchor, target) => anchor.before(target.elem()),
    },
    [InjectionType.After]: {
        exists: (anchor, selector) => hasSiblingMatching(anchor, 'nextElementSibling', selector),
        op: (anchor, target) => anchor.after(target.elem()),
    },
};
/** Checks if any sibling of `anchor` in the given direction matches the selector. */
function hasSiblingMatching(anchor, direction, selector) {
    for (let el = anchor[direction]; el; el = el[direction]) {
        if (el.matches(selector))
            return true;
    }
    return false;
}
function CustomElement() {
    return function (target, propertyKey, descriptor) {
        if (!(0,_utils_snips__WEBPACK_IMPORTED_MODULE_1__.inPageContext)()) {
            return;
        }
        if (customElements.get(target.tag())) {
            // Already defined
            return;
        }
        (0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_0__.customElement)(target.tag())(target);
    };
}
const canInject = (guard) => (guard ? guard() : true);
function assertNever(value) {
    throw new Error(`Unhandled injection mode: ${value}`);
}
function defineInjectionScope(config) {
    var _a;
    return {
        ...config,
        mode: (_a = config.mode) !== null && _a !== void 0 ? _a : InjectionMode.ONCE,
        state: {
            contextCache: new WeakMap(),
            completed: new WeakMap(),
            inFlight: new WeakMap(),
        },
    };
}
function getTagSet(map, scope) {
    let tags = map.get(scope);
    if (!tags) {
        tags = new Set();
        map.set(scope, tags);
    }
    return tags;
}
function hasTag(map, scope, tag) {
    var _a, _b;
    return (_b = (_a = map.get(scope)) === null || _a === void 0 ? void 0 : _a.has(tag)) !== null && _b !== void 0 ? _b : false;
}
function addTag(map, scope, tag) {
    getTagSet(map, scope).add(tag);
}
function deleteTag(map, scope, tag) {
    var _a;
    (_a = map.get(scope)) === null || _a === void 0 ? void 0 : _a.delete(tag);
}
function getCompletedMap(map, scope) {
    let tags = map.get(scope);
    if (!tags) {
        tags = new Map();
        map.set(scope, tags);
    }
    return tags;
}
function hasCompletedInjection(injectionScope, scope, tag) {
    var _a, _b;
    const element = (_a = injectionScope.state.completed.get(scope)) === null || _a === void 0 ? void 0 : _a.get(tag);
    if (element === undefined)
        return false;
    if (element === null)
        return true;
    if (element.isConnected)
        return true;
    (_b = injectionScope.state.completed.get(scope)) === null || _b === void 0 ? void 0 : _b.delete(tag);
    return false;
}
function addCompletedInjection(injectionScope, scope, tag, element) {
    getCompletedMap(injectionScope.state.completed, scope).set(tag, element);
}
async function getScopeContext(injectionScope, scope) {
    const cached = injectionScope.state.contextCache.get(scope);
    if (cached)
        return cached;
    const context = Promise.resolve()
        .then(() => injectionScope.context(scope))
        .then((result) => {
        if (result === undefined) {
            injectionScope.state.contextCache.delete(scope);
            return result;
        }
        injectionScope.state.contextCache.set(scope, Promise.resolve(result));
        return result;
    })
        .catch((e) => {
        injectionScope.state.contextCache.delete(scope);
        throw e;
    });
    injectionScope.state.contextCache.set(scope, context);
    return context;
}
async function injectIntoScope(scope, target, injectionScope, config) {
    var _a;
    const tag = target.tag();
    if (hasCompletedInjection(injectionScope, scope, tag) || hasTag(injectionScope.state.inFlight, scope, tag)) {
        return;
    }
    addTag(injectionScope.state.inFlight, scope, tag);
    try {
        const context = await getScopeContext(injectionScope, scope);
        if (context === undefined)
            return;
        if (context === null) {
            addCompletedInjection(injectionScope, scope, tag, null);
            return;
        }
        const anchor = config.anchor({ scope, context });
        if (anchor === undefined)
            return;
        if (anchor === null) {
            addCompletedInjection(injectionScope, scope, tag, null);
            return;
        }
        const element = target.elem();
        element.injectionContext = context;
        anchor.insertAdjacentElement((_a = config.position) !== null && _a !== void 0 ? _a : InjectionPosition.Append, element);
        addCompletedInjection(injectionScope, scope, tag, element);
    }
    catch (e) {
        // Failed context builders are retried on the next scan.
    }
    finally {
        deleteTag(injectionScope.state.inFlight, scope, tag);
    }
}
function Inject(selector, mode, type, guard) {
    return function (target, propertyKey, descriptor) {
        if (!(0,_utils_snips__WEBPACK_IMPORTED_MODULE_1__.inPageContext)()) {
            return;
        }
        switch (mode) {
            case InjectionMode.ONCE:
                if (!canInject(guard)) {
                    return;
                }
                document.querySelectorAll(selector).forEach((el) => {
                    InjectionConfigs[type].op(el, target);
                });
                break;
            case InjectionMode.CONTINUOUS:
                setInterval(() => {
                    if (!canInject(guard)) {
                        return;
                    }
                    document.querySelectorAll(selector).forEach((el) => {
                        // Don't add the item again if we already have
                        if (InjectionConfigs[type].exists(el, target.tag()))
                            return;
                        InjectionConfigs[type].op(el, target);
                    });
                }, 250);
                break;
            default:
                assertNever(mode);
        }
    };
}
function InjectAppend(selector, mode = InjectionMode.ONCE, guard) {
    return Inject(selector, mode, InjectionType.Append, guard);
}
function InjectBefore(selector, mode = InjectionMode.ONCE, guard) {
    return Inject(selector, mode, InjectionType.Before, guard);
}
function InjectAfter(selector, mode = InjectionMode.ONCE, guard) {
    return Inject(selector, mode, InjectionType.After, guard);
}
function InjectIntoScope(injectionScope, config) {
    return function (target, propertyKey, descriptor) {
        if (!(0,_utils_snips__WEBPACK_IMPORTED_MODULE_1__.inPageContext)()) {
            return;
        }
        const inject = () => {
            if (!canInject(injectionScope.guard)) {
                return;
            }
            document.querySelectorAll(injectionScope.selector).forEach((scope) => {
                void injectIntoScope(scope, target, injectionScope, config);
            });
        };
        switch (injectionScope.mode) {
            case InjectionMode.ONCE:
                inject();
                break;
            case InjectionMode.CONTINUOUS:
                setInterval(inject, 250);
                break;
            default:
                assertNever(injectionScope.mode);
        }
    };
}


/***/ }),
/* 21 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   customElement: () => (/* reexport safe */ _lit_reactive_element_decorators_custom_element_js__WEBPACK_IMPORTED_MODULE_0__.customElement),
/* harmony export */   property: () => (/* reexport safe */ _lit_reactive_element_decorators_property_js__WEBPACK_IMPORTED_MODULE_1__.property),
/* harmony export */   state: () => (/* reexport safe */ _lit_reactive_element_decorators_state_js__WEBPACK_IMPORTED_MODULE_2__.state)
/* harmony export */ });
/* harmony import */ var _lit_reactive_element_decorators_custom_element_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(22);
/* harmony import */ var _lit_reactive_element_decorators_property_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23);
/* harmony import */ var _lit_reactive_element_decorators_state_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(24);
/* harmony import */ var _lit_reactive_element_decorators_event_options_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(25);
/* harmony import */ var _lit_reactive_element_decorators_query_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(26);
/* harmony import */ var _lit_reactive_element_decorators_query_all_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(28);
/* harmony import */ var _lit_reactive_element_decorators_query_async_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(29);
/* harmony import */ var _lit_reactive_element_decorators_query_assigned_elements_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(30);
/* harmony import */ var _lit_reactive_element_decorators_query_assigned_nodes_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(31);

//# sourceMappingURL=decorators.js.map


/***/ }),
/* 22 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   customElement: () => (/* binding */ t)
/* harmony export */ });
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=t=>(e,o)=>{void 0!==o?o.addInitializer((()=>{customElements.define(t,e)})):customElements.define(t,e)};
//# sourceMappingURL=custom-element.js.map


/***/ }),
/* 23 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   property: () => (/* binding */ n)
/* harmony export */ });
/* unused harmony export standardProperty */
/* harmony import */ var _reactive_element_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(15);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const o={attribute:!0,type:String,converter:_reactive_element_js__WEBPACK_IMPORTED_MODULE_0__.defaultConverter,reflect:!1,hasChanged:_reactive_element_js__WEBPACK_IMPORTED_MODULE_0__.notEqual},r=(t=o,e,r)=>{const{kind:n,metadata:i}=r;let s=globalThis.litPropertyMetadata.get(i);if(void 0===s&&globalThis.litPropertyMetadata.set(i,s=new Map),s.set(r.name,t),"accessor"===n){const{name:o}=r;return{set(r){const n=e.get.call(this);e.set.call(this,r),this.requestUpdate(o,n,t)},init(e){return void 0!==e&&this.P(o,void 0,t),e}}}if("setter"===n){const{name:o}=r;return function(r){const n=this[o];e.call(this,r),this.requestUpdate(o,n,t)}}throw Error("Unsupported decorator location: "+n)};function n(t){return(e,o)=>"object"==typeof o?r(t,e,o):((t,e,o)=>{const r=e.hasOwnProperty(o);return e.constructor.createProperty(o,r?{...t,wrapped:!0}:t),r?Object.getOwnPropertyDescriptor(e,o):void 0})(t,e,o)}
//# sourceMappingURL=property.js.map


/***/ }),
/* 24 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   state: () => (/* binding */ r)
/* harmony export */ });
/* harmony import */ var _property_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(23);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function r(r){return (0,_property_js__WEBPACK_IMPORTED_MODULE_0__.property)({...r,state:!0,attribute:!1})}
//# sourceMappingURL=state.js.map


/***/ }),
/* 25 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* unused harmony export eventOptions */
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function t(t){return(n,o)=>{const c="function"==typeof n?n:n[o];Object.assign(c,t)}}
//# sourceMappingURL=event-options.js.map


/***/ }),
/* 26 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* unused harmony export query */
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(27);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function e(e,r){return(n,s,i)=>{const o=t=>t.renderRoot?.querySelector(e)??null;if(r){const{get:e,set:r}="object"==typeof s?n:i??(()=>{const t=Symbol();return{get(){return this[t]},set(e){this[t]=e}}})();return (0,_base_js__WEBPACK_IMPORTED_MODULE_0__.desc)(n,s,{get(){let t=e.call(this);return void 0===t&&(t=o(this),(null!==t||this.hasUpdated)&&r.call(this,t)),t}})}return (0,_base_js__WEBPACK_IMPORTED_MODULE_0__.desc)(n,s,{get(){return o(this)}})}}
//# sourceMappingURL=query.js.map


/***/ }),
/* 27 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   desc: () => (/* binding */ e)
/* harmony export */ });
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=(e,t,c)=>(c.configurable=!0,c.enumerable=!0,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,c),c);
//# sourceMappingURL=base.js.map


/***/ }),
/* 28 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* unused harmony export queryAll */
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(27);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let e;function r(r){return(n,o)=>(0,_base_js__WEBPACK_IMPORTED_MODULE_0__.desc)(n,o,{get(){return(this.renderRoot??(e??=document.createDocumentFragment())).querySelectorAll(r)}})}
//# sourceMappingURL=query-all.js.map


/***/ }),
/* 29 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* unused harmony export queryAsync */
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(27);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function r(r){return(n,e)=>(0,_base_js__WEBPACK_IMPORTED_MODULE_0__.desc)(n,e,{async get(){return await this.updateComplete,this.renderRoot?.querySelector(r)??null}})}
//# sourceMappingURL=query-async.js.map


/***/ }),
/* 30 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* unused harmony export queryAssignedElements */
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(27);

/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function o(o){return(e,n)=>{const{slot:r,selector:s}=o??{},c="slot"+(r?`[name=${r}]`:":not([name])");return (0,_base_js__WEBPACK_IMPORTED_MODULE_0__.desc)(e,n,{get(){const t=this.renderRoot?.querySelector(c),e=t?.assignedElements(o)??[];return void 0===s?e:e.filter((t=>t.matches(s)))}})}}
//# sourceMappingURL=query-assigned-elements.js.map


/***/ }),
/* 31 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* unused harmony export queryAssignedNodes */
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(27);

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function n(n){return(o,r)=>{const{slot:e}=n??{},s="slot"+(e?`[name=${e}]`:":not([name])");return (0,_base_js__WEBPACK_IMPORTED_MODULE_0__.desc)(o,r,{get(){const t=this.renderRoot?.querySelector(s);return t?.assignedNodes(n)??[]}})}}
//# sourceMappingURL=query-assigned-nodes.js.map


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FloatElement: () => (/* binding */ FloatElement)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);
/* harmony import */ var _common_ui_tooltip__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(33);


function camelToDashCase(str) {
    return str
        .split(/(?=[A-Z])/)
        .join('-')
        .toLowerCase();
}
// LitElement wrapper with a pre-determined tag
class FloatElement extends lit__WEBPACK_IMPORTED_MODULE_0__.LitElement {
    static tag() {
        return `csfloat-${camelToDashCase(this.name)}`;
    }
    static elem() {
        return document.createElement(this.tag());
    }
    tooltip(label, extraClasses) {
        return (0,_common_ui_tooltip__WEBPACK_IMPORTED_MODULE_1__.tooltip)(label, extraClasses);
    }
}
FloatElement.styles = [
    ..._common_ui_tooltip__WEBPACK_IMPORTED_MODULE_1__.tooltipStyles,
    (0,lit__WEBPACK_IMPORTED_MODULE_0__.css) `
            hr {
                background-color: #1b2939;
                border-style: solid none none;
                border-color: black;
                border-width: 1px 0 0;
                height: 2px;
            }

            a {
                color: #ebebeb;
                cursor: pointer;
            }

            input[type='text'],
            input[type='password'],
            input[type='number'],
            select {
                color: #909090;
                background-color: rgba(0, 0, 0, 0.2);
                border: 1px solid #000;
                border-radius: 3px;
            }

            input[type='color'] {
                float: left;
                margin-top: 2px;
                -webkit-appearance: none;
                border: none;
                width: 20px;
                height: 20px;
                padding: 0;
            }

            input[type='color']::-webkit-color-swatch-wrapper {
                padding: 0;
            }

            input[type='color']::-webkit-color-swatch {
                border: none;
            }
        `,
];


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   tooltip: () => (/* binding */ tooltip),
/* harmony export */   tooltipStyles: () => (/* binding */ tooltipStyles)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);
/* harmony import */ var lit_html_directive_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(34);
/* harmony import */ var _thirdparty_hintcss_hintcss__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(35);



class TooltipDirective extends lit_html_directive_js__WEBPACK_IMPORTED_MODULE_1__.Directive {
    constructor() {
        super(...arguments);
        this.parentNode = null;
        this.label = '';
        // Extra classes to customize the tooltip. See https://kushagra.dev/lab/hint/ for all available classes
        this.extraClasses = '';
    }
    update(part, [label, extraClasses]) {
        this.parentNode = part.parentNode;
        this.label = label;
        if (extraClasses) {
            this.extraClasses = extraClasses;
        }
        if (!this.parentNode) {
            return;
        }
        const newParentClass = `${this.parentNode.getAttribute('class') || ''} hint--top hint--rounded hint--no-arrow ${this.extraClasses}`;
        this.parentNode.setAttribute('class', newParentClass);
        this.parentNode.setAttribute('aria-label', this.label);
    }
    render(label, extraClasses) { }
}
const tooltip = (0,lit_html_directive_js__WEBPACK_IMPORTED_MODULE_1__.directive)(TooltipDirective);
const tooltipStyles = [
    _thirdparty_hintcss_hintcss__WEBPACK_IMPORTED_MODULE_2__.hintcss,
    (0,lit__WEBPACK_IMPORTED_MODULE_0__.css) `
        [class*='hint--'][aria-label]:after {
            text-shadow: none;
            font-family: 'Motiva Sans', Arial, Helvetica, sans-serif;
            font-weight: normal;
            line-height: normal;
            text-align: center;
            background: #c2c2c2;
            color: #3d3d3f;
            font-size: 11px;
            border-radius: 3px;
            padding: 5px;
        }
        .hint--whitespace-pre-wrap:after,
        .hint--whitespace-pre-wrap:before {
            white-space: pre-wrap;
        }
    `,
];


/***/ }),
/* 34 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Directive: () => (/* binding */ i),
/* harmony export */   PartType: () => (/* binding */ t),
/* harmony export */   directive: () => (/* binding */ e)
/* harmony export */ });
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},e=t=>(...e)=>({_$litDirective$:t,values:e});class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}
//# sourceMappingURL=directive.js.map


/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   hintcss: () => (/* binding */ hintcss)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);

const hintcss = (0,lit__WEBPACK_IMPORTED_MODULE_0__.css) `
    /*! Hint.css - v3.0.0 - 2023-11-29
* https://kushagra.dev/lab/hint/
* Copyright (c) 2023 Kushagra Gour */

    [class*='hint--'] {
        position: relative;
        display: inline-block;
    }
    [class*='hint--']:after,
    [class*='hint--']:before {
        position: absolute;
        transform: translate3d(0, 0, 0);
        visibility: hidden;
        opacity: 0;
        z-index: 1000000;
        pointer-events: none;
        transition: 0.3s ease;
        transition-delay: 0s;
    }
    [class*='hint--']:hover:after,
    [class*='hint--']:hover:before {
        visibility: visible;
        opacity: 1;
        transition-delay: 0.1s;
    }
    [class*='hint--']:before {
        content: '';
        position: absolute;
        background: #383838;
        border: 6px solid transparent;
        clip-path: polygon(0 0, 100% 0, 100% 100%);
        z-index: 1000001;
    }
    [class*='hint--']:after {
        background: #383838;
        color: #fff;
        padding: 8px 10px;
        font-size: 1rem;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        line-height: 1rem;
        white-space: nowrap;
        text-shadow: 0 1px 0 #000;
        box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3);
    }
    .hint--error:after,
    .hint--error:before {
        background-color: #b24e4c;
    }
    [class*='hint--'][aria-label]:after {
        content: attr(aria-label);
    }
    [class*='hint--'][data-hint]:after {
        content: attr(data-hint);
    }
    [aria-label='']:after,
    [aria-label='']:before,
    [data-hint='']:after,
    [data-hint='']:before {
        display: none !important;
    }
    .hint--top {
        --rotation: 135deg;
    }
    .hint--top:after,
    .hint--top:before {
        bottom: 100%;
        left: 50%;
    }
    .hint--top:before {
        margin-bottom: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--top:after {
        transform: translateX(-50%);
    }
    .hint--top:hover:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--top:hover:after {
        transform: translateX(-50%) translateY(-8px);
    }
    .hint--bottom {
        --rotation: -45deg;
    }
    .hint--bottom:after,
    .hint--bottom:before {
        top: 100%;
        left: 50%;
    }
    .hint--bottom:before {
        margin-top: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--bottom:after {
        transform: translateX(-50%);
    }
    .hint--bottom:hover:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--bottom:hover:after {
        transform: translateX(-50%) translateY(8px);
    }
    .hint--right {
        --rotation: -135deg;
    }
    .hint--right:before {
        margin-left: -5.5px;
        margin-bottom: -6px;
        transform: rotate(var(--rotation));
    }
    .hint--right:after {
        margin-bottom: calc(-1 * (1rem + 16px) / 2);
    }
    .hint--right:after,
    .hint--right:before {
        left: 100%;
        bottom: 50%;
    }
    .hint--right:hover:before {
        transform: translateX(8px) rotate(var(--rotation));
    }
    .hint--right:hover:after {
        transform: translateX(8px);
    }
    .hint--left {
        --rotation: 45deg;
    }
    .hint--left:before {
        margin-right: -5.5px;
        margin-bottom: -6px;
        transform: rotate(var(--rotation));
    }
    .hint--left:after {
        margin-bottom: calc(-1 * (1rem + 16px) / 2);
    }
    .hint--left:after,
    .hint--left:before {
        right: 100%;
        bottom: 50%;
    }
    .hint--left:hover:before {
        transform: translateX(-8px) rotate(var(--rotation));
    }
    .hint--left:hover:after {
        transform: translateX(-8px);
    }
    .hint--top-left {
        --rotation: 135deg;
    }
    .hint--top-left:after,
    .hint--top-left:before {
        bottom: 100%;
        left: 50%;
    }
    .hint--top-left:before {
        margin-bottom: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--top-left:after {
        transform: translateX(-100%);
        margin-left: 12px;
    }
    .hint--top-left:hover:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--top-left:hover:after {
        transform: translateX(-100%) translateY(-8px);
    }
    .hint--top-right {
        --rotation: 135deg;
    }
    .hint--top-right:after,
    .hint--top-right:before {
        bottom: 100%;
        left: 50%;
    }
    .hint--top-right:before {
        margin-bottom: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--top-right:after {
        transform: translateX(0);
        margin-left: -12px;
    }
    .hint--top-right:hover:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--top-right:hover:after {
        transform: translateY(-8px);
    }
    .hint--bottom-left {
        --rotation: -45deg;
    }
    .hint--bottom-left:after,
    .hint--bottom-left:before {
        top: 100%;
        left: 50%;
    }
    .hint--bottom-left:before {
        margin-top: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--bottom-left:after {
        transform: translateX(-100%);
        margin-left: 12px;
    }
    .hint--bottom-left:hover:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--bottom-left:hover:after {
        transform: translateX(-100%) translateY(8px);
    }
    .hint--bottom-right {
        --rotation: -45deg;
    }
    .hint--bottom-right:after,
    .hint--bottom-right:before {
        top: 100%;
        left: 50%;
    }
    .hint--bottom-right:before {
        margin-top: -5.5px;
        transform: rotate(var(--rotation));
        left: calc(50% - 6px);
    }
    .hint--bottom-right:after {
        transform: translateX(0);
        margin-left: -12px;
    }
    .hint--bottom-right:hover:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--bottom-right:hover:after {
        transform: translateY(8px);
    }
    .hint--fit:after,
    .hint--large:after,
    .hint--medium:after,
    .hint--small:after {
        box-sizing: border-box;
        white-space: normal;
        line-height: 1.4em;
        word-wrap: break-word;
    }
    .hint--small:after {
        width: 80px;
    }
    .hint--medium:after {
        width: 150px;
    }
    .hint--large:after {
        width: 300px;
    }
    .hint--fit:after {
        width: 100%;
    }
    .hint--error:after {
        text-shadow: 0 1px 0 #592726;
    }
    .hint--warning:after,
    .hint--warning:before {
        background-color: #bf9853;
    }
    .hint--warning:after {
        text-shadow: 0 1px 0 #6c5328;
    }
    .hint--info:after,
    .hint--info:before {
        background-color: #3985ac;
    }
    .hint--info:after {
        text-shadow: 0 1px 0 #1a3c4d;
    }
    .hint--success:after,
    .hint--success:before {
        background-color: #458646;
    }
    .hint--success:after {
        text-shadow: 0 1px 0 #1a321a;
    }
    .hint--always:after,
    .hint--always:before {
        opacity: 1;
        visibility: visible;
    }
    .hint--always.hint--top:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--always.hint--top:after {
        transform: translateX(-50%) translateY(-8px);
    }
    .hint--always.hint--top-left:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--always.hint--top-left:after {
        transform: translateX(-100%) translateY(-8px);
    }
    .hint--always.hint--top-right:before {
        transform: translateY(-8px) rotate(var(--rotation));
    }
    .hint--always.hint--top-right:after {
        transform: translateY(-8px);
    }
    .hint--always.hint--bottom:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--always.hint--bottom:after {
        transform: translateX(-50%) translateY(8px);
    }
    .hint--always.hint--bottom-left:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--always.hint--bottom-left:after {
        transform: translateX(-100%) translateY(8px);
    }
    .hint--always.hint--bottom-right:before {
        transform: translateY(8px) rotate(var(--rotation));
    }
    .hint--always.hint--bottom-right:after {
        transform: translateY(8px);
    }
    .hint--always.hint--left:before {
        transform: translateX(-8px) rotate(var(--rotation));
    }
    .hint--always.hint--left:after {
        transform: translateX(-8px);
    }
    .hint--always.hint--right:before {
        transform: translateX(8px) rotate(var(--rotation));
    }
    .hint--always.hint--right:after {
        transform: translateX(8px);
    }
    .hint--rounded:before {
        border-radius: 0 4px 0 0;
    }
    .hint--rounded:after {
        border-radius: 4px;
    }
    .hint--no-animate:after,
    .hint--no-animate:before {
        transition-duration: 0s;
    }
    .hint--bounce:after,
    .hint--bounce:before {
        transition:
            opacity 0.3s ease,
            visibility 0.3s ease,
            transform 0.3s cubic-bezier(0.71, 1.7, 0.77, 1.24);
    }
    @supports (transition-timing-function: linear(0, 1)) {
        .hint--bounce:after,
        .hint--bounce:before {
            --spring-easing: linear(
                0,
                0.009,
                0.035 2.1%,
                0.141 4.4%,
                0.723 12.9%,
                0.938,
                1.077 20.4%,
                1.121,
                1.149 24.3%,
                1.159,
                1.163 27%,
                1.154,
                1.129 32.8%,
                1.051 39.6%,
                1.017 43.1%,
                0.991,
                0.977 51%,
                0.975 57.1%,
                0.997 69.8%,
                1.003 76.9%,
                1
            );
            transition:
                opacity 0.3s ease,
                visibility 0.3s ease,
                transform 0.5s var(--spring-easing);
        }
    }
    .hint--no-shadow:after,
    .hint--no-shadow:before {
        text-shadow: initial;
        box-shadow: initial;
    }
    .hint--no-arrow:before {
        display: none;
    }
`;


/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* unused harmony export SteamButton */
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);
/* harmony import */ var lit_html_directives_class_map_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(37);
/* harmony import */ var lit_decorators_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(21);
/* harmony import */ var _injectors__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(20);
/* harmony import */ var _custom__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(32);
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};





var ButtonType;
(function (ButtonType) {
    ButtonType["GreenWhite"] = "green_white";
    ButtonType["GreyWhite"] = "grey_white";
})(ButtonType || (ButtonType = {}));
let SteamButton = class SteamButton extends _custom__WEBPACK_IMPORTED_MODULE_4__.FloatElement {
    constructor() {
        super(...arguments);
        this.text = '';
        this.type = ButtonType.GreenWhite;
        this.disabled = false;
    }
    async connectedCallback() {
        super.connectedCallback();
    }
    btnClass() {
        const r = { btn_small: true };
        r[`btn_${this.type}_innerfade`] = true;
        if (this.disabled) {
            r.btn_disabled = true;
        }
        return (0,lit_html_directives_class_map_js__WEBPACK_IMPORTED_MODULE_1__.classMap)(r);
    }
    render() {
        return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html) `
            <a class="${this.btnClass()}">
                <span>${this.text}</span>
            </a>
        `;
    }
};
SteamButton.styles = [
    ..._custom__WEBPACK_IMPORTED_MODULE_4__.FloatElement.styles,
    (0,lit__WEBPACK_IMPORTED_MODULE_0__.css) `
            .btn_green_white_innerfade {
                border-radius: 2px;
                border: none;
                padding: 1px;
                display: inline-block;
                cursor: pointer;
                text-decoration: none !important;
                color: #d2e885 !important;

                background: #a4d007;
                background: -webkit-linear-gradient(top, #a4d007 5%, #536904 95%);
                background: linear-gradient(to bottom, #a4d007 5%, #536904 95%);
            }

            .btn_green_white_innerfade > span {
                border-radius: 2px;
                display: block;

                background: #799905;
                background: -webkit-linear-gradient(top, #799905 5%, #536904 95%);
                background: linear-gradient(to bottom, #799905 5%, #536904 95%);
            }

            .btn_green_white_innerfade:not(.btn_disabled):not(:disabled):not(.btn_active):not(.active):hover {
                text-decoration: none !important;
                color: #fff !important;

                background: #b6d908;
                background: -webkit-linear-gradient(top, #b6d908 5%, #80a006 95%);
                background: linear-gradient(to bottom, #b6d908 5%, #80a006 95%);
            }

            .btn_green_white_innerfade:not(.btn_disabled):not(:disabled):not(.btn_active):not(.active):hover > span {
                background: #a1bf07;
                background: -webkit-linear-gradient(top, #a1bf07 5%, #80a006 95%);
                background: linear-gradient(to bottom, #a1bf07 5%, #80a006 95%);
            }

            .btn_grey_white_innerfade {
                border-radius: 2px;
                border: none;
                padding: 1px;
                display: inline-block;
                cursor: pointer;
                text-decoration: none !important;
                color: #fff !important;

                background: #acb5bd;
                background: -webkit-linear-gradient(top, #acb5bd 5%, #414a52 95%);
                background: linear-gradient(to bottom, #acb5bd 5%, #414a52 95%);
            }

            .btn_grey_white_innerfade > span {
                border-radius: 2px;
                display: block;

                background: #778088;
                background: -webkit-linear-gradient(top, #778088 5%, #414a52 95%);
                background: linear-gradient(to bottom, #778088 5%, #414a52 95%);
            }

            .btn_grey_white_innerfade:not(.btn_disabled):not(:disabled):not(.btn_active):not(.active):hover {
                text-decoration: none !important;
                color: #fff !important;

                background: #cfd8e0;
                background: -webkit-linear-gradient(top, #cfd8e0 5%, #565f67 95%);
                background: linear-gradient(to bottom, #cfd8e0 5%, #565f67 95%);
            }

            .btn_grey_white_innerfade:not(.btn_disabled):not(:disabled):not(.btn_active):not(.active):hover > span {
                background: #99a2aa;
                background: -webkit-linear-gradient(top, #99a2aa 5%, #565f67 95%);
                background: linear-gradient(to bottom, #99a2aa 5%, #565f67 95%);
            }

            .btn_small > span {
                padding: 0 15px;
                font-size: 12px;
                line-height: 20px;
            }

            .btn_disabled {
                cursor: default;
            }
        `,
];
__decorate([
    (0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_2__.property)({ type: String })
], SteamButton.prototype, "text", void 0);
__decorate([
    (0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_2__.property)({ type: String })
], SteamButton.prototype, "type", void 0);
__decorate([
    (0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_2__.property)({ type: Boolean })
], SteamButton.prototype, "disabled", void 0);
SteamButton = __decorate([
    (0,_injectors__WEBPACK_IMPORTED_MODULE_3__.CustomElement)()
], SteamButton);



/***/ }),
/* 37 */
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   classMap: () => (/* binding */ e)
/* harmony export */ });
/* harmony import */ var _lit_html_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(17);
/* harmony import */ var _directive_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(34);

/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const e=(0,_directive_js__WEBPACK_IMPORTED_MODULE_1__.directive)(class extends _directive_js__WEBPACK_IMPORTED_MODULE_1__.Directive{constructor(t){if(super(t),t.type!==_directive_js__WEBPACK_IMPORTED_MODULE_1__.PartType.ATTRIBUTE||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return" "+Object.keys(t).filter((s=>t[s])).join(" ")+" "}update(s,[i]){if(void 0===this.st){this.st=new Set,void 0!==s.strings&&(this.nt=new Set(s.strings.join(" ").split(/\s/).filter((t=>""!==t))));for(const t in i)i[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(i)}const r=s.element.classList;for(const t of this.st)t in i||(r.remove(t),this.st.delete(t));for(const t in i){const s=!!i[t];s===this.st.has(t)||this.nt?.has(t)||(s?(r.add(t),this.st.add(t)):(r.remove(t),this.st.delete(t)))}return _lit_html_js__WEBPACK_IMPORTED_MODULE_0__.noChange}});
//# sourceMappingURL=class-map.js.map


/***/ }),
/* 38 */,
/* 39 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   environment: () => (/* binding */ environment)
/* harmony export */ });
const environment = {
    csfloat_base_api_url: 'https://csfloat.com/api',
    notary: {
        tlsn: 'https://notary.csfloat.com/v15',
        ws: 'wss://notary.csfloat.com/v15/proxy',
        loggingLevel: 'Warn',
    },
    reverse_watch_base_api_url: 'https://reverse.watch/api',
    floatdb_gateway_url: 'https://gateway.floatdb.com',
    skincraft_embed_origin: 'https://skincraft.gg',
};


/***/ }),
/* 40 */,
/* 41 */,
/* 42 */,
/* 43 */,
/* 44 */,
/* 45 */,
/* 46 */,
/* 47 */,
/* 48 */,
/* 49 */,
/* 50 */,
/* 51 */,
/* 52 */,
/* 53 */,
/* 54 */,
/* 55 */,
/* 56 */,
/* 57 */,
/* 58 */,
/* 59 */,
/* 60 */,
/* 61 */,
/* 62 */,
/* 63 */,
/* 64 */,
/* 65 */,
/* 66 */,
/* 67 */,
/* 68 */,
/* 69 */,
/* 70 */,
/* 71 */,
/* 72 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GenericJob: () => (/* binding */ GenericJob),
/* harmony export */   TTLCachedQueue: () => (/* binding */ TTLCachedQueue)
/* harmony export */ });
/* unused harmony exports Job, Queue, CachedQueue, SimpleCachedQueue */
/* harmony import */ var _cache__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(73);
/* harmony import */ var _deferred_promise__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(74);


class Job {
    constructor(data) {
        this.data = data;
    }
    getData() {
        return this.data;
    }
    /**
     * Hash that uniquely identifies this job.
     *
     * If two jobs have the same hashcode, they are considered identical.
     * */
    hashCode() {
        return JSON.stringify(this.data);
    }
}
class GenericJob extends Job {
}
/**
 * Queue to handle processing of "Jobs" with a request that
 * return a response. Ensures a max concurrency of processing
 * simultaneous jobs.
 */
class Queue {
    constructor(maxConcurrency) {
        this.maxConcurrency = maxConcurrency;
        this.internalQueue = [];
        this.jobsProcessing = 0;
    }
    /** Amount of jobs currently in the queue */
    size() {
        return this.internalQueue.length;
    }
    has(job) {
        return !!this.internalQueue.find((e) => e.job.hashCode() === job.hashCode());
    }
    getOrThrow(job) {
        if (!this.has(job)) {
            throw new Error(`Job[${job.hashCode()}] is not queued`);
        }
        // Guaranteed
        return this.internalQueue.find((e) => e.job.hashCode() === job.hashCode());
    }
    async checkQueue() {
        if (this.internalQueue.length === 0 || this.jobsProcessing >= this.maxConcurrency) {
            // Don't want to launch more instances
            return;
        }
        this.jobsProcessing += 1;
        const queuedJob = this.internalQueue.shift();
        const req = queuedJob.job.getData();
        try {
            const resp = await this.process(req);
            queuedJob.deferredPromise.resolve(resp);
        }
        catch (e) {
            queuedJob.deferredPromise.reject(e.toString());
        }
        this.jobsProcessing -= 1;
        this.checkQueue();
    }
    add(job) {
        var _a;
        if (this.has(job)) {
            return (_a = this.getOrThrow(job)) === null || _a === void 0 ? void 0 : _a.deferredPromise.promise();
        }
        const promise = new _deferred_promise__WEBPACK_IMPORTED_MODULE_1__.DeferredPromise();
        this.internalQueue.push({ job, deferredPromise: promise });
        setTimeout(() => this.checkQueue(), 0);
        return promise.promise();
    }
}
/**
 * Like a queue, but has an internal cache for elements already requested
 */
class CachedQueue extends Queue {
    /** Amount of previously requested jobs stored in the cache */
    cacheSize() {
        return this.cache().size();
    }
    getCached(job) {
        if (this.cache().has(job.hashCode())) {
            return this.cache().getOrThrow(job.hashCode());
        }
        else {
            return null;
        }
    }
    setCached(job, resp) {
        this.cache().set(job.hashCode(), resp);
    }
    add(job) {
        if (this.getCached(job)) {
            return Promise.resolve(this.getCached(job));
        }
        return super.add(job).then((resp) => {
            this.setCached(job, resp);
            return resp;
        });
    }
}
class SimpleCachedQueue extends CachedQueue {
    constructor() {
        super(...arguments);
        this.cache_ = new _cache__WEBPACK_IMPORTED_MODULE_0__.Cache();
    }
    cache() {
        return this.cache_;
    }
}
class TTLCachedQueue extends CachedQueue {
    constructor(maxConcurrency, ttlMs) {
        super(maxConcurrency);
        this.ttlMs = ttlMs;
        this.cache_ = new _cache__WEBPACK_IMPORTED_MODULE_0__.TTLCache(ttlMs);
    }
    cache() {
        return this.cache_;
    }
}


/***/ }),
/* 73 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Cache: () => (/* binding */ Cache),
/* harmony export */   TTLCache: () => (/* binding */ TTLCache)
/* harmony export */ });
/**
 * Simple Generic Cache with stringified keys
 */
class Cache {
    constructor() {
        this.cache_ = {};
    }
    set(key, value) {
        this.cache_[key] = value;
    }
    get(key) {
        return this.cache_[key];
    }
    getOrThrow(key) {
        if (!this.has(key)) {
            throw new Error(`key ${key} does not exist in map [getOrThrow]`);
        }
        return this.cache_[key];
    }
    has(key) {
        return key in this.cache_;
    }
    size() {
        return Object.keys(this.cache_).length;
    }
    clear() {
        this.cache_ = {};
    }
}
/**
 * Extension of {@link Cache} that allows setting a TTL (time-to-live) on a key
 * such that automatically expires after a specified time.
 *
 * By default, keys will expire with {@link defaultTTLMs}.
 */
class TTLCache {
    constructor(defaultTTLMs) {
        this.defaultTTLMs = defaultTTLMs;
        this.cache_ = {};
    }
    get(key) {
        const value = this.cache_[key];
        if (!value) {
            return;
        }
        // Check if it also respects TTL
        if (value.expiresEpoch < Date.now()) {
            return;
        }
        return value.data;
    }
    has(key) {
        return !!this.get(key);
    }
    getOrThrow(key) {
        if (!this.has(key)) {
            throw new Error(`key ${key} does not exist in map [getOrThrow]`);
        }
        return this.get(key);
    }
    setWithTTL(key, value, ttlMs) {
        this.cache_[key] = {
            data: value,
            expiresEpoch: Date.now() + ttlMs,
        };
    }
    set(key, value) {
        this.setWithTTL(key, value, this.defaultTTLMs);
    }
    size() {
        return Object.keys(this.cache_).length;
    }
    clear() {
        this.cache_ = {};
    }
}


/***/ }),
/* 74 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DeferredPromise: () => (/* binding */ DeferredPromise)
/* harmony export */ });
/**
 * Similar to a promise, but allows the ability to resolve/reject in a different context
 * */
class DeferredPromise {
    constructor() {
        this.promise_ = new Promise((resolve, reject) => {
            this.resolve_ = resolve;
            this.reject_ = reject;
        });
    }
    resolve(value) {
        this.resolve_(value);
    }
    reject(reason) {
        this.reject_(reason);
    }
    promise() {
        return this.promise_;
    }
}


/***/ }),
/* 75 */,
/* 76 */,
/* 77 */,
/* 78 */,
/* 79 */,
/* 80 */,
/* 81 */,
/* 82 */,
/* 83 */,
/* 84 */,
/* 85 */,
/* 86 */,
/* 87 */,
/* 88 */,
/* 89 */,
/* 90 */,
/* 91 */,
/* 92 */,
/* 93 */,
/* 94 */,
/* 95 */,
/* 96 */,
/* 97 */,
/* 98 */,
/* 99 */,
/* 100 */,
/* 101 */,
/* 102 */,
/* 103 */,
/* 104 */,
/* 105 */,
/* 106 */,
/* 107 */,
/* 108 */,
/* 109 */,
/* 110 */,
/* 111 */,
/* 112 */,
/* 113 */,
/* 114 */,
/* 115 */,
/* 116 */,
/* 117 */,
/* 118 */,
/* 119 */,
/* 120 */,
/* 121 */,
/* 122 */,
/* 123 */,
/* 124 */,
/* 125 */,
/* 126 */,
/* 127 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Observe: () => (/* binding */ Observe)
/* harmony export */ });
function Observe(computeObject, cb, pollRateMs = 50) {
    let prev = computeObject();
    setInterval(() => {
        const now = computeObject();
        if (prev !== now) {
            cb();
        }
        prev = now;
    }, pollRateMs);
}


/***/ }),
/* 128 */,
/* 129 */,
/* 130 */,
/* 131 */,
/* 132 */,
/* 133 */,
/* 134 */,
/* 135 */,
/* 136 */,
/* 137 */,
/* 138 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* unused harmony export CommentWarning */
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);
/* harmony import */ var _injectors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(20);
/* harmony import */ var _custom__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(32);
/* harmony import */ var _common_ui_steam_button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(36);
/* harmony import */ var lit_decorators_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(21);
/* harmony import */ var _utils_observers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(127);
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};






let CommentWarning = class CommentWarning extends _custom__WEBPACK_IMPORTED_MODULE_2__.FloatElement {
    constructor() {
        super(...arguments);
        this.show = false;
    }
    getRawCommentBoxText() {
        const elems = document.getElementsByClassName('commentthread_textarea');
        if (elems.length === 0) {
            return '';
        }
        const elem = elems[0];
        return elem.value || '';
    }
    async connectedCallback() {
        super.connectedCallback();
        (0,_utils_observers__WEBPACK_IMPORTED_MODULE_5__.Observe)(() => {
            return this.getRawCommentBoxText();
        }, () => {
            this.refreshWarningApplicable();
        });
    }
    refreshWarningApplicable() {
        const text = this.getRawCommentBoxText();
        const words = new Set(text.toLowerCase().split(' '));
        const hasTriggerWord = ['buy', 'sell', 'bought', 'sold', 'csfloat', 'float'].some((e) => words.has(e));
        this.show = hasTriggerWord;
    }
    render() {
        if (!this.show) {
            return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html) ``;
        }
        return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html) `<div class="container">
            <b>WARNING:</b> Commenting on profiles with words relating to buying and selling CS2 items
            <b>WILL</b> result in a Steam community ban!
        </div>`;
    }
};
CommentWarning.styles = [
    ..._custom__WEBPACK_IMPORTED_MODULE_2__.FloatElement.styles,
    (0,lit__WEBPACK_IMPORTED_MODULE_0__.css) `
            .container {
                background-color: rgba(235, 87, 87, 0.05);
                color: #de6667;
                border-radius: 6px;
                padding: 8px;
                margin: 5px;
                font-size: 14px;
            }
        `,
];
__decorate([
    (0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_4__.state)()
], CommentWarning.prototype, "show", void 0);
CommentWarning = __decorate([
    (0,_injectors__WEBPACK_IMPORTED_MODULE_1__.CustomElement)(),
    (0,_injectors__WEBPACK_IMPORTED_MODULE_1__.InjectAfter)('.commentthread_area .commentthread_header', _injectors__WEBPACK_IMPORTED_MODULE_1__.InjectionMode.ONCE)
], CommentWarning);



/***/ }),
/* 139 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* unused harmony export ReversalStatus */
/* harmony import */ var _injectors__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(20);
/* harmony import */ var _custom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(32);
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(14);
/* harmony import */ var lit_decorators_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(21);
/* harmony import */ var _services_reversal_fetcher__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(140);
/* harmony import */ var _utils_checkers__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(142);
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};






let ReversalStatus = class ReversalStatus extends _custom__WEBPACK_IMPORTED_MODULE_1__.FloatElement {
    constructor() {
        super(...arguments);
        this.reversalStatus = undefined;
    }
    get show() {
        var _a;
        return !!((_a = this.reversalStatus) === null || _a === void 0 ? void 0 : _a.has_reversed);
    }
    get daysSinceLastReversal() {
        var _a;
        if (!((_a = this.reversalStatus) === null || _a === void 0 ? void 0 : _a.last_reversal_timestamp)) {
            return null;
        }
        const now = Date.now();
        const timeSince = now - this.reversalStatus.last_reversal_timestamp;
        return Math.floor(timeSince / (24 * 60 * 60 * 1000));
    }
    getSteamId() {
        if ((0,_utils_checkers__WEBPACK_IMPORTED_MODULE_5__.defined)(typeof g_rgProfileData) && g_rgProfileData) {
            return g_rgProfileData.steamid;
        }
        const match = window.location.pathname.match(/^\/profiles\/(\d+)/);
        if (match) {
            return match[1];
        }
    }
    async connectedCallback() {
        super.connectedCallback();
        try {
            const steamId = this.getSteamId();
            if (!steamId) {
                console.error('failed to get steam id');
                return;
            }
            this.reversalStatus = await _services_reversal_fetcher__WEBPACK_IMPORTED_MODULE_4__.gReversalFetcher.fetch({ steam_id64: steamId });
        }
        catch (e) {
            console.error('failed to fetch reversal status', e);
        }
    }
    render() {
        var _a;
        if (!this.show) {
            return (0,lit__WEBPACK_IMPORTED_MODULE_2__.html) ``;
        }
        const daysSince = (_a = this.daysSinceLastReversal) !== null && _a !== void 0 ? _a : 0;
        const message = `${daysSince} day(s) since last trade reversal`;
        return (0,lit__WEBPACK_IMPORTED_MODULE_2__.html) `
            <div class="container">
                <div class="warning">
                    ${message}
                    <span class="info-link-container">
                        |
                        <a
                            class="info-link"
                            href="https://help.steampowered.com/en/faqs/view/365F-4BEE-2AE2-7BDD"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Info
                        </a>
                    </span>
                    <span class="powered-by-container"
                        >(powered by <a class="powered-by-link" href="https://reverse.watch">reverse.watch</a>)</span
                    >
                </div>
            </div>
        `;
    }
};
ReversalStatus.styles = [
    ..._custom__WEBPACK_IMPORTED_MODULE_1__.FloatElement.styles,
    (0,lit__WEBPACK_IMPORTED_MODULE_2__.css) `
            .container {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #de6667;
                margin-bottom: 10px;

                .warning {
                    display: inline;

                    .info-link-container {
                        color: #828282;

                        .info-link {
                            text-decoration: none;
                            color: #ebebeb;

                            &:hover {
                                color: #66c0f4;
                            }
                        }
                    }

                    .powered-by-container {
                        font-size: 12px;
                        color: #828282;

                        .powered-by-link {
                            text-decoration: none;
                            color: #ebebeb;

                            &:hover {
                                color: #66c0f4;
                            }
                        }
                    }
                }
            }
        `,
];
__decorate([
    (0,lit_decorators_js__WEBPACK_IMPORTED_MODULE_3__.state)()
], ReversalStatus.prototype, "reversalStatus", void 0);
ReversalStatus = __decorate([
    (0,_injectors__WEBPACK_IMPORTED_MODULE_0__.CustomElement)(),
    (0,_injectors__WEBPACK_IMPORTED_MODULE_0__.InjectAfter)('.profile_in_game.persona + .profile_ban_status, .profile_in_game.persona:not(:has(+ .profile_ban_status))', _injectors__WEBPACK_IMPORTED_MODULE_0__.InjectionMode.ONCE)
], ReversalStatus);



/***/ }),
/* 140 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   gReversalFetcher: () => (/* binding */ gReversalFetcher)
/* harmony export */ });
/* harmony import */ var _bridge_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _bridge_handlers_fetch_reversal_status__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(141);
/* harmony import */ var _utils_queue__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(72);



class ReversalFetcher extends _utils_queue__WEBPACK_IMPORTED_MODULE_2__.TTLCachedQueue {
    constructor(maxConcurrency, ttlMs) {
        super(maxConcurrency, ttlMs);
    }
    fetch(req) {
        return this.add(new _utils_queue__WEBPACK_IMPORTED_MODULE_2__.GenericJob(req));
    }
    async process(req) {
        try {
            return await (0,_bridge_client__WEBPACK_IMPORTED_MODULE_0__.ClientSend)(_bridge_handlers_fetch_reversal_status__WEBPACK_IMPORTED_MODULE_1__.FetchReversalStatus, req);
        }
        catch (e) {
            console.error('failed to fetch reversal status', e);
            // Stub out to prevent future calls
            return {
                steam_id: '',
                has_reversed: false,
                last_reversal_timestamp: undefined,
            };
        }
    }
}
const gReversalFetcher = new ReversalFetcher(1, 30 * 60 * 1000 /* 30 minutes */);


/***/ }),
/* 141 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FetchReversalStatus: () => (/* binding */ FetchReversalStatus)
/* harmony export */ });
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3);
/* harmony import */ var _main__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var _environment__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(39);



const FetchReversalStatus = new _main__WEBPACK_IMPORTED_MODULE_1__.SimpleHandler(_types__WEBPACK_IMPORTED_MODULE_0__.RequestType.FETCH_REVERSAL_STATUS, async (req) => {
    var _a;
    const resp = await fetch(`${_environment__WEBPACK_IMPORTED_MODULE_2__.environment.reverse_watch_base_api_url}/v1/users/${req.steam_id64}`);
    const data = (await resp.json());
    if (!resp.ok) {
        throw Error((_a = data.message) !== null && _a !== void 0 ? _a : 'unknown error');
    }
    return data;
});


/***/ }),
/* 142 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   defined: () => (/* binding */ defined)
/* harmony export */ });
/* unused harmony export isCAppwideInventory */
function defined(t) {
    return t !== 'undefined';
}
function isCAppwideInventory(inventory) {
    return 'm_rgChildInventories' in inventory;
}


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
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(0);
/* harmony import */ var _components_profile_comment_warning__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(138);
/* harmony import */ var _components_profile_reversal_status__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(139);



(0,_utils__WEBPACK_IMPORTED_MODULE_0__.init)('src/lib/page_scripts/profile.js', main);
async function main() { }

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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VyxDQUFDO0FBQzdCLENBQUM7QUFFTSxTQUFTLG1CQUFtQixDQUFDLFNBQXlDO0lBQ3pFLE9BQU8sc0JBQXNCLElBQUksU0FBUyxDQUFDO0FBQy9DLENBQUM7Ozs7OztVQ1JEO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7Ozs7Ozs7QUNBNkI7QUFDa0I7QUFDQTtBQUUvQyw0Q0FBSSxDQUFDLGlDQUFpQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRTlDLEtBQUssVUFBVSxJQUFJLEtBQUksQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL3NyYy9saWIvcGFnZV9zY3JpcHRzL3V0aWxzLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL2hhbmRsZXJzL2V4ZWN1dGVfc2NyaXB0LnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL2hhbmRsZXJzL21haW4udHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9icmlkZ2UvaGFuZGxlcnMvdHlwZXMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9icmlkZ2Uvd3JhcHBlcnMvcHJpdmlsZWdlZC50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2JyaWRnZS9jbGllbnQudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9icmlkZ2UvdHlwZXMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi91dGlscy9kZXRlY3QudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi91dGlscy9zbmlwcy50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2J1cy9wb3N0X21lc3NhZ2VfYnVzLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL2hhbmRsZXJzL2V4ZWN1dGVfY3NzLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL2hhbmRsZXJzL2ZldGNoX2V4dGVuc2lvbl9maWxlLnRzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9saXQvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL0BsaXQvcmVhY3RpdmUtZWxlbWVudC9yZWFjdGl2ZS1lbGVtZW50LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9AbGl0L3JlYWN0aXZlLWVsZW1lbnQvY3NzLXRhZy5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbGl0LWh0bWwvbGl0LWh0bWwuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xpdC1lbGVtZW50L2xpdC1lbGVtZW50LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9saXQtaHRtbC9pcy1zZXJ2ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9jb21wb25lbnRzL2luamVjdG9ycy50cyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvbGl0L2RlY29yYXRvcnMuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL0BsaXQvcmVhY3RpdmUtZWxlbWVudC9kZWNvcmF0b3JzL2N1c3RvbS1lbGVtZW50LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9AbGl0L3JlYWN0aXZlLWVsZW1lbnQvZGVjb3JhdG9ycy9wcm9wZXJ0eS5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvQGxpdC9yZWFjdGl2ZS1lbGVtZW50L2RlY29yYXRvcnMvc3RhdGUuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL0BsaXQvcmVhY3RpdmUtZWxlbWVudC9kZWNvcmF0b3JzL2V2ZW50LW9wdGlvbnMuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL0BsaXQvcmVhY3RpdmUtZWxlbWVudC9kZWNvcmF0b3JzL3F1ZXJ5LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9AbGl0L3JlYWN0aXZlLWVsZW1lbnQvZGVjb3JhdG9ycy9iYXNlLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9AbGl0L3JlYWN0aXZlLWVsZW1lbnQvZGVjb3JhdG9ycy9xdWVyeS1hbGwuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL0BsaXQvcmVhY3RpdmUtZWxlbWVudC9kZWNvcmF0b3JzL3F1ZXJ5LWFzeW5jLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9AbGl0L3JlYWN0aXZlLWVsZW1lbnQvZGVjb3JhdG9ycy9xdWVyeS1hc3NpZ25lZC1lbGVtZW50cy5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvQGxpdC9yZWFjdGl2ZS1lbGVtZW50L2RlY29yYXRvcnMvcXVlcnktYXNzaWduZWQtbm9kZXMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9jb21wb25lbnRzL2N1c3RvbS50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2NvbXBvbmVudHMvY29tbW9uL3VpL3Rvb2x0aXAudHMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xpdC1odG1sL2RpcmVjdGl2ZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdGhpcmRwYXJ0eS9oaW50Y3NzL2hpbnRjc3MudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9jb21wb25lbnRzL2NvbW1vbi91aS9zdGVhbS1idXR0b24udHMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2xpdC1odG1sL2RpcmVjdGl2ZXMvY2xhc3MtbWFwLmpzIiwid2VicGFjazovLy8uL3NyYy9lbnZpcm9ubWVudC50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL3V0aWxzL3F1ZXVlLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvdXRpbHMvY2FjaGUudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi91dGlscy9kZWZlcnJlZF9wcm9taXNlLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvdXRpbHMvb2JzZXJ2ZXJzLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvY29tcG9uZW50cy9wcm9maWxlL2NvbW1lbnRfd2FybmluZy50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL2NvbXBvbmVudHMvcHJvZmlsZS9yZXZlcnNhbF9zdGF0dXMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xpYi9zZXJ2aWNlcy9yZXZlcnNhbF9mZXRjaGVyLnRzIiwid2VicGFjazovLy8uL3NyYy9saWIvYnJpZGdlL2hhbmRsZXJzL2ZldGNoX3JldmVyc2FsX3N0YXR1cy50cyIsIndlYnBhY2s6Ly8vLi9zcmMvbGliL3V0aWxzL2NoZWNrZXJzLnRzIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly8vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovLy93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovLy8uL3NyYy9saWIvcGFnZV9zY3JpcHRzL3Byb2ZpbGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtFeGVjdXRlU2NyaXB0T25QYWdlfSBmcm9tICcuLi9icmlkZ2UvaGFuZGxlcnMvZXhlY3V0ZV9zY3JpcHQnO1xuaW1wb3J0IHtDbGllbnRTZW5kfSBmcm9tICcuLi9icmlkZ2UvY2xpZW50JztcbmltcG9ydCB7aW5QYWdlQ29udGV4dH0gZnJvbSAnLi4vdXRpbHMvc25pcHMnO1xuaW1wb3J0IHtFeGVjdXRlQ3NzT25QYWdlfSBmcm9tICcuLi9icmlkZ2UvaGFuZGxlcnMvZXhlY3V0ZV9jc3MnO1xuaW1wb3J0IHtGZXRjaEV4dGVuc2lvbkZpbGV9IGZyb20gJy4uL2JyaWRnZS9oYW5kbGVycy9mZXRjaF9leHRlbnNpb25fZmlsZSc7XG5pbXBvcnQge2lzRmlyZWZveH0gZnJvbSAnLi4vdXRpbHMvZGV0ZWN0JztcbmltcG9ydCB7Z19Qb3N0TWVzc2FnZUJ1c30gZnJvbSAnLi4vYnVzL3Bvc3RfbWVzc2FnZV9idXMnO1xuXG5hc3luYyBmdW5jdGlvbiBpbml0aWF0ZUNocm9taXVtKHNjcmlwdFBhdGg6IHN0cmluZykge1xuICAgIENsaWVudFNlbmQoRXhlY3V0ZUNzc09uUGFnZSwge1xuICAgICAgICBwYXRoOiAnc3JjL2dsb2JhbC5jc3MnLFxuICAgIH0pO1xuXG4gICAgQ2xpZW50U2VuZChFeGVjdXRlU2NyaXB0T25QYWdlLCB7XG4gICAgICAgIHBhdGg6IHNjcmlwdFBhdGgsXG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRpYXRlRmlyZWZveChzY3JpcHRQYXRoOiBzdHJpbmcpIHtcbiAgICBnX1Bvc3RNZXNzYWdlQnVzLmhhbmRsZVJlcXVlc3RzKCk7XG5cbiAgICAvLyBXaHkgZG8gd2UgbmVlZCB0byB1c2UgbWFudWFsIERPTSBzY3JpcHQgaW5qZWN0aW9uIGFuZFxuICAgIC8vIGZldGNoIHRoZSB0ZXh0IG9mIHRoZSBzY3JpcHQ/XG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jc2Zsb2F0L2V4dGVuc2lvbi9pc3N1ZXMvMTU1I2lzc3VlY29tbWVudC0xNjM5NzgxOTE0XG5cbiAgICAvLyBXZSB3YW50IHRvIGluamVjdCB0aGUgSUQgb2YgdGhlIGV4dGVuc2lvblxuICAgIGNvbnN0IGlkID0gYnJvd3Nlci5ydW50aW1lLmlkO1xuICAgIGNvbnN0IGVudHJ5U2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgZW50cnlTY3JpcHQuYXBwZW5kQ2hpbGQoXG4gICAgICAgIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGBcbiAgICAgICAgd2luZG93LkNTRkxPQVRfRVhURU5TSU9OX0lEID0gJyR7aWR9JztcbiAgICBgKVxuICAgICk7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChlbnRyeVNjcmlwdCk7XG5cbiAgICBjb25zdCBzY3JpcHRSZXNwID0gYXdhaXQgQ2xpZW50U2VuZChGZXRjaEV4dGVuc2lvbkZpbGUsIHtcbiAgICAgICAgcGF0aDogc2NyaXB0UGF0aCxcbiAgICB9KTtcblxuICAgIGNvbnN0IHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgIHNjcmlwdC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShzY3JpcHRSZXNwLnRleHQpKTtcbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cbiAgICBjb25zdCBzdHlsZVJlc3AgPSBhd2FpdCBDbGllbnRTZW5kKEZldGNoRXh0ZW5zaW9uRmlsZSwge1xuICAgICAgICBwYXRoOiAnc3JjL2dsb2JhbC5jc3MnLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIHN0eWxlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHN0eWxlUmVzcC50ZXh0KSk7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG59XG4vKipcbiAqIEluaXRpYWxpemVzIGEgcGFnZSBzY3JpcHQsIGV4ZWN1dGluZyBpdCBpbiB0aGUgcGFnZSBjb250ZXh0IGlmIG5lY2Vzc2FyeVxuICpcbiAqIEBwYXJhbSBzY3JpcHRQYXRoIFJlbGF0aXZlIHBhdGggb2YgdGhlIHNjcmlwdCAoYWx3YXlzIGluIC5qcylcbiAqIEBwYXJhbSBpZlBhZ2UgRm4gdG8gcnVuIGlmIHdlIGFyZSBpbiB0aGUgcGFnZSdzIGV4ZWN1dGlvbiBjb250ZXh0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbml0KHNjcmlwdFBhdGg6IHN0cmluZywgaWZQYWdlOiAoKSA9PiBhbnkpIHtcbiAgICAvLyBEb24ndCBhbGxvdyB0aGUgcGFnZSBzY3JpcHQgdG8gcnVuIHRoaXMuXG4gICAgaWYgKGluUGFnZUNvbnRleHQoKSkge1xuICAgICAgICAvLyBAdHMtaWdub3JlIFNldCBnbG9iYWwgaWRlbnRpZmllciBmb3Igb3RoZXIgZXh0ZW5zaW9ucyB0byB1c2VcbiAgICAgICAgd2luZG93LmNzZmxvYXQgPSB0cnVlO1xuICAgICAgICAvLyBAdHMtaWdub3JlIERlcHJlY2F0ZWQgbmFtZVxuICAgICAgICB3aW5kb3cuY3Nnb2Zsb2F0ID0gdHJ1ZTtcblxuICAgICAgICBpZlBhZ2UoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChpc0ZpcmVmb3goKSkge1xuICAgICAgICBhd2FpdCBpbml0aWF0ZUZpcmVmb3goc2NyaXB0UGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYXdhaXQgaW5pdGlhdGVDaHJvbWl1bShzY3JpcHRQYXRoKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYCVjIENTRmxvYXQgTWFya2V0IENoZWNrZXIgKHYke2Nocm9tZS5ydW50aW1lLmdldE1hbmlmZXN0KCkudmVyc2lvbn0pIGJ5IFN0ZXA3NzUwIGAsXG4gICAgICAgICdiYWNrZ3JvdW5kOiAjMDA0NTk0OyBjb2xvcjogI2ZmZjsnXG4gICAgKTtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgJyVjIENoYW5nZWxvZyBjYW4gYmUgZm91bmQgaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL2NzZmxvYXQvZXh0ZW5zaW9uICcsXG4gICAgICAgICdiYWNrZ3JvdW5kOiAjMDA0NTk0OyBjb2xvcjogI2ZmZjsnXG4gICAgKTtcbn1cbiIsImltcG9ydCB7RW1wdHlSZXNwb25zZUhhbmRsZXJ9IGZyb20gJy4vbWFpbic7XG5pbXBvcnQge1JlcXVlc3RUeXBlfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7UHJpdmlsZWdlZEhhbmRsZXJ9IGZyb20gJy4uL3dyYXBwZXJzL3ByaXZpbGVnZWQnO1xuXG5pbnRlcmZhY2UgRXhlY3V0ZVNjcmlwdFJlcXVlc3Qge1xuICAgIHBhdGg6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IEV4ZWN1dGVTY3JpcHRPblBhZ2UgPSBuZXcgUHJpdmlsZWdlZEhhbmRsZXIoXG4gICAgbmV3IEVtcHR5UmVzcG9uc2VIYW5kbGVyPEV4ZWN1dGVTY3JpcHRSZXF1ZXN0PihSZXF1ZXN0VHlwZS5FWEVDVVRFX1NDUklQVF9PTl9QQUdFLCBhc3luYyAocmVxLCBzZW5kZXIpID0+IHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBpbmplY3QgdGhlIGV4dGVuc2lvbiBJRCBkeW5hbWljYWxseSBzbyB0aGUgY2xpZW50IGtub3dzIHdobyB0b1xuICAgICAgICAvLyBjb21tdW5pY2F0ZSB3aXRoLlxuICAgICAgICAvL1xuICAgICAgICAvLyBPbiBGaXJlZm94LCBleHRlbnNpb24gSURzIGFyZSByYW5kb20sIHNvIHRoaXMgaXMgbmVjZXNzYXJ5LlxuICAgICAgICBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuICAgICAgICAgICAgdGFyZ2V0OiB7dGFiSWQ6IHNlbmRlci50YWI/LmlkIGFzIG51bWJlcn0sXG4gICAgICAgICAgICB3b3JsZDogJ01BSU4nLFxuICAgICAgICAgICAgYXJnczogW2Nocm9tZS5ydW50aW1lLmlkXSxcbiAgICAgICAgICAgIGZ1bmM6IGZ1bmN0aW9uIEV4dGVuc2lvbklkKGV4dGVuc2lvbklkKSB7XG4gICAgICAgICAgICAgICAgd2luZG93LkNTRkxPQVRfRVhURU5TSU9OX0lEID0gZXh0ZW5zaW9uSWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQoe1xuICAgICAgICAgICAgdGFyZ2V0OiB7dGFiSWQ6IHNlbmRlci50YWI/LmlkIGFzIG51bWJlcn0sXG4gICAgICAgICAgICBmaWxlczogW3JlcS5wYXRoXSxcbiAgICAgICAgICAgIHdvcmxkOiAnTUFJTicsXG4gICAgICAgIH0pO1xuICAgIH0pXG4pO1xuIiwiaW1wb3J0IHtSZXF1ZXN0SGFuZGxlcn0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IE1lc3NhZ2VTZW5kZXIgPSBjaHJvbWUucnVudGltZS5NZXNzYWdlU2VuZGVyO1xuaW1wb3J0IHtSZXF1ZXN0VHlwZX0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBjbGFzcyBTaW1wbGVIYW5kbGVyPFJlcSwgUmVzcD4gaW1wbGVtZW50cyBSZXF1ZXN0SGFuZGxlcjxSZXEsIFJlc3A+IHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSB0eXBlOiBSZXF1ZXN0VHlwZSxcbiAgICAgICAgcHJpdmF0ZSBoYW5kbGVyOiAocmVxdWVzdDogUmVxLCBzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpID0+IFByb21pc2U8UmVzcD5cbiAgICApIHt9XG5cbiAgICBnZXRUeXBlKCk6IFJlcXVlc3RUeXBlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZTtcbiAgICB9XG5cbiAgICBoYW5kbGVSZXF1ZXN0KHJlcXVlc3Q6IFJlcSwgc2VuZGVyOiBNZXNzYWdlU2VuZGVyKTogUHJvbWlzZTxSZXNwPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZXIocmVxdWVzdCwgc2VuZGVyKTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW1wdHkge31cblxuZXhwb3J0IGNsYXNzIEVtcHR5UmVxdWVzdEhhbmRsZXI8UmVzcD4gaW1wbGVtZW50cyBSZXF1ZXN0SGFuZGxlcjxFbXB0eSwgUmVzcD4ge1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwcml2YXRlIHR5cGU6IFJlcXVlc3RUeXBlLFxuICAgICAgICBwcml2YXRlIGhhbmRsZXI6IChzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpID0+IFByb21pc2U8UmVzcD5cbiAgICApIHt9XG5cbiAgICBnZXRUeXBlKCk6IFJlcXVlc3RUeXBlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZTtcbiAgICB9XG5cbiAgICBoYW5kbGVSZXF1ZXN0KHJlcXVlc3Q6IEVtcHR5LCBzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpOiBQcm9taXNlPFJlc3A+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGFuZGxlcihzZW5kZXIpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVtcHR5UmVzcG9uc2VIYW5kbGVyPFJlcT4gaW1wbGVtZW50cyBSZXF1ZXN0SGFuZGxlcjxSZXEsIHZvaWQ+IHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSB0eXBlOiBSZXF1ZXN0VHlwZSxcbiAgICAgICAgcHJpdmF0ZSBoYW5kbGVyOiAocmVxdWVzdDogUmVxLCBzZW5kZXI6IE1lc3NhZ2VTZW5kZXIpID0+IFByb21pc2U8dm9pZD5cbiAgICApIHt9XG5cbiAgICBnZXRUeXBlKCk6IFJlcXVlc3RUeXBlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZTtcbiAgICB9XG5cbiAgICBoYW5kbGVSZXF1ZXN0KHJlcXVlc3Q6IFJlcSwgc2VuZGVyOiBNZXNzYWdlU2VuZGVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZXIocmVxdWVzdCwgc2VuZGVyKTtcbiAgICB9XG59XG4iLCJleHBvcnQgZW51bSBSZXF1ZXN0VHlwZSB7XG4gICAgRVhFQ1VURV9TQ1JJUFRfT05fUEFHRSA9IDAsXG4gICAgRVhFQ1VURV9DU1NfT05fUEFHRSA9IDEsXG4gICAgRkVUQ0hfSU5TUEVDVF9JTkZPID0gMixcbiAgICBGRVRDSF9TVEFMTCA9IDMsXG4gICAgU1RPUkFHRV9HRVQgPSA0LFxuICAgIFNUT1JBR0VfU0VUID0gNSxcbiAgICBTVE9SQUdFX1JFTU9WRSA9IDYsXG4gICAgRkVUQ0hfUEVORElOR19UUkFERVMgPSA3LFxuICAgIEZFVENIX0VYVEVOU0lPTl9GSUxFID0gOCxcbiAgICBBTk5PVEFURV9PRkZFUiA9IDksXG4gICAgRVhURU5TSU9OX1ZFUlNJT04gPSAxMCxcbiAgICBUUkFERV9ISVNUT1JZX1NUQVRVUyA9IDExLFxuICAgIFRSQURFX09GRkVSX1NUQVRVUyA9IDEyLFxuICAgIEhBU19QRVJNSVNTSU9OUyA9IDEzLFxuICAgIFBJTkdfU0VUVVBfRVhURU5TSU9OID0gMTQsXG4gICAgUElOR19FWFRFTlNJT05fU1RBVFVTID0gMTUsXG4gICAgUElOR19DQU5DRUxfVFJBREUgPSAxNixcbiAgICBDUkVBVEVfVFJBREVfT0ZGRVIgPSAxNyxcbiAgICBGRVRDSF9TVEVBTV9VU0VSID0gMTgsXG4gICAgUElOR19UUkFERV9TVEFUVVMgPSAxOSxcbiAgICBQSU5HX1NUQVRVUyA9IDIwLFxuICAgIEZFVENIX09XTl9JTlZFTlRPUlkgPSAyMSxcbiAgICBDQU5DRUxfVFJBREVfT0ZGRVIgPSAyMixcbiAgICBGRVRDSF9TVEVBTV9UUkFERVMgPSAyMyxcbiAgICBGRVRDSF9CTE9DS0VEX1VTRVJTID0gMjQsXG4gICAgUElOR19CTE9DS0VEX1VTRVJTID0gMjUsXG4gICAgRkVUQ0hfQkxVRUdFTSA9IDI2LFxuICAgIExJU1RfSVRFTSA9IDI3LFxuICAgIEZFVENIX1JFQ09NTUVOREVEX1BSSUNFID0gMjgsXG4gICAgRkVUQ0hfQ1NGTE9BVF9NRSA9IDI5LFxuICAgIFBJTkdfUk9MTEJBQ0tfVFJBREUgPSAzMCxcbiAgICBGRVRDSF9UUkFERV9ISVNUT1JZID0gMzEsXG4gICAgRkVUQ0hfU0xJTV9UUkFERVMgPSAzMixcbiAgICBOT1RBUllfUFJPVkUgPSAzMyxcbiAgICBGRVRDSF9OT1RBUllfTUVUQSA9IDM0LFxuICAgIEZFVENIX05PVEFSWV9UT0tFTiA9IDM1LFxuICAgIEZFVENIX1NURUFNX1BPV0VSRURfSU5WRU5UT1JZID0gMzYsXG4gICAgRkVUQ0hfUkVWRVJTQUxfU1RBVFVTID0gMzcsXG4gICAgRkVUQ0hfSU5TUEVDVF9JTkZPX0JBVENIID0gMzgsXG59XG4iLCJpbXBvcnQge1JlcXVlc3RIYW5kbGVyfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQge1JlcXVlc3RUeXBlfSBmcm9tICcuLi9oYW5kbGVycy90eXBlcyc7XG5pbXBvcnQgTWVzc2FnZVNlbmRlciA9IGNocm9tZS5ydW50aW1lLk1lc3NhZ2VTZW5kZXI7XG5cbi8qKlxuICogUmVzdHJpY3RzIGEgZ2l2ZW4gaGFuZGxlciBzdWNoIHRoYXQgaXQgY2FuIG9ubHkgcnVuIGlmIHRoZSBzZW5kZXIgaXNcbiAqIHZlcmlmaWVkIHRvIGJlIGZyb20gdGhlIGV4dGVuc2lvbidzIG9yaWdpbiAoaWUuIGNvbnRlbnQgc2NyaXB0KVxuICovXG5leHBvcnQgY2xhc3MgUHJpdmlsZWdlZEhhbmRsZXI8UmVxLCBSZXNwPiBpbXBsZW1lbnRzIFJlcXVlc3RIYW5kbGVyPFJlcSwgUmVzcD4ge1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgaGFuZGxlcjogUmVxdWVzdEhhbmRsZXI8UmVxLCBSZXNwPikge31cblxuICAgIGdldFR5cGUoKTogUmVxdWVzdFR5cGUge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVyLmdldFR5cGUoKTtcbiAgICB9XG5cbiAgICBoYW5kbGVSZXF1ZXN0KHJlcXVlc3Q6IFJlcSwgc2VuZGVyOiBNZXNzYWdlU2VuZGVyKTogUHJvbWlzZTxSZXNwPiB7XG4gICAgICAgIGlmIChzZW5kZXIuaWQgIT09IGNocm9tZS5ydW50aW1lLmlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0F0dGVtcHQgdG8gYWNjZXNzIHJlc3RyaWN0ZWQgbWV0aG9kIG91dHNpZGUgb2Ygc2VjdXJlIGNvbnRleHQgKGllLiBjb250ZW50IHNjcmlwdCknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZXIuaGFuZGxlUmVxdWVzdChyZXF1ZXN0LCBzZW5kZXIpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7SW50ZXJuYWxSZXF1ZXN0QnVuZGxlLCBJbnRlcm5hbFJlc3BvbnNlQnVuZGxlLCBSZXF1ZXN0SGFuZGxlciwgVmVyc2lvbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge2lzRmlyZWZveCwgcnVudGltZU5hbWVzcGFjZX0gZnJvbSAnLi4vdXRpbHMvZGV0ZWN0JztcbmltcG9ydCB7aW5QYWdlQ29udGV4dH0gZnJvbSAnLi4vdXRpbHMvc25pcHMnO1xuaW1wb3J0IHtnX1Bvc3RNZXNzYWdlQnVzfSBmcm9tICcuLi9idXMvcG9zdF9tZXNzYWdlX2J1cyc7XG5cbmZ1bmN0aW9uIGNhblVzZVNlbmRNZXNzYWdlKCkge1xuICAgIC8vIE5vdCBzdXBwb3J0ZWQgaW4gRmlyZWZveCBQYWdlIENvbnRleHRcbiAgICByZXR1cm4gIShpc0ZpcmVmb3goKSAmJiBpblBhZ2VDb250ZXh0KCkpO1xufVxuXG4vKipcbiAqIFNlbmQgYSByZXF1ZXN0IHRvIGJlIGhhbmRsZWQgYnkgdGhlIGJhY2tncm91bmQgd29ya2VyXG4gKlxuICogQ2FuIGJlIGNhbGxlZCBmcm9tIGEgY29udGVudCBzY3JpcHQgb3IgcGFnZSBpdHNlbGZcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIENsaWVudFNlbmQ8UmVxLCBSZXNwPihoYW5kbGVyOiBSZXF1ZXN0SGFuZGxlcjxSZXEsIFJlc3A+LCBhcmdzOiBSZXEpOiBQcm9taXNlPFJlc3A+IHtcbiAgICBjb25zdCBidW5kbGU6IEludGVybmFsUmVxdWVzdEJ1bmRsZSA9IHtcbiAgICAgICAgdmVyc2lvbjogVmVyc2lvbi5WMSxcbiAgICAgICAgcmVxdWVzdF90eXBlOiBoYW5kbGVyLmdldFR5cGUoKSxcbiAgICAgICAgcmVxdWVzdDogYXJncyxcbiAgICAgICAgaWQ6IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDAwMDAwKSxcbiAgICB9O1xuXG4gICAgaWYgKGNhblVzZVNlbmRNZXNzYWdlKCkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgQmFkIHR5cGVzXG4gICAgICAgICAgICBydW50aW1lTmFtZXNwYWNlKCkucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgICAgICAgICAgICB3aW5kb3cuQ1NGTE9BVF9FWFRFTlNJT05fSUQgfHwgY2hyb21lLnJ1bnRpbWUuaWQsXG4gICAgICAgICAgICAgICAgYnVuZGxlLFxuICAgICAgICAgICAgICAgIChyZXNwOiBJbnRlcm5hbFJlc3BvbnNlQnVuZGxlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwPy5lcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlc3AuZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwPy5yZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWxsYmFjayB0byBwb3N0bWVzc2FnZSBidXMgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3QgaW1wbGVtZW50XG4gICAgICAgIC8vIHNwZWNzIGZ1bGx5XG4gICAgICAgIHJldHVybiBnX1Bvc3RNZXNzYWdlQnVzLnNlbmRSZXF1ZXN0KGJ1bmRsZSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IE1lc3NhZ2VTZW5kZXIgPSBjaHJvbWUucnVudGltZS5NZXNzYWdlU2VuZGVyO1xuaW1wb3J0IHtSZXF1ZXN0VHlwZX0gZnJvbSAnLi9oYW5kbGVycy90eXBlcyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVxdWVzdEhhbmRsZXI8UmVxLCBSZXNwPiB7XG4gICAgaGFuZGxlUmVxdWVzdChyZXF1ZXN0OiBSZXEsIHNlbmRlcjogTWVzc2FnZVNlbmRlcik6IFByb21pc2U8UmVzcD47XG4gICAgZ2V0VHlwZSgpOiBSZXF1ZXN0VHlwZTtcbn1cblxuZXhwb3J0IGVudW0gVmVyc2lvbiB7XG4gICAgVjEgPSAnQ1NGTE9BVF9WMScsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxSZXF1ZXN0QnVuZGxlIHtcbiAgICB2ZXJzaW9uOiBzdHJpbmc7XG5cbiAgICByZXF1ZXN0X3R5cGU6IFJlcXVlc3RUeXBlO1xuXG4gICAgLy8gSW5wdXQgcmVxdWVzdFxuICAgIHJlcXVlc3Q6IGFueTtcblxuICAgIC8vIFJhbmRvbSBJRCB0byBpZGVudGlmeSB0aGUgcmVxdWVzdFxuICAgIGlkOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxSZXNwb25zZUJ1bmRsZSB7XG4gICAgcmVxdWVzdF90eXBlOiBSZXF1ZXN0VHlwZTtcblxuICAgIC8vIFJlc3BvbnNlXG4gICAgcmVzcG9uc2U6IGFueTtcblxuICAgIGVycm9yOiBzdHJpbmc7XG5cbiAgICAvLyBSYW5kb20gSUQgdG8gaWRlbnRpZnkgdGhlIHJlcXVlc3RcbiAgICBpZDogbnVtYmVyO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGlzRmlyZWZveCgpIHtcbiAgICByZXR1cm4gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA+IC0xO1xufVxuXG4vKipcbiAqIFRoYW5rcyB0byBvdXIgYnJvd3NlciBvdmVybG9yZHMsIHdlIGhhdmUgdHdvIG5hbWVzcGFjZXMgZm9yIGB4LnJ1bnRpbWUuZm4oKWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJ1bnRpbWVOYW1lc3BhY2UoKSB7XG4gICAgaWYgKGlzRmlyZWZveCgpKSB7XG4gICAgICAgIHJldHVybiBicm93c2VyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjaHJvbWU7XG4gICAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGluUGFnZUNvbnRleHQoKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBjaHJvbWUgPT09ICd1bmRlZmluZWQnIHx8ICFjaHJvbWUuZXh0ZW5zaW9uO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2FpdChtczogbnVtYmVyKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG59XG4iLCJpbXBvcnQge0ludGVybmFsUmVxdWVzdEJ1bmRsZSwgSW50ZXJuYWxSZXNwb25zZUJ1bmRsZSwgVmVyc2lvbn0gZnJvbSAnLi4vYnJpZGdlL3R5cGVzJztcbmltcG9ydCB7cnVudGltZU5hbWVzcGFjZX0gZnJvbSAnLi4vdXRpbHMvZGV0ZWN0JztcblxuLyoqXG4gKiBNZXNzYWdlIGJ1cyB0aGF0IHVzZXMgYHBvc3RNZXNzYWdlYCBpbiBvcmRlciB0byBjb21tdW5pY2F0ZSB3aXRoIHRoZSBiYWNrZ3JvdW5kXG4gKiBzZXJ2aWNlIHdvcmtlci9zY3JpcHQuXG4gKlxuICogV2h5PyBCZWNhdXNlIHRoZSBjbGllbnQgcGFnZSAoaWUuIFN0ZWFtIHBhZ2UpIG9uIEZpcmVmb3ggaXMgbm90IGNhcGFibGUgb2ZcbiAqIHNlbmRpbmcgYSBtZXNzYWdlIGRpcmVjdGx5IHRvIHRoZSBleHRlbnNpb24gYmFja2dyb3VuZC5cbiAqXG4gKiBTbyBpdCByZXF1aXJlcyB1cyB0byBkbyB0aGUgZm9sbG93aW5nIGRhbmNlOlxuICogcGFnZSA8LS0ocG9zdG1lc3NhZ2UpLS0+IGNvbnRlbnQgc2NyaXB0IDwtLShzZW5kbWVzc2FnZSktLT4gYmFja2dyb3VuZCBzY3JpcHRcbiAqXG4gKiBUaGlzIGRhbmNlIGlzIGFic3RyYWN0ZWQgaW4gYENsaWVudFNlbmRgLCBhbmQgb25seSB1c2VzIHRoaXMgYnVzIGlmXG4gKiBgc2VuZG1lc3NhZ2VgIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhlIHBhZ2UuXG4gKi9cbmNsYXNzIFBvc3RNZXNzYWdlQnVzIHtcbiAgICAvKipcbiAgICAgKiBGb3IgdGhlIHJlcXVlc3RlciAoaWUuIHBhZ2UpLCB0byB3YWl0IHVudGlsIGl0IGdldHMgYSByZXNwb25zZVxuICAgICAqIGZyb20gdGhlIGNvbnRlbnQgc2NyaXB0IHZpYS4gcG9zdE1lc3NhZ2UgZm9yIHRoZSBnaXZlbiByZXF1ZXN0IElEXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWQgUmVxdWVzdCBJRFxuICAgICAqL1xuICAgIHdhaXRVbnRpbFJlc3BvbnNlRm9yKGlkOiBudW1iZXIpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IChlOiBNZXNzYWdlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNwID0gZS5kYXRhIGFzIEludGVybmFsUmVzcG9uc2VCdW5kbGU7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3AuaWQgIT09IGlkIHx8ICFyZXNwLnJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IGxlYWtzXG4gICAgICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBoYW5kbGVyLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzcD8ucmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwLnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QocmVzcD8uZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgaGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgcmVxdWVzdCB0byBiZSBkb25lIHRocm91Z2ggdGhlIGJ1cywgcmV0dXJucyB0aGUgYXBwcm9wcmlhdGVcbiAgICAgKiByZXNwb25zZSBmb3IgdGhlIGlucHV0IGJ1bmRsZSBoYW5kbGVyXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnVuZGxlIFJlcXVlc3QgQnVuZGxlXG4gICAgICovXG4gICAgc2VuZFJlcXVlc3QoYnVuZGxlOiBJbnRlcm5hbFJlcXVlc3RCdW5kbGUpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoYnVuZGxlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy53YWl0VW50aWxSZXNwb25zZUZvcihidW5kbGUuaWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcXVlc3QgaGFuZGxlciAoY29udGVudCBzY3JpcHQpIGZvciBuZXcgcmVxdWVzdHMgZnJvbSB0aGUgcGFnZS5cbiAgICAgKlxuICAgICAqIEVhY2ggcmVxdWVzdCBpcyBlZmZlY3RpdmVseSBcInByb3hpZWRcIiB0byB0aGUgYmFja2dyb3VuZCBzY3JpcHQvd29ya2VyXG4gICAgICogdG8gYWN0dWFsbHkgZXhlY3V0ZSBpdCdzIGhhbmRsZXIuXG4gICAgICovXG4gICAgaGFuZGxlUmVxdWVzdHMoKSB7XG4gICAgICAgIGNvbnN0IGggPSAoZTogTWVzc2FnZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoZS5kYXRhLnZlcnNpb24gIT09IFZlcnNpb24uVjEgfHwgIWUuZGF0YS5yZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgLy8gSWdub3JlIG1lc3NhZ2VzIHRoYXQgYXJlbid0IGZvciB0aGlzIGJyaWRnZVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2VuZCB0byB0aGUgYmFja2dyb3VuZCBzY3JpcHRcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmUgQmFkIHR5cGVzXG4gICAgICAgICAgICBydW50aW1lTmFtZXNwYWNlKCkucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgICAgICAgICAgICBjaHJvbWUucnVudGltZS5pZCxcbiAgICAgICAgICAgICAgICBlLmRhdGEsXG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZSBCYWQgdHlwZXNcbiAgICAgICAgICAgICAgICAocmVzcDogSW50ZXJuYWxSZXNwb25zZUJ1bmRsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UocmVzcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfTtcblxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGdfUG9zdE1lc3NhZ2VCdXMgPSBuZXcgUG9zdE1lc3NhZ2VCdXMoKTtcbiIsImltcG9ydCB7RW1wdHlSZXNwb25zZUhhbmRsZXJ9IGZyb20gJy4vbWFpbic7XG5pbXBvcnQge1JlcXVlc3RUeXBlfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7UHJpdmlsZWdlZEhhbmRsZXJ9IGZyb20gJy4uL3dyYXBwZXJzL3ByaXZpbGVnZWQnO1xuXG5pbnRlcmZhY2UgRXhlY3V0ZUNzc1JlcXVlc3Qge1xuICAgIHBhdGg6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IEV4ZWN1dGVDc3NPblBhZ2UgPSBuZXcgUHJpdmlsZWdlZEhhbmRsZXIoXG4gICAgbmV3IEVtcHR5UmVzcG9uc2VIYW5kbGVyPEV4ZWN1dGVDc3NSZXF1ZXN0PihSZXF1ZXN0VHlwZS5FWEVDVVRFX0NTU19PTl9QQUdFLCBhc3luYyAocmVxLCBzZW5kZXIpID0+IHtcbiAgICAgICAgYXdhaXQgY2hyb21lLnNjcmlwdGluZy5pbnNlcnRDU1Moe1xuICAgICAgICAgICAgdGFyZ2V0OiB7dGFiSWQ6IHNlbmRlci50YWI/LmlkIGFzIG51bWJlcn0sXG4gICAgICAgICAgICBmaWxlczogW3JlcS5wYXRoXSxcbiAgICAgICAgfSk7XG4gICAgfSlcbik7XG4iLCJpbXBvcnQge1NpbXBsZUhhbmRsZXJ9IGZyb20gJy4vbWFpbic7XG5pbXBvcnQge1JlcXVlc3RUeXBlfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7UHJpdmlsZWdlZEhhbmRsZXJ9IGZyb20gJy4uL3dyYXBwZXJzL3ByaXZpbGVnZWQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEZldGNoRXh0ZW5zaW9uRmlsZVJlcXVlc3Qge1xuICAgIHBhdGg6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGZXRjaEV4dGVuc2lvbkZpbGVSZXNwb25zZSB7XG4gICAgdGV4dDogc3RyaW5nO1xufVxuXG5leHBvcnQgY29uc3QgRmV0Y2hFeHRlbnNpb25GaWxlID0gbmV3IFByaXZpbGVnZWRIYW5kbGVyKFxuICAgIG5ldyBTaW1wbGVIYW5kbGVyPEZldGNoRXh0ZW5zaW9uRmlsZVJlcXVlc3QsIEZldGNoRXh0ZW5zaW9uRmlsZVJlc3BvbnNlPihcbiAgICAgICAgUmVxdWVzdFR5cGUuRkVUQ0hfRVhURU5TSU9OX0ZJTEUsXG4gICAgICAgIGFzeW5jIChyZXEpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IGNocm9tZS5ydW50aW1lLmdldFVSTChyZXEucGF0aCk7XG4gICAgICAgICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2godXJsKTtcbiAgICAgICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByLnRleHQoKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICApXG4pO1xuIiwiaW1wb3J0XCJAbGl0L3JlYWN0aXZlLWVsZW1lbnRcIjtpbXBvcnRcImxpdC1odG1sXCI7ZXhwb3J0KmZyb21cImxpdC1lbGVtZW50L2xpdC1lbGVtZW50LmpzXCI7ZXhwb3J0KmZyb21cImxpdC1odG1sL2lzLXNlcnZlci5qc1wiO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwXG4iLCJpbXBvcnR7Z2V0Q29tcGF0aWJsZVN0eWxlIGFzIHQsYWRvcHRTdHlsZXMgYXMgc31mcm9tXCIuL2Nzcy10YWcuanNcIjtleHBvcnR7Q1NTUmVzdWx0LGFkb3B0U3R5bGVzLGNzcyxnZXRDb21wYXRpYmxlU3R5bGUsc3VwcG9ydHNBZG9wdGluZ1N0eWxlU2hlZXRzLHVuc2FmZUNTU31mcm9tXCIuL2Nzcy10YWcuanNcIjtcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE3IEdvb2dsZSBMTENcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqL2NvbnN0e2lzOmksZGVmaW5lUHJvcGVydHk6ZSxnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I6cixnZXRPd25Qcm9wZXJ0eU5hbWVzOmgsZ2V0T3duUHJvcGVydHlTeW1ib2xzOm8sZ2V0UHJvdG90eXBlT2Y6bn09T2JqZWN0LGE9Z2xvYmFsVGhpcyxjPWEudHJ1c3RlZFR5cGVzLGw9Yz9jLmVtcHR5U2NyaXB0OlwiXCIscD1hLnJlYWN0aXZlRWxlbWVudFBvbHlmaWxsU3VwcG9ydCxkPSh0LHMpPT50LHU9e3RvQXR0cmlidXRlKHQscyl7c3dpdGNoKHMpe2Nhc2UgQm9vbGVhbjp0PXQ/bDpudWxsO2JyZWFrO2Nhc2UgT2JqZWN0OmNhc2UgQXJyYXk6dD1udWxsPT10P3Q6SlNPTi5zdHJpbmdpZnkodCl9cmV0dXJuIHR9LGZyb21BdHRyaWJ1dGUodCxzKXtsZXQgaT10O3N3aXRjaChzKXtjYXNlIEJvb2xlYW46aT1udWxsIT09dDticmVhaztjYXNlIE51bWJlcjppPW51bGw9PT10P251bGw6TnVtYmVyKHQpO2JyZWFrO2Nhc2UgT2JqZWN0OmNhc2UgQXJyYXk6dHJ5e2k9SlNPTi5wYXJzZSh0KX1jYXRjaCh0KXtpPW51bGx9fXJldHVybiBpfX0sZj0odCxzKT0+IWkodCxzKSx5PXthdHRyaWJ1dGU6ITAsdHlwZTpTdHJpbmcsY29udmVydGVyOnUscmVmbGVjdDohMSxoYXNDaGFuZ2VkOmZ9O1N5bWJvbC5tZXRhZGF0YT8/PVN5bWJvbChcIm1ldGFkYXRhXCIpLGEubGl0UHJvcGVydHlNZXRhZGF0YT8/PW5ldyBXZWFrTWFwO2NsYXNzIGIgZXh0ZW5kcyBIVE1MRWxlbWVudHtzdGF0aWMgYWRkSW5pdGlhbGl6ZXIodCl7dGhpcy5fJEVpKCksKHRoaXMubD8/PVtdKS5wdXNoKHQpfXN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCl7cmV0dXJuIHRoaXMuZmluYWxpemUoKSx0aGlzLl8kRWgmJlsuLi50aGlzLl8kRWgua2V5cygpXX1zdGF0aWMgY3JlYXRlUHJvcGVydHkodCxzPXkpe2lmKHMuc3RhdGUmJihzLmF0dHJpYnV0ZT0hMSksdGhpcy5fJEVpKCksdGhpcy5lbGVtZW50UHJvcGVydGllcy5zZXQodCxzKSwhcy5ub0FjY2Vzc29yKXtjb25zdCBpPVN5bWJvbCgpLHI9dGhpcy5nZXRQcm9wZXJ0eURlc2NyaXB0b3IodCxpLHMpO3ZvaWQgMCE9PXImJmUodGhpcy5wcm90b3R5cGUsdCxyKX19c3RhdGljIGdldFByb3BlcnR5RGVzY3JpcHRvcih0LHMsaSl7Y29uc3R7Z2V0OmUsc2V0Omh9PXIodGhpcy5wcm90b3R5cGUsdCk/P3tnZXQoKXtyZXR1cm4gdGhpc1tzXX0sc2V0KHQpe3RoaXNbc109dH19O3JldHVybntnZXQoKXtyZXR1cm4gZT8uY2FsbCh0aGlzKX0sc2V0KHMpe2NvbnN0IHI9ZT8uY2FsbCh0aGlzKTtoLmNhbGwodGhpcyxzKSx0aGlzLnJlcXVlc3RVcGRhdGUodCxyLGkpfSxjb25maWd1cmFibGU6ITAsZW51bWVyYWJsZTohMH19c3RhdGljIGdldFByb3BlcnR5T3B0aW9ucyh0KXtyZXR1cm4gdGhpcy5lbGVtZW50UHJvcGVydGllcy5nZXQodCk/P3l9c3RhdGljIF8kRWkoKXtpZih0aGlzLmhhc093blByb3BlcnR5KGQoXCJlbGVtZW50UHJvcGVydGllc1wiKSkpcmV0dXJuO2NvbnN0IHQ9bih0aGlzKTt0LmZpbmFsaXplKCksdm9pZCAwIT09dC5sJiYodGhpcy5sPVsuLi50LmxdKSx0aGlzLmVsZW1lbnRQcm9wZXJ0aWVzPW5ldyBNYXAodC5lbGVtZW50UHJvcGVydGllcyl9c3RhdGljIGZpbmFsaXplKCl7aWYodGhpcy5oYXNPd25Qcm9wZXJ0eShkKFwiZmluYWxpemVkXCIpKSlyZXR1cm47aWYodGhpcy5maW5hbGl6ZWQ9ITAsdGhpcy5fJEVpKCksdGhpcy5oYXNPd25Qcm9wZXJ0eShkKFwicHJvcGVydGllc1wiKSkpe2NvbnN0IHQ9dGhpcy5wcm9wZXJ0aWVzLHM9Wy4uLmgodCksLi4ubyh0KV07Zm9yKGNvbnN0IGkgb2Ygcyl0aGlzLmNyZWF0ZVByb3BlcnR5KGksdFtpXSl9Y29uc3QgdD10aGlzW1N5bWJvbC5tZXRhZGF0YV07aWYobnVsbCE9PXQpe2NvbnN0IHM9bGl0UHJvcGVydHlNZXRhZGF0YS5nZXQodCk7aWYodm9pZCAwIT09cylmb3IoY29uc3RbdCxpXW9mIHMpdGhpcy5lbGVtZW50UHJvcGVydGllcy5zZXQodCxpKX10aGlzLl8kRWg9bmV3IE1hcDtmb3IoY29uc3RbdCxzXW9mIHRoaXMuZWxlbWVudFByb3BlcnRpZXMpe2NvbnN0IGk9dGhpcy5fJEV1KHQscyk7dm9pZCAwIT09aSYmdGhpcy5fJEVoLnNldChpLHQpfXRoaXMuZWxlbWVudFN0eWxlcz10aGlzLmZpbmFsaXplU3R5bGVzKHRoaXMuc3R5bGVzKX1zdGF0aWMgZmluYWxpemVTdHlsZXMocyl7Y29uc3QgaT1bXTtpZihBcnJheS5pc0FycmF5KHMpKXtjb25zdCBlPW5ldyBTZXQocy5mbGF0KDEvMCkucmV2ZXJzZSgpKTtmb3IoY29uc3QgcyBvZiBlKWkudW5zaGlmdCh0KHMpKX1lbHNlIHZvaWQgMCE9PXMmJmkucHVzaCh0KHMpKTtyZXR1cm4gaX1zdGF0aWMgXyRFdSh0LHMpe2NvbnN0IGk9cy5hdHRyaWJ1dGU7cmV0dXJuITE9PT1pP3ZvaWQgMDpcInN0cmluZ1wiPT10eXBlb2YgaT9pOlwic3RyaW5nXCI9PXR5cGVvZiB0P3QudG9Mb3dlckNhc2UoKTp2b2lkIDB9Y29uc3RydWN0b3IoKXtzdXBlcigpLHRoaXMuXyRFcD12b2lkIDAsdGhpcy5pc1VwZGF0ZVBlbmRpbmc9ITEsdGhpcy5oYXNVcGRhdGVkPSExLHRoaXMuXyRFbT1udWxsLHRoaXMuXyRFdigpfV8kRXYoKXt0aGlzLl8kRVM9bmV3IFByb21pc2UoKHQ9PnRoaXMuZW5hYmxlVXBkYXRpbmc9dCkpLHRoaXMuXyRBTD1uZXcgTWFwLHRoaXMuXyRFXygpLHRoaXMucmVxdWVzdFVwZGF0ZSgpLHRoaXMuY29uc3RydWN0b3IubD8uZm9yRWFjaCgodD0+dCh0aGlzKSkpfWFkZENvbnRyb2xsZXIodCl7KHRoaXMuXyRFTz8/PW5ldyBTZXQpLmFkZCh0KSx2b2lkIDAhPT10aGlzLnJlbmRlclJvb3QmJnRoaXMuaXNDb25uZWN0ZWQmJnQuaG9zdENvbm5lY3RlZD8uKCl9cmVtb3ZlQ29udHJvbGxlcih0KXt0aGlzLl8kRU8/LmRlbGV0ZSh0KX1fJEVfKCl7Y29uc3QgdD1uZXcgTWFwLHM9dGhpcy5jb25zdHJ1Y3Rvci5lbGVtZW50UHJvcGVydGllcztmb3IoY29uc3QgaSBvZiBzLmtleXMoKSl0aGlzLmhhc093blByb3BlcnR5KGkpJiYodC5zZXQoaSx0aGlzW2ldKSxkZWxldGUgdGhpc1tpXSk7dC5zaXplPjAmJih0aGlzLl8kRXA9dCl9Y3JlYXRlUmVuZGVyUm9vdCgpe2NvbnN0IHQ9dGhpcy5zaGFkb3dSb290Pz90aGlzLmF0dGFjaFNoYWRvdyh0aGlzLmNvbnN0cnVjdG9yLnNoYWRvd1Jvb3RPcHRpb25zKTtyZXR1cm4gcyh0LHRoaXMuY29uc3RydWN0b3IuZWxlbWVudFN0eWxlcyksdH1jb25uZWN0ZWRDYWxsYmFjaygpe3RoaXMucmVuZGVyUm9vdD8/PXRoaXMuY3JlYXRlUmVuZGVyUm9vdCgpLHRoaXMuZW5hYmxlVXBkYXRpbmcoITApLHRoaXMuXyRFTz8uZm9yRWFjaCgodD0+dC5ob3N0Q29ubmVjdGVkPy4oKSkpfWVuYWJsZVVwZGF0aW5nKHQpe31kaXNjb25uZWN0ZWRDYWxsYmFjaygpe3RoaXMuXyRFTz8uZm9yRWFjaCgodD0+dC5ob3N0RGlzY29ubmVjdGVkPy4oKSkpfWF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayh0LHMsaSl7dGhpcy5fJEFLKHQsaSl9XyRFQyh0LHMpe2NvbnN0IGk9dGhpcy5jb25zdHJ1Y3Rvci5lbGVtZW50UHJvcGVydGllcy5nZXQodCksZT10aGlzLmNvbnN0cnVjdG9yLl8kRXUodCxpKTtpZih2b2lkIDAhPT1lJiYhMD09PWkucmVmbGVjdCl7Y29uc3Qgcj0odm9pZCAwIT09aS5jb252ZXJ0ZXI/LnRvQXR0cmlidXRlP2kuY29udmVydGVyOnUpLnRvQXR0cmlidXRlKHMsaS50eXBlKTt0aGlzLl8kRW09dCxudWxsPT1yP3RoaXMucmVtb3ZlQXR0cmlidXRlKGUpOnRoaXMuc2V0QXR0cmlidXRlKGUsciksdGhpcy5fJEVtPW51bGx9fV8kQUsodCxzKXtjb25zdCBpPXRoaXMuY29uc3RydWN0b3IsZT1pLl8kRWguZ2V0KHQpO2lmKHZvaWQgMCE9PWUmJnRoaXMuXyRFbSE9PWUpe2NvbnN0IHQ9aS5nZXRQcm9wZXJ0eU9wdGlvbnMoZSkscj1cImZ1bmN0aW9uXCI9PXR5cGVvZiB0LmNvbnZlcnRlcj97ZnJvbUF0dHJpYnV0ZTp0LmNvbnZlcnRlcn06dm9pZCAwIT09dC5jb252ZXJ0ZXI/LmZyb21BdHRyaWJ1dGU/dC5jb252ZXJ0ZXI6dTt0aGlzLl8kRW09ZSx0aGlzW2VdPXIuZnJvbUF0dHJpYnV0ZShzLHQudHlwZSksdGhpcy5fJEVtPW51bGx9fXJlcXVlc3RVcGRhdGUodCxzLGkpe2lmKHZvaWQgMCE9PXQpe2lmKGk/Pz10aGlzLmNvbnN0cnVjdG9yLmdldFByb3BlcnR5T3B0aW9ucyh0KSwhKGkuaGFzQ2hhbmdlZD8/ZikodGhpc1t0XSxzKSlyZXR1cm47dGhpcy5QKHQscyxpKX0hMT09PXRoaXMuaXNVcGRhdGVQZW5kaW5nJiYodGhpcy5fJEVTPXRoaXMuXyRFVCgpKX1QKHQscyxpKXt0aGlzLl8kQUwuaGFzKHQpfHx0aGlzLl8kQUwuc2V0KHQscyksITA9PT1pLnJlZmxlY3QmJnRoaXMuXyRFbSE9PXQmJih0aGlzLl8kRWo/Pz1uZXcgU2V0KS5hZGQodCl9YXN5bmMgXyRFVCgpe3RoaXMuaXNVcGRhdGVQZW5kaW5nPSEwO3RyeXthd2FpdCB0aGlzLl8kRVN9Y2F0Y2godCl7UHJvbWlzZS5yZWplY3QodCl9Y29uc3QgdD10aGlzLnNjaGVkdWxlVXBkYXRlKCk7cmV0dXJuIG51bGwhPXQmJmF3YWl0IHQsIXRoaXMuaXNVcGRhdGVQZW5kaW5nfXNjaGVkdWxlVXBkYXRlKCl7cmV0dXJuIHRoaXMucGVyZm9ybVVwZGF0ZSgpfXBlcmZvcm1VcGRhdGUoKXtpZighdGhpcy5pc1VwZGF0ZVBlbmRpbmcpcmV0dXJuO2lmKCF0aGlzLmhhc1VwZGF0ZWQpe2lmKHRoaXMucmVuZGVyUm9vdD8/PXRoaXMuY3JlYXRlUmVuZGVyUm9vdCgpLHRoaXMuXyRFcCl7Zm9yKGNvbnN0W3Qsc11vZiB0aGlzLl8kRXApdGhpc1t0XT1zO3RoaXMuXyRFcD12b2lkIDB9Y29uc3QgdD10aGlzLmNvbnN0cnVjdG9yLmVsZW1lbnRQcm9wZXJ0aWVzO2lmKHQuc2l6ZT4wKWZvcihjb25zdFtzLGldb2YgdCkhMCE9PWkud3JhcHBlZHx8dGhpcy5fJEFMLmhhcyhzKXx8dm9pZCAwPT09dGhpc1tzXXx8dGhpcy5QKHMsdGhpc1tzXSxpKX1sZXQgdD0hMTtjb25zdCBzPXRoaXMuXyRBTDt0cnl7dD10aGlzLnNob3VsZFVwZGF0ZShzKSx0Pyh0aGlzLndpbGxVcGRhdGUocyksdGhpcy5fJEVPPy5mb3JFYWNoKCh0PT50Lmhvc3RVcGRhdGU/LigpKSksdGhpcy51cGRhdGUocykpOnRoaXMuXyRFVSgpfWNhdGNoKHMpe3Rocm93IHQ9ITEsdGhpcy5fJEVVKCksc310JiZ0aGlzLl8kQUUocyl9d2lsbFVwZGF0ZSh0KXt9XyRBRSh0KXt0aGlzLl8kRU8/LmZvckVhY2goKHQ9PnQuaG9zdFVwZGF0ZWQ/LigpKSksdGhpcy5oYXNVcGRhdGVkfHwodGhpcy5oYXNVcGRhdGVkPSEwLHRoaXMuZmlyc3RVcGRhdGVkKHQpKSx0aGlzLnVwZGF0ZWQodCl9XyRFVSgpe3RoaXMuXyRBTD1uZXcgTWFwLHRoaXMuaXNVcGRhdGVQZW5kaW5nPSExfWdldCB1cGRhdGVDb21wbGV0ZSgpe3JldHVybiB0aGlzLmdldFVwZGF0ZUNvbXBsZXRlKCl9Z2V0VXBkYXRlQ29tcGxldGUoKXtyZXR1cm4gdGhpcy5fJEVTfXNob3VsZFVwZGF0ZSh0KXtyZXR1cm4hMH11cGRhdGUodCl7dGhpcy5fJEVqJiY9dGhpcy5fJEVqLmZvckVhY2goKHQ9PnRoaXMuXyRFQyh0LHRoaXNbdF0pKSksdGhpcy5fJEVVKCl9dXBkYXRlZCh0KXt9Zmlyc3RVcGRhdGVkKHQpe319Yi5lbGVtZW50U3R5bGVzPVtdLGIuc2hhZG93Um9vdE9wdGlvbnM9e21vZGU6XCJvcGVuXCJ9LGJbZChcImVsZW1lbnRQcm9wZXJ0aWVzXCIpXT1uZXcgTWFwLGJbZChcImZpbmFsaXplZFwiKV09bmV3IE1hcCxwPy4oe1JlYWN0aXZlRWxlbWVudDpifSksKGEucmVhY3RpdmVFbGVtZW50VmVyc2lvbnM/Pz1bXSkucHVzaChcIjIuMC40XCIpO2V4cG9ydHtiIGFzIFJlYWN0aXZlRWxlbWVudCx1IGFzIGRlZmF1bHRDb252ZXJ0ZXIsZiBhcyBub3RFcXVhbH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1yZWFjdGl2ZS1lbGVtZW50LmpzLm1hcFxuIiwiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTkgR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICovXG5jb25zdCB0PWdsb2JhbFRoaXMsZT10LlNoYWRvd1Jvb3QmJih2b2lkIDA9PT10LlNoYWR5Q1NTfHx0LlNoYWR5Q1NTLm5hdGl2ZVNoYWRvdykmJlwiYWRvcHRlZFN0eWxlU2hlZXRzXCJpbiBEb2N1bWVudC5wcm90b3R5cGUmJlwicmVwbGFjZVwiaW4gQ1NTU3R5bGVTaGVldC5wcm90b3R5cGUscz1TeW1ib2woKSxvPW5ldyBXZWFrTWFwO2NsYXNzIG57Y29uc3RydWN0b3IodCxlLG8pe2lmKHRoaXMuXyRjc3NSZXN1bHQkPSEwLG8hPT1zKXRocm93IEVycm9yKFwiQ1NTUmVzdWx0IGlzIG5vdCBjb25zdHJ1Y3RhYmxlLiBVc2UgYHVuc2FmZUNTU2Agb3IgYGNzc2AgaW5zdGVhZC5cIik7dGhpcy5jc3NUZXh0PXQsdGhpcy50PWV9Z2V0IHN0eWxlU2hlZXQoKXtsZXQgdD10aGlzLm87Y29uc3Qgcz10aGlzLnQ7aWYoZSYmdm9pZCAwPT09dCl7Y29uc3QgZT12b2lkIDAhPT1zJiYxPT09cy5sZW5ndGg7ZSYmKHQ9by5nZXQocykpLHZvaWQgMD09PXQmJigodGhpcy5vPXQ9bmV3IENTU1N0eWxlU2hlZXQpLnJlcGxhY2VTeW5jKHRoaXMuY3NzVGV4dCksZSYmby5zZXQocyx0KSl9cmV0dXJuIHR9dG9TdHJpbmcoKXtyZXR1cm4gdGhpcy5jc3NUZXh0fX1jb25zdCByPXQ9Pm5ldyBuKFwic3RyaW5nXCI9PXR5cGVvZiB0P3Q6dCtcIlwiLHZvaWQgMCxzKSxpPSh0LC4uLmUpPT57Y29uc3Qgbz0xPT09dC5sZW5ndGg/dFswXTplLnJlZHVjZSgoKGUscyxvKT0+ZSsodD0+e2lmKCEwPT09dC5fJGNzc1Jlc3VsdCQpcmV0dXJuIHQuY3NzVGV4dDtpZihcIm51bWJlclwiPT10eXBlb2YgdClyZXR1cm4gdDt0aHJvdyBFcnJvcihcIlZhbHVlIHBhc3NlZCB0byAnY3NzJyBmdW5jdGlvbiBtdXN0IGJlIGEgJ2NzcycgZnVuY3Rpb24gcmVzdWx0OiBcIit0K1wiLiBVc2UgJ3Vuc2FmZUNTUycgdG8gcGFzcyBub24tbGl0ZXJhbCB2YWx1ZXMsIGJ1dCB0YWtlIGNhcmUgdG8gZW5zdXJlIHBhZ2Ugc2VjdXJpdHkuXCIpfSkocykrdFtvKzFdKSx0WzBdKTtyZXR1cm4gbmV3IG4obyx0LHMpfSxTPShzLG8pPT57aWYoZSlzLmFkb3B0ZWRTdHlsZVNoZWV0cz1vLm1hcCgodD0+dCBpbnN0YW5jZW9mIENTU1N0eWxlU2hlZXQ/dDp0LnN0eWxlU2hlZXQpKTtlbHNlIGZvcihjb25zdCBlIG9mIG8pe2NvbnN0IG89ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpLG49dC5saXROb25jZTt2b2lkIDAhPT1uJiZvLnNldEF0dHJpYnV0ZShcIm5vbmNlXCIsbiksby50ZXh0Q29udGVudD1lLmNzc1RleHQscy5hcHBlbmRDaGlsZChvKX19LGM9ZT90PT50OnQ9PnQgaW5zdGFuY2VvZiBDU1NTdHlsZVNoZWV0Pyh0PT57bGV0IGU9XCJcIjtmb3IoY29uc3QgcyBvZiB0LmNzc1J1bGVzKWUrPXMuY3NzVGV4dDtyZXR1cm4gcihlKX0pKHQpOnQ7ZXhwb3J0e24gYXMgQ1NTUmVzdWx0LFMgYXMgYWRvcHRTdHlsZXMsaSBhcyBjc3MsYyBhcyBnZXRDb21wYXRpYmxlU3R5bGUsZSBhcyBzdXBwb3J0c0Fkb3B0aW5nU3R5bGVTaGVldHMsciBhcyB1bnNhZmVDU1N9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y3NzLXRhZy5qcy5tYXBcbiIsIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE3IEdvb2dsZSBMTENcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqL1xuY29uc3QgdD1nbG9iYWxUaGlzLGk9dC50cnVzdGVkVHlwZXMscz1pP2kuY3JlYXRlUG9saWN5KFwibGl0LWh0bWxcIix7Y3JlYXRlSFRNTDp0PT50fSk6dm9pZCAwLGU9XCIkbGl0JFwiLGg9YGxpdCQke01hdGgucmFuZG9tKCkudG9GaXhlZCg5KS5zbGljZSgyKX0kYCxvPVwiP1wiK2gsbj1gPCR7b30+YCxyPWRvY3VtZW50LGw9KCk9PnIuY3JlYXRlQ29tbWVudChcIlwiKSxjPXQ9Pm51bGw9PT10fHxcIm9iamVjdFwiIT10eXBlb2YgdCYmXCJmdW5jdGlvblwiIT10eXBlb2YgdCxhPUFycmF5LmlzQXJyYXksdT10PT5hKHQpfHxcImZ1bmN0aW9uXCI9PXR5cGVvZiB0Py5bU3ltYm9sLml0ZXJhdG9yXSxkPVwiWyBcXHRcXG5cXGZcXHJdXCIsZj0vPCg/OighLS18XFwvW15hLXpBLVpdKXwoXFwvP1thLXpBLVpdW14+XFxzXSopfChcXC8/JCkpL2csdj0vLS0+L2csXz0vPi9nLG09UmVnRXhwKGA+fCR7ZH0oPzooW15cXFxcc1wiJz49L10rKSgke2R9Kj0ke2R9Kig/OlteIFxcdFxcblxcZlxcclwiJ1xcYDw+PV18KFwifCcpfCkpfCQpYCxcImdcIikscD0vJy9nLGc9L1wiL2csJD0vXig/OnNjcmlwdHxzdHlsZXx0ZXh0YXJlYXx0aXRsZSkkL2kseT10PT4oaSwuLi5zKT0+KHtfJGxpdFR5cGUkOnQsc3RyaW5nczppLHZhbHVlczpzfSkseD15KDEpLGI9eSgyKSx3PXkoMyksVD1TeW1ib2wuZm9yKFwibGl0LW5vQ2hhbmdlXCIpLEU9U3ltYm9sLmZvcihcImxpdC1ub3RoaW5nXCIpLEE9bmV3IFdlYWtNYXAsQz1yLmNyZWF0ZVRyZWVXYWxrZXIociwxMjkpO2Z1bmN0aW9uIFAodCxpKXtpZighYSh0KXx8IXQuaGFzT3duUHJvcGVydHkoXCJyYXdcIikpdGhyb3cgRXJyb3IoXCJpbnZhbGlkIHRlbXBsYXRlIHN0cmluZ3MgYXJyYXlcIik7cmV0dXJuIHZvaWQgMCE9PXM/cy5jcmVhdGVIVE1MKGkpOml9Y29uc3QgVj0odCxpKT0+e2NvbnN0IHM9dC5sZW5ndGgtMSxvPVtdO2xldCByLGw9Mj09PWk/XCI8c3ZnPlwiOjM9PT1pP1wiPG1hdGg+XCI6XCJcIixjPWY7Zm9yKGxldCBpPTA7aTxzO2krKyl7Y29uc3Qgcz10W2ldO2xldCBhLHUsZD0tMSx5PTA7Zm9yKDt5PHMubGVuZ3RoJiYoYy5sYXN0SW5kZXg9eSx1PWMuZXhlYyhzKSxudWxsIT09dSk7KXk9Yy5sYXN0SW5kZXgsYz09PWY/XCIhLS1cIj09PXVbMV0/Yz12OnZvaWQgMCE9PXVbMV0/Yz1fOnZvaWQgMCE9PXVbMl0/KCQudGVzdCh1WzJdKSYmKHI9UmVnRXhwKFwiPC9cIit1WzJdLFwiZ1wiKSksYz1tKTp2b2lkIDAhPT11WzNdJiYoYz1tKTpjPT09bT9cIj5cIj09PXVbMF0/KGM9cj8/ZixkPS0xKTp2b2lkIDA9PT11WzFdP2Q9LTI6KGQ9Yy5sYXN0SW5kZXgtdVsyXS5sZW5ndGgsYT11WzFdLGM9dm9pZCAwPT09dVszXT9tOidcIic9PT11WzNdP2c6cCk6Yz09PWd8fGM9PT1wP2M9bTpjPT09dnx8Yz09PV8/Yz1mOihjPW0scj12b2lkIDApO2NvbnN0IHg9Yz09PW0mJnRbaSsxXS5zdGFydHNXaXRoKFwiLz5cIik/XCIgXCI6XCJcIjtsKz1jPT09Zj9zK246ZD49MD8oby5wdXNoKGEpLHMuc2xpY2UoMCxkKStlK3Muc2xpY2UoZCkraCt4KTpzK2grKC0yPT09ZD9pOngpfXJldHVybltQKHQsbCsodFtzXXx8XCI8Pz5cIikrKDI9PT1pP1wiPC9zdmc+XCI6Mz09PWk/XCI8L21hdGg+XCI6XCJcIikpLG9dfTtjbGFzcyBOe2NvbnN0cnVjdG9yKHtzdHJpbmdzOnQsXyRsaXRUeXBlJDpzfSxuKXtsZXQgcjt0aGlzLnBhcnRzPVtdO2xldCBjPTAsYT0wO2NvbnN0IHU9dC5sZW5ndGgtMSxkPXRoaXMucGFydHMsW2Ysdl09Vih0LHMpO2lmKHRoaXMuZWw9Ti5jcmVhdGVFbGVtZW50KGYsbiksQy5jdXJyZW50Tm9kZT10aGlzLmVsLmNvbnRlbnQsMj09PXN8fDM9PT1zKXtjb25zdCB0PXRoaXMuZWwuY29udGVudC5maXJzdENoaWxkO3QucmVwbGFjZVdpdGgoLi4udC5jaGlsZE5vZGVzKX1mb3IoO251bGwhPT0ocj1DLm5leHROb2RlKCkpJiZkLmxlbmd0aDx1Oyl7aWYoMT09PXIubm9kZVR5cGUpe2lmKHIuaGFzQXR0cmlidXRlcygpKWZvcihjb25zdCB0IG9mIHIuZ2V0QXR0cmlidXRlTmFtZXMoKSlpZih0LmVuZHNXaXRoKGUpKXtjb25zdCBpPXZbYSsrXSxzPXIuZ2V0QXR0cmlidXRlKHQpLnNwbGl0KGgpLGU9LyhbLj9AXSk/KC4qKS8uZXhlYyhpKTtkLnB1c2goe3R5cGU6MSxpbmRleDpjLG5hbWU6ZVsyXSxzdHJpbmdzOnMsY3RvcjpcIi5cIj09PWVbMV0/SDpcIj9cIj09PWVbMV0/STpcIkBcIj09PWVbMV0/TDprfSksci5yZW1vdmVBdHRyaWJ1dGUodCl9ZWxzZSB0LnN0YXJ0c1dpdGgoaCkmJihkLnB1c2goe3R5cGU6NixpbmRleDpjfSksci5yZW1vdmVBdHRyaWJ1dGUodCkpO2lmKCQudGVzdChyLnRhZ05hbWUpKXtjb25zdCB0PXIudGV4dENvbnRlbnQuc3BsaXQoaCkscz10Lmxlbmd0aC0xO2lmKHM+MCl7ci50ZXh0Q29udGVudD1pP2kuZW1wdHlTY3JpcHQ6XCJcIjtmb3IobGV0IGk9MDtpPHM7aSsrKXIuYXBwZW5kKHRbaV0sbCgpKSxDLm5leHROb2RlKCksZC5wdXNoKHt0eXBlOjIsaW5kZXg6KytjfSk7ci5hcHBlbmQodFtzXSxsKCkpfX19ZWxzZSBpZig4PT09ci5ub2RlVHlwZSlpZihyLmRhdGE9PT1vKWQucHVzaCh7dHlwZToyLGluZGV4OmN9KTtlbHNle2xldCB0PS0xO2Zvcig7LTEhPT0odD1yLmRhdGEuaW5kZXhPZihoLHQrMSkpOylkLnB1c2goe3R5cGU6NyxpbmRleDpjfSksdCs9aC5sZW5ndGgtMX1jKyt9fXN0YXRpYyBjcmVhdGVFbGVtZW50KHQsaSl7Y29uc3Qgcz1yLmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtyZXR1cm4gcy5pbm5lckhUTUw9dCxzfX1mdW5jdGlvbiBTKHQsaSxzPXQsZSl7aWYoaT09PVQpcmV0dXJuIGk7bGV0IGg9dm9pZCAwIT09ZT9zLl8kQ28/LltlXTpzLl8kQ2w7Y29uc3Qgbz1jKGkpP3ZvaWQgMDppLl8kbGl0RGlyZWN0aXZlJDtyZXR1cm4gaD8uY29uc3RydWN0b3IhPT1vJiYoaD8uXyRBTz8uKCExKSx2b2lkIDA9PT1vP2g9dm9pZCAwOihoPW5ldyBvKHQpLGguXyRBVCh0LHMsZSkpLHZvaWQgMCE9PWU/KHMuXyRDbz8/PVtdKVtlXT1oOnMuXyRDbD1oKSx2b2lkIDAhPT1oJiYoaT1TKHQsaC5fJEFTKHQsaS52YWx1ZXMpLGgsZSkpLGl9Y2xhc3MgTXtjb25zdHJ1Y3Rvcih0LGkpe3RoaXMuXyRBVj1bXSx0aGlzLl8kQU49dm9pZCAwLHRoaXMuXyRBRD10LHRoaXMuXyRBTT1pfWdldCBwYXJlbnROb2RlKCl7cmV0dXJuIHRoaXMuXyRBTS5wYXJlbnROb2RlfWdldCBfJEFVKCl7cmV0dXJuIHRoaXMuXyRBTS5fJEFVfXUodCl7Y29uc3R7ZWw6e2NvbnRlbnQ6aX0scGFydHM6c309dGhpcy5fJEFELGU9KHQ/LmNyZWF0aW9uU2NvcGU/P3IpLmltcG9ydE5vZGUoaSwhMCk7Qy5jdXJyZW50Tm9kZT1lO2xldCBoPUMubmV4dE5vZGUoKSxvPTAsbj0wLGw9c1swXTtmb3IoO3ZvaWQgMCE9PWw7KXtpZihvPT09bC5pbmRleCl7bGV0IGk7Mj09PWwudHlwZT9pPW5ldyBSKGgsaC5uZXh0U2libGluZyx0aGlzLHQpOjE9PT1sLnR5cGU/aT1uZXcgbC5jdG9yKGgsbC5uYW1lLGwuc3RyaW5ncyx0aGlzLHQpOjY9PT1sLnR5cGUmJihpPW5ldyB6KGgsdGhpcyx0KSksdGhpcy5fJEFWLnB1c2goaSksbD1zWysrbl19byE9PWw/LmluZGV4JiYoaD1DLm5leHROb2RlKCksbysrKX1yZXR1cm4gQy5jdXJyZW50Tm9kZT1yLGV9cCh0KXtsZXQgaT0wO2Zvcihjb25zdCBzIG9mIHRoaXMuXyRBVil2b2lkIDAhPT1zJiYodm9pZCAwIT09cy5zdHJpbmdzPyhzLl8kQUkodCxzLGkpLGkrPXMuc3RyaW5ncy5sZW5ndGgtMik6cy5fJEFJKHRbaV0pKSxpKyt9fWNsYXNzIFJ7Z2V0IF8kQVUoKXtyZXR1cm4gdGhpcy5fJEFNPy5fJEFVPz90aGlzLl8kQ3Z9Y29uc3RydWN0b3IodCxpLHMsZSl7dGhpcy50eXBlPTIsdGhpcy5fJEFIPUUsdGhpcy5fJEFOPXZvaWQgMCx0aGlzLl8kQUE9dCx0aGlzLl8kQUI9aSx0aGlzLl8kQU09cyx0aGlzLm9wdGlvbnM9ZSx0aGlzLl8kQ3Y9ZT8uaXNDb25uZWN0ZWQ/PyEwfWdldCBwYXJlbnROb2RlKCl7bGV0IHQ9dGhpcy5fJEFBLnBhcmVudE5vZGU7Y29uc3QgaT10aGlzLl8kQU07cmV0dXJuIHZvaWQgMCE9PWkmJjExPT09dD8ubm9kZVR5cGUmJih0PWkucGFyZW50Tm9kZSksdH1nZXQgc3RhcnROb2RlKCl7cmV0dXJuIHRoaXMuXyRBQX1nZXQgZW5kTm9kZSgpe3JldHVybiB0aGlzLl8kQUJ9XyRBSSh0LGk9dGhpcyl7dD1TKHRoaXMsdCxpKSxjKHQpP3Q9PT1FfHxudWxsPT10fHxcIlwiPT09dD8odGhpcy5fJEFIIT09RSYmdGhpcy5fJEFSKCksdGhpcy5fJEFIPUUpOnQhPT10aGlzLl8kQUgmJnQhPT1UJiZ0aGlzLl8odCk6dm9pZCAwIT09dC5fJGxpdFR5cGUkP3RoaXMuJCh0KTp2b2lkIDAhPT10Lm5vZGVUeXBlP3RoaXMuVCh0KTp1KHQpP3RoaXMuayh0KTp0aGlzLl8odCl9Tyh0KXtyZXR1cm4gdGhpcy5fJEFBLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHQsdGhpcy5fJEFCKX1UKHQpe3RoaXMuXyRBSCE9PXQmJih0aGlzLl8kQVIoKSx0aGlzLl8kQUg9dGhpcy5PKHQpKX1fKHQpe3RoaXMuXyRBSCE9PUUmJmModGhpcy5fJEFIKT90aGlzLl8kQUEubmV4dFNpYmxpbmcuZGF0YT10OnRoaXMuVChyLmNyZWF0ZVRleHROb2RlKHQpKSx0aGlzLl8kQUg9dH0kKHQpe2NvbnN0e3ZhbHVlczppLF8kbGl0VHlwZSQ6c309dCxlPVwibnVtYmVyXCI9PXR5cGVvZiBzP3RoaXMuXyRBQyh0KToodm9pZCAwPT09cy5lbCYmKHMuZWw9Ti5jcmVhdGVFbGVtZW50KFAocy5oLHMuaFswXSksdGhpcy5vcHRpb25zKSkscyk7aWYodGhpcy5fJEFIPy5fJEFEPT09ZSl0aGlzLl8kQUgucChpKTtlbHNle2NvbnN0IHQ9bmV3IE0oZSx0aGlzKSxzPXQudSh0aGlzLm9wdGlvbnMpO3QucChpKSx0aGlzLlQocyksdGhpcy5fJEFIPXR9fV8kQUModCl7bGV0IGk9QS5nZXQodC5zdHJpbmdzKTtyZXR1cm4gdm9pZCAwPT09aSYmQS5zZXQodC5zdHJpbmdzLGk9bmV3IE4odCkpLGl9ayh0KXthKHRoaXMuXyRBSCl8fCh0aGlzLl8kQUg9W10sdGhpcy5fJEFSKCkpO2NvbnN0IGk9dGhpcy5fJEFIO2xldCBzLGU9MDtmb3IoY29uc3QgaCBvZiB0KWU9PT1pLmxlbmd0aD9pLnB1c2gocz1uZXcgUih0aGlzLk8obCgpKSx0aGlzLk8obCgpKSx0aGlzLHRoaXMub3B0aW9ucykpOnM9aVtlXSxzLl8kQUkoaCksZSsrO2U8aS5sZW5ndGgmJih0aGlzLl8kQVIocyYmcy5fJEFCLm5leHRTaWJsaW5nLGUpLGkubGVuZ3RoPWUpfV8kQVIodD10aGlzLl8kQUEubmV4dFNpYmxpbmcsaSl7Zm9yKHRoaXMuXyRBUD8uKCExLCEwLGkpO3QmJnQhPT10aGlzLl8kQUI7KXtjb25zdCBpPXQubmV4dFNpYmxpbmc7dC5yZW1vdmUoKSx0PWl9fXNldENvbm5lY3RlZCh0KXt2b2lkIDA9PT10aGlzLl8kQU0mJih0aGlzLl8kQ3Y9dCx0aGlzLl8kQVA/Lih0KSl9fWNsYXNzIGt7Z2V0IHRhZ05hbWUoKXtyZXR1cm4gdGhpcy5lbGVtZW50LnRhZ05hbWV9Z2V0IF8kQVUoKXtyZXR1cm4gdGhpcy5fJEFNLl8kQVV9Y29uc3RydWN0b3IodCxpLHMsZSxoKXt0aGlzLnR5cGU9MSx0aGlzLl8kQUg9RSx0aGlzLl8kQU49dm9pZCAwLHRoaXMuZWxlbWVudD10LHRoaXMubmFtZT1pLHRoaXMuXyRBTT1lLHRoaXMub3B0aW9ucz1oLHMubGVuZ3RoPjJ8fFwiXCIhPT1zWzBdfHxcIlwiIT09c1sxXT8odGhpcy5fJEFIPUFycmF5KHMubGVuZ3RoLTEpLmZpbGwobmV3IFN0cmluZyksdGhpcy5zdHJpbmdzPXMpOnRoaXMuXyRBSD1FfV8kQUkodCxpPXRoaXMscyxlKXtjb25zdCBoPXRoaXMuc3RyaW5ncztsZXQgbz0hMTtpZih2b2lkIDA9PT1oKXQ9Uyh0aGlzLHQsaSwwKSxvPSFjKHQpfHx0IT09dGhpcy5fJEFIJiZ0IT09VCxvJiYodGhpcy5fJEFIPXQpO2Vsc2V7Y29uc3QgZT10O2xldCBuLHI7Zm9yKHQ9aFswXSxuPTA7bjxoLmxlbmd0aC0xO24rKylyPVModGhpcyxlW3Mrbl0saSxuKSxyPT09VCYmKHI9dGhpcy5fJEFIW25dKSxvfHw9IWMocil8fHIhPT10aGlzLl8kQUhbbl0scj09PUU/dD1FOnQhPT1FJiYodCs9KHI/P1wiXCIpK2hbbisxXSksdGhpcy5fJEFIW25dPXJ9byYmIWUmJnRoaXMuaih0KX1qKHQpe3Q9PT1FP3RoaXMuZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUodGhpcy5uYW1lKTp0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKHRoaXMubmFtZSx0Pz9cIlwiKX19Y2xhc3MgSCBleHRlbmRzIGt7Y29uc3RydWN0b3IoKXtzdXBlciguLi5hcmd1bWVudHMpLHRoaXMudHlwZT0zfWoodCl7dGhpcy5lbGVtZW50W3RoaXMubmFtZV09dD09PUU/dm9pZCAwOnR9fWNsYXNzIEkgZXh0ZW5kcyBre2NvbnN0cnVjdG9yKCl7c3VwZXIoLi4uYXJndW1lbnRzKSx0aGlzLnR5cGU9NH1qKHQpe3RoaXMuZWxlbWVudC50b2dnbGVBdHRyaWJ1dGUodGhpcy5uYW1lLCEhdCYmdCE9PUUpfX1jbGFzcyBMIGV4dGVuZHMga3tjb25zdHJ1Y3Rvcih0LGkscyxlLGgpe3N1cGVyKHQsaSxzLGUsaCksdGhpcy50eXBlPTV9XyRBSSh0LGk9dGhpcyl7aWYoKHQ9Uyh0aGlzLHQsaSwwKT8/RSk9PT1UKXJldHVybjtjb25zdCBzPXRoaXMuXyRBSCxlPXQ9PT1FJiZzIT09RXx8dC5jYXB0dXJlIT09cy5jYXB0dXJlfHx0Lm9uY2UhPT1zLm9uY2V8fHQucGFzc2l2ZSE9PXMucGFzc2l2ZSxoPXQhPT1FJiYocz09PUV8fGUpO2UmJnRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMubmFtZSx0aGlzLHMpLGgmJnRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHRoaXMubmFtZSx0aGlzLHQpLHRoaXMuXyRBSD10fWhhbmRsZUV2ZW50KHQpe1wiZnVuY3Rpb25cIj09dHlwZW9mIHRoaXMuXyRBSD90aGlzLl8kQUguY2FsbCh0aGlzLm9wdGlvbnM/Lmhvc3Q/P3RoaXMuZWxlbWVudCx0KTp0aGlzLl8kQUguaGFuZGxlRXZlbnQodCl9fWNsYXNzIHp7Y29uc3RydWN0b3IodCxpLHMpe3RoaXMuZWxlbWVudD10LHRoaXMudHlwZT02LHRoaXMuXyRBTj12b2lkIDAsdGhpcy5fJEFNPWksdGhpcy5vcHRpb25zPXN9Z2V0IF8kQVUoKXtyZXR1cm4gdGhpcy5fJEFNLl8kQVV9XyRBSSh0KXtTKHRoaXMsdCl9fWNvbnN0IFo9e006ZSxQOmgsQTpvLEM6MSxMOlYsUjpNLEQ6dSxWOlMsSTpSLEg6ayxOOkksVTpMLEI6SCxGOnp9LGo9dC5saXRIdG1sUG9seWZpbGxTdXBwb3J0O2o/LihOLFIpLCh0LmxpdEh0bWxWZXJzaW9ucz8/PVtdKS5wdXNoKFwiMy4yLjFcIik7Y29uc3QgQj0odCxpLHMpPT57Y29uc3QgZT1zPy5yZW5kZXJCZWZvcmU/P2k7bGV0IGg9ZS5fJGxpdFBhcnQkO2lmKHZvaWQgMD09PWgpe2NvbnN0IHQ9cz8ucmVuZGVyQmVmb3JlPz9udWxsO2UuXyRsaXRQYXJ0JD1oPW5ldyBSKGkuaW5zZXJ0QmVmb3JlKGwoKSx0KSx0LHZvaWQgMCxzPz97fSl9cmV0dXJuIGguXyRBSSh0KSxofTtleHBvcnR7WiBhcyBfJExILHggYXMgaHRtbCx3IGFzIG1hdGhtbCxUIGFzIG5vQ2hhbmdlLEUgYXMgbm90aGluZyxCIGFzIHJlbmRlcixiIGFzIHN2Z307XG4vLyMgc291cmNlTWFwcGluZ1VSTD1saXQtaHRtbC5qcy5tYXBcbiIsImltcG9ydHtSZWFjdGl2ZUVsZW1lbnQgYXMgdH1mcm9tXCJAbGl0L3JlYWN0aXZlLWVsZW1lbnRcIjtleHBvcnQqZnJvbVwiQGxpdC9yZWFjdGl2ZS1lbGVtZW50XCI7aW1wb3J0e3JlbmRlciBhcyBlLG5vQ2hhbmdlIGFzIHN9ZnJvbVwibGl0LWh0bWxcIjtleHBvcnQqZnJvbVwibGl0LWh0bWxcIjtcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE3IEdvb2dsZSBMTENcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqL2NsYXNzIHIgZXh0ZW5kcyB0e2NvbnN0cnVjdG9yKCl7c3VwZXIoLi4uYXJndW1lbnRzKSx0aGlzLnJlbmRlck9wdGlvbnM9e2hvc3Q6dGhpc30sdGhpcy5fJERvPXZvaWQgMH1jcmVhdGVSZW5kZXJSb290KCl7Y29uc3QgdD1zdXBlci5jcmVhdGVSZW5kZXJSb290KCk7cmV0dXJuIHRoaXMucmVuZGVyT3B0aW9ucy5yZW5kZXJCZWZvcmU/Pz10LmZpcnN0Q2hpbGQsdH11cGRhdGUodCl7Y29uc3Qgcz10aGlzLnJlbmRlcigpO3RoaXMuaGFzVXBkYXRlZHx8KHRoaXMucmVuZGVyT3B0aW9ucy5pc0Nvbm5lY3RlZD10aGlzLmlzQ29ubmVjdGVkKSxzdXBlci51cGRhdGUodCksdGhpcy5fJERvPWUocyx0aGlzLnJlbmRlclJvb3QsdGhpcy5yZW5kZXJPcHRpb25zKX1jb25uZWN0ZWRDYWxsYmFjaygpe3N1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCksdGhpcy5fJERvPy5zZXRDb25uZWN0ZWQoITApfWRpc2Nvbm5lY3RlZENhbGxiYWNrKCl7c3VwZXIuZGlzY29ubmVjdGVkQ2FsbGJhY2soKSx0aGlzLl8kRG8/LnNldENvbm5lY3RlZCghMSl9cmVuZGVyKCl7cmV0dXJuIHN9fXIuXyRsaXRFbGVtZW50JD0hMCxyW1wiZmluYWxpemVkXCJdPSEwLGdsb2JhbFRoaXMubGl0RWxlbWVudEh5ZHJhdGVTdXBwb3J0Py4oe0xpdEVsZW1lbnQ6cn0pO2NvbnN0IGk9Z2xvYmFsVGhpcy5saXRFbGVtZW50UG9seWZpbGxTdXBwb3J0O2k/Lih7TGl0RWxlbWVudDpyfSk7Y29uc3Qgbz17XyRBSzoodCxlLHMpPT57dC5fJEFLKGUscyl9LF8kQUw6dD0+dC5fJEFMfTsoZ2xvYmFsVGhpcy5saXRFbGVtZW50VmVyc2lvbnM/Pz1bXSkucHVzaChcIjQuMS4xXCIpO2V4cG9ydHtyIGFzIExpdEVsZW1lbnQsbyBhcyBfJExFfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWxpdC1lbGVtZW50LmpzLm1hcFxuIiwiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMjIgR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICovXG5jb25zdCBvPSExO2V4cG9ydHtvIGFzIGlzU2VydmVyfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWlzLXNlcnZlci5qcy5tYXBcbiIsImltcG9ydCB7Y3VzdG9tRWxlbWVudH0gZnJvbSAnbGl0L2RlY29yYXRvcnMuanMnO1xuaW1wb3J0IHtGbG9hdEVsZW1lbnR9IGZyb20gJy4vY3VzdG9tJztcbmltcG9ydCB7aW5QYWdlQ29udGV4dH0gZnJvbSAnLi4vdXRpbHMvc25pcHMnO1xuXG5leHBvcnQgZW51bSBJbmplY3Rpb25Nb2RlIHtcbiAgICAvLyBJbmplY3RzIG9uY2UgYXQgcGFnZSBsb2FkIGZvciBlbGVtZW50cyBtYXRjaGluZyB0aGUgc2VsZWN0b3JcbiAgICBPTkNFLFxuICAgIC8vIENvbnRpbnVhbGx5IGluamVjdHMgd2hlbmV2ZXIgbmV3IGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhlXG4gICAgLy8gc2VsZWN0b3IgZXhpc3QgdGhhdCBoYXZlbid0IGJlZW4gaW5qZWN0ZWQgaW50byB5ZXRcbiAgICAvL1xuICAgIC8vIFNob3VsZCBiZSB1c2UgZm9yIFwiZHluYW1pY1wiIGVsZW1lbnRzXG4gICAgQ09OVElOVU9VUyxcbn1cblxuZXhwb3J0IGVudW0gSW5qZWN0aW9uUG9zaXRpb24ge1xuICAgIEJlZm9yZSA9ICdiZWZvcmViZWdpbicsXG4gICAgUHJlcGVuZCA9ICdhZnRlcmJlZ2luJyxcbiAgICBBcHBlbmQgPSAnYmVmb3JlZW5kJyxcbiAgICBBZnRlciA9ICdhZnRlcmVuZCcsXG59XG5cbmVudW0gSW5qZWN0aW9uVHlwZSB7XG4gICAgQXBwZW5kLFxuICAgIEJlZm9yZSxcbiAgICBBZnRlcixcbn1cblxuaW50ZXJmYWNlIEluamVjdGlvbkNvbmZpZyB7XG4gICAgZXhpc3RzOiAoY3R4OiBIVE1MRWxlbWVudCwgc2VsZWN0b3I6IHN0cmluZykgPT4gYm9vbGVhbjtcbiAgICBvcDogKGN0eDogSFRNTEVsZW1lbnQsIHRhcmdldDogdHlwZW9mIEZsb2F0RWxlbWVudCkgPT4gdm9pZDtcbn1cblxudHlwZSBJbmplY3Rpb25HdWFyZCA9ICgpID0+IGJvb2xlYW47XG50eXBlIE1heWJlUHJvbWlzZTxUPiA9IFQgfCBQcm9taXNlPFQ+O1xudHlwZSBJbmplY3Rpb25Db250ZXh0UmVzdWx0PFRDb250ZXh0PiA9IFRDb250ZXh0IHwgbnVsbCB8IHVuZGVmaW5lZDtcbnR5cGUgSW5qZWN0aW9uQ29udGV4dEJ1aWxkZXI8VENvbnRleHQ+ID0gKHNjb3BlOiBIVE1MRWxlbWVudCkgPT4gTWF5YmVQcm9taXNlPEluamVjdGlvbkNvbnRleHRSZXN1bHQ8VENvbnRleHQ+PjtcblxuZXhwb3J0IGludGVyZmFjZSBTY29wZWRJbmplY3Rpb25BcmdzPFRDb250ZXh0PiB7XG4gICAgc2NvcGU6IEhUTUxFbGVtZW50O1xuICAgIGNvbnRleHQ6IFRDb250ZXh0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluamVjdGlvblNjb3BlPFRDb250ZXh0PiB7XG4gICAgc2VsZWN0b3I6IHN0cmluZztcbiAgICBtb2RlOiBJbmplY3Rpb25Nb2RlO1xuICAgIGd1YXJkPzogSW5qZWN0aW9uR3VhcmQ7XG4gICAgY29udGV4dDogSW5qZWN0aW9uQ29udGV4dEJ1aWxkZXI8VENvbnRleHQ+O1xuICAgIHN0YXRlOiBJbmplY3Rpb25TY29wZVN0YXRlPFRDb250ZXh0Pjtcbn1cblxuaW50ZXJmYWNlIEluamVjdGlvblNjb3BlU3RhdGU8VENvbnRleHQ+IHtcbiAgICBjb250ZXh0Q2FjaGU6IFdlYWtNYXA8SFRNTEVsZW1lbnQsIFByb21pc2U8SW5qZWN0aW9uQ29udGV4dFJlc3VsdDxUQ29udGV4dD4+PjtcbiAgICBjb21wbGV0ZWQ6IFdlYWtNYXA8SFRNTEVsZW1lbnQsIE1hcDxzdHJpbmcsIEVsZW1lbnQgfCBudWxsPj47XG4gICAgaW5GbGlnaHQ6IFdlYWtNYXA8SFRNTEVsZW1lbnQsIFNldDxzdHJpbmc+Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmplY3Rpb25TY29wZUNvbmZpZzxUQ29udGV4dD4ge1xuICAgIHNlbGVjdG9yOiBzdHJpbmc7XG4gICAgbW9kZT86IEluamVjdGlvbk1vZGU7XG4gICAgZ3VhcmQ/OiBJbmplY3Rpb25HdWFyZDtcbiAgICBjb250ZXh0OiBJbmplY3Rpb25Db250ZXh0QnVpbGRlcjxUQ29udGV4dD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2NvcGVkSW5qZWN0aW9uQ29uZmlnPFRDb250ZXh0PiB7XG4gICAgYW5jaG9yOiAoYXJnczogU2NvcGVkSW5qZWN0aW9uQXJnczxUQ29udGV4dD4pID0+IEhUTUxFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgICBwb3NpdGlvbj86IEluamVjdGlvblBvc2l0aW9uO1xufVxuXG50eXBlIFNjb3BlZEVsZW1lbnQ8VENvbnRleHQ+ID0gRmxvYXRFbGVtZW50ICYge1xuICAgIGluamVjdGlvbkNvbnRleHQ/OiBUQ29udGV4dDtcbn07XG5cbmNvbnN0IEluamVjdGlvbkNvbmZpZ3M6IHtba2V5IGluIEluamVjdGlvblR5cGVdOiBJbmplY3Rpb25Db25maWd9ID0ge1xuICAgIFtJbmplY3Rpb25UeXBlLkFwcGVuZF06IHtcbiAgICAgICAgZXhpc3RzOiAoYW5jaG9yLCBzZWxlY3RvcikgPT4gQXJyYXkuZnJvbShhbmNob3IuY2hpbGRyZW4pLnNvbWUoKGNoaWxkKSA9PiBjaGlsZC5tYXRjaGVzKHNlbGVjdG9yKSksXG4gICAgICAgIG9wOiAoYW5jaG9yLCB0YXJnZXQpID0+IGFuY2hvci5hcHBlbmRDaGlsZCh0YXJnZXQuZWxlbSgpKSxcbiAgICB9LFxuICAgIFtJbmplY3Rpb25UeXBlLkJlZm9yZV06IHtcbiAgICAgICAgZXhpc3RzOiAoYW5jaG9yLCBzZWxlY3RvcikgPT4gaGFzU2libGluZ01hdGNoaW5nKGFuY2hvciwgJ3ByZXZpb3VzRWxlbWVudFNpYmxpbmcnLCBzZWxlY3RvciksXG4gICAgICAgIG9wOiAoYW5jaG9yLCB0YXJnZXQpID0+IGFuY2hvci5iZWZvcmUodGFyZ2V0LmVsZW0oKSksXG4gICAgfSxcbiAgICBbSW5qZWN0aW9uVHlwZS5BZnRlcl06IHtcbiAgICAgICAgZXhpc3RzOiAoYW5jaG9yLCBzZWxlY3RvcikgPT4gaGFzU2libGluZ01hdGNoaW5nKGFuY2hvciwgJ25leHRFbGVtZW50U2libGluZycsIHNlbGVjdG9yKSxcbiAgICAgICAgb3A6IChhbmNob3IsIHRhcmdldCkgPT4gYW5jaG9yLmFmdGVyKHRhcmdldC5lbGVtKCkpLFxuICAgIH0sXG59O1xuXG4vKiogQ2hlY2tzIGlmIGFueSBzaWJsaW5nIG9mIGBhbmNob3JgIGluIHRoZSBnaXZlbiBkaXJlY3Rpb24gbWF0Y2hlcyB0aGUgc2VsZWN0b3IuICovXG5mdW5jdGlvbiBoYXNTaWJsaW5nTWF0Y2hpbmcoXG4gICAgYW5jaG9yOiBIVE1MRWxlbWVudCxcbiAgICBkaXJlY3Rpb246IGtleW9mIFBpY2s8SFRNTEVsZW1lbnQsICdwcmV2aW91c0VsZW1lbnRTaWJsaW5nJyB8ICduZXh0RWxlbWVudFNpYmxpbmcnPixcbiAgICBzZWxlY3Rvcjogc3RyaW5nXG4pOiBib29sZWFuIHtcbiAgICBmb3IgKGxldCBlbCA9IGFuY2hvcltkaXJlY3Rpb25dOyBlbDsgZWwgPSBlbFtkaXJlY3Rpb25dKSB7XG4gICAgICAgIGlmIChlbC5tYXRjaGVzKHNlbGVjdG9yKSkgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEN1c3RvbUVsZW1lbnQoKTogYW55IHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldDogdHlwZW9mIEZsb2F0RWxlbWVudCwgcHJvcGVydHlLZXk6IHN0cmluZywgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yKSB7XG4gICAgICAgIGlmICghaW5QYWdlQ29udGV4dCgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY3VzdG9tRWxlbWVudHMuZ2V0KHRhcmdldC50YWcoKSkpIHtcbiAgICAgICAgICAgIC8vIEFscmVhZHkgZGVmaW5lZFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY3VzdG9tRWxlbWVudCh0YXJnZXQudGFnKCkpKHRhcmdldCk7XG4gICAgfTtcbn1cblxuY29uc3QgY2FuSW5qZWN0ID0gKGd1YXJkPzogSW5qZWN0aW9uR3VhcmQpID0+IChndWFyZCA/IGd1YXJkKCkgOiB0cnVlKTtcblxuZnVuY3Rpb24gYXNzZXJ0TmV2ZXIodmFsdWU6IG5ldmVyKTogbmV2ZXIge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5oYW5kbGVkIGluamVjdGlvbiBtb2RlOiAke3ZhbHVlfWApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lSW5qZWN0aW9uU2NvcGU8VENvbnRleHQ+KGNvbmZpZzogSW5qZWN0aW9uU2NvcGVDb25maWc8VENvbnRleHQ+KTogSW5qZWN0aW9uU2NvcGU8VENvbnRleHQ+IHtcbiAgICByZXR1cm4ge1xuICAgICAgICAuLi5jb25maWcsXG4gICAgICAgIG1vZGU6IGNvbmZpZy5tb2RlID8/IEluamVjdGlvbk1vZGUuT05DRSxcbiAgICAgICAgc3RhdGU6IHtcbiAgICAgICAgICAgIGNvbnRleHRDYWNoZTogbmV3IFdlYWtNYXAoKSxcbiAgICAgICAgICAgIGNvbXBsZXRlZDogbmV3IFdlYWtNYXAoKSxcbiAgICAgICAgICAgIGluRmxpZ2h0OiBuZXcgV2Vha01hcCgpLFxuICAgICAgICB9LFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldFRhZ1NldChtYXA6IFdlYWtNYXA8SFRNTEVsZW1lbnQsIFNldDxzdHJpbmc+Piwgc2NvcGU6IEhUTUxFbGVtZW50KTogU2V0PHN0cmluZz4ge1xuICAgIGxldCB0YWdzID0gbWFwLmdldChzY29wZSk7XG4gICAgaWYgKCF0YWdzKSB7XG4gICAgICAgIHRhZ3MgPSBuZXcgU2V0KCk7XG4gICAgICAgIG1hcC5zZXQoc2NvcGUsIHRhZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdGFncztcbn1cblxuZnVuY3Rpb24gaGFzVGFnKG1hcDogV2Vha01hcDxIVE1MRWxlbWVudCwgU2V0PHN0cmluZz4+LCBzY29wZTogSFRNTEVsZW1lbnQsIHRhZzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIG1hcC5nZXQoc2NvcGUpPy5oYXModGFnKSA/PyBmYWxzZTtcbn1cblxuZnVuY3Rpb24gYWRkVGFnKG1hcDogV2Vha01hcDxIVE1MRWxlbWVudCwgU2V0PHN0cmluZz4+LCBzY29wZTogSFRNTEVsZW1lbnQsIHRhZzogc3RyaW5nKTogdm9pZCB7XG4gICAgZ2V0VGFnU2V0KG1hcCwgc2NvcGUpLmFkZCh0YWcpO1xufVxuXG5mdW5jdGlvbiBkZWxldGVUYWcobWFwOiBXZWFrTWFwPEhUTUxFbGVtZW50LCBTZXQ8c3RyaW5nPj4sIHNjb3BlOiBIVE1MRWxlbWVudCwgdGFnOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBtYXAuZ2V0KHNjb3BlKT8uZGVsZXRlKHRhZyk7XG59XG5cbmZ1bmN0aW9uIGdldENvbXBsZXRlZE1hcChcbiAgICBtYXA6IFdlYWtNYXA8SFRNTEVsZW1lbnQsIE1hcDxzdHJpbmcsIEVsZW1lbnQgfCBudWxsPj4sXG4gICAgc2NvcGU6IEhUTUxFbGVtZW50XG4pOiBNYXA8c3RyaW5nLCBFbGVtZW50IHwgbnVsbD4ge1xuICAgIGxldCB0YWdzID0gbWFwLmdldChzY29wZSk7XG4gICAgaWYgKCF0YWdzKSB7XG4gICAgICAgIHRhZ3MgPSBuZXcgTWFwKCk7XG4gICAgICAgIG1hcC5zZXQoc2NvcGUsIHRhZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdGFncztcbn1cblxuZnVuY3Rpb24gaGFzQ29tcGxldGVkSW5qZWN0aW9uPFRDb250ZXh0PihcbiAgICBpbmplY3Rpb25TY29wZTogSW5qZWN0aW9uU2NvcGU8VENvbnRleHQ+LFxuICAgIHNjb3BlOiBIVE1MRWxlbWVudCxcbiAgICB0YWc6IHN0cmluZ1xuKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZWxlbWVudCA9IGluamVjdGlvblNjb3BlLnN0YXRlLmNvbXBsZXRlZC5nZXQoc2NvcGUpPy5nZXQodGFnKTtcbiAgICBpZiAoZWxlbWVudCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGVsZW1lbnQgPT09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChlbGVtZW50LmlzQ29ubmVjdGVkKSByZXR1cm4gdHJ1ZTtcblxuICAgIGluamVjdGlvblNjb3BlLnN0YXRlLmNvbXBsZXRlZC5nZXQoc2NvcGUpPy5kZWxldGUodGFnKTtcbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGFkZENvbXBsZXRlZEluamVjdGlvbjxUQ29udGV4dD4oXG4gICAgaW5qZWN0aW9uU2NvcGU6IEluamVjdGlvblNjb3BlPFRDb250ZXh0PixcbiAgICBzY29wZTogSFRNTEVsZW1lbnQsXG4gICAgdGFnOiBzdHJpbmcsXG4gICAgZWxlbWVudDogRWxlbWVudCB8IG51bGxcbik6IHZvaWQge1xuICAgIGdldENvbXBsZXRlZE1hcChpbmplY3Rpb25TY29wZS5zdGF0ZS5jb21wbGV0ZWQsIHNjb3BlKS5zZXQodGFnLCBlbGVtZW50KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0U2NvcGVDb250ZXh0PFRDb250ZXh0PihcbiAgICBpbmplY3Rpb25TY29wZTogSW5qZWN0aW9uU2NvcGU8VENvbnRleHQ+LFxuICAgIHNjb3BlOiBIVE1MRWxlbWVudFxuKTogUHJvbWlzZTxJbmplY3Rpb25Db250ZXh0UmVzdWx0PFRDb250ZXh0Pj4ge1xuICAgIGNvbnN0IGNhY2hlZCA9IGluamVjdGlvblNjb3BlLnN0YXRlLmNvbnRleHRDYWNoZS5nZXQoc2NvcGUpO1xuICAgIGlmIChjYWNoZWQpIHJldHVybiBjYWNoZWQ7XG5cbiAgICBjb25zdCBjb250ZXh0ID0gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgLnRoZW4oKCkgPT4gaW5qZWN0aW9uU2NvcGUuY29udGV4dChzY29wZSkpXG4gICAgICAgIC50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGluamVjdGlvblNjb3BlLnN0YXRlLmNvbnRleHRDYWNoZS5kZWxldGUoc2NvcGUpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGluamVjdGlvblNjb3BlLnN0YXRlLmNvbnRleHRDYWNoZS5zZXQoc2NvcGUsIFByb21pc2UucmVzb2x2ZShyZXN1bHQpKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgICAgaW5qZWN0aW9uU2NvcGUuc3RhdGUuY29udGV4dENhY2hlLmRlbGV0ZShzY29wZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9KTtcblxuICAgIGluamVjdGlvblNjb3BlLnN0YXRlLmNvbnRleHRDYWNoZS5zZXQoc2NvcGUsIGNvbnRleHQpO1xuICAgIHJldHVybiBjb250ZXh0O1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbmplY3RJbnRvU2NvcGU8VENvbnRleHQ+KFxuICAgIHNjb3BlOiBIVE1MRWxlbWVudCxcbiAgICB0YXJnZXQ6IHR5cGVvZiBGbG9hdEVsZW1lbnQsXG4gICAgaW5qZWN0aW9uU2NvcGU6IEluamVjdGlvblNjb3BlPFRDb250ZXh0PixcbiAgICBjb25maWc6IFNjb3BlZEluamVjdGlvbkNvbmZpZzxUQ29udGV4dD5cbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHRhZyA9IHRhcmdldC50YWcoKTtcbiAgICBpZiAoaGFzQ29tcGxldGVkSW5qZWN0aW9uKGluamVjdGlvblNjb3BlLCBzY29wZSwgdGFnKSB8fCBoYXNUYWcoaW5qZWN0aW9uU2NvcGUuc3RhdGUuaW5GbGlnaHQsIHNjb3BlLCB0YWcpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBhZGRUYWcoaW5qZWN0aW9uU2NvcGUuc3RhdGUuaW5GbGlnaHQsIHNjb3BlLCB0YWcpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGF3YWl0IGdldFNjb3BlQ29udGV4dChpbmplY3Rpb25TY29wZSwgc2NvcGUpO1xuICAgICAgICBpZiAoY29udGV4dCA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgICAgIGlmIChjb250ZXh0ID09PSBudWxsKSB7XG4gICAgICAgICAgICBhZGRDb21wbGV0ZWRJbmplY3Rpb24oaW5qZWN0aW9uU2NvcGUsIHNjb3BlLCB0YWcsIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYW5jaG9yID0gY29uZmlnLmFuY2hvcih7c2NvcGUsIGNvbnRleHR9KTtcbiAgICAgICAgaWYgKGFuY2hvciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgICAgIGlmIChhbmNob3IgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGFkZENvbXBsZXRlZEluamVjdGlvbihpbmplY3Rpb25TY29wZSwgc2NvcGUsIHRhZywgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBlbGVtZW50ID0gdGFyZ2V0LmVsZW0oKSBhcyBTY29wZWRFbGVtZW50PFRDb250ZXh0PjtcbiAgICAgICAgZWxlbWVudC5pbmplY3Rpb25Db250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgYW5jaG9yLmluc2VydEFkamFjZW50RWxlbWVudChjb25maWcucG9zaXRpb24gPz8gSW5qZWN0aW9uUG9zaXRpb24uQXBwZW5kLCBlbGVtZW50KTtcbiAgICAgICAgYWRkQ29tcGxldGVkSW5qZWN0aW9uKGluamVjdGlvblNjb3BlLCBzY29wZSwgdGFnLCBlbGVtZW50KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIEZhaWxlZCBjb250ZXh0IGJ1aWxkZXJzIGFyZSByZXRyaWVkIG9uIHRoZSBuZXh0IHNjYW4uXG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgZGVsZXRlVGFnKGluamVjdGlvblNjb3BlLnN0YXRlLmluRmxpZ2h0LCBzY29wZSwgdGFnKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIEluamVjdChzZWxlY3Rvcjogc3RyaW5nLCBtb2RlOiBJbmplY3Rpb25Nb2RlLCB0eXBlOiBJbmplY3Rpb25UeXBlLCBndWFyZD86IEluamVjdGlvbkd1YXJkKTogYW55IHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldDogdHlwZW9mIEZsb2F0RWxlbWVudCwgcHJvcGVydHlLZXk6IHN0cmluZywgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yKSB7XG4gICAgICAgIGlmICghaW5QYWdlQ29udGV4dCgpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKG1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgSW5qZWN0aW9uTW9kZS5PTkNFOlxuICAgICAgICAgICAgICAgIGlmICghY2FuSW5qZWN0KGd1YXJkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KHNlbGVjdG9yKS5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBJbmplY3Rpb25Db25maWdzW3R5cGVdLm9wKGVsLCB0YXJnZXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBJbmplY3Rpb25Nb2RlLkNPTlRJTlVPVVM6XG4gICAgICAgICAgICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNhbkluamVjdChndWFyZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KHNlbGVjdG9yKS5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgYWRkIHRoZSBpdGVtIGFnYWluIGlmIHdlIGFscmVhZHkgaGF2ZVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKEluamVjdGlvbkNvbmZpZ3NbdHlwZV0uZXhpc3RzKGVsLCB0YXJnZXQudGFnKCkpKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIEluamVjdGlvbkNvbmZpZ3NbdHlwZV0ub3AoZWwsIHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sIDI1MCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGFzc2VydE5ldmVyKG1vZGUpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEluamVjdEFwcGVuZChzZWxlY3Rvcjogc3RyaW5nLCBtb2RlOiBJbmplY3Rpb25Nb2RlID0gSW5qZWN0aW9uTW9kZS5PTkNFLCBndWFyZD86IEluamVjdGlvbkd1YXJkKTogYW55IHtcbiAgICByZXR1cm4gSW5qZWN0KHNlbGVjdG9yLCBtb2RlLCBJbmplY3Rpb25UeXBlLkFwcGVuZCwgZ3VhcmQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gSW5qZWN0QmVmb3JlKHNlbGVjdG9yOiBzdHJpbmcsIG1vZGU6IEluamVjdGlvbk1vZGUgPSBJbmplY3Rpb25Nb2RlLk9OQ0UsIGd1YXJkPzogSW5qZWN0aW9uR3VhcmQpOiBhbnkge1xuICAgIHJldHVybiBJbmplY3Qoc2VsZWN0b3IsIG1vZGUsIEluamVjdGlvblR5cGUuQmVmb3JlLCBndWFyZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBJbmplY3RBZnRlcihzZWxlY3Rvcjogc3RyaW5nLCBtb2RlOiBJbmplY3Rpb25Nb2RlID0gSW5qZWN0aW9uTW9kZS5PTkNFLCBndWFyZD86IEluamVjdGlvbkd1YXJkKTogYW55IHtcbiAgICByZXR1cm4gSW5qZWN0KHNlbGVjdG9yLCBtb2RlLCBJbmplY3Rpb25UeXBlLkFmdGVyLCBndWFyZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBJbmplY3RJbnRvU2NvcGU8VENvbnRleHQ+KFxuICAgIGluamVjdGlvblNjb3BlOiBJbmplY3Rpb25TY29wZTxUQ29udGV4dD4sXG4gICAgY29uZmlnOiBTY29wZWRJbmplY3Rpb25Db25maWc8VENvbnRleHQ+XG4pOiBhbnkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0OiB0eXBlb2YgRmxvYXRFbGVtZW50LCBwcm9wZXJ0eUtleTogc3RyaW5nLCBkZXNjcmlwdG9yOiBQcm9wZXJ0eURlc2NyaXB0b3IpIHtcbiAgICAgICAgaWYgKCFpblBhZ2VDb250ZXh0KCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluamVjdCA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICghY2FuSW5qZWN0KGluamVjdGlvblNjb3BlLmd1YXJkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oaW5qZWN0aW9uU2NvcGUuc2VsZWN0b3IpLmZvckVhY2goKHNjb3BlKSA9PiB7XG4gICAgICAgICAgICAgICAgdm9pZCBpbmplY3RJbnRvU2NvcGUoc2NvcGUsIHRhcmdldCwgaW5qZWN0aW9uU2NvcGUsIGNvbmZpZyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBzd2l0Y2ggKGluamVjdGlvblNjb3BlLm1vZGUpIHtcbiAgICAgICAgICAgIGNhc2UgSW5qZWN0aW9uTW9kZS5PTkNFOlxuICAgICAgICAgICAgICAgIGluamVjdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBJbmplY3Rpb25Nb2RlLkNPTlRJTlVPVVM6XG4gICAgICAgICAgICAgICAgc2V0SW50ZXJ2YWwoaW5qZWN0LCAyNTApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBhc3NlcnROZXZlcihpbmplY3Rpb25TY29wZS5tb2RlKTtcbiAgICAgICAgfVxuICAgIH07XG59XG4iLCJleHBvcnQqZnJvbVwiQGxpdC9yZWFjdGl2ZS1lbGVtZW50L2RlY29yYXRvcnMvY3VzdG9tLWVsZW1lbnQuanNcIjtleHBvcnQqZnJvbVwiQGxpdC9yZWFjdGl2ZS1lbGVtZW50L2RlY29yYXRvcnMvcHJvcGVydHkuanNcIjtleHBvcnQqZnJvbVwiQGxpdC9yZWFjdGl2ZS1lbGVtZW50L2RlY29yYXRvcnMvc3RhdGUuanNcIjtleHBvcnQqZnJvbVwiQGxpdC9yZWFjdGl2ZS1lbGVtZW50L2RlY29yYXRvcnMvZXZlbnQtb3B0aW9ucy5qc1wiO2V4cG9ydCpmcm9tXCJAbGl0L3JlYWN0aXZlLWVsZW1lbnQvZGVjb3JhdG9ycy9xdWVyeS5qc1wiO2V4cG9ydCpmcm9tXCJAbGl0L3JlYWN0aXZlLWVsZW1lbnQvZGVjb3JhdG9ycy9xdWVyeS1hbGwuanNcIjtleHBvcnQqZnJvbVwiQGxpdC9yZWFjdGl2ZS1lbGVtZW50L2RlY29yYXRvcnMvcXVlcnktYXN5bmMuanNcIjtleHBvcnQqZnJvbVwiQGxpdC9yZWFjdGl2ZS1lbGVtZW50L2RlY29yYXRvcnMvcXVlcnktYXNzaWduZWQtZWxlbWVudHMuanNcIjtleHBvcnQqZnJvbVwiQGxpdC9yZWFjdGl2ZS1lbGVtZW50L2RlY29yYXRvcnMvcXVlcnktYXNzaWduZWQtbm9kZXMuanNcIjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRlY29yYXRvcnMuanMubWFwXG4iLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNyBHb29nbGUgTExDXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQlNELTMtQ2xhdXNlXG4gKi9cbmNvbnN0IHQ9dD0+KGUsbyk9Pnt2b2lkIDAhPT1vP28uYWRkSW5pdGlhbGl6ZXIoKCgpPT57Y3VzdG9tRWxlbWVudHMuZGVmaW5lKHQsZSl9KSk6Y3VzdG9tRWxlbWVudHMuZGVmaW5lKHQsZSl9O2V4cG9ydHt0IGFzIGN1c3RvbUVsZW1lbnR9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y3VzdG9tLWVsZW1lbnQuanMubWFwXG4iLCJpbXBvcnR7ZGVmYXVsdENvbnZlcnRlciBhcyB0LG5vdEVxdWFsIGFzIGV9ZnJvbVwiLi4vcmVhY3RpdmUtZWxlbWVudC5qc1wiO1xuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTcgR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICovY29uc3Qgbz17YXR0cmlidXRlOiEwLHR5cGU6U3RyaW5nLGNvbnZlcnRlcjp0LHJlZmxlY3Q6ITEsaGFzQ2hhbmdlZDplfSxyPSh0PW8sZSxyKT0+e2NvbnN0e2tpbmQ6bixtZXRhZGF0YTppfT1yO2xldCBzPWdsb2JhbFRoaXMubGl0UHJvcGVydHlNZXRhZGF0YS5nZXQoaSk7aWYodm9pZCAwPT09cyYmZ2xvYmFsVGhpcy5saXRQcm9wZXJ0eU1ldGFkYXRhLnNldChpLHM9bmV3IE1hcCkscy5zZXQoci5uYW1lLHQpLFwiYWNjZXNzb3JcIj09PW4pe2NvbnN0e25hbWU6b309cjtyZXR1cm57c2V0KHIpe2NvbnN0IG49ZS5nZXQuY2FsbCh0aGlzKTtlLnNldC5jYWxsKHRoaXMsciksdGhpcy5yZXF1ZXN0VXBkYXRlKG8sbix0KX0saW5pdChlKXtyZXR1cm4gdm9pZCAwIT09ZSYmdGhpcy5QKG8sdm9pZCAwLHQpLGV9fX1pZihcInNldHRlclwiPT09bil7Y29uc3R7bmFtZTpvfT1yO3JldHVybiBmdW5jdGlvbihyKXtjb25zdCBuPXRoaXNbb107ZS5jYWxsKHRoaXMsciksdGhpcy5yZXF1ZXN0VXBkYXRlKG8sbix0KX19dGhyb3cgRXJyb3IoXCJVbnN1cHBvcnRlZCBkZWNvcmF0b3IgbG9jYXRpb246IFwiK24pfTtmdW5jdGlvbiBuKHQpe3JldHVybihlLG8pPT5cIm9iamVjdFwiPT10eXBlb2Ygbz9yKHQsZSxvKTooKHQsZSxvKT0+e2NvbnN0IHI9ZS5oYXNPd25Qcm9wZXJ0eShvKTtyZXR1cm4gZS5jb25zdHJ1Y3Rvci5jcmVhdGVQcm9wZXJ0eShvLHI/ey4uLnQsd3JhcHBlZDohMH06dCkscj9PYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGUsbyk6dm9pZCAwfSkodCxlLG8pfWV4cG9ydHtuIGFzIHByb3BlcnR5LHIgYXMgc3RhbmRhcmRQcm9wZXJ0eX07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcm9wZXJ0eS5qcy5tYXBcbiIsImltcG9ydHtwcm9wZXJ0eSBhcyB0fWZyb21cIi4vcHJvcGVydHkuanNcIjtcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE3IEdvb2dsZSBMTENcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqL2Z1bmN0aW9uIHIocil7cmV0dXJuIHQoey4uLnIsc3RhdGU6ITAsYXR0cmlidXRlOiExfSl9ZXhwb3J0e3IgYXMgc3RhdGV9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3RhdGUuanMubWFwXG4iLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNyBHb29nbGUgTExDXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQlNELTMtQ2xhdXNlXG4gKi9cbmZ1bmN0aW9uIHQodCl7cmV0dXJuKG4sbyk9Pntjb25zdCBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIG4/bjpuW29dO09iamVjdC5hc3NpZ24oYyx0KX19ZXhwb3J0e3QgYXMgZXZlbnRPcHRpb25zfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWV2ZW50LW9wdGlvbnMuanMubWFwXG4iLCJpbXBvcnR7ZGVzYyBhcyB0fWZyb21cIi4vYmFzZS5qc1wiO1xuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTcgR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICovZnVuY3Rpb24gZShlLHIpe3JldHVybihuLHMsaSk9Pntjb25zdCBvPXQ9PnQucmVuZGVyUm9vdD8ucXVlcnlTZWxlY3RvcihlKT8/bnVsbDtpZihyKXtjb25zdHtnZXQ6ZSxzZXQ6cn09XCJvYmplY3RcIj09dHlwZW9mIHM/bjppPz8oKCk9Pntjb25zdCB0PVN5bWJvbCgpO3JldHVybntnZXQoKXtyZXR1cm4gdGhpc1t0XX0sc2V0KGUpe3RoaXNbdF09ZX19fSkoKTtyZXR1cm4gdChuLHMse2dldCgpe2xldCB0PWUuY2FsbCh0aGlzKTtyZXR1cm4gdm9pZCAwPT09dCYmKHQ9byh0aGlzKSwobnVsbCE9PXR8fHRoaXMuaGFzVXBkYXRlZCkmJnIuY2FsbCh0aGlzLHQpKSx0fX0pfXJldHVybiB0KG4scyx7Z2V0KCl7cmV0dXJuIG8odGhpcyl9fSl9fWV4cG9ydHtlIGFzIHF1ZXJ5fTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1ZXJ5LmpzLm1hcFxuIiwiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTcgR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICovXG5jb25zdCBlPShlLHQsYyk9PihjLmNvbmZpZ3VyYWJsZT0hMCxjLmVudW1lcmFibGU9ITAsUmVmbGVjdC5kZWNvcmF0ZSYmXCJvYmplY3RcIiE9dHlwZW9mIHQmJk9iamVjdC5kZWZpbmVQcm9wZXJ0eShlLHQsYyksYyk7ZXhwb3J0e2UgYXMgZGVzY307XG4vLyMgc291cmNlTWFwcGluZ1VSTD1iYXNlLmpzLm1hcFxuIiwiaW1wb3J0e2Rlc2MgYXMgdH1mcm9tXCIuL2Jhc2UuanNcIjtcbi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE3IEdvb2dsZSBMTENcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBCU0QtMy1DbGF1c2VcbiAqL1xubGV0IGU7ZnVuY3Rpb24gcihyKXtyZXR1cm4obixvKT0+dChuLG8se2dldCgpe3JldHVybih0aGlzLnJlbmRlclJvb3Q/PyhlPz89ZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKSkucXVlcnlTZWxlY3RvckFsbChyKX19KX1leHBvcnR7ciBhcyBxdWVyeUFsbH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1xdWVyeS1hbGwuanMubWFwXG4iLCJpbXBvcnR7ZGVzYyBhcyB0fWZyb21cIi4vYmFzZS5qc1wiO1xuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTcgR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICovXG5mdW5jdGlvbiByKHIpe3JldHVybihuLGUpPT50KG4sZSx7YXN5bmMgZ2V0KCl7cmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlQ29tcGxldGUsdGhpcy5yZW5kZXJSb290Py5xdWVyeVNlbGVjdG9yKHIpPz9udWxsfX0pfWV4cG9ydHtyIGFzIHF1ZXJ5QXN5bmN9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cXVlcnktYXN5bmMuanMubWFwXG4iLCJpbXBvcnR7ZGVzYyBhcyB0fWZyb21cIi4vYmFzZS5qc1wiO1xuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMjEgR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICovZnVuY3Rpb24gbyhvKXtyZXR1cm4oZSxuKT0+e2NvbnN0e3Nsb3Q6cixzZWxlY3RvcjpzfT1vPz97fSxjPVwic2xvdFwiKyhyP2BbbmFtZT0ke3J9XWA6XCI6bm90KFtuYW1lXSlcIik7cmV0dXJuIHQoZSxuLHtnZXQoKXtjb25zdCB0PXRoaXMucmVuZGVyUm9vdD8ucXVlcnlTZWxlY3RvcihjKSxlPXQ/LmFzc2lnbmVkRWxlbWVudHMobyk/P1tdO3JldHVybiB2b2lkIDA9PT1zP2U6ZS5maWx0ZXIoKHQ9PnQubWF0Y2hlcyhzKSkpfX0pfX1leHBvcnR7byBhcyBxdWVyeUFzc2lnbmVkRWxlbWVudHN9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cXVlcnktYXNzaWduZWQtZWxlbWVudHMuanMubWFwXG4iLCJpbXBvcnR7ZGVzYyBhcyB0fWZyb21cIi4vYmFzZS5qc1wiO1xuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTcgR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICovZnVuY3Rpb24gbihuKXtyZXR1cm4obyxyKT0+e2NvbnN0e3Nsb3Q6ZX09bj8/e30scz1cInNsb3RcIisoZT9gW25hbWU9JHtlfV1gOlwiOm5vdChbbmFtZV0pXCIpO3JldHVybiB0KG8scix7Z2V0KCl7Y29uc3QgdD10aGlzLnJlbmRlclJvb3Q/LnF1ZXJ5U2VsZWN0b3Iocyk7cmV0dXJuIHQ/LmFzc2lnbmVkTm9kZXMobik/P1tdfX0pfX1leHBvcnR7biBhcyBxdWVyeUFzc2lnbmVkTm9kZXN9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cXVlcnktYXNzaWduZWQtbm9kZXMuanMubWFwXG4iLCJpbXBvcnQge2NzcywgTGl0RWxlbWVudH0gZnJvbSAnbGl0JztcbmltcG9ydCB7dG9vbHRpcCwgdG9vbHRpcFN0eWxlc30gZnJvbSAnLi9jb21tb24vdWkvdG9vbHRpcCc7XG5cbmZ1bmN0aW9uIGNhbWVsVG9EYXNoQ2FzZShzdHI6IHN0cmluZykge1xuICAgIHJldHVybiBzdHJcbiAgICAgICAgLnNwbGl0KC8oPz1bQS1aXSkvKVxuICAgICAgICAuam9pbignLScpXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpO1xufVxuXG4vLyBMaXRFbGVtZW50IHdyYXBwZXIgd2l0aCBhIHByZS1kZXRlcm1pbmVkIHRhZ1xuZXhwb3J0IGNsYXNzIEZsb2F0RWxlbWVudCBleHRlbmRzIExpdEVsZW1lbnQge1xuICAgIHN0YXRpYyBzdHlsZXMgPSBbXG4gICAgICAgIC4uLnRvb2x0aXBTdHlsZXMsXG4gICAgICAgIGNzc2BcbiAgICAgICAgICAgIGhyIHtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMWIyOTM5O1xuICAgICAgICAgICAgICAgIGJvcmRlci1zdHlsZTogc29saWQgbm9uZSBub25lO1xuICAgICAgICAgICAgICAgIGJvcmRlci1jb2xvcjogYmxhY2s7XG4gICAgICAgICAgICAgICAgYm9yZGVyLXdpZHRoOiAxcHggMCAwO1xuICAgICAgICAgICAgICAgIGhlaWdodDogMnB4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhIHtcbiAgICAgICAgICAgICAgICBjb2xvcjogI2ViZWJlYjtcbiAgICAgICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlucHV0W3R5cGU9J3RleHQnXSxcbiAgICAgICAgICAgIGlucHV0W3R5cGU9J3Bhc3N3b3JkJ10sXG4gICAgICAgICAgICBpbnB1dFt0eXBlPSdudW1iZXInXSxcbiAgICAgICAgICAgIHNlbGVjdCB7XG4gICAgICAgICAgICAgICAgY29sb3I6ICM5MDkwOTA7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAwLCAwLCAwLjIpO1xuICAgICAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICMwMDA7XG4gICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogM3B4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dFt0eXBlPSdjb2xvciddIHtcbiAgICAgICAgICAgICAgICBmbG9hdDogbGVmdDtcbiAgICAgICAgICAgICAgICBtYXJnaW4tdG9wOiAycHg7XG4gICAgICAgICAgICAgICAgLXdlYmtpdC1hcHBlYXJhbmNlOiBub25lO1xuICAgICAgICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICAgICAgICB3aWR0aDogMjBweDtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IDIwcHg7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5wdXRbdHlwZT0nY29sb3InXTo6LXdlYmtpdC1jb2xvci1zd2F0Y2gtd3JhcHBlciB7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5wdXRbdHlwZT0nY29sb3InXTo6LXdlYmtpdC1jb2xvci1zd2F0Y2gge1xuICAgICAgICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgYCxcbiAgICBdO1xuXG4gICAgc3RhdGljIHRhZygpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYGNzZmxvYXQtJHtjYW1lbFRvRGFzaENhc2UodGhpcy5uYW1lKX1gO1xuICAgIH1cblxuICAgIHN0YXRpYyBlbGVtKCk6IGFueSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRoaXMudGFnKCkpO1xuICAgIH1cblxuICAgIHRvb2x0aXAobGFiZWw6IHN0cmluZywgZXh0cmFDbGFzc2VzPzogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0b29sdGlwKGxhYmVsLCBleHRyYUNsYXNzZXMpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7Y3NzLCBDU1NSZXN1bHR9IGZyb20gJ2xpdCc7XG5pbXBvcnQge0NoaWxkUGFydCwgZGlyZWN0aXZlLCBEaXJlY3RpdmUsIERpcmVjdGl2ZVBhcmFtZXRlcnN9IGZyb20gJ2xpdC1odG1sL2RpcmVjdGl2ZS5qcyc7XG5pbXBvcnQge2hpbnRjc3N9IGZyb20gJy4uLy4uLy4uLy4uL3RoaXJkcGFydHkvaGludGNzcy9oaW50Y3NzJztcblxuY2xhc3MgVG9vbHRpcERpcmVjdGl2ZSBleHRlbmRzIERpcmVjdGl2ZSB7XG4gICAgcGFyZW50Tm9kZTogRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAgIGxhYmVsID0gJyc7XG4gICAgLy8gRXh0cmEgY2xhc3NlcyB0byBjdXN0b21pemUgdGhlIHRvb2x0aXAuIFNlZSBodHRwczovL2t1c2hhZ3JhLmRldi9sYWIvaGludC8gZm9yIGFsbCBhdmFpbGFibGUgY2xhc3Nlc1xuICAgIGV4dHJhQ2xhc3NlcyA9ICcnO1xuXG4gICAgdXBkYXRlKHBhcnQ6IENoaWxkUGFydCwgW2xhYmVsLCBleHRyYUNsYXNzZXNdOiBEaXJlY3RpdmVQYXJhbWV0ZXJzPHRoaXM+KSB7XG4gICAgICAgIHRoaXMucGFyZW50Tm9kZSA9IHBhcnQucGFyZW50Tm9kZSBhcyBFbGVtZW50O1xuICAgICAgICB0aGlzLmxhYmVsID0gbGFiZWw7XG4gICAgICAgIGlmIChleHRyYUNsYXNzZXMpIHtcbiAgICAgICAgICAgIHRoaXMuZXh0cmFDbGFzc2VzID0gZXh0cmFDbGFzc2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG5ld1BhcmVudENsYXNzID0gYCR7dGhpcy5wYXJlbnROb2RlLmdldEF0dHJpYnV0ZSgnY2xhc3MnKSB8fCAnJ30gaGludC0tdG9wIGhpbnQtLXJvdW5kZWQgaGludC0tbm8tYXJyb3cgJHt0aGlzLmV4dHJhQ2xhc3Nlc31gO1xuXG4gICAgICAgIHRoaXMucGFyZW50Tm9kZS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgbmV3UGFyZW50Q2xhc3MpO1xuICAgICAgICB0aGlzLnBhcmVudE5vZGUuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgdGhpcy5sYWJlbCk7XG4gICAgfVxuXG4gICAgcmVuZGVyKGxhYmVsOiBzdHJpbmcsIGV4dHJhQ2xhc3Nlcz86IHN0cmluZykge31cbn1cblxuZXhwb3J0IGNvbnN0IHRvb2x0aXAgPSBkaXJlY3RpdmUoVG9vbHRpcERpcmVjdGl2ZSk7XG5cbmV4cG9ydCBjb25zdCB0b29sdGlwU3R5bGVzOiBDU1NSZXN1bHRbXSA9IFtcbiAgICBoaW50Y3NzLFxuICAgIGNzc2BcbiAgICAgICAgW2NsYXNzKj0naGludC0tJ11bYXJpYS1sYWJlbF06YWZ0ZXIge1xuICAgICAgICAgICAgdGV4dC1zaGFkb3c6IG5vbmU7XG4gICAgICAgICAgICBmb250LWZhbWlseTogJ01vdGl2YSBTYW5zJywgQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZjtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gICAgICAgICAgICBsaW5lLWhlaWdodDogbm9ybWFsO1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgICAgYmFja2dyb3VuZDogI2MyYzJjMjtcbiAgICAgICAgICAgIGNvbG9yOiAjM2QzZDNmO1xuICAgICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogM3B4O1xuICAgICAgICAgICAgcGFkZGluZzogNXB4O1xuICAgICAgICB9XG4gICAgICAgIC5oaW50LS13aGl0ZXNwYWNlLXByZS13cmFwOmFmdGVyLFxuICAgICAgICAuaGludC0td2hpdGVzcGFjZS1wcmUtd3JhcDpiZWZvcmUge1xuICAgICAgICAgICAgd2hpdGUtc3BhY2U6IHByZS13cmFwO1xuICAgICAgICB9XG4gICAgYCxcbl07XG4iLCIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgMjAxNyBHb29nbGUgTExDXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQlNELTMtQ2xhdXNlXG4gKi9cbmNvbnN0IHQ9e0FUVFJJQlVURToxLENISUxEOjIsUFJPUEVSVFk6MyxCT09MRUFOX0FUVFJJQlVURTo0LEVWRU5UOjUsRUxFTUVOVDo2fSxlPXQ9PiguLi5lKT0+KHtfJGxpdERpcmVjdGl2ZSQ6dCx2YWx1ZXM6ZX0pO2NsYXNzIGl7Y29uc3RydWN0b3IodCl7fWdldCBfJEFVKCl7cmV0dXJuIHRoaXMuXyRBTS5fJEFVfV8kQVQodCxlLGkpe3RoaXMuXyRDdD10LHRoaXMuXyRBTT1lLHRoaXMuXyRDaT1pfV8kQVModCxlKXtyZXR1cm4gdGhpcy51cGRhdGUodCxlKX11cGRhdGUodCxlKXtyZXR1cm4gdGhpcy5yZW5kZXIoLi4uZSl9fWV4cG9ydHtpIGFzIERpcmVjdGl2ZSx0IGFzIFBhcnRUeXBlLGUgYXMgZGlyZWN0aXZlfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRpcmVjdGl2ZS5qcy5tYXBcbiIsImltcG9ydCB7Y3NzfSBmcm9tICdsaXQnO1xuZXhwb3J0IGNvbnN0IGhpbnRjc3MgPSBjc3NgXG4gICAgLyohIEhpbnQuY3NzIC0gdjMuMC4wIC0gMjAyMy0xMS0yOVxuKiBodHRwczovL2t1c2hhZ3JhLmRldi9sYWIvaGludC9cbiogQ29weXJpZ2h0IChjKSAyMDIzIEt1c2hhZ3JhIEdvdXIgKi9cblxuICAgIFtjbGFzcyo9J2hpbnQtLSddIHtcbiAgICAgICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gICAgfVxuICAgIFtjbGFzcyo9J2hpbnQtLSddOmFmdGVyLFxuICAgIFtjbGFzcyo9J2hpbnQtLSddOmJlZm9yZSB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLCAwLCAwKTtcbiAgICAgICAgdmlzaWJpbGl0eTogaGlkZGVuO1xuICAgICAgICBvcGFjaXR5OiAwO1xuICAgICAgICB6LWluZGV4OiAxMDAwMDAwO1xuICAgICAgICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgICAgICAgdHJhbnNpdGlvbjogMC4zcyBlYXNlO1xuICAgICAgICB0cmFuc2l0aW9uLWRlbGF5OiAwcztcbiAgICB9XG4gICAgW2NsYXNzKj0naGludC0tJ106aG92ZXI6YWZ0ZXIsXG4gICAgW2NsYXNzKj0naGludC0tJ106aG92ZXI6YmVmb3JlIHtcbiAgICAgICAgdmlzaWJpbGl0eTogdmlzaWJsZTtcbiAgICAgICAgb3BhY2l0eTogMTtcbiAgICAgICAgdHJhbnNpdGlvbi1kZWxheTogMC4xcztcbiAgICB9XG4gICAgW2NsYXNzKj0naGludC0tJ106YmVmb3JlIHtcbiAgICAgICAgY29udGVudDogJyc7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgYmFja2dyb3VuZDogIzM4MzgzODtcbiAgICAgICAgYm9yZGVyOiA2cHggc29saWQgdHJhbnNwYXJlbnQ7XG4gICAgICAgIGNsaXAtcGF0aDogcG9seWdvbigwIDAsIDEwMCUgMCwgMTAwJSAxMDAlKTtcbiAgICAgICAgei1pbmRleDogMTAwMDAwMTtcbiAgICB9XG4gICAgW2NsYXNzKj0naGludC0tJ106YWZ0ZXIge1xuICAgICAgICBiYWNrZ3JvdW5kOiAjMzgzODM4O1xuICAgICAgICBjb2xvcjogI2ZmZjtcbiAgICAgICAgcGFkZGluZzogOHB4IDEwcHg7XG4gICAgICAgIGZvbnQtc2l6ZTogMXJlbTtcbiAgICAgICAgZm9udC1mYW1pbHk6ICdIZWx2ZXRpY2EgTmV1ZScsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWY7XG4gICAgICAgIGxpbmUtaGVpZ2h0OiAxcmVtO1xuICAgICAgICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICAgICAgICB0ZXh0LXNoYWRvdzogMCAxcHggMCAjMDAwO1xuICAgICAgICBib3gtc2hhZG93OiA0cHggNHB4IDhweCByZ2JhKDAsIDAsIDAsIDAuMyk7XG4gICAgfVxuICAgIC5oaW50LS1lcnJvcjphZnRlcixcbiAgICAuaGludC0tZXJyb3I6YmVmb3JlIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2IyNGU0YztcbiAgICB9XG4gICAgW2NsYXNzKj0naGludC0tJ11bYXJpYS1sYWJlbF06YWZ0ZXIge1xuICAgICAgICBjb250ZW50OiBhdHRyKGFyaWEtbGFiZWwpO1xuICAgIH1cbiAgICBbY2xhc3MqPSdoaW50LS0nXVtkYXRhLWhpbnRdOmFmdGVyIHtcbiAgICAgICAgY29udGVudDogYXR0cihkYXRhLWhpbnQpO1xuICAgIH1cbiAgICBbYXJpYS1sYWJlbD0nJ106YWZ0ZXIsXG4gICAgW2FyaWEtbGFiZWw9JyddOmJlZm9yZSxcbiAgICBbZGF0YS1oaW50PScnXTphZnRlcixcbiAgICBbZGF0YS1oaW50PScnXTpiZWZvcmUge1xuICAgICAgICBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7XG4gICAgfVxuICAgIC5oaW50LS10b3Age1xuICAgICAgICAtLXJvdGF0aW9uOiAxMzVkZWc7XG4gICAgfVxuICAgIC5oaW50LS10b3A6YWZ0ZXIsXG4gICAgLmhpbnQtLXRvcDpiZWZvcmUge1xuICAgICAgICBib3R0b206IDEwMCU7XG4gICAgICAgIGxlZnQ6IDUwJTtcbiAgICB9XG4gICAgLmhpbnQtLXRvcDpiZWZvcmUge1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAtNS41cHg7XG4gICAgICAgIHRyYW5zZm9ybTogcm90YXRlKHZhcigtLXJvdGF0aW9uKSk7XG4gICAgICAgIGxlZnQ6IGNhbGMoNTAlIC0gNnB4KTtcbiAgICB9XG4gICAgLmhpbnQtLXRvcDphZnRlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKTtcbiAgICB9XG4gICAgLmhpbnQtLXRvcDpob3ZlcjpiZWZvcmUge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLThweCkgcm90YXRlKHZhcigtLXJvdGF0aW9uKSk7XG4gICAgfVxuICAgIC5oaW50LS10b3A6aG92ZXI6YWZ0ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtOHB4KTtcbiAgICB9XG4gICAgLmhpbnQtLWJvdHRvbSB7XG4gICAgICAgIC0tcm90YXRpb246IC00NWRlZztcbiAgICB9XG4gICAgLmhpbnQtLWJvdHRvbTphZnRlcixcbiAgICAuaGludC0tYm90dG9tOmJlZm9yZSB7XG4gICAgICAgIHRvcDogMTAwJTtcbiAgICAgICAgbGVmdDogNTAlO1xuICAgIH1cbiAgICAuaGludC0tYm90dG9tOmJlZm9yZSB7XG4gICAgICAgIG1hcmdpbi10b3A6IC01LjVweDtcbiAgICAgICAgdHJhbnNmb3JtOiByb3RhdGUodmFyKC0tcm90YXRpb24pKTtcbiAgICAgICAgbGVmdDogY2FsYyg1MCUgLSA2cHgpO1xuICAgIH1cbiAgICAuaGludC0tYm90dG9tOmFmdGVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpO1xuICAgIH1cbiAgICAuaGludC0tYm90dG9tOmhvdmVyOmJlZm9yZSB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSg4cHgpIHJvdGF0ZSh2YXIoLS1yb3RhdGlvbikpO1xuICAgIH1cbiAgICAuaGludC0tYm90dG9tOmhvdmVyOmFmdGVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoOHB4KTtcbiAgICB9XG4gICAgLmhpbnQtLXJpZ2h0IHtcbiAgICAgICAgLS1yb3RhdGlvbjogLTEzNWRlZztcbiAgICB9XG4gICAgLmhpbnQtLXJpZ2h0OmJlZm9yZSB7XG4gICAgICAgIG1hcmdpbi1sZWZ0OiAtNS41cHg7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IC02cHg7XG4gICAgICAgIHRyYW5zZm9ybTogcm90YXRlKHZhcigtLXJvdGF0aW9uKSk7XG4gICAgfVxuICAgIC5oaW50LS1yaWdodDphZnRlciB7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IGNhbGMoLTEgKiAoMXJlbSArIDE2cHgpIC8gMik7XG4gICAgfVxuICAgIC5oaW50LS1yaWdodDphZnRlcixcbiAgICAuaGludC0tcmlnaHQ6YmVmb3JlIHtcbiAgICAgICAgbGVmdDogMTAwJTtcbiAgICAgICAgYm90dG9tOiA1MCU7XG4gICAgfVxuICAgIC5oaW50LS1yaWdodDpob3ZlcjpiZWZvcmUge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoOHB4KSByb3RhdGUodmFyKC0tcm90YXRpb24pKTtcbiAgICB9XG4gICAgLmhpbnQtLXJpZ2h0OmhvdmVyOmFmdGVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDhweCk7XG4gICAgfVxuICAgIC5oaW50LS1sZWZ0IHtcbiAgICAgICAgLS1yb3RhdGlvbjogNDVkZWc7XG4gICAgfVxuICAgIC5oaW50LS1sZWZ0OmJlZm9yZSB7XG4gICAgICAgIG1hcmdpbi1yaWdodDogLTUuNXB4O1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAtNnB4O1xuICAgICAgICB0cmFuc2Zvcm06IHJvdGF0ZSh2YXIoLS1yb3RhdGlvbikpO1xuICAgIH1cbiAgICAuaGludC0tbGVmdDphZnRlciB7XG4gICAgICAgIG1hcmdpbi1ib3R0b206IGNhbGMoLTEgKiAoMXJlbSArIDE2cHgpIC8gMik7XG4gICAgfVxuICAgIC5oaW50LS1sZWZ0OmFmdGVyLFxuICAgIC5oaW50LS1sZWZ0OmJlZm9yZSB7XG4gICAgICAgIHJpZ2h0OiAxMDAlO1xuICAgICAgICBib3R0b206IDUwJTtcbiAgICB9XG4gICAgLmhpbnQtLWxlZnQ6aG92ZXI6YmVmb3JlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC04cHgpIHJvdGF0ZSh2YXIoLS1yb3RhdGlvbikpO1xuICAgIH1cbiAgICAuaGludC0tbGVmdDpob3ZlcjphZnRlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtOHB4KTtcbiAgICB9XG4gICAgLmhpbnQtLXRvcC1sZWZ0IHtcbiAgICAgICAgLS1yb3RhdGlvbjogMTM1ZGVnO1xuICAgIH1cbiAgICAuaGludC0tdG9wLWxlZnQ6YWZ0ZXIsXG4gICAgLmhpbnQtLXRvcC1sZWZ0OmJlZm9yZSB7XG4gICAgICAgIGJvdHRvbTogMTAwJTtcbiAgICAgICAgbGVmdDogNTAlO1xuICAgIH1cbiAgICAuaGludC0tdG9wLWxlZnQ6YmVmb3JlIHtcbiAgICAgICAgbWFyZ2luLWJvdHRvbTogLTUuNXB4O1xuICAgICAgICB0cmFuc2Zvcm06IHJvdGF0ZSh2YXIoLS1yb3RhdGlvbikpO1xuICAgICAgICBsZWZ0OiBjYWxjKDUwJSAtIDZweCk7XG4gICAgfVxuICAgIC5oaW50LS10b3AtbGVmdDphZnRlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtMTAwJSk7XG4gICAgICAgIG1hcmdpbi1sZWZ0OiAxMnB4O1xuICAgIH1cbiAgICAuaGludC0tdG9wLWxlZnQ6aG92ZXI6YmVmb3JlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC04cHgpIHJvdGF0ZSh2YXIoLS1yb3RhdGlvbikpO1xuICAgIH1cbiAgICAuaGludC0tdG9wLWxlZnQ6aG92ZXI6YWZ0ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTEwMCUpIHRyYW5zbGF0ZVkoLThweCk7XG4gICAgfVxuICAgIC5oaW50LS10b3AtcmlnaHQge1xuICAgICAgICAtLXJvdGF0aW9uOiAxMzVkZWc7XG4gICAgfVxuICAgIC5oaW50LS10b3AtcmlnaHQ6YWZ0ZXIsXG4gICAgLmhpbnQtLXRvcC1yaWdodDpiZWZvcmUge1xuICAgICAgICBib3R0b206IDEwMCU7XG4gICAgICAgIGxlZnQ6IDUwJTtcbiAgICB9XG4gICAgLmhpbnQtLXRvcC1yaWdodDpiZWZvcmUge1xuICAgICAgICBtYXJnaW4tYm90dG9tOiAtNS41cHg7XG4gICAgICAgIHRyYW5zZm9ybTogcm90YXRlKHZhcigtLXJvdGF0aW9uKSk7XG4gICAgICAgIGxlZnQ6IGNhbGMoNTAlIC0gNnB4KTtcbiAgICB9XG4gICAgLmhpbnQtLXRvcC1yaWdodDphZnRlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgwKTtcbiAgICAgICAgbWFyZ2luLWxlZnQ6IC0xMnB4O1xuICAgIH1cbiAgICAuaGludC0tdG9wLXJpZ2h0OmhvdmVyOmJlZm9yZSB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtOHB4KSByb3RhdGUodmFyKC0tcm90YXRpb24pKTtcbiAgICB9XG4gICAgLmhpbnQtLXRvcC1yaWdodDpob3ZlcjphZnRlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtOHB4KTtcbiAgICB9XG4gICAgLmhpbnQtLWJvdHRvbS1sZWZ0IHtcbiAgICAgICAgLS1yb3RhdGlvbjogLTQ1ZGVnO1xuICAgIH1cbiAgICAuaGludC0tYm90dG9tLWxlZnQ6YWZ0ZXIsXG4gICAgLmhpbnQtLWJvdHRvbS1sZWZ0OmJlZm9yZSB7XG4gICAgICAgIHRvcDogMTAwJTtcbiAgICAgICAgbGVmdDogNTAlO1xuICAgIH1cbiAgICAuaGludC0tYm90dG9tLWxlZnQ6YmVmb3JlIHtcbiAgICAgICAgbWFyZ2luLXRvcDogLTUuNXB4O1xuICAgICAgICB0cmFuc2Zvcm06IHJvdGF0ZSh2YXIoLS1yb3RhdGlvbikpO1xuICAgICAgICBsZWZ0OiBjYWxjKDUwJSAtIDZweCk7XG4gICAgfVxuICAgIC5oaW50LS1ib3R0b20tbGVmdDphZnRlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtMTAwJSk7XG4gICAgICAgIG1hcmdpbi1sZWZ0OiAxMnB4O1xuICAgIH1cbiAgICAuaGludC0tYm90dG9tLWxlZnQ6aG92ZXI6YmVmb3JlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDhweCkgcm90YXRlKHZhcigtLXJvdGF0aW9uKSk7XG4gICAgfVxuICAgIC5oaW50LS1ib3R0b20tbGVmdDpob3ZlcjphZnRlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgtMTAwJSkgdHJhbnNsYXRlWSg4cHgpO1xuICAgIH1cbiAgICAuaGludC0tYm90dG9tLXJpZ2h0IHtcbiAgICAgICAgLS1yb3RhdGlvbjogLTQ1ZGVnO1xuICAgIH1cbiAgICAuaGludC0tYm90dG9tLXJpZ2h0OmFmdGVyLFxuICAgIC5oaW50LS1ib3R0b20tcmlnaHQ6YmVmb3JlIHtcbiAgICAgICAgdG9wOiAxMDAlO1xuICAgICAgICBsZWZ0OiA1MCU7XG4gICAgfVxuICAgIC5oaW50LS1ib3R0b20tcmlnaHQ6YmVmb3JlIHtcbiAgICAgICAgbWFyZ2luLXRvcDogLTUuNXB4O1xuICAgICAgICB0cmFuc2Zvcm06IHJvdGF0ZSh2YXIoLS1yb3RhdGlvbikpO1xuICAgICAgICBsZWZ0OiBjYWxjKDUwJSAtIDZweCk7XG4gICAgfVxuICAgIC5oaW50LS1ib3R0b20tcmlnaHQ6YWZ0ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMCk7XG4gICAgICAgIG1hcmdpbi1sZWZ0OiAtMTJweDtcbiAgICB9XG4gICAgLmhpbnQtLWJvdHRvbS1yaWdodDpob3ZlcjpiZWZvcmUge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoOHB4KSByb3RhdGUodmFyKC0tcm90YXRpb24pKTtcbiAgICB9XG4gICAgLmhpbnQtLWJvdHRvbS1yaWdodDpob3ZlcjphZnRlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSg4cHgpO1xuICAgIH1cbiAgICAuaGludC0tZml0OmFmdGVyLFxuICAgIC5oaW50LS1sYXJnZTphZnRlcixcbiAgICAuaGludC0tbWVkaXVtOmFmdGVyLFxuICAgIC5oaW50LS1zbWFsbDphZnRlciB7XG4gICAgICAgIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gICAgICAgIHdoaXRlLXNwYWNlOiBub3JtYWw7XG4gICAgICAgIGxpbmUtaGVpZ2h0OiAxLjRlbTtcbiAgICAgICAgd29yZC13cmFwOiBicmVhay13b3JkO1xuICAgIH1cbiAgICAuaGludC0tc21hbGw6YWZ0ZXIge1xuICAgICAgICB3aWR0aDogODBweDtcbiAgICB9XG4gICAgLmhpbnQtLW1lZGl1bTphZnRlciB7XG4gICAgICAgIHdpZHRoOiAxNTBweDtcbiAgICB9XG4gICAgLmhpbnQtLWxhcmdlOmFmdGVyIHtcbiAgICAgICAgd2lkdGg6IDMwMHB4O1xuICAgIH1cbiAgICAuaGludC0tZml0OmFmdGVyIHtcbiAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgfVxuICAgIC5oaW50LS1lcnJvcjphZnRlciB7XG4gICAgICAgIHRleHQtc2hhZG93OiAwIDFweCAwICM1OTI3MjY7XG4gICAgfVxuICAgIC5oaW50LS13YXJuaW5nOmFmdGVyLFxuICAgIC5oaW50LS13YXJuaW5nOmJlZm9yZSB7XG4gICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNiZjk4NTM7XG4gICAgfVxuICAgIC5oaW50LS13YXJuaW5nOmFmdGVyIHtcbiAgICAgICAgdGV4dC1zaGFkb3c6IDAgMXB4IDAgIzZjNTMyODtcbiAgICB9XG4gICAgLmhpbnQtLWluZm86YWZ0ZXIsXG4gICAgLmhpbnQtLWluZm86YmVmb3JlIHtcbiAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzM5ODVhYztcbiAgICB9XG4gICAgLmhpbnQtLWluZm86YWZ0ZXIge1xuICAgICAgICB0ZXh0LXNoYWRvdzogMCAxcHggMCAjMWEzYzRkO1xuICAgIH1cbiAgICAuaGludC0tc3VjY2VzczphZnRlcixcbiAgICAuaGludC0tc3VjY2VzczpiZWZvcmUge1xuICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjNDU4NjQ2O1xuICAgIH1cbiAgICAuaGludC0tc3VjY2VzczphZnRlciB7XG4gICAgICAgIHRleHQtc2hhZG93OiAwIDFweCAwICMxYTMyMWE7XG4gICAgfVxuICAgIC5oaW50LS1hbHdheXM6YWZ0ZXIsXG4gICAgLmhpbnQtLWFsd2F5czpiZWZvcmUge1xuICAgICAgICBvcGFjaXR5OiAxO1xuICAgICAgICB2aXNpYmlsaXR5OiB2aXNpYmxlO1xuICAgIH1cbiAgICAuaGludC0tYWx3YXlzLmhpbnQtLXRvcDpiZWZvcmUge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLThweCkgcm90YXRlKHZhcigtLXJvdGF0aW9uKSk7XG4gICAgfVxuICAgIC5oaW50LS1hbHdheXMuaGludC0tdG9wOmFmdGVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLThweCk7XG4gICAgfVxuICAgIC5oaW50LS1hbHdheXMuaGludC0tdG9wLWxlZnQ6YmVmb3JlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC04cHgpIHJvdGF0ZSh2YXIoLS1yb3RhdGlvbikpO1xuICAgIH1cbiAgICAuaGludC0tYWx3YXlzLmhpbnQtLXRvcC1sZWZ0OmFmdGVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC0xMDAlKSB0cmFuc2xhdGVZKC04cHgpO1xuICAgIH1cbiAgICAuaGludC0tYWx3YXlzLmhpbnQtLXRvcC1yaWdodDpiZWZvcmUge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLThweCkgcm90YXRlKHZhcigtLXJvdGF0aW9uKSk7XG4gICAgfVxuICAgIC5oaW50LS1hbHdheXMuaGludC0tdG9wLXJpZ2h0OmFmdGVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC04cHgpO1xuICAgIH1cbiAgICAuaGludC0tYWx3YXlzLmhpbnQtLWJvdHRvbTpiZWZvcmUge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoOHB4KSByb3RhdGUodmFyKC0tcm90YXRpb24pKTtcbiAgICB9XG4gICAgLmhpbnQtLWFsd2F5cy5oaW50LS1ib3R0b206YWZ0ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSg4cHgpO1xuICAgIH1cbiAgICAuaGludC0tYWx3YXlzLmhpbnQtLWJvdHRvbS1sZWZ0OmJlZm9yZSB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSg4cHgpIHJvdGF0ZSh2YXIoLS1yb3RhdGlvbikpO1xuICAgIH1cbiAgICAuaGludC0tYWx3YXlzLmhpbnQtLWJvdHRvbS1sZWZ0OmFmdGVyIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC0xMDAlKSB0cmFuc2xhdGVZKDhweCk7XG4gICAgfVxuICAgIC5oaW50LS1hbHdheXMuaGludC0tYm90dG9tLXJpZ2h0OmJlZm9yZSB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSg4cHgpIHJvdGF0ZSh2YXIoLS1yb3RhdGlvbikpO1xuICAgIH1cbiAgICAuaGludC0tYWx3YXlzLmhpbnQtLWJvdHRvbS1yaWdodDphZnRlciB7XG4gICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSg4cHgpO1xuICAgIH1cbiAgICAuaGludC0tYWx3YXlzLmhpbnQtLWxlZnQ6YmVmb3JlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKC04cHgpIHJvdGF0ZSh2YXIoLS1yb3RhdGlvbikpO1xuICAgIH1cbiAgICAuaGludC0tYWx3YXlzLmhpbnQtLWxlZnQ6YWZ0ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLThweCk7XG4gICAgfVxuICAgIC5oaW50LS1hbHdheXMuaGludC0tcmlnaHQ6YmVmb3JlIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDhweCkgcm90YXRlKHZhcigtLXJvdGF0aW9uKSk7XG4gICAgfVxuICAgIC5oaW50LS1hbHdheXMuaGludC0tcmlnaHQ6YWZ0ZXIge1xuICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoOHB4KTtcbiAgICB9XG4gICAgLmhpbnQtLXJvdW5kZWQ6YmVmb3JlIHtcbiAgICAgICAgYm9yZGVyLXJhZGl1czogMCA0cHggMCAwO1xuICAgIH1cbiAgICAuaGludC0tcm91bmRlZDphZnRlciB7XG4gICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICB9XG4gICAgLmhpbnQtLW5vLWFuaW1hdGU6YWZ0ZXIsXG4gICAgLmhpbnQtLW5vLWFuaW1hdGU6YmVmb3JlIHtcbiAgICAgICAgdHJhbnNpdGlvbi1kdXJhdGlvbjogMHM7XG4gICAgfVxuICAgIC5oaW50LS1ib3VuY2U6YWZ0ZXIsXG4gICAgLmhpbnQtLWJvdW5jZTpiZWZvcmUge1xuICAgICAgICB0cmFuc2l0aW9uOlxuICAgICAgICAgICAgb3BhY2l0eSAwLjNzIGVhc2UsXG4gICAgICAgICAgICB2aXNpYmlsaXR5IDAuM3MgZWFzZSxcbiAgICAgICAgICAgIHRyYW5zZm9ybSAwLjNzIGN1YmljLWJlemllcigwLjcxLCAxLjcsIDAuNzcsIDEuMjQpO1xuICAgIH1cbiAgICBAc3VwcG9ydHMgKHRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uOiBsaW5lYXIoMCwgMSkpIHtcbiAgICAgICAgLmhpbnQtLWJvdW5jZTphZnRlcixcbiAgICAgICAgLmhpbnQtLWJvdW5jZTpiZWZvcmUge1xuICAgICAgICAgICAgLS1zcHJpbmctZWFzaW5nOiBsaW5lYXIoXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLjAwOSxcbiAgICAgICAgICAgICAgICAwLjAzNSAyLjElLFxuICAgICAgICAgICAgICAgIDAuMTQxIDQuNCUsXG4gICAgICAgICAgICAgICAgMC43MjMgMTIuOSUsXG4gICAgICAgICAgICAgICAgMC45MzgsXG4gICAgICAgICAgICAgICAgMS4wNzcgMjAuNCUsXG4gICAgICAgICAgICAgICAgMS4xMjEsXG4gICAgICAgICAgICAgICAgMS4xNDkgMjQuMyUsXG4gICAgICAgICAgICAgICAgMS4xNTksXG4gICAgICAgICAgICAgICAgMS4xNjMgMjclLFxuICAgICAgICAgICAgICAgIDEuMTU0LFxuICAgICAgICAgICAgICAgIDEuMTI5IDMyLjglLFxuICAgICAgICAgICAgICAgIDEuMDUxIDM5LjYlLFxuICAgICAgICAgICAgICAgIDEuMDE3IDQzLjElLFxuICAgICAgICAgICAgICAgIDAuOTkxLFxuICAgICAgICAgICAgICAgIDAuOTc3IDUxJSxcbiAgICAgICAgICAgICAgICAwLjk3NSA1Ny4xJSxcbiAgICAgICAgICAgICAgICAwLjk5NyA2OS44JSxcbiAgICAgICAgICAgICAgICAxLjAwMyA3Ni45JSxcbiAgICAgICAgICAgICAgICAxXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdHJhbnNpdGlvbjpcbiAgICAgICAgICAgICAgICBvcGFjaXR5IDAuM3MgZWFzZSxcbiAgICAgICAgICAgICAgICB2aXNpYmlsaXR5IDAuM3MgZWFzZSxcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gMC41cyB2YXIoLS1zcHJpbmctZWFzaW5nKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAuaGludC0tbm8tc2hhZG93OmFmdGVyLFxuICAgIC5oaW50LS1uby1zaGFkb3c6YmVmb3JlIHtcbiAgICAgICAgdGV4dC1zaGFkb3c6IGluaXRpYWw7XG4gICAgICAgIGJveC1zaGFkb3c6IGluaXRpYWw7XG4gICAgfVxuICAgIC5oaW50LS1uby1hcnJvdzpiZWZvcmUge1xuICAgICAgICBkaXNwbGF5OiBub25lO1xuICAgIH1cbmA7XG4iLCJpbXBvcnQge2NzcywgaHRtbH0gZnJvbSAnbGl0JztcbmltcG9ydCB7Y2xhc3NNYXB9IGZyb20gJ2xpdC1odG1sL2RpcmVjdGl2ZXMvY2xhc3MtbWFwLmpzJztcblxuaW1wb3J0IHtwcm9wZXJ0eX0gZnJvbSAnbGl0L2RlY29yYXRvcnMuanMnO1xuaW1wb3J0IHtDdXN0b21FbGVtZW50fSBmcm9tICcuLi8uLi9pbmplY3RvcnMnO1xuaW1wb3J0IHtGbG9hdEVsZW1lbnR9IGZyb20gJy4uLy4uL2N1c3RvbSc7XG5cbmVudW0gQnV0dG9uVHlwZSB7XG4gICAgR3JlZW5XaGl0ZSA9ICdncmVlbl93aGl0ZScsXG4gICAgR3JleVdoaXRlID0gJ2dyZXlfd2hpdGUnLFxufVxuXG5AQ3VzdG9tRWxlbWVudCgpXG5leHBvcnQgY2xhc3MgU3RlYW1CdXR0b24gZXh0ZW5kcyBGbG9hdEVsZW1lbnQge1xuICAgIEBwcm9wZXJ0eSh7dHlwZTogU3RyaW5nfSlcbiAgICBwcml2YXRlIHRleHQ6IHN0cmluZyA9ICcnO1xuXG4gICAgQHByb3BlcnR5KHt0eXBlOiBTdHJpbmd9KVxuICAgIHByaXZhdGUgdHlwZTogQnV0dG9uVHlwZSA9IEJ1dHRvblR5cGUuR3JlZW5XaGl0ZTtcblxuICAgIEBwcm9wZXJ0eSh7dHlwZTogQm9vbGVhbn0pXG4gICAgcHJpdmF0ZSBkaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgc3RhdGljIHN0eWxlcyA9IFtcbiAgICAgICAgLi4uRmxvYXRFbGVtZW50LnN0eWxlcyxcbiAgICAgICAgY3NzYFxuICAgICAgICAgICAgLmJ0bl9ncmVlbl93aGl0ZV9pbm5lcmZhZGUge1xuICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDJweDtcbiAgICAgICAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogMXB4O1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICAgICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgY29sb3I6ICNkMmU4ODUgIWltcG9ydGFudDtcblxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICNhNGQwMDc7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogLXdlYmtpdC1saW5lYXItZ3JhZGllbnQodG9wLCAjYTRkMDA3IDUlLCAjNTM2OTA0IDk1JSk7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgI2E0ZDAwNyA1JSwgIzUzNjkwNCA5NSUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAuYnRuX2dyZWVuX3doaXRlX2lubmVyZmFkZSA+IHNwYW4ge1xuICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDJweDtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcblxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICM3OTk5MDU7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogLXdlYmtpdC1saW5lYXItZ3JhZGllbnQodG9wLCAjNzk5OTA1IDUlLCAjNTM2OTA0IDk1JSk7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgIzc5OTkwNSA1JSwgIzUzNjkwNCA5NSUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAuYnRuX2dyZWVuX3doaXRlX2lubmVyZmFkZTpub3QoLmJ0bl9kaXNhYmxlZCk6bm90KDpkaXNhYmxlZCk6bm90KC5idG5fYWN0aXZlKTpub3QoLmFjdGl2ZSk6aG92ZXIge1xuICAgICAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZSAhaW1wb3J0YW50O1xuICAgICAgICAgICAgICAgIGNvbG9yOiAjZmZmICFpbXBvcnRhbnQ7XG5cbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAjYjZkOTA4O1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IC13ZWJraXQtbGluZWFyLWdyYWRpZW50KHRvcCwgI2I2ZDkwOCA1JSwgIzgwYTAwNiA5NSUpO1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sICNiNmQ5MDggNSUsICM4MGEwMDYgOTUlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLmJ0bl9ncmVlbl93aGl0ZV9pbm5lcmZhZGU6bm90KC5idG5fZGlzYWJsZWQpOm5vdCg6ZGlzYWJsZWQpOm5vdCguYnRuX2FjdGl2ZSk6bm90KC5hY3RpdmUpOmhvdmVyID4gc3BhbiB7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogI2ExYmYwNztcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAtd2Via2l0LWxpbmVhci1ncmFkaWVudCh0b3AsICNhMWJmMDcgNSUsICM4MGEwMDYgOTUlKTtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAjYTFiZjA3IDUlLCAjODBhMDA2IDk1JSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC5idG5fZ3JleV93aGl0ZV9pbm5lcmZhZGUge1xuICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDJweDtcbiAgICAgICAgICAgICAgICBib3JkZXI6IG5vbmU7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogMXB4O1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICAgICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiBub25lICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICAgICAgY29sb3I6ICNmZmYgIWltcG9ydGFudDtcblxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICNhY2I1YmQ7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogLXdlYmtpdC1saW5lYXItZ3JhZGllbnQodG9wLCAjYWNiNWJkIDUlLCAjNDE0YTUyIDk1JSk7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHRvIGJvdHRvbSwgI2FjYjViZCA1JSwgIzQxNGE1MiA5NSUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAuYnRuX2dyZXlfd2hpdGVfaW5uZXJmYWRlID4gc3BhbiB7XG4gICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMnB4O1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogIzc3ODA4ODtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAtd2Via2l0LWxpbmVhci1ncmFkaWVudCh0b3AsICM3NzgwODggNSUsICM0MTRhNTIgOTUlKTtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAjNzc4MDg4IDUlLCAjNDE0YTUyIDk1JSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC5idG5fZ3JleV93aGl0ZV9pbm5lcmZhZGU6bm90KC5idG5fZGlzYWJsZWQpOm5vdCg6ZGlzYWJsZWQpOm5vdCguYnRuX2FjdGl2ZSk6bm90KC5hY3RpdmUpOmhvdmVyIHtcbiAgICAgICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmUgIWltcG9ydGFudDtcbiAgICAgICAgICAgICAgICBjb2xvcjogI2ZmZiAhaW1wb3J0YW50O1xuXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogI2NmZDhlMDtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAtd2Via2l0LWxpbmVhci1ncmFkaWVudCh0b3AsICNjZmQ4ZTAgNSUsICM1NjVmNjcgOTUlKTtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAjY2ZkOGUwIDUlLCAjNTY1ZjY3IDk1JSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC5idG5fZ3JleV93aGl0ZV9pbm5lcmZhZGU6bm90KC5idG5fZGlzYWJsZWQpOm5vdCg6ZGlzYWJsZWQpOm5vdCguYnRuX2FjdGl2ZSk6bm90KC5hY3RpdmUpOmhvdmVyID4gc3BhbiB7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogIzk5YTJhYTtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAtd2Via2l0LWxpbmVhci1ncmFkaWVudCh0b3AsICM5OWEyYWEgNSUsICM1NjVmNjcgOTUlKTtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAjOTlhMmFhIDUlLCAjNTY1ZjY3IDk1JSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC5idG5fc21hbGwgPiBzcGFuIHtcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAwIDE1cHg7XG4gICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiAyMHB4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAuYnRuX2Rpc2FibGVkIHtcbiAgICAgICAgICAgICAgICBjdXJzb3I6IGRlZmF1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIGAsXG4gICAgXTtcblxuICAgIGFzeW5jIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgIH1cblxuICAgIGJ0bkNsYXNzKCkge1xuICAgICAgICBjb25zdCByOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0gPSB7YnRuX3NtYWxsOiB0cnVlfTtcbiAgICAgICAgcltgYnRuXyR7dGhpcy50eXBlfV9pbm5lcmZhZGVgXSA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSB7XG4gICAgICAgICAgICByLmJ0bl9kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsYXNzTWFwKHIpO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIGh0bWxgXG4gICAgICAgICAgICA8YSBjbGFzcz1cIiR7dGhpcy5idG5DbGFzcygpfVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPiR7dGhpcy50ZXh0fTwvc3Bhbj5cbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgYDtcbiAgICB9XG59XG4iLCJpbXBvcnR7bm9DaGFuZ2UgYXMgdH1mcm9tXCIuLi9saXQtaHRtbC5qc1wiO2ltcG9ydHtkaXJlY3RpdmUgYXMgcyxEaXJlY3RpdmUgYXMgaSxQYXJ0VHlwZSBhcyByfWZyb21cIi4uL2RpcmVjdGl2ZS5qc1wiO1xuLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IDIwMTggR29vZ2xlIExMQ1xuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEJTRC0zLUNsYXVzZVxuICovY29uc3QgZT1zKGNsYXNzIGV4dGVuZHMgaXtjb25zdHJ1Y3Rvcih0KXtpZihzdXBlcih0KSx0LnR5cGUhPT1yLkFUVFJJQlVURXx8XCJjbGFzc1wiIT09dC5uYW1lfHx0LnN0cmluZ3M/Lmxlbmd0aD4yKXRocm93IEVycm9yKFwiYGNsYXNzTWFwKClgIGNhbiBvbmx5IGJlIHVzZWQgaW4gdGhlIGBjbGFzc2AgYXR0cmlidXRlIGFuZCBtdXN0IGJlIHRoZSBvbmx5IHBhcnQgaW4gdGhlIGF0dHJpYnV0ZS5cIil9cmVuZGVyKHQpe3JldHVyblwiIFwiK09iamVjdC5rZXlzKHQpLmZpbHRlcigocz0+dFtzXSkpLmpvaW4oXCIgXCIpK1wiIFwifXVwZGF0ZShzLFtpXSl7aWYodm9pZCAwPT09dGhpcy5zdCl7dGhpcy5zdD1uZXcgU2V0LHZvaWQgMCE9PXMuc3RyaW5ncyYmKHRoaXMubnQ9bmV3IFNldChzLnN0cmluZ3Muam9pbihcIiBcIikuc3BsaXQoL1xccy8pLmZpbHRlcigodD0+XCJcIiE9PXQpKSkpO2Zvcihjb25zdCB0IGluIGkpaVt0XSYmIXRoaXMubnQ/Lmhhcyh0KSYmdGhpcy5zdC5hZGQodCk7cmV0dXJuIHRoaXMucmVuZGVyKGkpfWNvbnN0IHI9cy5lbGVtZW50LmNsYXNzTGlzdDtmb3IoY29uc3QgdCBvZiB0aGlzLnN0KXQgaW4gaXx8KHIucmVtb3ZlKHQpLHRoaXMuc3QuZGVsZXRlKHQpKTtmb3IoY29uc3QgdCBpbiBpKXtjb25zdCBzPSEhaVt0XTtzPT09dGhpcy5zdC5oYXModCl8fHRoaXMubnQ/Lmhhcyh0KXx8KHM/KHIuYWRkKHQpLHRoaXMuc3QuYWRkKHQpKTooci5yZW1vdmUodCksdGhpcy5zdC5kZWxldGUodCkpKX1yZXR1cm4gdH19KTtleHBvcnR7ZSBhcyBjbGFzc01hcH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jbGFzcy1tYXAuanMubWFwXG4iLCJleHBvcnQgY29uc3QgZW52aXJvbm1lbnQgPSB7XG4gICAgY3NmbG9hdF9iYXNlX2FwaV91cmw6ICdodHRwczovL2NzZmxvYXQuY29tL2FwaScsXG4gICAgbm90YXJ5OiB7XG4gICAgICAgIHRsc246ICdodHRwczovL25vdGFyeS5jc2Zsb2F0LmNvbS92MTUnLFxuICAgICAgICB3czogJ3dzczovL25vdGFyeS5jc2Zsb2F0LmNvbS92MTUvcHJveHknLFxuICAgICAgICBsb2dnaW5nTGV2ZWw6ICdXYXJuJyxcbiAgICB9LFxuICAgIHJldmVyc2Vfd2F0Y2hfYmFzZV9hcGlfdXJsOiAnaHR0cHM6Ly9yZXZlcnNlLndhdGNoL2FwaScsXG4gICAgZmxvYXRkYl9nYXRld2F5X3VybDogJ2h0dHBzOi8vZ2F0ZXdheS5mbG9hdGRiLmNvbScsXG4gICAgc2tpbmNyYWZ0X2VtYmVkX29yaWdpbjogJ2h0dHBzOi8vc2tpbmNyYWZ0LmdnJyxcbn07XG4iLCJpbXBvcnQge0NhY2hlLCBJQ2FjaGUsIFRUTENhY2hlfSBmcm9tICcuL2NhY2hlJztcbmltcG9ydCB7RGVmZXJyZWRQcm9taXNlfSBmcm9tICcuL2RlZmVycmVkX3Byb21pc2UnO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSm9iPFQ+IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgZGF0YTogVCkge31cblxuICAgIGdldERhdGEoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRhdGE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGFzaCB0aGF0IHVuaXF1ZWx5IGlkZW50aWZpZXMgdGhpcyBqb2IuXG4gICAgICpcbiAgICAgKiBJZiB0d28gam9icyBoYXZlIHRoZSBzYW1lIGhhc2hjb2RlLCB0aGV5IGFyZSBjb25zaWRlcmVkIGlkZW50aWNhbC5cbiAgICAgKiAqL1xuICAgIGhhc2hDb2RlKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLmRhdGEpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdlbmVyaWNKb2I8VD4gZXh0ZW5kcyBKb2I8VD4ge31cblxuaW50ZXJmYWNlIFF1ZXVlZEpvYjxSZXEsIFJlc3A+IHtcbiAgICBqb2I6IEpvYjxSZXE+O1xuICAgIGRlZmVycmVkUHJvbWlzZTogRGVmZXJyZWRQcm9taXNlPFJlc3A+O1xufVxuXG4vKipcbiAqIFF1ZXVlIHRvIGhhbmRsZSBwcm9jZXNzaW5nIG9mIFwiSm9ic1wiIHdpdGggYSByZXF1ZXN0IHRoYXRcbiAqIHJldHVybiBhIHJlc3BvbnNlLiBFbnN1cmVzIGEgbWF4IGNvbmN1cnJlbmN5IG9mIHByb2Nlc3NpbmdcbiAqIHNpbXVsdGFuZW91cyBqb2JzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUXVldWU8UmVxLCBSZXNwPiB7XG4gICAgcHJpdmF0ZSBpbnRlcm5hbFF1ZXVlOiBRdWV1ZWRKb2I8UmVxLCBSZXNwPltdID0gW107XG4gICAgcHJpdmF0ZSBqb2JzUHJvY2Vzc2luZzogbnVtYmVyID0gMDtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWF4Q29uY3VycmVuY3k6IG51bWJlcikge31cblxuICAgIC8qKiBBbW91bnQgb2Ygam9icyBjdXJyZW50bHkgaW4gdGhlIHF1ZXVlICovXG4gICAgc2l6ZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnRlcm5hbFF1ZXVlLmxlbmd0aDtcbiAgICB9XG5cbiAgICBoYXMoam9iOiBKb2I8UmVxPik6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gISF0aGlzLmludGVybmFsUXVldWUuZmluZCgoZSkgPT4gZS5qb2IuaGFzaENvZGUoKSA9PT0gam9iLmhhc2hDb2RlKCkpO1xuICAgIH1cblxuICAgIGdldE9yVGhyb3coam9iOiBKb2I8UmVxPik6IFF1ZXVlZEpvYjxSZXEsIFJlc3A+IHtcbiAgICAgICAgaWYgKCF0aGlzLmhhcyhqb2IpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEpvYlske2pvYi5oYXNoQ29kZSgpfV0gaXMgbm90IHF1ZXVlZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR3VhcmFudGVlZFxuICAgICAgICByZXR1cm4gdGhpcy5pbnRlcm5hbFF1ZXVlLmZpbmQoKGUpID0+IGUuam9iLmhhc2hDb2RlKCkgPT09IGpvYi5oYXNoQ29kZSgpKSE7XG4gICAgfVxuXG4gICAgYXN5bmMgY2hlY2tRdWV1ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJuYWxRdWV1ZS5sZW5ndGggPT09IDAgfHwgdGhpcy5qb2JzUHJvY2Vzc2luZyA+PSB0aGlzLm1heENvbmN1cnJlbmN5KSB7XG4gICAgICAgICAgICAvLyBEb24ndCB3YW50IHRvIGxhdW5jaCBtb3JlIGluc3RhbmNlc1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5qb2JzUHJvY2Vzc2luZyArPSAxO1xuXG4gICAgICAgIGNvbnN0IHF1ZXVlZEpvYiA9IHRoaXMuaW50ZXJuYWxRdWV1ZS5zaGlmdCgpITtcbiAgICAgICAgY29uc3QgcmVxOiBSZXEgPSBxdWV1ZWRKb2Iuam9iLmdldERhdGEoKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMucHJvY2VzcyhyZXEpO1xuICAgICAgICAgICAgcXVldWVkSm9iLmRlZmVycmVkUHJvbWlzZS5yZXNvbHZlKHJlc3ApO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBxdWV1ZWRKb2IuZGVmZXJyZWRQcm9taXNlLnJlamVjdCgoZSBhcyBhbnkpLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5qb2JzUHJvY2Vzc2luZyAtPSAxO1xuICAgICAgICB0aGlzLmNoZWNrUXVldWUoKTtcbiAgICB9XG5cbiAgICBhZGQoam9iOiBKb2I8UmVxPik6IFByb21pc2U8UmVzcD4ge1xuICAgICAgICBpZiAodGhpcy5oYXMoam9iKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0T3JUaHJvdyhqb2IpPy5kZWZlcnJlZFByb21pc2UucHJvbWlzZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBEZWZlcnJlZFByb21pc2U8UmVzcD4oKTtcbiAgICAgICAgdGhpcy5pbnRlcm5hbFF1ZXVlLnB1c2goe2pvYiwgZGVmZXJyZWRQcm9taXNlOiBwcm9taXNlfSk7XG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmNoZWNrUXVldWUoKSwgMCk7XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2UucHJvbWlzZSgpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBhYnN0cmFjdCBwcm9jZXNzKHJlcTogUmVxKTogUHJvbWlzZTxSZXNwPjtcbn1cblxuLyoqXG4gKiBMaWtlIGEgcXVldWUsIGJ1dCBoYXMgYW4gaW50ZXJuYWwgY2FjaGUgZm9yIGVsZW1lbnRzIGFscmVhZHkgcmVxdWVzdGVkXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDYWNoZWRRdWV1ZTxSZXEsIFJlc3A+IGV4dGVuZHMgUXVldWU8UmVxLCBSZXNwPiB7XG4gICAgLyoqIFVuZGVybHlpbmcgaW1wbGVtZW50YXRpb24gb2YgYSBjYWNoZSAqL1xuICAgIHByb3RlY3RlZCBhYnN0cmFjdCBjYWNoZSgpOiBJQ2FjaGU8UmVzcD47XG5cbiAgICAvKiogQW1vdW50IG9mIHByZXZpb3VzbHkgcmVxdWVzdGVkIGpvYnMgc3RvcmVkIGluIHRoZSBjYWNoZSAqL1xuICAgIGNhY2hlU2l6ZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZSgpLnNpemUoKTtcbiAgICB9XG5cbiAgICBnZXRDYWNoZWQoam9iOiBKb2I8UmVxPik6IFJlc3AgfCBudWxsIHtcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUoKS5oYXMoam9iLmhhc2hDb2RlKCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWNoZSgpLmdldE9yVGhyb3coam9iLmhhc2hDb2RlKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRDYWNoZWQoam9iOiBKb2I8UmVxPiwgcmVzcDogUmVzcCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNhY2hlKCkuc2V0KGpvYi5oYXNoQ29kZSgpLCByZXNwKTtcbiAgICB9XG5cbiAgICBhZGQoam9iOiBKb2I8UmVxPik6IFByb21pc2U8UmVzcD4ge1xuICAgICAgICBpZiAodGhpcy5nZXRDYWNoZWQoam9iKSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmdldENhY2hlZChqb2IpISk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3VwZXIuYWRkKGpvYikudGhlbigocmVzcCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXRDYWNoZWQoam9iLCByZXNwKTtcbiAgICAgICAgICAgIHJldHVybiByZXNwO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYWJzdHJhY3QgcHJvY2VzcyhyZXE6IFJlcSk6IFByb21pc2U8UmVzcD47XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTaW1wbGVDYWNoZWRRdWV1ZTxSZXEsIFJlc3A+IGV4dGVuZHMgQ2FjaGVkUXVldWU8UmVxLCBSZXNwPiB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBjYWNoZV8gPSBuZXcgQ2FjaGU8UmVzcD4oKTtcblxuICAgIHByb3RlY3RlZCBjYWNoZSgpOiBJQ2FjaGU8UmVzcD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZV87XG4gICAgfVxufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgVFRMQ2FjaGVkUXVldWU8UmVxLCBSZXNwPiBleHRlbmRzIENhY2hlZFF1ZXVlPFJlcSwgUmVzcD4ge1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY2FjaGVfOiBUVExDYWNoZTxSZXNwPjtcblxuICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihcbiAgICAgICAgbWF4Q29uY3VycmVuY3k6IG51bWJlcixcbiAgICAgICAgcHJpdmF0ZSB0dGxNczogbnVtYmVyXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKG1heENvbmN1cnJlbmN5KTtcbiAgICAgICAgdGhpcy5jYWNoZV8gPSBuZXcgVFRMQ2FjaGU8UmVzcD4odHRsTXMpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBjYWNoZSgpOiBJQ2FjaGU8UmVzcD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZV87XG4gICAgfVxufVxuIiwiZXhwb3J0IGludGVyZmFjZSBJQ2FjaGU8VD4ge1xuICAgIHNldChrZXk6IHN0cmluZywgdmFsdWU6IFQpOiB2b2lkO1xuICAgIGdldChrZXk6IHN0cmluZyk6IFQgfCB1bmRlZmluZWQ7XG4gICAgZ2V0T3JUaHJvdyhrZXk6IHN0cmluZyk6IFQ7XG4gICAgaGFzKGtleTogc3RyaW5nKTogYm9vbGVhbjtcbiAgICBzaXplKCk6IG51bWJlcjtcbiAgICBjbGVhcigpOiB2b2lkO1xufVxuXG4vKipcbiAqIFNpbXBsZSBHZW5lcmljIENhY2hlIHdpdGggc3RyaW5naWZpZWQga2V5c1xuICovXG5leHBvcnQgY2xhc3MgQ2FjaGU8VD4gaW1wbGVtZW50cyBJQ2FjaGU8VD4ge1xuICAgIHByaXZhdGUgY2FjaGVfOiB7W2tleTogc3RyaW5nXTogVH0gPSB7fTtcblxuICAgIHNldChrZXk6IHN0cmluZywgdmFsdWU6IFQpIHtcbiAgICAgICAgdGhpcy5jYWNoZV9ba2V5XSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldChrZXk6IHN0cmluZyk6IFQgfCB1bmRlZmluZWQge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZV9ba2V5XTtcbiAgICB9XG5cbiAgICBnZXRPclRocm93KGtleTogc3RyaW5nKTogVCB7XG4gICAgICAgIGlmICghdGhpcy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBrZXkgJHtrZXl9IGRvZXMgbm90IGV4aXN0IGluIG1hcCBbZ2V0T3JUaHJvd11gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlX1trZXldO1xuICAgIH1cblxuICAgIGhhcyhrZXk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4ga2V5IGluIHRoaXMuY2FjaGVfO1xuICAgIH1cblxuICAgIHNpemUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuY2FjaGVfKS5sZW5ndGg7XG4gICAgfVxuXG4gICAgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2FjaGVfID0ge307XG4gICAgfVxufVxuXG5pbnRlcmZhY2UgVFRMV3JhcHBlcjxUPiB7XG4gICAgZGF0YTogVDtcbiAgICBleHBpcmVzRXBvY2g6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBFeHRlbnNpb24gb2Yge0BsaW5rIENhY2hlfSB0aGF0IGFsbG93cyBzZXR0aW5nIGEgVFRMICh0aW1lLXRvLWxpdmUpIG9uIGEga2V5XG4gKiBzdWNoIHRoYXQgYXV0b21hdGljYWxseSBleHBpcmVzIGFmdGVyIGEgc3BlY2lmaWVkIHRpbWUuXG4gKlxuICogQnkgZGVmYXVsdCwga2V5cyB3aWxsIGV4cGlyZSB3aXRoIHtAbGluayBkZWZhdWx0VFRMTXN9LlxuICovXG5leHBvcnQgY2xhc3MgVFRMQ2FjaGU8VD4gaW1wbGVtZW50cyBJQ2FjaGU8VD4ge1xuICAgIHByaXZhdGUgY2FjaGVfOiB7W2tleTogc3RyaW5nXTogVFRMV3JhcHBlcjxUPn0gPSB7fTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgZGVmYXVsdFRUTE1zOiBudW1iZXIpIHt9XG5cbiAgICBnZXQoa2V5OiBzdHJpbmcpOiBUIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLmNhY2hlX1trZXldO1xuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpZiBpdCBhbHNvIHJlc3BlY3RzIFRUTFxuICAgICAgICBpZiAodmFsdWUuZXhwaXJlc0Vwb2NoIDwgRGF0ZS5ub3coKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlLmRhdGE7XG4gICAgfVxuXG4gICAgaGFzKGtleTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuZ2V0KGtleSk7XG4gICAgfVxuXG4gICAgZ2V0T3JUaHJvdyhrZXk6IHN0cmluZyk6IFQge1xuICAgICAgICBpZiAoIXRoaXMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihga2V5ICR7a2V5fSBkb2VzIG5vdCBleGlzdCBpbiBtYXAgW2dldE9yVGhyb3ddYCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5nZXQoa2V5KSE7XG4gICAgfVxuXG4gICAgc2V0V2l0aFRUTChrZXk6IHN0cmluZywgdmFsdWU6IFQsIHR0bE1zOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5jYWNoZV9ba2V5XSA9IHtcbiAgICAgICAgICAgIGRhdGE6IHZhbHVlLFxuICAgICAgICAgICAgZXhwaXJlc0Vwb2NoOiBEYXRlLm5vdygpICsgdHRsTXMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogVCkge1xuICAgICAgICB0aGlzLnNldFdpdGhUVEwoa2V5LCB2YWx1ZSwgdGhpcy5kZWZhdWx0VFRMTXMpO1xuICAgIH1cblxuICAgIHNpemUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuY2FjaGVfKS5sZW5ndGg7XG4gICAgfVxuXG4gICAgY2xlYXIoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2FjaGVfID0ge307XG4gICAgfVxufVxuIiwiLyoqXG4gKiBTaW1pbGFyIHRvIGEgcHJvbWlzZSwgYnV0IGFsbG93cyB0aGUgYWJpbGl0eSB0byByZXNvbHZlL3JlamVjdCBpbiBhIGRpZmZlcmVudCBjb250ZXh0XG4gKiAqL1xuZXhwb3J0IGNsYXNzIERlZmVycmVkUHJvbWlzZTxUPiB7XG4gICAgcHJpdmF0ZSByZXNvbHZlXzogKCh2YWx1ZTogVCkgPT4gdm9pZCkgfCB1bmRlZmluZWQ7XG4gICAgcHJpdmF0ZSByZWplY3RfOiAoKHJlYXNvbjogc3RyaW5nKSA9PiB2b2lkKSB8IHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHByb21pc2VfOiBQcm9taXNlPFQ+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucHJvbWlzZV8gPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlc29sdmVfID0gcmVzb2x2ZTtcbiAgICAgICAgICAgIHRoaXMucmVqZWN0XyA9IHJlamVjdDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVzb2x2ZSh2YWx1ZTogVCkge1xuICAgICAgICB0aGlzLnJlc29sdmVfISh2YWx1ZSk7XG4gICAgfVxuXG4gICAgcmVqZWN0KHJlYXNvbjogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMucmVqZWN0XyEocmVhc29uKTtcbiAgICB9XG5cbiAgICBwcm9taXNlKCk6IFByb21pc2U8VD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm9taXNlXztcbiAgICB9XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gT2JzZXJ2ZTxUPihjb21wdXRlT2JqZWN0OiAoKSA9PiBULCBjYjogKCkgPT4gYW55LCBwb2xsUmF0ZU1zID0gNTApIHtcbiAgICBsZXQgcHJldiA9IGNvbXB1dGVPYmplY3QoKTtcblxuICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc3Qgbm93ID0gY29tcHV0ZU9iamVjdCgpO1xuICAgICAgICBpZiAocHJldiAhPT0gbm93KSB7XG4gICAgICAgICAgICBjYigpO1xuICAgICAgICB9XG4gICAgICAgIHByZXYgPSBub3c7XG4gICAgfSwgcG9sbFJhdGVNcyk7XG59XG4iLCJpbXBvcnQge2NzcywgaHRtbH0gZnJvbSAnbGl0JztcblxuaW1wb3J0IHtDdXN0b21FbGVtZW50LCBJbmplY3RBZnRlciwgSW5qZWN0aW9uTW9kZX0gZnJvbSAnLi4vaW5qZWN0b3JzJztcbmltcG9ydCB7RmxvYXRFbGVtZW50fSBmcm9tICcuLi9jdXN0b20nO1xuaW1wb3J0ICcuLi9jb21tb24vdWkvc3RlYW0tYnV0dG9uJztcbmltcG9ydCB7c3RhdGV9IGZyb20gJ2xpdC9kZWNvcmF0b3JzLmpzJztcbmltcG9ydCB7T2JzZXJ2ZX0gZnJvbSAnLi4vLi4vdXRpbHMvb2JzZXJ2ZXJzJztcblxuQEN1c3RvbUVsZW1lbnQoKVxuQEluamVjdEFmdGVyKCcuY29tbWVudHRocmVhZF9hcmVhIC5jb21tZW50dGhyZWFkX2hlYWRlcicsIEluamVjdGlvbk1vZGUuT05DRSlcbmV4cG9ydCBjbGFzcyBDb21tZW50V2FybmluZyBleHRlbmRzIEZsb2F0RWxlbWVudCB7XG4gICAgQHN0YXRlKClcbiAgICBzaG93ID0gZmFsc2U7XG5cbiAgICBzdGF0aWMgc3R5bGVzID0gW1xuICAgICAgICAuLi5GbG9hdEVsZW1lbnQuc3R5bGVzLFxuICAgICAgICBjc3NgXG4gICAgICAgICAgICAuY29udGFpbmVyIHtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDIzNSwgODcsIDg3LCAwLjA1KTtcbiAgICAgICAgICAgICAgICBjb2xvcjogI2RlNjY2NztcbiAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA2cHg7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogOHB4O1xuICAgICAgICAgICAgICAgIG1hcmdpbjogNXB4O1xuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgYCxcbiAgICBdO1xuXG4gICAgcHJpdmF0ZSBnZXRSYXdDb21tZW50Qm94VGV4dCgpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBlbGVtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2NvbW1lbnR0aHJlYWRfdGV4dGFyZWEnKTtcbiAgICAgICAgaWYgKGVsZW1zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZWxlbSA9IGVsZW1zWzBdIGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQ7XG4gICAgICAgIHJldHVybiBlbGVtLnZhbHVlIHx8ICcnO1xuICAgIH1cblxuICAgIGFzeW5jIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuXG4gICAgICAgIE9ic2VydmUoXG4gICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UmF3Q29tbWVudEJveFRleHQoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWZyZXNoV2FybmluZ0FwcGxpY2FibGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZWZyZXNoV2FybmluZ0FwcGxpY2FibGUoKSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSB0aGlzLmdldFJhd0NvbW1lbnRCb3hUZXh0KCk7XG4gICAgICAgIGNvbnN0IHdvcmRzID0gbmV3IFNldCh0ZXh0LnRvTG93ZXJDYXNlKCkuc3BsaXQoJyAnKSk7XG5cbiAgICAgICAgY29uc3QgaGFzVHJpZ2dlcldvcmQgPSBbJ2J1eScsICdzZWxsJywgJ2JvdWdodCcsICdzb2xkJywgJ2NzZmxvYXQnLCAnZmxvYXQnXS5zb21lKChlKSA9PiB3b3Jkcy5oYXMoZSkpO1xuICAgICAgICB0aGlzLnNob3cgPSBoYXNUcmlnZ2VyV29yZDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGlmICghdGhpcy5zaG93KSB7XG4gICAgICAgICAgICByZXR1cm4gaHRtbGBgO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGh0bWxgPGRpdiBjbGFzcz1cImNvbnRhaW5lclwiPlxuICAgICAgICAgICAgPGI+V0FSTklORzo8L2I+IENvbW1lbnRpbmcgb24gcHJvZmlsZXMgd2l0aCB3b3JkcyByZWxhdGluZyB0byBidXlpbmcgYW5kIHNlbGxpbmcgQ1MyIGl0ZW1zXG4gICAgICAgICAgICA8Yj5XSUxMPC9iPiByZXN1bHQgaW4gYSBTdGVhbSBjb21tdW5pdHkgYmFuIVxuICAgICAgICA8L2Rpdj5gO1xuICAgIH1cbn1cbiIsImltcG9ydCB7Q3VzdG9tRWxlbWVudCwgSW5qZWN0QWZ0ZXIsIEluamVjdGlvbk1vZGV9IGZyb20gJy4uL2luamVjdG9ycyc7XG5pbXBvcnQge0Zsb2F0RWxlbWVudH0gZnJvbSAnLi4vY3VzdG9tJztcbmltcG9ydCB7Y3NzLCBodG1sfSBmcm9tICdsaXQnO1xuaW1wb3J0IHtzdGF0ZX0gZnJvbSAnbGl0L2RlY29yYXRvcnMuanMnO1xuaW1wb3J0IHtGZXRjaFJldmVyc2FsU3RhdHVzUmVzcG9uc2V9IGZyb20gJy4uLy4uL2JyaWRnZS9oYW5kbGVycy9mZXRjaF9yZXZlcnNhbF9zdGF0dXMnO1xuaW1wb3J0IHtnUmV2ZXJzYWxGZXRjaGVyfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9yZXZlcnNhbF9mZXRjaGVyJztcbmltcG9ydCB7ZGVmaW5lZH0gZnJvbSAnLi4vLi4vdXRpbHMvY2hlY2tlcnMnO1xuXG5AQ3VzdG9tRWxlbWVudCgpXG5ASW5qZWN0QWZ0ZXIoXG4gICAgJy5wcm9maWxlX2luX2dhbWUucGVyc29uYSArIC5wcm9maWxlX2Jhbl9zdGF0dXMsIC5wcm9maWxlX2luX2dhbWUucGVyc29uYTpub3QoOmhhcygrIC5wcm9maWxlX2Jhbl9zdGF0dXMpKScsXG4gICAgSW5qZWN0aW9uTW9kZS5PTkNFXG4pXG5leHBvcnQgY2xhc3MgUmV2ZXJzYWxTdGF0dXMgZXh0ZW5kcyBGbG9hdEVsZW1lbnQge1xuICAgIEBzdGF0ZSgpXG4gICAgcmV2ZXJzYWxTdGF0dXM6IEZldGNoUmV2ZXJzYWxTdGF0dXNSZXNwb25zZSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgIHN0YXRpYyBzdHlsZXMgPSBbXG4gICAgICAgIC4uLkZsb2F0RWxlbWVudC5zdHlsZXMsXG4gICAgICAgIGNzc2BcbiAgICAgICAgICAgIC5jb250YWluZXIge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgICAgICAgICBjb2xvcjogI2RlNjY2NztcbiAgICAgICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxMHB4O1xuXG4gICAgICAgICAgICAgICAgLndhcm5pbmcge1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBpbmxpbmU7XG5cbiAgICAgICAgICAgICAgICAgICAgLmluZm8tbGluay1jb250YWluZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICM4MjgyODI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC5pbmZvLWxpbmsge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogI2ViZWJlYjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICY6aG92ZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogIzY2YzBmNDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAucG93ZXJlZC1ieS1jb250YWluZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICM4MjgyODI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC5wb3dlcmVkLWJ5LWxpbmsge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogI2ViZWJlYjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICY6aG92ZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogIzY2YzBmNDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIGAsXG4gICAgXTtcblxuICAgIGdldCBzaG93KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gISF0aGlzLnJldmVyc2FsU3RhdHVzPy5oYXNfcmV2ZXJzZWQ7XG4gICAgfVxuXG4gICAgZ2V0IGRheXNTaW5jZUxhc3RSZXZlcnNhbCgpOiBudW1iZXIgfCBudWxsIHtcbiAgICAgICAgaWYgKCF0aGlzLnJldmVyc2FsU3RhdHVzPy5sYXN0X3JldmVyc2FsX3RpbWVzdGFtcCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICBjb25zdCB0aW1lU2luY2UgPSBub3cgLSB0aGlzLnJldmVyc2FsU3RhdHVzLmxhc3RfcmV2ZXJzYWxfdGltZXN0YW1wO1xuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcih0aW1lU2luY2UgLyAoMjQgKiA2MCAqIDYwICogMTAwMCkpO1xuICAgIH1cblxuICAgIGdldFN0ZWFtSWQoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgaWYgKGRlZmluZWQodHlwZW9mIGdfcmdQcm9maWxlRGF0YSkgJiYgZ19yZ1Byb2ZpbGVEYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gZ19yZ1Byb2ZpbGVEYXRhLnN0ZWFtaWQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYXRjaCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5tYXRjaCgvXlxcL3Byb2ZpbGVzXFwvKFxcZCspLyk7XG4gICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoWzFdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHN0ZWFtSWQgPSB0aGlzLmdldFN0ZWFtSWQoKTtcbiAgICAgICAgICAgIGlmICghc3RlYW1JZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2ZhaWxlZCB0byBnZXQgc3RlYW0gaWQnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucmV2ZXJzYWxTdGF0dXMgPSBhd2FpdCBnUmV2ZXJzYWxGZXRjaGVyLmZldGNoKHtzdGVhbV9pZDY0OiBzdGVhbUlkfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2ZhaWxlZCB0byBmZXRjaCByZXZlcnNhbCBzdGF0dXMnLCBlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCByZW5kZXIoKSB7XG4gICAgICAgIGlmICghdGhpcy5zaG93KSB7XG4gICAgICAgICAgICByZXR1cm4gaHRtbGBgO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGF5c1NpbmNlID0gdGhpcy5kYXlzU2luY2VMYXN0UmV2ZXJzYWwgPz8gMDtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGAke2RheXNTaW5jZX0gZGF5KHMpIHNpbmNlIGxhc3QgdHJhZGUgcmV2ZXJzYWxgO1xuICAgICAgICByZXR1cm4gaHRtbGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwid2FybmluZ1wiPlxuICAgICAgICAgICAgICAgICAgICAke21lc3NhZ2V9XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaW5mby1saW5rLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgICAgICAgICAgICAgICAgICAgICAgPGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cImluZm8tbGlua1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHJlZj1cImh0dHBzOi8vaGVscC5zdGVhbXBvd2VyZWQuY29tL2VuL2ZhcXMvdmlldy8zNjVGLTRCRUUtMkFFMi03QkREXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbD1cIm5vcmVmZXJyZXJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEluZm9cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cInBvd2VyZWQtYnktY29udGFpbmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID4ocG93ZXJlZCBieSA8YSBjbGFzcz1cInBvd2VyZWQtYnktbGlua1wiIGhyZWY9XCJodHRwczovL3JldmVyc2Uud2F0Y2hcIj5yZXZlcnNlLndhdGNoPC9hPik8L3NwYW5cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtDbGllbnRTZW5kfSBmcm9tICcuLi9icmlkZ2UvY2xpZW50JztcbmltcG9ydCB7XG4gICAgRmV0Y2hSZXZlcnNhbFN0YXR1cyxcbiAgICBGZXRjaFJldmVyc2FsU3RhdHVzUmVxdWVzdCxcbiAgICBGZXRjaFJldmVyc2FsU3RhdHVzUmVzcG9uc2UsXG59IGZyb20gJy4uL2JyaWRnZS9oYW5kbGVycy9mZXRjaF9yZXZlcnNhbF9zdGF0dXMnO1xuaW1wb3J0IHtHZW5lcmljSm9iLCBUVExDYWNoZWRRdWV1ZX0gZnJvbSAnLi4vdXRpbHMvcXVldWUnO1xuXG5jbGFzcyBSZXZlcnNhbEZldGNoZXIgZXh0ZW5kcyBUVExDYWNoZWRRdWV1ZTxGZXRjaFJldmVyc2FsU3RhdHVzUmVxdWVzdCwgRmV0Y2hSZXZlcnNhbFN0YXR1c1Jlc3BvbnNlPiB7XG4gICAgY29uc3RydWN0b3IobWF4Q29uY3VycmVuY3k6IG51bWJlciwgdHRsTXM6IG51bWJlcikge1xuICAgICAgICBzdXBlcihtYXhDb25jdXJyZW5jeSwgdHRsTXMpO1xuICAgIH1cblxuICAgIGZldGNoKHJlcTogRmV0Y2hSZXZlcnNhbFN0YXR1c1JlcXVlc3QpOiBQcm9taXNlPEZldGNoUmV2ZXJzYWxTdGF0dXNSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGQobmV3IEdlbmVyaWNKb2IocmVxKSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGFzeW5jIHByb2Nlc3MocmVxOiBGZXRjaFJldmVyc2FsU3RhdHVzUmVxdWVzdCk6IFByb21pc2U8RmV0Y2hSZXZlcnNhbFN0YXR1c1Jlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgQ2xpZW50U2VuZChGZXRjaFJldmVyc2FsU3RhdHVzLCByZXEpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdmYWlsZWQgdG8gZmV0Y2ggcmV2ZXJzYWwgc3RhdHVzJywgZSk7XG4gICAgICAgICAgICAvLyBTdHViIG91dCB0byBwcmV2ZW50IGZ1dHVyZSBjYWxsc1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGVhbV9pZDogJycsXG4gICAgICAgICAgICAgICAgaGFzX3JldmVyc2VkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBsYXN0X3JldmVyc2FsX3RpbWVzdGFtcDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgfSBhcyBGZXRjaFJldmVyc2FsU3RhdHVzUmVzcG9uc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBnUmV2ZXJzYWxGZXRjaGVyID0gbmV3IFJldmVyc2FsRmV0Y2hlcigxLCAzMCAqIDYwICogMTAwMCAvKiAzMCBtaW51dGVzICovKTtcbiIsImltcG9ydCB7UmVxdWVzdFR5cGV9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtTaW1wbGVIYW5kbGVyfSBmcm9tICcuL21haW4nO1xuaW1wb3J0IHtlbnZpcm9ubWVudH0gZnJvbSAnLi4vLi4vLi4vZW52aXJvbm1lbnQnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEZldGNoUmV2ZXJzYWxTdGF0dXNSZXF1ZXN0IHtcbiAgICBzdGVhbV9pZDY0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmV0Y2hSZXZlcnNhbFN0YXR1c1Jlc3BvbnNlIHtcbiAgICBzdGVhbV9pZDogc3RyaW5nO1xuICAgIGhhc19yZXZlcnNlZDogYm9vbGVhbjtcbiAgICBsYXN0X3JldmVyc2FsX3RpbWVzdGFtcD86IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBGZXRjaFJldmVyc2FsU3RhdHVzRXJyb3Ige1xuICAgIGNvZGU6IHN0cmluZztcbiAgICBtZXNzYWdlOiBzdHJpbmc7XG4gICAgZGV0YWlscz86IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IEZldGNoUmV2ZXJzYWxTdGF0dXMgPSBuZXcgU2ltcGxlSGFuZGxlcjxGZXRjaFJldmVyc2FsU3RhdHVzUmVxdWVzdCwgRmV0Y2hSZXZlcnNhbFN0YXR1c1Jlc3BvbnNlPihcbiAgICBSZXF1ZXN0VHlwZS5GRVRDSF9SRVZFUlNBTF9TVEFUVVMsXG4gICAgYXN5bmMgKHJlcSkgPT4ge1xuICAgICAgICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goYCR7ZW52aXJvbm1lbnQucmV2ZXJzZV93YXRjaF9iYXNlX2FwaV91cmx9L3YxL3VzZXJzLyR7cmVxLnN0ZWFtX2lkNjR9YCk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSAoYXdhaXQgcmVzcC5qc29uKCkpIGFzIEZldGNoUmV2ZXJzYWxTdGF0dXNSZXNwb25zZSB8IEZldGNoUmV2ZXJzYWxTdGF0dXNFcnJvcjtcbiAgICAgICAgaWYgKCFyZXNwLm9rKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcigoZGF0YSBhcyBGZXRjaFJldmVyc2FsU3RhdHVzRXJyb3IpLm1lc3NhZ2UgPz8gJ3Vua25vd24gZXJyb3InKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0YSBhcyBGZXRjaFJldmVyc2FsU3RhdHVzUmVzcG9uc2U7XG4gICAgfVxuKTtcbiIsImltcG9ydCB7Q0ludmVudG9yeSwgQ0FwcHdpZGVJbnZlbnRvcnl9IGZyb20gJy4uL3R5cGVzL3N0ZWFtJztcblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmluZWQodDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHQgIT09ICd1bmRlZmluZWQnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDQXBwd2lkZUludmVudG9yeShpbnZlbnRvcnk6IENJbnZlbnRvcnkgfCBDQXBwd2lkZUludmVudG9yeSk6IGludmVudG9yeSBpcyBDQXBwd2lkZUludmVudG9yeSB7XG4gICAgcmV0dXJuICdtX3JnQ2hpbGRJbnZlbnRvcmllcycgaW4gaW52ZW50b3J5O1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCJpbXBvcnQge2luaXR9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0ICcuLi9jb21wb25lbnRzL3Byb2ZpbGUvY29tbWVudF93YXJuaW5nJztcbmltcG9ydCAnLi4vY29tcG9uZW50cy9wcm9maWxlL3JldmVyc2FsX3N0YXR1cyc7XG5cbmluaXQoJ3NyYy9saWIvcGFnZV9zY3JpcHRzL3Byb2ZpbGUuanMnLCBtYWluKTtcblxuYXN5bmMgZnVuY3Rpb24gbWFpbigpIHt9XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=