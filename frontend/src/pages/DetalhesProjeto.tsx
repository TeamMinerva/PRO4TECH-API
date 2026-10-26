import { ArrowLeft, Bug, ListTodo, MessageSquare, Pencil, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
import { criarEnviarChatProjeto } from '../services/chatService';
import {
  getProjectById,
  getSimilarProjects,
  type ProjetoDetalhes,
  type ProjetoSemelhanteIA,
} from '../services/projectService';

type Aba = 'bugs' | 'backlog';

export default function DetalhesProjeto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState<ProjetoDetalhes | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [chatAberto, setChatAberto] = useState(true);
  const [semelhantesAberto, setSemelhantesAberto] = useState(true);
  const [projetosSemelhantes, setProjetosSemelhantes] = useState<ProjetoSemelhanteIA[]>([]);
  const [statusSemelhantes, setStatusSemelhantes] = useState<'carregando' | 'sucesso' | 'erro'>('carregando');
  const [projetoIdSemelhantes, setProjetoIdSemelhantes] = useState<number | null>(null);
  const [erroSemelhantes, setErroSemelhantes] = useState<string | null>(null);
  const [equipeAberta, setEquipeAberta] = useState(false);
  const [aba, setAba] = useState<Aba>('bugs');
  const [modalBugAberto, setModalBugAberto] = useState(false);
  const devsDisponiveis = useDesenvolvedores();
  const backlog = useBacklogEditavel();
  const { carregar: carregarBacklog } = backlog;
  // Chat restrito a este projeto; troca junto com o id da rota.
  const enviarChat = useMemo(() => criarEnviarChatProjeto(id ?? ''), [id]);

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

  const projetoIdAtual = projeto?.id;
  useEffect(() => {
    if (!id || !projetoIdAtual || projetoIdAtual !== Number(id)) return;

    let ativo = true;
    getSimilarProjects(id)
      .then((response) => {
        if (ativo) {
          setProjetoIdSemelhantes(response.projectId);
          setProjetosSemelhantes(response.similarProjects);
          setStatusSemelhantes('sucesso');
        }
      })
      .catch((error: unknown) => {
        if (ativo) {
          setProjetoIdSemelhantes(Number(id));
          const message = error instanceof Error
            ? error.message
            : 'Não foi possível buscar projetos semelhantes.';
          setErroSemelhantes(message);
          setStatusSemelhantes('erro');
        }
      });

    return () => {
      ativo = false;
    };
  }, [id, projetoIdAtual]);

  const tentarBuscarSemelhantesNovamente = () => {
    if (!id) return;

    setProjetoIdSemelhantes(Number(id));
    setStatusSemelhantes('carregando');
    setErroSemelhantes(null);
    getSimilarProjects(id, true)
      .then((response) => {
        setProjetoIdSemelhantes(response.projectId);
        setProjetosSemelhantes(response.similarProjects);
        setStatusSemelhantes('sucesso');
      })
      .catch((error: unknown) => {
        setProjetoIdSemelhantes(Number(id));
        const message = error instanceof Error
          ? error.message
          : 'Não foi possível buscar projetos semelhantes.';
        setErroSemelhantes(message);
        setStatusSemelhantes('erro');
      });
  };

  // minmax(0, ...) impede que textos longos estourem as margens da tabela
  const colunasBugs = chatAberto
    ? 'grid-cols-[minmax(0,1fr)_minmax(120px,240px)]'
    : 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(120px,200px)]';

  const statusLabel = projeto
    ? STATUS_OPCOES.find((o) => o.valor === projeto.status)?.label ?? projeto.status
    : '';
  const statusSemelhantesAtual = projeto?.id === projetoIdSemelhantes
    ? statusSemelhantes
    : 'carregando';
  const resultadosSemelhantesAtuais = projeto?.id === projetoIdSemelhantes
    ? projetosSemelhantes
    : [];

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
                  vazio={
                    statusSemelhantesAtual === 'sucesso'
                      ? 'Nenhum projeto semelhante encontrado.'
                      : ''
                  }
                  itens={statusSemelhantesAtual === 'carregando'
                    ? [<span key="carregando" className="text-base text-[#5a5f5f]">Buscando projetos semelhantes...</span>]
                    : statusSemelhantesAtual === 'erro'
                      ? [
                        <div key="erro" className="flex flex-wrap items-center gap-3">
                          <span className="text-base text-[#ED6A32]">{erroSemelhantes}</span>
                          <button
                            type="button"
                            onClick={tentarBuscarSemelhantesNovamente}
                            className="text-sm text-[#d6d6d6] underline hover:text-[#ED6A32]"
                          >
                            Tentar novamente
                          </button>
                        </div>,
                      ]
                      : resultadosSemelhantesAtuais.map((p) => (
                    <button
                      key={p.projectId}
                      type="button"
                      onClick={() => navigate(`/projetos/${p.projectId}`)}
                      className="flex flex-col items-start gap-1 text-left text-base text-[#d6d6d6] transition-colors hover:text-[#ED6A32]"
                    >
                      {p.name}
                      <span className="text-sm text-[#8a8f8f]">{p.justification}</span>
                      <span className="text-xs text-[#5a5f5f]">
                        Similaridade: {Math.round(p.similarity * 100)}%
                        {p.technologies.length > 0 && ` · ${p.technologies.join(', ')}`}
                      </span>
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

      <ChatLateral
        key={id}
        aberto={chatAberto}
        onFechar={() => setChatAberto(false)}
        onEnviar={enviarChat}
        titulo="Chat do projeto"
        placeholder="Pergunte sobre este projeto."
        mensagemBoasVindas="Tire dúvidas sobre épicos, features, PBIs e bugs deste projeto."
        sugestoes={[
          'Faça um resumo deste projeto.',
          'Quais bugs foram registrados e como foram resolvidos?',
          'Quais são os épicos e as features?',
        ]}
      />

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
