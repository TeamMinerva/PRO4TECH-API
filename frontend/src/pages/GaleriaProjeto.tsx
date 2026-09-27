import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Projeto {
  id: number;
  name: string;
  status: string;
}

type Status = "carregando" | "erro" | "sucesso";

function GaleriaProjeto() {
  const navigate = useNavigate();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [status, setStatus] = useState<Status>("carregando");

  useEffect(() => {
    async function carregarProjetos() {
      try {
        setStatus("carregando");

        const response = await fetch("http://localhost:3000/api/projects-gallery");
        if (!response.ok) throw new Error("Erro ao buscar projetos.");

        setProjetos(await response.json());
        setStatus("sucesso");
      } catch (error) {
        console.error("Erro ao carregar projetos:", error);
        setStatus("erro");
      }
    }

    carregarProjetos();
  }, []);

  return (
    <section>
      <button
        type="button"
        onClick={() => navigate("/cadastro-projeto")}
        className="mb-[30px] block cursor-pointer border-0 bg-transparent p-0 text-[20px] font-normal text-[#3d3f40]"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        Novo projeto
      </button>

      {status === "carregando" && (
        <p className="text-[12px] text-[#505555]">Carregando projetos...</p>
      )}

      {status === "erro" && (
        <p className="text-[12px] text-[#ff641f]">Não foi possível carregar os projetos.</p>
      )}

      {status === "sucesso" && projetos.length === 0 && (
        <p className="text-[12px] text-[#505555]">Nenhum projeto encontrado.</p>
      )}

      <div className="flex flex-wrap gap-[20px]">
        {projetos.map((projeto) => (
          <ProjetoCard key={projeto.id} projeto={projeto} />
        ))}
      </div>
    </section>
  );
}

function ProjetoCard({ projeto }: { projeto: Projeto }) {
  return (
    <article
      className="relative h-[128px] w-[239px] rounded-[18px] bg-[#141617] px-[24px] pt-[22px] pb-[16px] flex flex-col justify-between transition-colors hover:bg-[#1c1e1f]"
      data-node-id="248:85"
    >
      <i
        className="fi fi-br-folder absolute left-[24px] top-[22px] text-[22px] text-[#ed6a32]"
        aria-hidden="true"
      />

      <i
        className="fi fi-br-arrow-up-right absolute right-[20px] top-[20px] text-[16px] text-white"
        aria-hidden="true"
      />

      <span
        className="mt-[26px] max-w-[190px] truncate text-[20px] font-normal text-white"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        {projeto.name}
      </span>

      <span
        className="flex items-center gap-[6px] text-[10px] font-normal text-white"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {projeto.status}
      </span>
    </article>
  );
}

export default GaleriaProjeto;
