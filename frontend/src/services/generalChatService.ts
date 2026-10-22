import { getSession } from './authService';

export interface MensagemChatGeral {
  role: 'user' | 'assistant';
  content: string;
}

export interface FonteChat {
  id: string;
  type: 'project' | 'developer' | 'document';
  entity_id?: number | null;
  title: string;
}

export interface RespostaChatGeral {
  answer: string;
  sources: FonteChat[];
  conversationId?: number;
  conversationTitle?: string;
}

export interface ConversaResumo {
  id: number;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MensagemConversaSalva {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: FonteChat[] | null;
  createdAt?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function montarHeaders(comJson = false): HeadersInit {
  const { token } = getSession();
  return {
    ...(comJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listarConversas(signal?: AbortSignal): Promise<ConversaResumo[]> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/conversations`, {
      method: 'GET',
      headers: montarHeaders(),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('Não foi possível carregar o histórico de conversas.', { cause: err });
  }

  if (!response.ok) {
    throw new Error('Erro ao buscar conversas.');
  }

  const dados = await response.json();
  return Array.isArray(dados) ? (dados as ConversaResumo[]) : [];
}

export async function criarConversa(
  titulo?: string,
  signal?: AbortSignal,
): Promise<ConversaResumo> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/conversations`, {
      method: 'POST',
      headers: montarHeaders(true),
      body: JSON.stringify(titulo ? { title: titulo } : {}),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('Não foi possível iniciar uma nova conversa.', { cause: err });
  }

  if (!response.ok) {
    let mensagem = 'Erro ao criar conversa.';
    try {
      const dados = await response.json();
      if (dados?.message) mensagem = dados.message;
    } catch {
      // mantém a mensagem padrão
    }
    throw new Error(mensagem);
  }

  return (await response.json()) as ConversaResumo;
}

export async function buscarMensagensConversa(
  conversaId: number,
  signal?: AbortSignal,
): Promise<MensagemConversaSalva[]> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/conversations/${conversaId}/messages`, {
      method: 'GET',
      headers: montarHeaders(),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('Não foi possível carregar as mensagens da conversa.', { cause: err });
  }

  if (!response.ok) {
    let mensagem = 'Erro ao buscar mensagens da conversa.';
    try {
      const dados = await response.json();
      if (dados?.message) mensagem = dados.message;
    } catch {
      // mantém a mensagem padrão
    }
    throw new Error(mensagem);
  }

  const dados = await response.json();
  return Array.isArray(dados) ? (dados as MensagemConversaSalva[]) : [];
}

export async function enviarChatGeral(
  pergunta: string,
  historico: MensagemChatGeral[],
  signal?: AbortSignal,
  conversaId?: number | null,
): Promise<RespostaChatGeral> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/chat/general`, {
      method: 'POST',
      headers: montarHeaders(true),
      body: JSON.stringify({
        question: pergunta,
        history: historico,
        ...(conversaId ? { conversationId: conversaId } : {}),
      }),
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

  const dados = (await response.json()) as {
    answer?: string;
    sources?: FonteChat[];
    conversationId?: number;
    conversationTitle?: string;
  };
  if (!dados.answer) throw new Error('A IA retornou uma resposta vazia.');
  return {
    answer: dados.answer,
    sources: Array.isArray(dados.sources) ? dados.sources : [],
    conversationId: dados.conversationId,
    conversationTitle: dados.conversationTitle,
  };
}
