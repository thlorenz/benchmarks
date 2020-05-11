import { strict as assert } from 'assert'
import { v4 as uuid } from 'uuid'

export type TimeStamp = [number, number]

export function timeStamp(start?: TimeStamp): TimeStamp {
  return process.hrtime(start)
}

export function compareTimeStamps(a: TimeStamp, b: TimeStamp): number {
  const [aS, aNs] = a
  const [bS, bNs] = b
  return aS < bS ? -1 : bS < aS ? 1 : aNs < bNs ? -1 : aNs > bNs ? 1 : 0
}

/**
 * Difference of two timestamps in milliseconds
 * @param start
 * @param end
 */
export function diffMs(start: TimeStamp, end: TimeStamp): number {
  const startNS = start[0] * 1e9 + start[1]
  const endNS = end[0] * 1e9 + end[1]
  return (endNS - startNS) / 1e6
}

export type TimerKey = string & { kind: 'timer-key' }

export class TimeStamper {
  private readonly _timerMap: Map<string, TimeStamp> = new Map()

  time(key?: TimerKey): TimerKey {
    if (key == null) key = uuid() as TimerKey
    assert(!this._timerMap.has(key), 'cannot set timer that has not ended yet')
    this._timerMap.set(key, timeStamp())
    return key
  }

  timeEnd(key: string): number {
    assert(this._timerMap.has(key), `timer ${key} was never started`)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ms = diffMs(this._timerMap.get(key)!, timeStamp())
    this._timerMap.delete(key)
    return ms
  }
}
