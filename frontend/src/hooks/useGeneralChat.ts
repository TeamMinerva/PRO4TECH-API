import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  enviarChatGeral,
  type FonteChat,
  type MensagemChatGeral,
} from '../services/generalChatService';

export interface MensagemGeralExibida extends MensagemChatGeral {
  id: number;
  falhou?: boolean;
  fontes?: FonteChat[];
}

const MAX_HISTORICO = 20;

export function useGeneralChat() {
  const [mensagens, setMensagens] = useState<MensagemGeralExibida[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mensagensRef = useRef<MensagemGeralExibida[]>([]);
  const proximoId = useRef(1);
  const controlador = useRef<AbortController | null>(null);

  const atualizar = useCallback((proximas: MensagemGeralExibida[]) => {
    mensagensRef.current = proximas;
    setMensagens(proximas);
  }, []);

  useEffect(() => () => controlador.current?.abort(), []);

  const perguntar = useCallback(
    async (pergunta: string, base: MensagemGeralExibida[], idPergunta: number) => {
      const historico: MensagemChatGeral[] = base
        .filter((m) => !m.falhou && m.id !== idPergunta)
        .slice(-MAX_HISTORICO)
        .map(({ role, content }) => ({ role, content }));

      const ctrl = new AbortController();
      controlador.current = ctrl;
      setEnviando(true);
      setErro(null);

      try {
        const resultado = await enviarChatGeral(pergunta, historico, ctrl.signal);
        atualizar([
          ...mensagensRef.current.map((m) => (m.id === idPergunta ? { ...m, falhou: false } : m)),
          {
            id: proximoId.current++,
            role: 'assistant',
            content: resultado.answer,
            fontes: resultado.sources,
          },
        ]);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        atualizar(
          mensagensRef.current.map((m) => (m.id === idPergunta ? { ...m, falhou: true } : m)),
        );
        setErro(err instanceof Error ? err.message : 'Erro ao conversar com a IA.');
      } finally {
        if (controlador.current === ctrl) setEnviando(false);
      }
    },
    [atualizar],
  );

  const enviarMensagem = useCallback(
    (texto: string) => {
      const pergunta = texto.trim();
      if (!pergunta || enviando) return;

      const base = mensagensRef.current.filter((m) => !m.falhou);
      const idPergunta = proximoId.current++;
      atualizar([...base, { id: idPergunta, role: 'user', content: pergunta }]);
      void perguntar(pergunta, base, idPergunta);
    },
    [atualizar, enviando, perguntar],
  );

  const tentarNovamente = useCallback(() => {
    if (enviando) return;
    const falhada = [...mensagensRef.current].reverse().find((m) => m.falhou);
    if (!falhada) return;
    void perguntar(falhada.content, mensagensRef.current, falhada.id);
  }, [enviando, perguntar]);

  const fontes = useMemo(() => {
    const mapa = new Map<string, FonteChat>();
    for (const m of mensagens) {
      for (const f of m.fontes ?? []) {
        if (f.id && !mapa.has(f.id)) {
          mapa.set(f.id, f);
        }
      }
    }
    return Array.from(mapa.values());
  }, [mensagens]);

  return { mensagens, fontes, enviando, erro, enviarMensagem, tentarNovamente };
}
