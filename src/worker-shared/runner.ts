import { Worker, WorkerOptions } from 'worker_threads'
import { logger } from '../utils/logger'
import { Cache } from './cache'
import { ConsumerData, ConsumerInfo, ProducerData, ProducerInfo } from './types'

const log = logger('runner')

class Runner {
  private readonly _spawnedProducers: Map<number, ProducerInfo> = new Map()
  private readonly _spawnedConsumers: Map<number, ConsumerInfo> = new Map()

  constructor(
    private readonly _nproducers: number,
    private readonly _nconsumers: number,
    private readonly _producerITER: number,
    private readonly _shareBuffer: boolean,
    private readonly _cacheUpdateDelta: number,
    private readonly _nwords: number,
    private readonly _nconcats: number
  ) {}

  start(producerInterval: number, consumerInterval: number) {
    for (let i = 0; i < this._nproducers; i++) {
      this._spawnProducer(producerInterval, i + 1)
    }
    for (let i = 0; i < this._nconsumers; i++) {
      this._spawnConsumer(consumerInterval, i + 1)
    }

    new Cache(
      this._spawnedProducers,
      this._spawnedConsumers,
      this._cacheUpdateDelta
    )
  }

  private _spawnConsumer(interval: number, id: number) {
    const workerData: ConsumerData = {
      interval,
      id,
      shareBuffer: this._shareBuffer,
      nwords: this._nwords,
      nconcats: this._nconcats,
    }
    const workerOptions: WorkerOptions = { workerData }
    const consumer = new Worker(require.resolve('./consumer'), workerOptions)
    consumer.unref()

    const tk = log.debugTime()
    this._spawnedConsumers.set(id, { id, started: tk, worker: consumer })

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
      nconcats: this._nconcats,
    }
    const workerOptions: WorkerOptions = { workerData }

    log.debug('spawning producer %d', id)
    const producer = new Worker(require.resolve('./producer'), workerOptions)
    producer.unref()

    const tk = log.debugTime()
    this._spawnedProducers.set(id, {
      id,
      started: tk,
      ITER: this._producerITER,
      worker: producer,
    })

    producer.on('error', log.error).on('exit', (code: number) => {
      if (code !== 0)
        log.error(new Error(`Worker stopped with exit code ${code}`))
    })
  }
}

const shareBuffer = parseInt(process.env.SHARE_BUFFER || '') === 1
const consumers = parseInt(process.env.CONSUMERS || '') || 1
const producers = parseInt(process.env.PRODUCERS || '') || 1
const nwords = parseInt(process.env.WORDS || '') || 40
const nconcats = parseInt(process.env.CONCATS || '') || 1e2

const CACHE_UPDATE_DELTA = parseInt(process.env.CACHE_UPDATE_DELTA || '') || 1e3

log.info({ shareBuffer, consumers, producers, nwords, CACHE_UPDATE_DELTA })

const runner = new Runner(
  producers,
  consumers,
  10,
  shareBuffer,
  CACHE_UPDATE_DELTA,
  nwords,
  nconcats
)
runner.start(30, 20)
