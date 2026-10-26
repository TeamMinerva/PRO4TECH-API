import http from "node:http";
import https from "node:https";
import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

export const AI_URL = (process.env.AI_URL || "http://localhost:8000").replace(/\/$/, "");
// Qwen and LightRAG may spend several minutes processing a request.
export const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 1520000;

/**
 * Use node:http(s) because fetch's default headers timeout is shorter than a
 * full LightRAG indexing request. The timeout here is an inactivity timeout.
 */
export function postJson(
  url: string,
  body: unknown,
  timeoutMs: number,
): Promise<{ status: number; data: unknown }> {
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
            // Preserve non-JSON responses as null for the caller to handle.
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
