import { useCallback, useEffect, useRef, useState } from 'react';
import type { EnviarMensagemChat, MensagemChat } from '../services/chatService';

export interface MensagemExibida extends MensagemChat {
  id: number;
  /** Pergunta que não obteve resposta (não entra no histórico enviado). */
  falhou?: boolean;
}

// O backend aceita no máximo 20 mensagens de histórico.
const MAX_HISTORICO = 20;

/**
 * Estado e regras de uma conversa com a IA, independentes de contexto:
 * quem decide para onde a pergunta vai é a função `enviar` recebida.
 */
export function useChat(enviar: EnviarMensagemChat) {
  const [mensagens, setMensagens] = useState<MensagemExibida[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mensagensRef = useRef<MensagemExibida[]>([]);
  const proximoId = useRef(1);
  const controlador = useRef<AbortController | null>(null);

  const atualizar = useCallback((proximas: MensagemExibida[]) => {
    mensagensRef.current = proximas;
    setMensagens(proximas);
  }, []);

  // Cancela a requisição em andamento se o chat for desmontado.
  useEffect(() => () => controlador.current?.abort(), []);

  const perguntar = useCallback(
    async (pergunta: string, base: MensagemExibida[], idPergunta: number) => {
      const historico: MensagemChat[] = base
        .filter((m) => !m.falhou && m.id !== idPergunta)
        .slice(-MAX_HISTORICO)
        .map(({ role, content }) => ({ role, content }));

      const ctrl = new AbortController();
      controlador.current = ctrl;
      setEnviando(true);
      setErro(null);

      try {
        const resposta = await enviar(pergunta, historico, ctrl.signal);
        atualizar([
          ...mensagensRef.current.map((m) => (m.id === idPergunta ? { ...m, falhou: false } : m)),
          { id: proximoId.current++, role: 'assistant', content: resposta },
        ]);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        atualizar(mensagensRef.current.map((m) => (m.id === idPergunta ? { ...m, falhou: true } : m)));
        setErro(err instanceof Error ? err.message : 'Erro ao falar com a IA.');
      } finally {
        if (controlador.current === ctrl) {
          controlador.current = null;
          setEnviando(false);
        }
      }
    },
    [enviar, atualizar],
  );

  const enviarMensagem = useCallback(
    (texto: string) => {
      const pergunta = texto.trim();
      if (!pergunta || controlador.current) return;

      const nova: MensagemExibida = { id: proximoId.current++, role: 'user', content: pergunta };
      const base = [...mensagensRef.current, nova];
      atualizar(base);
      void perguntar(pergunta, base, nova.id);
    },
    [atualizar, perguntar],
  );

  const tentarNovamente = useCallback(() => {
    if (controlador.current) return;
    const falha = [...mensagensRef.current].reverse().find((m) => m.falhou);
    if (falha) void perguntar(falha.content, mensagensRef.current, falha.id);
  }, [perguntar]);

  const limpar = useCallback(() => {
    controlador.current?.abort();
    controlador.current = null;
    setEnviando(false);
    setErro(null);
    atualizar([]);
  }, [atualizar]);

  return { mensagens, enviando, erro, enviarMensagem, tentarNovamente, limpar };
}
