import { strict as assert } from 'assert'
import { Worker, WorkerOptions } from 'worker_threads'
import { logger } from '../utils/logger'
import { TimerKey } from '../utils/time-stamper'
import { arrayBufferToString } from './buffer-util'
import { ProducerData } from './types'

const log = logger('cache')

type ProducerInfo = { started: TimerKey }

class Cache {
  private readonly _spawnedProducers: Map<number, ProducerInfo> = new Map()
  constructor(
    private readonly _nproducers: number,
    private readonly _producerITER: number,
    private readonly _producerShareBuffer: boolean,
    private readonly _cache: SharedArrayBuffer[] = []
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
      .on('message', (msg: SharedArrayBuffer) =>
        this.onProducerMessage(msg, id, ++msgCount)
      )
      .on('error', log.error)
      .on('exit', (code: number) => {
        if (code !== 0)
          log.error(new Error(`Worker stopped with exit code ${code}`))
      })
  }

  onProducerMessage(msg: SharedArrayBuffer, id: number, msgCount: number) {
    log.trace('message from producer %d -  %d %s "%s"', id, msg.byteLength, msg)
    this._cache.push(msg)
    if (msgCount === this._producerITER) {
      const producerInfo = this._spawnedProducers.get(id)
      assert(producerInfo != null, `unknown producer ${id}`)
      log.debugTimeEnd(producerInfo.started, 'producer completed')
      this._spawnedProducers.delete(id)
      if (this._spawnedProducers.size === 0) this.dumpCache()
    }
  }
  dumpCache(lenOnly = true) {
    const msgStrings = this._cache.map(arrayBufferToString)
    log.debug(msgStrings.length)
  }
}

const shareBuffer = parseInt(process.env.SHARE_BUFFER || '') === 1
log.info({ shareBuffer })
const cache = new Cache(4, 10, shareBuffer)
cache.init(100)
