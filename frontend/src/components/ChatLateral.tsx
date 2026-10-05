import { ArrowUp, X } from 'lucide-react';

interface ChatLateralProps {
  aberto: boolean;
  onFechar: () => void;
}

export function ChatLateral({ aberto, onFechar }: ChatLateralProps) {
  return (
    <aside
      className={`shrink-0 overflow-hidden rounded-[16px] bg-[#141617] transition-[width] duration-300 ${
        aberto ? 'w-[420px] sm:w-[480px]' : 'w-0'
      }`}
    >
      <div className="flex h-full w-[420px] flex-col p-6 sm:w-[480px]">
        <div className="flex items-center justify-between pb-6">
          <p className="text-[20px] text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Chat
          </p>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar chat"
            className="text-[#5a5f5f] transition-colors hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-end gap-4 overflow-y-auto opacity-40">
          <div className="h-12 w-64 self-start rounded-[14px] bg-[#2d2d2d]" />
          <div className="h-12 w-64 self-end rounded-[14px] bg-[#3f3f3f]" />
          <div className="h-12 w-64 self-end rounded-[14px] bg-[#3f3f3f]" />
        </div>

        <div className="relative mt-6 flex h-[52px] items-center justify-between rounded-[12px] border border-[#2d2d2d] px-4">
          <input
            type="text"
            placeholder="Digite uma mensagem."
            className="w-full bg-transparent border-0 p-0 m-0 text-[14px] text-white placeholder-[#3d3f40] outline-none"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          />
          <button
            type="button"
            aria-label="Enviar mensagem"
            className="flex size-[26px] shrink-0 items-center justify-center text-[#3d3f40] transition-colors hover:text-[#ED6A32]"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
