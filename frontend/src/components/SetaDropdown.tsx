import { ChevronDown } from 'lucide-react';

export function SetaDropdown({ aberto }: { aberto: boolean }) {
  return (
    <ChevronDown
      size={14}
      strokeWidth={2.5}
      className={`text-[#5a5f5f] transition-transform duration-200 ${aberto ? 'rotate-180 text-[#8a8f8f]' : ''}`}
    />
  );
}
