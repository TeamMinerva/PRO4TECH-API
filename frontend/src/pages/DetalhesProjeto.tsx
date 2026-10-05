import { ArrowLeft, Bug, ListTodo, MessageSquare, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChatLateral } from '../components/ChatLateral';
import { SetaDropdown } from '../components/SetaDropdown';
import { TagRemovivel } from '../components/TagRemovivel';
import { STATUS_OPCOES } from '../hooks/useProjeto';
import { getProjectById, type ProjetoDetalhes } from '../services/projectService';

type Aba = 'bugs' | 'backlog';

export default function DetalhesProjeto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState<ProjetoDetalhes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [chatAberto, setChatAberto] = useState(true);
  const [semelhantesAberto, setSemelhantesAberto] = useState(false);
  const [equipeAberta, setEquipeAberta] = useState(false);
  const [aba, setAba] = useState<Aba>('bugs');

  useEffect(() => {
    if (!id) return;

    let ativo = true;
    setCarregando(true);
    setErro(null);

    getProjectById(id)
      .then((dados) => {
        if (ativo) {
          setProjeto(dados);
          setCarregando(false);
        }
      })
      .catch((err) => {
        if (ativo) {
          setErro(err instanceof Error ? err.message : 'Erro ao buscar projeto.');
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [id]);

  const statusLabel = projeto
    ? STATUS_OPCOES.find((o) => o.valor === projeto.status)?.label ?? projeto.status
    : '';

  return (
    <div className="flex h-screen overflow-hidden bg-[#191b1c] p-6 gap-4 lg:py-10 lg:pl-[50px] lg:pr-[50px]">
      <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2d2d2d]">
        <div className="w-full pb-16 pr-4">
          <button
            type="button"
            onClick={() => navigate('/projetos')}
            className="mb-8 flex items-center gap-2 text-[#5a5f5f] hover:text-white transition-colors text-[15px] font-['Poppins']"
          >
            <ArrowLeft size={17} strokeWidth={1.75} />
            Voltar
          </button>

          {carregando && (
            <p className="text-[15px] text-[#5a5f5f] font-['Poppins']">Carregando detalhes do projeto...</p>
          )}

          {erro && (
            <div className="flex flex-col gap-3 font-['Poppins']">
              <p className="text-[16px] text-[#ED6A32]">{erro}</p>
              <button
                type="button"
                onClick={() => navigate('/projetos')}
                className="self-start text-[14px] text-[#5a5f5f] hover:text-white underline"
              >
                Voltar para a galeria de projetos
              </button>
            </div>
          )}

          {!carregando && !erro && projeto && (
            <>
              <h1 className="mb-4 text-[32px] font-normal text-white break-words font-['Outfit']">
                {projeto.name}
              </h1>

              <div className="flex flex-col gap-4 text-lg mb-8 border-b border-[#2d2d2d] pb-6 font-['Poppins']">
                <p className="flex items-center gap-2">
                  <span className="text-[#5a5f5f]">Status:</span>
                  <span className="text-white">{statusLabel}</span>
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[#5a5f5f]">Tecnologias:</span>
                  {(projeto.technologies || []).length === 0 && <span className="text-[#3d3f40]">—</span>}
                  {(projeto.technologies || []).map((t) => (
                    <TagRemovivel key={t} label={t} />
                  ))}
                </div>

                <Expansivel
                  rotulo="Projetos semelhantes"
                  aberto={semelhantesAberto}
                  onAlternar={() => setSemelhantesAberto(!semelhantesAberto)}
                  vazio="Nenhum projeto semelhante."
                  itens={(projeto.similarProjects || []).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => navigate(`/projetos/${p.id}`)}
                      className="text-left text-base text-[#d6d6d6] hover:text-[#ED6A32] transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                />

                <Expansivel
                  rotulo="Equipe de desenvolvimento"
                  aberto={equipeAberta}
                  onAlternar={() => setEquipeAberta(!equipeAberta)}
                  vazio="Nenhum desenvolvedor vinculado."
                  itens={(projeto.developers || []).map((d) => (
                    <span key={d.id} className="text-base text-[#d6d6d6]">
                      {d.name}
                    </span>
                  ))}
                />
              </div>

              <section className="font-['Poppins']">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <nav className="flex items-center rounded-[12px] border border-[#2d2d2d]">
                    <BotaoAba ativa={aba === 'bugs'} onClick={() => setAba('bugs')} icone={<Bug size={16} />}>
                      Bugs
                    </BotaoAba>
                    <BotaoAba
                      ativa={aba === 'backlog'}
                      onClick={() => setAba('backlog')}
                      icone={<ListTodo size={16} />}
                    >
                      Backlog
                    </BotaoAba>
                  </nav>

                  {aba === 'bugs' && (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-base text-[#ED6A32] hover:text-[#ff8555] transition-colors"
                    >
                      <Plus size={15} strokeWidth={2.25} />
                      Novo bug
                    </button>
                  )}
                </div>

                <div className="rounded-[14px] bg-[#141617] p-5">
                  <div className="mb-3 grid grid-cols-[1fr_minmax(120px,240px)] gap-4 px-4 text-[15px] text-[#5a5f5f]">
                    <span>Título</span>
                    <span>Dev. responsável</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {aba === 'backlog' &&
                      (projeto.backlog || []).map((pbi) => (
                        <LinhaTabela
                          key={pbi.id}
                          titulo={pbi.title}
                          responsavel={(pbi.developers || []).map((d) => d.name).join(', ')}
                        />
                      ))}

                    {(aba === 'bugs' || (projeto.backlog || []).length === 0) && (
                      <p className="px-4 py-2 text-[#3d3f40]">
                        {aba === 'bugs' ? 'Nenhum bug registrado.' : 'Backlog vazio.'}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {!chatAberto && (
        <button
          type="button"
          onClick={() => setChatAberto(true)}
          aria-label="Abrir chat"
          className="shrink-0 self-start text-[#5a5f5f] transition-colors hover:text-white"
        >
          <MessageSquare size={22} strokeWidth={1.5} />
        </button>
      )}

      <ChatLateral aberto={chatAberto} onFechar={() => setChatAberto(false)} />
    </div>
  );
}

interface BotaoAbaProps {
  ativa: boolean;
  onClick: () => void;
  icone: React.ReactNode;
  children: React.ReactNode;
}

function BotaoAba({ ativa, onClick, icone, children }: BotaoAbaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[40px] items-center gap-2 rounded-[10px] px-5 text-[15px] transition-colors ${
        ativa ? 'bg-[#2d2d2d] text-[#ed6a32]' : 'text-[#3d3f40] hover:text-[#8a8f8f]'
      }`}
    >
      {icone}
      {children}
    </button>
  );
}

function LinhaTabela({ titulo, responsavel }: { titulo: string; responsavel: string }) {
  return (
    <div className="grid grid-cols-[1fr_minmax(120px,240px)] gap-4 rounded-[10px] bg-[#1c1e1f] px-4 py-3 text-white">
      <span className="truncate">{titulo}</span>
      <span className="truncate text-[#d6d6d6]">{responsavel || '—'}</span>
    </div>
  );
}

interface ExpansivelProps {
  rotulo: string;
  aberto: boolean;
  onAlternar: () => void;
  vazio: string;
  itens: React.ReactNode[];
}

function Expansivel({ rotulo, aberto, onAlternar, vazio, itens }: ExpansivelProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onAlternar}
        className="flex items-center gap-2.5 text-[#8a8f8f] hover:text-white transition-colors select-none"
      >
        {rotulo}
        <SetaDropdown aberto={aberto} />
      </button>
      {aberto && (
        <div className="mt-2 flex flex-col gap-1.5 pl-4">
          {itens.length === 0 ? <span className="text-base text-[#3d3f40]">{vazio}</span> : itens}
        </div>
      )}
    </div>
  );
}
