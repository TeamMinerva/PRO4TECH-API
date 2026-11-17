import { getSession } from './authService';
import type { EpicoDetalhe } from './projectService';

export type TipoItemBacklog = 'Épico' | 'Feature' | 'PBI';

export interface ItemExportado {
  tipo: TipoItemBacklog;
  titulo: string;
  id: number;
  url?: string;
}

export interface ErroExportacao {
  tipo: TipoItemBacklog;
  titulo: string;
  mensagem: string;
}

export interface ResultadoExportacao {
  exportados: ItemExportado[];
  erros: ErroExportacao[];
  ignorados: number;
  interrompidaPor?: string;
}

export interface ProgressoExportacao {
  concluidos: number;
  total: number;
  atual: string;
}

export interface ContagemBacklog {
  epicos: number;
  features: number;
  pbis: number;
  total: number;
}

interface TipoWorkItem {
  name: string;
  isDisabled: boolean;
}

interface WorkItemCriado {
  id: number;
  webUrl?: string;
  url?: string;
}

interface CriarWorkItemDTO {
  type: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  parentId?: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TIPOS_PBI = ['Product Backlog Item', 'User Story', 'Requirement'];
const STATUS_FATAIS = new Set([401, 403, 500, 503, 504]);

class ErroAzureBoards extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }

  get fatal() {
    return this.status === 0 || STATUS_FATAIS.has(this.status);
  }
}

export function contarBacklog(epicos: EpicoDetalhe[]): ContagemBacklog {
  const features = epicos.reduce((soma, e) => soma + e.features.length, 0);
  const pbis = epicos.reduce(
    (soma, e) => soma + e.features.reduce((s, f) => s + f.pbis.length, 0),
    0,
  );
  return { epicos: epicos.length, features, pbis, total: epicos.length + features + pbis };
}

async function requisitar<T>(path: string, init?: RequestInit): Promise<T> {
  const { token } = getSession();

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/azure-boards${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    console.error('Falha de rede ao acessar o Azure Boards:', err);
    throw new ErroAzureBoards('Não foi possível conectar ao servidor. Verifique sua conexão.', 0);
  }

  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new ErroAzureBoards(corpo?.message || 'Erro na comunicação com o Azure Boards.', response.status);
  }

  return response.json() as Promise<T>;
}

async function buscarTipos(): Promise<TipoWorkItem[]> {
  const dados = await requisitar<{ workItemTypes: TipoWorkItem[] }>('/work-item-types');
  return dados.workItemTypes;
}

function criarWorkItem(dados: CriarWorkItemDTO): Promise<WorkItemCriado> {
  return requisitar<{ workItem: WorkItemCriado }>('/work-items', {
    method: 'POST',
    body: JSON.stringify(dados),
  }).then((resposta) => resposta.workItem);
}

function resolverTipo(tipos: TipoWorkItem[], candidatos: string[]): string | undefined {
  const habilitados = tipos.filter((t) => !t.isDisabled);
  for (const candidato of candidatos) {
    const achado = habilitados.find((t) => t.name.toLowerCase() === candidato.toLowerCase());
    if (achado) return achado.name;
  }
  return undefined;
}

const escaparHtml = (texto: string) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function paraHtml(texto: string): string {
  return escaparHtml(texto.trim()).replace(/\r?\n/g, '<br>');
}

function montarDescricao(secoes: Array<[rotulo: string | null, texto: string]>): string | undefined {
  const html = secoes
    .filter(([, texto]) => texto?.trim())
    .map(([rotulo, texto]) => (rotulo ? `<b>${rotulo}</b><br>${paraHtml(texto)}` : paraHtml(texto)))
    .join('<br><br>');
  return html || undefined;
}

const limitarTitulo = (titulo: string) => (titulo.trim() || '(sem título)').slice(0, 255);

