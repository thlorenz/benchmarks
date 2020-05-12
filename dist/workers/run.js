"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../utils/logger");
const work_1 = require("./work");
const file = require.resolve('../../fixtures/jquery.js');
const log = logger_1.logger('main');
const transfer = parseInt(process.env.TRANSFER || '') === 1;
const wrapInObject = parseInt(process.env.WRAP || '') === 1;
const ITER = parseInt(process.env.ITER || '') || 1e3;
log.info('running with options: %o', { transfer, wrapInObject });
(async () => {
    try {
        await work_1.transpileJS(file, { transfer, wrapInObject, ITER });
    }
    catch (err) {
        console.error(err);
    }
})();
//# sourceMappingURL=run.js.map