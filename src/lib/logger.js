const LEVEL = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });

function serializeError(error) {
  if (!(error instanceof Error)) return error;
  return {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack,
  };
}

export class Logger {
  constructor(level = 'info', bindings = {}) {
    this.threshold = LEVEL[level] ?? LEVEL.info;
    this.bindings = bindings;
  }

  child(bindings) {
    return new Logger(
      Object.entries(LEVEL).find(([, value]) => value === this.threshold)?.[0] ?? 'info',
      { ...this.bindings, ...bindings },
    );
  }

  debug(message, data) { this.#write('debug', message, data); }
  info(message, data) { this.#write('info', message, data); }
  warn(message, data) { this.#write('warn', message, data); }
  error(message, data) { this.#write('error', message, data); }

  #write(level, message, data) {
    if (LEVEL[level] < this.threshold) return;
    const record = {
      time: new Date().toISOString(),
      level,
      message,
      ...this.bindings,
    };
    if (data !== undefined) {
      record.data = data instanceof Error ? serializeError(data) : data;
    }
    const line = JSON.stringify(record, (_key, value) => value instanceof Error ? serializeError(value) : value);
    const output = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    output(line);
  }
}
