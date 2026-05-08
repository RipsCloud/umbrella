import type { Middleware } from "openapi-fetch";

import type { Logger } from "../types/logger";

export interface LoggingMiddlewareOptions {
  log: Logger;
  tenantKey: string;
}

const START_HEADER = "x-fevrips-client-start";
const startTimes = new Map<string, number>();

export function createLoggingMiddleware(opts: LoggingMiddlewareOptions): Middleware {
  return {
    onRequest({ request }) {
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      startTimes.set(id, Date.now());
      const headers = new Headers(request.headers);
      headers.set(START_HEADER, id);
      opts.log.debug("fevrips-client: request", {
        tenantKey: opts.tenantKey,
        method: request.method,
        path: safePath(request.url),
      });
      return new Request(request, { headers });
    },
    onResponse({ request, response }) {
      const id = request.headers.get(START_HEADER);
      const start = id ? startTimes.get(id) : undefined;
      if (id) startTimes.delete(id);
      const durationMs = start !== undefined ? Date.now() - start : undefined;
      opts.log.info("fevrips-client: response", {
        tenantKey: opts.tenantKey,
        method: request.method,
        path: safePath(request.url),
        status: response.status,
        ...(durationMs !== undefined ? { durationMs } : {}),
      });
      return response;
    },
  };
}

function safePath(urlStr: string): string {
  try {
    return new URL(urlStr).pathname;
  } catch {
    return urlStr;
  }
}
