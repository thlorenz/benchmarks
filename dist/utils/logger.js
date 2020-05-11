"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const fs_1 = require("fs");
const util_1 = require("util");
const time_stamper_1 = require("./time-stamper");
class TimeStampLogger {
    constructor(_logger, _minDurationMs = 0) {
        this._logger = _logger;
        this._minDurationMs = _minDurationMs;
        this._timeStamper = new time_stamper_1.TimeStamper();
        this.time = () => {
            if (!this._logger.enabled)
                return TimeStampLogger.EMPTY_TIME_STAMP;
            return this._timeStamper.time();
        };
        this.timeEnd = (key, msg, ...args) => {
            if (!this._logger.enabled || key === TimeStampLogger.EMPTY_TIME_STAMP) {
                return;
            }
            const diff = this._timeStamper.timeEnd(key);
            if (this._minDurationMs > diff)
                return;
            this._logger(`${msg}, took ${diff.toFixed(2)}ms`, ...args);
        };
    }
}
TimeStampLogger.EMPTY_TIME_STAMP = '<EMPTY TIME STAMP>';
class DefaultLogger {
    constructor(category) {
        this.category = category;
        this.error = debug_1.default(`bench:${this.category}:error`);
        this.info = debug_1.default(`bench:${this.category}:info`);
        this.debug = debug_1.default(`bench:${this.category}:debug`);
        this.trace = debug_1.default(`bench:${this.category}:trace`);
        this._traceTimeLogger = new TimeStampLogger(this.trace);
        this._debugTimeLogger = new TimeStampLogger(this.debug);
        this.traceTime = this._traceTimeLogger.time;
        this.traceTimeEnd = this._traceTimeLogger.timeEnd;
        this.debugTime = this._debugTimeLogger.time;
        this.debugTimeEnd = this._debugTimeLogger.timeEnd;
    }
}
class FileLogger {
    constructor(_filename) {
        this._filename = _filename;
        this.error = (category) => {
            const logger = debug_1.default(`bench:${category}:error`);
            logger.log = this._log;
            return logger;
        };
        this.info = (category) => {
            const logger = debug_1.default(`bench:${category}:info`);
            logger.log = this._log;
            return logger;
        };
        this.debug = (category) => {
            const logger = debug_1.default(`bench:${category}:debug`);
            logger.log = this._log;
            return logger;
        };
        this.trace = (category) => {
            const logger = debug_1.default(`bench:${category}:trace`);
            logger.log = this._log;
            return logger;
        };
        this._log = (fmt, ...args) => {
            return this._lazilyCreatedStream.write(`${util_1.format(fmt, ...args)}\n`);
        };
    }
    get _lazilyCreatedStream() {
        if (this._logStream == null) {
            this._logStream = fs_1.createWriteStream(this._filename);
        }
        return this._logStream;
    }
}
FileLogger._instances = new Map();
class CategorizedFileLogger {
    constructor(_fileLogger, category) {
        this._fileLogger = _fileLogger;
        this.category = category;
        this.error = this._fileLogger.error(this.category);
        this.info = this._fileLogger.info(this.category);
        this.debug = this._fileLogger.debug(this.category);
        this.trace = this._fileLogger.trace(this.category);
        this._traceTimeLogger = new TimeStampLogger(this.trace);
        this._debugTimeLogger = new TimeStampLogger(this.debug);
        this.traceTime = this._traceTimeLogger.time;
        this.traceTimeEnd = this._traceTimeLogger.timeEnd;
        this.debugTime = this._debugTimeLogger.time;
        this.debugTimeEnd = this._debugTimeLogger.timeEnd;
    }
}
exports.disable = () => debug_1.default.disable();
exports.enable = (namespaces) => debug_1.default.enable(namespaces);
exports.enabled = (namespaces) => debug_1.default.enabled(namespaces);
/**
 * Console Logger which logs to stderr
 */
exports.consoleLogger = (category) => {
    if (DefaultLogger._instance == null) {
        DefaultLogger._instance = new DefaultLogger(category);
    }
    return DefaultLogger._instance;
};
/**
 * File Logger which logs either to the provided file, process.env.LOG_FILE or /tmp/cypress.log
 * @param category: logger category, i.e. 'http', 'test run'
 * @param filename: full path of the file to log to
 */
exports.fileLogger = (category, filename) => {
    const file = filename || process.env.LOG_FILE || '/tmp/cypress.log';
    if (!FileLogger._instances.has(file)) {
        FileLogger._instances.set(file, new FileLogger(file));
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const fileLogger = FileLogger._instances.get(file);
    return new CategorizedFileLogger(fileLogger, category);
};
/**
 * Looks for a LOG_FILE env var and creates a file logger for it.
 * If that env var is not set it returns a console logger instead.
 * @param category: logger category, i.e. 'http', 'test run'
 */
exports.logger = (category) => process.env.LOG_FILE == null
    ? exports.consoleLogger(category)
    : exports.fileLogger(category, process.env.LOG_FILE);
//# sourceMappingURL=logger.js.map