import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import { prisma } from "../lib/prisma";
import type { ChatMessage } from "../schemas/chat-project.schema";

dns.setDefaultResultOrder("ipv4first");

const AI_URL = (process.env.AI_URL || "http://localhost:8000").replace(/\/$/, "");
// Com thinking ligado e CPU, o Qwen3 pode levar minutos. Mantemos um teto um
// pouco acima do timeout do serviço de IA (AI_TIMEOUT_SECONDS, padrão 600s).
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 1520000;

/**
 * POST JSON usando node:http(s). O fetch embutido do Node corta a conexão se os
 * headers não chegam em 300s e a resposta do modelo só começa quando ele termina;
 * http.request não tem esse limite, só o timeout de inatividade abaixo.
 */
function postJson(url: string, body: unknown, timeoutMs: number): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const alvo = new URL(url);
    const payload = JSON.stringify(body);
    const cliente = alvo.protocol === "https:" ? https : http;

    const req = cliente.request(
      alvo,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: timeoutMs,
      },
      (res) => {
        const partes: Buffer[] = [];
        res.on("data", (parte: Buffer) => partes.push(parte));
        res.on("error", reject);
        res.on("end", () => {
          let data: unknown = null;
          try {
            data = JSON.parse(Buffer.concat(partes).toString("utf8"));
          } catch {
            // corpo não-JSON: mantém null
          }
          resolve({ status: res.statusCode ?? 0, data });
        });
      },
    );

    req.on("timeout", () => req.destroy(Object.assign(new Error("timeout"), { name: "TimeoutError" })));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ChatServiceError";
  }
}

interface AiErrorBody {
  detail?: unknown;
}

/**
 * Chamada genérica ao serviço de IA. Cada contexto de chat (projeto,
 * desenvolvedor, ...) é um endpoint próprio no serviço Python; aqui só
 * traduzimos falhas de infraestrutura em erros HTTP coerentes para o front.
 */
async function postarParaIA<TResposta>(path: string, body: unknown): Promise<TResposta> {
  let resposta;
  try {
    resposta = await postJson(`${AI_URL}${path}`, body, AI_TIMEOUT_MS);
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ChatServiceError("A IA demorou demais para responder. Tente novamente.", 504);
    }
    console.error("Falha de rede ao chamar o serviço de IA:", error);
    throw new ChatServiceError("Serviço de IA indisponível no momento.", 503);
  }

  if (resposta.status < 200 || resposta.status >= 300) {
    console.error("Serviço de IA respondeu com erro:", resposta.status, (resposta.data as AiErrorBody | null)?.detail);

    if (resposta.status === 504) {
      throw new ChatServiceError("A IA demorou demais para responder. Tente novamente.", 504);
    }
    if (resposta.status === 503) {
      throw new ChatServiceError("Serviço de IA indisponível no momento.", 503);
    }
    throw new ChatServiceError("Não foi possível obter a resposta da IA.", 502);
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
    throw new ChatServiceError("Projeto não encontrado.", 404);
  }

  const resposta = await postarParaIA<{ answer: string }>("/chat/project", {
    project_id: projectId,
    question,
    history,
  });
  return resposta.answer;
}

export async function perguntarSobreDesenvolvedor(
  developerId: number,
  question: string,
  history: ChatMessage[],
): Promise<string> {
  const desenvolvedor = await prisma.developer.findUnique({
    where: { id: developerId },
    select: { id: true },
  });
  if (!desenvolvedor) {
    throw new ChatServiceError("Desenvolvedor não encontrado.", 404);
  }

  const resposta = await postarParaIA<{ answer: string }>("/chat/developer", {
    developer_id: developerId,
    question,
    history,
  });
  return resposta.answer;
}
