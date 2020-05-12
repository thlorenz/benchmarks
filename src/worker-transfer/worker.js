const assert = require('assert')
const fs = require('fs')

const { parentPort, workerData } = require('worker_threads')
const { logger } = require('../../dist/utils/logger')

const log = logger('worker')

assert(parentPort != null, 'worker needs the parent port')
const { file, opts } = workerData
const { transfer, wrapInObject, ITER } = opts

log.info('spawned worker %o', { file, transfer, wrapInObject, ITER })

let tk = log.traceTime()
const script = fs.readFileSync(file)
log.traceTimeEnd(tk, 'read file')

function cloneBuffer(buf) {
  return Buffer.from(buf)
}

const all = log.debugTime()
for (let i = 0; i < ITER; i++) {
  try {
    // cloning the buffer is only needed when we transfer it, however in order to get
    // comparable bench results we consistently do so in all cases, otherwise
    // transfer would get worse results due to the memcpy happening during the clone which
    // it normally avoids
    const buf = cloneBuffer(script)
    const res = wrapInObject ? { script: buf.buffer } : buf.buffer

    const transferList = transfer ? [res] : []

    tk = log.traceTime()
    parentPort.postMessage(res, transferList)
    log.traceTimeEnd(tk, 'posted message')
  } catch (err) {
    log.error(err)
    process.exit(1)
  }
}

log.debugTimeEnd(all, 'sent file %d times', ITER)

process.on('uncaughtException', (err, origin) => {
  log.error('uncaught exception %s', err)
  log.error(origin)
  process.exit(1)
})
