import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ArrowUp, PanelRightClose, RotateCcw } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { criarEnviarChatDesenvolvedor } from "../services/chatService";
import { MensagemMarkdown } from "./MensagemMarkdown";

interface Props {
  developerId: number;
  developerName: string;
  open: boolean;
  onClose: () => void;
}

const TAMANHO_MAXIMO = 8000;

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
  const {
    mensagens,
    enviando,
    erro,
    enviarMensagem,
    tentarNovamente,
    limpar,
  } = useChat(enviarChat);

  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [mensagens, enviando, erro, open]);

  function clearChat() {
    limpar();
    setText("");
  }

  function enviar(conteudo: string) {
    const pergunta = conteudo.trim();
    if (!pergunta || enviando) return;
    enviarMensagem(pergunta);
    setText("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    enviar(text);
  }

  const vazio = mensagens.length === 0;

  return (
    <aside
      className="dev-chat"
      hidden={!open}
      aria-label={`Chat sobre ${developerName}`}
    >
      <header className="dev-chat-header">
        <div>
          <strong>Chat do desenvolvedor</strong>
          <small>{developerName}</small>
        </div>

        <div className="dev-chat-actions">
          {!vazio && (
            <button
              type="button"
              className="dev-icon"
              onClick={clearChat}
              title="Limpar conversa"
              aria-label="Limpar conversa"
            >
              <RotateCcw size={17} />
            </button>
          )}

          <button
            type="button"
            className="dev-icon"
            onClick={onClose}
            title="Fechar chat"
            aria-label="Fechar chat"
          >
            <PanelRightClose size={22} />
          </button>
        </div>
      </header>

      <div className="dev-chat-messages" role="log" aria-live="polite">
        {vazio && !enviando && (
          <div className="dev-chat-welcome">
            <p className="dev-chat-empty">
              Pergunte sobre as competências de {developerName}, os projetos e
              PBIs em que participou ou os problemas que solucionou.
            </p>
            <div className="dev-chat-suggestions">
              {SUGESTOES.map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  className="dev-chat-suggestion"
                  onClick={() => enviar(sugestao)}
                >
                  {sugestao}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((message) => (
          <div
            key={message.id}
            className={`dev-message dev-message--${message.role}`}
            aria-label={message.role === "user" ? "Você" : "Assistente"}
          >
            {message.role === "assistant" ? (
              <MensagemMarkdown conteudo={message.content} />
            ) : (
              message.content
            )}
          </div>
        ))}

        {enviando && (
          <div className="dev-message dev-message--assistant" role="status">
            Pensando...
          </div>
        )}

        {erro && !enviando && (
          <div className="dev-chat-error-box" role="alert">
            <p className="dev-error">{erro}</p>
            <button
              type="button"
              className="dev-chat-retry"
              onClick={tentarNovamente}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div ref={end} />
      </div>

      <form className="dev-chat-form" onSubmit={submit}>
        <textarea
          rows={2}
          maxLength={TAMANHO_MAXIMO}
          value={text}
          disabled={enviando}
          onChange={(event) => setText(event.target.value)}
          placeholder="Pergunte sobre este desenvolvedor."
          aria-label="Pergunta sobre o desenvolvedor"
          onKeyDown={(event) => {
            if (
              event.key === "Enter"
              && !event.shiftKey
              && !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />

        <button
          type="submit"
          className="dev-icon"
          disabled={!text.trim() || enviando}
          aria-label="Enviar mensagem"
        >
          <ArrowUp size={22} />
        </button>
      </form>

      <p className="dev-chat-note">
        Enter para enviar · Shift + Enter para quebrar a linha
      </p>
    </aside>
  );
}
