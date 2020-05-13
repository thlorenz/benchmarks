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

function produceWord() {
  const idx = Math.floor(Math.random() * nwords)
  return stringToArrayBuffer(words[idx], (size) => new ArrayBuffer(size))
}

function postWord() {
  const word = produceWord()
  log.debug('sending %s', word.toString())
  parentPort.postMessage(word, [word])
}

function tick() {
  postWord()
  if (++count >= ITER) process.exit(0)
  setTimeout(tick, interval)
}

setTimeout(tick, interval)
