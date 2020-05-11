import { Worker } from 'worker_threads'
import { logger } from '../utils/logger'

const log = logger('main')

export function transpileJS(file: string, transfer: boolean) {
  return new Promise((resolve, reject) => {
    log.debug('creating worker')
    const worker = new Worker(require.resolve('./worker.js'), {
      workerData: { file, transfer },
      stdout: false,
      stderr: false,
    })

    worker.on('message', resolve)
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`))
    })
    log.debug('created worker')
  })
}
