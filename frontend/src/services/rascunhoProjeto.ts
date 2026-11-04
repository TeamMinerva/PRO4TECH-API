import { STATUS_OPCOES, type Projeto } from '../hooks/useProjeto';

export interface RascunhoPbi {
  title?: string;
  userStory?: string;
  acceptanceCriteria?: string;
  developers?: string[];
}

export interface RascunhoFeature {
  name?: string;
  description?: string;
  approvalCriteria?: string;
  pbis?: RascunhoPbi[];
}

export interface RascunhoEpico {
  name?: string;
  description?: string;
  objective?: string;
  expectedResult?: string;
  features?: RascunhoFeature[];
}

export interface RascunhoProjeto {
  name?: string;
  status?: string;
  technologies?: string[];
  epics?: RascunhoEpico[];
}

export interface CatalogosRascunho {
  tecnologias: { id: number | string; name: string }[];
  desenvolvedores: { id: string; nome: string }[];
}

function semVazios<T extends object>(obj: T): T | undefined {
  const limpo = Object.fromEntries(
    Object.entries(obj).filter(([, valor]) =>
      Array.isArray(valor) ? valor.length > 0 : typeof valor === 'string' ? valor !== '' : valor != null
    )
  );
  return Object.keys(limpo).length > 0 ? (limpo as T) : undefined;
}

const comValor = <T>(itens: (T | undefined)[]): T[] => itens.filter((item): item is T => item !== undefined);

export function montarRascunho(projeto: Projeto, catalogos: CatalogosRascunho): RascunhoProjeto {
  const nomeTecnologia = new Map(catalogos.tecnologias.map((t) => [String(t.id), t.name]));
  const nomeDev = new Map(catalogos.desenvolvedores.map((d) => [d.id, d.nome]));
  const nomes = (ids: string[], catalogo: Map<string, string>) =>
    ids.map((id) => catalogo.get(id)).filter((nome): nome is string => Boolean(nome));

  return (
    semVazios({
      name: projeto.nome.trim(),
      status: STATUS_OPCOES.find((s) => s.valor === projeto.status)?.label ?? '',
      technologies: nomes(projeto.tecnologias, nomeTecnologia),
      epics: comValor(
        projeto.epicos.map((epico) =>
          semVazios({
            name: epico.nome.trim(),
            description: epico.descricao.trim(),
            objective: epico.objetivo.trim(),
            expectedResult: epico.resultadoEsperado.trim(),
            features: comValor(
              epico.features.map((feature) =>
                semVazios({
                  name: feature.nome.trim(),
                  description: feature.descricao.trim(),
                  approvalCriteria: feature.criteriosAprovacao.trim(),
                  pbis: comValor(
                    feature.pbis.map((pbi) =>
                      semVazios({
                        title: pbi.titulo.trim(),
                        userStory: pbi.userStory.trim(),
                        acceptanceCriteria: pbi.criteriosAprovacao.trim(),
                        developers: nomes(pbi.desenvolvedores, nomeDev),
                      })
                    )
                  ),
                })
              )
            ),
          })
        )
      ),
    }) ?? {}
  );
}
