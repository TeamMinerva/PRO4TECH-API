import { useCallback, useEffect, useRef } from 'react';
import { montarRascunho, type CatalogosRascunho } from '../services/rascunhoProjeto';
import type { Projeto } from './useProjeto';

export function useRascunhoProjeto(projeto: Projeto, catalogos: CatalogosRascunho) {
  const atual = useRef({ projeto, catalogos });

  useEffect(() => {
    atual.current = { projeto, catalogos };
  });

  return useCallback(() => montarRascunho(atual.current.projeto, atual.current.catalogos), []);
}
