import { useEffect, useState } from "react";

type Aba = "conversa" | "desenvolvedores" | "projetos";

interface Projeto {
  id: number;
  name: string;
  status: string;
}

interface Desenvolvedor {
  id: number;
  name: string;
  active: boolean;
}

function Galeria() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>("projetos");

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [desenvolvedores, setDesenvolvedores] = useState<Desenvolvedor[]>(
    []
  );

  const [carregandoProjetos, setCarregandoProjetos] = useState(true);
  const [carregandoDesenvolvedores, setCarregandoDesenvolvedores] =
    useState(true);

  const [erroProjetos, setErroProjetos] = useState(false);
  const [erroDesenvolvedores, setErroDesenvolvedores] = useState(false);

  /* =========================================================
     BUSCAR PROJETOS
  ========================================================== */

  useEffect(() => {
    async function carregarProjetos() {
      try {
        setCarregandoProjetos(true);
        setErroProjetos(false);

        const response = await fetch(
          "http://localhost:3000/api/projects-gallery"
        );

        if (!response.ok) {
          throw new Error("Erro ao buscar projetos.");
        }

        const data: Projeto[] = await response.json();
        setProjetos(data);
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
        setErroProjetos(true);
      } finally {
        setCarregandoProjetos(false);
      }
    }

    carregarProjetos();
  }, []);

  /* =========================================================
     BUSCAR DESENVOLVEDORES
  ========================================================== */

  useEffect(() => {
    async function carregarDesenvolvedores() {
      try {
        setCarregandoDesenvolvedores(true);
        setErroDesenvolvedores(false);

        const response = await fetch(
          "http://localhost:3000/api/developers-gallery"
        );

        if (!response.ok) {
          throw new Error("Erro ao buscar desenvolvedores.");
        }

        const data: Desenvolvedor[] = await response.json();
        setDesenvolvedores(data);
      } catch (error) {
        console.error("Erro ao carregar desenvolvedores:", error);
        setErroDesenvolvedores(true);
      } finally {
        setCarregandoDesenvolvedores(false);
      }
    }

    carregarDesenvolvedores();
  }, []);

  return (
    <main className="min-h-screen bg-[#151919] text-white">
      <section className="relative min-h-screen overflow-hidden bg-[#151919]">

        {/* =====================================================
            ABAS
        ====================================================== */}

        <nav
          className="
            absolute
            left-1/2
            top-[46px]
            flex
            -translate-x-1/2
            items-center
            rounded-[10px]
            border
            border-[#292d2d]
            bg-[#151919]
          "
        >
          {/* CONVERSA */}

          <button
            type="button"
            onClick={() => setAbaAtiva("conversa")}
            className={`
              h-[40px]
              rounded-[9px]
              px-[20px]
              text-[15px]
              font-normal
              transition-colors
              ${
                abaAtiva === "conversa"
                  ? "bg-[#292929] text-[#ff641f]"
                  : "text-[#5a5f5f] hover:text-[#8a8f8f]"
              }
            `}
          >
            Conversa
          </button>

          {/* DESENVOLVEDORES */}

          <button
            type="button"
            onClick={() => setAbaAtiva("desenvolvedores")}
            className={`
              h-[40px]
              px-[20px]
              text-[15px]
              font-normal
              transition-colors
              ${
                abaAtiva === "desenvolvedores"
                  ? "bg-[#292929] text-[#ff641f]"
                  : "text-[#5a5f5f] hover:text-[#8a8f8f]"
              }
            `}
          >
            Desenvolvedores
          </button>

          {/* PROJETOS */}

          <button
            type="button"
            onClick={() => setAbaAtiva("projetos")}
            className={`
              h-[40px]
              rounded-[9px]
              px-[21px]
              text-[15px]
              font-normal
              transition-colors
              ${
                abaAtiva === "projetos"
                  ? "bg-[#292929] text-[#ff641f]"
                  : "text-[#5a5f5f] hover:text-[#8a8f8f]"
              }
            `}
          >
            Projetos
          </button>
        </nav>

        {/* =====================================================
            CONTEÚDO
        ====================================================== */}

        <div className="absolute left-[7.5%] right-[7.5%] top-[61%]">

          {/* ===================================================
              PROJETOS
          ==================================================== */}

          {abaAtiva === "projetos" && (
            <section>
              <h2 className="mb-[30px] text-[15px] font-normal text-[#505555]">
                Novo projeto
              </h2>

              {carregandoProjetos && (
                <p className="text-[12px] text-[#505555]">
                  Carregando projetos...
                </p>
              )}

              {erroProjetos && (
                <p className="text-[12px] text-[#ff641f]">
                  Não foi possível carregar os projetos.
                </p>
              )}

              {!carregandoProjetos &&
                !erroProjetos &&
                projetos.length === 0 && (
                  <p className="text-[12px] text-[#505555]">
                    Nenhum projeto encontrado.
                  </p>
                )}

              <div className="flex flex-wrap gap-[34px]">
                {projetos.map((projeto) => (
                  <ProjetoCard
                    key={projeto.id}
                    projeto={projeto}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ===================================================
              DESENVOLVEDORES
          ==================================================== */}

          {abaAtiva === "desenvolvedores" && (
            <section>
              <h2 className="mb-[30px] text-[15px] font-normal text-[#505555]">
                Novo projeto
              </h2>

              {carregandoDesenvolvedores && (
                <p className="text-[12px] text-[#505555]">
                  Carregando desenvolvedores...
                </p>
              )}

              {erroDesenvolvedores && (
                <p className="text-[12px] text-[#ff641f]">
                  Não foi possível carregar os desenvolvedores.
                </p>
              )}

              {!carregandoDesenvolvedores &&
                !erroDesenvolvedores &&
                desenvolvedores.length === 0 && (
                  <p className="text-[12px] text-[#505555]">
                    Nenhum desenvolvedor encontrado.
                  </p>
                )}

              <div className="flex flex-wrap gap-[34px]">
                {desenvolvedores.map((desenvolvedor) => (
                  <DesenvolvedorCard
                    key={desenvolvedor.id}
                    desenvolvedor={desenvolvedor}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ===================================================
              CONVERSA
          ==================================================== */}

          {abaAtiva === "conversa" && (
            <section>
              <h2 className="mb-[30px] text-[15px] font-normal text-[#505555]">
                Novo projeto
              </h2>

              <div className="flex min-h-[120px] items-center justify-center">
                <p className="text-[14px] text-[#414545]">
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
    <article className="relative h-[88px] w-[160px]">

      {/* Corpo principal */}

      <div
        className="
          absolute
          bottom-0
          left-0
          h-[75px]
          w-[160px]
          rounded-[14px]
          bg-[#2b2b2b]
        "
      />

      {/* Parte superior */}

      <div
        className="
          absolute
          left-0
          top-0
          h-[40px]
          w-[131px]
          rounded-t-[14px]
          bg-[#2b2b2b]
        "
      />

      {/* Recorte superior direito */}

      <div
        className="
          absolute
          right-0
          top-[14px]
          h-[26px]
          w-[29px]
          rounded-bl-[14px]
          bg-[#151919]
        "
      />

      {/* Seta */}

      <span
        className="
          absolute
          right-[6px]
          top-[5px]
          h-[18px]
          w-[18px]
        "
      >
        {/* ponta */}

        <span
          className="
            absolute
            right-0
            top-0
            h-[9px]
            w-[9px]
            border-r-[2px]
            border-t-[2px]
            border-white
          "
        />

        {/* haste */}

        <span
          className="
            absolute
            bottom-[2px]
            left-[1px]
            h-[2px]
            w-[15px]
            rotate-[-45deg]
            origin-left
            rounded-full
            bg-white
          "
        />
      </span>

      {/* Nome */}

      <span
        className="
          absolute
          left-[15px]
          top-[19px]
          max-w-[102px]
          truncate
          text-[14px]
          font-normal
          text-white
        "
      >
        {projeto.name}
      </span>

      {/* Status */}

      <span
        className="
          absolute
          bottom-[10px]
          left-[15px]
          text-[11px]
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
    <article className="relative h-[88px] w-[160px]">

      {/* Corpo principal */}

      <div
        className="
          absolute
          bottom-0
          left-0
          h-[75px]
          w-[160px]
          rounded-[14px]
          bg-[#2b2b2b]
        "
      />

      {/* Parte superior */}

      <div
        className="
          absolute
          left-0
          top-0
          h-[40px]
          w-[131px]
          rounded-t-[14px]
          bg-[#2b2b2b]
        "
      />

      {/* Recorte superior direito */}

      <div
        className="
          absolute
          right-0
          top-[14px]
          h-[26px]
          w-[29px]
          rounded-bl-[14px]
          bg-[#151919]
        "
      />

      {/* Seta */}

      <span
        className="
          absolute
          right-[6px]
          top-[5px]
          h-[18px]
          w-[18px]
        "
      >
        {/* ponta */}

        <span
          className="
            absolute
            right-0
            top-0
            h-[9px]
            w-[9px]
            border-r-[2px]
            border-t-[2px]
            border-white
          "
        />

        {/* haste */}

        <span
          className="
            absolute
            bottom-[2px]
            left-[1px]
            h-[2px]
            w-[15px]
            rotate-[-45deg]
            origin-left
            rounded-full
            bg-white
          "
        />
      </span>

      {/* Nome */}

      <span
        className="
          absolute
          left-[15px]
          top-[19px]
          max-w-[102px]
          truncate
          text-[14px]
          font-normal
          text-white
        "
      >
        {desenvolvedor.name}
      </span>

      {/* Status */}

      <span
        className="
          absolute
          bottom-[10px]
          left-[15px]
          text-[11px]
          font-normal
          text-[#d6d6d6]
        "
      >
        {desenvolvedor.active ? "Ativo" : "Inativo"}
      </span>
    </article>
  );
}

export default Galeria;