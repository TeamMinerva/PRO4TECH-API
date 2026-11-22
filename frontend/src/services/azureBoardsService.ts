import { API_URL, authFetch } from './authService';
import type { EpicoDetalhe } from './projectService';

export type TipoItemBacklog = 'Epic' | 'Feature' | 'PBI';
export type StatusItemExportacao = 'EXPORTED' | 'FAILED' | 'SKIPPED';

export interface ItemExportadoBacklog {
  sourceId: number;
  name: string;
  type: TipoItemBacklog;
  status: StatusItemExportacao;
  azureId?: number;
  url?: string;
  webUrl?: string;
  parentId?: number;
  azureParentId?: number;
  error?: string;
}

export interface ResumoExportacaoBackend {
  total: number;
  exported: number;
  failed: number;
  skipped: number;
}

export interface ResultadoExportacaoBacklog {
  success: boolean;
  message: string;
  projectId: number;
  projectName: string;
  summary: ResumoExportacaoBackend;
  items: ItemExportadoBacklog[];
}

export interface ContagemBacklog {
  epicos: number;
  features: number;
  pbis: number;
  total: number;
}

export class ErroAzureBoards extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ErroAzureBoards';
    this.status = status;
    this.details = details;
  }
}

export function contarBacklog(epicos: EpicoDetalhe[]): ContagemBacklog {
  const features = epicos.reduce((soma, e) => soma + (e.features?.length || 0), 0);
  const pbis = epicos.reduce(
    (soma, e) =>
      soma +
      (e.features || []).reduce((s, f) => s + (f.pbis?.length || 0), 0),
    0,
  );
  return {
    epicos: epicos.length,
    features,
    pbis,
    total: epicos.length + features + pbis,
  };
}

export async function exportarBacklogProjeto(
  projectId: number,
): Promise<ResultadoExportacaoBacklog> {
  let response: Response;
  try {
    response = await authFetch(`${API_URL}/api/projects/${projectId}/export/azure-devops`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Falha de rede ao conectar com o backend:', err);
    throw new ErroAzureBoards(
      'Não foi possível conectar ao servidor backend. Verifique sua conexão e tente novamente.',
      0,
    );
  }

  const corpo = await response.json().catch(() => null);

  if (!response.ok) {
    const mensagem =
      corpo?.message ||
      (response.status === 401
        ? 'Autenticação necessária ou token inválido.'
        : response.status === 404
          ? 'Projeto não encontrado.'
          : response.status === 409
            ? 'Já existe uma exportação em andamento para este projeto.'
            : 'Erro ao processar a exportação do backlog.');

    throw new ErroAzureBoards(mensagem, response.status, corpo?.details);
  }

  return corpo as ResultadoExportacaoBacklog;
}
