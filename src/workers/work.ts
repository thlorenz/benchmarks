import { Worker } from 'worker_threads'
import { logger } from '../utils/logger'

const log = logger('main')

type Opts = { transfer: boolean; wrapInObject: boolean }

export function transpileJS(file: string, opts: Opts) {
  return new Promise((resolve, reject) => {
    log.debug('creating worker')
    const worker = new Worker(require.resolve('./worker.js'), {
      workerData: { file, opts },
      stdout: false,
      stderr: false,
    })

    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`))
    })
    log.debug('created worker')
    log.debugTimeEnd
  })
}
