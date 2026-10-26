import http from "node:http";
import https from "node:https";
import type { GeneralChatMessage } from "../schemas/general-chat.schema";

const AI_URL = (process.env.AI_URL || "http://localhost:8000").replace(/\/$/, "");
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 1520000;

function postJson(
  url: string,
  body: unknown,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    }

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

    const onAbort = () => {
      req.destroy(Object.assign(new Error("aborted"), { name: "AbortError" }));
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    req.on("close", () => signal?.removeEventListener("abort", onAbort));
    req.on("timeout", () => req.destroy(Object.assign(new Error("timeout"), { name: "TimeoutError" })));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

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
    if (error instanceof Error && error.name === "AbortError") {
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
