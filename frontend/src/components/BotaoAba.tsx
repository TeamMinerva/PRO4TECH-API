import type { ReactNode } from 'react';

interface BotaoAbaProps {
  ativa: boolean;
  onClick: () => void;
  icone: ReactNode;
  children: ReactNode;
}

export function BotaoAba({ ativa, onClick, icone, children }: BotaoAbaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[40px] items-center gap-2 rounded-[10px] px-5 text-[15px] transition-colors ${
        ativa ? 'bg-[#2d2d2d] text-[#ed6a32]' : 'text-[#3d3f40] hover:text-[#8a8f8f]'
      }`}
    >
      {icone}
      {children}
    </button>
  );
}
