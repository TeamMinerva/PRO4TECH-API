import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { History, Link2, X, ArrowUp } from "lucide-react";
import { useGeneralChat } from "../hooks/useGeneralChat";
import { MensagemMarkdown } from "../components/MensagemMarkdown";
import type { FonteChat } from "../services/generalChatService";

type Aba = "conversa" | "desenvolvedores" | "projetos";

const ABAS: { id: Aba; label: string; path: string }[] = [
  { id: "conversa", label: "Conversa", path: "/home" },
  { id: "desenvolvedores", label: "Desenvolvedores", path: "/desenvolvedores" },
  { id: "projetos", label: "Projetos", path: "/projetos" },
];

const TAMANHO_MAXIMO = 8000;

export default function Home() {
  const navigate = useNavigate();
  const abaAtiva: Aba = "conversa";
  const [mensagem, setMensagem] = useState("");
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [linksAberto, setLinksAberto] = useState(false);

  const {
    mensagens,
    fontes,
    enviando,
    erro,
    enviarMensagem,
    tentarNovamente,
  } = useGeneralChat();

  const fimDaLista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, enviando, erro]);

  function enviar(conteudo: string) {
    if (!conteudo.trim() || enviando) return;
    enviarMensagem(conteudo);
    setMensagem("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    enviar(mensagem);
  }

  function abrirFonte(fonte: FonteChat) {
    if (fonte.type === "project" && fonte.entity_id) {
      navigate(`/projetos/${fonte.entity_id}`);
      return;
    }
    if (fonte.type === "developer") {
      navigate("/desenvolvedores");
      return;
    }
  }

  function rotuloTipoFonte(tipo: FonteChat["type"]): string {
    if (tipo === "project") return "Projeto";
    if (tipo === "developer") return "Desenvolvedor";
    return "Documento";
  }

  const vazio = mensagens.length === 0;
  const podeEnviar = mensagem.trim().length > 0 && !enviando;

  return (
    <div
      className="bg-[#191b1c] w-full h-screen overflow-hidden relative flex items-stretch p-6 gap-4 lg:py-10 lg:pl-[50px] lg:pr-[50px]"
      data-node-id="17:83"
      data-name="inicial"
    >
      <aside
        className={`shrink-0 overflow-hidden rounded-[16px] bg-[#141617] transition-[width] duration-300 ${
          historicoAberto ? "w-[280px] sm:w-[320px]" : "w-0"
        }`}
      >
        <div className="flex h-full w-[280px] flex-col sm:w-[320px]">
          <div className="flex items-center justify-between px-6 py-6">
            <p
              className="text-[20px] text-white"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Histórico
            </p>
            <button
              type="button"
              onClick={() => setHistoricoAberto(false)}
              aria-label="Fechar histórico"
              className="text-[#5a5f5f] transition-colors hover:text-white"
            >
              <X size={22} />
            </button>
          </div>
          <p
            className="px-6 text-[15px] text-[#3d3f40]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Nenhuma conversa ainda.
          </p>
        </div>
      </aside>

      <div className="mx-auto flex h-full w-full max-w-[960px] min-w-0 flex-col lg:h-auto lg:max-h-[calc(100vh-80px)] lg:aspect-[1280/832]">
        <header className="relative z-10 flex items-center justify-between gap-4">
          {historicoAberto ? (
            <div className="size-[22px] shrink-0 sm:size-6" />
          ) : (
            <button
              type="button"
              onClick={() => setHistoricoAberto(true)}
              aria-label="Histórico de conversas"
              className="shrink-0 text-[#5a5f5f] transition-colors hover:text-white"
            >
              <History size={22} strokeWidth={1.5} className="sm:size-6" />
            </button>
          )}

          <nav className="flex items-center rounded-[12px] border border-[#2d2d2d] sm:rounded-[15px]">
            {ABAS.map(({ id, label, path }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(path)}
                className={`h-[34px] whitespace-nowrap px-3 text-[13px] font-normal transition-colors rounded-[10px] sm:h-[38px] sm:px-4 sm:text-[14px] sm:rounded-[12px] lg:h-[40px] lg:px-5 lg:text-[15px] ${
                  abaAtiva === id
                    ? "bg-[#2d2d2d] text-[#ed6a32]"
                    : "text-[#3d3f40] hover:text-[#8a8f8f]"
                }`}
                style={{ fontFamily: "Poppins, sans-serif" }}
                data-node-id="48:10"
              >
                {label}
              </button>
            ))}
          </nav>

          {linksAberto ? (
            <div className="size-[22px] shrink-0 sm:size-6" />
          ) : (
            <button
              type="button"
              onClick={() => setLinksAberto(true)}
              aria-label="Links de referência"
              className="relative shrink-0 text-[#5a5f5f] transition-colors hover:text-white"
            >
              <Link2 size={22} strokeWidth={1.5} className="sm:size-6" />
              {fontes.length > 0 && (
                <span
                  aria-label={`${fontes.length} fontes utilizadas`}
                  className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#ED6A32] text-[10px] font-medium text-white"
                >
                  {fontes.length}
                </span>
              )}
            </button>
          )}
        </header>

        <main
          role={vazio ? undefined : "log"}
          aria-live={vazio ? undefined : "polite"}
          className={`my-4 flex min-h-0 flex-1 flex-col ${
            vazio
              ? "items-center justify-center gap-6"
              : "overflow-y-auto pr-1"
          }`}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {vazio ? (
            <p
              className="text-center font-normal leading-none text-white text-[22px] sm:text-[30px] md:text-[38px] lg:text-[44px]"
              style={{ fontFamily: "Outfit, sans-serif" }}
              data-node-id="29:92"
            >
              começe por aqui.
            </p>
          ) : (
            <div className="mt-auto flex flex-col gap-4 py-2">
              {mensagens.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[85%] break-words rounded-[14px] px-4 py-3 text-[14px] leading-relaxed text-white ${
                    msg.role === "user"
                      ? "self-end whitespace-pre-wrap bg-[#3f3f3f]"
                      : "min-w-0 self-start bg-[#2d2d2d]"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <>
                      <MensagemMarkdown conteudo={msg.content} />
                      {msg.fontes && msg.fontes.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#3f3f3f] pt-2.5 text-[12px]">
                          <span className="text-[#8a8f8f]">
                            Contexto utilizado:
                          </span>
                          {msg.fontes.map((fonte) => {
                            const clicavel =
                              (fonte.type === "project" && !!fonte.entity_id) ||
                              fonte.type === "developer";
                            return (
                              <button
                                key={fonte.id}
                                type="button"
                                disabled={!clicavel}
                                onClick={() => abrirFonte(fonte)}
                                className={`rounded-[8px] border border-[#3f3f3f] bg-[#191b1c] px-2.5 py-1 text-[#d6d6d6] transition-colors ${
                                  clicavel
                                    ? "hover:border-[#ED6A32] hover:text-[#ED6A32]"
                                    : "cursor-default"
                                }`}
                              >
                                <span className="text-[#8a8f8f]">
                                  {rotuloTipoFonte(fonte.type)}:
                                </span>{" "}
                                {fonte.title}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    msg.content
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
          )}
        </main>

        <form onSubmit={handleSubmit} data-node-id="29:95">
          <div className="flex h-[52px] items-center justify-between rounded-[12px] border border-[#2d2d2d] px-4 focus-within:border-[#3f3f3f] sm:h-[60px] sm:rounded-[14px] sm:px-5 lg:h-[68px]">
            <input
              type="text"
              placeholder="Pergunte sobre projetos, desenvolvedores, épicos, PBIs ou bugs..."
              aria-label="Digite uma mensagem."
              maxLength={TAMANHO_MAXIMO}
              disabled={enviando}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full bg-transparent border-0 p-0 m-0 text-[14px] text-white placeholder-[#3d3f40] outline-none disabled:opacity-60 sm:text-[16px] lg:text-[17px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
              data-node-id="32:98"
            />
            <button
              type="submit"
              aria-label="Enviar mensagem"
              disabled={!podeEnviar}
              className={`flex size-[26px] shrink-0 items-center justify-center transition-colors sm:size-[30px] ${
                podeEnviar
                  ? "text-[#ED6A32] hover:text-[#ff8555]"
                  : "cursor-not-allowed text-[#3d3f40] disabled:opacity-50"
              }`}
            >
              <ArrowUp size={18} className="sm:size-[19px]" />
            </button>
          </div>
        </form>
      </div>

      <aside
        inert={!linksAberto}
        className={`shrink-0 overflow-hidden rounded-[16px] bg-[#141617] transition-[width] duration-300 ${
          linksAberto ? "w-[280px] sm:w-[320px]" : "w-0"
        }`}
      >
        <div className="flex h-full w-[280px] flex-col sm:w-[320px]">
          <div className="flex items-center justify-between px-6 py-6">
            <p
              className="text-[20px] text-white"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Fontes
            </p>
            <button
              type="button"
              onClick={() => setLinksAberto(false)}
              aria-label="Fechar fontes"
              className="text-[#5a5f5f] transition-colors hover:text-white"
            >
              <X size={22} />
            </button>
          </div>
          {fontes.length === 0 ? (
            <p
              className="px-6 text-[15px] text-[#3d3f40]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Nenhum link de referência ainda.
            </p>
          ) : (
            <div
              className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-6 pb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {fontes.map((fonte) => {
                const clicavel =
                  (fonte.type === "project" && !!fonte.entity_id) ||
                  fonte.type === "developer";
                return (
                  <button
                    key={fonte.id}
                    type="button"
                    disabled={!clicavel}
                    onClick={() => abrirFonte(fonte)}
                    className={`flex flex-col items-start gap-0.5 rounded-[12px] border border-[#2d2d2d] bg-[#191b1c] px-4 py-3 text-left transition-colors ${
                      clicavel
                        ? "hover:border-[#ED6A32] hover:text-white"
                        : "cursor-default"
                    }`}
                  >
                    <span className="text-[11px] uppercase tracking-wider text-[#ED6A32]">
                      {rotuloTipoFonte(fonte.type)}
                    </span>
                    <span className="text-[14px] text-[#d6d6d6] break-words">
                      {fonte.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
