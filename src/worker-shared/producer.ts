import { strict as assert } from 'assert'
import { parentPort, workerData } from 'worker_threads'
import { logger } from '../utils/logger'
import { ProducerData } from './types'
import { produceWords } from './word-factory'

const {
  id,
  interval,
  ITER,
  shareBuffer,
  nwords,
  nconcats,
}: ProducerData = workerData
const log = logger(`producer.${id}`)
let count = 0

function postWord() {
  assert(parentPort != null, 'worker needs the parent port')

  const payload = produceWords(shareBuffer, nwords, nconcats)
  const tk = log.debugTime()
  parentPort.postMessage(payload)
  log.debugTimeEnd(tk, 'sending word of byteLen: %d', payload.value.byteLength)
}
function tick() {
  postWord()
  if (++count >= ITER) process.exit(0)
  setTimeout(tick, interval)
}

setTimeout(tick, interval)
