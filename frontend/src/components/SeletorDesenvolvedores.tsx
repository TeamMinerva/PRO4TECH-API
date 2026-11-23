import { Users } from 'lucide-react';
import { useState } from 'react';
import { useDropdown } from '../hooks/useDropdown';
import type { Desenvolvedor } from '../hooks/useDesenvolvedores';
import { OpcaoDropdown } from './OpcaoDropdown';
import { SetaDropdown } from './SetaDropdown';
import { TagRemovivel } from './TagRemovivel';

interface SeletorDesenvolvedoresProps {
  selecionados: string[];
  disponiveis: Desenvolvedor[];
  onToggle: (id: string) => void;
  rotulo?: string;
  somenteLeitura?: boolean;
}

export function SeletorDesenvolvedores({
  selecionados,
  disponiveis,
  onToggle,
  rotulo = 'Desenvolvedores vinculados',
  somenteLeitura,
}: SeletorDesenvolvedoresProps) {
  const { aberto, setAberto, ref } = useDropdown<HTMLDivElement>();
  const [paraCima, setParaCima] = useState(false);

  const alternar = () => {
    if (!aberto && ref.current) {
      const { bottom } = ref.current.getBoundingClientRect();
      setParaCima(window.innerHeight - bottom < 280 && bottom > 280);
    }
    setAberto(!aberto);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-2">
      {somenteLeitura ? (
        <>
          <span className="text-[#8a8f8f]">{rotulo}:</span>
          {selecionados.length === 0 && <span className="text-[#3d3f40]">—</span>}
        </>
      ) : (
        <div className="relative inline-block" ref={ref}>
          <button
            type="button"
            onClick={alternar}
            className="flex items-center gap-2 text-[#8a8f8f] hover:text-white transition-colors cursor-pointer text-base font-['Poppins'] select-none"
          >
            <Users size={15} strokeWidth={1.75} />
            <span>{rotulo}</span>
            <SetaDropdown aberto={aberto} />
          </button>

          {aberto && (
            <div className={`absolute left-0 z-50 min-w-[220px] max-h-64 overflow-y-auto overscroll-contain ${paraCima ? 'bottom-full mb-2' : 'top-full mt-2'} bg-[#191b1c] border border-[#2d2d2d] rounded-[12px] shadow-2xl py-1.5 font-['Poppins'] scrollbar-thin scrollbar-thumb-[#2d2d2d]`}>
              {disponiveis.length === 0 ? (
                <p className="px-4 py-2 text-sm text-[#5a5f5f]">Nenhum desenvolvedor disponível.</p>
              ) : (
                disponiveis.map((dev) => (
                  <OpcaoDropdown
                    key={dev.id}
                    label={dev.nome}
                    selecionada={selecionados.includes(dev.id)}
                    onClick={() => onToggle(dev.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {selecionados.map((id) => {
        const dev = disponiveis.find((d) => d.id === id);
        return (
          <TagRemovivel
            key={id}
            label={dev?.nome ?? id}
            onRemove={somenteLeitura ? undefined : () => onToggle(id)}
          />
        );
      })}
    </div>
  );
}
