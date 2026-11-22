import { API_URL, authFetch } from './authService';
import type { RascunhoProjeto } from './rascunhoProjeto';

export interface MensagemChat {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface RespostaChat {
  answer: string;
  createdAt?: string;
  userCreatedAt?: string;
}

/**
 * Contrato entre o componente de chat e o contexto em que ele é usado.
 * O ChatLateral só conhece esta função: qual endpoint chamar (projeto,
 * desenvolvedor, ...) é decidido por quem cria o EnviarMensagemChat.
 */
export type EnviarMensagemChat = (
  pergunta: string,
  historico: MensagemChat[],
  signal?: AbortSignal,
) => Promise<string | RespostaChat>;

export const PERGUNTA_ANALISAR_PROJETO = 'Analisar projeto';

async function postarJson<TResponse>(
  path: string,
  payload: object,
  signal?: AbortSignal,
): Promise<TResponse> {
  let response: Response;
  try {
    response = await authFetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.', { cause: err });
  }

  if (!response.ok) {
    let mensagem = 'Não foi possível obter a resposta da IA.';
    try {
      const dados = await response.json();
      if (dados?.message) mensagem = dados.message;
    } catch {
      // mantém a mensagem padrão
    }
    throw new Error(mensagem);
  }

  return (await response.json()) as TResponse;
}

async function postarRequisicaoIA(
  path: string,
  payload: object,
  signal?: AbortSignal,
): Promise<RespostaChat> {
  const dados = await postarJson<{
    answer?: string;
    createdAt?: string;
    userCreatedAt?: string;
  }>(path, payload, signal);
  if (!dados.answer) throw new Error('A IA retornou uma resposta vazia.');
  return {
    answer: dados.answer,
    createdAt: dados.createdAt,
    userCreatedAt: dados.userCreatedAt,
  };
}

async function postarChat(
  path: string,
  pergunta: string,
  historico: MensagemChat[],
  signal?: AbortSignal,
  extra: object = {},
): Promise<RespostaChat> {
  return postarRequisicaoIA(
    path,
    { question: pergunta, history: historico, ...extra },
    signal,
  );
}

/** Solicita a análise estruturada do rascunho atual do projeto à IA. */
export function analisarRascunhoProjeto(
  draft: RascunhoProjeto,
  historico: MensagemChat[] = [],
  signal?: AbortSignal,
): Promise<RespostaChat> {
  return postarRequisicaoIA(
    '/api/chat/projects/draft/analyze',
    { draft, history: historico },
    signal,
  );
}

/**
 * Chat que responde dúvidas sobre UM projeto específico.
 * Sem projetoId (projeto ainda não salvo), usa POST /api/chat/projects,
 * que deve responder com o mesmo formato { answer } sem contexto de projeto.
 */
export function criarEnviarChatProjeto(projetoId: number | string): EnviarMensagemChat {
  return (pergunta, historico, signal) => {
    if (String(projetoId).trim() === '') {
      return postarChat('/api/chat/projects', pergunta, historico, signal);
    }
    const id = Number(projetoId);
    if (!Number.isInteger(id) || id <= 0) {
      return Promise.reject(new Error('Projeto inválido para o chat.'));
    }
    return postarChat(`/api/chat/projects/${id}`, pergunta, historico, signal);
  };
}

export interface DadosPBISugestao {
  pbiId?: number | null;
  rotulo: string;
  titulo: string;
  userStory: string;
  criteriosAprovacao: string;
  tecnologias: string[];
}

export interface DesenvolvedorRecomendado {
  developerId: number;
  name: string;
  score: number;
  justification: string;
  evidence: string[];
}

export interface RespostaRecomendacaoDesenvolvedores {
  pbiId: number | null;
  developers: DesenvolvedorRecomendado[];
  message: string;
  automaticAssignment: boolean;
}

/** Monta a pergunta exibida no chat ao pedir sugestão de desenvolvedor para um PBI. */
export function montarPerguntaSugestaoDesenvolvedor(pbi: DadosPBISugestao): string {
  const titulo = pbi.titulo.trim();
  const identificacao = `PBI ${pbi.rotulo}${titulo ? ` — ${titulo}` : ''}`;
  return `Sugerir desenvolvedor para o ${identificacao}`;
}

/** Solicita recomendações estruturadas de desenvolvedores para um PBI ao backend. */
export function recomendarDesenvolvedoresPbi(
  pbi: DadosPBISugestao,
  signal?: AbortSignal,
): Promise<RespostaRecomendacaoDesenvolvedores> {
  const titulo = pbi.titulo.trim() || pbi.userStory.trim().slice(0, 500);
  return postarJson<RespostaRecomendacaoDesenvolvedores>(
    '/api/developers/recommend',
    {
      pbiId: pbi.pbiId ?? null,
      title: titulo,
      userStory: pbi.userStory.trim(),
      acceptanceCriteria: pbi.criteriosAprovacao.trim(),
    },
    signal,
  );
}

/** Formata as recomendações recebidas da IA em Markdown identificando o PBI correspondente. */
export function formatarRecomendacaoDesenvolvedoresMarkdown(
  pbi: DadosPBISugestao,
  resposta: RespostaRecomendacaoDesenvolvedores,
): string {
  const titulo = pbi.titulo.trim();
  const cabecalho = `**Sugestões de desenvolvedores — PBI ${pbi.rotulo}${titulo ? ` (${titulo})` : ''}**`;

  if (resposta.developers.length === 0) {
    return `${cabecalho}\n\n${resposta.message}`;
  }

  const itens = resposta.developers.map((dev, index) => {
    const compatibilidade = Math.round(dev.score * 100);
    return `${index + 1}. **${dev.name}** *(afinidade estimada: ${compatibilidade}%)*\n   ${dev.justification}`;
  });

  return [cabecalho, '', ...itens, '', `*${resposta.message}*`].join('\n');
}

/** Cria o executor que solicita a recomendação especializada para o PBI e formata para o chat. */
export function criarEnviarSugestaoDesenvolvedor(pbi: DadosPBISugestao): EnviarMensagemChat {
  return async (_pergunta, _historico, signal) => {
    const resposta = await recomendarDesenvolvedoresPbi(pbi, signal);
    return formatarRecomendacaoDesenvolvedoresMarkdown(pbi, resposta);
  };
}

/** Chat que responde dúvidas sobre UM desenvolvedor específico. */
export function criarEnviarChatDesenvolvedor(desenvolvedorId: number | string): EnviarMensagemChat {
  return (pergunta, historico, signal) => {
    const id = Number(desenvolvedorId);
    if (!Number.isInteger(id) || id <= 0) {
      return Promise.reject(new Error('Desenvolvedor inválido para o chat.'));
    }
    return postarChat(`/api/chat/developers/${id}`, pergunta, historico, signal);
  };
}

/**
 * Chat que responde dúvidas e realiza a análise do projeto em cadastro,
 * sempre lendo os dados mais recentes do formulário via `getRascunho()`.
 */
export function criarEnviarChatRascunho(getRascunho: () => RascunhoProjeto): EnviarMensagemChat {
  return (pergunta, historico, signal) => {
    if (pergunta.trim() === PERGUNTA_ANALISAR_PROJETO) {
      return analisarRascunhoProjeto(getRascunho(), historico, signal);
    }
    return postarChat('/api/chat/projects/draft', pergunta, historico, signal, {
      draft: getRascunho(),
    });
  };
}
