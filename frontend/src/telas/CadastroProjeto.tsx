import { ArrowLeft, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CabecalhoItem } from '../componentes/CabecalhoItem';
import { CampoTexto } from '../componentes/CampoTexto';
import { ErroCampo } from '../componentes/ErroCampo';
import { OpcaoDropdown } from '../componentes/OpcaoDropdown';
import { SetaDropdown } from '../componentes/SetaDropdown';
import { TagRemovivel } from '../componentes/TagRemovivel';
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

  const statusSelecionado = STATUS_OPCOES.find((o) => o.valor === projeto.status)?.label;

  return (
    <div className="flex h-screen bg-[#1c1c1c] text-[#a0a0a0]">
      <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-gray-700 transition-all duration-300">
        <button
          type="button"
          onClick={() => navigate('/galeria')}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white font-['Poppins'] text-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Nome do projeto"
            className="w-full bg-transparent text-3xl font-semibold text-white mb-4 outline-none placeholder-gray-500 font-['Outfit']"
            value={projeto.nome}
            onChange={(e) => atualizarNome(e.target.value)}
          />
          <ErroCampo mensagem={erroDoCampo('projeto.nome')} />

          <div className="flex flex-col gap-4 text-lg mb-6 border-b border-gray-800 pb-6 font-['Poppins']">
            <div>
              <div className="relative inline-block w-fit" ref={statusRef}>
                <button
                  type="button"
                  onClick={() => {
                    setStatusAberto(!statusAberto);
                    setTechAberto(false);
                  }}
                  className="flex items-center gap-2.5 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer text-lg font-['Poppins'] select-none"
                >
                  {statusSelecionado ? (
                    <span className="flex items-center gap-2">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-gray-200 font-medium">{statusSelecionado}</span>
                    </span>
                  ) : (
                    <span>Status</span>
                  )}
                  <SetaDropdown aberto={statusAberto} />
                </button>

                {statusAberto && (
                  <div className="absolute top-full left-0 mt-2 z-50 min-w-[180px] bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl py-1.5 font-['Poppins']">
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
                        className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:text-red-400 hover:bg-[#282828] transition-colors border-t border-[#333] mt-1 pt-2"
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
                    className="flex items-center gap-2.5 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer text-lg font-['Poppins'] select-none"
                  >
                    <span>Tecnologias</span>
                    <SetaDropdown aberto={techAberto} />
                  </button>

                  {techAberto && (
                    <div className="absolute top-full left-0 mt-2 z-50 min-w-[220px] max-h-64 overflow-y-auto bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl py-1.5 font-['Poppins'] scrollbar-thin scrollbar-thumb-gray-700">
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

        <div className="border-l-2 border-[#333] pl-6 ml-2 space-y-10 relative">
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

              <div className="border-l-2 border-[#444] pl-6 space-y-8">
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

                    <div className="border-l-2 border-[#555] pl-6 space-y-4">
                      {feature.pbis.map((pbi, iP) => (
                        <div key={pbi.id} className="space-y-4 bg-[#252525] p-5 rounded-lg">
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
                            <span className="text-base mb-1 block text-gray-300">Desenvolvedores vinculados:</span>
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
                              className="w-full bg-[#1c1c1c] text-lg p-2 rounded outline-none border border-gray-700 text-gray-200"
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
                        onClick={() => adicionarPBI(epico.id, feature.id)}
                        className="text-base text-[#ff5722] hover:text-orange-400 mt-2 block font-['Poppins']"
                      >
                        + Novo PBI
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => adicionarFeature(epico.id)}
                  className="text-base text-[#ff5722] hover:text-orange-400 mt-2 block font-['Poppins']"
                >
                  + Nova Feature
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={adicionarEpico}
            className="text-lg text-[#ff5722] hover:text-orange-400 mt-4 block font-['Poppins']"
          >
            + Novo Épico
          </button>
        </div>

        <div className="mt-12 flex items-center gap-6 font-['Poppins']">
          <button className="text-lg hover:text-white transition-colors">Analisar projeto</button>
          <button
            onClick={handleSalvar}
            className="bg-[#111] hover:bg-black text-white px-8 py-3 rounded text-lg transition-colors border border-[#333]"
          >
            Salvar
          </button>
        </div>

        {feedback && (
          <div
            role="alert"
            className={`mt-4 rounded border px-4 py-3 font-['Poppins'] flex items-center justify-between gap-4 ${
              feedback.tipo === 'sucesso'
                ? 'border-green-700 bg-green-900/30 text-green-300'
                : 'border-red-700 bg-red-900/30 text-red-300'
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

      <div
        className={`bg-[#141414] border-l border-[#222] flex flex-col relative transition-all duration-300 ${
          chatAberto ? 'w-[400px] p-6' : 'w-[80px] p-4 items-center'
        }`}
      >
        <div
          onClick={() => setChatAberto(!chatAberto)}
          className="absolute top-6 right-6 opacity-50 hover:opacity-100 cursor-pointer z-10 transition-opacity p-2"
        >
          {chatAberto ? (
            <div className="w-4 h-3 flex flex-col justify-between">
              <div className="w-full h-[2px] bg-gray-400"></div>
              <div className="w-full h-[2px] bg-gray-400"></div>
            </div>
          ) : (
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 3.582-9 8-9s9 3.582 9 8z"
              />
            </svg>
          )}
        </div>

        {chatAberto ? (
          <>
            <div className="flex-1 flex flex-col justify-center gap-4 opacity-40 mt-8">
              <div className="w-64 h-12 bg-[#2a2a2a] rounded-xl self-start"></div>
              <div className="w-64 h-12 bg-[#333] rounded-xl self-end"></div>
              <div className="w-64 h-12 bg-[#333] rounded-xl self-end"></div>
            </div>

            <div className="mt-6 relative font-['Poppins']">
              <input
                type="text"
                placeholder="Digite uma mensagem."
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-4 px-5 text-lg text-white outline-none focus:border-gray-500 transition-colors"
              />
              <button className="absolute right-4 top-4 text-gray-500 hover:text-white">↑</button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center writing-vertical text-gray-600 font-bold tracking-[0.3em] text-base transform -rotate-90 mt-10 font-['Outfit']">
            CHAT
          </div>
        )}
      </div>
    </div>
  );
}
