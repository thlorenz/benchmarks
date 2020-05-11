import debug, { Debugger } from 'debug'
import { createWriteStream, WriteStream } from 'fs'
import { format } from 'util'
import { TimerKey, TimeStamper } from './time-stamper'

export type Logger = {
  error: Debugger
  info: Debugger
  debug: Debugger
  trace: Debugger
  traceTime: () => TimerKey
  traceTimeEnd: (key: TimerKey, msg: string, ...args: any[]) => void
}

class TimeStampLogger {
  private readonly _timeStamper: TimeStamper = new TimeStamper()
  constructor(
    private readonly _logger: Debugger,
    private readonly _minDurationMs = 0
  ) {}

  time = (): TimerKey => {
    if (!this._logger.enabled) return TimeStampLogger.EMPTY_TIME_STAMP
    return this._timeStamper.time()
  }

  timeEnd = (key: string, msg: string, ...args: any[]) => {
    if (!this._logger.enabled || key === TimeStampLogger.EMPTY_TIME_STAMP) {
      return
    }
    const diff = this._timeStamper.timeEnd(key)
    if (this._minDurationMs > diff) return
    this._logger(`${msg}, took ${diff.toFixed(2)}ms`, ...args)
  }

  static EMPTY_TIME_STAMP: TimerKey = '<EMPTY TIME STAMP>' as TimerKey
}

class DefaultLogger implements Logger {
  public readonly error = debug(`bench:${this.category}:error`)
  public readonly info = debug(`bench:${this.category}:info`)
  public readonly debug = debug(`bench:${this.category}:debug`)
  public readonly trace = debug(`bench:${this.category}:trace`)

  private readonly _traceTimeLogger: TimeStampLogger
  private readonly _debugTimeLogger: TimeStampLogger

  public readonly traceTime: Logger['traceTime']
  public readonly traceTimeEnd: Logger['traceTimeEnd']
  public readonly debugTime: Logger['traceTime']
  public readonly debugTimeEnd: Logger['traceTimeEnd']

  constructor(public readonly category: string) {
    this._traceTimeLogger = new TimeStampLogger(this.trace)
    this._debugTimeLogger = new TimeStampLogger(this.debug)

    this.traceTime = this._traceTimeLogger.time
    this.traceTimeEnd = this._traceTimeLogger.timeEnd
    this.debugTime = this._debugTimeLogger.time
    this.debugTimeEnd = this._debugTimeLogger.timeEnd
  }

  static _instance?: DefaultLogger
}

class FileLogger {
  private _logStream?: WriteStream

  constructor(private readonly _filename: string) {}

  public readonly error = (category: string) => {
    const logger = debug(`bench:${category}:error`)
    logger.log = this._log
    return logger
  }
  public readonly info = (category: string) => {
    const logger = debug(`bench:${category}:info`)
    logger.log = this._log
    return logger
  }
  public readonly debug = (category: string) => {
    const logger = debug(`bench:${category}:debug`)
    logger.log = this._log
    return logger
  }
  public readonly trace = (category: string) => {
    const logger = debug(`bench:${category}:trace`)
    logger.log = this._log
    return logger
  }

  get _lazilyCreatedStream(): WriteStream {
    if (this._logStream == null) {
      this._logStream = createWriteStream(this._filename)
    }
    return this._logStream
  }

  _log = (fmt: any, ...args: any) => {
    return this._lazilyCreatedStream.write(`${format(fmt, ...args)}\n`)
  }

  static _instances: Map<string, FileLogger> = new Map()
}

class CategorizedFileLogger implements Logger {
  private readonly _traceTimeLogger: TimeStampLogger
  private readonly _debugTimeLogger: TimeStampLogger

  public readonly error: Debugger
  public readonly info: Debugger
  public readonly debug: Debugger
  public readonly trace: Debugger
  public readonly traceTime: Logger['traceTime']
  public readonly traceTimeEnd: Logger['traceTimeEnd']
  public readonly debugTime: Logger['traceTime']
  public readonly debugTimeEnd: Logger['traceTimeEnd']

  constructor(
    private readonly _fileLogger: FileLogger,
    public readonly category: string
  ) {
    this.error = this._fileLogger.error(this.category)
    this.info = this._fileLogger.info(this.category)
    this.debug = this._fileLogger.debug(this.category)
    this.trace = this._fileLogger.trace(this.category)

    this._traceTimeLogger = new TimeStampLogger(this.trace)
    this._debugTimeLogger = new TimeStampLogger(this.debug)

    this.traceTime = this._traceTimeLogger.time
    this.traceTimeEnd = this._traceTimeLogger.timeEnd
    this.debugTime = this._debugTimeLogger.time
    this.debugTimeEnd = this._debugTimeLogger.timeEnd
  }
}

export const disable = () => debug.disable()
export const enable = (namespaces: string) => debug.enable(namespaces)
export const enabled = (namespaces: string) => debug.enabled(namespaces)

/**
 * Console Logger which logs to stderr
 */
export const consoleLogger = (category: any) => {
  if (DefaultLogger._instance == null) {
    DefaultLogger._instance = new DefaultLogger(category)
  }
  return DefaultLogger._instance
}

/**
 * File Logger which logs either to the provided file, process.env.LOG_FILE or /tmp/cypress.log
 * @param category: logger category, i.e. 'http', 'test run'
 * @param filename: full path of the file to log to
 */
export const fileLogger = (
  category: string,
  filename?: string
): CategorizedFileLogger => {
  const file = filename || process.env.LOG_FILE || '/tmp/cypress.log'
  if (!FileLogger._instances.has(file)) {
    FileLogger._instances.set(file, new FileLogger(file))
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const fileLogger = FileLogger._instances.get(file)!
  return new CategorizedFileLogger(fileLogger, category)
}

/**
 * Looks for a LOG_FILE env var and creates a file logger for it.
 * If that env var is not set it returns a console logger instead.
 * @param category: logger category, i.e. 'http', 'test run'
 */
export const logger = (category: string) =>
  process.env.LOG_FILE == null
    ? consoleLogger(category)
    : fileLogger(category, process.env.LOG_FILE)
