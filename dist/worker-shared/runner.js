"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const logger_1 = require("../utils/logger");
const cache_1 = require("./cache");
const log = logger_1.logger('runner');
class Runner {
    constructor(_nproducers, _nconsumers, _producerITER, _shareBuffer, _cacheUpdateDelta, _nwords, _nconcats) {
        this._nproducers = _nproducers;
        this._nconsumers = _nconsumers;
        this._producerITER = _producerITER;
        this._shareBuffer = _shareBuffer;
        this._cacheUpdateDelta = _cacheUpdateDelta;
        this._nwords = _nwords;
        this._nconcats = _nconcats;
        this._spawnedProducers = new Map();
        this._spawnedConsumers = new Map();
    }
    start(producerInterval, consumerInterval) {
        for (let i = 0; i < this._nproducers; i++) {
            this._spawnProducer(producerInterval, i + 1);
        }
        for (let i = 0; i < this._nconsumers; i++) {
            this._spawnConsumer(consumerInterval, i + 1);
        }
        new cache_1.Cache(this._spawnedProducers, this._spawnedConsumers, this._cacheUpdateDelta);
    }
    _spawnConsumer(interval, id) {
        const workerData = {
            interval,
            id,
            shareBuffer: this._shareBuffer,
            nwords: this._nwords,
            nconcats: this._nconcats,
        };
        const workerOptions = { workerData };
        const consumer = new worker_threads_1.Worker(require.resolve('./consumer'), workerOptions);
        consumer.unref();
        const tk = log.debugTime();
        this._spawnedConsumers.set(id, { id, started: tk, worker: consumer });
        consumer.on('error', log.error).on('exit', (code) => {
            if (code !== 0)
                log.error(new Error(`Worker stopped with exit code ${code}`));
        });
    }
    _spawnProducer(interval, id) {
        const workerData = {
            interval,
            ITER: this._producerITER,
            id,
            shareBuffer: this._shareBuffer,
            nwords: this._nwords,
            nconcats: this._nconcats,
        };
        const workerOptions = { workerData };
        log.debug('spawning producer %d', id);
        const producer = new worker_threads_1.Worker(require.resolve('./producer'), workerOptions);
        producer.unref();
        const tk = log.debugTime();
        this._spawnedProducers.set(id, {
            id,
            started: tk,
            ITER: this._producerITER,
            worker: producer,
        });
        producer.on('error', log.error).on('exit', (code) => {
            if (code !== 0)
                log.error(new Error(`Worker stopped with exit code ${code}`));
        });
    }
}
const shareBuffer = parseInt(process.env.SHARE_BUFFER || '') === 1;
const consumers = parseInt(process.env.CONSUMERS || '') || 1;
const producers = parseInt(process.env.PRODUCERS || '') || 1;
const nwords = parseInt(process.env.WORDS || '') || 40;
const nconcats = parseInt(process.env.CONCATS || '') || 1e2;
const CACHE_UPDATE_DELTA = parseInt(process.env.CACHE_UPDATE_DELTA || '') || 1e3;
log.info({ shareBuffer, consumers, producers, nwords, CACHE_UPDATE_DELTA });
const runner = new Runner(producers, consumers, 10, shareBuffer, CACHE_UPDATE_DELTA, nwords, nconcats);
runner.start(30, 20);
//# sourceMappingURL=runner.js.map