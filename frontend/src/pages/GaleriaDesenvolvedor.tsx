import { useEffect, useState, type  FormEvent } from "react";

interface Desenvolvedor {
  id: number;
  name: string;
  active: boolean;
}

type Status = "carregando" | "erro" | "sucesso";

function GaleriaDesenvolvedor() {
  const [desenvolvedores, setDesenvolvedores] = useState<Desenvolvedor[]>([]);
  const [status, setStatus] = useState<Status>("carregando");
  const [modalAberto, setModalAberto] = useState(false);

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

  useEffect(() => {
    carregarDesenvolvedores();
  }, []);

  return (
    <section>
      <button
        type="button"
        onClick={() => setModalAberto(true)}
        className="mb-[30px] block cursor-pointer border-0 bg-transparent p-0 text-[20px] font-normal text-[#3d3f40]"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        Novo desenvolvedor
      </button>

      {status === "carregando" && (
        <p className="text-[12px] text-[#505555]">Carregando desenvolvedores...</p>
      )}

      {status === "erro" && (
        <p className="text-[12px] text-[#ff641f]">Não foi possível carregar os desenvolvedores.</p>
      )}

      {status === "sucesso" && desenvolvedores.length === 0 && (
        <p className="text-[12px] text-[#505555]">Nenhum desenvolvedor encontrado.</p>
      )}

      <div className="flex flex-wrap gap-[20px]">
        {desenvolvedores.map((desenvolvedor) => (
          <DesenvolvedorCard key={desenvolvedor.id} desenvolvedor={desenvolvedor} />
        ))}
      </div>

      {modalAberto && (
        <ModalCadastroDesenvolvedor
          onFechar={() => setModalAberto(false)}
          onCadastrado={() => {
            setModalAberto(false);
            carregarDesenvolvedores();
          }}
        />
      )}
    </section>
  );
}

function DesenvolvedorCard({ desenvolvedor }: { desenvolvedor: Desenvolvedor }) {
  return (
    <article
      className="relative h-[128px] w-[239px] rounded-[18px] bg-[#2b2b2b] px-[24px] pt-[22px] pb-[16px] flex flex-col justify-between transition-colors hover:bg-[#323232]"
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
        {desenvolvedor.name}
      </span>

      <span
        className="flex items-center gap-[6px] text-[10px] font-normal text-white"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        <i
          className={`fi fi-br-${desenvolvedor.active ? "check" : "cross"} text-[9px] ${desenvolvedor.active ? "text-[#5fd068]" : "text-[#ff641f]"}`}
          aria-hidden="true"
        />
        {desenvolvedor.active ? "Ativo" : "Inativo"}
      </span>
    </article>
  );
}

function ModalCadastroDesenvolvedor({
  onFechar,
  onCadastrado,
}: {
  onFechar: () => void;
  onCadastrado: () => void;
}) {
  const [nome, setNome] = useState("");
  // null = nada selecionado ainda -> dropdown mostra "Status"
  const [ativo, setAtivo] = useState<boolean | null>(null);
  const [competencias, setCompetencias] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    if (ativo === null) {
      setErro("Selecione um status.");
      return;
    }

    setEnviando(true);

    try {
      const response = await fetch("http://localhost:3000/api/developers-gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nome,
          active: ativo,
          skills: competencias,
        }),
      });

      if (!response.ok) throw new Error("Erro ao cadastrar desenvolvedor.");

      onCadastrado();
    } catch (error) {
      console.error("Erro ao cadastrar desenvolvedor:", error);
      setErro("Não foi possível cadastrar o desenvolvedor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 lg:p-10"
      onClick={onFechar}
    >
      <form
        onSubmit={handleSalvar}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[884px] overflow-hidden rounded-[20px] bg-[#2d2d2d] pb-[24px]"
        data-node-id="261:2"
        data-name="cadastro desenvolvedor"
      >
        <p
          className="flex items-center justify-center gap-[10px] py-[24px] text-[20px] font-normal text-white"
          style={{ fontFamily: "Poppins, sans-serif" }}
          data-node-id="261:3"
        >
          <i className="fi fi-br-user-add text-[18px] text-[#ed6a32]" aria-hidden="true" />
          Cadastrar Desenvolvedor
        </p>
        <div className="h-px w-full bg-[#3f3f3f]" data-node-id="261:9" />

        <div className="flex flex-col gap-[20px] px-[66px] pt-[24px]">
          <div className="flex gap-[15px]">
            <div className="flex-1">
              <label
                className="mb-[8px] flex items-center gap-[8px] text-[20px] font-normal text-white"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <i className="fi fi-br-user text-[16px] text-[#9a9a9a]" aria-hidden="true" />
                Nome
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome"
                className="h-[48px] w-full rounded-[10px] bg-[#3f3f3f] px-[18px] text-[16px] text-white placeholder-[#9a9a9a] outline-none"
                style={{ fontFamily: "Poppins, sans-serif" }}
                data-node-id="261:11"
              />
            </div>

            <div className="w-[195px]">
              <label
                className="mb-[8px] flex items-center gap-[8px] text-[20px] font-normal text-white"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <i className="fi fi-br-toggle-on text-[16px] text-[#9a9a9a]" aria-hidden="true" />
                Status
              </label>
              <div className="relative">
                <select
                  value={ativo === null ? "" : ativo ? "ativo" : "inativo"}
                  onChange={(e) =>
                    setAtivo(e.target.value === "" ? null : e.target.value === "ativo")
                  }
                  className="h-[48px] w-full appearance-none rounded-[10px] bg-[#3f3f3f] px-[18px] pr-[36px] text-[16px] text-white outline-none"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                  data-node-id="261:13"
                >
                  <option value="" disabled>
                    Status
                  </option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
                <svg
                  className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label
              className="mb-[8px] flex items-center gap-[8px] text-[20px] font-normal text-white"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <i className="fi fi-br-file-code text-[16px] text-[#9a9a9a]" aria-hidden="true" />
              Competências Técnicas
            </label>
            <textarea
              value={competencias}
              onChange={(e) => setCompetencias(e.target.value)}
              placeholder="Competências Técnicas"
              className="h-[193px] w-full resize-none rounded-[10px] bg-[#3f3f3f] px-[24px] py-[16px] text-[16px] text-white placeholder-[#9a9a9a] outline-none"
              style={{ fontFamily: "Poppins, sans-serif" }}
              data-node-id="261:12"
            />
          </div>

          {erro && <p className="text-[12px] text-[#ff641f]">{erro}</p>}

          <div className="mt-[10px] flex items-center justify-between">
            <button
              type="button"
              onClick={onFechar}
              className="flex h-[48px] w-[171px] items-center justify-center gap-[8px] rounded-[10px] bg-[#3f3f3f] text-center text-[20px] leading-none text-white"
              style={{ fontFamily: "Poppins, sans-serif" }}
              data-node-id="261:5"
            >
              <i className="fi fi-br-arrow-left text-[15px] leading-none" aria-hidden="true" />
              <span>Voltar</span>
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex h-[48px] w-[171px] items-center justify-center gap-[8px] rounded-[10px] bg-[#ed6a32] text-center text-[20px] leading-none text-white disabled:opacity-60"
              style={{ fontFamily: "Poppins, sans-serif" }}
              data-node-id="261:4"
            >
              <i className="fi fi-br-check text-[15px] leading-none" aria-hidden="true" />
              <span>{enviando ? "Salvando..." : "Salvar"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default GaleriaDesenvolvedor;
