import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';

interface BotaoAdicionarProps {
  onClick: () => void;
  children: ReactNode;
  grande?: boolean;
}

export function BotaoAdicionar({ onClick, children, grande }: BotaoAdicionarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center text-[#ED6A32] hover:text-[#ff8555] font-['Poppins'] transition-colors ${
        grande ? 'gap-2 text-lg mt-4' : 'gap-1.5 text-base mt-2'
      }`}
    >
      <Plus size={grande ? 17 : 15} strokeWidth={2.25} />
      {children}
    </button>
  );
}
