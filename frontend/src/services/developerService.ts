import type { CreateBugDTO } from "./bugService";

export interface Developer {
  id: number;
  name: string;
  active: boolean;
  technologies?: DeveloperTechnology[];
}

export interface DeveloperTechnology {
  id: number;
  name: string;
}

export interface DeveloperProject {
  id: number;
  name: string;
  status: string;
}

export interface DeveloperBug {
  id: number;
  title: string;
  description: string;
  solution: string;
  projectId: number;
  projectName: string;
  createdAt: string;
}

export interface DeveloperPBI {
  id: number;
  title: string;
  projectName: string;
  featureName: string;
  epicName: string;
}

export interface DeveloperDetails extends Developer {
  createdAt: string;
  technologies: DeveloperTechnology[];
  projects: DeveloperProject[];
  bugs: DeveloperBug[];
  pbis: DeveloperPBI[];
}

export interface CreateDeveloperDTO {
  name: string;
  active: boolean;
  technologyIds: number[];
}

export interface ApiError {
  message?: string;
  errors?: Record<string, string[]> | { message: string }[];
}

export interface DeveloperChatMessage {
  role: "user" | "assistant";
  content: string;
}

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

function errorMessage(
  body: ApiError | null,
  fallback: string,
): string {
  if (Array.isArray(body?.errors)) {
    return body.errors[0]?.message || body.message || fallback;
  }

  if (body?.errors) {
    for (const messages of Object.values(body.errors)) {
      if (Array.isArray(messages) && messages.length > 0) {
        return messages[0];
      }
    }
  }

  return body?.message || fallback;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw error;
    }

    throw new Error(
      "Não foi possível conectar ao servidor. Verifique se o backend está funcionando.",
    );
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      errorMessage(body as ApiError | null, "Não foi possível concluir a operação."),
    );
  }

  if (body === null) {
    throw new Error("O servidor retornou uma resposta inválida.");
  }

  return body as T;
}

export function getDevelopersGallery(
  signal?: AbortSignal,
): Promise<Developer[]> {
  return request<Developer[]>("/api/developers-gallery", { signal });
}

export function createDeveloper(
  data: CreateDeveloperDTO,
): Promise<Developer> {
  return request<Developer>("/api/developers-gallery", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getDeveloperById(
  id: number | string,
  signal?: AbortSignal,
): Promise<DeveloperDetails> {
  return request<DeveloperDetails>(
    `/api/developers/${encodeURIComponent(String(id))}`,
    { signal },
  );
}

export function getProjectsForBug(
  signal?: AbortSignal,
): Promise<DeveloperProject[]> {
  return request<DeveloperProject[]>("/api/projects-gallery", { signal });
}

export async function updateDeveloperBug(
  id: number,
  data: CreateBugDTO,
): Promise<void> {
  await request<unknown>(`/api/bugs/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function askDeveloper(
  developerId: number,
  question: string,
  history: DeveloperChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  const response = await request<{ answer: string }>(
    `/api/developers/${developerId}/chat`,
    {
      method: "POST",
      body: JSON.stringify({ question, history }),
      signal,
    },
  );

  if (typeof response.answer !== "string" || !response.answer.trim()) {
    throw new Error("A IA retornou uma resposta vazia.");
  }

  return response.answer.trim();
}