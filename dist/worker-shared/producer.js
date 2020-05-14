"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const worker_threads_1 = require("worker_threads");
const logger_1 = require("../utils/logger");
const word_factory_1 = require("./word-factory");
const { id, interval, ITER, shareBuffer, nwords, nconcats, } = worker_threads_1.workerData;
const log = logger_1.logger(`producer.${id}`);
let count = 0;
function postWord() {
    assert_1.strict(worker_threads_1.parentPort != null, 'worker needs the parent port');
    const payload = word_factory_1.produceWords(shareBuffer, nwords, nconcats);
    const tk = log.debugTime();
    worker_threads_1.parentPort.postMessage(payload);
    log.debugTimeEnd(tk, 'sending word of byteLen: %d', payload.value.byteLength);
}
function tick() {
    postWord();
    if (++count >= ITER)
        process.exit(0);
    setTimeout(tick, interval);
}
setTimeout(tick, interval);
//# sourceMappingURL=producer.js.map