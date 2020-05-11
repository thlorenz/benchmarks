const assert = require('assert')
const fs = require('fs')

const { parentPort, workerData } = require('worker_threads')
const { logger } = require('../../dist/utils/logger')

const log = logger('worker')

assert(parentPort != null, 'worker needs the parent port')
const { file, transfer } = workerData
log.info('spawned worker %o', { file, transfer })

let tk = log.debugTime()
const script = fs.readFileSync(file)
log.debugTimeEnd(tk, 'read file')

const transferList = transfer ? [script.buffer] : []

tk = log.debugTime()
parentPort.postMessage(script.buffer, transferList)
log.debugTimeEnd(tk, 'posted message')
