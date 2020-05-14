"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const worker_threads_1 = require("worker_threads");
const logger_1 = require("../utils/logger");
const buffer_util_1 = require("./buffer-util");
const word_factory_1 = require("./word-factory");
const { id, interval, shareBuffer, nwords, nconcats } = worker_threads_1.workerData;
const log = logger_1.logger(`consumer.${id}`);
const _cache = new Map();
//
// Consumers need to resolve items from the cache synchronously.
// Therefore the cache thread keeps updating them with items in the
// cache so they can get to it without having to post a message first.
//
// If an item is not found in the cache, the consumers will produce it
// and then update the cache, essentially taking on the task of the
// producer.
//
function resolveWord() {
    assert_1.strict(worker_threads_1.parentPort != null, 'worker needs the parent port');
    const key = word_factory_1.getWordId(nwords);
    const cached = _cache.get(key);
    if (cached != null) {
        log.debug('cache hit');
        return cached;
    }
    log.debug('cache miss');
    const payload = word_factory_1.produceWords(shareBuffer, nwords, nconcats);
    const tk = log.debugTime();
    worker_threads_1.parentPort.postMessage(payload);
    log.debugTimeEnd(tk, 'sent word of byteLen: %d', payload.value.byteLength);
    return payload.value;
}
function onCacheUpdate(cache) {
    const tk = log.debugTime();
    _cache.clear();
    for (const [k, v] of cache) {
        const key = buffer_util_1.arrayBufferToString(k);
        _cache.set(key, v);
    }
    log.debugTimeEnd(tk, 'stored cache update');
}
function tick() {
    resolveWord();
    setTimeout(tick, interval);
}
;
(function init() {
    setTimeout(tick, interval);
    assert_1.strict(worker_threads_1.parentPort != null, 'worker needs the parent port');
    worker_threads_1.parentPort.on('message', onCacheUpdate).on('error', log.error);
})();
//# sourceMappingURL=consumer.js.map