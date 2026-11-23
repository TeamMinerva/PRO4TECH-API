import type { GeneralChatMessage } from "../schemas/general-chat.schema";
import { AI_TIMEOUT_MS, AI_URL, isAbortError, postJson } from "./ai-http.service";

export class GeneralChatServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GeneralChatServiceError";
  }
}

interface AiErrorBody {
  detail?: unknown;
}

export interface ChatSource {
  id: string;
  type: "project" | "developer" | "document";
  entity_id: number | null;
  title: string;
}

export interface GeneralChatResult {
  answer: string;
  sources: ChatSource[];
}

export async function perguntarChatGeral(
  question: string,
  history: GeneralChatMessage[],
  signal?: AbortSignal,
): Promise<GeneralChatResult> {
  let resposta;
  try {
    resposta = await postJson(
      `${AI_URL}/chat/general`,
      { question, history },
      AI_TIMEOUT_MS,
      signal,
    );
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new GeneralChatServiceError("A IA demorou demais para responder. Tente novamente.", 504);
    }
    console.error("Falha de rede ao chamar o serviço de IA (chat geral):", error);
    throw new GeneralChatServiceError("Serviço de IA indisponível no momento.", 503);
  }

  if (resposta.status < 200 || resposta.status >= 300) {
    console.error("Serviço de IA respondeu com erro (chat geral):", resposta.status, (resposta.data as AiErrorBody | null)?.detail);

    if (resposta.status === 504) {
      throw new GeneralChatServiceError("A IA demorou demais para responder. Tente novamente.", 504);
    }
    if (resposta.status === 503) {
      throw new GeneralChatServiceError("Serviço de IA indisponível no momento.", 503);
    }
    throw new GeneralChatServiceError("Não foi possível obter a resposta da IA.", 502);
  }

  const dados = resposta.data as { answer: string; sources?: ChatSource[] };
  return {
    answer: dados.answer,
    sources: dados.sources ?? [],
  };
}
