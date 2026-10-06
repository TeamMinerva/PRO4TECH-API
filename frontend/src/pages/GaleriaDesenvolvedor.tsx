import { useEffect, useState, type FormEvent } from "react";
import { IdCard, X } from "lucide-react";
import {
  getDevelopersGallery,
  createDeveloper,
  type Developer,
} from "../services/developerService";
import { useDropdown } from "../hooks/useDropdown";
import { useTecnologias } from "../hooks/useTecnologias";
import { PainelTecnologias } from "../components/PainelTecnologias";
import { SetaDropdown } from "../components/SetaDropdown";
import { TagRemovivel } from "../components/TagRemovivel";

type Desenvolvedor = Developer;

type Status = "carregando" | "erro" | "sucesso";

function GaleriaDesenvolvedor() {
  const [desenvolvedores, setDesenvolvedores] = useState<Desenvolvedor[]>([]);
  const [status, setStatus] = useState<Status>("carregando");
  const [modalAberto, setModalAberto] = useState(false);

  async function carregarDesenvolvedores() {
    try {
      setStatus("carregando");
      const data = await getDevelopersGallery();
      setDesenvolvedores(data);
      setStatus("sucesso");
    } catch (error) {
      console.error("Erro ao carregar desenvolvedores:", error);
      setStatus("erro");
    }
  }

  useEffect(() => {
    let ativo = true;

    getDevelopersGallery()
      .then((data) => {
        if (ativo) {
          setDesenvolvedores(data);
          setStatus("sucesso");
        }
      })
      .catch((error) => {
        if (ativo) {
          console.error("Erro ao carregar desenvolvedores:", error);
          setStatus("erro");
        }
      });

    return () => {
      ativo = false;
    };
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
      className="group flex w-[260px] items-center gap-[12px] rounded-[12px] bg-[#141617] px-[16px] py-[12px] transition-colors hover:bg-[#1c1e1f]"
      data-node-id="248:85"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <span
          className="truncate text-[18px] font-normal text-white"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          {desenvolvedor.name}
        </span>

        <span
          className="flex items-center gap-[6px] text-[11px] font-normal text-[#9a9a9a]"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <span
            className={`h-[7px] w-[7px] rounded-full ${desenvolvedor.active ? "bg-[#5fd068]" : "bg-[#ff641f]"}`}
            aria-hidden="true"
          />
          {desenvolvedor.active ? "Ativo" : "Inativo"}
        </span>
      </div>

      {/* TODO: navegar para a página de detalhes do desenvolvedor */}
      <button
        type="button"
        aria-label={`Ver detalhes de ${desenvolvedor.name}`}
        title="Ver detalhes"
        className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[#505555] transition-colors group-hover:text-[#ed6a32]"
      >
        <IdCard size={18} strokeWidth={1.5} />
      </button>
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
  const [tecnologiaIds, setTecnologiaIds] = useState<number[]>([]);
  const gerenciadorTecnologias = useTecnologias();
  const { tecnologias, carregando: carregandoTecnologias } = gerenciadorTecnologias;
  const { aberto: techAberto, setAberto: setTechAberto, ref: techRef } = useDropdown();

  function alternarTecnologia(id: number) {
    setTecnologiaIds((atuais) =>
      atuais.includes(id) ? atuais.filter((t) => t !== id) : [...atuais, id]
    );
  }
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    if (ativo === null) {
      setErro("Selecione um status.");
      return;
    }

    if (tecnologiaIds.length === 0) {
      setErro("Selecione ao menos uma tecnologia.");
      return;
    }

    setEnviando(true);

    try {
      await createDeveloper({
        name: nome,
        active: ativo,
        technologyIds: tecnologiaIds,
      });

      setNome("");
      setAtivo(null);
      setTecnologiaIds([]);
      setErro(null);

      onCadastrado();
    } catch (error: unknown) {
      console.error("Erro ao cadastrar desenvolvedor:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o desenvolvedor.";
      setErro(message);
    } finally {
      setEnviando(false);
    }
  }

  const statusOpcaoClasse = (selecionado: boolean) =>
    `h-[36px] flex-1 rounded-[8px] border text-[13px] transition-colors ${
      selecionado
        ? "border-[#ed6a32] bg-[#ed6a32]/10 text-[#ed6a32]"
        : "border-[#2a2c2d] text-[#9a9a9a] hover:border-[#3f3f3f] hover:text-white"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={onFechar}
    >
      <form
        onSubmit={handleSalvar}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[400px] rounded-[14px] bg-[#141617] p-[24px]"
      >
        <div className="mb-[20px] flex items-center justify-between">
          <h2
            className="text-[16px] font-medium text-white"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Novo desenvolvedor
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="cursor-pointer border-0 bg-transparent p-0 text-[#9a9a9a] transition-colors hover:text-white"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col gap-[16px]">
          <div>
            <label
              className="mb-[6px] block text-[12px] text-[#9a9a9a]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Nome
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do desenvolvedor"
              className="h-[40px] w-full rounded-[8px] border border-[#2a2c2d] bg-[#1c1e1f] px-[14px] text-[14px] text-white placeholder-[#6b6b6b] outline-none focus:border-[#ed6a32]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
          </div>

          <div>
            <label
              className="mb-[6px] block text-[12px] text-[#9a9a9a]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Status
            </label>
            <div className="flex gap-[8px]" style={{ fontFamily: "Poppins, sans-serif" }}>
              <button
                type="button"
                onClick={() => setAtivo(true)}
                className={statusOpcaoClasse(ativo === true)}
              >
                Ativo
              </button>
              <button
                type="button"
                onClick={() => setAtivo(false)}
                className={statusOpcaoClasse(ativo === false)}
              >
                Inativo
              </button>
            </div>
          </div>

          <div>
            <label
              className="mb-[6px] block text-[12px] text-[#9a9a9a]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Tecnologias
            </label>
            <div className="relative" ref={techRef}>
              <button
                type="button"
                onClick={() => setTechAberto(!techAberto)}
                className="flex h-[40px] w-full cursor-pointer items-center justify-between rounded-[8px] border border-[#2a2c2d] bg-[#1c1e1f] px-[14px] text-[14px] text-[#6b6b6b] outline-none transition-colors hover:border-[#3f3f3f] focus:border-[#ed6a32]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span>
                  {carregandoTecnologias
                    ? "Carregando tecnologias..."
                    : "Selecione ou crie tecnologias"}
                </span>
                <SetaDropdown aberto={techAberto} />
              </button>

              {techAberto && (
                <div
                  className="absolute left-0 top-full z-50 mt-2 w-full rounded-[12px] border border-[#2d2d2d] bg-[#141617] py-1.5 shadow-2xl"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  <PainelTecnologias
                    gerenciador={gerenciadorTecnologias}
                    selecionadas={tecnologiaIds}
                    onAlternar={alternarTecnologia}
                  />
                </div>
              )}
            </div>

            {tecnologiaIds.length > 0 && (
              <div className="mt-[10px] flex flex-wrap gap-[8px]">
                {tecnologiaIds.map((id) => (
                  <TagRemovivel
                    key={id}
                    label={tecnologias.find((t) => t.id === id)?.name ?? String(id)}
                    onRemove={() => alternarTecnologia(id)}
                  />
                ))}
              </div>
            )}
          </div>

          {erro && <p className="text-[12px] text-[#ff641f]">{erro}</p>}

          <div className="mt-[4px] flex items-center justify-end gap-[10px]">
            <button
              type="button"
              onClick={onFechar}
              className="h-[38px] cursor-pointer rounded-[8px] border-0 bg-transparent px-[16px] text-[13px] text-[#9a9a9a] transition-colors hover:text-white"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="h-[38px] cursor-pointer rounded-[8px] border-0 bg-[#ed6a32] px-[18px] text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {enviando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default GaleriaDesenvolvedor;
