import { strict as assert } from 'assert'
import { logger } from '../utils/logger'
import { arrayBufferToString } from './buffer-util'
import { AnyArrayBuffer, ConsumerInfo, ProducerInfo, ProducerPayload } from './types'

const log = logger('cache')

export class Cache {
  private _lastCacheUpdate: number
  constructor(
    private readonly _producers: Map<number, ProducerInfo> = new Map(),
    private readonly _consumers: Map<number, ConsumerInfo> = new Map(),
    private readonly _cacheUpdateDelta: number,
    private readonly _cache: Map<string, AnyArrayBuffer> = new Map()
  ) {
    this._lastCacheUpdate = Date.now()

    for (const producer of this._producers.values()) {
      this._hookupProducer(producer)
    }
    for (const consumer of this._consumers.values()) {
      this._hookupConsumer(consumer)
    }
  }

  private _hookupProducer(producer: ProducerInfo) {
    let msgCount = 0
    producer.worker.on('message', (payload: ProducerPayload) =>
      this.onProducerMessage(payload, producer.id, false, ++msgCount)
    )
  }

  private _hookupConsumer(consumer: ConsumerInfo) {
    consumer.worker.on('message', (payload: ProducerPayload) =>
      this.onProducerMessage(payload, consumer.id, true, 0)
    )
  }

  onProducerMessage(
    { key, value }: ProducerPayload,
    id: number,
    isConsumer: boolean,
    msgCount: number
  ) {
    this._cache.set(key, value)
    this._syncCacheToConsumers()
    if (isConsumer) return

    const producerInfo = this._producers.get(id)
    assert(producerInfo != null, `WTF happend to producer ${id}?!?`)
    log.trace(
      'message from producer %d (%d/%d)- %s: %d %s "%s"',
      id,
      msgCount,
      producerInfo.ITER,
      key,
      value.byteLength,
      value
    )
    if (msgCount >= producerInfo.ITER) {
      log.debugTimeEnd(producerInfo.started, 'producer completed')
      this._producers.delete(id)
      if (this._producers.size === 0) {
        this.dumpCache()
        process.exit(0)
      }
    }
  }

  _syncCacheToConsumers() {
    const now = Date.now()
    if (now - this._lastCacheUpdate < this._cacheUpdateDelta) return
    const tk = log.debugTime()
    for (const { worker } of this._consumers.values()) {
      worker.postMessage(this._cache)
    }
    log.debugTimeEnd(
      tk,
      'synced cache (%d items) with consumers',
      this._cache.size
    )
    this._lastCacheUpdate = now
  }

  dumpCache(lenOnly = true) {
    const msgStrings = Array.from(this._cache.values()).map(arrayBufferToString)
    let bytes = 0
    for (const s of msgStrings) bytes += Buffer.byteLength(s)

    log.debug(
      'Producers sent %d messages total of %d bytes. ',
      msgStrings.length,
      bytes
    )
  }
}
