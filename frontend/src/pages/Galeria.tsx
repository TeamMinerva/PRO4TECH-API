import { useState } from "react";

type Aba = "conversa" | "desenvolvedores" | "projetos";

interface Projeto {
  id: number;
  nome: string;
  status: string;
}

interface Desenvolvedor {
  id: number;
  nome: string;
}

// Dados temporários apenas para visualização.
// Depois vamos substituir pelos dados da API.
const projetosMock: Projeto[] = [
  {
    id: 1,
    nome: "Nome",
    status: "Em andamento",
  },
  {
    id: 2,
    nome: "Nome",
    status: "Em andamento",
  },
  {
    id: 3,
    nome: "Nome",
    status: "Em andamento",
  },
];

const desenvolvedoresMock: Desenvolvedor[] = [
  {
    id: 1,
    nome: "Nome",
  },
  {
    id: 2,
    nome: "Nome",
  },
  {
    id: 3,
    nome: "Nome",
  },
];

function Galeria() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>("projetos");

  return (
    <main className="min-h-screen bg-[#151919] text-white">
      {/* Área principal da galeria */}
      <section className="relative min-h-screen overflow-hidden bg-[#151919]">
        {/* =========================
            ABAS
        ========================== */}
        <nav
          className="
            absolute
            left-1/2
            top-[46px]
            flex
            -translate-x-1/2
            items-center
            rounded-[9px]
            border
            border-[#292d2d]
            bg-[#151919]
          "
        >
          {/* =========================
              CONVERSA
          ========================== */}
          <button
            type="button"
            onClick={() => setAbaAtiva("conversa")}
            className={`
              h-[30px]
              rounded-[8px]
              px-[13px]
              text-[12px]
              font-normal
              transition-colors
              ${
                abaAtiva === "conversa"
                  ? "bg-[#292929] text-[#ff641f]"
                  : "text-[#414545] hover:text-[#777777]"
              }
            `}
          >
            Conversa
          </button>

          {/* =========================
              DESENVOLVEDORES
          ========================== */}
          <button
            type="button"
            onClick={() => setAbaAtiva("desenvolvedores")}
            className={`
              h-[30px]
              px-[13px]
              text-[12px]
              font-normal
              transition-colors
              ${
                abaAtiva === "desenvolvedores"
                  ? "bg-[#292929] text-[#ff641f]"
                  : "text-[#414545] hover:text-[#777777]"
              }
            `}
          >
            Desenvolvedores
          </button>

          {/* =========================
              PROJETOS
          ========================== */}
          <button
            type="button"
            onClick={() => setAbaAtiva("projetos")}
            className={`
              h-[30px]
              rounded-[8px]
              px-[14px]
              text-[12px]
              font-normal
              transition-colors
              ${
                abaAtiva === "projetos"
                  ? "bg-[#292929] text-[#ff641f]"
                  : "text-[#414545] hover:text-[#777777]"
              }
            `}
          >
            Projetos
          </button>
        </nav>

        {/* =========================
            CONTEÚDO
        ========================== */}
        <div className="absolute left-[7.5%] right-[7.5%] top-[61%]">
          {/* =========================
              PROJETOS
          ========================== */}
          {abaAtiva === "projetos" && (
            <section>
              <h2 className="mb-[25px] text-[13px] font-normal text-[#505555]">
                Novo projeto
              </h2>

              <div className="flex flex-wrap gap-[50px]">
                {projetosMock.map((projeto) => (
                  <ProjetoCard
                    key={projeto.id}
                    projeto={projeto}
                  />
                ))}
              </div>
            </section>
          )}

          {/* =========================
              DESENVOLVEDORES
          ========================== */}
          {abaAtiva === "desenvolvedores" && (
            <section>
              <h2 className="mb-[25px] text-[13px] font-normal text-[#505555]">
                Novo projeto
              </h2>

              <div className="flex flex-wrap gap-[50px]">
                {desenvolvedoresMock.map((desenvolvedor) => (
                  <DesenvolvedorCard
                    key={desenvolvedor.id}
                    desenvolvedor={desenvolvedor}
                  />
                ))}
              </div>
            </section>
          )}

          {/* =========================
              CONVERSA
          ========================== */}
          {abaAtiva === "conversa" && (
            <section>
              <h2 className="mb-[25px] text-[13px] font-normal text-[#505555]">
                Novo projeto
              </h2>

              <div className="flex min-h-[100px] items-center justify-center">
                <p className="text-[13px] text-[#414545]">
                  Área de conversa
                </p>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   CARD DE PROJETO
========================================================= */

interface ProjetoCardProps {
  projeto: Projeto;
}

function ProjetoCard({ projeto }: ProjetoCardProps) {
  return (
    <article className="relative h-[60px] w-[106px]">
      {/* Corpo do card */}
      <div
        className="
          absolute
          bottom-0
          left-0
          h-[51px]
          w-[106px]
          rounded-[11px]
          bg-[#2b2b2b]
        "
      />

      {/* Parte superior do card */}
      <div
        className="
          absolute
          left-0
          top-0
          h-[27px]
          w-[87px]
          rounded-t-[11px]
          bg-[#2b2b2b]
        "
      />

      {/* Recorte da seta */}
      <div
        className="
          absolute
          right-0
          top-[10px]
          h-[18px]
          w-[19px]
          rounded-bl-[10px]
          bg-[#151919]
        "
      />

      {/* Seta preta */}
      <span
        className="
          absolute
          right-[4px]
          top-[2px]
          text-[11px]
          font-normal
          leading-none
          text-black
        "
      >
        ↗
      </span>

      {/* Nome */}
      <span
        className="
          absolute
          left-[11px]
          top-[14px]
          max-w-[65px]
          truncate
          text-[10px]
          font-normal
          text-white
        "
      >
        {projeto.nome}
      </span>

      {/* Status */}
      <span
        className="
          absolute
          bottom-[7px]
          left-[11px]
          text-[7px]
          font-normal
          text-[#d6d6d6]
        "
      >
        {projeto.status}
      </span>
    </article>
  );
}

/* =========================================================
   CARD DE DESENVOLVEDOR
========================================================= */

interface DesenvolvedorCardProps {
  desenvolvedor: Desenvolvedor;
}

function DesenvolvedorCard({
  desenvolvedor,
}: DesenvolvedorCardProps) {
  return (
    <article className="relative h-[60px] w-[106px]">
      {/* Corpo */}
      <div
        className="
          absolute
          bottom-0
          left-0
          h-[51px]
          w-[106px]
          rounded-[11px]
          bg-[#2b2b2b]
        "
      />

      {/* Parte superior */}
      <div
        className="
          absolute
          left-0
          top-0
          h-[27px]
          w-[87px]
          rounded-t-[11px]
          bg-[#2b2b2b]
        "
      />

      {/* Recorte da seta */}
      <div
        className="
          absolute
          right-0
          top-[10px]
          h-[18px]
          w-[19px]
          rounded-bl-[10px]
          bg-[#151919]
        "
      />

      {/* Seta preta */}
      <span
        className="
          absolute
          right-[4px]
          top-[2px]
          text-[11px]
          font-normal
          leading-none
          text-black
        "
      >
        ↗
      </span>

      {/* Nome */}
      <span
        className="
          absolute
          left-[11px]
          top-[14px]
          max-w-[65px]
          truncate
          text-[10px]
          font-normal
          text-white
        "
      >
        {desenvolvedor.nome}
      </span>

      {/* Informação secundária */}
      <span
        className="
          absolute
          bottom-[7px]
          left-[11px]
          text-[7px]
          font-normal
          text-[#d6d6d6]
        "
      >
        Desenvolvedor
      </span>
    </article>
  );
}

export default Galeria;