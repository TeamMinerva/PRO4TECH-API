import { useState } from 'react';
import type { Desenvolvedor as DevDisponivel } from '../hooks/useDesenvolvedores';
import type { BacklogEditavel as Backlog } from '../hooks/useBacklogEditavel';
import type { PBIDetalhe } from '../services/projectService';
import { BotaoAdicionar } from './BotaoAdicionar';
import { CabecalhoItem } from './CabecalhoItem';
import { CampoTexto } from './CampoTexto';
import { ItemRecolhivel } from './ItemRecolhivel';
import { SeletorDesenvolvedores } from './SeletorDesenvolvedores';

interface BacklogEditavelProps {
  backlog: Backlog;
  editando: boolean;
  devsDisponiveis: DevDisponivel[];
}

export function BacklogEditavel({ backlog, editando, devsDisponiveis }: BacklogEditavelProps) {
  const [fechados, setFechados] = useState<Set<string>>(new Set());
  const somenteLeitura = !editando;

  const alternar = (chave: string) =>
    setFechados((atual) => {
      const novo = new Set(atual);
      if (!novo.delete(chave)) novo.add(chave);
      return novo;
    });

  const devsDoPBI = (pbi: PBIDetalhe): DevDisponivel[] => [
    ...devsDisponiveis,
    ...pbi.developers
      .filter((d) => !devsDisponiveis.some((x) => x.id === String(d.id)))
      .map((d) => ({ id: String(d.id), nome: d.name })),
  ];

  return (
    <>
      {backlog.epicos.length === 0 && <p className="px-4 py-2 text-[#3d3f40]">Backlog vazio.</p>}

      {backlog.epicos.length > 0 && (
        <div className="border-l-2 border-[#2d2d2d] pl-6 ml-2 space-y-10">
          {backlog.epicos.map((epico, iE) => (
            <div key={epico.id} className="space-y-4">
              <ItemRecolhivel
                fechado={fechados.has(`e${epico.id}`)}
                onAlternar={() => alternar(`e${epico.id}`)}
                cabecalho={
                  <CabecalhoItem
                    rotulo={`${iE + 1}.0.0 Épico:`}
                    value={epico.name}
                    onChange={(v) => backlog.atualizarEpico(epico.id, { name: v })}
                    onRemover={() => backlog.removerEpico(epico.id)}
                    tituloExcluir="Excluir Épico"
                    tamanho="epico"
                    somenteLeitura={somenteLeitura}
                  />
                }
              >
                <CampoTexto
                  label="Descrição:"
                  value={epico.description}
                  onChange={(v) => backlog.atualizarEpico(epico.id, { description: v })}
                  somenteLeitura={somenteLeitura}
                />
                <CampoTexto
                  label="Objetivo:"
                  value={epico.objective}
                  onChange={(v) => backlog.atualizarEpico(epico.id, { objective: v })}
                  somenteLeitura={somenteLeitura}
                />
                <CampoTexto
                  label="Resultado esperado:"
                  value={epico.expectedResult}
                  onChange={(v) => backlog.atualizarEpico(epico.id, { expectedResult: v })}
                  somenteLeitura={somenteLeitura}
                  espacoInferior
                />

                <div className="border-l-2 border-[#282929] pl-6 space-y-8">
                  {epico.features.map((feature, iF) => (
                    <div key={feature.id} className="space-y-4">
                      <ItemRecolhivel
                        fechado={fechados.has(`f${feature.id}`)}
                        onAlternar={() => alternar(`f${feature.id}`)}
                        cabecalho={
                          <CabecalhoItem
                            rotulo={`${iE + 1}.${iF + 1}.0 Feature:`}
                            value={feature.name}
                            onChange={(v) => backlog.atualizarFeature(epico.id, feature.id, { name: v })}
                            onRemover={() => backlog.removerFeature(epico.id, feature.id)}
                            tituloExcluir="Excluir Feature"
                            tamanho="feature"
                            somenteLeitura={somenteLeitura}
                          />
                        }
                      >
                        <CampoTexto
                          label="Descrição:"
                          value={feature.description}
                          onChange={(v) => backlog.atualizarFeature(epico.id, feature.id, { description: v })}
                          somenteLeitura={somenteLeitura}
                        />
                        <CampoTexto
                          label="Critérios de aprovação:"
                          value={feature.approvalCriteria}
                          onChange={(v) =>
                            backlog.atualizarFeature(epico.id, feature.id, { approvalCriteria: v })
                          }
                          somenteLeitura={somenteLeitura}
                          espacoInferior
                        />

                        <div className="border-l-2 border-[#232424] pl-6 space-y-4">
                          {feature.pbis.map((pbi, iP) => (
                            <div key={pbi.id} className="space-y-4 bg-[#141617] p-5 rounded-[14px]">
                              <ItemRecolhivel
                                fechado={fechados.has(`p${pbi.id}`)}
                                onAlternar={() => alternar(`p${pbi.id}`)}
                                cabecalho={
                                  <CabecalhoItem
                                    rotulo={`${iE + 1}.${iF + 1}.${iP + 1} PBI:`}
                                    value={pbi.title}
                                    onChange={(v) =>
                                      backlog.atualizarPBI(epico.id, feature.id, pbi.id, { title: v })
                                    }
                                    onRemover={() => backlog.removerPBI(epico.id, feature.id, pbi.id)}
                                    tituloExcluir="Excluir PBI"
                                    tamanho="pbi"
                                    somenteLeitura={somenteLeitura}
                                  />
                                }
                              >
                                <CampoTexto
                                  label="User Story:"
                                  value={pbi.userStory}
                                  onChange={(v) =>
                                    backlog.atualizarPBI(epico.id, feature.id, pbi.id, { userStory: v })
                                  }
                                  somenteLeitura={somenteLeitura}
                                />
                                <CampoTexto
                                  label="Critérios de aprovação:"
                                  value={pbi.acceptanceCriteria}
                                  onChange={(v) =>
                                    backlog.atualizarPBI(epico.id, feature.id, pbi.id, { acceptanceCriteria: v })
                                  }
                                  somenteLeitura={somenteLeitura}
                                />
                                <div className="pt-2 font-['Poppins']">
                                  <SeletorDesenvolvedores
                                    rotulo={somenteLeitura ? 'Desenvolvedores' : undefined}
                                    somenteLeitura={somenteLeitura}
                                    selecionados={pbi.developers.map((d) => String(d.id))}
                                    disponiveis={devsDoPBI(pbi)}
                                    onToggle={(id) => {
                                      const dev = devsDoPBI(pbi).find((d) => d.id === id);
                                      if (dev) {
                                        backlog.alternarDev(epico.id, feature.id, pbi.id, {
                                          id: Number(dev.id),
                                          name: dev.nome,
                                        });
                                      }
                                    }}
                                  />
                                </div>
                              </ItemRecolhivel>
                            </div>
                          ))}
                          {editando && (
                            <BotaoAdicionar onClick={() => backlog.adicionarPBI(epico.id, feature.id)}>
                              Novo PBI
                            </BotaoAdicionar>
                          )}
                        </div>
                      </ItemRecolhivel>
                    </div>
                  ))}
                  {editando && (
                    <BotaoAdicionar onClick={() => backlog.adicionarFeature(epico.id)}>
                      Nova Feature
                    </BotaoAdicionar>
                  )}
                </div>
              </ItemRecolhivel>
            </div>
          ))}
        </div>
      )}

      {editando && (
        <div className="mt-6">
          <BotaoAdicionar onClick={backlog.adicionarEpico}>Novo Épico</BotaoAdicionar>
        </div>
      )}
    </>
  );
}
