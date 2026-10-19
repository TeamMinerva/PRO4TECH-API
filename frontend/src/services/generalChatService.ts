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
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function enviarChatGeral(
  pergunta: string,
  historico: MensagemChatGeral[],
  signal?: AbortSignal,
): Promise<RespostaChatGeral> {
  const { token } = getSession();

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/chat/general`, {
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

  const dados = (await response.json()) as { answer?: string; sources?: FonteChat[] };
  if (!dados.answer) throw new Error('A IA retornou uma resposta vazia.');
  return {
    answer: dados.answer,
    sources: Array.isArray(dados.sources) ? dados.sources : [],
  };
}
