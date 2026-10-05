import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import { STATUS_OPCOES } from "../hooks/useProjeto";

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
        className="mb-[30px] block cursor-pointer border-0 bg-transparent p-0 text-[20px] font-normal text-[#3d3f40] transition-colors hover:text-[#ed6a32]"
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

const COR_STATUS: Record<string, string> = {
  PLANNED: "bg-[#9a9a9a]",
  IN_PROGRESS: "bg-[#ed6a32]",
  DONE: "bg-[#5fd068]",
};

function ProjetoCard({ projeto }: { projeto: Projeto }) {
  const labelStatus =
    STATUS_OPCOES.find((opcao) => opcao.valor === projeto.status)?.label ?? projeto.status;

  return (
    <article
      className="group flex w-[260px] items-center gap-[12px] rounded-[12px] bg-[#141617] px-[16px] py-[12px] transition-colors hover:bg-[#1c1e1f]"
      data-node-id="248:85"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <span
          className="truncate text-[18px] font-normal text-white"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {projeto.name}
        </span>

        <span
          className="flex items-center gap-[6px] text-[11px] font-normal text-[#9a9a9a]"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <span
            className={`h-[7px] w-[7px] rounded-full ${COR_STATUS[projeto.status] ?? "bg-[#9a9a9a]"}`}
            aria-hidden="true"
          />
          {labelStatus}
        </span>
      </div>

      {/* TODO: navegar para a página de detalhes do projeto */}
      <button
        type="button"
        aria-label={`Ver detalhes de ${projeto.name}`}
        title="Ver detalhes"
        className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[#505555] transition-colors group-hover:text-[#ed6a32]"
      >
        <FolderKanban size={18} strokeWidth={1.5} />
      </button>
    </article>
  );
}

export default GaleriaProjeto;
