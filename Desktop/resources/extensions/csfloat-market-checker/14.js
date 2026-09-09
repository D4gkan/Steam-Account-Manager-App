"use strict";
(self["webpackChunkcsfloat_extension"] = self["webpackChunkcsfloat_extension"] || []).push([[14],{

/***/ 527:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   expose: () => (/* binding */ expose)
/* harmony export */ });
/* unused harmony exports createEndpoint, finalizer, proxy, proxyMarker, releaseProxy, transfer, transferHandlers, windowEndpoint, wrap */
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
const proxyMarker = Symbol("Comlink.proxy");
const createEndpoint = Symbol("Comlink.endpoint");
const releaseProxy = Symbol("Comlink.releaseProxy");
const finalizer = Symbol("Comlink.finalizer");
const throwMarker = Symbol("Comlink.thrown");
const isObject = (val) => (typeof val === "object" && val !== null) || typeof val === "function";
/**
 * Internal transfer handle to handle objects marked to proxy.
 */
const proxyTransferHandler = {
    canHandle: (val) => isObject(val) && val[proxyMarker],
    serialize(obj) {
        const { port1, port2 } = new MessageChannel();
        expose(obj, port1);
        return [port2, [port2]];
    },
    deserialize(port) {
        port.start();
        return wrap(port);
    },
};
/**
 * Internal transfer handler to handle thrown exceptions.
 */
const throwTransferHandler = {
    canHandle: (value) => isObject(value) && throwMarker in value,
    serialize({ value }) {
        let serialized;
        if (value instanceof Error) {
            serialized = {
                isError: true,
                value: {
                    message: value.message,
                    name: value.name,
                    stack: value.stack,
                },
            };
        }
        else {
            serialized = { isError: false, value };
        }
        return [serialized, []];
    },
    deserialize(serialized) {
        if (serialized.isError) {
            throw Object.assign(new Error(serialized.value.message), serialized.value);
        }
        throw serialized.value;
    },
};
/**
 * Allows customizing the serialization of certain values.
 */
const transferHandlers = new Map([
    ["proxy", proxyTransferHandler],
    ["throw", throwTransferHandler],
]);
function isAllowedOrigin(allowedOrigins, origin) {
    for (const allowedOrigin of allowedOrigins) {
        if (origin === allowedOrigin || allowedOrigin === "*") {
            return true;
        }
        if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
            return true;
        }
    }
    return false;
}
function expose(obj, ep = globalThis, allowedOrigins = ["*"]) {
    ep.addEventListener("message", function callback(ev) {
        if (!ev || !ev.data) {
            return;
        }
        if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
            console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);
            return;
        }
        const { id, type, path } = Object.assign({ path: [] }, ev.data);
        const argumentList = (ev.data.argumentList || []).map(fromWireValue);
        let returnValue;
        try {
            const parent = path.slice(0, -1).reduce((obj, prop) => obj[prop], obj);
            const rawValue = path.reduce((obj, prop) => obj[prop], obj);
            switch (type) {
                case "GET" /* MessageType.GET */:
                    {
                        returnValue = rawValue;
                    }
                    break;
                case "SET" /* MessageType.SET */:
                    {
                        parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
                        returnValue = true;
                    }
                    break;
                case "APPLY" /* MessageType.APPLY */:
                    {
                        returnValue = rawValue.apply(parent, argumentList);
                    }
                    break;
                case "CONSTRUCT" /* MessageType.CONSTRUCT */:
                    {
                        const value = new rawValue(...argumentList);
                        returnValue = proxy(value);
                    }
                    break;
                case "ENDPOINT" /* MessageType.ENDPOINT */:
                    {
                        const { port1, port2 } = new MessageChannel();
                        expose(obj, port2);
                        returnValue = transfer(port1, [port1]);
                    }
                    break;
                case "RELEASE" /* MessageType.RELEASE */:
                    {
                        returnValue = undefined;
                    }
                    break;
                default:
                    return;
            }
        }
        catch (value) {
            returnValue = { value, [throwMarker]: 0 };
        }
        Promise.resolve(returnValue)
            .catch((value) => {
            return { value, [throwMarker]: 0 };
        })
            .then((returnValue) => {
            const [wireValue, transferables] = toWireValue(returnValue);
            ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
            if (type === "RELEASE" /* MessageType.RELEASE */) {
                // detach and deactive after sending release response above.
                ep.removeEventListener("message", callback);
                closeEndPoint(ep);
                if (finalizer in obj && typeof obj[finalizer] === "function") {
                    obj[finalizer]();
                }
            }
        })
            .catch((error) => {
            // Send Serialization Error To Caller
            const [wireValue, transferables] = toWireValue({
                value: new TypeError("Unserializable return value"),
                [throwMarker]: 0,
            });
            ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
        });
    });
    if (ep.start) {
        ep.start();
    }
}
function isMessagePort(endpoint) {
    return endpoint.constructor.name === "MessagePort";
}
function closeEndPoint(endpoint) {
    if (isMessagePort(endpoint))
        endpoint.close();
}
function wrap(ep, target) {
    const pendingListeners = new Map();
    ep.addEventListener("message", function handleMessage(ev) {
        const { data } = ev;
        if (!data || !data.id) {
            return;
        }
        const resolver = pendingListeners.get(data.id);
        if (!resolver) {
            return;
        }
        try {
            resolver(data);
        }
        finally {
            pendingListeners.delete(data.id);
        }
    });
    return createProxy(ep, pendingListeners, [], target);
}
function throwIfProxyReleased(isReleased) {
    if (isReleased) {
        throw new Error("Proxy has been released and is not useable");
    }
}
function releaseEndpoint(ep) {
    return requestResponseMessage(ep, new Map(), {
        type: "RELEASE" /* MessageType.RELEASE */,
    }).then(() => {
        closeEndPoint(ep);
    });
}
const proxyCounter = new WeakMap();
const proxyFinalizers = "FinalizationRegistry" in globalThis &&
    new FinalizationRegistry((ep) => {
        const newCount = (proxyCounter.get(ep) || 0) - 1;
        proxyCounter.set(ep, newCount);
        if (newCount === 0) {
            releaseEndpoint(ep);
        }
    });
function registerProxy(proxy, ep) {
    const newCount = (proxyCounter.get(ep) || 0) + 1;
    proxyCounter.set(ep, newCount);
    if (proxyFinalizers) {
        proxyFinalizers.register(proxy, ep, proxy);
    }
}
function unregisterProxy(proxy) {
    if (proxyFinalizers) {
        proxyFinalizers.unregister(proxy);
    }
}
function createProxy(ep, pendingListeners, path = [], target = function () { }) {
    let isProxyReleased = false;
    const proxy = new Proxy(target, {
        get(_target, prop) {
            throwIfProxyReleased(isProxyReleased);
            if (prop === releaseProxy) {
                return () => {
                    unregisterProxy(proxy);
                    releaseEndpoint(ep);
                    pendingListeners.clear();
                    isProxyReleased = true;
                };
            }
            if (prop === "then") {
                if (path.length === 0) {
                    return { then: () => proxy };
                }
                const r = requestResponseMessage(ep, pendingListeners, {
                    type: "GET" /* MessageType.GET */,
                    path: path.map((p) => p.toString()),
                }).then(fromWireValue);
                return r.then.bind(r);
            }
            return createProxy(ep, pendingListeners, [...path, prop]);
        },
        set(_target, prop, rawValue) {
            throwIfProxyReleased(isProxyReleased);
            // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
            // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
            const [value, transferables] = toWireValue(rawValue);
            return requestResponseMessage(ep, pendingListeners, {
                type: "SET" /* MessageType.SET */,
                path: [...path, prop].map((p) => p.toString()),
                value,
            }, transferables).then(fromWireValue);
        },
        apply(_target, _thisArg, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const last = path[path.length - 1];
            if (last === createEndpoint) {
                return requestResponseMessage(ep, pendingListeners, {
                    type: "ENDPOINT" /* MessageType.ENDPOINT */,
                }).then(fromWireValue);
            }
            // We just pretend that `bind()` didn’t happen.
            if (last === "bind") {
                return createProxy(ep, pendingListeners, path.slice(0, -1));
            }
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, pendingListeners, {
                type: "APPLY" /* MessageType.APPLY */,
                path: path.map((p) => p.toString()),
                argumentList,
            }, transferables).then(fromWireValue);
        },
        construct(_target, rawArgumentList) {
            throwIfProxyReleased(isProxyReleased);
            const [argumentList, transferables] = processArguments(rawArgumentList);
            return requestResponseMessage(ep, pendingListeners, {
                type: "CONSTRUCT" /* MessageType.CONSTRUCT */,
                path: path.map((p) => p.toString()),
                argumentList,
            }, transferables).then(fromWireValue);
        },
    });
    registerProxy(proxy, ep);
    return proxy;
}
function myFlat(arr) {
    return Array.prototype.concat.apply([], arr);
}
function processArguments(argumentList) {
    const processed = argumentList.map(toWireValue);
    return [processed.map((v) => v[0]), myFlat(processed.map((v) => v[1]))];
}
const transferCache = new WeakMap();
function transfer(obj, transfers) {
    transferCache.set(obj, transfers);
    return obj;
}
function proxy(obj) {
    return Object.assign(obj, { [proxyMarker]: true });
}
function windowEndpoint(w, context = globalThis, targetOrigin = "*") {
    return {
        postMessage: (msg, transferables) => w.postMessage(msg, targetOrigin, transferables),
        addEventListener: context.addEventListener.bind(context),
        removeEventListener: context.removeEventListener.bind(context),
    };
}
function toWireValue(value) {
    for (const [name, handler] of transferHandlers) {
        if (handler.canHandle(value)) {
            const [serializedValue, transferables] = handler.serialize(value);
            return [
                {
                    type: "HANDLER" /* WireValueType.HANDLER */,
                    name,
                    value: serializedValue,
                },
                transferables,
            ];
        }
    }
    return [
        {
            type: "RAW" /* WireValueType.RAW */,
            value,
        },
        transferCache.get(value) || [],
    ];
}
function fromWireValue(value) {
    switch (value.type) {
        case "HANDLER" /* WireValueType.HANDLER */:
            return transferHandlers.get(value.name).deserialize(value.value);
        case "RAW" /* WireValueType.RAW */:
            return value.value;
    }
}
function requestResponseMessage(ep, pendingListeners, msg, transfers) {
    return new Promise((resolve) => {
        const id = generateUUID();
        pendingListeners.set(id, resolve);
        if (ep.start) {
            ep.start();
        }
        ep.postMessage(Object.assign({ id }, msg), transfers);
    });
}
function generateUUID() {
    return new Array(4)
        .fill(0)
        .map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
        .join("-");
}


//# sourceMappingURL=comlink.mjs.map


/***/ }),

/***/ 531:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Prover: () => (/* binding */ Prover),
/* harmony export */   Spawner: () => (/* binding */ Spawner),
/* harmony export */   Verifier: () => (/* binding */ Verifier),
/* harmony export */   WorkerData: () => (/* binding */ WorkerData),
/* harmony export */   compute_reveal: () => (/* binding */ compute_reveal),
/* harmony export */   "default": () => (/* binding */ __wbg_init),
/* harmony export */   initSync: () => (/* binding */ initSync),
/* harmony export */   initialize: () => (/* binding */ initialize),
/* harmony export */   startSpawner: () => (/* binding */ startSpawner),
/* harmony export */   web_spawn_recover_spawner: () => (/* binding */ web_spawn_recover_spawner),
/* harmony export */   web_spawn_start_worker: () => (/* binding */ web_spawn_start_worker)
/* harmony export */ });
/* harmony import */ var _snippets_web_spawn_05868593a72e2d44_js_spawn_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(532);
/* @ts-self-types="./tlsn_wasm.d.ts" */



/**
 * Prover for the TLSNotary protocol.
 *
 * The prover connects to both a verifier and a target server, executing the
 * MPC-TLS protocol to generate verifiable proofs of the TLS session.
 */
