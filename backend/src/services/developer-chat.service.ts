import {
  ChatServiceError,
  perguntarSobreDesenvolvedor,
} from "./chat-project.service";
import type { ChatMessage } from "../schemas/chat-project.schema";

export type { ChatMessage };
export { ChatServiceError as DeveloperChatError };

export async function askAboutDeveloper(
  developerId: number,
  question: string,
  history: ChatMessage[],
): Promise<string> {
  return perguntarSobreDesenvolvedor(developerId, question, history);
}
