export interface User {
  id: number;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function extractErrorMessage(errorData: ApiError | null, fallbackMessage: string): string {
  if (!errorData) {
    return fallbackMessage;
  }

  if (errorData.errors && typeof errorData.errors === 'object') {
    const fieldErrors = Object.values(errorData.errors);
    for (const messages of fieldErrors) {
      if (Array.isArray(messages) && messages.length > 0 && typeof messages[0] === 'string') {
        return messages[0];
      }
    }
  }

  return errorData.message || fallbackMessage;
}

export async function registerUser(email: string, password: string): Promise<User> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await parseJsonResponse<ApiError>(response);
    const errorMsg = extractErrorMessage(errorData, 'Erro ao realizar cadastro.');
    throw new Error(errorMsg);
  }

  const data = await parseJsonResponse<User>(response);

  if (!data) {
    throw new Error('Resposta inválida do servidor ao registrar usuário.');
  }

  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await parseJsonResponse<ApiError>(response);
    const errorMsg = extractErrorMessage(errorData, 'Erro ao realizar login.');
    throw new Error(errorMsg);
  }

  const data = await parseJsonResponse<AuthResponse>(response);

  if (!data) {
    throw new Error('Resposta inválida do servidor ao realizar login.');
  }

  return data;
}

export function saveSession(token: string, user: User) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function getSession(): { token: string | null; user: User | null } {
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('auth_user');
  let user: User | null = null;

  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      user = null;
    }
  }

  return { token, user };
}

export function clearSession() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  try {
    sessionStorage.clear();
  } catch {
    // Ignora falhas de acesso ao sessionStorage em ambientes restritos
  }
}

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return atob(padded);
}

export function isTokenValid(token: string | null): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    return false;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>;
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    if (typeof payload.id !== 'number' || !Number.isInteger(payload.id) || payload.id <= 0) {
      return false;
    }

    if (typeof payload.email !== 'string' || payload.email.trim().length === 0) {
      return false;
    }

    if (payload.exp !== undefined) {
      if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function isAuthenticated(): boolean {
  const { token } = getSession();
  if (!isTokenValid(token)) {
    if (token) {
      clearSession();
    }
    return false;
  }
  return true;
}

export function getAuthHeaders(extraHeaders?: HeadersInit): Headers {
  const headers = new Headers(extraHeaders);
  const { token } = getSession();
  if (token && isTokenValid(token)) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

function notifyUnauthorized(): void {
  clearSession();
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));

  const pathname = window.location.pathname;
  if (pathname !== '/' && pathname !== '/cadastro') {
    setTimeout(() => {
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/cadastro') {
        window.location.replace('/');
      }
    }, 0);
  }
}

export function logout(): void {
  clearSession();
}

export async function verifySessionWithServer(): Promise<User | null> {
  if (!isAuthenticated()) {
    return null;
  }

  try {
    const response = await authFetch(`${API_URL}/auth/me`);
    if (!response.ok) {
      return null;
    }
    const user = await parseJsonResponse<User>(response);
    if (user) {
      const { token } = getSession();
      if (token) {
        saveSession(token, user);
      }
    }
    return user;
  } catch {
    return null;
  }
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const { token } = getSession();

  if (!isTokenValid(token)) {
    notifyUnauthorized();
    return new Response(
      JSON.stringify({ message: 'Sessão expirada ou não autenticada.' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const headers = getAuthHeaders(init.headers);
  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    notifyUnauthorized();
  }

  return response;
}
