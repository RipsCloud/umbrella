const LEVELS = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 } as const;

export type LogLevel = keyof typeof LEVELS;

export type Logger = {
  trace: (message: string, data?: Record<string, unknown>) => void;
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
};

export function createLogger(opts: {
  level: LogLevel;
  context?: Record<string, unknown>;
}): Logger {
  const threshold = LEVELS[opts.level];
  const ctx = opts.context ?? {};

  function emit(level: LogLevel, message: string, data?: Record<string, unknown>) {
    if (LEVELS[level] < threshold) return;

    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...ctx,
      ...data,
    };

    switch (level) {
      case "error":
        console.error(JSON.stringify(entry));
        break;
      case "warn":
        console.warn(JSON.stringify(entry));
        break;
      default:
        console.log(JSON.stringify(entry));
        break;
    }
  }

  return {
    trace: (msg, data) => emit("trace", msg, data),
    debug: (msg, data) => emit("debug", msg, data),
    info: (msg, data) => emit("info", msg, data),
    warn: (msg, data) => emit("warn", msg, data),
    error: (msg, data) => emit("error", msg, data),
  };
}
