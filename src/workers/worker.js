const ITER = 1e5

const assert = require('assert')
const fs = require('fs')

const { parentPort, workerData } = require('worker_threads')
const { logger } = require('../../dist/utils/logger')

const log = logger('worker')

assert(parentPort != null, 'worker needs the parent port')
const { file, opts } = workerData
const { transfer, wrapInObject } = opts

log.info('spawned worker %o', { file, transfer, wrapInObject })

const all = log.debugTime()
for (let i = 0; i < ITER; i++) {
  let tk = log.traceTime()
  const script = fs.readFileSync(file)
  log.traceTimeEnd(tk, 'read file')

  const res = wrapInObject ? { script: script.buffer } : script.buffer

  const transferList = transfer ? [res] : []

  tk = log.traceTime()
  parentPort.postMessage(res, transferList)
  log.traceTimeEnd(tk, 'posted message')
}

log.debugTimeEnd(all, 'read and sent file %d times', ITER)
