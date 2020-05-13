import fs from 'fs'
import { v4 as uuid } from 'uuid'
import wordListPath from 'word-list'
import { stringToArrayBuffer } from './buffer-util'
import { AnyArrayBuffer, ProducerPayload } from './types'

const words = fs.readFileSync(wordListPath, 'utf8').split('\n')
const nwords = words.length

function concatMultiWords(n: number = 1e2) {
  const ws = []
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * nwords)
    ws.push(words[idx])
  }
  return ws.join(', ')
}

export function produceWord(
  shareBuffer: boolean
): SharedArrayBuffer | ArrayBuffer {
  const idx = Math.floor(Math.random() * nwords)
  return stringToArrayBuffer(words[idx], (size) =>
    shareBuffer ? new SharedArrayBuffer(size) : new ArrayBuffer(size)
  )
}

export function produceWords(
  shareBuffer: boolean,
  n?: number
): ProducerPayload<AnyArrayBuffer> {
  const createBuffer = (size: number) =>
    shareBuffer ? new SharedArrayBuffer(size) : new ArrayBuffer(size)
  const ws = concatMultiWords(n)

  const key = stringToArrayBuffer(uuid(), createBuffer)
  const value = stringToArrayBuffer(ws, createBuffer)
  return {
    key,
    value,
  }
}
