import { logger } from '../utils/logger'
import { transpileJS } from './work'
const file: string = require.resolve('../../fixtures/jquery.js')

const log = logger('main')

const transfer = parseInt(process.env.TRANSFER || '') === 1
const wrapInObject = parseInt(process.env.WRAP || '') === 1
const ITER = parseInt(process.env.ITER || '') || 1e3

log.info('running with options: %o', { transfer, wrapInObject })
;(async () => {
  try {
    await transpileJS(file, { transfer, wrapInObject, ITER })
  } catch (err) {
    console.error(err)
  }
})()
