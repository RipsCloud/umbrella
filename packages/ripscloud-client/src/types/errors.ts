export class FevRipsError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, opts: { status: number; body?: unknown; cause?: unknown }) {
    super(message);
    this.name = "FevRipsError";
    this.status = opts.status;
    this.body = opts.body;
    if (opts.cause !== undefined) (this as { cause?: unknown }).cause = opts.cause;
  }
}

export class FevRipsAuthError extends FevRipsError {
  constructor(message: string, opts: { status: number; body?: unknown }) {
    super(message, opts);
    this.name = "FevRipsAuthError";
  }
}

export class FevRipsValidationError extends FevRipsError {
  constructor(message: string, opts: { body?: unknown }) {
    super(message, { status: 400, ...opts });
    this.name = "FevRipsValidationError";
  }
}

export class FevRipsUpstreamError extends FevRipsError {
  constructor(message: string, opts: { status: number; body?: unknown }) {
    super(message, opts);
    this.name = "FevRipsUpstreamError";
  }
}

export class FevRipsNetworkError extends FevRipsError {
  constructor(message: string, opts: { cause?: unknown }) {
    super(message, { status: 0, ...opts });
    this.name = "FevRipsNetworkError";
  }
}