class Prover {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProverFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_prover_free(ptr, 0);
    }
    /**
     * Creates a new Prover with the given configuration.
     * @param {ProverConfig} config
     */
    constructor(config) {
        const ret = wasm.prover_new(config);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        ProverFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Reveals data to the verifier and finalizes the protocol.
     *
     * Optionally accepts a `Commit` object with ranges to hash-commit.
     * Pass `undefined` or omit the second argument for reveal-only proofs.
     *
     * Returns a `RevealOutput` with one `CommitmentOpening` per
     * hash-committed range (`{ direction, ranges, algorithm, hash, blinder
     * }`), in the same order as the input `Commit`. The `commitments`
     * array is empty when no commit was supplied.
     * @param {Reveal} reveal
     * @param {Commit | null} [commit]
     * @returns {Promise<RevealOutput>}
     */
    reveal(reveal, commit) {
        const ret = wasm.prover_reveal(this.__wbg_ptr, reveal, isLikeNone(commit) ? 0 : addToExternrefTable0(commit));
        return ret;
    }
    /**
     * Sends an HTTP request to the server.
     *
     * # Arguments
     *
     * * `server_io` - An IoChannel connected to the server. Must be provided
     *   in MPC mode. Must be `None` in proxy mode, where the connection is
     *   routed through the verifier.
     * * `request` - The HTTP request to send.
     * @param {IoChannel | null | undefined} server_io
     * @param {HttpRequest} request
     * @returns {Promise<HttpResponse>}
     */
    send_request(server_io, request) {
        const ret = wasm.prover_send_request(this.__wbg_ptr, isLikeNone(server_io) ? 0 : addToExternrefTable0(server_io), request);
        return ret;
    }
    /**
     * Sets a progress callback that receives structured progress updates.
     *
     * The callback receives a single argument: `{ step: string, progress:
     * number, message: string }`.
     *
     * Steps emitted: `MPC_SETUP`, `CONNECTING_TO_SERVER`, `SENDING_REQUEST`,
     * `REQUEST_COMPLETE`, `REVEAL`, `FINALIZED`.
     * @param {Function} callback
     */
    set_progress_callback(callback) {
        wasm.prover_set_progress_callback(this.__wbg_ptr, callback);
    }
    /**
     * Sets up the prover with the verifier.
     *
     * This performs all MPC setup prior to establishing the connection to the
     * application server.
     *
     * # Arguments
     *
     * * `verifier_io` - A JavaScript object implementing the IoChannel
     *   interface, connected to the verifier.
     * @param {IoChannel} verifier_io
     * @returns {Promise<void>}
     */
    setup(verifier_io) {
        const ret = wasm.prover_setup(this.__wbg_ptr, verifier_io);
        return ret;
    }
    /**
     * Returns the transcript of the TLS session.
     * @returns {Transcript}
     */
    transcript() {
        const ret = wasm.prover_transcript(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}
if (Symbol.dispose) Prover.prototype[Symbol.dispose] = Prover.prototype.free;

/**
 * Global spawner which spawns closures into web workers.
 */
class Spawner {
    static __wrap(ptr) {
        const obj = Object.create(Spawner.prototype);
        obj.__wbg_ptr = ptr;
        SpawnerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SpawnerFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_spawner_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    intoRaw() {
        const ptr = this.__destroy_into_raw();
        const ret = wasm.spawner_intoRaw(ptr);
        return ret >>> 0;
    }
    /**
     * Runs the spawner.
     * @param {string} url
     * @returns {Promise<void>}
     */
    run(url) {
        const ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.spawner_run(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
}
if (Symbol.dispose) Spawner.prototype[Symbol.dispose] = Spawner.prototype.free;

/**
 * Verifier for the TLSNotary protocol.
 *
 * The verifier participates in the MPC-TLS protocol with the prover,
 * verifying the authenticity of the TLS session without seeing the
 * full plaintext.
 */
class Verifier {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VerifierFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_verifier_free(ptr, 0);
    }
    /**
     * Connects to the prover.
     *
     * # Arguments
     *
     * * `prover_io` - A JavaScript object implementing the IoChannel
     *   interface, connected to the prover.
     * @param {IoChannel} prover_io
     * @returns {Promise<void>}
     */
    connect(prover_io) {
        const ret = wasm.verifier_connect(this.__wbg_ptr, prover_io);
        return ret;
    }
    /**
     * Creates a new Verifier with the given configuration.
     * @param {VerifierConfig} config
     */
    constructor(config) {
        const ret = wasm.verifier_new(config);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        VerifierFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Runs the verifier until the TLS connection is closed.
     *
     * In proxy mode, `set_server_socket()` must be called first.
     * @returns {Promise<void>}
     */
    run() {
        const ret = wasm.verifier_run(this.__wbg_ptr);
        return ret;
    }
    /**
     * Provides the server socket for proxy mode.
     *
     * Must be called between `setup()` and `run()` when `setup` returned a
     * server name.
     *
     * # Arguments
     *
     * * `server_io` - A JavaScript object implementing the IoChannel
     *   interface, connected to the server.
     * @param {IoChannel} server_io
     */
    set_server_socket(server_io) {
        const ret = wasm.verifier_set_server_socket(this.__wbg_ptr, server_io);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Performs the commitment handshake with the prover.
     *
     * Returns the server name in proxy mode, or null/undefined for MPC
     * mode. When a server name is returned, call `set_server_socket()`
     * with a connection to that server before calling `run()`.
     * @returns {Promise<string | undefined>}
     */
    setup() {
        const ret = wasm.verifier_setup(this.__wbg_ptr);
        return ret;
    }
    /**
     * Verifies the connection and finalizes the protocol.
     * @returns {Promise<VerifierOutput>}
     */
    verify() {
        const ret = wasm.verifier_verify(this.__wbg_ptr);
        return ret;
    }
}
if (Symbol.dispose) Verifier.prototype[Symbol.dispose] = Verifier.prototype.free;

class WorkerData {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WorkerDataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_workerdata_free(ptr, 0);
    }
}
if (Symbol.dispose) WorkerData.prototype[Symbol.dispose] = WorkerData.prototype.free;

/**
 * Parses HTTP request/response transcripts and maps handlers to byte ranges.
 *
 * This is the WASM wrapper around `tlsn_sdk_core::compute_reveal`.
 *
 * # Arguments
 *
 * * `sent` - Raw bytes of the HTTP request (sent data).
 * * `recv` - Raw bytes of the HTTP response (received data).
 * * `handlers` - Array of handler objects (deserialized from JS).
 *
 * # Returns
 *
 * A `ComputeRevealOutput` object containing:
 * - `sentRanges` / `recvRanges`: byte ranges for `Prover.reveal()`
 * - `sentRangesWithHandlers` / `recvRangesWithHandlers`: ranges annotated with
 *   handlers
 * - `commit` (optional): ranges to hash-commit, with per-range algorithm
 * @param {Uint8Array} sent
 * @param {Uint8Array} recv
 * @param {any} handlers
 * @returns {any}
 */
function compute_reveal(sent, recv, handlers) {
    const ptr0 = passArray8ToWasm0(sent, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(recv, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.compute_reveal(ptr0, len0, ptr1, len1, handlers);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * Initializes the module.
 * @param {LoggingConfig | null | undefined} logging_config
 * @param {number} thread_count
 * @returns {Promise<void>}
 */
function initialize(logging_config, thread_count) {
    const ret = wasm.initialize(isLikeNone(logging_config) ? 0 : addToExternrefTable0(logging_config), thread_count);
    return ret;
}

/**
 * Starts the thread spawner on a dedicated worker thread.
 * @returns {Promise<any>}
 */
function startSpawner() {
    const ret = wasm.startSpawner();
    return ret;
}

/**
 * @param {number} spawner
 * @returns {Spawner}
 */
function web_spawn_recover_spawner(spawner) {
    const ret = wasm.web_spawn_recover_spawner(spawner);
    return Spawner.__wrap(ret);
}

/**
 * @param {number} worker
 */
function web_spawn_start_worker(worker) {
    wasm.web_spawn_start_worker(worker);
}
function __wbg_get_imports(memory) {
    const import0 = {
        __proto__: null,
        __wbg_Error_3639a60ed15f87e7: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_a3d737fd183f7dca: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_bigint_get_as_i64_3af6d4ca77193a4b: function(arg0, arg1) {
            const v = arg1;
            const ret = typeof(v) === 'bigint' ? v : undefined;
            getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_boolean_get_c3dd5c39f1b5a12b: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_07cb72cfcc952e2b: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_2617fa76397620d3: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_bigint_d6a8167cac401b95: function(arg0) {
            const ret = typeof(arg0) === 'bigint';
            return ret;
        },
        __wbg___wbindgen_is_function_2f0fd7ceb86e64c5: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_null_066086be3abe9bb3: function(arg0) {
            const ret = arg0 === null;
            return ret;
        },
        __wbg___wbindgen_is_object_5b22ff2418063a9c: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_eddc07a3efad52e6: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_244a92c34d3b6ec0: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_eq_403eaa3610500a25: function(arg0, arg1) {
            const ret = arg0 === arg1;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_1978f1e77b4bce62: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_memory_c2356dd1a089dfbd: function() {
            const ret = wasm.memory;
            return ret;
        },
        __wbg___wbindgen_module_df704393dfd1853c: function() {
            const ret = wasmModule;
            return ret;
        },
        __wbg___wbindgen_number_get_dd6d69a6079f26f1: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_rethrow_8e609956a7b9f4fb: function(arg0) {
            throw arg0;
        },
        __wbg___wbindgen_string_get_965592073e5d848c: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_9c75d47bf9e7731e: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_158e43e869788cdc: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_async_1ee5bed8fb1cc6ba: function(arg0) {
            const ret = arg0.async;
            return ret;
        },
        __wbg_buffer_500ec46e6722f492: function(arg0) {
            const ret = arg0.buffer;
            return ret;
        },
        __wbg_call_a41d6421b30a32c5: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_call_add9e5a76382e668: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_close_00f69f0efecbb2be: function() { return handleError(function (arg0) {
            const ret = arg0.close();
            return ret;
        }, arguments); },
        __wbg_crypto_38df2bab126b63dc: function(arg0) {
            const ret = arg0.crypto;
            return ret;
        },
        __wbg_data_0ba4ecacc6f43a18: function(arg0) {
            const ret = arg0.data;
            return ret;
        },
        __wbg_done_b1afd6201ac045e0: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_entries_bb9843ba73dc70d6: function(arg0) {
            const ret = Object.entries(arg0);
            return ret;
        },
        __wbg_error_a6fa202b58aa1cd3: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getRandomValues_b2176991427f6db8: function() { return handleError(function (arg0) {
            globalThis.crypto.getRandomValues(arg0);
        }, arguments); },
        __wbg_getRandomValues_c44a50d8cfdaebeb: function() { return handleError(function (arg0, arg1) {
            arg0.getRandomValues(arg1);
        }, arguments); },
        __wbg_get_652f640b3b0b6e3e: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_9cfea9b7bbf12a15: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_unchecked_be562b1421656321: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_with_ref_key_6412cf3094599694: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_hardwareConcurrency_41dccbebcde1118f: function(arg0) {
            const ret = arg0.hardwareConcurrency;
            return ret;
        },
        __wbg_hardwareConcurrency_e8e88e0f13894864: function(arg0) {
            const ret = arg0.hardwareConcurrency;
            return ret;
        },
        __wbg_instanceof_ArrayBuffer_eab9f28fbec23477: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Map_10d4edf60fcf9327: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Map;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_57d77acd50e4c44d: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Window_4153c1818a1c0c0b: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Window;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_WorkerGlobalScope_62ef0414f7e1d9d1: function(arg0) {
            let result;
            try {
                result = arg0 instanceof WorkerGlobalScope;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_c6c6ef8308995bcf: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_isSafeInteger_3c56c421a5b4cce4: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_iterator_9d68985a1d096fc2: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_length_0a6ce016dc1460b0: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_ba3c032602efe310: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_log_a08c94858b7b3f5d: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.log(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_log_af57d76a20981228: function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.log(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5), getStringFromWasm0(arg6, arg7));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_mark_be5ec5c35d91d156: function(arg0, arg1) {
            performance.mark(getStringFromWasm0(arg0, arg1));
        },
        __wbg_measure_dc9d16991bb9411f: function() { return handleError(function (arg0, arg1, arg2, arg3) {
            let deferred0_0;
            let deferred0_1;
            let deferred1_0;
            let deferred1_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                deferred1_0 = arg2;
                deferred1_1 = arg3;
                performance.measure(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
                wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
            }
        }, arguments); },
        __wbg_msCrypto_bd5a034af96bcba6: function(arg0) {
            const ret = arg0.msCrypto;
            return ret;
        },
        __wbg_navigator_83daf29f5beb4064: function(arg0) {
            const ret = arg0.navigator;
            return ret;
        },
        __wbg_navigator_f3468c6dc9006b7c: function(arg0) {
            const ret = arg0.navigator;
            return ret;
        },
        __wbg_new_227d7c05414eb861: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_2fad8ca02fd00684: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_3baa8d9866155c79: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_8454eee672b2ba6e: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_b92364ac5202a6de: function(arg0) {
            const ret = new Int32Array(arg0);
            return ret;
        },
        __wbg_new_eb8acd9352be84ba: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___js_sys_aaafd26f4c58237a___Function_fn_wasm_bindgen_4c831161ffc18f38___JsValue_____wasm_bindgen_4c831161ffc18f38___sys__Undefined___js_sys_aaafd26f4c58237a___Function_fn_wasm_bindgen_4c831161ffc18f38___JsValue_____wasm_bindgen_4c831161ffc18f38___sys__Undefined_______true_(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        },
        __wbg_new_from_slice_5a173c243af2e823: function(arg0, arg1) {
            const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_typed_1137602701dc87d4: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___js_sys_aaafd26f4c58237a___Function_fn_wasm_bindgen_4c831161ffc18f38___JsValue_____wasm_bindgen_4c831161ffc18f38___sys__Undefined___js_sys_aaafd26f4c58237a___Function_fn_wasm_bindgen_4c831161ffc18f38___JsValue_____wasm_bindgen_4c831161ffc18f38___sys__Undefined_______true_(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        },
        __wbg_new_with_length_9011f5da794bf5d9: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_new_with_options_a99de022c218da8c: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = new Worker(getStringFromWasm0(arg0, arg1), arg2);
            return ret;
        }, arguments); },
        __wbg_new_worker_587767f5b778f6ce: function(arg0, arg1) {
            const ret = new Worker(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_next_261c3c48c6e309a5: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_next_aacee310bcfe6461: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_node_84ea875411254db1: function(arg0) {
            const ret = arg0.node;
            return ret;
        },
        __wbg_now_4f457f10f864aec5: function() {
            const ret = Date.now();
            return ret;
        },
        __wbg_now_e7c6795a7f81e10f: function(arg0) {
            const ret = arg0.now();
            return ret;
        },
        __wbg_of_24ccb247709bafd2: function(arg0, arg1, arg2) {
            const ret = Array.of(arg0, arg1, arg2);
            return ret;
        },
        __wbg_performance_3fcf6e32a7e1ed0a: function(arg0) {
            const ret = arg0.performance;
            return ret;
        },
        __wbg_postMessage_b8899b5b0ca9ad5f: function() { return handleError(function (arg0, arg1) {
            arg0.postMessage(arg1);
        }, arguments); },
        __wbg_postMessage_d337216cda0e6002: function() { return handleError(function (arg0, arg1) {
            arg0.postMessage(arg1);
        }, arguments); },
        __wbg_process_44c7a14e11e9f69e: function(arg0) {
            const ret = arg0.process;
            return ret;
        },
        __wbg_prototypesetcall_fd4050e806e1d519: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_push_60a5366c0bb22a7d: function(arg0, arg1) {
            const ret = arg0.push(arg1);
            return ret;
        },
        __wbg_queueMicrotask_40ac6ffc2848ba77: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_queueMicrotask_74d092439f6494c1: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_randomFillSync_6c25eac9869eb53c: function() { return handleError(function (arg0, arg1) {
            arg0.randomFillSync(arg1);
        }, arguments); },
        __wbg_read_facf7e9c09d42b7e: function() { return handleError(function (arg0) {
            const ret = arg0.read();
            return ret;
        }, arguments); },
        __wbg_require_b4edbdcf3e2a1ef0: function() { return handleError(function () {
            const ret = module.require;
            return ret;
        }, arguments); },
        __wbg_resolve_9feb5d906ca62419: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_set_5337f8ac82364a3f: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = Reflect.set(arg0, arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_set_6be42768c690e380: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_f614f6a0608d1d1d: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_set_name_f6e23ad843cc654b: function(arg0, arg1, arg2) {
            arg0.name = getStringFromWasm0(arg1, arg2);
        },
        __wbg_set_onmessage_146e69bce551b1b6: function(arg0, arg1) {
            arg0.onmessage = arg1;
        },
        __wbg_set_type_86c28c059175fa05: function(arg0, arg1) {
            arg0.type = __wbindgen_enum_WorkerType[arg1];
        },
        __wbg_stack_3b0d974bbf31e44f: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_startSpawnerWorker_d623376cb6a747f9: function(arg0, arg1, arg2) {
            const ret = (0,_snippets_web_spawn_05868593a72e2d44_js_spawn_js__WEBPACK_IMPORTED_MODULE_0__.startSpawnerWorker)(arg0, arg1, Spawner.__wrap(arg2));
            return ret;
        },
        __wbg_static_accessor_GLOBAL_THIS_1c7f1bd6c6941fdb: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_e039bc914f83e74e: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_8bf8c48c28420ad5: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_6aeee9b51652ee0f: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_subarray_fbe3cef290e1fa43: function(arg0, arg1, arg2) {
            const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_then_20a157d939b514f5: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_then_4d0dc09d0334f8a0: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_then_5ef9b762bc91555c: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_timeOrigin_f3d5cb4f4a06c2b7: function(arg0) {
            const ret = arg0.timeOrigin;
            return ret;
        },
        __wbg_value_9a45af0e26b1f87c: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_value_f852716acdeb3e82: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_versions_276b2795b1c6a219: function(arg0) {
            const ret = arg0.versions;
            return ret;
        },
        __wbg_waitAsync_46b9c16917402b6b: function(arg0, arg1, arg2) {
            const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2);
            return ret;
        },
        __wbg_waitAsync_5c459d2d0295c202: function() {
            const ret = Atomics.waitAsync;
            return ret;
        },
        __wbg_write_ea7e2dec77e0f800: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.write(arg1);
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 2176, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___wasm_bindgen_4c831161ffc18f38___JsValue______true_);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 4529, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___wasm_bindgen_4c831161ffc18f38___JsValue__core_104fa5104cbe979c___result__Result_____wasm_bindgen_4c831161ffc18f38___JsError___true_);
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 4531, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___js_sys_aaafd26f4c58237a___futures__task__wait_async_polyfill__MessageEvent______true_);
            return ret;
        },
        __wbindgen_cast_0000000000000004: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000005: function(arg0) {
            // Cast intrinsic for `I64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000006: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000007: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000008: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
        __wbindgen_link_05d8570477813ff4: function(arg0) {
            const val = `onmessage = function (ev) {
                let [ia, index, value] = ev.data;
                ia = new Int32Array(ia.buffer);
                let result = Atomics.wait(ia, index, value);
                postMessage(result);
            };
            `;
            const ret = typeof URL.createObjectURL === 'undefined' ? "data:application/javascript," + encodeURIComponent(val) : URL.createObjectURL(new Blob([val], { type: "text/javascript" }));
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        memory: memory || new WebAssembly.Memory({initial:148,maximum:65536,shared:true}),
    };
    return {
        __proto__: null,
        "./tlsn_wasm_bg.js": import0,
    };
}

function wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___wasm_bindgen_4c831161ffc18f38___JsValue______true_(arg0, arg1, arg2) {
    wasm.wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___wasm_bindgen_4c831161ffc18f38___JsValue______true_(arg0, arg1, arg2);
}

function wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___js_sys_aaafd26f4c58237a___futures__task__wait_async_polyfill__MessageEvent______true_(arg0, arg1, arg2) {
    wasm.wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___js_sys_aaafd26f4c58237a___futures__task__wait_async_polyfill__MessageEvent______true_(arg0, arg1, arg2);
}

function wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___wasm_bindgen_4c831161ffc18f38___JsValue__core_104fa5104cbe979c___result__Result_____wasm_bindgen_4c831161ffc18f38___JsError___true_(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___wasm_bindgen_4c831161ffc18f38___JsValue__core_104fa5104cbe979c___result__Result_____wasm_bindgen_4c831161ffc18f38___JsError___true_(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___js_sys_aaafd26f4c58237a___Function_fn_wasm_bindgen_4c831161ffc18f38___JsValue_____wasm_bindgen_4c831161ffc18f38___sys__Undefined___js_sys_aaafd26f4c58237a___Function_fn_wasm_bindgen_4c831161ffc18f38___JsValue_____wasm_bindgen_4c831161ffc18f38___sys__Undefined_______true_(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen_4c831161ffc18f38___convert__closures_____invoke___js_sys_aaafd26f4c58237a___Function_fn_wasm_bindgen_4c831161ffc18f38___JsValue_____wasm_bindgen_4c831161ffc18f38___sys__Undefined___js_sys_aaafd26f4c58237a___Function_fn_wasm_bindgen_4c831161ffc18f38___JsValue_____wasm_bindgen_4c831161ffc18f38___sys__Undefined_______true_(arg0, arg1, arg2, arg3);
}


const __wbindgen_enum_WorkerType = ["classic", "module"];
const ProverFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_prover_free(ptr, 1));
const VerifierFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_verifier_free(ptr, 1));
const SpawnerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_spawner_free(ptr, 1));
const WorkerDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_workerdata_free(ptr, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => wasm.__wbindgen_destroy_closure(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, f) {
    const state = { a: arg0, b: arg1, cnt: 1 };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            wasm.__wbindgen_destroy_closure(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : undefined);
if (cachedTextDecoder) cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().slice(ptr, ptr + len));
}

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder() : undefined);

if (cachedTextEncoder) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module, thread_stack_size) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    if (typeof thread_stack_size !== 'undefined' && (typeof thread_stack_size !== 'number' || thread_stack_size === 0 || thread_stack_size % 65536 !== 0)) {
        throw new Error('invalid stack size');
    }

    wasm.__wbindgen_start(thread_stack_size);
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module, memory) {
    if (wasm !== undefined) return wasm;

    let thread_stack_size
    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module, memory, thread_stack_size} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports(memory);
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module, thread_stack_size);
}

async function __wbg_init(module_or_path, memory) {
    if (wasm !== undefined) return wasm;

    let thread_stack_size
    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path, memory, thread_stack_size} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL(/* asset import */ __webpack_require__(534), __webpack_require__.b);
    }
    const imports = __wbg_get_imports(memory);

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module, thread_stack_size);
}




/***/ }),

/***/ 532:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   startSpawnerWorker: () => (/* binding */ startSpawnerWorker)
/* harmony export */ });
function registerMessageListener(target, type, callback) {
    const listener = async (event) => {
        const message = event.data;
        if (message && message.type === type) {
            await callback(message.data);
        }
    };

    target.addEventListener('message', listener);
}

// Register listener for the start spawner message.
registerMessageListener(self, 'web_spawn_start_spawner', async (data) => {
    const workerUrl = new URL(
        /* asset import */ __webpack_require__(533), __webpack_require__.b
    );
    const [module, memory, spawnerPtr] = data;
    const pkg = await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 531));
    const exports = await pkg.default({ module, memory });

    const spawner = pkg.web_spawn_recover_spawner(spawnerPtr);
    postMessage('web_spawn_spawner_ready');
    await spawner.run(workerUrl.toString());

    exports.__wbindgen_thread_destroy();

    close();
});

// Register listener for the start worker message.
registerMessageListener(self, 'web_spawn_start_worker', async (data) => {
    const [module, memory, workerPtr] = data;

    const pkg = await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, 531));
    const exports = await pkg.default({ module, memory });

    pkg.web_spawn_start_worker(workerPtr);

    exports.__wbindgen_thread_destroy();

    close();
});

/// Starts the spawner in a new worker.
async function startSpawnerWorker(module, memory, spawner) {
    const workerUrl = new URL(
        /* asset import */ __webpack_require__(533), __webpack_require__.b
    );
    const worker = new Worker(
        workerUrl,
        {
            name: 'web-spawn-spawner',
            type: 'module'
        }
    );

    const data = [module, memory, spawner.intoRaw()];
    worker.postMessage({
        type: 'web_spawn_start_spawner',
        data: data
    })

    await new Promise(resolve => {
        worker.addEventListener('message', function handler(event) {
            if (event.data === 'web_spawn_spawner_ready') {
                worker.removeEventListener('message', handler);
                resolve();
            }
        })
    })
}


/***/ }),

/***/ 533:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "4300ded2039bcad5ad9a.js";

/***/ }),

/***/ 534:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "tlsn_wasm_bg.wasm";

