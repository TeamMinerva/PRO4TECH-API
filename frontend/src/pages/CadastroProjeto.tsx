import { ArrowLeft, ArrowUp, MessageSquare, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BotaoAdicionar } from '../components/BotaoAdicionar';
import { SeletorDesenvolvedores } from '../components/SeletorDesenvolvedores';
import { CabecalhoItem } from '../components/CabecalhoItem';
import { ChatLateral } from '../components/ChatLateral';
import { CampoTexto } from '../components/CampoTexto';
import { ErroCampo } from '../components/ErroCampo';
import { OpcaoDropdown } from '../components/OpcaoDropdown';
import { PainelTecnologias } from '../components/PainelTecnologias';
import { SetaDropdown } from '../components/SetaDropdown';
import { TagRemovivel } from '../components/TagRemovivel';
import { useDesenvolvedores } from '../hooks/useDesenvolvedores';
import { useDropdown } from '../hooks/useDropdown';
import { STATUS_OPCOES, useProjeto } from '../hooks/useProjeto';
import { useTecnologias } from '../hooks/useTecnologias';

export default function CadastroProjeto() {
  const { id } = useParams();
  const {
    projeto,
    editando,
    carregando,
    erroCarga,
    feedback,
    erroDoCampo,
    temErrosVisiveis,
    atualizarNome,
    definirStatus,
    alternarTecnologia,
    adicionarEpico,
    adicionarFeature,
    adicionarPBI,
    removerEpico,
    removerFeature,
    removerPBI,
    atualizarEpico,
    atualizarFeature,
    atualizarPBI,
    handleSalvar,
  } = useProjeto(id);

  const navigate = useNavigate();
  const devsDisponiveis = useDesenvolvedores();
  const [chatAberto, setChatAberto] = useState(true);
  const { aberto: statusAberto, setAberto: setStatusAberto, ref: statusRef } = useDropdown();
  const gerenciadorTecnologias = useTecnologias();
  const tecnologiasDisponiveis = gerenciadorTecnologias.tecnologias;
  const { aberto: techAberto, setAberto: setTechAberto, ref: techRef } = useDropdown();
  const nomeTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = nomeTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [projeto.nome]);

  const statusSelecionado = STATUS_OPCOES.find((o) => o.valor === projeto.status)?.label;

  if (carregando || erroCarga) {
    return (
      <div className="flex h-screen flex-col gap-3 bg-[#191b1c] p-10 font-['Poppins']">
        {carregando ? (
          <p className="text-[15px] text-[#5a5f5f]">Carregando projeto...</p>
        ) : (
          <>
            <p className="text-[16px] text-[#ED6A32]">{erroCarga}</p>
            <button
              type="button"
              onClick={() => navigate('/projetos')}
              className="self-start text-[14px] text-[#5a5f5f] hover:text-white underline"
            >
              Voltar para a galeria de projetos
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#191b1c] p-6 gap-4 lg:py-10 lg:pl-[50px] lg:pr-[50px]">
      <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2d2d2d]">
        <div className="w-full pb-16 pr-4">
          <button
            type="button"
            onClick={() => navigate(editando ? `/projetos/${id}` : '/galeria')}
            className="mb-8 flex items-center gap-2 text-[#5a5f5f] hover:text-white transition-colors text-[15px] font-['Poppins']"
          >
            <ArrowLeft size={17} strokeWidth={1.75} />
            Voltar
          </button>

          <div className="mb-8">
            <textarea
              ref={nomeTextareaRef}
              rows={1}
              placeholder="Nome do projeto"
              className="w-full resize-none overflow-hidden bg-transparent text-[32px] font-normal text-white mb-4 outline-none placeholder-[#3d3f40] leading-normal break-words font-['Outfit']"
              value={projeto.nome}
              onChange={(e) => atualizarNome(e.target.value)}
            />
            <ErroCampo mensagem={erroDoCampo('projeto.nome')} />

            <div className="flex flex-col gap-4 text-lg mb-6 border-b border-[#2d2d2d] pb-6 font-['Poppins']">
              <div>
                <div className="relative inline-block w-fit" ref={statusRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusAberto(!statusAberto);
                      setTechAberto(false);
                    }}
                    className="flex items-center gap-2.5 text-[#8a8f8f] hover:text-white transition-colors cursor-pointer text-lg font-['Poppins'] select-none"
                  >
                    {statusSelecionado ? (
                      <span className="flex items-center gap-2">
                        <span className="text-[#5a5f5f]">Status:</span>
                        <span className="text-white">{statusSelecionado}</span>
                      </span>
                    ) : (
                      <span>Status</span>
                    )}
                    <SetaDropdown aberto={statusAberto} />
                  </button>

                  {statusAberto && (
                    <div className="absolute top-full left-0 mt-2 z-50 min-w-[180px] bg-[#141617] border border-[#2d2d2d] rounded-[12px] shadow-2xl py-1.5 font-['Poppins']">
                      {STATUS_OPCOES.map((opcao) => (
                        <OpcaoDropdown
                          key={opcao.valor}
                          label={opcao.label}
                          selecionada={projeto.status === opcao.valor}
                          onClick={() => {
                            definirStatus(opcao.valor);
                            setStatusAberto(false);
                          }}
                        />
                      ))}
                      {projeto.status && (
                        <button
                          type="button"
                          onClick={() => {
                            definirStatus('');
                            setStatusAberto(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-[#5a5f5f] hover:text-[#ED6A32] hover:bg-[#1c1e1f] transition-colors border-t border-[#2d2d2d] mt-1 pt-2"
                        >
                          Limpar status
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <ErroCampo mensagem={erroDoCampo('projeto.status')} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative inline-block" ref={techRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setTechAberto(!techAberto);
                        setStatusAberto(false);
                      }}
                      className="flex items-center gap-2.5 text-[#8a8f8f] hover:text-white transition-colors cursor-pointer text-lg font-['Poppins'] select-none"
                    >
                      <span>Tecnologias</span>
                      <SetaDropdown aberto={techAberto} />
                    </button>

                    {techAberto && (
                      <div className="absolute top-full left-0 mt-2 z-50 min-w-[260px] bg-[#141617] border border-[#2d2d2d] rounded-[12px] shadow-2xl py-1.5 font-['Poppins'] scrollbar-thin scrollbar-thumb-[#2d2d2d]">
                        <PainelTecnologias
                          gerenciador={gerenciadorTecnologias}
                          selecionadas={projeto.tecnologias.map(Number)}
                          onAlternar={(id) => alternarTecnologia(String(id))}
                        />
                      </div>
                    )}
                  </div>

                  {projeto.tecnologias.map((id) => (
                    <TagRemovivel
                      key={id}
                      label={tecnologiasDisponiveis.find((t) => String(t.id) === id)?.name ?? id}
                      onRemove={() => alternarTecnologia(id)}
                    />
                  ))}
                </div>
                <ErroCampo mensagem={erroDoCampo('projeto.tecnologias')} />
              </div>
            </div>
          </div>

          <div className="border-l-2 border-[#2d2d2d] pl-6 ml-2 space-y-10 relative">
            {projeto.epicos.map((epico, iE) => (
              <div key={epico.id} className="space-y-4">
                <CabecalhoItem
                  rotulo={`${iE + 1}.0.0 Épico:`}
                  value={epico.nome}
                  onChange={(v) => atualizarEpico(epico.id, 'nome', v)}
                  onRemover={() => removerEpico(epico.id)}
                  tituloExcluir="Excluir Épico"
                  tamanho="epico"
                  erro={erroDoCampo(`epico.${epico.id}.nome`)}
                />

                <CampoTexto
                  label="Descrição:"
                  value={epico.descricao}
                  onChange={(v) => atualizarEpico(epico.id, 'descricao', v)}
                  erro={erroDoCampo(`epico.${epico.id}.descricao`)}
                />
                <CampoTexto
                  label="Objetivo:"
                  value={epico.objetivo}
                  onChange={(v) => atualizarEpico(epico.id, 'objetivo', v)}
                  erro={erroDoCampo(`epico.${epico.id}.objetivo`)}
                />
                <CampoTexto
                  label="Resultado esperado:"
                  value={epico.resultadoEsperado}
                  onChange={(v) => atualizarEpico(epico.id, 'resultadoEsperado', v)}
                  erro={erroDoCampo(`epico.${epico.id}.resultadoEsperado`)}
                  espacoInferior
                />

                <div className="border-l-2 border-[#282929] pl-6 space-y-8">
                  {epico.features.map((feature, iF) => (
                    <div key={feature.id} className="space-y-4">
                      <CabecalhoItem
                        rotulo={`${iE + 1}.${iF + 1}.0 Feature:`}
                        value={feature.nome}
                        onChange={(v) => atualizarFeature(epico.id, feature.id, 'nome', v)}
                        onRemover={() => removerFeature(epico.id, feature.id)}
                        tituloExcluir="Excluir Feature"
                        tamanho="feature"
                        erro={erroDoCampo(`feature.${feature.id}.nome`)}
                      />

                      <CampoTexto
                        label="Descrição:"
                        value={feature.descricao}
                        onChange={(v) => atualizarFeature(epico.id, feature.id, 'descricao', v)}
                        erro={erroDoCampo(`feature.${feature.id}.descricao`)}
                      />
                      <CampoTexto
                        label="Critérios de aprovação:"
                        value={feature.criteriosAprovacao}
                        onChange={(v) => atualizarFeature(epico.id, feature.id, 'criteriosAprovacao', v)}
                        erro={erroDoCampo(`feature.${feature.id}.criteriosAprovacao`)}
                        espacoInferior
                      />

                      <div className="border-l-2 border-[#232424] pl-6 space-y-4">
                        {feature.pbis.map((pbi, iP) => (
                          <div key={pbi.id} className="space-y-4 bg-[#141617] p-5 rounded-[14px]">
                            <CabecalhoItem
                              rotulo={`${iE + 1}.${iF + 1}.${iP + 1} PBI:`}
                              value={pbi.titulo}
                              onChange={(v) => atualizarPBI(epico.id, feature.id, pbi.id, 'titulo', v)}
                              onRemover={() => removerPBI(epico.id, feature.id, pbi.id)}
                              tituloExcluir="Excluir PBI"
                              tamanho="pbi"
                              erro={erroDoCampo(`pbi.${pbi.id}.titulo`)}
                            />

                            <CampoTexto
                              label="User Story:"
                              value={pbi.userStory}
                              onChange={(v) => atualizarPBI(epico.id, feature.id, pbi.id, 'userStory', v)}
                              erro={erroDoCampo(`pbi.${pbi.id}.userStory`)}
                            />
                            <CampoTexto
                              label="Critérios de aprovação:"
                              value={pbi.criteriosAprovacao}
                              onChange={(v) => atualizarPBI(epico.id, feature.id, pbi.id, 'criteriosAprovacao', v)}
                              erro={erroDoCampo(`pbi.${pbi.id}.criteriosAprovacao`)}
                            />

                            <div className="pt-2 font-['Poppins']">
                              <SeletorDesenvolvedores
                                selecionados={pbi.desenvolvedores}
                                disponiveis={devsDisponiveis}
                                onToggle={(id) =>
                                  atualizarPBI(
                                    epico.id,
                                    feature.id,
                                    pbi.id,
                                    'desenvolvedores',
                                    pbi.desenvolvedores.includes(id)
                                      ? pbi.desenvolvedores.filter((d) => d !== id)
                                      : [...pbi.desenvolvedores, id]
                                  )
                                }
                              />
                              <ErroCampo mensagem={erroDoCampo(`pbi.${pbi.id}.desenvolvedores`)} />
                            </div>
                          </div>
                        ))}

                        <BotaoAdicionar onClick={() => adicionarPBI(epico.id, feature.id)}>Novo PBI</BotaoAdicionar>
                      </div>
                    </div>
                  ))}

                  <BotaoAdicionar onClick={() => adicionarFeature(epico.id)}>Nova Feature</BotaoAdicionar>
                </div>
              </div>
            ))}

            <BotaoAdicionar onClick={adicionarEpico} grande>Novo Épico</BotaoAdicionar>
          </div>

          <div className="mt-12 flex items-center gap-6 font-['Poppins']">
            <button
              type="button"
              className="flex items-center gap-2 text-lg text-[#8a8f8f] hover:text-white transition-colors"
            >
              <Sparkles size={17} strokeWidth={1.75} />
              Analisar projeto
            </button>
            <button
              type="button"
              onClick={async () => {
                const salvo = await handleSalvar();
                if (salvo && editando) navigate(`/projetos/${id}`);
              }}
              className="bg-[#141617] hover:bg-[#1c1e1f] text-white px-8 py-3 rounded-[12px] text-lg transition-colors border border-[#2d2d2d]"
            >
              Salvar
            </button>
          </div>

          {feedback && (
            <div
              role="alert"
              className={`mt-4 rounded-[12px] border px-4 py-3 font-['Poppins'] flex items-center justify-between gap-4 ${
                feedback.tipo === 'sucesso'
                  ? 'border-green-700 bg-green-900/30 text-green-300'
                  : 'border-[#ED6A32]/60 bg-[#ED6A32]/10 text-[#ED6A32]'
              }`}
            >
              <p>{feedback.mensagem}</p>

              {temErrosVisiveis && (
                <button
                  type="button"
                  onClick={() =>
                    document.querySelector('[data-erro]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }
                  className="shrink-0 flex items-center gap-1 text-sm underline hover:text-white transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                  Ir para o primeiro erro
                </button>
              )}
            </div>
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
