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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
}
