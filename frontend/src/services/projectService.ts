export interface Desenvolvedor {
  id: number;
  name: string;
}

export interface ProjetoSemelhante {
  id: number;
  name: string;
  technologies?: string[];
  status?: string;
}

export interface ProjetoSemelhanteIA {
  projectId: number;
  name: string;
  status: string;
  technologies: string[];
  similarity: number;
  justification: string;
  evidence: Array<{
    text: string;
    sourceText: string;
  }>;
}

export interface ProjetosSemelhantesResponse {
  projectId: number;
  similarProjects: ProjetoSemelhanteIA[];
}

export interface PBIBacklog {
  id: number;
  title: string;
  userStory?: string;
  acceptanceCriteria?: string;
  developers: Desenvolvedor[];
}

export interface PBIDetalhe {
  id: number;
  title: string;
  userStory: string;
  acceptanceCriteria: string;
  developers: Desenvolvedor[];
}

export interface FeatureDetalhe {
  id: number;
  name: string;
  description: string;
  approvalCriteria: string;
  pbis: PBIDetalhe[];
}

export interface EpicoDetalhe {
  id: number;
  name: string;
  description: string;
  objective: string;
  expectedResult: string;
  features: FeatureDetalhe[];
}

export interface BugDetalhe {
  id: number;
  title: string;
  description: string;
  solution: string;
  developer: { id: number; name: string };
}

export interface ProjetoDetalhes {
  id: number;
  name: string;
  status: string;
  technologies: string[];
  technologyIds?: number[];
  developers: Desenvolvedor[];
  similarProjects: ProjetoSemelhante[];
  backlog: PBIBacklog[];
  bugs?: BugDetalhe[];
  epics?: EpicoDetalhe[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const buscasEmAndamento = new Map<string, Promise<ProjetosSemelhantesResponse>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function evidenciaSemelhanteValida(value: unknown): boolean {
  return isRecord(value)
    && typeof value.text === 'string'
    && typeof value.sourceText === 'string';
}

function projetoSemelhanteValido(value: unknown): boolean {
  return isRecord(value)
    && typeof value.projectId === 'number'
    && Number.isSafeInteger(value.projectId)
    && value.projectId > 0
    && typeof value.name === 'string'
    && typeof value.status === 'string'
    && Array.isArray(value.technologies)
    && value.technologies.every((technology) => typeof technology === 'string')
    && typeof value.similarity === 'number'
    && Number.isFinite(value.similarity)
    && value.similarity >= 0
    && value.similarity <= 1
    && typeof value.justification === 'string'
    && Array.isArray(value.evidence)
    && value.evidence.every(evidenciaSemelhanteValida);
}

function respostaSemelhantesValida(value: unknown, projectId: number): value is ProjetosSemelhantesResponse {
  return isRecord(value)
    && value.projectId === projectId
    && Array.isArray(value.similarProjects)
    && value.similarProjects.every(projetoSemelhanteValido);
}

function lerCacheSemelhantes(projectId: number): ProjetosSemelhantesResponse | null {
  try {
    const cached = sessionStorage.getItem(`projetos-semelhantes:${projectId}`);
    if (!cached) return null;

    const parsed: unknown = JSON.parse(cached);
    if (respostaSemelhantesValida(parsed, projectId)) return parsed;

    sessionStorage.removeItem(`projetos-semelhantes:${projectId}`);
    console.error('Cache inválido de projetos semelhantes removido.');
  } catch (error) {
    console.error('Não foi possível ler o cache de projetos semelhantes:', error);
  }
  return null;
}

function invalidarCacheSemelhantes(projectId: number | string) {
  try {
    sessionStorage.removeItem(`projetos-semelhantes:${projectId}`);
    sessionStorage.removeItem(`projetos-semelhantes-erro:${projectId}`);
  } catch (error) {
    console.error('Não foi possível invalidar o cache de projetos semelhantes:', error);
  }
}

function lerErroCacheSemelhantes(projectId: number): string | null {
  try {
    return sessionStorage.getItem(`projetos-semelhantes-erro:${projectId}`);
  } catch (error) {
    console.error('Não foi possível ler o estado de erro dos projetos semelhantes:', error);
    return null;
  }
}

function armazenarErroSemelhantes(projectId: number, error: unknown) {
  const message = error instanceof Error
    ? error.message
    : 'Não foi possível buscar projetos semelhantes.';
  try {
    sessionStorage.setItem(`projetos-semelhantes-erro:${projectId}`, message);
  } catch (storageError) {
    console.error('Não foi possível armazenar o erro da busca de projetos semelhantes:', storageError);
  }
}

function limparErroCacheSemelhantes(projectId: number) {
  try {
    sessionStorage.removeItem(`projetos-semelhantes-erro:${projectId}`);
  } catch (error) {
    console.error('Não foi possível limpar o estado de erro dos projetos semelhantes:', error);
  }
}

export async function getProjectById(id: number | string): Promise<ProjetoDetalhes> {
  const response = await fetch(`${API_URL}/api/projects/${id}`);

  if (!response.ok) {
    let errorMsg = 'Erro ao buscar detalhes do projeto.';
    try {
      const errorData = await response.json();
      if (errorData?.message) {
        errorMsg = errorData.message;
      }
    } catch {
      // Usa mensagem padrão
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function getSimilarProjects(
  id: number | string,
  ignorarCache = false,
): Promise<ProjetosSemelhantesResponse> {
  const projectId = Number(id);
  if (!ignorarCache) {
    const cached = lerCacheSemelhantes(projectId);
    if (cached) return cached;

    const cachedError = lerErroCacheSemelhantes(projectId);
    if (cachedError) throw new Error(cachedError);
  }

  const key = String(projectId);
  const existingRequest = buscasEmAndamento.get(key);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    const response = await fetch(`${API_URL}/api/projects/${projectId}/similar`);
    if (!response.ok) {
      let errorMsg = 'Erro ao buscar projetos semelhantes.';
      try {
        const errorData = await response.json();
        if (errorData?.message) errorMsg = errorData.message;
      } catch {
        // Usa mensagem padrão
      }
      throw new Error(errorMsg);
    }

    const data: unknown = await response.json();
    if (!respostaSemelhantesValida(data, projectId)) {
      throw new Error('A resposta da busca de projetos semelhantes é inválida.');
    }

    try {
      sessionStorage.setItem(`projetos-semelhantes:${projectId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Não foi possível armazenar o resultado de projetos semelhantes:', error);
    }
    limparErroCacheSemelhantes(projectId);
    return data;
  })();
  buscasEmAndamento.set(key, request);

  try {
    return await request;
  } catch (error) {
    armazenarErroSemelhantes(projectId, error);
    throw error;
  } finally {
    buscasEmAndamento.delete(key);
  }
}

export async function updateProject(id: number | string, payload: unknown): Promise<ProjetoDetalhes> {


  const response = await fetch(`${API_URL}/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMsg = 'Erro ao salvar o projeto.';
    try {
      const errorData = await response.json();
      if (errorData?.message) {
        errorMsg = errorData.message;
      }
    } catch {
      // Usa mensagem padrão
    }
    throw new Error(errorMsg);
  }

  const projeto = await response.json() as ProjetoDetalhes;
  invalidarCacheSemelhantes(id);
  return projeto;
}
