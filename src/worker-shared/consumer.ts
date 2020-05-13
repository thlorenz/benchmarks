import { strict as assert } from 'assert'
import { parentPort, workerData } from 'worker_threads'
import { ConsumerData } from './types'

const { id, interval, ITER }: ConsumerData = workerData
// const log = logger(`consumer.${id}`)
let count = 0

function requestWords() {
  assert(parentPort != null, 'worker needs the parent port')
}

//
// Consumers need to resolve items from the cache synchronously.
// Therefore the cache thread keeps updating them with items in the
// cache so they can get to it without having to post a message first.
//
// If an item is not found in the cache, the consumers will produce it
// and then update the cache, essentially taking on the task of the
// producer.
//

function tick() {
  requestWords()
  if (++count >= ITER) process.exit(0)
  setTimeout(tick, interval)
}

setTimeout(tick, interval)
