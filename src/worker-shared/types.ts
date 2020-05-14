import { Worker } from 'worker_threads'
import { TimerKey } from '../utils/time-stamper'

export type ProducerData = {
  id: number
  interval: number
  ITER: number
  shareBuffer: boolean
  nwords: number
  nconcats: number
}
export type ConsumerData = {
  id: number
  interval: number
  shareBuffer: boolean
  nwords: number
  nconcats: number
}

export type ProducerInfo = {
  id: number
  started: TimerKey
  ITER: number
  worker: Worker
}
export type ConsumerInfo = { id: number; started: TimerKey; worker: Worker }

export type AnyArrayBuffer = ArrayBuffer | SharedArrayBuffer
export type ProducerPayload<T extends AnyArrayBuffer = SharedArrayBuffer> = {
  key: string
  value: T
}
