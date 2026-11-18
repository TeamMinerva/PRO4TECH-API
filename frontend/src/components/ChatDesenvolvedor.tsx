import { useMemo } from "react";
import { criarEnviarChatDesenvolvedor } from "../services/chatService";
import { ChatLateral } from "./ChatLateral";

interface Props {
  developerId: number;
  developerName: string;
  open: boolean;
  onClose: () => void;
}

const SUGESTOES = [
  "Faça um resumo do perfil e das competências deste desenvolvedor.",
  "Em quais projetos e PBIs ele participou?",
  "Quais problemas/bugs foram resolvidos por ele e quais soluções aplicou?",
];

export function ChatDesenvolvedor({
  developerId,
  developerName,
  open,
  onClose,
}: Props) {
  const enviarChat = useMemo(
    () => criarEnviarChatDesenvolvedor(developerId),
    [developerId],
  );

  return (
    <ChatLateral
      key={developerId}
      aberto={open}
      onFechar={onClose}
      onEnviar={enviarChat}
      titulo="Chat do desenvolvedor"
      placeholder="Pergunte sobre este desenvolvedor."
      mensagemBoasVindas={`Pergunte sobre as competências de ${developerName}, os projetos e PBIs em que participou ou os problemas que solucionou.`}
      sugestoes={SUGESTOES}
    />
  );
}
