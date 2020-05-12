import { Worker, WorkerOptions } from 'worker_threads'
import { logger } from '../utils/logger'
import { ProducerData } from './types'

const log = logger('cache')

const BUFFER_SIZE = 1024

class Cache {
  constructor(private readonly _cache = new SharedArrayBuffer(BUFFER_SIZE)) {}

  init(producerInterval: number, producerITER: number, nproducers: number) {
    for (let i = 0; i < nproducers; i++) {
      this._spawnProducer(producerInterval, producerITER, i + 1)
    }
  }

  private _spawnProducer(interval: number, ITER: number, id: number) {
    const workerData: ProducerData = { interval, ITER, id }
    const workerOptions: WorkerOptions = { workerData }

    let msgCount = 0
    const tk = log.debugTime()

    function onProducerMessage(msg: ArrayBuffer) {
      log.debug('message from producer %d %s', msg.byteLength, msg)
      if (++msgCount === ITER) {
        log.debugTimeEnd(tk, 'producer completed')
      }
    }

    log.debug('spawning producer')
    const producer = new Worker(require.resolve('./producer'), workerOptions)

    producer.on('message', onProducerMessage)
    producer.on('error', log.error)
    producer.on('exit', (code: number) => {
      if (code !== 0)
        log.error(new Error(`Worker stopped with exit code ${code}`))
    })
  }
}

const cache = new Cache()
cache.init(100, 10, 2)
