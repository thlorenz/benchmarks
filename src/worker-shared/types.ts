export type ProducerData = {
  id: number
  interval: number
  ITER: number
  shareBuffer: boolean
  nwords: number
}
export type ConsumerData = {
  id: number
  interval: number
  shareBuffer: boolean
  nwords: number
}

export type AnyArrayBuffer = ArrayBuffer | SharedArrayBuffer
export type ProducerPayload<T extends AnyArrayBuffer = SharedArrayBuffer> = {
  key: T
  value: T
}
