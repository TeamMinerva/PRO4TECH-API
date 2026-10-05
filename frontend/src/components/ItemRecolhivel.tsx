import type { ReactNode } from 'react';
import { SetaDropdown } from './SetaDropdown';

interface ItemRecolhivelProps {
  fechado: boolean;
  onAlternar: () => void;
  cabecalho: ReactNode;
  children: ReactNode;
}

export function ItemRecolhivel({ fechado, onAlternar, cabecalho, children }: ItemRecolhivelProps) {
  return (
    <>
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onAlternar}
          aria-label={fechado ? 'Expandir' : 'Recolher'}
          aria-expanded={!fechado}
          className="mt-2 shrink-0 p-1"
        >
          <SetaDropdown aberto={!fechado} />
        </button>
        <div className="min-w-0 flex-1">{cabecalho}</div>
      </div>
      {!fechado && children}
    </>
  );
}
