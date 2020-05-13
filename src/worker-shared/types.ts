export type ProducerData = {
  id: number
  interval: number
  ITER: number
  shareBuffer: boolean
}
export type ConsumerData = {
  id: number
  interval: number
  ITER: number
}

export type AnyArrayBuffer = ArrayBuffer | SharedArrayBuffer
export type ProducerPayload<T extends AnyArrayBuffer = SharedArrayBuffer> = {
  key: T
  value: T
}
