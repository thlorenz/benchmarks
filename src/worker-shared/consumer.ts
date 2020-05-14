import { strict as assert } from 'assert'
import { parentPort, workerData } from 'worker_threads'
import { logger } from '../utils/logger'
import { AnyArrayBuffer, ConsumerData } from './types'
import { getWordId, produceWords } from './word-factory'

const { id, interval, shareBuffer, nwords, nconcats }: ConsumerData = workerData
const log = logger(`consumer.${id}`)

const _cache: Map<string, AnyArrayBuffer> = new Map()

//
// Consumers need to resolve items from the cache synchronously.
// Therefore the cache thread keeps updating them with items in the
// cache so they can get to it without having to post a message first.
//
// If an item is not found in the cache, the consumers will produce it
// and then update the cache, essentially taking on the task of the
// producer.
//

function resolveWord() {
  assert(parentPort != null, 'worker needs the parent port')
  const key = getWordId(nwords)
  const cached = _cache.get(key)
  if (cached != null) {
    log.debug('cache hit')
    return cached
  }

  log.debug('cache miss')
  const payload = produceWords(shareBuffer, nwords, nconcats)
  const tk = log.debugTime()
  parentPort.postMessage(payload)
  log.debugTimeEnd(tk, 'sent word of byteLen: %d', payload.value.byteLength)

  return payload.value
}

function onCacheUpdate(cache: Map<string, AnyArrayBuffer>) {
  const tk = log.debugTime()
  _cache.clear()
  for (const [key, v] of cache) {
    _cache.set(key, v)
  }
  log.debugTimeEnd(tk, 'stored cache update')
}

function tick() {
  resolveWord()
  setTimeout(tick, interval)
}

;(function init() {
  setTimeout(tick, interval)
  assert(parentPort != null, 'worker needs the parent port')
  parentPort.on('message', onCacheUpdate).on('error', log.error)
})()
