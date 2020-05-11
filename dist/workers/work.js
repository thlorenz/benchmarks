"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const logger_1 = require("../utils/logger");
const log = logger_1.logger('main');
function transpileJS(file, transfer) {
    return new Promise((resolve, reject) => {
        log.debug('creating worker');
        const worker = new worker_threads_1.Worker(require.resolve('./worker.js'), {
            workerData: { file, transfer },
            stdout: false,
            stderr: false,
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker stopped with exit code ${code}`));
        });
        log.debug('created worker');
    });
}
exports.transpileJS = transpileJS;
//# sourceMappingURL=work.js.map