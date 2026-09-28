import { useRef, useEffect } from 'react';
import { ErroCampo } from './ErroCampo';

interface CampoTextoProps {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  espacoInferior?: boolean;
  erro?: string;
}

export function CampoTexto({ label, value, onChange, espacoInferior, erro }: CampoTextoProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <div className={espacoInferior ? 'mb-6' : ''}>
      <div className="flex items-start gap-3 font-['Poppins']">
        <span className="shrink-0 whitespace-nowrap text-lg text-[#8a8f8f] leading-normal">{label}</span>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 resize-none overflow-hidden bg-transparent text-lg outline-none text-white placeholder-[#3d3f40] pb-1 leading-normal break-words"
        />
      </div>
      <ErroCampo mensagem={erro} />
    </div>
  );
}
