"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const logger_1 = require("../utils/logger");
const log = logger_1.logger('main');
function transpileJS(file, opts) {
    return new Promise((resolve, reject) => {
        let msgCount = 0;
        function onWorkerMessage() {
            log.trace('worker message');
            if (++msgCount === opts.ITER) {
                log.debugTimeEnd(tk, 'worker completed');
                resolve();
            }
        }
        log.debug('creating worker');
        const worker = new worker_threads_1.Worker(require.resolve('./worker.js'), {
            workerData: { file, opts },
            stdout: false,
            stderr: false,
        });
        const tk = log.debugTime();
        worker.on('message', onWorkerMessage);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        });
        log.debug('created worker');
        log.debugTimeEnd;
    });
}
exports.transpileJS = transpileJS;
//# sourceMappingURL=work.js.map