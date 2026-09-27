import { Check } from 'lucide-react';

interface OpcaoDropdownProps {
  label: string;
  selecionada: boolean;
  onClick: () => void;
}

export function OpcaoDropdown({ label, selecionada, onClick }: OpcaoDropdownProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
        selecionada ? 'bg-[#2d2d2d] text-white' : 'text-[#8a8f8f] hover:bg-[#1c1e1f] hover:text-white'
      }`}
    >
      <span>{label}</span>
      {selecionada && <Check size={13} strokeWidth={2.5} className="text-[#ED6A32]" />}
    </button>
  );
}
