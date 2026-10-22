import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ArrowUp, PanelRightClose, RotateCcw } from "lucide-react";
import {
  askDeveloper,
  type DeveloperChatMessage,
} from "../services/developerService";

interface Props {
  developerId: number;
  developerName: string;
  open: boolean;
  onClose: () => void;
}

export function ChatDesenvolvedor({
  developerId,
  developerName,
  open,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<DeveloperChatMessage[]>([]);
  const [text, setText] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [error, setError] = useState("");

  const request = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => request.current?.abort();
  }, []);

  useEffect(() => {
    if (open) {
      end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [messages, pendingQuestion, open]);

  function clearChat() {
    request.current?.abort();
    request.current = null;
    setMessages([]);
    setText("");
    setPendingQuestion(null);
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = text.trim();

    if (!question || request.current) return;

    const controller = new AbortController();
    request.current = controller;

    const history = messages.slice(-10).map((message) => ({
      role: message.role,
      content: message.content.slice(0, 6000),
    }));

    setText("");
    setError("");
    setPendingQuestion(question);

    try {
      const answer = await askDeveloper(
        developerId,
        question,
        history,
        controller.signal,
      );

      if (request.current !== controller || controller.signal.aborted) {
        return;
      }

      setMessages((current) => [
        ...current,
        { role: "user", content: question },
        { role: "assistant", content: answer },
      ]);
    } catch (err) {
      if (request.current !== controller || controller.signal.aborted) {
        return;
      }

      setText(question);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível obter a resposta.",
      );
    } finally {
      if (request.current === controller) {
        request.current = null;
        setPendingQuestion(null);
      }
    }
  }

  return (
    <aside
      className="dev-chat"
      hidden={!open}
      aria-label={`Chat sobre ${developerName}`}
    >
      <header className="dev-chat-header">
        <div>
          <strong>Chat</strong>
          <small>{developerName}</small>
        </div>

        <div className="dev-chat-actions">
          <button
            type="button"
            className="dev-icon"
            onClick={clearChat}
            title="Limpar conversa"
            aria-label="Limpar conversa"
          >
            <RotateCcw size={17} />
          </button>

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
        {messages.length === 0 && !pendingQuestion && (
          <p className="dev-chat-empty">
            Pergunte sobre as competências de {developerName}, os projetos
            em que participou ou os problemas que solucionou.
          </p>
        )}

        {messages.map((message, index) => (
          <div
            key={`${index}-${message.role}`}
            className={`dev-message dev-message--${message.role}`}
            aria-label={message.role === "user" ? "Você" : "Assistente"}
          >
            {message.content}
          </div>
        ))}

        {pendingQuestion && (
          <>
            <div className="dev-message dev-message--user">
              {pendingQuestion}
            </div>
            <div className="dev-message dev-message--assistant" role="status">
              Consultando as informações do desenvolvedor...
            </div>
          </>
        )}

        <div ref={end} />
      </div>

      {error && <p className="dev-error" role="alert">{error}</p>}

      <form className="dev-chat-form" onSubmit={submit}>
        <textarea
          rows={2}
          maxLength={1500}
          value={text}
          disabled={pendingQuestion !== null}
          onChange={(event) => setText(event.target.value)}
          placeholder="Digite uma mensagem."
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
          disabled={!text.trim() || pendingQuestion !== null}
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