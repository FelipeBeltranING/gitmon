export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} en ${url}`);
  }
}

const cache = new Map<string, Promise<unknown>>();

/** GET de JSON con memoria: la misma URL se pide una sola vez por sesión. Si falla, se olvida para reintentar. */
export function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  let hit = cache.get(url) as Promise<T> | undefined;
  if (!hit) {
    hit = fetch(url, init).then(async (res) => {
      if (!res.ok) throw new HttpError(res.status, url);
      return (await res.json()) as T;
    });
    hit.catch(() => cache.delete(url));
    cache.set(url, hit);
  }
  return hit;
}
