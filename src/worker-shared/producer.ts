const assert = require('assert')
import fs from 'fs'
import wordListPath from 'word-list'
import { logger } from '../utils/logger'
import { stringToArrayBuffer } from './buffer-util'
import { ProducerData } from './types'
const { parentPort, workerData } = require('worker_threads')

const words = fs.readFileSync(wordListPath, 'utf8').split('\n')
const nwords = words.length

assert(parentPort != null, 'worker needs the parent port')

const { id, interval, ITER }: ProducerData = workerData
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

function produceWord() {
  const idx = Math.floor(Math.random() * nwords)
  return stringToArrayBuffer(words[idx], (size) => new SharedArrayBuffer(size))
}

function produceWords(n?: number) {
  const ws = concatMultiWords(n)
  return stringToArrayBuffer(ws, (size) => new SharedArrayBuffer(size))
}

function postWord() {
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
