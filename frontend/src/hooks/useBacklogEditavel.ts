import { useRef, useState } from 'react';
import type { Desenvolvedor, EpicoDetalhe, FeatureDetalhe, PBIDetalhe } from '../services/projectService';

const trocarPorId = <T extends { id: number }>(lista: T[], id: number, fn: (item: T) => T) =>
  lista.map((item) => (item.id === id ? fn(item) : item));

export function useBacklogEditavel() {
  const [epicos, setEpicos] = useState<EpicoDetalhe[]>([]);
  const proximoId = useRef(-1);
  const novoId = () => proximoId.current--;

  const noEpico = (epicoId: number, fn: (e: EpicoDetalhe) => EpicoDetalhe) =>
    setEpicos((atual) => trocarPorId(atual, epicoId, fn));

  const naFeature = (epicoId: number, featureId: number, fn: (f: FeatureDetalhe) => FeatureDetalhe) =>
    noEpico(epicoId, (e) => ({ ...e, features: trocarPorId(e.features, featureId, fn) }));

  const noPBI = (epicoId: number, featureId: number, pbiId: number, fn: (p: PBIDetalhe) => PBIDetalhe) =>
    naFeature(epicoId, featureId, (f) => ({ ...f, pbis: trocarPorId(f.pbis, pbiId, fn) }));

  return {
    epicos,
    carregar: setEpicos,

    atualizarEpico: (epicoId: number, campos: Partial<EpicoDetalhe>) =>
      noEpico(epicoId, (e) => ({ ...e, ...campos })),
    atualizarFeature: (epicoId: number, featureId: number, campos: Partial<FeatureDetalhe>) =>
      naFeature(epicoId, featureId, (f) => ({ ...f, ...campos })),
    atualizarPBI: (epicoId: number, featureId: number, pbiId: number, campos: Partial<PBIDetalhe>) =>
      noPBI(epicoId, featureId, pbiId, (p) => ({ ...p, ...campos })),

    adicionarEpico: () =>
      setEpicos((atual) => [
        ...atual,
        { id: novoId(), name: '', description: '', objective: '', expectedResult: '', features: [] },
      ]),
    adicionarFeature: (epicoId: number) =>
      noEpico(epicoId, (e) => ({
        ...e,
        features: [...e.features, { id: novoId(), name: '', description: '', approvalCriteria: '', pbis: [] }],
      })),
    adicionarPBI: (epicoId: number, featureId: number) =>
      naFeature(epicoId, featureId, (f) => ({
        ...f,
        pbis: [...f.pbis, { id: novoId(), title: '', userStory: '', acceptanceCriteria: '', developers: [] }],
      })),

    removerEpico: (epicoId: number) => setEpicos((atual) => atual.filter((e) => e.id !== epicoId)),
    removerFeature: (epicoId: number, featureId: number) =>
      noEpico(epicoId, (e) => ({ ...e, features: e.features.filter((f) => f.id !== featureId) })),
    removerPBI: (epicoId: number, featureId: number, pbiId: number) =>
      naFeature(epicoId, featureId, (f) => ({ ...f, pbis: f.pbis.filter((p) => p.id !== pbiId) })),

    alternarDev: (epicoId: number, featureId: number, pbiId: number, dev: Desenvolvedor) =>
      noPBI(epicoId, featureId, pbiId, (p) => ({
        ...p,
        developers: p.developers.some((d) => d.id === dev.id)
          ? p.developers.filter((d) => d.id !== dev.id)
          : [...p.developers, dev],
      })),
  };
}

export type BacklogEditavel = ReturnType<typeof useBacklogEditavel>;
