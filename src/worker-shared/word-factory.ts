import fs from 'fs'
import wordListPath from 'word-list'
import { stringToArrayBuffer } from './buffer-util'
import { AnyArrayBuffer, ProducerPayload } from './types'

const words = fs.readFileSync(wordListPath, 'utf8').split('\n')

function concatMultiWords(nwords: number, n: number = 1e2) {
  const ws = []
  const idx = Math.floor(Math.random() * nwords)
  for (let i = 0; i < n; i++) {
    ws.push(words[idx])
  }
  return { idx, ws: ws.join(', ') }
}

export function getWordId(nwords: number) {
  const idx = Math.floor(Math.random() * nwords)
  return idx.toString()
}

export function produceWords(
  shareBuffer: boolean,
  nwords: number,
  n?: number
): ProducerPayload<AnyArrayBuffer> {
  const createBuffer = (size: number) =>
    shareBuffer ? new SharedArrayBuffer(size) : new ArrayBuffer(size)
  const { idx, ws } = concatMultiWords(nwords, n)

  const key = stringToArrayBuffer(idx.toString(), createBuffer)
  const value = stringToArrayBuffer(ws, createBuffer)
  return {
    key,
    value,
  }
}
