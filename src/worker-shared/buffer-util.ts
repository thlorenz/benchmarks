export function stringToArrayBuffer<T extends ArrayBuffer | SharedArrayBuffer>(
  s: string,
  createBuffer: (size: number) => T
): T {
  // TODO: string length is fine here?
  // https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
  // Getting byteLength is cheap as it does not generate a buffer, i.e. perform any copying
  // Instead it iterates over the chars to obtain byte length
  // http://github.com/nodejs/node/blob/master/src/node_buffer.cc#L718
  // https://source.chromium.org/chromium/chromium/src/+/master:v8/src/api/api.cc;l=5144
  // const byteLen = Buffer.byteLength(s, 'utf8')

  const len = s.length
  const buffer: ArrayBuffer | SharedArrayBuffer = createBuffer(len * 2)
  const view = new Uint16Array(buffer)
  for (let i = 0; i < len; i++) {
    view[i] = s.charCodeAt(i)
  }
  return view.buffer as T
}

export function arrayBufferToString(buffer: ArrayBuffer | SharedArrayBuffer) {
  return String.fromCharCode.apply(
    null,
    (new Uint16Array(buffer) as unknown) as number[]
  )
}
