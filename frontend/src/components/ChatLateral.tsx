import { ArrowUp, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useChat } from '../hooks/useChat';
import { MensagemMarkdown } from './MensagemMarkdown';
import type { EnviarMensagemChat } from '../services/chatService';

interface ChatLateralProps {
  aberto: boolean;
  onFechar: () => void;
  /** Envia a pergunta ao contexto desejado (ex.: criarEnviarChatProjeto(id)). */
  onEnviar: EnviarMensagemChat;
  titulo?: string;
  placeholder?: string;
  mensagemBoasVindas?: string;
  /** Perguntas prontas exibidas enquanto a conversa está vazia. */
  sugestoes?: string[];
}

const TAMANHO_MAXIMO = 8000;

/**
 * Chat lateral genérico. Não sabe nada sobre projetos: o contexto vem inteiro
 * de `onEnviar`. Use `key` com o identificador do contexto para reiniciar a
 * conversa ao trocar de projeto/desenvolvedor/etc.
 */
export function ChatLateral({
  aberto,
  onFechar,
  onEnviar,
  titulo = 'Chat',
  placeholder = 'Digite uma mensagem.',
  mensagemBoasVindas,
  sugestoes = [],
}: ChatLateralProps) {
  const { mensagens, enviando, erro, enviarMensagem, tentarNovamente, limpar } = useChat(onEnviar);
  const [texto, setTexto] = useState('');
  const fimDaLista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens, enviando, erro]);

  function enviar(conteudo: string) {
    if (!conteudo.trim() || enviando) return;
    enviarMensagem(conteudo);
    setTexto('');
  }

  function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    enviar(texto);
  }

  const vazio = mensagens.length === 0;
  const podeEnviar = texto.trim().length > 0 && !enviando;

  return (
    <aside
      inert={!aberto}
      className={`shrink-0 overflow-hidden rounded-[16px] bg-[#141617] transition-[width] duration-300 ${
        aberto ? 'w-[420px] sm:w-[480px]' : 'w-0'
      }`}
    >
      <div className="flex h-full w-[420px] flex-col p-6 sm:w-[480px]">
        <div className="flex items-center justify-between pb-6">
          <p className="text-[20px] text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {titulo}
          </p>
          <div className="flex items-center gap-4">
            {!vazio && (
              <button
                type="button"
                onClick={limpar}
                aria-label="Limpar conversa"
                title="Limpar conversa"
                className="text-[#5a5f5f] transition-colors hover:text-white"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar chat"
              className="text-[#5a5f5f] transition-colors hover:text-white"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div
          role="log"
          aria-live="polite"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <div className="mt-auto flex flex-col gap-4">
            {vazio && (
              <div className="flex flex-col gap-3">
                {mensagemBoasVindas && (
                  <p className="text-[14px] leading-relaxed text-[#5a5f5f]">{mensagemBoasVindas}</p>
                )}
                {sugestoes.map((sugestao) => (
                  <button
                    key={sugestao}
                    type="button"
                    onClick={() => enviar(sugestao)}
                    className="self-start rounded-[12px] border border-[#2d2d2d] px-4 py-2 text-left text-[14px] text-[#d6d6d6] transition-colors hover:border-[#ED6A32] hover:text-white"
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
            )}

            {mensagens.map((mensagem) => (
              <div
                key={mensagem.id}
                className={`max-w-[85%] break-words rounded-[14px] px-4 py-3 text-[14px] leading-relaxed text-white ${
                  mensagem.role === 'user'
                    ? 'self-end whitespace-pre-wrap bg-[#3f3f3f]'
                    : 'min-w-0 self-start bg-[#2d2d2d]'
                }`}
              >
                {mensagem.role === 'assistant' ? (
                  <MensagemMarkdown conteudo={mensagem.content} />
                ) : (
                  mensagem.content
                )}
              </div>
            ))}

            {enviando && (
              <div
                className="flex items-center gap-2 self-start rounded-[14px] bg-[#2d2d2d] px-4 py-3 text-[14px] text-[#9a9fa0]"
                role="status"
              >
                <span className="flex gap-1" aria-hidden="true">
                  <span className="size-1.5 animate-pulse rounded-full bg-[#9a9fa0]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-[#9a9fa0] [animation-delay:150ms]" />
                  <span className="size-1.5 animate-pulse rounded-full bg-[#9a9fa0] [animation-delay:300ms]" />
                </span>
                Pensando...
              </div>
            )}

            {erro && !enviando && (
              <div
                role="alert"
                className="flex max-w-[85%] flex-col gap-2 self-start rounded-[14px] border border-[#ED6A32]/40 px-4 py-3 text-[14px] text-[#ED6A32]"
              >
                <span>{erro}</span>
                <button
                  type="button"
                  onClick={tentarNovamente}
                  className="self-start text-[#d6d6d6] underline transition-colors hover:text-white"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            <div ref={fimDaLista} />
          </div>
        </div>

        <form
          onSubmit={aoSubmeter}
          className="relative mt-6 flex h-[52px] items-center justify-between rounded-[12px] border border-[#2d2d2d] px-4 focus-within:border-[#3f3f3f]"
        >
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={TAMANHO_MAXIMO}
            placeholder={placeholder}
            aria-label={placeholder}
            disabled={enviando}
            className="m-0 w-full border-0 bg-transparent p-0 text-[14px] text-white outline-none placeholder-[#3d3f40] disabled:opacity-60"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          />
          <button
            type="submit"
            disabled={!podeEnviar}
            aria-label="Enviar mensagem"
            className={`flex size-[26px] shrink-0 items-center justify-center transition-colors ${
              podeEnviar ? 'text-[#ED6A32] hover:text-[#ff8555]' : 'cursor-not-allowed text-[#3d3f40]'
            }`}
          >
            <ArrowUp size={18} />
          </button>
        </form>
      </div>
    </aside>
  );
}
