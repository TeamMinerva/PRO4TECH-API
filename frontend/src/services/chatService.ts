import { getSession } from './authService';

export interface MensagemChat {
  role: 'user' | 'assistant';
  content: string;
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
) => Promise<string>;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function postarChat(
  path: string,
  pergunta: string,
  historico: MensagemChat[],
  signal?: AbortSignal,
): Promise<string> {
  const { token } = getSession();

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question: pergunta, history: historico }),
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

  const dados = (await response.json()) as { answer?: string };
  if (!dados.answer) throw new Error('A IA retornou uma resposta vazia.');
  return dados.answer;
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
  rotulo: string;
  titulo: string;
  userStory: string;
  criteriosAprovacao: string;
  tecnologias: string[];
}

/** Monta a pergunta enviada ao chat para pedir sugestão de desenvolvedor para um PBI. */
export function montarPerguntaSugestaoDesenvolvedor(pbi: DadosPBISugestao): string {
  const titulo = pbi.titulo.trim();
  const identificacao = `PBI ${pbi.rotulo}${titulo ? ` — ${titulo}` : ''}`;
  const linhas = [`Sugira o(s) desenvolvedor(es) mais adequado(s) para o ${identificacao}.`, ''];
  if (pbi.userStory.trim()) linhas.push(`User Story: ${pbi.userStory.trim()}`);
  if (pbi.criteriosAprovacao.trim()) linhas.push(`Critérios de aprovação: ${pbi.criteriosAprovacao.trim()}`);
  if (pbi.tecnologias.length > 0) linhas.push(`Tecnologias do projeto: ${pbi.tecnologias.join(', ')}`);
  linhas.push(
    '',
    `Justifique cada sugestão com base na experiência dos desenvolvedores cadastrados.`,
  );
  return linhas.join('\n');
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
