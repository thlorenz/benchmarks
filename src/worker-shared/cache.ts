import { strict as assert } from 'assert'
import { Worker, WorkerOptions } from 'worker_threads'
import { logger } from '../utils/logger'
import { TimerKey } from '../utils/time-stamper'
import { arrayBufferToString } from './buffer-util'
import { AnyArrayBuffer, ConsumerData, ProducerData, ProducerPayload } from './types'

const log = logger('cache')

type ProducerInfo = { started: TimerKey }
type ConsumerInfo = { started: TimerKey; worker: Worker }

class Cache {
  private readonly _spawnedProducers: Map<number, ProducerInfo> = new Map()
  private readonly _spawnedConsumers: Map<number, ConsumerInfo> = new Map()
  private _lastCacheUpdate: number
  constructor(
    private readonly _nproducers: number,
    private readonly _nconsumers: number,
    private readonly _producerITER: number,
    private readonly _shareBuffer: boolean,
    private readonly _nwords: number,
    private readonly _cache: Map<AnyArrayBuffer, AnyArrayBuffer> = new Map()
  ) {
    this._lastCacheUpdate = Date.now()
  }

  init(producerInterval: number, consumerInterval: number) {
    for (let i = 0; i < this._nproducers; i++) {
      this._spawnProducer(producerInterval, i + 1)
    }
    for (let i = 0; i < this._nconsumers; i++) {
      this._spawnConsumer(consumerInterval, i + 1)
    }
  }

  private _spawnConsumer(interval: number, id: number) {
    const workerData: ConsumerData = {
      interval,
      id,
      shareBuffer: this._shareBuffer,
      nwords: this._nwords,
    }
    const workerOptions: WorkerOptions = { workerData }
    const consumer = new Worker(require.resolve('./consumer'), workerOptions)
    consumer.unref()

    const tk = log.debugTime()
    this._spawnedConsumers.set(id, { started: tk, worker: consumer })

    consumer.on('error', log.error).on('exit', (code: number) => {
      if (code !== 0)
        log.error(new Error(`Worker stopped with exit code ${code}`))
    })
  }

  private _spawnProducer(interval: number, id: number) {
    const workerData: ProducerData = {
      interval,
      ITER: this._producerITER,
      id,
      shareBuffer: this._shareBuffer,
      nwords: this._nwords,
    }
    const workerOptions: WorkerOptions = { workerData }

    let msgCount = 0
    const tk = log.debugTime()
    this._spawnedProducers.set(id, { started: tk })

    log.debug('spawning producer %d', id)
    const producer = new Worker(require.resolve('./producer'), workerOptions)

    producer
      .on('message', (payload: ProducerPayload) =>
        this.onProducerMessage(payload, id, ++msgCount)
      )
      .on('error', log.error)
      .on('exit', (code: number) => {
        if (code !== 0)
          log.error(new Error(`Worker stopped with exit code ${code}`))
      })
  }

  onProducerMessage(
    { key, value }: ProducerPayload,
    id: number,
    msgCount: number
  ) {
    log.trace(
      'message from producer %d - %s: %d %s "%s"',
      id,
      key,
      value.byteLength,
      value
    )
    this._cache.set(key, value)
    this._syncCacheToConsumers()

    if (msgCount === this._producerITER) {
      const producerInfo = this._spawnedProducers.get(id)
      assert(producerInfo != null, `unknown producer ${id}`)
      log.debugTimeEnd(producerInfo.started, 'producer completed')
      this._spawnedProducers.delete(id)
      if (this._spawnedProducers.size === 0) {
        this.dumpCache()
      }
    }
  }

  _syncCacheToConsumers() {
    const now = Date.now()
    if (now - this._lastCacheUpdate < CACHE_UPDATE_DELTA) return
    const tk = log.debugTime()
    for (const { worker } of this._spawnedConsumers.values()) {
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

    log.debug('Sent %d messages total of %d bytes. ', msgStrings.length, bytes)
  }
}

const shareBuffer = parseInt(process.env.SHARE_BUFFER || '') === 1
const consumers = parseInt(process.env.CONSUMERS || '') || 1
const producers = parseInt(process.env.PRODUCERS || '') || 1
const nwords = parseInt(process.env.WORDS || '') || 1e2

const CACHE_UPDATE_DELTA = parseInt(process.env.CACHE_UPDATE_DELTA || '') || 1e3

log.info({ shareBuffer, consumers, producers, nwords, CACHE_UPDATE_DELTA })

const cache = new Cache(producers, consumers, 10, shareBuffer, nwords)
cache.init(300, 200)
