import { useEffect, useState } from "react";

interface Desenvolvedor {
  id: number;
  name: string;
  active: boolean;
}

type Status = "carregando" | "erro" | "sucesso";

function GaleriaDesenvolvedor() {
  const [desenvolvedores, setDesenvolvedores] = useState<Desenvolvedor[]>([]);
  const [status, setStatus] = useState<Status>("carregando");

  useEffect(() => {
    async function carregarDesenvolvedores() {
      try {
        setStatus("carregando");

        const response = await fetch("http://localhost:3000/api/developers-gallery");
        if (!response.ok) throw new Error("Erro ao buscar desenvolvedores.");

        setDesenvolvedores(await response.json());
        setStatus("sucesso");
      } catch (error) {
        console.error("Erro ao carregar desenvolvedores:", error);
        setStatus("erro");
      }
    }

    carregarDesenvolvedores();
  }, []);

  return (
    <section>
      <h2 className="mb-[30px] text-[15px] font-normal text-[#505555]">Novo desenvolvedor</h2>

      {status === "carregando" && (
        <p className="text-[12px] text-[#505555]">Carregando desenvolvedores...</p>
      )}

      {status === "erro" && (
        <p className="text-[12px] text-[#ff641f]">Não foi possível carregar os desenvolvedores.</p>
      )}

      {status === "sucesso" && desenvolvedores.length === 0 && (
        <p className="text-[12px] text-[#505555]">Nenhum desenvolvedor encontrado.</p>
      )}

      <div className="flex flex-wrap gap-[34px]">
        {desenvolvedores.map((desenvolvedor) => (
          <DesenvolvedorCard key={desenvolvedor.id} desenvolvedor={desenvolvedor} />
        ))}
      </div>
    </section>
  );
}

function DesenvolvedorCard({ desenvolvedor }: { desenvolvedor: Desenvolvedor }) {
  return (
    <article className="relative h-[88px] w-[160px]">
      <div className="absolute bottom-0 left-0 h-[75px] w-[160px] rounded-[14px] bg-[#2b2b2b]" />
      <div className="absolute left-0 top-0 h-[40px] w-[131px] rounded-t-[14px] bg-[#2b2b2b]" />
      <div className="absolute right-0 top-[14px] h-[26px] w-[29px] rounded-bl-[14px] bg-[#151919]" />

      <span className="absolute right-[6px] top-[5px] h-[18px] w-[18px]">
        <span className="absolute right-0 top-0 h-[9px] w-[9px] border-r-[2px] border-t-[2px] border-white" />
        <span className="absolute bottom-[2px] left-[1px] h-[2px] w-[15px] origin-left rotate-[-45deg] rounded-full bg-white" />
      </span>

      <span className="absolute left-[15px] top-[19px] max-w-[102px] truncate text-[14px] font-normal text-white">
        {desenvolvedor.name}
      </span>

      <span className="absolute bottom-[10px] left-[15px] text-[11px] font-normal text-[#d6d6d6]">
        {desenvolvedor.active ? "Ativo" : "Inativo"}
      </span>
    </article>
  );
}

export default GaleriaDesenvolvedor;
