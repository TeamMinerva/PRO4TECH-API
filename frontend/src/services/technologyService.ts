import { API_URL, authFetch } from './authService';

export interface Technology {
  id: number;
  name: string;
}

interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
}

async function extractError(response: Response, fallback: string): Promise<Error> {
  try {
    const data = (await response.json()) as ApiError;
    const fieldMessage = data.errors && Object.values(data.errors).flat()[0];
    return new Error(fieldMessage || data.message || fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function getTechnologies(): Promise<Technology[]> {
  const response = await authFetch(`${API_URL}/api/technologies`);

  if (!response.ok) throw await extractError(response, 'Erro ao buscar tecnologias.');

  return (await response.json()) as Technology[];
}

export async function createTechnology(name: string): Promise<Technology> {
  const response = await authFetch(`${API_URL}/api/technologies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) throw await extractError(response, 'Erro ao criar tecnologia.');

  return (await response.json()) as Technology;
}

export async function updateTechnology(id: number, name: string): Promise<Technology> {
  const response = await authFetch(`${API_URL}/api/technologies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) throw await extractError(response, 'Erro ao editar tecnologia.');

  return (await response.json()) as Technology;
}

export async function deleteTechnology(id: number): Promise<void> {
  const response = await authFetch(`${API_URL}/api/technologies/${id}`, { method: 'DELETE' });

  if (!response.ok) throw await extractError(response, 'Erro ao remover tecnologia.');
}
