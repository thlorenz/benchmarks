const assert = require('assert')
import fs from 'fs'
import wordListPath from 'word-list'
import { logger } from '../utils/logger'
import { ProducerData } from './types'
const { parentPort, workerData } = require('worker_threads')

const words = fs.readFileSync(wordListPath, 'utf8').split('\n')
const nwords = words.length

assert(parentPort != null, 'worker needs the parent port')

const { id, interval, ITER }: ProducerData = workerData
const log = logger(`producer.${id}`)
let count = 0

function produceWord() {
  const idx = Math.floor(Math.random() * nwords)
  return Buffer.from(words[idx], 'utf8')
}

function getArrayBuffer(buf: Buffer) {
  // TODO: make this an ArrayBuffer
  // https://nodejs.org/api/buffer.html#buffer_buf_buffer
  // https://nodejs.org/api/buffer.html#buffer_buf_byteoffset
  return new Int8Array(buf.buffer, buf.byteOffset, buf.length)
}

function postWord() {
  const word = produceWord()
  log.debug('sending %s', word.toString())
  const arrayBuffer = getArrayBuffer(word)

  parentPort.postMessage(arrayBuffer, [])
}

function tick() {
  postWord()
  if (++count >= ITER) process.exit(0)
  setTimeout(tick, interval)
}

setTimeout(tick, interval)
