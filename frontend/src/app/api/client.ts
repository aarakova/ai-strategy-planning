const BASE = '/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(detail);
  }
}

function statusMessage(status: number): string {
  const map: Record<number, string> = {
    400: 'Некорректный запрос',
    401: 'Неверный логин или пароль',
    403: 'Доступ запрещён',
    404: 'Ресурс не найден',
    409: 'Пользователь с таким логином уже существует',
    422: 'Ошибка валидации данных',
    429: 'Слишком много запросов — попробуйте позже',
    500: 'Внутренняя ошибка сервера',
    502: 'Сервер недоступен (Bad Gateway)',
    503: 'Сервис временно недоступен',
  };
  return map[status] ?? `Ошибка сервера (${status})`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, 'Не удалось подключиться к серверу. Проверьте соединение.');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({ detail: null }));

  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : statusMessage(res.status);
    throw new ApiError(res.status, detail);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  del: (path: string) => request<void>(path, { method: 'DELETE' }),
};
