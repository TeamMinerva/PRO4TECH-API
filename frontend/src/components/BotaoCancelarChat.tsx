interface BotaoCancelarChatProps {
  onClick: () => void;
  className?: string;
}

/**
 * Botão exibido no lugar do botão de enviar enquanto a IA está processando,
 * permitindo cancelar a requisição em andamento.
 */
export function BotaoCancelarChat({
  onClick,
  className = '',
}: BotaoCancelarChatProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Cancelar pergunta"
      title="Cancelar pergunta"
      className={`flex size-[26px] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-white/[0.06] p-0 text-[#ED6A32] transition-colors hover:bg-white/[0.1] hover:text-[#ff8555] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ED6A32] ${className}`}
    >
      <span
        className="size-[10px] rounded-[2px] bg-current"
        aria-hidden="true"
      />
    </button>
  );
}
