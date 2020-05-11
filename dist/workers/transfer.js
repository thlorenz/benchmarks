"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const work_1 = require("./work");
const file = require.resolve('../../fixtures/jquery.js');
(async () => {
    try {
        await work_1.transpileJS(file, true);
    }
    catch (err) {
        console.error(err);
    }
})();
//# sourceMappingURL=transfer.js.map