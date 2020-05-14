"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const word_list_1 = tslib_1.__importDefault(require("word-list"));
const buffer_util_1 = require("./buffer-util");
const words = fs_1.default.readFileSync(word_list_1.default, 'utf8').split('\n');
function concatMultiWords(nwords, n = 1e2) {
    const ws = [];
    const idx = Math.floor(Math.random() * nwords);
    for (let i = 0; i < n; i++) {
        ws.push(words[idx]);
    }
    return { idx, ws: ws.join(', ') };
}
function getWordId(nwords) {
    const idx = Math.floor(Math.random() * nwords);
    return idx.toString();
}
exports.getWordId = getWordId;
function produceWords(shareBuffer, nwords, n) {
    const createBuffer = (size) => shareBuffer ? new SharedArrayBuffer(size) : new ArrayBuffer(size);
    const { idx, ws } = concatMultiWords(nwords, n);
    const key = buffer_util_1.stringToArrayBuffer(idx.toString(), createBuffer);
    const value = buffer_util_1.stringToArrayBuffer(ws, createBuffer);
    return {
        key,
        value,
    };
}
exports.produceWords = produceWords;
//# sourceMappingURL=word-factory.js.map