export async function exportarBacklog(
  epicos: EpicoDetalhe[],
  onProgresso: (progresso: ProgressoExportacao) => void,
): Promise<ResultadoExportacao> {
  const { total } = contarBacklog(epicos);
  const resultado: ResultadoExportacao = { exportados: [], erros: [], ignorados: 0 };
  let concluidos = 0;

  const avancar = (atual: string) => {
    concluidos++;
    onProgresso({ concluidos, total, atual });
  };

  onProgresso({ concluidos, total, atual: 'Verificando tipos de item do Azure Boards...' });

  let tipoEpico: string | undefined;
  let tipoFeature: string | undefined;
  let tipoPBI: string | undefined;
  try {
    const tipos = await buscarTipos();
    tipoEpico = resolverTipo(tipos, ['Epic']);
    tipoFeature = resolverTipo(tipos, ['Feature']);
    tipoPBI = resolverTipo(tipos, TIPOS_PBI);
  } catch (err) {
    resultado.ignorados = total;
    resultado.interrompidaPor = err instanceof Error ? err.message : 'Falha ao consultar o Azure Boards.';
    return resultado;
  }

  const ausentes = [
    !tipoEpico && 'Epic',
    !tipoFeature && 'Feature',
    !tipoPBI && 'Product Backlog Item / User Story',
  ].filter(Boolean);
  if (ausentes.length > 0) {
    resultado.ignorados = total;
    resultado.interrompidaPor = `O processo do projeto no Azure Boards não possui os tipos: ${ausentes.join(', ')}.`;
    return resultado;
  }

  const criar = async (
    tipo: TipoItemBacklog,
    titulo: string,
    dados: CriarWorkItemDTO,
  ): Promise<WorkItemCriado | null> => {
    if (resultado.interrompidaPor) return null;
    onProgresso({ concluidos, total, atual: `${tipo}: ${titulo}` });
    try {
      const criado = await criarWorkItem(dados);
      resultado.exportados.push({
        tipo,
        titulo,
        id: criado.id,
        url: criado.webUrl ?? criado.url,
      });
      return criado;
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido.';
      resultado.erros.push({ tipo, titulo, mensagem });
      if (err instanceof ErroAzureBoards && err.fatal) resultado.interrompidaPor = mensagem;
      return null;
    }
  };

  const ignorar = (quantidade: number, atual: string) => {
    resultado.ignorados += quantidade;
    concluidos += quantidade;
    onProgresso({ concluidos, total, atual });
  };

  const registrarFalha = (tentativasAntes: number, descendentes: number, atual: string) => {
    const tentado = resultado.erros.length > tentativasAntes;
    if (tentado) avancar(atual);
    ignorar(descendentes + (tentado ? 0 : 1), atual);
  };

  for (const epico of epicos) {
    const tituloEpico = limitarTitulo(epico.name);
    const descendentesEpico = contarBacklog([epico]).total - 1;
    const errosAntes = resultado.erros.length;

    const criadoEpico = await criar('Épico', tituloEpico, {
      type: tipoEpico!,
      title: tituloEpico,
      description: montarDescricao([
        [null, epico.description],
        ['Objetivo', epico.objective],
        ['Resultado esperado', epico.expectedResult],
      ]),
    });
    if (!criadoEpico) {
      registrarFalha(errosAntes, descendentesEpico, `Épico não exportado: ${tituloEpico}`);
      continue;
    }
    avancar(`Épico: ${tituloEpico}`);

    for (const feature of epico.features) {
      const tituloFeature = limitarTitulo(feature.name);
      const errosAntesFeature = resultado.erros.length;

      const criadaFeature = await criar('Feature', tituloFeature, {
        type: tipoFeature!,
        title: tituloFeature,
        parentId: criadoEpico.id,
        description: montarDescricao([
          [null, feature.description],
          ['Critérios de aprovação', feature.approvalCriteria],
        ]),
      });
      if (!criadaFeature) {
        registrarFalha(errosAntesFeature, feature.pbis.length, `Feature não exportada: ${tituloFeature}`);
        continue;
      }
      avancar(`Feature: ${tituloFeature}`);

      for (const pbi of feature.pbis) {
        const tituloPBI = limitarTitulo(pbi.title);
        const errosAntesPBI = resultado.erros.length;

        const criadoPBI = await criar('PBI', tituloPBI, {
          type: tipoPBI!,
          title: tituloPBI,
          parentId: criadaFeature.id,
          description: montarDescricao([[null, pbi.userStory]]),
          acceptanceCriteria: pbi.acceptanceCriteria?.trim() ? paraHtml(pbi.acceptanceCriteria) : undefined,
        });
        if (criadoPBI) avancar(`PBI: ${tituloPBI}`);
        else registrarFalha(errosAntesPBI, 0, `PBI não exportado: ${tituloPBI}`);
      }
    }
  }

  return resultado;
}
