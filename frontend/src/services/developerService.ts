export interface Developer {
  id: number;
  name: string;
  active: boolean;
}

export interface CreateDeveloperDTO {
  name: string;
  active: boolean;
  skills: string[];
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

export async function getDevelopersGallery(): Promise<Developer[]> {
  const response = await fetch(`${API_URL}/api/developers-gallery`);

  if (!response.ok) {
    const errorData = await parseJsonResponse<ApiError>(response);
    const errorMsg = extractErrorMessage(errorData, 'Erro ao buscar desenvolvedores.');
    throw new Error(errorMsg);
  }

  const data = await parseJsonResponse<Developer[]>(response);
  if (!data) {
    throw new Error('Resposta inválida do servidor ao buscar desenvolvedores.');
  }

  return data;
}

export async function createDeveloper(data: CreateDeveloperDTO): Promise<Developer> {
  const response = await fetch(`${API_URL}/api/developers-gallery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await parseJsonResponse<ApiError>(response);
    const errorMsg = extractErrorMessage(errorData, 'Erro ao cadastrar desenvolvedor.');
    throw new Error(errorMsg);
  }

  const createdDeveloper = await parseJsonResponse<Developer>(response);
  if (!createdDeveloper) {
    throw new Error('Resposta inválida do servidor ao cadastrar desenvolvedor.');
  }

  return createdDeveloper;
}
