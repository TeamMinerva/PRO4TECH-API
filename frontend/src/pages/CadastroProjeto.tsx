import { ArrowLeft, ArrowUp, MessageSquare, Plus, Sparkles, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CabecalhoItem } from '../components/CabecalhoItem';
import { CampoTexto } from '../components/CampoTexto';
import { ErroCampo } from '../components/ErroCampo';
import { OpcaoDropdown } from '../components/OpcaoDropdown';
import { SetaDropdown } from '../components/SetaDropdown';
import { TagRemovivel } from '../components/TagRemovivel';
import { useDesenvolvedores } from '../hooks/useDesenvolvedores';
import { useDropdown } from '../hooks/useDropdown';
import { STATUS_OPCOES, TECNOLOGIAS_DISPONIVEIS, useProjeto } from '../hooks/useProjeto';

export default function CadastroProjeto() {
  const {
    projeto,
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
  } = useProjeto();

  const navigate = useNavigate();
  const devsDisponiveis = useDesenvolvedores();
  const [chatAberto, setChatAberto] = useState(true);
  const { aberto: statusAberto, setAberto: setStatusAberto, ref: statusRef } = useDropdown();
  const { aberto: techAberto, setAberto: setTechAberto, ref: techRef } = useDropdown();
  const nomeTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = nomeTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [projeto.nome]);

  const statusSelecionado = STATUS_OPCOES.find((o) => o.valor === projeto.status)?.label;

  return (
    <div className="flex h-screen overflow-hidden bg-[#191b1c] p-6 gap-4 lg:py-10 lg:pl-[50px] lg:pr-[50px]">
      <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2d2d2d]">
        <div className="w-full pb-16 pr-4">
          <button
            type="button"
            onClick={() => navigate('/galeria')}
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
                      <div className="absolute top-full left-0 mt-2 z-50 min-w-[220px] max-h-64 overflow-y-auto bg-[#141617] border border-[#2d2d2d] rounded-[12px] shadow-2xl py-1.5 font-['Poppins'] scrollbar-thin scrollbar-thumb-[#2d2d2d]">
                        {TECNOLOGIAS_DISPONIVEIS.map((t) => (
                          <OpcaoDropdown
                            key={t}
                            label={t}
                            selecionada={projeto.tecnologias.includes(t)}
                            onClick={() => alternarTecnologia(t)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {projeto.tecnologias.map((t) => (
                    <TagRemovivel key={t} label={t} onRemove={() => alternarTecnologia(t)} />
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
                              <span className="mb-2 flex items-center gap-2 text-base text-[#8a8f8f]">
                                <Users size={15} strokeWidth={1.75} />
                                Desenvolvedores vinculados:
                              </span>
                              <select
                                multiple
                                value={pbi.desenvolvedores}
                                onChange={(e) =>
                                  atualizarPBI(
                                    epico.id,
                                    feature.id,
                                    pbi.id,
                                    'desenvolvedores',
                                    Array.from(e.target.selectedOptions, (opcao) => opcao.value)
                                  )
                                }
                                className="w-full bg-[#191b1c] text-lg p-2 rounded-[10px] outline-none border border-[#2d2d2d] text-white"
                              >
                                {devsDisponiveis.map((dev) => (
                                  <option key={dev.id} value={dev.id}>
                                    {dev.nome}
                                  </option>
                                ))}
                              </select>
                              <ErroCampo mensagem={erroDoCampo(`pbi.${pbi.id}.desenvolvedores`)} />
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => adicionarPBI(epico.id, feature.id)}
                          className="flex items-center gap-1.5 text-base text-[#ED6A32] hover:text-[#ff8555] mt-2 font-['Poppins'] transition-colors"
                        >
                          <Plus size={15} strokeWidth={2.25} />
                          Novo PBI
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => adicionarFeature(epico.id)}
                    className="flex items-center gap-1.5 text-base text-[#ED6A32] hover:text-[#ff8555] mt-2 font-['Poppins'] transition-colors"
                  >
                    <Plus size={15} strokeWidth={2.25} />
                    Nova Feature
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={adicionarEpico}
              className="flex items-center gap-2 text-lg text-[#ED6A32] hover:text-[#ff8555] mt-4 font-['Poppins'] transition-colors"
            >
              <Plus size={17} strokeWidth={2.25} />
              Novo Épico
            </button>
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
              onClick={handleSalvar}
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

      <aside
        className={`shrink-0 overflow-hidden rounded-[16px] bg-[#141617] transition-[width] duration-300 ${
          chatAberto ? 'w-[420px] sm:w-[480px]' : 'w-0'
        }`}
      >
        <div className="flex h-full w-[420px] flex-col p-6 sm:w-[480px]">
          <div className="flex items-center justify-between pb-6">
            <p className="text-[20px] text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Chat
            </p>
            <button
              type="button"
              onClick={() => setChatAberto(false)}
              aria-label="Fechar chat"
              className="text-[#5a5f5f] transition-colors hover:text-white"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex flex-1 flex-col justify-end gap-4 overflow-y-auto opacity-40">
            <div className="h-12 w-64 self-start rounded-[14px] bg-[#2d2d2d]" />
            <div className="h-12 w-64 self-end rounded-[14px] bg-[#3f3f3f]" />
            <div className="h-12 w-64 self-end rounded-[14px] bg-[#3f3f3f]" />
          </div>

          <div className="relative mt-6 flex h-[52px] items-center justify-between rounded-[12px] border border-[#2d2d2d] px-4">
            <input
              type="text"
              placeholder="Digite uma mensagem."
              className="w-full bg-transparent border-0 p-0 m-0 text-[14px] text-white placeholder-[#3d3f40] outline-none"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            />
            <button
              type="button"
              aria-label="Enviar mensagem"
              className="flex size-[26px] shrink-0 items-center justify-center text-[#3d3f40] transition-colors hover:text-[#ED6A32]"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
