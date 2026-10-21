import { useState, useCallback, useEffect } from "react";
import type { FonteChat } from "../services/generalChatService";

export interface MensagemChat {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  fontes?: FonteChat[];
}

export function useGeneralChat(conversaId: number | null) {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [fontes, setFontes] = useState<FonteChat[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (conversaId) {
      fetch(`http://localhost:3000/api/conversations/${conversaId}/messages`)
        .then(res => res.json())
        .then(data => {
           setMensagens(data.map((m: any) => ({
             id: m.id,
             role: m.role,
             content: m.content
           })));
        })
        .catch(err => console.error("Erro ao buscar histórico:", err));
    } else {
      setMensagens([]);
    }
  }, [conversaId]);

  const enviarMensagem = useCallback(async (conteudo: string, overrideId?: number) => {
    const idUsar = overrideId || conversaId;
    if (!idUsar) return;

    const novaMensagem: MensagemChat = { id: Date.now(), role: "user", content: conteudo };
    setMensagens((prev: MensagemChat[]) => [...prev, novaMensagem]);
    setEnviando(true);
    setErro(null);

    try {
      const res = await fetch("http://localhost:3000/api/chat/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: conteudo, conversationId: idUsar })
      });

      if (!res.ok) throw new Error("Erro ao enviar mensagem");

      const data = await res.json();
      setMensagens((prev: MensagemChat[]) => [
        ...prev, 
        { id: Date.now() + 1, role: "assistant", content: data.answer, fontes: data.fontes }
      ]);
      if (data.fontes) setFontes(data.fontes);
    } catch (err) {
      setErro("Ocorreu um erro ao comunicar com a IA.");
    } finally {
      setEnviando(false);
    }
  }, [conversaId]);

  const tentarNovamente = useCallback(() => {
    const ultimaMensagem = mensagens[mensagens.length - 1];
    if (ultimaMensagem && ultimaMensagem.role === "user") {
       setMensagens((prev: MensagemChat[]) => prev.slice(0, -1));
       enviarMensagem(ultimaMensagem.content);
    }
  }, [mensagens, enviarMensagem]);

  return { mensagens, fontes, enviando, erro, enviarMensagem, tentarNovamente };
}