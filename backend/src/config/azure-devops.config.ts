import { z } from "zod";

export const AZURE_DEVOPS_API_VERSION = "7.1";
export const DEFAULT_AZURE_DEVOPS_BASE_URL = "https://dev.azure.com";
export const DEFAULT_AZURE_DEVOPS_TIMEOUT_MS = 15000;

export class AzureDevOpsConfigError extends Error {
  public readonly status = 500;

  constructor(
    message: string,
    public readonly missingVariables: string[] = [],
  ) {
    super(message);
    this.name = "AzureDevOpsConfigError";
  }
}

const azureDevOpsEnvSchema = z.object({
  AZURE_DEVOPS_ORG: z
    .string({ message: "AZURE_DEVOPS_ORG não configurada." })
    .trim()
    .min(1, "AZURE_DEVOPS_ORG não pode ser vazia."),
  AZURE_DEVOPS_PROJECT: z
    .string({ message: "AZURE_DEVOPS_PROJECT não configurada." })
    .trim()
    .min(1, "AZURE_DEVOPS_PROJECT não pode ser vazia."),
  AZURE_DEVOPS_PAT: z
    .string({ message: "AZURE_DEVOPS_PAT não configurada." })
    .trim()
    .min(1, "AZURE_DEVOPS_PAT não pode ser vazia."),
  AZURE_DEVOPS_BASE_URL: z
    .string()
    .trim()
    .url("AZURE_DEVOPS_BASE_URL deve ser uma URL válida.")
    .optional(),
  AZURE_DEVOPS_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .optional(),
});

export interface AzureDevOpsConfig {
  organization: string;
  project: string;
  pat: string;
  baseUrl: string;
  apiVersion: string;
  timeoutMs: number;
  projectApiBaseUrl: string;
  basicAuthHeader: string;
}

export function buildBasicAuthHeader(pat: string): string {
  const token = Buffer.from(`:${pat}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

export function getAzureDevOpsConfig(
  env: NodeJS.ProcessEnv = process.env,
): AzureDevOpsConfig {
  const parsed = azureDevOpsEnvSchema.safeParse({
    AZURE_DEVOPS_ORG: env.AZURE_DEVOPS_ORG,
    AZURE_DEVOPS_PROJECT: env.AZURE_DEVOPS_PROJECT,
    AZURE_DEVOPS_PAT: env.AZURE_DEVOPS_PAT,
    AZURE_DEVOPS_BASE_URL: env.AZURE_DEVOPS_BASE_URL || undefined,
    AZURE_DEVOPS_TIMEOUT_MS: env.AZURE_DEVOPS_TIMEOUT_MS || undefined,
  });

  if (!parsed.success) {
    const missingVariables = parsed.error.issues
      .map((issue) => String(issue.path[0] ?? ""))
      .filter(Boolean);

    throw new AzureDevOpsConfigError(
      `Credenciais do Azure DevOps ausentes ou inválidas nas variáveis de ambiente (${missingVariables.join(", ")}). Configure AZURE_DEVOPS_ORG, AZURE_DEVOPS_PROJECT e AZURE_DEVOPS_PAT no arquivo .env.`,
      missingVariables,
    );
  }

  const organization = parsed.data.AZURE_DEVOPS_ORG;
  const project = parsed.data.AZURE_DEVOPS_PROJECT;
  const pat = parsed.data.AZURE_DEVOPS_PAT;
  const baseUrl = (parsed.data.AZURE_DEVOPS_BASE_URL || DEFAULT_AZURE_DEVOPS_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const timeoutMs = parsed.data.AZURE_DEVOPS_TIMEOUT_MS ?? DEFAULT_AZURE_DEVOPS_TIMEOUT_MS;
  const projectApiBaseUrl = `${baseUrl}/${encodeURIComponent(organization)}/${encodeURIComponent(project)}`;

  return {
    organization,
    project,
    pat,
    baseUrl,
    apiVersion: AZURE_DEVOPS_API_VERSION,
    timeoutMs,
    projectApiBaseUrl,
    basicAuthHeader: buildBasicAuthHeader(pat),
  };
}

export function checkAzureDevOpsConfigOnStartup(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  try {
    getAzureDevOpsConfig(env);
    return true;
  } catch (error) {
    if (error instanceof AzureDevOpsConfigError) {
      console.warn(
        `[AzureDevOps] Aviso de inicialização: ${error.message}`,
      );
    }
    return false;
  }
}
