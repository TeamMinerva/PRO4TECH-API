import type { ReactNode } from 'react';
import { SetaDropdown } from './SetaDropdown';

interface ExpansivelProps {
  rotulo: string;
  aberto: boolean;
  onAlternar: () => void;
  vazio: string;
  itens: ReactNode[];
}

export function Expansivel({ rotulo, aberto, onAlternar, vazio, itens }: ExpansivelProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onAlternar}
        className="flex items-center gap-2.5 text-[#8a8f8f] hover:text-white transition-colors select-none"
      >
        {rotulo}
        <SetaDropdown aberto={aberto} />
      </button>
      {aberto && (
        <div className="mt-2 flex flex-col gap-1.5 pl-4">
          {itens.length === 0 ? <span className="text-base text-[#3d3f40]">{vazio}</span> : itens}
        </div>
      )}
    </div>
  );
}
