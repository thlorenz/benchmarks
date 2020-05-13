import { strict as assert } from 'assert'
import { Worker, WorkerOptions } from 'worker_threads'
import { logger } from '../utils/logger'
import { TimerKey } from '../utils/time-stamper'
import { arrayBufferToString } from './buffer-util'
import { AnyArrayBuffer, ProducerData, ProducerPayload } from './types'

const log = logger('cache')

type ProducerInfo = { started: TimerKey }

class Cache {
  private readonly _spawnedProducers: Map<number, ProducerInfo> = new Map()
  constructor(
    private readonly _nproducers: number,
    private readonly _producerITER: number,
    private readonly _producerShareBuffer: boolean,
    private readonly _cache: Map<AnyArrayBuffer, AnyArrayBuffer> = new Map()
  ) {}

  init(producerInterval: number) {
    for (let i = 0; i < this._nproducers; i++) {
      this._spawnProducer(producerInterval, i + 1)
    }
  }

  private _spawnProducer(interval: number, id: number) {
    const workerData: ProducerData = {
      interval,
      ITER: this._producerITER,
      id,
      shareBuffer: this._producerShareBuffer,
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
    if (msgCount === this._producerITER) {
      const producerInfo = this._spawnedProducers.get(id)
      assert(producerInfo != null, `unknown producer ${id}`)
      log.debugTimeEnd(producerInfo.started, 'producer completed')
      this._spawnedProducers.delete(id)
      if (this._spawnedProducers.size === 0) this.dumpCache()
    }
  }
  dumpCache(lenOnly = true) {
    const msgStrings = Array.from(this._cache.values()).map(arrayBufferToString)
    let bytes = 0
    for (const s of msgStrings) bytes += Buffer.byteLength(s)

    log.debug('Sent %d messages total of %d bytes. ', msgStrings.length, bytes)
  }
}

const shareBuffer = parseInt(process.env.SHARE_BUFFER || '') === 1
log.info({ shareBuffer })
const cache = new Cache(4, 10, shareBuffer)
cache.init(100)
