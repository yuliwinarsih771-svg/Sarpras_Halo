let inMemoryToken: string | null = null;

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (inMemoryToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const errMsg =
      typeof data.error === 'string' && data.error
        ? data.error
        : `Permintaan gagal (${res.status}).`;
    throw new Error(errMsg);
  }

  return data as T;
}
