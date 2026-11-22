import { LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import GaleriaDesenvolvedor from "./GaleriaDesenvolvedor";
import GaleriaProjeto from "./GaleriaProjeto";

type Aba = "conversa" | "desenvolvedores" | "projetos";

const ABAS: { id: Aba; label: string; path: string }[] = [
  { id: "conversa", label: "Conversa", path: "/home" },
  { id: "desenvolvedores", label: "Desenvolvedores", path: "/desenvolvedores" },
  { id: "projetos", label: "Projetos", path: "/projetos" },
];

function Galeria() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const abaAtiva: Aba = pathname === "/desenvolvedores" ? "desenvolvedores" : "projetos";

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <main className="min-h-screen bg-[#191b1c] text-white">
      <section className="relative min-h-screen overflow-hidden bg-[#191b1c] p-6 lg:py-10 lg:pl-[50px] lg:pr-[50px]">
        <div className="mx-auto flex w-full max-w-[960px] items-center justify-between gap-4">
          <div className="size-[20px] shrink-0 sm:size-[22px]" aria-hidden="true" />
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
              >
                {label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sair"
            title="Sair"
            className="shrink-0 text-[#5a5f5f] transition-colors hover:text-[#ED6A32]"
          >
            <LogOut size={20} strokeWidth={1.5} className="sm:size-[22px]" />
          </button>
        </div>

        <div className="absolute left-[7.5%] right-[7.5%] top-[25%]">
          {abaAtiva === "projetos" && <GaleriaProjeto />}
          {abaAtiva === "desenvolvedores" && <GaleriaDesenvolvedor />}
        </div>
      </section>
    </main>
  );
}

export default Galeria;
