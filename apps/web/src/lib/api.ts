const API_BASE = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type HealthResponse = {
  status: string;
  module: string;
  timestamp: string;
};

export const api = {
  health: () => fetchApi<HealthResponse>("/health"),
};
