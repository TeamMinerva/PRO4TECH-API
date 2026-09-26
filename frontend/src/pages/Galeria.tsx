import { useState } from "react";
import GaleriaDesenvolvedor from "./GaleriaDesenvolvedor";
import GaleriaProjeto from "./GaleriaProjeto";

type Aba = "conversa" | "desenvolvedores" | "projetos";

const ABAS: { id: Aba; label: string; className: string }[] = [
  { id: "conversa", label: "Conversa", className: "rounded-[9px] px-[20px]" },
  { id: "desenvolvedores", label: "Desenvolvedores", className: "px-[20px]" },
  { id: "projetos", label: "Projetos", className: "rounded-[9px] px-[21px]" },
];

function Galeria() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>("projetos");

  return (
    <main className="min-h-screen bg-[#151919] text-white">
      <section className="relative min-h-screen overflow-hidden bg-[#151919]">
        <nav className="absolute left-1/2 top-[46px] flex -translate-x-1/2 items-center rounded-[10px] border border-[#292d2d] bg-[#151919]">
          {ABAS.map(({ id, label, className }) => (
            <button
              key={id}
              type="button"
              onClick={() => setAbaAtiva(id)}
              className={`h-[40px] text-[15px] font-normal transition-colors ${className} ${
                abaAtiva === id
                  ? "bg-[#292929] text-[#ff641f]"
                  : "text-[#5a5f5f] hover:text-[#8a8f8f]"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="absolute left-[7.5%] right-[7.5%] top-[61%]">
          {abaAtiva === "projetos" && <GaleriaProjeto />}
          {abaAtiva === "desenvolvedores" && <GaleriaDesenvolvedor />}

          {abaAtiva === "conversa" && (
            <section>
              <h2 className="mb-[30px] text-[15px] font-normal text-[#505555]">Novo projeto</h2>

              <div className="flex min-h-[120px] items-center justify-center">
                <p className="text-[14px] text-[#414545]">Área de conversa</p>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

export default Galeria;
