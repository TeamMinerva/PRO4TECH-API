import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buscarMensagensConversa,
  criarConversa,
  enviarChatGeral,
  excluirConversa as excluirConversaApi,
  listarConversas,
  renomearConversa as renomearConversaApi,
  type ConversaResumo,
  type FonteChat,
  type MensagemChatGeral,
} from '../services/generalChatService';
import { useTempoProcessamento } from './useTempoProcessamento';

export interface MensagemGeralExibida extends MensagemChatGeral {
  id: number;
  falhou?: boolean;
  fontes?: FonteChat[];
}

export type MensagemChat = MensagemGeralExibida;

const MAX_HISTORICO = 20;

function formatarTituloInicial(pergunta: string): string {
  const limpo = pergunta.trim().replace(/\s+/g, ' ');
  return limpo.length > 40 ? `${limpo.slice(0, 40)}...` : limpo;
}

export function useGeneralChat() {
  const [conversas, setConversas] = useState<ConversaResumo[]>([]);
  const [conversaAtivaId, setConversaAtivaId] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<MensagemGeralExibida[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [carregandoConversa, setCarregandoConversa] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { segundos, iniciar, parar } = useTempoProcessamento();


  const mensagensRef = useRef<MensagemGeralExibida[]>([]);
  const conversaAtivaIdRef = useRef<number | null>(null);
  const proximoId = useRef(1);
  const controlador = useRef<AbortController | null>(null);

  const atualizarMensagens = useCallback((proximas: MensagemGeralExibida[]) => {
    mensagensRef.current = proximas;
    setMensagens(proximas);
  }, []);

  const definirConversaAtiva = useCallback((id: number | null) => {
    conversaAtivaIdRef.current = id;
    setConversaAtivaId(id);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    listarConversas(ctrl.signal)
      .then((lista) => {
        if (!ctrl.signal.aborted) {
          setConversas(lista);
        }
      })
      .catch((err) => {
        if (!ctrl.signal.aborted) {
          console.error('Erro ao carregar conversas:', err);
        }
      });

    return () => {
      ctrl.abort();
      controlador.current?.abort();
    };
  }, []);

  const selecionarConversa = useCallback(
    async (id: number) => {
      if (conversaAtivaIdRef.current === id && !erro) return;

      controlador.current?.abort();
      parar();
      const ctrl = new AbortController();
      controlador.current = ctrl;

      definirConversaAtiva(id);
      atualizarMensagens([]);
      setEnviando(false);
      setErro(null);
      setCarregandoConversa(true);

      try {
        const salvas = await buscarMensagensConversa(id, ctrl.signal);
        if (ctrl.signal.aborted || conversaAtivaIdRef.current !== id) return;

        atualizarMensagens(
          salvas.map((m) => ({
            id: proximoId.current++,
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
            fontes: Array.isArray(m.sources) ? m.sources : [],
          })),
        );
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setErro(
          err instanceof Error
            ? err.message
            : 'Erro ao carregar mensagens da conversa.',
        );
      } finally {
        if (controlador.current === ctrl) {
          setCarregandoConversa(false);
        }
      }
    },
    [atualizarMensagens, definirConversaAtiva, erro, parar],
  );

  const iniciarNovaConversa = useCallback(async () => {
    controlador.current?.abort();
    parar();
    const ctrl = new AbortController();
    controlador.current = ctrl;

    atualizarMensagens([]);
    setEnviando(false);
    setCarregandoConversa(false);
    setErro(null);
    definirConversaAtiva(null);

    try {
      const nova = await criarConversa('Nova Conversa', ctrl.signal);
      if (ctrl.signal.aborted) return;

      definirConversaAtiva(nova.id);
      setConversas((prev) => [nova, ...prev.filter((c) => c.id !== nova.id)]);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setErro(
        err instanceof Error ? err.message : 'Erro ao iniciar nova conversa.',
      );
    }
  }, [atualizarMensagens, definirConversaAtiva, parar]);

  const renomearConversa = useCallback(async (id: number, novoTitulo: string) => {
    const limpo = novoTitulo.trim();
    if (!limpo) return;

    const atualizada = await renomearConversaApi(id, limpo);
    setConversas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: atualizada.title } : c)),
    );
  }, []);

  const excluirConversa = useCallback(
    async (id: number) => {
      await excluirConversaApi(id);

      setConversas((prev) => prev.filter((c) => c.id !== id));

      if (conversaAtivaIdRef.current === id) {
        controlador.current?.abort();
        parar();
        definirConversaAtiva(null);
        atualizarMensagens([]);
        setEnviando(false);
        setCarregandoConversa(false);
        setErro(null);
      }
    },
    [atualizarMensagens, definirConversaAtiva, parar],
  );

  const perguntar = useCallback(
    async (
      pergunta: string,
      base: MensagemGeralExibida[],
      idPergunta: number,
    ) => {
      const historico: MensagemChatGeral[] = base
        .filter((m) => !m.falhou && m.id !== idPergunta)
        .slice(-MAX_HISTORICO)
        .map(({ role, content }) => ({ role, content }));

      controlador.current?.abort();
      parar();
      const ctrl = new AbortController();
      controlador.current = ctrl;
      setEnviando(true);
      setErro(null);
      iniciar();

      try {
        let idConversa = conversaAtivaIdRef.current;

        if (!idConversa) {
          const nova = await criarConversa(
            formatarTituloInicial(pergunta),
            ctrl.signal,
          );
          if (ctrl.signal.aborted) return;

          idConversa = nova.id;
          definirConversaAtiva(nova.id);
          setConversas((prev) => [
            nova,
            ...prev.filter((c) => c.id !== nova.id),
          ]);
        }

        const resultado = await enviarChatGeral(
          pergunta,
          historico,
          ctrl.signal,
          idConversa,
        );

        if (ctrl.signal.aborted || controlador.current !== ctrl  || conversaAtivaIdRef.current !== idConversa) {
          return;
        }

        atualizarMensagens([
          ...mensagensRef.current.map((m) =>
            m.id === idPergunta ? { ...m, falhou: false } : m,
          ),
          {
            id: proximoId.current++,
            role: 'assistant',
            content: resultado.answer,
            fontes: resultado.sources,
          },
        ]);

        setConversas((prev) => {
          const existente = prev.find((c) => c.id === idConversa);
          const atualizada: ConversaResumo = existente
            ? {
                ...existente,
                title: resultado.conversationTitle || existente.title,
              }
            : {
                id: idConversa,
                title:
                  resultado.conversationTitle || formatarTituloInicial(pergunta),
              };
          return [atualizada, ...prev.filter((c) => c.id !== idConversa)];
        });
      } catch (err) {
        if (ctrl.signal.aborted || controlador.current !== ctrl ) return;
        atualizarMensagens(
          mensagensRef.current.map((m) =>
            m.id === idPergunta ? { ...m, falhou: true } : m,
          ),
        );
        setErro(
          err instanceof Error ? err.message : 'Erro ao conversar com a IA.',
        );
      } finally {
        if (controlador.current === ctrl) {
          controlador.current= null;
          parar();
          setEnviando(false);
        } 
      }
    },
    [atualizarMensagens, definirConversaAtiva, iniciar, parar],
  );

  const enviarMensagem = useCallback(
    (texto: string) => {
      const pergunta = texto.trim();
      if (!pergunta || controlador.current || carregandoConversa) return;

      const base = mensagensRef.current.filter((m) => !m.falhou);
      const idPergunta = proximoId.current++;
      atualizarMensagens([
        ...base,
        { id: idPergunta, role: 'user', content: pergunta },
      ]);
      void perguntar(pergunta, base, idPergunta);
    },
    [atualizarMensagens, carregandoConversa, enviando, perguntar],
  );

  const tentarNovamente = useCallback(() => {
    if (controlador.current || carregandoConversa) return;
    const falhada = [...mensagensRef.current].reverse().find((m) => m.falhou);
    if (!falhada) return;
    void perguntar(falhada.content, mensagensRef.current, falhada.id);
  }, [carregandoConversa, enviando, perguntar]);

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

  return {
    conversas,
    conversaAtivaId,
    mensagens,
    fontes,
    enviando,
    segundos,
    carregandoConversa,
    erro,
    enviarMensagem,
    tentarNovamente,
    selecionarConversa,
    iniciarNovaConversa,
    renomearConversa,
    excluirConversa,
  };
}
