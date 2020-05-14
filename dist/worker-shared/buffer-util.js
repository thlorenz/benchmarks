"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function stringToArrayBuffer(s, createBuffer) {
    // TODO: string length is fine here?
    // https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
    // Getting byteLength is cheap as it does not generate a buffer, i.e. perform any copying
    // Instead it iterates over the chars to obtain byte length
    // http://github.com/nodejs/node/blob/master/src/node_buffer.cc#L718
    // https://source.chromium.org/chromium/chromium/src/+/master:v8/src/api/api.cc;l=5144
    // const byteLen = Buffer.byteLength(s, 'utf8')
    const len = s.length;
    const buffer = createBuffer(len * Uint16Array.BYTES_PER_ELEMENT);
    const view = new Uint16Array(buffer);
    for (let i = 0; i < len; i++) {
        view[i] = s.charCodeAt(i);
    }
    return view.buffer;
}
exports.stringToArrayBuffer = stringToArrayBuffer;
function arrayBufferToString(buffer) {
    const view = new Uint16Array(buffer);
    const buf = Buffer.from(view);
    return buf.toString('utf8');
}
exports.arrayBufferToString = arrayBufferToString;
//# sourceMappingURL=buffer-util.js.map