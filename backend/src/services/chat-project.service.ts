import { prisma } from "../lib/prisma";
import type { ChatMessage } from "../schemas/chat-project.schema";
import { AI_URL, AI_TIMEOUT_MS, postJson } from "./ai-http.service";

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

export { AIServiceError as ChatServiceError };

interface AiErrorBody {
  detail?: unknown;
}

/**
 * Chamada genérica ao serviço de IA. Cada contexto de chat (projeto,
 * desenvolvedor, ...) é um endpoint próprio no serviço Python; aqui só
 * traduzimos falhas de infraestrutura em erros HTTP coerentes para o front.
 */
export async function postarParaIA<TResposta>(path: string, body: unknown): Promise<TResposta> {
  let resposta;
  try {
    resposta = await postJson(`${AI_URL}${path}`, body, AI_TIMEOUT_MS);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new AIServiceError("A IA demorou demais para responder. Tente novamente.", 504);
    }
    console.error("Falha de rede ao chamar o serviço de IA:", error);
    throw new AIServiceError("Serviço de IA indisponível no momento.", 503);
  }

  if (resposta.status < 200 || resposta.status >= 300) {
    console.error("Serviço de IA respondeu com erro:", resposta.status, (resposta.data as AiErrorBody | null)?.detail);

    if (resposta.status === 504) {
      throw new AIServiceError("A IA demorou demais para responder. Tente novamente.", 504);
    }
    if (resposta.status === 503) {
      throw new AIServiceError("Serviço de IA indisponível no momento.", 503);
    }
    if (path === "/projects/similar" && resposta.status === 404) {
      throw new AIServiceError("O projeto ainda não possui conteúdo indexado.", 404);
    }
    if (path === "/projects/similar" && resposta.status === 409) {
      throw new AIServiceError("Os embeddings do projeto de origem não estão disponíveis.", 409);
    }
    throw new AIServiceError("Não foi possível obter a resposta da IA.", 502);
  }

  return resposta.data as TResposta;
}

export async function perguntarSobreProjeto(
  projectId: number,
  question: string,
  history: ChatMessage[],
): Promise<string> {
  const projeto = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!projeto) {
    throw new AIServiceError("Projeto não encontrado.", 404);
  }

  const resposta = await postarParaIA<{ answer: string }>("/chat/project", {
    project_id: projectId,
    question,
    history,
  });
  return resposta.answer;
}