/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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YztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1QscURBQXFEO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBLFNBQVMsZUFBZTtBQUN4QjtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSw4QkFBOEI7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFDQTtBQUNBLGNBQWMsbUNBQW1DO0FBQ2pELFVBQVU7QUFDVix3RUFBd0U7QUFDeEU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGNBQWMsMkNBQTJDO0FBQ3pELFVBQVU7QUFDVix1RkFBdUY7QUFDdkY7QUFDQTs7QUFFQTtBQUNBLGlDQUFpQyxrRUFBb0M7QUFDckU7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsWUFBWSxtQkFBbUI7O0FBRS9CO0FBQ0E7O0FBRTJDOzs7Ozs7Ozs7OztBQzF3QzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsUUFBUSxrRUFDZTtBQUN2QjtBQUNBO0FBQ0Esc0JBQXNCLHdGQUErQjtBQUNyRCx3Q0FBd0MsZ0JBQWdCOztBQUV4RDtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQTs7QUFFQSxzQkFBc0Isd0ZBQStCO0FBQ3JELHdDQUF3QyxnQkFBZ0I7O0FBRXhEOztBQUVBOztBQUVBO0FBQ0EsQ0FBQzs7QUFFRDtBQUNPO0FBQ1A7QUFDQSxRQUFRLGtFQUNlO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0wiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvY29tbGluay9kaXN0L2VzbS9jb21saW5rLm1qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvQGNzZmxvYXQvdGxzbi13YXNtL3Rsc25fd2FzbS5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvQGNzZmxvYXQvdGxzbi13YXNtL3NuaXBwZXRzL3dlYi1zcGF3bi0wNTg2ODU5M2E3MmUyZDQ0L2pzL3NwYXduLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCAyMDE5IEdvb2dsZSBMTENcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBcGFjaGUtMi4wXG4gKi9cbmNvbnN0IHByb3h5TWFya2VyID0gU3ltYm9sKFwiQ29tbGluay5wcm94eVwiKTtcbmNvbnN0IGNyZWF0ZUVuZHBvaW50ID0gU3ltYm9sKFwiQ29tbGluay5lbmRwb2ludFwiKTtcbmNvbnN0IHJlbGVhc2VQcm94eSA9IFN5bWJvbChcIkNvbWxpbmsucmVsZWFzZVByb3h5XCIpO1xuY29uc3QgZmluYWxpemVyID0gU3ltYm9sKFwiQ29tbGluay5maW5hbGl6ZXJcIik7XG5jb25zdCB0aHJvd01hcmtlciA9IFN5bWJvbChcIkNvbWxpbmsudGhyb3duXCIpO1xuY29uc3QgaXNPYmplY3QgPSAodmFsKSA9PiAodHlwZW9mIHZhbCA9PT0gXCJvYmplY3RcIiAmJiB2YWwgIT09IG51bGwpIHx8IHR5cGVvZiB2YWwgPT09IFwiZnVuY3Rpb25cIjtcbi8qKlxuICogSW50ZXJuYWwgdHJhbnNmZXIgaGFuZGxlIHRvIGhhbmRsZSBvYmplY3RzIG1hcmtlZCB0byBwcm94eS5cbiAqL1xuY29uc3QgcHJveHlUcmFuc2ZlckhhbmRsZXIgPSB7XG4gICAgY2FuSGFuZGxlOiAodmFsKSA9PiBpc09iamVjdCh2YWwpICYmIHZhbFtwcm94eU1hcmtlcl0sXG4gICAgc2VyaWFsaXplKG9iaikge1xuICAgICAgICBjb25zdCB7IHBvcnQxLCBwb3J0MiB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgIGV4cG9zZShvYmosIHBvcnQxKTtcbiAgICAgICAgcmV0dXJuIFtwb3J0MiwgW3BvcnQyXV07XG4gICAgfSxcbiAgICBkZXNlcmlhbGl6ZShwb3J0KSB7XG4gICAgICAgIHBvcnQuc3RhcnQoKTtcbiAgICAgICAgcmV0dXJuIHdyYXAocG9ydCk7XG4gICAgfSxcbn07XG4vKipcbiAqIEludGVybmFsIHRyYW5zZmVyIGhhbmRsZXIgdG8gaGFuZGxlIHRocm93biBleGNlcHRpb25zLlxuICovXG5jb25zdCB0aHJvd1RyYW5zZmVySGFuZGxlciA9IHtcbiAgICBjYW5IYW5kbGU6ICh2YWx1ZSkgPT4gaXNPYmplY3QodmFsdWUpICYmIHRocm93TWFya2VyIGluIHZhbHVlLFxuICAgIHNlcmlhbGl6ZSh7IHZhbHVlIH0pIHtcbiAgICAgICAgbGV0IHNlcmlhbGl6ZWQ7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICBzZXJpYWxpemVkID0ge1xuICAgICAgICAgICAgICAgIGlzRXJyb3I6IHRydWUsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogdmFsdWUubWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogdmFsdWUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc3RhY2s6IHZhbHVlLnN0YWNrLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2VyaWFsaXplZCA9IHsgaXNFcnJvcjogZmFsc2UsIHZhbHVlIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtzZXJpYWxpemVkLCBbXV07XG4gICAgfSxcbiAgICBkZXNlcmlhbGl6ZShzZXJpYWxpemVkKSB7XG4gICAgICAgIGlmIChzZXJpYWxpemVkLmlzRXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IE9iamVjdC5hc3NpZ24obmV3IEVycm9yKHNlcmlhbGl6ZWQudmFsdWUubWVzc2FnZSksIHNlcmlhbGl6ZWQudmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IHNlcmlhbGl6ZWQudmFsdWU7XG4gICAgfSxcbn07XG4vKipcbiAqIEFsbG93cyBjdXN0b21pemluZyB0aGUgc2VyaWFsaXphdGlvbiBvZiBjZXJ0YWluIHZhbHVlcy5cbiAqL1xuY29uc3QgdHJhbnNmZXJIYW5kbGVycyA9IG5ldyBNYXAoW1xuICAgIFtcInByb3h5XCIsIHByb3h5VHJhbnNmZXJIYW5kbGVyXSxcbiAgICBbXCJ0aHJvd1wiLCB0aHJvd1RyYW5zZmVySGFuZGxlcl0sXG5dKTtcbmZ1bmN0aW9uIGlzQWxsb3dlZE9yaWdpbihhbGxvd2VkT3JpZ2lucywgb3JpZ2luKSB7XG4gICAgZm9yIChjb25zdCBhbGxvd2VkT3JpZ2luIG9mIGFsbG93ZWRPcmlnaW5zKSB7XG4gICAgICAgIGlmIChvcmlnaW4gPT09IGFsbG93ZWRPcmlnaW4gfHwgYWxsb3dlZE9yaWdpbiA9PT0gXCIqXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhbGxvd2VkT3JpZ2luIGluc3RhbmNlb2YgUmVnRXhwICYmIGFsbG93ZWRPcmlnaW4udGVzdChvcmlnaW4pKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiBleHBvc2Uob2JqLCBlcCA9IGdsb2JhbFRoaXMsIGFsbG93ZWRPcmlnaW5zID0gW1wiKlwiXSkge1xuICAgIGVwLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uIGNhbGxiYWNrKGV2KSB7XG4gICAgICAgIGlmICghZXYgfHwgIWV2LmRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzQWxsb3dlZE9yaWdpbihhbGxvd2VkT3JpZ2lucywgZXYub3JpZ2luKSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIG9yaWdpbiAnJHtldi5vcmlnaW59JyBmb3IgY29tbGluayBwcm94eWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgaWQsIHR5cGUsIHBhdGggfSA9IE9iamVjdC5hc3NpZ24oeyBwYXRoOiBbXSB9LCBldi5kYXRhKTtcbiAgICAgICAgY29uc3QgYXJndW1lbnRMaXN0ID0gKGV2LmRhdGEuYXJndW1lbnRMaXN0IHx8IFtdKS5tYXAoZnJvbVdpcmVWYWx1ZSk7XG4gICAgICAgIGxldCByZXR1cm5WYWx1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHBhdGguc2xpY2UoMCwgLTEpLnJlZHVjZSgob2JqLCBwcm9wKSA9PiBvYmpbcHJvcF0sIG9iaik7XG4gICAgICAgICAgICBjb25zdCByYXdWYWx1ZSA9IHBhdGgucmVkdWNlKChvYmosIHByb3ApID0+IG9ialtwcm9wXSwgb2JqKTtcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJHRVRcIiAvKiBNZXNzYWdlVHlwZS5HRVQgKi86XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlID0gcmF3VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlNFVFwiIC8qIE1lc3NhZ2VUeXBlLlNFVCAqLzpcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50W3BhdGguc2xpY2UoLTEpWzBdXSA9IGZyb21XaXJlVmFsdWUoZXYuZGF0YS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIkFQUExZXCIgLyogTWVzc2FnZVR5cGUuQVBQTFkgKi86XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlID0gcmF3VmFsdWUuYXBwbHkocGFyZW50LCBhcmd1bWVudExpc3QpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJDT05TVFJVQ1RcIiAvKiBNZXNzYWdlVHlwZS5DT05TVFJVQ1QgKi86XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbmV3IHJhd1ZhbHVlKC4uLmFyZ3VtZW50TGlzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHByb3h5KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiRU5EUE9JTlRcIiAvKiBNZXNzYWdlVHlwZS5FTkRQT0lOVCAqLzpcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBwb3J0MSwgcG9ydDIgfSA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3NlKG9iaiwgcG9ydDIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSB0cmFuc2Zlcihwb3J0MSwgW3BvcnQxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIlJFTEVBU0VcIiAvKiBNZXNzYWdlVHlwZS5SRUxFQVNFICovOlxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHsgdmFsdWUsIFt0aHJvd01hcmtlcl06IDAgfTtcbiAgICAgICAgfVxuICAgICAgICBQcm9taXNlLnJlc29sdmUocmV0dXJuVmFsdWUpXG4gICAgICAgICAgICAuY2F0Y2goKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4geyB2YWx1ZSwgW3Rocm93TWFya2VyXTogMCB9O1xuICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oKHJldHVyblZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBbd2lyZVZhbHVlLCB0cmFuc2ZlcmFibGVzXSA9IHRvV2lyZVZhbHVlKHJldHVyblZhbHVlKTtcbiAgICAgICAgICAgIGVwLnBvc3RNZXNzYWdlKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgd2lyZVZhbHVlKSwgeyBpZCB9KSwgdHJhbnNmZXJhYmxlcyk7XG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJSRUxFQVNFXCIgLyogTWVzc2FnZVR5cGUuUkVMRUFTRSAqLykge1xuICAgICAgICAgICAgICAgIC8vIGRldGFjaCBhbmQgZGVhY3RpdmUgYWZ0ZXIgc2VuZGluZyByZWxlYXNlIHJlc3BvbnNlIGFib3ZlLlxuICAgICAgICAgICAgICAgIGVwLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBjbG9zZUVuZFBvaW50KGVwKTtcbiAgICAgICAgICAgICAgICBpZiAoZmluYWxpemVyIGluIG9iaiAmJiB0eXBlb2Ygb2JqW2ZpbmFsaXplcl0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBvYmpbZmluYWxpemVyXSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIC8vIFNlbmQgU2VyaWFsaXphdGlvbiBFcnJvciBUbyBDYWxsZXJcbiAgICAgICAgICAgIGNvbnN0IFt3aXJlVmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUoe1xuICAgICAgICAgICAgICAgIHZhbHVlOiBuZXcgVHlwZUVycm9yKFwiVW5zZXJpYWxpemFibGUgcmV0dXJuIHZhbHVlXCIpLFxuICAgICAgICAgICAgICAgIFt0aHJvd01hcmtlcl06IDAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGVwLnBvc3RNZXNzYWdlKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgd2lyZVZhbHVlKSwgeyBpZCB9KSwgdHJhbnNmZXJhYmxlcyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIGlmIChlcC5zdGFydCkge1xuICAgICAgICBlcC5zdGFydCgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGlzTWVzc2FnZVBvcnQoZW5kcG9pbnQpIHtcbiAgICByZXR1cm4gZW5kcG9pbnQuY29uc3RydWN0b3IubmFtZSA9PT0gXCJNZXNzYWdlUG9ydFwiO1xufVxuZnVuY3Rpb24gY2xvc2VFbmRQb2ludChlbmRwb2ludCkge1xuICAgIGlmIChpc01lc3NhZ2VQb3J0KGVuZHBvaW50KSlcbiAgICAgICAgZW5kcG9pbnQuY2xvc2UoKTtcbn1cbmZ1bmN0aW9uIHdyYXAoZXAsIHRhcmdldCkge1xuICAgIGNvbnN0IHBlbmRpbmdMaXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG4gICAgZXAuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShldikge1xuICAgICAgICBjb25zdCB7IGRhdGEgfSA9IGV2O1xuICAgICAgICBpZiAoIWRhdGEgfHwgIWRhdGEuaWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXNvbHZlciA9IHBlbmRpbmdMaXN0ZW5lcnMuZ2V0KGRhdGEuaWQpO1xuICAgICAgICBpZiAoIXJlc29sdmVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmVyKGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgcGVuZGluZ0xpc3RlbmVycy5kZWxldGUoZGF0YS5pZCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY3JlYXRlUHJveHkoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIFtdLCB0YXJnZXQpO1xufVxuZnVuY3Rpb24gdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNSZWxlYXNlZCkge1xuICAgIGlmIChpc1JlbGVhc2VkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb3h5IGhhcyBiZWVuIHJlbGVhc2VkIGFuZCBpcyBub3QgdXNlYWJsZVwiKTtcbiAgICB9XG59XG5mdW5jdGlvbiByZWxlYXNlRW5kcG9pbnQoZXApIHtcbiAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgbmV3IE1hcCgpLCB7XG4gICAgICAgIHR5cGU6IFwiUkVMRUFTRVwiIC8qIE1lc3NhZ2VUeXBlLlJFTEVBU0UgKi8sXG4gICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIGNsb3NlRW5kUG9pbnQoZXApO1xuICAgIH0pO1xufVxuY29uc3QgcHJveHlDb3VudGVyID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IHByb3h5RmluYWxpemVycyA9IFwiRmluYWxpemF0aW9uUmVnaXN0cnlcIiBpbiBnbG9iYWxUaGlzICYmXG4gICAgbmV3IEZpbmFsaXphdGlvblJlZ2lzdHJ5KChlcCkgPT4ge1xuICAgICAgICBjb25zdCBuZXdDb3VudCA9IChwcm94eUNvdW50ZXIuZ2V0KGVwKSB8fCAwKSAtIDE7XG4gICAgICAgIHByb3h5Q291bnRlci5zZXQoZXAsIG5ld0NvdW50KTtcbiAgICAgICAgaWYgKG5ld0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICByZWxlYXNlRW5kcG9pbnQoZXApO1xuICAgICAgICB9XG4gICAgfSk7XG5mdW5jdGlvbiByZWdpc3RlclByb3h5KHByb3h5LCBlcCkge1xuICAgIGNvbnN0IG5ld0NvdW50ID0gKHByb3h5Q291bnRlci5nZXQoZXApIHx8IDApICsgMTtcbiAgICBwcm94eUNvdW50ZXIuc2V0KGVwLCBuZXdDb3VudCk7XG4gICAgaWYgKHByb3h5RmluYWxpemVycykge1xuICAgICAgICBwcm94eUZpbmFsaXplcnMucmVnaXN0ZXIocHJveHksIGVwLCBwcm94eSk7XG4gICAgfVxufVxuZnVuY3Rpb24gdW5yZWdpc3RlclByb3h5KHByb3h5KSB7XG4gICAgaWYgKHByb3h5RmluYWxpemVycykge1xuICAgICAgICBwcm94eUZpbmFsaXplcnMudW5yZWdpc3Rlcihwcm94eSk7XG4gICAgfVxufVxuZnVuY3Rpb24gY3JlYXRlUHJveHkoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIHBhdGggPSBbXSwgdGFyZ2V0ID0gZnVuY3Rpb24gKCkgeyB9KSB7XG4gICAgbGV0IGlzUHJveHlSZWxlYXNlZCA9IGZhbHNlO1xuICAgIGNvbnN0IHByb3h5ID0gbmV3IFByb3h5KHRhcmdldCwge1xuICAgICAgICBnZXQoX3RhcmdldCwgcHJvcCkge1xuICAgICAgICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTtcbiAgICAgICAgICAgIGlmIChwcm9wID09PSByZWxlYXNlUHJveHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB1bnJlZ2lzdGVyUHJveHkocHJveHkpO1xuICAgICAgICAgICAgICAgICAgICByZWxlYXNlRW5kcG9pbnQoZXApO1xuICAgICAgICAgICAgICAgICAgICBwZW5kaW5nTGlzdGVuZXJzLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgIGlzUHJveHlSZWxlYXNlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9wID09PSBcInRoZW5cIikge1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB0aGVuOiAoKSA9PiBwcm94eSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCByID0gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkdFVFwiIC8qIE1lc3NhZ2VUeXBlLkdFVCAqLyxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogcGF0aC5tYXAoKHApID0+IHAudG9TdHJpbmcoKSksXG4gICAgICAgICAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gci50aGVuLmJpbmQocik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlUHJveHkoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIFsuLi5wYXRoLCBwcm9wXSk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldChfdGFyZ2V0LCBwcm9wLCByYXdWYWx1ZSkge1xuICAgICAgICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTtcbiAgICAgICAgICAgIC8vIEZJWE1FOiBFUzYgUHJveHkgSGFuZGxlciBgc2V0YCBtZXRob2RzIGFyZSBzdXBwb3NlZCB0byByZXR1cm4gYVxuICAgICAgICAgICAgLy8gYm9vbGVhbi4gVG8gc2hvdyBnb29kIHdpbGwsIHdlIHJldHVybiB0cnVlIGFzeW5jaHJvbm91c2x5IMKvXFxfKOODhClfL8KvXG4gICAgICAgICAgICBjb25zdCBbdmFsdWUsIHRyYW5zZmVyYWJsZXNdID0gdG9XaXJlVmFsdWUocmF3VmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RSZXNwb25zZU1lc3NhZ2UoZXAsIHBlbmRpbmdMaXN0ZW5lcnMsIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIlNFVFwiIC8qIE1lc3NhZ2VUeXBlLlNFVCAqLyxcbiAgICAgICAgICAgICAgICBwYXRoOiBbLi4ucGF0aCwgcHJvcF0ubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLFxuICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgfSwgdHJhbnNmZXJhYmxlcykudGhlbihmcm9tV2lyZVZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgYXBwbHkoX3RhcmdldCwgX3RoaXNBcmcsIHJhd0FyZ3VtZW50TGlzdCkge1xuICAgICAgICAgICAgdGhyb3dJZlByb3h5UmVsZWFzZWQoaXNQcm94eVJlbGVhc2VkKTtcbiAgICAgICAgICAgIGNvbnN0IGxhc3QgPSBwYXRoW3BhdGgubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBpZiAobGFzdCA9PT0gY3JlYXRlRW5kcG9pbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIkVORFBPSU5UXCIgLyogTWVzc2FnZVR5cGUuRU5EUE9JTlQgKi8sXG4gICAgICAgICAgICAgICAgfSkudGhlbihmcm9tV2lyZVZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFdlIGp1c3QgcHJldGVuZCB0aGF0IGBiaW5kKClgIGRpZG7igJl0IGhhcHBlbi5cbiAgICAgICAgICAgIGlmIChsYXN0ID09PSBcImJpbmRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjcmVhdGVQcm94eShlcCwgcGVuZGluZ0xpc3RlbmVycywgcGF0aC5zbGljZSgwLCAtMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgW2FyZ3VtZW50TGlzdCwgdHJhbnNmZXJhYmxlc10gPSBwcm9jZXNzQXJndW1lbnRzKHJhd0FyZ3VtZW50TGlzdCk7XG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiQVBQTFlcIiAvKiBNZXNzYWdlVHlwZS5BUFBMWSAqLyxcbiAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLm1hcCgocCkgPT4gcC50b1N0cmluZygpKSxcbiAgICAgICAgICAgICAgICBhcmd1bWVudExpc3QsXG4gICAgICAgICAgICB9LCB0cmFuc2ZlcmFibGVzKS50aGVuKGZyb21XaXJlVmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgICBjb25zdHJ1Y3QoX3RhcmdldCwgcmF3QXJndW1lbnRMaXN0KSB7XG4gICAgICAgICAgICB0aHJvd0lmUHJveHlSZWxlYXNlZChpc1Byb3h5UmVsZWFzZWQpO1xuICAgICAgICAgICAgY29uc3QgW2FyZ3VtZW50TGlzdCwgdHJhbnNmZXJhYmxlc10gPSBwcm9jZXNzQXJndW1lbnRzKHJhd0FyZ3VtZW50TGlzdCk7XG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiQ09OU1RSVUNUXCIgLyogTWVzc2FnZVR5cGUuQ09OU1RSVUNUICovLFxuICAgICAgICAgICAgICAgIHBhdGg6IHBhdGgubWFwKChwKSA9PiBwLnRvU3RyaW5nKCkpLFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50TGlzdCxcbiAgICAgICAgICAgIH0sIHRyYW5zZmVyYWJsZXMpLnRoZW4oZnJvbVdpcmVWYWx1ZSk7XG4gICAgICAgIH0sXG4gICAgfSk7XG4gICAgcmVnaXN0ZXJQcm94eShwcm94eSwgZXApO1xuICAgIHJldHVybiBwcm94eTtcbn1cbmZ1bmN0aW9uIG15RmxhdChhcnIpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgYXJyKTtcbn1cbmZ1bmN0aW9uIHByb2Nlc3NBcmd1bWVudHMoYXJndW1lbnRMaXN0KSB7XG4gICAgY29uc3QgcHJvY2Vzc2VkID0gYXJndW1lbnRMaXN0Lm1hcCh0b1dpcmVWYWx1ZSk7XG4gICAgcmV0dXJuIFtwcm9jZXNzZWQubWFwKCh2KSA9PiB2WzBdKSwgbXlGbGF0KHByb2Nlc3NlZC5tYXAoKHYpID0+IHZbMV0pKV07XG59XG5jb25zdCB0cmFuc2ZlckNhY2hlID0gbmV3IFdlYWtNYXAoKTtcbmZ1bmN0aW9uIHRyYW5zZmVyKG9iaiwgdHJhbnNmZXJzKSB7XG4gICAgdHJhbnNmZXJDYWNoZS5zZXQob2JqLCB0cmFuc2ZlcnMpO1xuICAgIHJldHVybiBvYmo7XG59XG5mdW5jdGlvbiBwcm94eShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihvYmosIHsgW3Byb3h5TWFya2VyXTogdHJ1ZSB9KTtcbn1cbmZ1bmN0aW9uIHdpbmRvd0VuZHBvaW50KHcsIGNvbnRleHQgPSBnbG9iYWxUaGlzLCB0YXJnZXRPcmlnaW4gPSBcIipcIikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHBvc3RNZXNzYWdlOiAobXNnLCB0cmFuc2ZlcmFibGVzKSA9PiB3LnBvc3RNZXNzYWdlKG1zZywgdGFyZ2V0T3JpZ2luLCB0cmFuc2ZlcmFibGVzKSxcbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcjogY29udGV4dC5hZGRFdmVudExpc3RlbmVyLmJpbmQoY29udGV4dCksXG4gICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXI6IGNvbnRleHQucmVtb3ZlRXZlbnRMaXN0ZW5lci5iaW5kKGNvbnRleHQpLFxuICAgIH07XG59XG5mdW5jdGlvbiB0b1dpcmVWYWx1ZSh2YWx1ZSkge1xuICAgIGZvciAoY29uc3QgW25hbWUsIGhhbmRsZXJdIG9mIHRyYW5zZmVySGFuZGxlcnMpIHtcbiAgICAgICAgaWYgKGhhbmRsZXIuY2FuSGFuZGxlKHZhbHVlKSkge1xuICAgICAgICAgICAgY29uc3QgW3NlcmlhbGl6ZWRWYWx1ZSwgdHJhbnNmZXJhYmxlc10gPSBoYW5kbGVyLnNlcmlhbGl6ZSh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJIQU5ETEVSXCIgLyogV2lyZVZhbHVlVHlwZS5IQU5ETEVSICovLFxuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogc2VyaWFsaXplZFZhbHVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNmZXJhYmxlcyxcbiAgICAgICAgICAgIF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogXCJSQVdcIiAvKiBXaXJlVmFsdWVUeXBlLlJBVyAqLyxcbiAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICB9LFxuICAgICAgICB0cmFuc2ZlckNhY2hlLmdldCh2YWx1ZSkgfHwgW10sXG4gICAgXTtcbn1cbmZ1bmN0aW9uIGZyb21XaXJlVmFsdWUodmFsdWUpIHtcbiAgICBzd2l0Y2ggKHZhbHVlLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIkhBTkRMRVJcIiAvKiBXaXJlVmFsdWVUeXBlLkhBTkRMRVIgKi86XG4gICAgICAgICAgICByZXR1cm4gdHJhbnNmZXJIYW5kbGVycy5nZXQodmFsdWUubmFtZSkuZGVzZXJpYWxpemUodmFsdWUudmFsdWUpO1xuICAgICAgICBjYXNlIFwiUkFXXCIgLyogV2lyZVZhbHVlVHlwZS5SQVcgKi86XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUudmFsdWU7XG4gICAgfVxufVxuZnVuY3Rpb24gcmVxdWVzdFJlc3BvbnNlTWVzc2FnZShlcCwgcGVuZGluZ0xpc3RlbmVycywgbXNnLCB0cmFuc2ZlcnMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgY29uc3QgaWQgPSBnZW5lcmF0ZVVVSUQoKTtcbiAgICAgICAgcGVuZGluZ0xpc3RlbmVycy5zZXQoaWQsIHJlc29sdmUpO1xuICAgICAgICBpZiAoZXAuc3RhcnQpIHtcbiAgICAgICAgICAgIGVwLnN0YXJ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZXAucG9zdE1lc3NhZ2UoT2JqZWN0LmFzc2lnbih7IGlkIH0sIG1zZyksIHRyYW5zZmVycyk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZVVVSUQoKSB7XG4gICAgcmV0dXJuIG5ldyBBcnJheSg0KVxuICAgICAgICAuZmlsbCgwKVxuICAgICAgICAubWFwKCgpID0+IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSKS50b1N0cmluZygxNikpXG4gICAgICAgIC5qb2luKFwiLVwiKTtcbn1cblxuZXhwb3J0IHsgY3JlYXRlRW5kcG9pbnQsIGV4cG9zZSwgZmluYWxpemVyLCBwcm94eSwgcHJveHlNYXJrZXIsIHJlbGVhc2VQcm94eSwgdHJhbnNmZXIsIHRyYW5zZmVySGFuZGxlcnMsIHdpbmRvd0VuZHBvaW50LCB3cmFwIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb21saW5rLm1qcy5tYXBcbiIsIi8qIEB0cy1zZWxmLXR5cGVzPVwiLi90bHNuX3dhc20uZC50c1wiICovXG5pbXBvcnQgeyBzdGFydFNwYXduZXJXb3JrZXIgfSBmcm9tICcuL3NuaXBwZXRzL3dlYi1zcGF3bi0wNTg2ODU5M2E3MmUyZDQ0L2pzL3NwYXduLmpzJztcblxuXG4vKipcbiAqIFByb3ZlciBmb3IgdGhlIFRMU05vdGFyeSBwcm90b2NvbC5cbiAqXG4gKiBUaGUgcHJvdmVyIGNvbm5lY3RzIHRvIGJvdGggYSB2ZXJpZmllciBhbmQgYSB0YXJnZXQgc2VydmVyLCBleGVjdXRpbmcgdGhlXG4gKiBNUEMtVExTIHByb3RvY29sIHRvIGdlbmVyYXRlIHZlcmlmaWFibGUgcHJvb2ZzIG9mIHRoZSBUTFMgc2Vzc2lvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIFByb3ZlciB7XG4gICAgX19kZXN0cm95X2ludG9fcmF3KCkge1xuICAgICAgICBjb25zdCBwdHIgPSB0aGlzLl9fd2JnX3B0cjtcbiAgICAgICAgdGhpcy5fX3diZ19wdHIgPSAwO1xuICAgICAgICBQcm92ZXJGaW5hbGl6YXRpb24udW5yZWdpc3Rlcih0aGlzKTtcbiAgICAgICAgcmV0dXJuIHB0cjtcbiAgICB9XG4gICAgZnJlZSgpIHtcbiAgICAgICAgY29uc3QgcHRyID0gdGhpcy5fX2Rlc3Ryb3lfaW50b19yYXcoKTtcbiAgICAgICAgd2FzbS5fX3diZ19wcm92ZXJfZnJlZShwdHIsIDApO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IFByb3ZlciB3aXRoIHRoZSBnaXZlbiBjb25maWd1cmF0aW9uLlxuICAgICAqIEBwYXJhbSB7UHJvdmVyQ29uZmlnfSBjb25maWdcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gd2FzbS5wcm92ZXJfbmV3KGNvbmZpZyk7XG4gICAgICAgIGlmIChyZXRbMl0pIHtcbiAgICAgICAgICAgIHRocm93IHRha2VGcm9tRXh0ZXJucmVmVGFibGUwKHJldFsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fX3diZ19wdHIgPSByZXRbMF07XG4gICAgICAgIFByb3ZlckZpbmFsaXphdGlvbi5yZWdpc3Rlcih0aGlzLCB0aGlzLl9fd2JnX3B0ciwgdGhpcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXZlYWxzIGRhdGEgdG8gdGhlIHZlcmlmaWVyIGFuZCBmaW5hbGl6ZXMgdGhlIHByb3RvY29sLlxuICAgICAqXG4gICAgICogT3B0aW9uYWxseSBhY2NlcHRzIGEgYENvbW1pdGAgb2JqZWN0IHdpdGggcmFuZ2VzIHRvIGhhc2gtY29tbWl0LlxuICAgICAqIFBhc3MgYHVuZGVmaW5lZGAgb3Igb21pdCB0aGUgc2Vjb25kIGFyZ3VtZW50IGZvciByZXZlYWwtb25seSBwcm9vZnMuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGEgYFJldmVhbE91dHB1dGAgd2l0aCBvbmUgYENvbW1pdG1lbnRPcGVuaW5nYCBwZXJcbiAgICAgKiBoYXNoLWNvbW1pdHRlZCByYW5nZSAoYHsgZGlyZWN0aW9uLCByYW5nZXMsIGFsZ29yaXRobSwgaGFzaCwgYmxpbmRlclxuICAgICAqIH1gKSwgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhlIGlucHV0IGBDb21taXRgLiBUaGUgYGNvbW1pdG1lbnRzYFxuICAgICAqIGFycmF5IGlzIGVtcHR5IHdoZW4gbm8gY29tbWl0IHdhcyBzdXBwbGllZC5cbiAgICAgKiBAcGFyYW0ge1JldmVhbH0gcmV2ZWFsXG4gICAgICogQHBhcmFtIHtDb21taXQgfCBudWxsfSBbY29tbWl0XVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJldmVhbE91dHB1dD59XG4gICAgICovXG4gICAgcmV2ZWFsKHJldmVhbCwgY29tbWl0KSB7XG4gICAgICAgIGNvbnN0IHJldCA9IHdhc20ucHJvdmVyX3JldmVhbCh0aGlzLl9fd2JnX3B0ciwgcmV2ZWFsLCBpc0xpa2VOb25lKGNvbW1pdCkgPyAwIDogYWRkVG9FeHRlcm5yZWZUYWJsZTAoY29tbWl0KSk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGFuIEhUVFAgcmVxdWVzdCB0byB0aGUgc2VydmVyLlxuICAgICAqXG4gICAgICogIyBBcmd1bWVudHNcbiAgICAgKlxuICAgICAqICogYHNlcnZlcl9pb2AgLSBBbiBJb0NoYW5uZWwgY29ubmVjdGVkIHRvIHRoZSBzZXJ2ZXIuIE11c3QgYmUgcHJvdmlkZWRcbiAgICAgKiAgIGluIE1QQyBtb2RlLiBNdXN0IGJlIGBOb25lYCBpbiBwcm94eSBtb2RlLCB3aGVyZSB0aGUgY29ubmVjdGlvbiBpc1xuICAgICAqICAgcm91dGVkIHRocm91Z2ggdGhlIHZlcmlmaWVyLlxuICAgICAqICogYHJlcXVlc3RgIC0gVGhlIEhUVFAgcmVxdWVzdCB0byBzZW5kLlxuICAgICAqIEBwYXJhbSB7SW9DaGFubmVsIHwgbnVsbCB8IHVuZGVmaW5lZH0gc2VydmVyX2lvXG4gICAgICogQHBhcmFtIHtIdHRwUmVxdWVzdH0gcmVxdWVzdFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPEh0dHBSZXNwb25zZT59XG4gICAgICovXG4gICAgc2VuZF9yZXF1ZXN0KHNlcnZlcl9pbywgcmVxdWVzdCkge1xuICAgICAgICBjb25zdCByZXQgPSB3YXNtLnByb3Zlcl9zZW5kX3JlcXVlc3QodGhpcy5fX3diZ19wdHIsIGlzTGlrZU5vbmUoc2VydmVyX2lvKSA/IDAgOiBhZGRUb0V4dGVybnJlZlRhYmxlMChzZXJ2ZXJfaW8pLCByZXF1ZXN0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyBhIHByb2dyZXNzIGNhbGxiYWNrIHRoYXQgcmVjZWl2ZXMgc3RydWN0dXJlZCBwcm9ncmVzcyB1cGRhdGVzLlxuICAgICAqXG4gICAgICogVGhlIGNhbGxiYWNrIHJlY2VpdmVzIGEgc2luZ2xlIGFyZ3VtZW50OiBgeyBzdGVwOiBzdHJpbmcsIHByb2dyZXNzOlxuICAgICAqIG51bWJlciwgbWVzc2FnZTogc3RyaW5nIH1gLlxuICAgICAqXG4gICAgICogU3RlcHMgZW1pdHRlZDogYE1QQ19TRVRVUGAsIGBDT05ORUNUSU5HX1RPX1NFUlZFUmAsIGBTRU5ESU5HX1JFUVVFU1RgLFxuICAgICAqIGBSRVFVRVNUX0NPTVBMRVRFYCwgYFJFVkVBTGAsIGBGSU5BTElaRURgLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gICAgICovXG4gICAgc2V0X3Byb2dyZXNzX2NhbGxiYWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIHdhc20ucHJvdmVyX3NldF9wcm9ncmVzc19jYWxsYmFjayh0aGlzLl9fd2JnX3B0ciwgY2FsbGJhY2spO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIHVwIHRoZSBwcm92ZXIgd2l0aCB0aGUgdmVyaWZpZXIuXG4gICAgICpcbiAgICAgKiBUaGlzIHBlcmZvcm1zIGFsbCBNUEMgc2V0dXAgcHJpb3IgdG8gZXN0YWJsaXNoaW5nIHRoZSBjb25uZWN0aW9uIHRvIHRoZVxuICAgICAqIGFwcGxpY2F0aW9uIHNlcnZlci5cbiAgICAgKlxuICAgICAqICMgQXJndW1lbnRzXG4gICAgICpcbiAgICAgKiAqIGB2ZXJpZmllcl9pb2AgLSBBIEphdmFTY3JpcHQgb2JqZWN0IGltcGxlbWVudGluZyB0aGUgSW9DaGFubmVsXG4gICAgICogICBpbnRlcmZhY2UsIGNvbm5lY3RlZCB0byB0aGUgdmVyaWZpZXIuXG4gICAgICogQHBhcmFtIHtJb0NoYW5uZWx9IHZlcmlmaWVyX2lvXG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gICAgICovXG4gICAgc2V0dXAodmVyaWZpZXJfaW8pIHtcbiAgICAgICAgY29uc3QgcmV0ID0gd2FzbS5wcm92ZXJfc2V0dXAodGhpcy5fX3diZ19wdHIsIHZlcmlmaWVyX2lvKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdHJhbnNjcmlwdCBvZiB0aGUgVExTIHNlc3Npb24uXG4gICAgICogQHJldHVybnMge1RyYW5zY3JpcHR9XG4gICAgICovXG4gICAgdHJhbnNjcmlwdCgpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gd2FzbS5wcm92ZXJfdHJhbnNjcmlwdCh0aGlzLl9fd2JnX3B0cik7XG4gICAgICAgIGlmIChyZXRbMl0pIHtcbiAgICAgICAgICAgIHRocm93IHRha2VGcm9tRXh0ZXJucmVmVGFibGUwKHJldFsxXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRha2VGcm9tRXh0ZXJucmVmVGFibGUwKHJldFswXSk7XG4gICAgfVxufVxuaWYgKFN5bWJvbC5kaXNwb3NlKSBQcm92ZXIucHJvdG90eXBlW1N5bWJvbC5kaXNwb3NlXSA9IFByb3Zlci5wcm90b3R5cGUuZnJlZTtcblxuLyoqXG4gKiBHbG9iYWwgc3Bhd25lciB3aGljaCBzcGF3bnMgY2xvc3VyZXMgaW50byB3ZWIgd29ya2Vycy5cbiAqL1xuZXhwb3J0IGNsYXNzIFNwYXduZXIge1xuICAgIHN0YXRpYyBfX3dyYXAocHRyKSB7XG4gICAgICAgIGNvbnN0IG9iaiA9IE9iamVjdC5jcmVhdGUoU3Bhd25lci5wcm90b3R5cGUpO1xuICAgICAgICBvYmouX193YmdfcHRyID0gcHRyO1xuICAgICAgICBTcGF3bmVyRmluYWxpemF0aW9uLnJlZ2lzdGVyKG9iaiwgb2JqLl9fd2JnX3B0ciwgb2JqKTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG4gICAgX19kZXN0cm95X2ludG9fcmF3KCkge1xuICAgICAgICBjb25zdCBwdHIgPSB0aGlzLl9fd2JnX3B0cjtcbiAgICAgICAgdGhpcy5fX3diZ19wdHIgPSAwO1xuICAgICAgICBTcGF3bmVyRmluYWxpemF0aW9uLnVucmVnaXN0ZXIodGhpcyk7XG4gICAgICAgIHJldHVybiBwdHI7XG4gICAgfVxuICAgIGZyZWUoKSB7XG4gICAgICAgIGNvbnN0IHB0ciA9IHRoaXMuX19kZXN0cm95X2ludG9fcmF3KCk7XG4gICAgICAgIHdhc20uX193Ymdfc3Bhd25lcl9mcmVlKHB0ciwgMCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgaW50b1JhdygpIHtcbiAgICAgICAgY29uc3QgcHRyID0gdGhpcy5fX2Rlc3Ryb3lfaW50b19yYXcoKTtcbiAgICAgICAgY29uc3QgcmV0ID0gd2FzbS5zcGF3bmVyX2ludG9SYXcocHRyKTtcbiAgICAgICAgcmV0dXJuIHJldCA+Pj4gMDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUnVucyB0aGUgc3Bhd25lci5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsXG4gICAgICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gICAgICovXG4gICAgcnVuKHVybCkge1xuICAgICAgICBjb25zdCBwdHIwID0gcGFzc1N0cmluZ1RvV2FzbTAodXJsLCB3YXNtLl9fd2JpbmRnZW5fbWFsbG9jLCB3YXNtLl9fd2JpbmRnZW5fcmVhbGxvYyk7XG4gICAgICAgIGNvbnN0IGxlbjAgPSBXQVNNX1ZFQ1RPUl9MRU47XG4gICAgICAgIGNvbnN0IHJldCA9IHdhc20uc3Bhd25lcl9ydW4odGhpcy5fX3diZ19wdHIsIHB0cjAsIGxlbjApO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbn1cbmlmIChTeW1ib2wuZGlzcG9zZSkgU3Bhd25lci5wcm90b3R5cGVbU3ltYm9sLmRpc3Bvc2VdID0gU3Bhd25lci5wcm90b3R5cGUuZnJlZTtcblxuLyoqXG4gKiBWZXJpZmllciBmb3IgdGhlIFRMU05vdGFyeSBwcm90b2NvbC5cbiAqXG4gKiBUaGUgdmVyaWZpZXIgcGFydGljaXBhdGVzIGluIHRoZSBNUEMtVExTIHByb3RvY29sIHdpdGggdGhlIHByb3ZlcixcbiAqIHZlcmlmeWluZyB0aGUgYXV0aGVudGljaXR5IG9mIHRoZSBUTFMgc2Vzc2lvbiB3aXRob3V0IHNlZWluZyB0aGVcbiAqIGZ1bGwgcGxhaW50ZXh0LlxuICovXG5leHBvcnQgY2xhc3MgVmVyaWZpZXIge1xuICAgIF9fZGVzdHJveV9pbnRvX3JhdygpIHtcbiAgICAgICAgY29uc3QgcHRyID0gdGhpcy5fX3diZ19wdHI7XG4gICAgICAgIHRoaXMuX193YmdfcHRyID0gMDtcbiAgICAgICAgVmVyaWZpZXJGaW5hbGl6YXRpb24udW5yZWdpc3Rlcih0aGlzKTtcbiAgICAgICAgcmV0dXJuIHB0cjtcbiAgICB9XG4gICAgZnJlZSgpIHtcbiAgICAgICAgY29uc3QgcHRyID0gdGhpcy5fX2Rlc3Ryb3lfaW50b19yYXcoKTtcbiAgICAgICAgd2FzbS5fX3diZ192ZXJpZmllcl9mcmVlKHB0ciwgMCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbm5lY3RzIHRvIHRoZSBwcm92ZXIuXG4gICAgICpcbiAgICAgKiAjIEFyZ3VtZW50c1xuICAgICAqXG4gICAgICogKiBgcHJvdmVyX2lvYCAtIEEgSmF2YVNjcmlwdCBvYmplY3QgaW1wbGVtZW50aW5nIHRoZSBJb0NoYW5uZWxcbiAgICAgKiAgIGludGVyZmFjZSwgY29ubmVjdGVkIHRvIHRoZSBwcm92ZXIuXG4gICAgICogQHBhcmFtIHtJb0NoYW5uZWx9IHByb3Zlcl9pb1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICAgICAqL1xuICAgIGNvbm5lY3QocHJvdmVyX2lvKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IHdhc20udmVyaWZpZXJfY29ubmVjdCh0aGlzLl9fd2JnX3B0ciwgcHJvdmVyX2lvKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBWZXJpZmllciB3aXRoIHRoZSBnaXZlbiBjb25maWd1cmF0aW9uLlxuICAgICAqIEBwYXJhbSB7VmVyaWZpZXJDb25maWd9IGNvbmZpZ1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZykge1xuICAgICAgICBjb25zdCByZXQgPSB3YXNtLnZlcmlmaWVyX25ldyhjb25maWcpO1xuICAgICAgICBpZiAocmV0WzJdKSB7XG4gICAgICAgICAgICB0aHJvdyB0YWtlRnJvbUV4dGVybnJlZlRhYmxlMChyZXRbMV0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX193YmdfcHRyID0gcmV0WzBdO1xuICAgICAgICBWZXJpZmllckZpbmFsaXphdGlvbi5yZWdpc3Rlcih0aGlzLCB0aGlzLl9fd2JnX3B0ciwgdGhpcyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSdW5zIHRoZSB2ZXJpZmllciB1bnRpbCB0aGUgVExTIGNvbm5lY3Rpb24gaXMgY2xvc2VkLlxuICAgICAqXG4gICAgICogSW4gcHJveHkgbW9kZSwgYHNldF9zZXJ2ZXJfc29ja2V0KClgIG11c3QgYmUgY2FsbGVkIGZpcnN0LlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICAgICAqL1xuICAgIHJ1bigpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gd2FzbS52ZXJpZmllcl9ydW4odGhpcy5fX3diZ19wdHIpO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyB0aGUgc2VydmVyIHNvY2tldCBmb3IgcHJveHkgbW9kZS5cbiAgICAgKlxuICAgICAqIE11c3QgYmUgY2FsbGVkIGJldHdlZW4gYHNldHVwKClgIGFuZCBgcnVuKClgIHdoZW4gYHNldHVwYCByZXR1cm5lZCBhXG4gICAgICogc2VydmVyIG5hbWUuXG4gICAgICpcbiAgICAgKiAjIEFyZ3VtZW50c1xuICAgICAqXG4gICAgICogKiBgc2VydmVyX2lvYCAtIEEgSmF2YVNjcmlwdCBvYmplY3QgaW1wbGVtZW50aW5nIHRoZSBJb0NoYW5uZWxcbiAgICAgKiAgIGludGVyZmFjZSwgY29ubmVjdGVkIHRvIHRoZSBzZXJ2ZXIuXG4gICAgICogQHBhcmFtIHtJb0NoYW5uZWx9IHNlcnZlcl9pb1xuICAgICAqL1xuICAgIHNldF9zZXJ2ZXJfc29ja2V0KHNlcnZlcl9pbykge1xuICAgICAgICBjb25zdCByZXQgPSB3YXNtLnZlcmlmaWVyX3NldF9zZXJ2ZXJfc29ja2V0KHRoaXMuX193YmdfcHRyLCBzZXJ2ZXJfaW8pO1xuICAgICAgICBpZiAocmV0WzFdKSB7XG4gICAgICAgICAgICB0aHJvdyB0YWtlRnJvbUV4dGVybnJlZlRhYmxlMChyZXRbMF0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFBlcmZvcm1zIHRoZSBjb21taXRtZW50IGhhbmRzaGFrZSB3aXRoIHRoZSBwcm92ZXIuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIHRoZSBzZXJ2ZXIgbmFtZSBpbiBwcm94eSBtb2RlLCBvciBudWxsL3VuZGVmaW5lZCBmb3IgTVBDXG4gICAgICogbW9kZS4gV2hlbiBhIHNlcnZlciBuYW1lIGlzIHJldHVybmVkLCBjYWxsIGBzZXRfc2VydmVyX3NvY2tldCgpYFxuICAgICAqIHdpdGggYSBjb25uZWN0aW9uIHRvIHRoYXQgc2VydmVyIGJlZm9yZSBjYWxsaW5nIGBydW4oKWAuXG4gICAgICogQHJldHVybnMge1Byb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPn1cbiAgICAgKi9cbiAgICBzZXR1cCgpIHtcbiAgICAgICAgY29uc3QgcmV0ID0gd2FzbS52ZXJpZmllcl9zZXR1cCh0aGlzLl9fd2JnX3B0cik7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFZlcmlmaWVzIHRoZSBjb25uZWN0aW9uIGFuZCBmaW5hbGl6ZXMgdGhlIHByb3RvY29sLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFZlcmlmaWVyT3V0cHV0Pn1cbiAgICAgKi9cbiAgICB2ZXJpZnkoKSB7XG4gICAgICAgIGNvbnN0IHJldCA9IHdhc20udmVyaWZpZXJfdmVyaWZ5KHRoaXMuX193YmdfcHRyKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59XG5pZiAoU3ltYm9sLmRpc3Bvc2UpIFZlcmlmaWVyLnByb3RvdHlwZVtTeW1ib2wuZGlzcG9zZV0gPSBWZXJpZmllci5wcm90b3R5cGUuZnJlZTtcblxuZXhwb3J0IGNsYXNzIFdvcmtlckRhdGEge1xuICAgIF9fZGVzdHJveV9pbnRvX3JhdygpIHtcbiAgICAgICAgY29uc3QgcHRyID0gdGhpcy5fX3diZ19wdHI7XG4gICAgICAgIHRoaXMuX193YmdfcHRyID0gMDtcbiAgICAgICAgV29ya2VyRGF0YUZpbmFsaXphdGlvbi51bnJlZ2lzdGVyKHRoaXMpO1xuICAgICAgICByZXR1cm4gcHRyO1xuICAgIH1cbiAgICBmcmVlKCkge1xuICAgICAgICBjb25zdCBwdHIgPSB0aGlzLl9fZGVzdHJveV9pbnRvX3JhdygpO1xuICAgICAgICB3YXNtLl9fd2JnX3dvcmtlcmRhdGFfZnJlZShwdHIsIDApO1xuICAgIH1cbn1cbmlmIChTeW1ib2wuZGlzcG9zZSkgV29ya2VyRGF0YS5wcm90b3R5cGVbU3ltYm9sLmRpc3Bvc2VdID0gV29ya2VyRGF0YS5wcm90b3R5cGUuZnJlZTtcblxuLyoqXG4gKiBQYXJzZXMgSFRUUCByZXF1ZXN0L3Jlc3BvbnNlIHRyYW5zY3JpcHRzIGFuZCBtYXBzIGhhbmRsZXJzIHRvIGJ5dGUgcmFuZ2VzLlxuICpcbiAqIFRoaXMgaXMgdGhlIFdBU00gd3JhcHBlciBhcm91bmQgYHRsc25fc2RrX2NvcmU6OmNvbXB1dGVfcmV2ZWFsYC5cbiAqXG4gKiAjIEFyZ3VtZW50c1xuICpcbiAqICogYHNlbnRgIC0gUmF3IGJ5dGVzIG9mIHRoZSBIVFRQIHJlcXVlc3QgKHNlbnQgZGF0YSkuXG4gKiAqIGByZWN2YCAtIFJhdyBieXRlcyBvZiB0aGUgSFRUUCByZXNwb25zZSAocmVjZWl2ZWQgZGF0YSkuXG4gKiAqIGBoYW5kbGVyc2AgLSBBcnJheSBvZiBoYW5kbGVyIG9iamVjdHMgKGRlc2VyaWFsaXplZCBmcm9tIEpTKS5cbiAqXG4gKiAjIFJldHVybnNcbiAqXG4gKiBBIGBDb21wdXRlUmV2ZWFsT3V0cHV0YCBvYmplY3QgY29udGFpbmluZzpcbiAqIC0gYHNlbnRSYW5nZXNgIC8gYHJlY3ZSYW5nZXNgOiBieXRlIHJhbmdlcyBmb3IgYFByb3Zlci5yZXZlYWwoKWBcbiAqIC0gYHNlbnRSYW5nZXNXaXRoSGFuZGxlcnNgIC8gYHJlY3ZSYW5nZXNXaXRoSGFuZGxlcnNgOiByYW5nZXMgYW5ub3RhdGVkIHdpdGhcbiAqICAgaGFuZGxlcnNcbiAqIC0gYGNvbW1pdGAgKG9wdGlvbmFsKTogcmFuZ2VzIHRvIGhhc2gtY29tbWl0LCB3aXRoIHBlci1yYW5nZSBhbGdvcml0aG1cbiAqIEBwYXJhbSB7VWludDhBcnJheX0gc2VudFxuICogQHBhcmFtIHtVaW50OEFycmF5fSByZWN2XG4gKiBAcGFyYW0ge2FueX0gaGFuZGxlcnNcbiAqIEByZXR1cm5zIHthbnl9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlX3JldmVhbChzZW50LCByZWN2LCBoYW5kbGVycykge1xuICAgIGNvbnN0IHB0cjAgPSBwYXNzQXJyYXk4VG9XYXNtMChzZW50LCB3YXNtLl9fd2JpbmRnZW5fbWFsbG9jKTtcbiAgICBjb25zdCBsZW4wID0gV0FTTV9WRUNUT1JfTEVOO1xuICAgIGNvbnN0IHB0cjEgPSBwYXNzQXJyYXk4VG9XYXNtMChyZWN2LCB3YXNtLl9fd2JpbmRnZW5fbWFsbG9jKTtcbiAgICBjb25zdCBsZW4xID0gV0FTTV9WRUNUT1JfTEVOO1xuICAgIGNvbnN0IHJldCA9IHdhc20uY29tcHV0ZV9yZXZlYWwocHRyMCwgbGVuMCwgcHRyMSwgbGVuMSwgaGFuZGxlcnMpO1xuICAgIGlmIChyZXRbMl0pIHtcbiAgICAgICAgdGhyb3cgdGFrZUZyb21FeHRlcm5yZWZUYWJsZTAocmV0WzFdKTtcbiAgICB9XG4gICAgcmV0dXJuIHRha2VGcm9tRXh0ZXJucmVmVGFibGUwKHJldFswXSk7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIG1vZHVsZS5cbiAqIEBwYXJhbSB7TG9nZ2luZ0NvbmZpZyB8IG51bGwgfCB1bmRlZmluZWR9IGxvZ2dpbmdfY29uZmlnXG4gKiBAcGFyYW0ge251bWJlcn0gdGhyZWFkX2NvdW50XG4gKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemUobG9nZ2luZ19jb25maWcsIHRocmVhZF9jb3VudCkge1xuICAgIGNvbnN0IHJldCA9IHdhc20uaW5pdGlhbGl6ZShpc0xpa2VOb25lKGxvZ2dpbmdfY29uZmlnKSA/IDAgOiBhZGRUb0V4dGVybnJlZlRhYmxlMChsb2dnaW5nX2NvbmZpZyksIHRocmVhZF9jb3VudCk7XG4gICAgcmV0dXJuIHJldDtcbn1cblxuLyoqXG4gKiBTdGFydHMgdGhlIHRocmVhZCBzcGF3bmVyIG9uIGEgZGVkaWNhdGVkIHdvcmtlciB0aHJlYWQuXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxhbnk+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRTcGF3bmVyKCkge1xuICAgIGNvbnN0IHJldCA9IHdhc20uc3RhcnRTcGF3bmVyKCk7XG4gICAgcmV0dXJuIHJldDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gc3Bhd25lclxuICogQHJldHVybnMge1NwYXduZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3ZWJfc3Bhd25fcmVjb3Zlcl9zcGF3bmVyKHNwYXduZXIpIHtcbiAgICBjb25zdCByZXQgPSB3YXNtLndlYl9zcGF3bl9yZWNvdmVyX3NwYXduZXIoc3Bhd25lcik7XG4gICAgcmV0dXJuIFNwYXduZXIuX193cmFwKHJldCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IHdvcmtlclxuICovXG5leHBvcnQgZnVuY3Rpb24gd2ViX3NwYXduX3N0YXJ0X3dvcmtlcih3b3JrZXIpIHtcbiAgICB3YXNtLndlYl9zcGF3bl9zdGFydF93b3JrZXIod29ya2VyKTtcbn1cbmZ1bmN0aW9uIF9fd2JnX2dldF9pbXBvcnRzKG1lbW9yeSkge1xuICAgIGNvbnN0IGltcG9ydDAgPSB7XG4gICAgICAgIF9fcHJvdG9fXzogbnVsbCxcbiAgICAgICAgX193YmdfRXJyb3JfMzYzOWE2MGVkMTVmODdlNzogZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gRXJyb3IoZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzAsIGFyZzEpKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX051bWJlcl9hM2Q3MzdmZDE4M2Y3ZGNhOiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBOdW1iZXIoYXJnMCk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19TdHJpbmdfODU2NGU1NTk3OTllY2NkYTogZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gU3RyaW5nKGFyZzEpO1xuICAgICAgICAgICAgY29uc3QgcHRyMSA9IHBhc3NTdHJpbmdUb1dhc20wKHJldCwgd2FzbS5fX3diaW5kZ2VuX21hbGxvYywgd2FzbS5fX3diaW5kZ2VuX3JlYWxsb2MpO1xuICAgICAgICAgICAgY29uc3QgbGVuMSA9IFdBU01fVkVDVE9SX0xFTjtcbiAgICAgICAgICAgIGdldERhdGFWaWV3TWVtb3J5MCgpLnNldEludDMyKGFyZzAgKyA0ICogMSwgbGVuMSwgdHJ1ZSk7XG4gICAgICAgICAgICBnZXREYXRhVmlld01lbW9yeTAoKS5zZXRJbnQzMihhcmcwICsgNCAqIDAsIHB0cjEsIHRydWUpO1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19fX3diaW5kZ2VuX2JpZ2ludF9nZXRfYXNfaTY0XzNhZjZkNGNhNzcxOTNhNGI6IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIGNvbnN0IHYgPSBhcmcxO1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gdHlwZW9mKHYpID09PSAnYmlnaW50JyA/IHYgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBnZXREYXRhVmlld01lbW9yeTAoKS5zZXRCaWdJbnQ2NChhcmcwICsgOCAqIDEsIGlzTGlrZU5vbmUocmV0KSA/IEJpZ0ludCgwKSA6IHJldCwgdHJ1ZSk7XG4gICAgICAgICAgICBnZXREYXRhVmlld01lbW9yeTAoKS5zZXRJbnQzMihhcmcwICsgNCAqIDAsICFpc0xpa2VOb25lKHJldCksIHRydWUpO1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19fX3diaW5kZ2VuX2Jvb2xlYW5fZ2V0X2MzZGQ1YzM5ZjFiNWExMmI6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHYgPSBhcmcwO1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gdHlwZW9mKHYpID09PSAnYm9vbGVhbicgPyB2IDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgcmV0dXJuIGlzTGlrZU5vbmUocmV0KSA/IDB4RkZGRkZGIDogcmV0ID8gMSA6IDA7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX19fd2JpbmRnZW5fZGVidWdfc3RyaW5nXzA3Y2I3MmNmY2M5NTJlMmI6IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGRlYnVnU3RyaW5nKGFyZzEpO1xuICAgICAgICAgICAgY29uc3QgcHRyMSA9IHBhc3NTdHJpbmdUb1dhc20wKHJldCwgd2FzbS5fX3diaW5kZ2VuX21hbGxvYywgd2FzbS5fX3diaW5kZ2VuX3JlYWxsb2MpO1xuICAgICAgICAgICAgY29uc3QgbGVuMSA9IFdBU01fVkVDVE9SX0xFTjtcbiAgICAgICAgICAgIGdldERhdGFWaWV3TWVtb3J5MCgpLnNldEludDMyKGFyZzAgKyA0ICogMSwgbGVuMSwgdHJ1ZSk7XG4gICAgICAgICAgICBnZXREYXRhVmlld01lbW9yeTAoKS5zZXRJbnQzMihhcmcwICsgNCAqIDAsIHB0cjEsIHRydWUpO1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19fX3diaW5kZ2VuX2luXzI2MTdmYTc2Mzk3NjIwZDM6IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAgaW4gYXJnMTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX19fd2JpbmRnZW5faXNfYmlnaW50X2Q2YTgxNjdjYWM0MDFiOTU6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IHR5cGVvZihhcmcwKSA9PT0gJ2JpZ2ludCc7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19fX3diaW5kZ2VuX2lzX2Z1bmN0aW9uXzJmMGZkN2NlYjg2ZTY0YzU6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IHR5cGVvZihhcmcwKSA9PT0gJ2Z1bmN0aW9uJztcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX19fd2JpbmRnZW5faXNfbnVsbF8wNjYwODZiZTNhYmU5YmIzOiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwID09PSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfX193YmluZGdlbl9pc19vYmplY3RfNWIyMmZmMjQxODA2M2E5YzogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgdmFsID0gYXJnMDtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IHR5cGVvZih2YWwpID09PSAnb2JqZWN0JyAmJiB2YWwgIT09IG51bGw7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19fX3diaW5kZ2VuX2lzX3N0cmluZ19lZGRjMDdhM2VmYWQ1MmU2OiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSB0eXBlb2YoYXJnMCkgPT09ICdzdHJpbmcnO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfX193YmluZGdlbl9pc191bmRlZmluZWRfMjQ0YTkyYzM0ZDNiNmVjMDogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMCA9PT0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfX193YmluZGdlbl9qc3ZhbF9lcV80MDNlYWEzNjEwNTAwYTI1OiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwID09PSBhcmcxO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfX193YmluZGdlbl9qc3ZhbF9sb29zZV9lcV8xOTc4ZjFlNzdiNGJjZTYyOiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwID09IGFyZzE7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19fX3diaW5kZ2VuX21lbW9yeV9jMjM1NmRkMWEwODlkZmJkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IHdhc20ubWVtb3J5O1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfX193YmluZGdlbl9tb2R1bGVfZGY3MDQzOTNkZmQxODUzYzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSB3YXNtTW9kdWxlO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfX193YmluZGdlbl9udW1iZXJfZ2V0X2RkNmQ2OWE2MDc5ZjI2ZjE6IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IGFyZzE7XG4gICAgICAgICAgICBjb25zdCByZXQgPSB0eXBlb2Yob2JqKSA9PT0gJ251bWJlcicgPyBvYmogOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBnZXREYXRhVmlld01lbW9yeTAoKS5zZXRGbG9hdDY0KGFyZzAgKyA4ICogMSwgaXNMaWtlTm9uZShyZXQpID8gMCA6IHJldCwgdHJ1ZSk7XG4gICAgICAgICAgICBnZXREYXRhVmlld01lbW9yeTAoKS5zZXRJbnQzMihhcmcwICsgNCAqIDAsICFpc0xpa2VOb25lKHJldCksIHRydWUpO1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19fX3diaW5kZ2VuX3JldGhyb3dfOGU2MDk5NTZhN2I5ZjRmYjogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgdGhyb3cgYXJnMDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfX193YmluZGdlbl9zdHJpbmdfZ2V0Xzk2NTU5MjA3M2U1ZDg0OGM6IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IGFyZzE7XG4gICAgICAgICAgICBjb25zdCByZXQgPSB0eXBlb2Yob2JqKSA9PT0gJ3N0cmluZycgPyBvYmogOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB2YXIgcHRyMSA9IGlzTGlrZU5vbmUocmV0KSA/IDAgOiBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgICAgIHZhciBsZW4xID0gV0FTTV9WRUNUT1JfTEVOO1xuICAgICAgICAgICAgZ2V0RGF0YVZpZXdNZW1vcnkwKCkuc2V0SW50MzIoYXJnMCArIDQgKiAxLCBsZW4xLCB0cnVlKTtcbiAgICAgICAgICAgIGdldERhdGFWaWV3TWVtb3J5MCgpLnNldEludDMyKGFyZzAgKyA0ICogMCwgcHRyMSwgdHJ1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX19fd2JpbmRnZW5fdGhyb3dfOWM3NWQ0N2JmOWU3NzMxZTogZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGdldFN0cmluZ0Zyb21XYXNtMChhcmcwLCBhcmcxKSk7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX193YmdfY2JfdW5yZWZfMTU4ZTQzZTg2OTc4OGNkYzogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgYXJnMC5fd2JnX2NiX3VucmVmKCk7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX2FzeW5jXzFlZTViZWQ4ZmIxY2M2YmE6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAuYXN5bmM7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19idWZmZXJfNTAwZWM0NmU2NzIyZjQ5MjogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC5idWZmZXI7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19jYWxsX2E0MWQ2NDIxYjMwYTMyYzU6IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAuY2FsbChhcmcxLCBhcmcyKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sIGFyZ3VtZW50cyk7IH0sXG4gICAgICAgIF9fd2JnX2NhbGxfYWRkOWU1YTc2MzgyZTY2ODogZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC5jYWxsKGFyZzEpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSwgYXJndW1lbnRzKTsgfSxcbiAgICAgICAgX193YmdfY2xvc2VfMDBmNjlmMGVmZWNiYjJiZTogZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC5jbG9zZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSwgYXJndW1lbnRzKTsgfSxcbiAgICAgICAgX193YmdfY3J5cHRvXzM4ZGYyYmFiMTI2YjYzZGM6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAuY3J5cHRvO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfZGF0YV8wYmE0ZWNhY2M2ZjQzYTE4OiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwLmRhdGE7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19kb25lX2IxYWZkNjIwMWFjMDQ1ZTA6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAuZG9uZTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX2VudHJpZXNfYmI5ODQzYmE3M2RjNzBkNjogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gT2JqZWN0LmVudHJpZXMoYXJnMCk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19lcnJvcl9hNmZhMjAyYjU4YWExY2QzOiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBsZXQgZGVmZXJyZWQwXzA7XG4gICAgICAgICAgICBsZXQgZGVmZXJyZWQwXzE7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkMF8wID0gYXJnMDtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZDBfMSA9IGFyZzE7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMCwgYXJnMSkpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB3YXNtLl9fd2JpbmRnZW5fZnJlZShkZWZlcnJlZDBfMCwgZGVmZXJyZWQwXzEsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBfX3diZ19nZXRSYW5kb21WYWx1ZXNfYjIxNzY5OTE0MjdmNmRiODogZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCkge1xuICAgICAgICAgICAgZ2xvYmFsVGhpcy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGFyZzApO1xuICAgICAgICB9LCBhcmd1bWVudHMpOyB9LFxuICAgICAgICBfX3diZ19nZXRSYW5kb21WYWx1ZXNfYzQ0YTUwZDhjZmRhZWJlYjogZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgYXJnMC5nZXRSYW5kb21WYWx1ZXMoYXJnMSk7XG4gICAgICAgIH0sIGFyZ3VtZW50cyk7IH0sXG4gICAgICAgIF9fd2JnX2dldF82NTJmNjQwYjNiMGI2ZTNlOiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwW2FyZzEgPj4+IDBdO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfZ2V0XzljZmVhOWI3YmJmMTJhMTU6IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IFJlZmxlY3QuZ2V0KGFyZzAsIGFyZzEpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSwgYXJndW1lbnRzKTsgfSxcbiAgICAgICAgX193YmdfZ2V0X3VuY2hlY2tlZF9iZTU2MmIxNDIxNjU2MzIxOiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwW2FyZzEgPj4+IDBdO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfZ2V0X3dpdGhfcmVmX2tleV82NDEyY2YzMDk0NTk5Njk0OiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwW2FyZzFdO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfaGFyZHdhcmVDb25jdXJyZW5jeV80MWRjY2JlYmNkZTExMThmOiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwLmhhcmR3YXJlQ29uY3VycmVuY3k7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19oYXJkd2FyZUNvbmN1cnJlbmN5X2U4ZTg4ZTBmMTM4OTQ4NjQ6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAuaGFyZHdhcmVDb25jdXJyZW5jeTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX2luc3RhbmNlb2ZfQXJyYXlCdWZmZXJfZWFiOWYyOGZiZWMyMzQ3NzogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXJnMCBpbnN0YW5jZW9mIEFycmF5QnVmZmVyO1xuICAgICAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmV0ID0gcmVzdWx0O1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfaW5zdGFuY2VvZl9NYXBfMTBkNGVkZjYwZmNmOTMyNzogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXJnMCBpbnN0YW5jZW9mIE1hcDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJldCA9IHJlc3VsdDtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX2luc3RhbmNlb2ZfVWludDhBcnJheV81N2Q3N2FjZDUwZTRjNDRkOiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhcmcwIGluc3RhbmNlb2YgVWludDhBcnJheTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJldCA9IHJlc3VsdDtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX2luc3RhbmNlb2ZfV2luZG93XzQxNTNjMTgxOGExYzBjMGI6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGFyZzAgaW5zdGFuY2VvZiBXaW5kb3c7XG4gICAgICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXQgPSByZXN1bHQ7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19pbnN0YW5jZW9mX1dvcmtlckdsb2JhbFNjb3BlXzYyZWYwNDE0ZjdlMWQ5ZDE6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGxldCByZXN1bHQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGFyZzAgaW5zdGFuY2VvZiBXb3JrZXJHbG9iYWxTY29wZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHJldCA9IHJlc3VsdDtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX2lzQXJyYXlfYzZjNmVmODMwODk5NWJjZjogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gQXJyYXkuaXNBcnJheShhcmcwKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX2lzU2FmZUludGVnZXJfM2M1NmM0MjFhNWI0Y2NlNDogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gTnVtYmVyLmlzU2FmZUludGVnZXIoYXJnMCk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19pdGVyYXRvcl85ZDY4OTg1YTFkMDk2ZmMyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IFN5bWJvbC5pdGVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX2xlbmd0aF8wYTZjZTAxNmRjMTQ2MGIwOiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX2xlbmd0aF9iYTNjMDMyNjAyZWZlMzEwOiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX2xvZ19hMDhjOTQ4NThiN2IzZjVkOiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBsZXQgZGVmZXJyZWQwXzA7XG4gICAgICAgICAgICBsZXQgZGVmZXJyZWQwXzE7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkMF8wID0gYXJnMDtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZDBfMSA9IGFyZzE7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzAsIGFyZzEpKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgd2FzbS5fX3diaW5kZ2VuX2ZyZWUoZGVmZXJyZWQwXzAsIGRlZmVycmVkMF8xLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfbG9nX2FmNTdkNzZhMjA5ODEyMjg6IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIsIGFyZzMsIGFyZzQsIGFyZzUsIGFyZzYsIGFyZzcpIHtcbiAgICAgICAgICAgIGxldCBkZWZlcnJlZDBfMDtcbiAgICAgICAgICAgIGxldCBkZWZlcnJlZDBfMTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQwXzAgPSBhcmcwO1xuICAgICAgICAgICAgICAgIGRlZmVycmVkMF8xID0gYXJnMTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMCwgYXJnMSksIGdldFN0cmluZ0Zyb21XYXNtMChhcmcyLCBhcmczKSwgZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzQsIGFyZzUpLCBnZXRTdHJpbmdGcm9tV2FzbTAoYXJnNiwgYXJnNykpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB3YXNtLl9fd2JpbmRnZW5fZnJlZShkZWZlcnJlZDBfMCwgZGVmZXJyZWQwXzEsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBfX3diZ19tYXJrX2JlNWVjNWMzNWQ5MWQxNTY6IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIHBlcmZvcm1hbmNlLm1hcmsoZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzAsIGFyZzEpKTtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfbWVhc3VyZV9kYzlkMTY5OTFiYjk0MTFmOiBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyLCBhcmczKSB7XG4gICAgICAgICAgICBsZXQgZGVmZXJyZWQwXzA7XG4gICAgICAgICAgICBsZXQgZGVmZXJyZWQwXzE7XG4gICAgICAgICAgICBsZXQgZGVmZXJyZWQxXzA7XG4gICAgICAgICAgICBsZXQgZGVmZXJyZWQxXzE7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkMF8wID0gYXJnMDtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZDBfMSA9IGFyZzE7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQxXzAgPSBhcmcyO1xuICAgICAgICAgICAgICAgIGRlZmVycmVkMV8xID0gYXJnMztcbiAgICAgICAgICAgICAgICBwZXJmb3JtYW5jZS5tZWFzdXJlKGdldFN0cmluZ0Zyb21XYXNtMChhcmcwLCBhcmcxKSwgZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzIsIGFyZzMpKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgd2FzbS5fX3diaW5kZ2VuX2ZyZWUoZGVmZXJyZWQwXzAsIGRlZmVycmVkMF8xLCAxKTtcbiAgICAgICAgICAgICAgICB3YXNtLl9fd2JpbmRnZW5fZnJlZShkZWZlcnJlZDFfMCwgZGVmZXJyZWQxXzEsIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBhcmd1bWVudHMpOyB9LFxuICAgICAgICBfX3diZ19tc0NyeXB0b19iZDVhMDM0YWY5NmJjYmE2OiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwLm1zQ3J5cHRvO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfbmF2aWdhdG9yXzgzZGFmMjlmNWJlYjQwNjQ6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAubmF2aWdhdG9yO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfbmF2aWdhdG9yX2YzNDY4YzZkYzkwMDZiN2M6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAubmF2aWdhdG9yO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfbmV3XzIyN2Q3YzA1NDE0ZWI4NjE6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gbmV3IEVycm9yKCk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19uZXdfMmZhZDhjYTAyZmQwMDY4NDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBuZXcgT2JqZWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19uZXdfM2JhYThkOTg2NjE1NWM3OTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX25ld184NDU0ZWVlNjcyYjJiYTZlOiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBuZXcgVWludDhBcnJheShhcmcwKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX25ld19iOTIzNjRhYzUyMDJhNmRlOiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBuZXcgSW50MzJBcnJheShhcmcwKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX25ld19lYjhhY2Q5MzUyYmU4NGJhOiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZTAgPSB7YTogYXJnMCwgYjogYXJnMX07XG4gICAgICAgICAgICAgICAgdmFyIGNiMCA9IChhcmcwLCBhcmcxKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGEgPSBzdGF0ZTAuYTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUwLmEgPSAwO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fY29udmVydF9fY2xvc3VyZXNfX19fX2ludm9rZV9fX2pzX3N5c19hYWFmZDI2ZjRjNTgyMzdhX19fRnVuY3Rpb25fZm5fd2FzbV9iaW5kZ2VuXzRjODMxMTYxZmZjMThmMzhfX19Kc1ZhbHVlX19fX193YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX3N5c19fVW5kZWZpbmVkX19fanNfc3lzX2FhYWZkMjZmNGM1ODIzN2FfX19GdW5jdGlvbl9mbl93YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX0pzVmFsdWVfX19fX3dhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fc3lzX19VbmRlZmluZWRfX19fX19fdHJ1ZV8oYSwgc3RhdGUwLmIsIGFyZzAsIGFyZzEpO1xuICAgICAgICAgICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUwLmEgPSBhO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXQgPSBuZXcgUHJvbWlzZShjYjApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHN0YXRlMC5hID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfbmV3X2Zyb21fc2xpY2VfNWExNzNjMjQzYWYyZTgyMzogZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gbmV3IFVpbnQ4QXJyYXkoZ2V0QXJyYXlVOEZyb21XYXNtMChhcmcwLCBhcmcxKSk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19uZXdfdHlwZWRfMTEzNzYwMjcwMWRjODdkNDogZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdGUwID0ge2E6IGFyZzAsIGI6IGFyZzF9O1xuICAgICAgICAgICAgICAgIHZhciBjYjAgPSAoYXJnMCwgYXJnMSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhID0gc3RhdGUwLmE7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlMC5hID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX2NvbnZlcnRfX2Nsb3N1cmVzX19fX19pbnZva2VfX19qc19zeXNfYWFhZmQyNmY0YzU4MjM3YV9fX0Z1bmN0aW9uX2ZuX3dhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fSnNWYWx1ZV9fX19fd2FzbV9iaW5kZ2VuXzRjODMxMTYxZmZjMThmMzhfX19zeXNfX1VuZGVmaW5lZF9fX2pzX3N5c19hYWFmZDI2ZjRjNTgyMzdhX19fRnVuY3Rpb25fZm5fd2FzbV9iaW5kZ2VuXzRjODMxMTYxZmZjMThmMzhfX19Kc1ZhbHVlX19fX193YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX3N5c19fVW5kZWZpbmVkX19fX19fX3RydWVfKGEsIHN0YXRlMC5iLCBhcmcwLCBhcmcxKTtcbiAgICAgICAgICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlMC5hID0gYTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY29uc3QgcmV0ID0gbmV3IFByb21pc2UoY2IwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBzdGF0ZTAuYSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX25ld193aXRoX2xlbmd0aF85MDExZjVkYTc5NGJmNWQ5OiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBuZXcgVWludDhBcnJheShhcmcwID4+PiAwKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX25ld193aXRoX29wdGlvbnNfYTk5ZGUwMjJjMjE4ZGE4YzogZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gbmV3IFdvcmtlcihnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMCwgYXJnMSksIGFyZzIpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSwgYXJndW1lbnRzKTsgfSxcbiAgICAgICAgX193YmdfbmV3X3dvcmtlcl81ODc3NjdmNWI3NzhmNmNlOiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBuZXcgV29ya2VyKGdldFN0cmluZ0Zyb21XYXNtMChhcmcwLCBhcmcxKSk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19uZXh0XzI2MWMzYzQ4YzZlMzA5YTU6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAubmV4dDtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX25leHRfYWFjZWUzMTBiY2ZlNjQ2MTogZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC5uZXh0KCk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LCBhcmd1bWVudHMpOyB9LFxuICAgICAgICBfX3diZ19ub2RlXzg0ZWE4NzU0MTEyNTRkYjE6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAubm9kZTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX25vd180ZjQ1N2YxMGY4NjRhZWM1OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19ub3dfZTdjNjc5NWE3ZjgxZTEwZjogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC5ub3coKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX29mXzI0Y2NiMjQ3NzA5YmFmZDI6IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IEFycmF5Lm9mKGFyZzAsIGFyZzEsIGFyZzIpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfcGVyZm9ybWFuY2VfM2ZjZjZlMzJhN2UxZWQwYTogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC5wZXJmb3JtYW5jZTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX3Bvc3RNZXNzYWdlX2I4ODk5YjViMGNhOWFkNWY6IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIGFyZzAucG9zdE1lc3NhZ2UoYXJnMSk7XG4gICAgICAgIH0sIGFyZ3VtZW50cyk7IH0sXG4gICAgICAgIF9fd2JnX3Bvc3RNZXNzYWdlX2QzMzcyMTZjZGEwZTYwMDI6IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIGFyZzAucG9zdE1lc3NhZ2UoYXJnMSk7XG4gICAgICAgIH0sIGFyZ3VtZW50cyk7IH0sXG4gICAgICAgIF9fd2JnX3Byb2Nlc3NfNDRjN2ExNGUxMWU5ZjY5ZTogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC5wcm9jZXNzO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfcHJvdG90eXBlc2V0Y2FsbF9mZDQwNTBlODA2ZTFkNTE5OiBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgICAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChnZXRBcnJheVU4RnJvbVdhc20wKGFyZzAsIGFyZzEpLCBhcmcyKTtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfcHVzaF82MGE1MzY2YzBiYjIyYTdkOiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwLnB1c2goYXJnMSk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19xdWV1ZU1pY3JvdGFza180MGFjNmZmYzI4NDhiYTc3OiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBxdWV1ZU1pY3JvdGFzayhhcmcwKTtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfcXVldWVNaWNyb3Rhc2tfNzRkMDkyNDM5ZjY0OTRjMTogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC5xdWV1ZU1pY3JvdGFzaztcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX3JhbmRvbUZpbGxTeW5jXzZjMjVlYWM5ODY5ZWI1M2M6IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIGFyZzAucmFuZG9tRmlsbFN5bmMoYXJnMSk7XG4gICAgICAgIH0sIGFyZ3VtZW50cyk7IH0sXG4gICAgICAgIF9fd2JnX3JlYWRfZmFjZjdlOWMwOWQ0MmI3ZTogZnVuY3Rpb24oKSB7IHJldHVybiBoYW5kbGVFcnJvcihmdW5jdGlvbiAoYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC5yZWFkKCk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LCBhcmd1bWVudHMpOyB9LFxuICAgICAgICBfX3diZ19yZXF1aXJlX2I0ZWRiZGNmM2UyYTFlZjA6IGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFuZGxlRXJyb3IoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gbW9kdWxlLnJlcXVpcmU7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LCBhcmd1bWVudHMpOyB9LFxuICAgICAgICBfX3diZ19yZXNvbHZlXzlmZWI1ZDkwNmNhNjI0MTk6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IFByb21pc2UucmVzb2x2ZShhcmcwKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX3NldF81MzM3ZjhhYzgyMzY0YTNmOiBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBSZWZsZWN0LnNldChhcmcwLCBhcmcxLCBhcmcyKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sIGFyZ3VtZW50cyk7IH0sXG4gICAgICAgIF9fd2JnX3NldF82YmU0Mjc2OGM2OTBlMzgwOiBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgICAgICBhcmcwW2FyZzFdID0gYXJnMjtcbiAgICAgICAgfSxcbiAgICAgICAgX193Ymdfc2V0X2Y2MTRmNmEwNjA4ZDFkMWQ6IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgICAgIGFyZzBbYXJnMSA+Pj4gMF0gPSBhcmcyO1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19zZXRfbmFtZV9mNmUyM2FkODQzY2M2NTRiOiBmdW5jdGlvbihhcmcwLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgICAgICBhcmcwLm5hbWUgPSBnZXRTdHJpbmdGcm9tV2FzbTAoYXJnMSwgYXJnMik7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX3NldF9vbm1lc3NhZ2VfMTQ2ZTY5YmNlNTUxYjFiNjogZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgYXJnMC5vbm1lc3NhZ2UgPSBhcmcxO1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19zZXRfdHlwZV84NmMyOGMwNTkxNzVmYTA1OiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBhcmcwLnR5cGUgPSBfX3diaW5kZ2VuX2VudW1fV29ya2VyVHlwZVthcmcxXTtcbiAgICAgICAgfSxcbiAgICAgICAgX193Ymdfc3RhY2tfM2IwZDk3NGJiZjMxZTQ0ZjogZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMS5zdGFjaztcbiAgICAgICAgICAgIGNvbnN0IHB0cjEgPSBwYXNzU3RyaW5nVG9XYXNtMChyZXQsIHdhc20uX193YmluZGdlbl9tYWxsb2MsIHdhc20uX193YmluZGdlbl9yZWFsbG9jKTtcbiAgICAgICAgICAgIGNvbnN0IGxlbjEgPSBXQVNNX1ZFQ1RPUl9MRU47XG4gICAgICAgICAgICBnZXREYXRhVmlld01lbW9yeTAoKS5zZXRJbnQzMihhcmcwICsgNCAqIDEsIGxlbjEsIHRydWUpO1xuICAgICAgICAgICAgZ2V0RGF0YVZpZXdNZW1vcnkwKCkuc2V0SW50MzIoYXJnMCArIDQgKiAwLCBwdHIxLCB0cnVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgX193Ymdfc3RhcnRTcGF3bmVyV29ya2VyX2Q2MjMzNzZjYjZhNzQ3Zjk6IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IHN0YXJ0U3Bhd25lcldvcmtlcihhcmcwLCBhcmcxLCBTcGF3bmVyLl9fd3JhcChhcmcyKSk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ19zdGF0aWNfYWNjZXNzb3JfR0xPQkFMX1RISVNfMWM3ZjFiZDZjNjk0MWZkYjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSB0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogZ2xvYmFsVGhpcztcbiAgICAgICAgICAgIHJldHVybiBpc0xpa2VOb25lKHJldCkgPyAwIDogYWRkVG9FeHRlcm5yZWZUYWJsZTAocmV0KTtcbiAgICAgICAgfSxcbiAgICAgICAgX193Ymdfc3RhdGljX2FjY2Vzc29yX0dMT0JBTF9lMDM5YmM5MTRmODNlNzRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IHR5cGVvZiBnbG9iYWwgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IGdsb2JhbDtcbiAgICAgICAgICAgIHJldHVybiBpc0xpa2VOb25lKHJldCkgPyAwIDogYWRkVG9FeHRlcm5yZWZUYWJsZTAocmV0KTtcbiAgICAgICAgfSxcbiAgICAgICAgX193Ymdfc3RhdGljX2FjY2Vzc29yX1NFTEZfOGJmOGM0OGMyODQyMGFkNTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSB0eXBlb2Ygc2VsZiA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogc2VsZjtcbiAgICAgICAgICAgIHJldHVybiBpc0xpa2VOb25lKHJldCkgPyAwIDogYWRkVG9FeHRlcm5yZWZUYWJsZTAocmV0KTtcbiAgICAgICAgfSxcbiAgICAgICAgX193Ymdfc3RhdGljX2FjY2Vzc29yX1dJTkRPV182YWVlZTliNTE2NTJlZTBmOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHdpbmRvdztcbiAgICAgICAgICAgIHJldHVybiBpc0xpa2VOb25lKHJldCkgPyAwIDogYWRkVG9FeHRlcm5yZWZUYWJsZTAocmV0KTtcbiAgICAgICAgfSxcbiAgICAgICAgX193Ymdfc3ViYXJyYXlfZmJlM2NlZjI5MGUxZmE0MzogZnVuY3Rpb24oYXJnMCwgYXJnMSwgYXJnMikge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC5zdWJhcnJheShhcmcxID4+PiAwLCBhcmcyID4+PiAwKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX3RoZW5fMjBhMTU3ZDkzOWI1MTRmNTogZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC50aGVuKGFyZzEpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfdGhlbl80ZDBkYzA5ZDAzMzRmOGEwOiBmdW5jdGlvbihhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwLnRoZW4oYXJnMSk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ190aGVuXzVlZjliNzYyYmM5MTU1NWM6IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAudGhlbihhcmcxLCBhcmcyKTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX3RpbWVPcmlnaW5fZjNkNWNiNGY0YTA2YzJiNzogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC50aW1lT3JpZ2luO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmdfdmFsdWVfOWE0NWFmMGUyNmIxZjg3YzogZnVuY3Rpb24oYXJnMCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gYXJnMC52YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JnX3ZhbHVlX2Y4NTI3MTZhY2RlYjNlODI6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGFyZzAudmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ192ZXJzaW9uc18yNzZiMjc5NWIxYzZhMjE5OiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwLnZlcnNpb25zO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193Ymdfd2FpdEFzeW5jXzQ2YjljMTY5MTc0MDJiNmI6IGZ1bmN0aW9uKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJldCA9IEF0b21pY3Mud2FpdEFzeW5jKGFyZzAsIGFyZzEgPj4+IDAsIGFyZzIpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193Ymdfd2FpdEFzeW5jXzVjNDU5ZDJkMDI5NWMyMDI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gQXRvbWljcy53YWl0QXN5bmM7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diZ193cml0ZV9lYTdlMmRlYzc3ZTBmODAwOiBmdW5jdGlvbigpIHsgcmV0dXJuIGhhbmRsZUVycm9yKGZ1bmN0aW9uIChhcmcwLCBhcmcxKSB7XG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwLndyaXRlKGFyZzEpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSwgYXJndW1lbnRzKTsgfSxcbiAgICAgICAgX193YmluZGdlbl9jYXN0XzAwMDAwMDAwMDAwMDAwMDE6IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIC8vIENhc3QgaW50cmluc2ljIGZvciBgQ2xvc3VyZShDbG9zdXJlIHsgb3duZWQ6IHRydWUsIGZ1bmN0aW9uOiBGdW5jdGlvbiB7IGFyZ3VtZW50czogW0V4dGVybnJlZl0sIHNoaW1faWR4OiAyMTc2LCByZXQ6IFVuaXQsIGlubmVyX3JldDogU29tZShVbml0KSB9LCBtdXRhYmxlOiB0cnVlIH0pIC0+IEV4dGVybnJlZmAuXG4gICAgICAgICAgICBjb25zdCByZXQgPSBtYWtlTXV0Q2xvc3VyZShhcmcwLCBhcmcxLCB3YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX2NvbnZlcnRfX2Nsb3N1cmVzX19fX19pbnZva2VfX193YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX0pzVmFsdWVfX19fX190cnVlXyk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diaW5kZ2VuX2Nhc3RfMDAwMDAwMDAwMDAwMDAwMjogZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgLy8gQ2FzdCBpbnRyaW5zaWMgZm9yIGBDbG9zdXJlKENsb3N1cmUgeyBvd25lZDogdHJ1ZSwgZnVuY3Rpb246IEZ1bmN0aW9uIHsgYXJndW1lbnRzOiBbRXh0ZXJucmVmXSwgc2hpbV9pZHg6IDQ1MjksIHJldDogUmVzdWx0KFVuaXQpLCBpbm5lcl9yZXQ6IFNvbWUoUmVzdWx0KFVuaXQpKSB9LCBtdXRhYmxlOiB0cnVlIH0pIC0+IEV4dGVybnJlZmAuXG4gICAgICAgICAgICBjb25zdCByZXQgPSBtYWtlTXV0Q2xvc3VyZShhcmcwLCBhcmcxLCB3YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX2NvbnZlcnRfX2Nsb3N1cmVzX19fX19pbnZva2VfX193YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX0pzVmFsdWVfX2NvcmVfMTA0ZmE1MTA0Y2JlOTc5Y19fX3Jlc3VsdF9fUmVzdWx0X19fX193YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX0pzRXJyb3JfX190cnVlXyk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diaW5kZ2VuX2Nhc3RfMDAwMDAwMDAwMDAwMDAwMzogZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgLy8gQ2FzdCBpbnRyaW5zaWMgZm9yIGBDbG9zdXJlKENsb3N1cmUgeyBvd25lZDogdHJ1ZSwgZnVuY3Rpb246IEZ1bmN0aW9uIHsgYXJndW1lbnRzOiBbRXh0ZXJucmVmXSwgc2hpbV9pZHg6IDQ1MzEsIHJldDogVW5pdCwgaW5uZXJfcmV0OiBTb21lKFVuaXQpIH0sIG11dGFibGU6IHRydWUgfSkgLT4gRXh0ZXJucmVmYC5cbiAgICAgICAgICAgIGNvbnN0IHJldCA9IG1ha2VNdXRDbG9zdXJlKGFyZzAsIGFyZzEsIHdhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fY29udmVydF9fY2xvc3VyZXNfX19fX2ludm9rZV9fX2pzX3N5c19hYWFmZDI2ZjRjNTgyMzdhX19fZnV0dXJlc19fdGFza19fd2FpdF9hc3luY19wb2x5ZmlsbF9fTWVzc2FnZUV2ZW50X19fX19fdHJ1ZV8pO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmluZGdlbl9jYXN0XzAwMDAwMDAwMDAwMDAwMDQ6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIC8vIENhc3QgaW50cmluc2ljIGZvciBgRjY0IC0+IEV4dGVybnJlZmAuXG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmluZGdlbl9jYXN0XzAwMDAwMDAwMDAwMDAwMDU6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIC8vIENhc3QgaW50cmluc2ljIGZvciBgSTY0IC0+IEV4dGVybnJlZmAuXG4gICAgICAgICAgICBjb25zdCByZXQgPSBhcmcwO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmluZGdlbl9jYXN0XzAwMDAwMDAwMDAwMDAwMDY6IGZ1bmN0aW9uKGFyZzAsIGFyZzEpIHtcbiAgICAgICAgICAgIC8vIENhc3QgaW50cmluc2ljIGZvciBgUmVmKFNsaWNlKFU4KSkgLT4gTmFtZWRFeHRlcm5yZWYoXCJVaW50OEFycmF5XCIpYC5cbiAgICAgICAgICAgIGNvbnN0IHJldCA9IGdldEFycmF5VThGcm9tV2FzbTAoYXJnMCwgYXJnMSk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diaW5kZ2VuX2Nhc3RfMDAwMDAwMDAwMDAwMDAwNzogZnVuY3Rpb24oYXJnMCwgYXJnMSkge1xuICAgICAgICAgICAgLy8gQ2FzdCBpbnRyaW5zaWMgZm9yIGBSZWYoU3RyaW5nKSAtPiBFeHRlcm5yZWZgLlxuICAgICAgICAgICAgY29uc3QgcmV0ID0gZ2V0U3RyaW5nRnJvbVdhc20wKGFyZzAsIGFyZzEpO1xuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgX193YmluZGdlbl9jYXN0XzAwMDAwMDAwMDAwMDAwMDg6IGZ1bmN0aW9uKGFyZzApIHtcbiAgICAgICAgICAgIC8vIENhc3QgaW50cmluc2ljIGZvciBgVTY0IC0+IEV4dGVybnJlZmAuXG4gICAgICAgICAgICBjb25zdCByZXQgPSBCaWdJbnQuYXNVaW50Tig2NCwgYXJnMCk7XG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBfX3diaW5kZ2VuX2luaXRfZXh0ZXJucmVmX3RhYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhYmxlID0gd2FzbS5fX3diaW5kZ2VuX2V4dGVybnJlZnM7XG4gICAgICAgICAgICBjb25zdCBvZmZzZXQgPSB0YWJsZS5ncm93KDQpO1xuICAgICAgICAgICAgdGFibGUuc2V0KDAsIHVuZGVmaW5lZCk7XG4gICAgICAgICAgICB0YWJsZS5zZXQob2Zmc2V0ICsgMCwgdW5kZWZpbmVkKTtcbiAgICAgICAgICAgIHRhYmxlLnNldChvZmZzZXQgKyAxLCBudWxsKTtcbiAgICAgICAgICAgIHRhYmxlLnNldChvZmZzZXQgKyAyLCB0cnVlKTtcbiAgICAgICAgICAgIHRhYmxlLnNldChvZmZzZXQgKyAzLCBmYWxzZSk7XG4gICAgICAgIH0sXG4gICAgICAgIF9fd2JpbmRnZW5fbGlua18wNWQ4NTcwNDc3ODEzZmY0OiBmdW5jdGlvbihhcmcwKSB7XG4gICAgICAgICAgICBjb25zdCB2YWwgPSBgb25tZXNzYWdlID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgbGV0IFtpYSwgaW5kZXgsIHZhbHVlXSA9IGV2LmRhdGE7XG4gICAgICAgICAgICAgICAgaWEgPSBuZXcgSW50MzJBcnJheShpYS5idWZmZXIpO1xuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBBdG9taWNzLndhaXQoaWEsIGluZGV4LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgcG9zdE1lc3NhZ2UocmVzdWx0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBgO1xuICAgICAgICAgICAgY29uc3QgcmV0ID0gdHlwZW9mIFVSTC5jcmVhdGVPYmplY3RVUkwgPT09ICd1bmRlZmluZWQnID8gXCJkYXRhOmFwcGxpY2F0aW9uL2phdmFzY3JpcHQsXCIgKyBlbmNvZGVVUklDb21wb25lbnQodmFsKSA6IFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW3ZhbF0sIHsgdHlwZTogXCJ0ZXh0L2phdmFzY3JpcHRcIiB9KSk7XG4gICAgICAgICAgICBjb25zdCBwdHIxID0gcGFzc1N0cmluZ1RvV2FzbTAocmV0LCB3YXNtLl9fd2JpbmRnZW5fbWFsbG9jLCB3YXNtLl9fd2JpbmRnZW5fcmVhbGxvYyk7XG4gICAgICAgICAgICBjb25zdCBsZW4xID0gV0FTTV9WRUNUT1JfTEVOO1xuICAgICAgICAgICAgZ2V0RGF0YVZpZXdNZW1vcnkwKCkuc2V0SW50MzIoYXJnMCArIDQgKiAxLCBsZW4xLCB0cnVlKTtcbiAgICAgICAgICAgIGdldERhdGFWaWV3TWVtb3J5MCgpLnNldEludDMyKGFyZzAgKyA0ICogMCwgcHRyMSwgdHJ1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIG1lbW9yeTogbWVtb3J5IHx8IG5ldyBXZWJBc3NlbWJseS5NZW1vcnkoe2luaXRpYWw6MTQ4LG1heGltdW06NjU1MzYsc2hhcmVkOnRydWV9KSxcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIF9fcHJvdG9fXzogbnVsbCxcbiAgICAgICAgXCIuL3Rsc25fd2FzbV9iZy5qc1wiOiBpbXBvcnQwLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHdhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fY29udmVydF9fY2xvc3VyZXNfX19fX2ludm9rZV9fX3dhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fSnNWYWx1ZV9fX19fX3RydWVfKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICB3YXNtLndhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fY29udmVydF9fY2xvc3VyZXNfX19fX2ludm9rZV9fX3dhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fSnNWYWx1ZV9fX19fX3RydWVfKGFyZzAsIGFyZzEsIGFyZzIpO1xufVxuXG5mdW5jdGlvbiB3YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX2NvbnZlcnRfX2Nsb3N1cmVzX19fX19pbnZva2VfX19qc19zeXNfYWFhZmQyNmY0YzU4MjM3YV9fX2Z1dHVyZXNfX3Rhc2tfX3dhaXRfYXN5bmNfcG9seWZpbGxfX01lc3NhZ2VFdmVudF9fX19fX3RydWVfKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICB3YXNtLndhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fY29udmVydF9fY2xvc3VyZXNfX19fX2ludm9rZV9fX2pzX3N5c19hYWFmZDI2ZjRjNTgyMzdhX19fZnV0dXJlc19fdGFza19fd2FpdF9hc3luY19wb2x5ZmlsbF9fTWVzc2FnZUV2ZW50X19fX19fdHJ1ZV8oYXJnMCwgYXJnMSwgYXJnMik7XG59XG5cbmZ1bmN0aW9uIHdhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fY29udmVydF9fY2xvc3VyZXNfX19fX2ludm9rZV9fX3dhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fSnNWYWx1ZV9fY29yZV8xMDRmYTUxMDRjYmU5NzljX19fcmVzdWx0X19SZXN1bHRfX19fX3dhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fSnNFcnJvcl9fX3RydWVfKGFyZzAsIGFyZzEsIGFyZzIpIHtcbiAgICBjb25zdCByZXQgPSB3YXNtLndhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fY29udmVydF9fY2xvc3VyZXNfX19fX2ludm9rZV9fX3dhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fSnNWYWx1ZV9fY29yZV8xMDRmYTUxMDRjYmU5NzljX19fcmVzdWx0X19SZXN1bHRfX19fX3dhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fSnNFcnJvcl9fX3RydWVfKGFyZzAsIGFyZzEsIGFyZzIpO1xuICAgIGlmIChyZXRbMV0pIHtcbiAgICAgICAgdGhyb3cgdGFrZUZyb21FeHRlcm5yZWZUYWJsZTAocmV0WzBdKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHdhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fY29udmVydF9fY2xvc3VyZXNfX19fX2ludm9rZV9fX2pzX3N5c19hYWFmZDI2ZjRjNTgyMzdhX19fRnVuY3Rpb25fZm5fd2FzbV9iaW5kZ2VuXzRjODMxMTYxZmZjMThmMzhfX19Kc1ZhbHVlX19fX193YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX3N5c19fVW5kZWZpbmVkX19fanNfc3lzX2FhYWZkMjZmNGM1ODIzN2FfX19GdW5jdGlvbl9mbl93YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX0pzVmFsdWVfX19fX3dhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fc3lzX19VbmRlZmluZWRfX19fX19fdHJ1ZV8oYXJnMCwgYXJnMSwgYXJnMiwgYXJnMykge1xuICAgIHdhc20ud2FzbV9iaW5kZ2VuXzRjODMxMTYxZmZjMThmMzhfX19jb252ZXJ0X19jbG9zdXJlc19fX19faW52b2tlX19fanNfc3lzX2FhYWZkMjZmNGM1ODIzN2FfX19GdW5jdGlvbl9mbl93YXNtX2JpbmRnZW5fNGM4MzExNjFmZmMxOGYzOF9fX0pzVmFsdWVfX19fX3dhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fc3lzX19VbmRlZmluZWRfX19qc19zeXNfYWFhZmQyNmY0YzU4MjM3YV9fX0Z1bmN0aW9uX2ZuX3dhc21fYmluZGdlbl80YzgzMTE2MWZmYzE4ZjM4X19fSnNWYWx1ZV9fX19fd2FzbV9iaW5kZ2VuXzRjODMxMTYxZmZjMThmMzhfX19zeXNfX1VuZGVmaW5lZF9fX19fX190cnVlXyhhcmcwLCBhcmcxLCBhcmcyLCBhcmczKTtcbn1cblxuXG5jb25zdCBfX3diaW5kZ2VuX2VudW1fV29ya2VyVHlwZSA9IFtcImNsYXNzaWNcIiwgXCJtb2R1bGVcIl07XG5jb25zdCBQcm92ZXJGaW5hbGl6YXRpb24gPSAodHlwZW9mIEZpbmFsaXphdGlvblJlZ2lzdHJ5ID09PSAndW5kZWZpbmVkJylcbiAgICA/IHsgcmVnaXN0ZXI6ICgpID0+IHt9LCB1bnJlZ2lzdGVyOiAoKSA9PiB7fSB9XG4gICAgOiBuZXcgRmluYWxpemF0aW9uUmVnaXN0cnkocHRyID0+IHdhc20uX193YmdfcHJvdmVyX2ZyZWUocHRyLCAxKSk7XG5jb25zdCBWZXJpZmllckZpbmFsaXphdGlvbiA9ICh0eXBlb2YgRmluYWxpemF0aW9uUmVnaXN0cnkgPT09ICd1bmRlZmluZWQnKVxuICAgID8geyByZWdpc3RlcjogKCkgPT4ge30sIHVucmVnaXN0ZXI6ICgpID0+IHt9IH1cbiAgICA6IG5ldyBGaW5hbGl6YXRpb25SZWdpc3RyeShwdHIgPT4gd2FzbS5fX3diZ192ZXJpZmllcl9mcmVlKHB0ciwgMSkpO1xuY29uc3QgU3Bhd25lckZpbmFsaXphdGlvbiA9ICh0eXBlb2YgRmluYWxpemF0aW9uUmVnaXN0cnkgPT09ICd1bmRlZmluZWQnKVxuICAgID8geyByZWdpc3RlcjogKCkgPT4ge30sIHVucmVnaXN0ZXI6ICgpID0+IHt9IH1cbiAgICA6IG5ldyBGaW5hbGl6YXRpb25SZWdpc3RyeShwdHIgPT4gd2FzbS5fX3diZ19zcGF3bmVyX2ZyZWUocHRyLCAxKSk7XG5jb25zdCBXb3JrZXJEYXRhRmluYWxpemF0aW9uID0gKHR5cGVvZiBGaW5hbGl6YXRpb25SZWdpc3RyeSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgPyB7IHJlZ2lzdGVyOiAoKSA9PiB7fSwgdW5yZWdpc3RlcjogKCkgPT4ge30gfVxuICAgIDogbmV3IEZpbmFsaXphdGlvblJlZ2lzdHJ5KHB0ciA9PiB3YXNtLl9fd2JnX3dvcmtlcmRhdGFfZnJlZShwdHIsIDEpKTtcblxuZnVuY3Rpb24gYWRkVG9FeHRlcm5yZWZUYWJsZTAob2JqKSB7XG4gICAgY29uc3QgaWR4ID0gd2FzbS5fX2V4dGVybnJlZl90YWJsZV9hbGxvYygpO1xuICAgIHdhc20uX193YmluZGdlbl9leHRlcm5yZWZzLnNldChpZHgsIG9iaik7XG4gICAgcmV0dXJuIGlkeDtcbn1cblxuY29uc3QgQ0xPU1VSRV9EVE9SUyA9ICh0eXBlb2YgRmluYWxpemF0aW9uUmVnaXN0cnkgPT09ICd1bmRlZmluZWQnKVxuICAgID8geyByZWdpc3RlcjogKCkgPT4ge30sIHVucmVnaXN0ZXI6ICgpID0+IHt9IH1cbiAgICA6IG5ldyBGaW5hbGl6YXRpb25SZWdpc3RyeShzdGF0ZSA9PiB3YXNtLl9fd2JpbmRnZW5fZGVzdHJveV9jbG9zdXJlKHN0YXRlLmEsIHN0YXRlLmIpKTtcblxuZnVuY3Rpb24gZGVidWdTdHJpbmcodmFsKSB7XG4gICAgLy8gcHJpbWl0aXZlIHR5cGVzXG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiB2YWw7XG4gICAgaWYgKHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAnYm9vbGVhbicgfHwgdmFsID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuICBgJHt2YWx9YDtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIGBcIiR7dmFsfVwiYDtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT0gJ3N5bWJvbCcpIHtcbiAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSB2YWwuZGVzY3JpcHRpb247XG4gICAgICAgIGlmIChkZXNjcmlwdGlvbiA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1N5bWJvbCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gYFN5bWJvbCgke2Rlc2NyaXB0aW9ufSlgO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IHZhbC5uYW1lO1xuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT0gJ3N0cmluZycgJiYgbmFtZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYEZ1bmN0aW9uKCR7bmFtZX0pYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAnRnVuY3Rpb24nO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIG9iamVjdHNcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgIGNvbnN0IGxlbmd0aCA9IHZhbC5sZW5ndGg7XG4gICAgICAgIGxldCBkZWJ1ZyA9ICdbJztcbiAgICAgICAgaWYgKGxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGRlYnVnICs9IGRlYnVnU3RyaW5nKHZhbFswXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yKGxldCBpID0gMTsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBkZWJ1ZyArPSAnLCAnICsgZGVidWdTdHJpbmcodmFsW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1ZyArPSAnXSc7XG4gICAgICAgIHJldHVybiBkZWJ1ZztcbiAgICB9XG4gICAgLy8gVGVzdCBmb3IgYnVpbHQtaW5cbiAgICBjb25zdCBidWlsdEluTWF0Y2hlcyA9IC9cXFtvYmplY3QgKFteXFxdXSspXFxdLy5leGVjKHRvU3RyaW5nLmNhbGwodmFsKSk7XG4gICAgbGV0IGNsYXNzTmFtZTtcbiAgICBpZiAoYnVpbHRJbk1hdGNoZXMgJiYgYnVpbHRJbk1hdGNoZXMubGVuZ3RoID4gMSkge1xuICAgICAgICBjbGFzc05hbWUgPSBidWlsdEluTWF0Y2hlc1sxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGYWlsZWQgdG8gbWF0Y2ggdGhlIHN0YW5kYXJkICdbb2JqZWN0IENsYXNzTmFtZV0nXG4gICAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKHZhbCk7XG4gICAgfVxuICAgIGlmIChjbGFzc05hbWUgPT0gJ09iamVjdCcpIHtcbiAgICAgICAgLy8gd2UncmUgYSB1c2VyIGRlZmluZWQgY2xhc3Mgb3IgT2JqZWN0XG4gICAgICAgIC8vIEpTT04uc3RyaW5naWZ5IGF2b2lkcyBwcm9ibGVtcyB3aXRoIGN5Y2xlcywgYW5kIGlzIGdlbmVyYWxseSBtdWNoXG4gICAgICAgIC8vIGVhc2llciB0aGFuIGxvb3BpbmcgdGhyb3VnaCBvd25Qcm9wZXJ0aWVzIG9mIGB2YWxgLlxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuICdPYmplY3QoJyArIEpTT04uc3RyaW5naWZ5KHZhbCkgKyAnKSc7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICAgIHJldHVybiAnT2JqZWN0JztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBlcnJvcnNcbiAgICBpZiAodmFsIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGAke3ZhbC5uYW1lfTogJHt2YWwubWVzc2FnZX1cXG4ke3ZhbC5zdGFja31gO1xuICAgIH1cbiAgICAvLyBUT0RPIHdlIGNvdWxkIHRlc3QgZm9yIG1vcmUgdGhpbmdzIGhlcmUsIGxpa2UgYFNldGBzIGFuZCBgTWFwYHMuXG4gICAgcmV0dXJuIGNsYXNzTmFtZTtcbn1cblxuZnVuY3Rpb24gZ2V0QXJyYXlVOEZyb21XYXNtMChwdHIsIGxlbikge1xuICAgIHB0ciA9IHB0ciA+Pj4gMDtcbiAgICByZXR1cm4gZ2V0VWludDhBcnJheU1lbW9yeTAoKS5zdWJhcnJheShwdHIgLyAxLCBwdHIgLyAxICsgbGVuKTtcbn1cblxubGV0IGNhY2hlZERhdGFWaWV3TWVtb3J5MCA9IG51bGw7XG5mdW5jdGlvbiBnZXREYXRhVmlld01lbW9yeTAoKSB7XG4gICAgaWYgKGNhY2hlZERhdGFWaWV3TWVtb3J5MCA9PT0gbnVsbCB8fCBjYWNoZWREYXRhVmlld01lbW9yeTAuYnVmZmVyICE9PSB3YXNtLm1lbW9yeS5idWZmZXIpIHtcbiAgICAgICAgY2FjaGVkRGF0YVZpZXdNZW1vcnkwID0gbmV3IERhdGFWaWV3KHdhc20ubWVtb3J5LmJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiBjYWNoZWREYXRhVmlld01lbW9yeTA7XG59XG5cbmZ1bmN0aW9uIGdldFN0cmluZ0Zyb21XYXNtMChwdHIsIGxlbikge1xuICAgIHJldHVybiBkZWNvZGVUZXh0KHB0ciA+Pj4gMCwgbGVuKTtcbn1cblxubGV0IGNhY2hlZFVpbnQ4QXJyYXlNZW1vcnkwID0gbnVsbDtcbmZ1bmN0aW9uIGdldFVpbnQ4QXJyYXlNZW1vcnkwKCkge1xuICAgIGlmIChjYWNoZWRVaW50OEFycmF5TWVtb3J5MCA9PT0gbnVsbCB8fCBjYWNoZWRVaW50OEFycmF5TWVtb3J5MC5idWZmZXIgIT09IHdhc20ubWVtb3J5LmJ1ZmZlcikge1xuICAgICAgICBjYWNoZWRVaW50OEFycmF5TWVtb3J5MCA9IG5ldyBVaW50OEFycmF5KHdhc20ubWVtb3J5LmJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiBjYWNoZWRVaW50OEFycmF5TWVtb3J5MDtcbn1cblxuZnVuY3Rpb24gaGFuZGxlRXJyb3IoZiwgYXJncykge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBmLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc3QgaWR4ID0gYWRkVG9FeHRlcm5yZWZUYWJsZTAoZSk7XG4gICAgICAgIHdhc20uX193YmluZGdlbl9leG5fc3RvcmUoaWR4KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzTGlrZU5vbmUoeCkge1xuICAgIHJldHVybiB4ID09PSB1bmRlZmluZWQgfHwgeCA9PT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gbWFrZU11dENsb3N1cmUoYXJnMCwgYXJnMSwgZikge1xuICAgIGNvbnN0IHN0YXRlID0geyBhOiBhcmcwLCBiOiBhcmcxLCBjbnQ6IDEgfTtcbiAgICBjb25zdCByZWFsID0gKC4uLmFyZ3MpID0+IHtcblxuICAgICAgICAvLyBGaXJzdCB1cCB3aXRoIGEgY2xvc3VyZSB3ZSBpbmNyZW1lbnQgdGhlIGludGVybmFsIHJlZmVyZW5jZVxuICAgICAgICAvLyBjb3VudC4gVGhpcyBlbnN1cmVzIHRoYXQgdGhlIFJ1c3QgY2xvc3VyZSBlbnZpcm9ubWVudCB3b24ndFxuICAgICAgICAvLyBiZSBkZWFsbG9jYXRlZCB3aGlsZSB3ZSdyZSBpbnZva2luZyBpdC5cbiAgICAgICAgc3RhdGUuY250Kys7XG4gICAgICAgIGNvbnN0IGEgPSBzdGF0ZS5hO1xuICAgICAgICBzdGF0ZS5hID0gMDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBmKGEsIHN0YXRlLmIsIC4uLmFyZ3MpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgc3RhdGUuYSA9IGE7XG4gICAgICAgICAgICByZWFsLl93YmdfY2JfdW5yZWYoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmVhbC5fd2JnX2NiX3VucmVmID0gKCkgPT4ge1xuICAgICAgICBpZiAoLS1zdGF0ZS5jbnQgPT09IDApIHtcbiAgICAgICAgICAgIHdhc20uX193YmluZGdlbl9kZXN0cm95X2Nsb3N1cmUoc3RhdGUuYSwgc3RhdGUuYik7XG4gICAgICAgICAgICBzdGF0ZS5hID0gMDtcbiAgICAgICAgICAgIENMT1NVUkVfRFRPUlMudW5yZWdpc3RlcihzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIENMT1NVUkVfRFRPUlMucmVnaXN0ZXIocmVhbCwgc3RhdGUsIHN0YXRlKTtcbiAgICByZXR1cm4gcmVhbDtcbn1cblxuZnVuY3Rpb24gcGFzc0FycmF5OFRvV2FzbTAoYXJnLCBtYWxsb2MpIHtcbiAgICBjb25zdCBwdHIgPSBtYWxsb2MoYXJnLmxlbmd0aCAqIDEsIDEpID4+PiAwO1xuICAgIGdldFVpbnQ4QXJyYXlNZW1vcnkwKCkuc2V0KGFyZywgcHRyIC8gMSk7XG4gICAgV0FTTV9WRUNUT1JfTEVOID0gYXJnLmxlbmd0aDtcbiAgICByZXR1cm4gcHRyO1xufVxuXG5mdW5jdGlvbiBwYXNzU3RyaW5nVG9XYXNtMChhcmcsIG1hbGxvYywgcmVhbGxvYykge1xuICAgIGlmIChyZWFsbG9jID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3QgYnVmID0gY2FjaGVkVGV4dEVuY29kZXIuZW5jb2RlKGFyZyk7XG4gICAgICAgIGNvbnN0IHB0ciA9IG1hbGxvYyhidWYubGVuZ3RoLCAxKSA+Pj4gMDtcbiAgICAgICAgZ2V0VWludDhBcnJheU1lbW9yeTAoKS5zdWJhcnJheShwdHIsIHB0ciArIGJ1Zi5sZW5ndGgpLnNldChidWYpO1xuICAgICAgICBXQVNNX1ZFQ1RPUl9MRU4gPSBidWYubGVuZ3RoO1xuICAgICAgICByZXR1cm4gcHRyO1xuICAgIH1cblxuICAgIGxldCBsZW4gPSBhcmcubGVuZ3RoO1xuICAgIGxldCBwdHIgPSBtYWxsb2MobGVuLCAxKSA+Pj4gMDtcblxuICAgIGNvbnN0IG1lbSA9IGdldFVpbnQ4QXJyYXlNZW1vcnkwKCk7XG5cbiAgICBsZXQgb2Zmc2V0ID0gMDtcblxuICAgIGZvciAoOyBvZmZzZXQgPCBsZW47IG9mZnNldCsrKSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBhcmcuY2hhckNvZGVBdChvZmZzZXQpO1xuICAgICAgICBpZiAoY29kZSA+IDB4N0YpIGJyZWFrO1xuICAgICAgICBtZW1bcHRyICsgb2Zmc2V0XSA9IGNvZGU7XG4gICAgfVxuICAgIGlmIChvZmZzZXQgIT09IGxlbikge1xuICAgICAgICBpZiAob2Zmc2V0ICE9PSAwKSB7XG4gICAgICAgICAgICBhcmcgPSBhcmcuc2xpY2Uob2Zmc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBwdHIgPSByZWFsbG9jKHB0ciwgbGVuLCBsZW4gPSBvZmZzZXQgKyBhcmcubGVuZ3RoICogMywgMSkgPj4+IDA7XG4gICAgICAgIGNvbnN0IHZpZXcgPSBnZXRVaW50OEFycmF5TWVtb3J5MCgpLnN1YmFycmF5KHB0ciArIG9mZnNldCwgcHRyICsgbGVuKTtcbiAgICAgICAgY29uc3QgcmV0ID0gY2FjaGVkVGV4dEVuY29kZXIuZW5jb2RlSW50byhhcmcsIHZpZXcpO1xuXG4gICAgICAgIG9mZnNldCArPSByZXQud3JpdHRlbjtcbiAgICAgICAgcHRyID0gcmVhbGxvYyhwdHIsIGxlbiwgb2Zmc2V0LCAxKSA+Pj4gMDtcbiAgICB9XG5cbiAgICBXQVNNX1ZFQ1RPUl9MRU4gPSBvZmZzZXQ7XG4gICAgcmV0dXJuIHB0cjtcbn1cblxuZnVuY3Rpb24gdGFrZUZyb21FeHRlcm5yZWZUYWJsZTAoaWR4KSB7XG4gICAgY29uc3QgdmFsdWUgPSB3YXNtLl9fd2JpbmRnZW5fZXh0ZXJucmVmcy5nZXQoaWR4KTtcbiAgICB3YXNtLl9fZXh0ZXJucmVmX3RhYmxlX2RlYWxsb2MoaWR4KTtcbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbmxldCBjYWNoZWRUZXh0RGVjb2RlciA9ICh0eXBlb2YgVGV4dERlY29kZXIgIT09ICd1bmRlZmluZWQnID8gbmV3IFRleHREZWNvZGVyKCd1dGYtOCcsIHsgaWdub3JlQk9NOiB0cnVlLCBmYXRhbDogdHJ1ZSB9KSA6IHVuZGVmaW5lZCk7XG5pZiAoY2FjaGVkVGV4dERlY29kZXIpIGNhY2hlZFRleHREZWNvZGVyLmRlY29kZSgpO1xuXG5jb25zdCBNQVhfU0FGQVJJX0RFQ09ERV9CWVRFUyA9IDIxNDY0MzUwNzI7XG5sZXQgbnVtQnl0ZXNEZWNvZGVkID0gMDtcbmZ1bmN0aW9uIGRlY29kZVRleHQocHRyLCBsZW4pIHtcbiAgICBudW1CeXRlc0RlY29kZWQgKz0gbGVuO1xuICAgIGlmIChudW1CeXRlc0RlY29kZWQgPj0gTUFYX1NBRkFSSV9ERUNPREVfQllURVMpIHtcbiAgICAgICAgY2FjaGVkVGV4dERlY29kZXIgPSBuZXcgVGV4dERlY29kZXIoJ3V0Zi04JywgeyBpZ25vcmVCT006IHRydWUsIGZhdGFsOiB0cnVlIH0pO1xuICAgICAgICBjYWNoZWRUZXh0RGVjb2Rlci5kZWNvZGUoKTtcbiAgICAgICAgbnVtQnl0ZXNEZWNvZGVkID0gbGVuO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGVkVGV4dERlY29kZXIuZGVjb2RlKGdldFVpbnQ4QXJyYXlNZW1vcnkwKCkuc2xpY2UocHRyLCBwdHIgKyBsZW4pKTtcbn1cblxuY29uc3QgY2FjaGVkVGV4dEVuY29kZXIgPSAodHlwZW9mIFRleHRFbmNvZGVyICE9PSAndW5kZWZpbmVkJyA/IG5ldyBUZXh0RW5jb2RlcigpIDogdW5kZWZpbmVkKTtcblxuaWYgKGNhY2hlZFRleHRFbmNvZGVyKSB7XG4gICAgY2FjaGVkVGV4dEVuY29kZXIuZW5jb2RlSW50byA9IGZ1bmN0aW9uIChhcmcsIHZpZXcpIHtcbiAgICAgICAgY29uc3QgYnVmID0gY2FjaGVkVGV4dEVuY29kZXIuZW5jb2RlKGFyZyk7XG4gICAgICAgIHZpZXcuc2V0KGJ1Zik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZWFkOiBhcmcubGVuZ3RoLFxuICAgICAgICAgICAgd3JpdHRlbjogYnVmLmxlbmd0aFxuICAgICAgICB9O1xuICAgIH07XG59XG5cbmxldCBXQVNNX1ZFQ1RPUl9MRU4gPSAwO1xuXG5sZXQgd2FzbU1vZHVsZSwgd2FzbUluc3RhbmNlLCB3YXNtO1xuZnVuY3Rpb24gX193YmdfZmluYWxpemVfaW5pdChpbnN0YW5jZSwgbW9kdWxlLCB0aHJlYWRfc3RhY2tfc2l6ZSkge1xuICAgIHdhc21JbnN0YW5jZSA9IGluc3RhbmNlO1xuICAgIHdhc20gPSBpbnN0YW5jZS5leHBvcnRzO1xuICAgIHdhc21Nb2R1bGUgPSBtb2R1bGU7XG4gICAgY2FjaGVkRGF0YVZpZXdNZW1vcnkwID0gbnVsbDtcbiAgICBjYWNoZWRVaW50OEFycmF5TWVtb3J5MCA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiB0aHJlYWRfc3RhY2tfc2l6ZSAhPT0gJ3VuZGVmaW5lZCcgJiYgKHR5cGVvZiB0aHJlYWRfc3RhY2tfc2l6ZSAhPT0gJ251bWJlcicgfHwgdGhyZWFkX3N0YWNrX3NpemUgPT09IDAgfHwgdGhyZWFkX3N0YWNrX3NpemUgJSA2NTUzNiAhPT0gMCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHN0YWNrIHNpemUnKTtcbiAgICB9XG5cbiAgICB3YXNtLl9fd2JpbmRnZW5fc3RhcnQodGhyZWFkX3N0YWNrX3NpemUpO1xuICAgIHJldHVybiB3YXNtO1xufVxuXG5hc3luYyBmdW5jdGlvbiBfX3diZ19sb2FkKG1vZHVsZSwgaW1wb3J0cykge1xuICAgIGlmICh0eXBlb2YgUmVzcG9uc2UgPT09ICdmdW5jdGlvbicgJiYgbW9kdWxlIGluc3RhbmNlb2YgUmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZVN0cmVhbWluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVTdHJlYW1pbmcobW9kdWxlLCBpbXBvcnRzKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWxpZFJlc3BvbnNlID0gbW9kdWxlLm9rICYmIGV4cGVjdGVkUmVzcG9uc2VUeXBlKG1vZHVsZS50eXBlKTtcblxuICAgICAgICAgICAgICAgIGlmICh2YWxpZFJlc3BvbnNlICYmIG1vZHVsZS5oZWFkZXJzLmdldCgnQ29udGVudC1UeXBlJykgIT09ICdhcHBsaWNhdGlvbi93YXNtJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVTdHJlYW1pbmdgIGZhaWxlZCBiZWNhdXNlIHlvdXIgc2VydmVyIGRvZXMgbm90IHNlcnZlIFdhc20gd2l0aCBgYXBwbGljYXRpb24vd2FzbWAgTUlNRSB0eXBlLiBGYWxsaW5nIGJhY2sgdG8gYFdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlYCB3aGljaCBpcyBzbG93ZXIuIE9yaWdpbmFsIGVycm9yOlxcblwiLCBlKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7IHRocm93IGU7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGJ5dGVzID0gYXdhaXQgbW9kdWxlLmFycmF5QnVmZmVyKCk7XG4gICAgICAgIHJldHVybiBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZShieXRlcywgaW1wb3J0cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBhd2FpdCBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZShtb2R1bGUsIGltcG9ydHMpO1xuXG4gICAgICAgIGlmIChpbnN0YW5jZSBpbnN0YW5jZW9mIFdlYkFzc2VtYmx5Lkluc3RhbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4geyBpbnN0YW5jZSwgbW9kdWxlIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHBlY3RlZFJlc3BvbnNlVHlwZSh0eXBlKSB7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnYmFzaWMnOiBjYXNlICdjb3JzJzogY2FzZSAnZGVmYXVsdCc6IHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGluaXRTeW5jKG1vZHVsZSwgbWVtb3J5KSB7XG4gICAgaWYgKHdhc20gIT09IHVuZGVmaW5lZCkgcmV0dXJuIHdhc207XG5cbiAgICBsZXQgdGhyZWFkX3N0YWNrX3NpemVcbiAgICBpZiAobW9kdWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZihtb2R1bGUpID09PSBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgICAgICAgICAoe21vZHVsZSwgbWVtb3J5LCB0aHJlYWRfc3RhY2tfc2l6ZX0gPSBtb2R1bGUpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ3VzaW5nIGRlcHJlY2F0ZWQgcGFyYW1ldGVycyBmb3IgYGluaXRTeW5jKClgOyBwYXNzIGEgc2luZ2xlIG9iamVjdCBpbnN0ZWFkJylcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydHMgPSBfX3diZ19nZXRfaW1wb3J0cyhtZW1vcnkpO1xuICAgIGlmICghKG1vZHVsZSBpbnN0YW5jZW9mIFdlYkFzc2VtYmx5Lk1vZHVsZSkpIHtcbiAgICAgICAgbW9kdWxlID0gbmV3IFdlYkFzc2VtYmx5Lk1vZHVsZShtb2R1bGUpO1xuICAgIH1cbiAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyBXZWJBc3NlbWJseS5JbnN0YW5jZShtb2R1bGUsIGltcG9ydHMpO1xuICAgIHJldHVybiBfX3diZ19maW5hbGl6ZV9pbml0KGluc3RhbmNlLCBtb2R1bGUsIHRocmVhZF9zdGFja19zaXplKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX193YmdfaW5pdChtb2R1bGVfb3JfcGF0aCwgbWVtb3J5KSB7XG4gICAgaWYgKHdhc20gIT09IHVuZGVmaW5lZCkgcmV0dXJuIHdhc207XG5cbiAgICBsZXQgdGhyZWFkX3N0YWNrX3NpemVcbiAgICBpZiAobW9kdWxlX29yX3BhdGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKG1vZHVsZV9vcl9wYXRoKSA9PT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgICAgICAgICAgKHttb2R1bGVfb3JfcGF0aCwgbWVtb3J5LCB0aHJlYWRfc3RhY2tfc2l6ZX0gPSBtb2R1bGVfb3JfcGF0aClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybigndXNpbmcgZGVwcmVjYXRlZCBwYXJhbWV0ZXJzIGZvciB0aGUgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb247IHBhc3MgYSBzaW5nbGUgb2JqZWN0IGluc3RlYWQnKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1vZHVsZV9vcl9wYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbW9kdWxlX29yX3BhdGggPSBuZXcgVVJMKCd0bHNuX3dhc21fYmcud2FzbScsIGltcG9ydC5tZXRhLnVybCk7XG4gICAgfVxuICAgIGNvbnN0IGltcG9ydHMgPSBfX3diZ19nZXRfaW1wb3J0cyhtZW1vcnkpO1xuXG4gICAgaWYgKHR5cGVvZiBtb2R1bGVfb3JfcGF0aCA9PT0gJ3N0cmluZycgfHwgKHR5cGVvZiBSZXF1ZXN0ID09PSAnZnVuY3Rpb24nICYmIG1vZHVsZV9vcl9wYXRoIGluc3RhbmNlb2YgUmVxdWVzdCkgfHwgKHR5cGVvZiBVUkwgPT09ICdmdW5jdGlvbicgJiYgbW9kdWxlX29yX3BhdGggaW5zdGFuY2VvZiBVUkwpKSB7XG4gICAgICAgIG1vZHVsZV9vcl9wYXRoID0gZmV0Y2gobW9kdWxlX29yX3BhdGgpO1xuICAgIH1cblxuICAgIGNvbnN0IHsgaW5zdGFuY2UsIG1vZHVsZSB9ID0gYXdhaXQgX193YmdfbG9hZChhd2FpdCBtb2R1bGVfb3JfcGF0aCwgaW1wb3J0cyk7XG5cbiAgICByZXR1cm4gX193YmdfZmluYWxpemVfaW5pdChpbnN0YW5jZSwgbW9kdWxlLCB0aHJlYWRfc3RhY2tfc2l6ZSk7XG59XG5cbmV4cG9ydCB7IGluaXRTeW5jLCBfX3diZ19pbml0IGFzIGRlZmF1bHQgfTtcbiIsImZ1bmN0aW9uIHJlZ2lzdGVyTWVzc2FnZUxpc3RlbmVyKHRhcmdldCwgdHlwZSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCBsaXN0ZW5lciA9IGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gZXZlbnQuZGF0YTtcbiAgICAgICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50eXBlID09PSB0eXBlKSB7XG4gICAgICAgICAgICBhd2FpdCBjYWxsYmFjayhtZXNzYWdlLmRhdGEpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgbGlzdGVuZXIpO1xufVxuXG4vLyBSZWdpc3RlciBsaXN0ZW5lciBmb3IgdGhlIHN0YXJ0IHNwYXduZXIgbWVzc2FnZS5cbnJlZ2lzdGVyTWVzc2FnZUxpc3RlbmVyKHNlbGYsICd3ZWJfc3Bhd25fc3RhcnRfc3Bhd25lcicsIGFzeW5jIChkYXRhKSA9PiB7XG4gICAgY29uc3Qgd29ya2VyVXJsID0gbmV3IFVSTChcbiAgICAgICAgJy4vc3Bhd24uanMnLFxuICAgICAgICBpbXBvcnQubWV0YS51cmxcbiAgICApO1xuICAgIGNvbnN0IFttb2R1bGUsIG1lbW9yeSwgc3Bhd25lclB0cl0gPSBkYXRhO1xuICAgIGNvbnN0IHBrZyA9IGF3YWl0IGltcG9ydCgnLi4vLi4vLi4vdGxzbl93YXNtLmpzJyk7XG4gICAgY29uc3QgZXhwb3J0cyA9IGF3YWl0IHBrZy5kZWZhdWx0KHsgbW9kdWxlLCBtZW1vcnkgfSk7XG5cbiAgICBjb25zdCBzcGF3bmVyID0gcGtnLndlYl9zcGF3bl9yZWNvdmVyX3NwYXduZXIoc3Bhd25lclB0cik7XG4gICAgcG9zdE1lc3NhZ2UoJ3dlYl9zcGF3bl9zcGF3bmVyX3JlYWR5Jyk7XG4gICAgYXdhaXQgc3Bhd25lci5ydW4od29ya2VyVXJsLnRvU3RyaW5nKCkpO1xuXG4gICAgZXhwb3J0cy5fX3diaW5kZ2VuX3RocmVhZF9kZXN0cm95KCk7XG5cbiAgICBjbG9zZSgpO1xufSk7XG5cbi8vIFJlZ2lzdGVyIGxpc3RlbmVyIGZvciB0aGUgc3RhcnQgd29ya2VyIG1lc3NhZ2UuXG5yZWdpc3Rlck1lc3NhZ2VMaXN0ZW5lcihzZWxmLCAnd2ViX3NwYXduX3N0YXJ0X3dvcmtlcicsIGFzeW5jIChkYXRhKSA9PiB7XG4gICAgY29uc3QgW21vZHVsZSwgbWVtb3J5LCB3b3JrZXJQdHJdID0gZGF0YTtcblxuICAgIGNvbnN0IHBrZyA9IGF3YWl0IGltcG9ydCgnLi4vLi4vLi4vdGxzbl93YXNtLmpzJyk7XG4gICAgY29uc3QgZXhwb3J0cyA9IGF3YWl0IHBrZy5kZWZhdWx0KHsgbW9kdWxlLCBtZW1vcnkgfSk7XG5cbiAgICBwa2cud2ViX3NwYXduX3N0YXJ0X3dvcmtlcih3b3JrZXJQdHIpO1xuXG4gICAgZXhwb3J0cy5fX3diaW5kZ2VuX3RocmVhZF9kZXN0cm95KCk7XG5cbiAgICBjbG9zZSgpO1xufSk7XG5cbi8vLyBTdGFydHMgdGhlIHNwYXduZXIgaW4gYSBuZXcgd29ya2VyLlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0U3Bhd25lcldvcmtlcihtb2R1bGUsIG1lbW9yeSwgc3Bhd25lcikge1xuICAgIGNvbnN0IHdvcmtlclVybCA9IG5ldyBVUkwoXG4gICAgICAgICcuL3NwYXduLmpzJyxcbiAgICAgICAgaW1wb3J0Lm1ldGEudXJsXG4gICAgKTtcbiAgICBjb25zdCB3b3JrZXIgPSBuZXcgV29ya2VyKFxuICAgICAgICB3b3JrZXJVcmwsXG4gICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICd3ZWItc3Bhd24tc3Bhd25lcicsXG4gICAgICAgICAgICB0eXBlOiAnbW9kdWxlJ1xuICAgICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IGRhdGEgPSBbbW9kdWxlLCBtZW1vcnksIHNwYXduZXIuaW50b1JhdygpXTtcbiAgICB3b3JrZXIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiAnd2ViX3NwYXduX3N0YXJ0X3NwYXduZXInLFxuICAgICAgICBkYXRhOiBkYXRhXG4gICAgfSlcblxuICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICB3b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5kYXRhID09PSAnd2ViX3NwYXduX3NwYXduZXJfcmVhZHknKSB7XG4gICAgICAgICAgICAgICAgd29ya2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSlcbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==