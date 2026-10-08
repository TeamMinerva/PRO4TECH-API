import { ArrowLeft, Bug, ListTodo, MessageSquare, Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BacklogEditavel } from '../components/BacklogEditavel';
import { BotaoAba } from '../components/BotaoAba';
import { ChatLateral } from '../components/ChatLateral';
import { ModalCadastroBug } from '../components/ModalCadastroBug';
import { Expansivel } from '../components/Expansivel';
import { TagRemovivel } from '../components/TagRemovivel';
import { useBacklogEditavel } from '../hooks/useBacklogEditavel';
import { useDesenvolvedores } from '../hooks/useDesenvolvedores';
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
  const [modalBugAberto, setModalBugAberto] = useState(false);
  const devsDisponiveis = useDesenvolvedores();
  const backlog = useBacklogEditavel();
  const { carregar: carregarBacklog } = backlog;

  useEffect(() => {
    if (!id) return;

    let ativo = true;
    setCarregando(true);
    setErro(null);

    getProjectById(id)
      .then((dados) => {
        if (ativo) {
          setProjeto(dados);
          carregarBacklog(dados.epics || []);
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
  }, [id, carregarBacklog]);

  // minmax(0, ...) impede que textos longos estourem as margens da tabela
  const colunasBugs = chatAberto
    ? 'grid-cols-[minmax(0,1fr)_minmax(120px,240px)]'
    : 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(120px,200px)]';

  const statusLabel = projeto
    ? STATUS_OPCOES.find((o) => o.valor === projeto.status)?.label ?? projeto.status
    : '';

  return (
    <div className="flex h-screen overflow-hidden bg-[#191b1c] p-6 gap-4 lg:py-10 lg:pl-[50px] lg:pr-[50px]">
      <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2d2d2d]">
        <div className="w-full pb-16 pr-4">
          <div className="mb-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/projetos')}
              className="flex items-center gap-2 text-[#5a5f5f] hover:text-white transition-colors text-[15px] font-['Poppins']"
            >
              <ArrowLeft size={17} strokeWidth={1.75} />
              Voltar
            </button>

            {!carregando && !erro && projeto && (
              <button
                type="button"
                onClick={() => navigate(`/projetos/${projeto.id}/editar`)}
                className="flex items-center gap-2 text-lg text-white hover:text-[#ED6A32] transition-colors font-['Poppins']"
              >
                <Pencil size={16} strokeWidth={1.75} />
                Editar
              </button>
            )}
          </div>

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
                      onClick={() => setModalBugAberto(true)}
                      className="flex items-center gap-1.5 text-base text-[#ED6A32] hover:text-[#ff8555] transition-colors"
                    >
                      <Plus size={15} strokeWidth={2.25} />
                      Novo bug
                    </button>
                  )}
                </div>

                {aba === 'backlog' ? (
                  <BacklogEditavel backlog={backlog} editando={false} devsDisponiveis={[]} />
                ) : (
                  <div className="rounded-[14px] bg-[#141617] p-5">
                    <div className={`mb-3 grid ${colunasBugs} gap-4 px-4 text-[15px] text-[#5a5f5f]`}>
                      <span>Título</span>
                      {!chatAberto && <span>Descrição</span>}
                      {!chatAberto && <span>Solução</span>}
                      <span>Dev. responsável</span>
                    </div>
                    {(projeto.bugs || []).length === 0 && (
                      <p className="px-4 py-2 text-[#3d3f40]">Nenhum bug registrado.</p>
                    )}
                    {(projeto.bugs || []).map((bug) => (
                      <div
                        key={bug.id}
                        className={`grid ${colunasBugs} gap-4 rounded-[8px] px-4 py-2 text-base text-[#d6d6d6] hover:bg-[#1c1e1f]`}
                      >
                        <span className={chatAberto ? 'truncate' : 'line-clamp-3 break-words'}>{bug.title}</span>
                        {!chatAberto && <span className="line-clamp-3 break-words">{bug.description}</span>}
                        {!chatAberto && <span className="line-clamp-3 break-words">{bug.solution}</span>}
                        <span className="truncate">{bug.developer.name}</span>
                      </div>
                    ))}
                  </div>
                )}
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

      {modalBugAberto && projeto && (
        <ModalCadastroBug
          projetoId={projeto.id}
          projetoNome={projeto.name}
          desenvolvedores={devsDisponiveis}
          onFechar={() => setModalBugAberto(false)}
          onCadastrado={() => {
            setModalBugAberto(false);
            getProjectById(String(projeto.id))
              .then(setProjeto)
              .catch((err) => console.error('Erro ao atualizar bugs:', err));
          }}
        />
      )}
    </div>
  );
}
