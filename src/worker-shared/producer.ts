import { strict as assert } from 'assert'
import fs from 'fs'
import wordListPath from 'word-list'
import { parentPort, workerData } from 'worker_threads'
import { logger } from '../utils/logger'
import { stringToArrayBuffer } from './buffer-util'
import { ProducerData } from './types'

const words = fs.readFileSync(wordListPath, 'utf8').split('\n')
const nwords = words.length

const { id, interval, ITER, shareBuffer }: ProducerData = workerData
const log = logger(`producer.${id}`)
let count = 0

function concatMultiWords(n: number = 1e5) {
  const ws = []
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * nwords)
    ws.push(words[idx])
  }
  return ws.join(', ')
}

function produceWord(): SharedArrayBuffer | ArrayBuffer {
  const idx = Math.floor(Math.random() * nwords)
  return stringToArrayBuffer(words[idx], (size) =>
    shareBuffer ? new SharedArrayBuffer(size) : new ArrayBuffer(size)
  )
}

function produceWords(n?: number): SharedArrayBuffer | ArrayBuffer {
  const ws = concatMultiWords(n)
  return stringToArrayBuffer(ws, (size) =>
    shareBuffer ? new SharedArrayBuffer(size) : new ArrayBuffer(size)
  )
}

function postWord() {
  assert(parentPort != null, 'worker needs the parent port')

  const word = produceWords()
  const tk = log.debugTime()
  parentPort.postMessage(word)
  log.debugTimeEnd(tk, 'sending word of byteLen: %d', word.byteLength)
}

function tick() {
  postWord()
  if (++count >= ITER) process.exit(0)
  setTimeout(tick, interval)
}

setTimeout(tick, interval)
