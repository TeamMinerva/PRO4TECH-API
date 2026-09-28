import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { History, Link2, X, ArrowUp } from "lucide-react";

type Aba = "conversa" | "desenvolvedores" | "projetos";

const ABAS: { id: Aba; label: string; path: string }[] = [
  { id: "conversa", label: "Conversa", path: "/home" },
  { id: "desenvolvedores", label: "Desenvolvedores", path: "/desenvolvedores" },
  { id: "projetos", label: "Projetos", path: "/projetos" },
];

export default function Home() {
  const navigate = useNavigate();
  const abaAtiva: Aba = "conversa";
  const [mensagem, setMensagem] = useState("");
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [linksAberto, setLinksAberto] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");
  }

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
              className="shrink-0 text-[#5a5f5f] transition-colors hover:text-white"
            >
              <Link2 size={22} strokeWidth={1.5} className="sm:size-6" />
            </button>
          )}
        </header>

        <main className="flex flex-1 flex-col items-center justify-center">
          <p
            className="text-center font-normal leading-none text-white text-[22px] sm:text-[30px] md:text-[38px] lg:text-[44px]"
            style={{ fontFamily: "Outfit, sans-serif" }}
            data-node-id="29:92"
          >
            começe por aqui.
          </p>
        </main>

        <form onSubmit={handleSubmit} data-node-id="29:95">
          <div className="flex h-[52px] items-center justify-between rounded-[12px] border border-[#2d2d2d] px-4 sm:h-[60px] sm:rounded-[14px] sm:px-5 lg:h-[68px]">
            <input
              type="text"
              placeholder="Digite uma mensagem."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full bg-transparent border-0 p-0 m-0 text-[14px] text-white placeholder-[#3d3f40] outline-none sm:text-[16px] lg:text-[17px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
              data-node-id="32:98"
            />
            <button
              type="submit"
              aria-label="Enviar mensagem"
              disabled={!mensagem.trim()}
              className="flex size-[26px] shrink-0 items-center justify-center text-[#3d3f40] transition-colors hover:text-[#ED6A32] disabled:opacity-50 sm:size-[30px]"
            >
              <ArrowUp size={18} className="sm:size-[19px]" />
            </button>
          </div>
        </form>
      </div>

      <aside
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
          <p
            className="px-6 text-[15px] text-[#3d3f40]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Nenhum link de referência ainda.
          </p>
        </div>
      </aside>
    </div>
  );
}
