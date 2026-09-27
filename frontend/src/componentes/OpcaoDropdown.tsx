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
        selecionada ? 'bg-[#2a2a2a] text-white font-medium' : 'text-gray-300 hover:bg-[#282828] hover:text-white'
      }`}
    >
      <span>{label}</span>
      {selecionada && <span className="text-orange-400 text-xs font-bold">✓</span>}
    </button>
  );
}
