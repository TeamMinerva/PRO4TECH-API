
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EnviarMensagemChat, MensagemChat } from '../services/chatService';
import { useTempoProcessamento } from './useTempoProcessamento';

export interface MensagemExibida extends MensagemChat {
  id: number;
  /** Pergunta que não obteve resposta (não entra no histórico enviado). */
  falhou?: boolean;
  /** Mensagem de uma interação cancelada pelo usuário (não entra no histórico enviado). */
  cancelada?: boolean;
  createdAt?: string;
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

  const { segundos, iniciar, parar } = useTempoProcessamento();

  const mensagensRef = useRef<MensagemExibida[]>([]);
  const proximoId = useRef(1);
  const controlador = useRef<AbortController | null>(null);
  const idPerguntaAtivaRef = useRef<number | null>(null);
  const enviosCustomizadosRef = useRef<Map<number, EnviarMensagemChat>>(new Map());

  const atualizar = useCallback((proximas: MensagemExibida[]) => {
    mensagensRef.current = proximas;
    setMensagens(proximas);
  }, []);

  // Cancela a requisição em andamento se o chat for desmontado.
  useEffect(() => () => controlador.current?.abort(), []);

  const perguntar = useCallback(
    async (pergunta: string, base: MensagemExibida[], idPergunta: number) => {
      const historico: MensagemChat[] = base
        .filter((m) => !m.falhou && !m.cancelada && m.id !== idPergunta)
        .slice(-MAX_HISTORICO)
        .map(({ role, content }) => ({ role, content }));

      const ctrl = new AbortController();
      controlador.current = ctrl;
      idPerguntaAtivaRef.current = idPergunta;

      setEnviando(true);
      setErro(null);
      iniciar();

      try {
        const executor = enviosCustomizadosRef.current.get(idPergunta) ?? enviar;
        const resposta = await executor(pergunta, historico, ctrl.signal);

        if (ctrl.signal.aborted || controlador.current !== ctrl) return;

        const conteudoResposta =
          typeof resposta === 'string' ? resposta : resposta.answer;
        const horarioResposta =
          (typeof resposta === 'object' && resposta !== null
            ? resposta.createdAt
            : undefined) ?? new Date().toISOString();
        const horarioPergunta =
          typeof resposta === 'object' && resposta !== null
            ? resposta.userCreatedAt
            : undefined;

        enviosCustomizadosRef.current.delete(idPergunta);
        atualizar([
          ...mensagensRef.current.map((m) =>
            m.id === idPergunta
              ? {
                  ...m,
                  falhou: false,
                  createdAt: m.createdAt ?? horarioPergunta,
                }
              : m,
          ),
          {
            id: proximoId.current++,
            role: 'assistant',
            content: conteudoResposta,
            createdAt: horarioResposta,
          },
        ]);
      } catch (err) {
        if (ctrl.signal.aborted || controlador.current !== ctrl) return;

        atualizar(
          mensagensRef.current.map((m) =>
            m.id === idPergunta ? { ...m, falhou: true } : m,
          ),
        );

        setErro(
          err instanceof Error ? err.message : 'Erro ao falar com a IA.',
        );
      } finally {
        if (controlador.current === ctrl) {
          controlador.current = null;
          idPerguntaAtivaRef.current = null;
          parar();
          setEnviando(false);
        }
      }
    },
    [enviar, atualizar, iniciar, parar],
  );

  const enviarMensagem = useCallback(
    (texto: string, enviarCustomizado?: EnviarMensagemChat) => {
      const pergunta = texto.trim();

      if (!pergunta || controlador.current) return;

      const id = proximoId.current++;
      if (enviarCustomizado) {
        enviosCustomizadosRef.current.set(id, enviarCustomizado);
      }
      const nova: MensagemExibida = {
        id,
        role: 'user',
        content: pergunta,
        createdAt: new Date().toISOString(),
      };
      const base = [...mensagensRef.current, nova];
      atualizar(base);

      void perguntar(pergunta, base, nova.id);
    },
    [atualizar, perguntar],
  );

  const tentarNovamente = useCallback(() => {
    if (controlador.current) return;

    const falha = [...mensagensRef.current]
      .reverse()
      .find((m) => m.falhou);

    if (falha) {
      void perguntar(falha.content, mensagensRef.current, falha.id);
    }
  }, [perguntar]);

  const cancelar = useCallback(() => {
    const ctrl = controlador.current;
    if (!ctrl) return;

    const idPergunta = idPerguntaAtivaRef.current;
    controlador.current = null;
    idPerguntaAtivaRef.current = null;
    ctrl.abort();
    parar();
    setEnviando(false);

    if (idPergunta !== null) {
      enviosCustomizadosRef.current.delete(idPergunta);
      atualizar([
        ...mensagensRef.current.map((m) =>
          m.id === idPergunta ? { ...m, cancelada: true } : m,
        ),
        {
          id: proximoId.current++,
          role: 'assistant',
          content: '*Resposta cancelada pelo usuário.*',
          cancelada: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [atualizar, parar]);

  const limpar = useCallback(() => {
    controlador.current?.abort();
    controlador.current = null;
    idPerguntaAtivaRef.current = null;
    enviosCustomizadosRef.current.clear();
    parar();
    setEnviando(false);
    setErro(null);
    atualizar([]);
  }, [atualizar, parar]);

  return {
    mensagens,
    enviando,
    segundos,
    erro,
    enviarMensagem,
    cancelar,
    tentarNovamente,
    limpar,
  };
}
