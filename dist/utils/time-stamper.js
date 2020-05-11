"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = require("assert");
const uuid_1 = require("uuid");
function timeStamp(start) {
    return process.hrtime(start);
}
exports.timeStamp = timeStamp;
function compareTimeStamps(a, b) {
    const [aS, aNs] = a;
    const [bS, bNs] = b;
    return aS < bS ? -1 : bS < aS ? 1 : aNs < bNs ? -1 : aNs > bNs ? 1 : 0;
}
exports.compareTimeStamps = compareTimeStamps;
/**
 * Difference of two timestamps in milliseconds
 * @param start
 * @param end
 */
function diffMs(start, end) {
    const startNS = start[0] * 1e9 + start[1];
    const endNS = end[0] * 1e9 + end[1];
    return (endNS - startNS) / 1e6;
}
exports.diffMs = diffMs;
class TimeStamper {
    constructor() {
        this._timerMap = new Map();
    }
    time(key) {
        if (key == null)
            key = uuid_1.v4();
        assert_1.strict(!this._timerMap.has(key), 'cannot set timer that has not ended yet');
        this._timerMap.set(key, timeStamp());
        return key;
    }
    timeEnd(key) {
        assert_1.strict(this._timerMap.has(key), `timer ${key} was never started`);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const ms = diffMs(this._timerMap.get(key), timeStamp());
        this._timerMap.delete(key);
        return ms;
    }
}
exports.TimeStamper = TimeStamper;
//# sourceMappingURL=time-stamper.js.map