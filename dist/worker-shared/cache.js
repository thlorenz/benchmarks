"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const logger_1 = require("../utils/logger");
const buffer_util_1 = require("./buffer-util");
const log = logger_1.logger('cache');
class Cache {
    constructor(_producers = new Map(), _consumers = new Map(), _cacheUpdateDelta, _cache = new Map()) {
        this._producers = _producers;
        this._consumers = _consumers;
        this._cacheUpdateDelta = _cacheUpdateDelta;
        this._cache = _cache;
        this._lastCacheUpdate = Date.now();
        for (const producer of this._producers.values()) {
            this._hookupProducer(producer);
        }
        for (const consumer of this._consumers.values()) {
            this._hookupConsumer(consumer);
        }
    }
    _hookupProducer(producer) {
        let msgCount = 0;
        producer.worker.on('message', (payload) => this.onProducerMessage(payload, producer.id, false, ++msgCount));
    }
    _hookupConsumer(consumer) {
        consumer.worker.on('message', (payload) => this.onProducerMessage(payload, consumer.id, true, 0));
    }
    onProducerMessage({ key, value }, id, isConsumer, msgCount) {
        this._cache.set(key, value);
        this._syncCacheToConsumers();
        if (isConsumer)
            return;
        const producerInfo = this._producers.get(id);
        assert_1.strict(producerInfo != null, `WTF happend to producer ${id}?!?`);
        log.trace('message from producer %d (%d/%d)- %s: %d %s "%s"', id, msgCount, producerInfo.ITER, key, value.byteLength, value);
        if (msgCount >= producerInfo.ITER) {
            log.debugTimeEnd(producerInfo.started, 'producer completed');
            this._producers.delete(id);
            if (this._producers.size === 0) {
                this.dumpCache();
                process.exit(0);
            }
        }
    }
    _syncCacheToConsumers() {
        const now = Date.now();
        if (now - this._lastCacheUpdate < this._cacheUpdateDelta)
            return;
        const tk = log.debugTime();
        for (const { worker } of this._consumers.values()) {
            worker.postMessage(this._cache);
        }
        log.debugTimeEnd(tk, 'synced cache (%d items) with consumers', this._cache.size);
        this._lastCacheUpdate = now;
    }
    dumpCache(lenOnly = true) {
        const msgStrings = Array.from(this._cache.values()).map(buffer_util_1.arrayBufferToString);
        let bytes = 0;
        for (const s of msgStrings)
            bytes += Buffer.byteLength(s);
        log.debug('Producers sent %d messages total of %d bytes. ', msgStrings.length, bytes);
    }
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map