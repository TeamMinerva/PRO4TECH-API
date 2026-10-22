import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import { prisma } from "../lib/prisma";

// Node.js 17+ pode priorizar IPv6 (::1) ao resolver "localhost".
// Forçar IPv4 evita falha de conexão com o uvicorn escutando em 127.0.0.1.
dns.setDefaultResultOrder("ipv4first");

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class DeveloperChatError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "DeveloperChatError";
  }
}

const AI_URL = (
  process.env.AI_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const AI_TIMEOUT_MS = Math.max(
  1000,
  Number(process.env.AI_TIMEOUT_MS) || 1_230_000,
);

interface AIResult {
  status: number;
  data: unknown;
}

function postJSON(url: string, body: unknown): Promise<AIResult> {
  return new Promise((resolve, reject) => {
    console.log("[DEBUG] Chamando IA em:", url);

    const target = new URL(url);
    const transport = target.protocol === "https:" ? https : http;
    const payload = JSON.stringify(body);

    const req = transport.request(
      target,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const buffers: Buffer[] = [];
        let received = 0;

        res.on("data", (chunk: Buffer) => {
          received += chunk.length;

          if (received > 1_000_000) {
            req.destroy(
              new DeveloperChatError(
                "O serviço de IA retornou uma resposta grande demais.",
                502,
              ),
            );
            return;
          }

          buffers.push(chunk);
        });

        res.on("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });

        res.on("aborted", () => {
          clearTimeout(timer);
          reject(
            new DeveloperChatError(
              "A conexão com o serviço de IA foi interrompida.",
              503,
            ),
          );
        });

        res.on("end", () => {
          clearTimeout(timer);

          let data: unknown = null;

          try {
            data = JSON.parse(Buffer.concat(buffers).toString("utf8"));
          } catch {
          }

          resolve({
            status: res.statusCode ?? 502,
            data,
          });
        });
      },
    );

    const timer = setTimeout(() => {
      req.destroy(
        new DeveloperChatError(
          "A IA demorou demais para responder. Tente novamente.",
          504,
        ),
      );
    }, AI_TIMEOUT_MS);

    req.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    req.end(payload);
  });
}

async function buildDeveloperDocument(developerId: number): Promise<string> {
  const developer = await prisma.developer.findUnique({
    where: { id: developerId },
    include: {
      technologies: {
        orderBy: { id: "asc" },
      },
      pbis: {
        orderBy: { id: "asc" },
        include: {
          feature: {
            include: {
              epic: {
                include: {
                  project: true,
                },
              },
            },
          },
        },
      },
      bugs: {
        orderBy: { id: "asc" },
        include: {
          project: true,
        },
      },
    },
  });

  if (!developer) {
    throw new DeveloperChatError("Desenvolvedor não encontrado.", 404);
  }

  const projects = new Map<
    number,
    { id: number; name: string; status: string }
  >();

  for (const pbi of developer.pbis) {
    const project = pbi.feature.epic.project;

    projects.set(project.id, {
      id: project.id,
      name: project.name,
      status: project.status,
    });
  }

  for (const bug of developer.bugs) {
    projects.set(bug.project.id, {
      id: bug.project.id,
      name: bug.project.name,
      status: bug.project.status,
    });
  }

  const profile = {
    developerId: developer.id,
    name: developer.name,
    status: developer.active ? "Ativo" : "Inativo",
    competencies: developer.technologies.map((technology) => technology.name),
    projects: [...projects.values()].sort((a, b) => a.id - b.id),
    totalAssignedPBIs: developer.pbis.length,
    totalSolvedBugs: developer.bugs.length,
  };

  const sections: string[] = [
    `DESENVOLVEDOR #${developer.id}\nPERFIL: ${JSON.stringify(profile)}`,
  ];

  for (const pbi of developer.pbis) {
    const feature = pbi.feature;
    const epic = feature.epic;
    const project = epic.project;

    sections.push(
      `DESENVOLVEDOR #${developer.id}\nPBI ATRIBUÍDO: ${JSON.stringify({
        developerName: developer.name,
        pbiId: pbi.id,
        title: pbi.title,
        userStory: pbi.userStory,
        acceptanceCriteria: pbi.acceptanceCriteria,
        feature: {
          id: feature.id,
          name: feature.name,
          description: feature.description,
        },
        epic: {
          id: epic.id,
          name: epic.name,
          objective: epic.objective,
        },
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
        },
      })}`,
    );
  }

  for (const bug of developer.bugs) {
    sections.push(
      `DESENVOLVEDOR #${developer.id}\nPROBLEMA SOLUCIONADO: ${JSON.stringify({
        developerName: developer.name,
        bugId: bug.id,
        title: bug.title,
        description: bug.description,
        solution: bug.solution,
        projectId: bug.projectId,
        projectName: bug.project.name,
        createdAt: bug.createdAt.toISOString(),
      })}`,
    );
  }

  return sections.join("\n\n");
}

export async function askAboutDeveloper(
  developerId: number,
  question: string,
  history: ChatMessage[],
): Promise<string> {
  const document = await buildDeveloperDocument(developerId);

  console.log("[DEBUG] Documento gerado:", document.length, "bytes");
  console.log("[DEBUG] Início do documento:", document.slice(0, 300));

  if (document.length > 500_000) {
    throw new DeveloperChatError(
      "Os registros deste desenvolvedor excedem o limite de indexação desta versão.",
      413,
    );
  }

  let result: AIResult;

  try {
    result = await postJSON(`${AI_URL}/chat/developer`, {
      developer_id: developerId,
      question,
      history,
      document,
    });
  } catch (error) {
    if (error instanceof DeveloperChatError) {
      throw error;
    }

    console.error("Falha ao acessar o serviço de IA:", error);

    throw new DeveloperChatError(
      "Serviço de IA indisponível. Verifique se o FastAPI e o Ollama estão funcionando.",
      503,
    );
  }

  if (result.status < 200 || result.status >= 300) {
    console.error("[DEBUG] FastAPI respondeu:", result.status, result.data);

    if (result.status === 504) {
      throw new DeveloperChatError(
        "A indexação ou a resposta da IA demorou demais. Tente novamente.",
        504,
      );
    }

    if (result.status === 503) {
      throw new DeveloperChatError(
        "A base de conhecimento ou o modelo ainda não está disponível. Tente novamente após verificar o serviço de IA.",
        503,
      );
    }

    throw new DeveloperChatError(
      "O serviço de IA não conseguiu processar a pergunta.",
      502,
    );
  }

  const data = result.data as {
    developer_id?: unknown;
    answer?: unknown;
  } | null;

  if (
    data?.developer_id !== developerId
    || typeof data.answer !== "string"
    || !data.answer.trim()
  ) {
    throw new DeveloperChatError(
      "O serviço de IA retornou uma resposta inválida.",
      502,
    );
  }

  return data.answer.trim();
}