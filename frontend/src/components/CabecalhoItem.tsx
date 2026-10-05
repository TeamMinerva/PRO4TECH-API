import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ErroCampo } from './ErroCampo';

interface CabecalhoItemProps {
  rotulo: string;
  value: string;
  onChange: (valor: string) => void;
  onRemover: () => void;
  tituloExcluir: string;
  tamanho: 'epico' | 'feature' | 'pbi';
  erro?: string;
  colapsado?: boolean;
  onAlternarColapso?: () => void;
}

const TAMANHOS = {
  epico: {
    texto: 'text-white text-xl',
    input: 'text-white text-xl',
    icone: 18,
  },
  feature: {
    texto: 'text-[#d6d6d6] text-xl',
    input: 'text-[#d6d6d6] text-xl',
    icone: 16,
  },
  pbi: {
    texto: 'text-white text-lg',
    input: 'text-white text-lg',
    icone: 15,
  },
} as const;

export function CabecalhoItem({
  rotulo,
  value,
  onChange,
  onRemover,
  tituloExcluir,
  tamanho,
  erro,
  colapsado,
  onAlternarColapso,
}: CabecalhoItemProps) {
  const classes = TAMANHOS[tamanho];
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <div>
      <div className="flex items-start gap-3">
        {onAlternarColapso && (
          <button
            type="button"
            title={colapsado ? 'Expandir' : 'Recolher'}
            onClick={onAlternarColapso}
            className="shrink-0 text-[#5a5f5f] hover:text-white transition-colors p-1 mt-0.5"
          >
            {colapsado ? (
              <ChevronRight size={classes.icone} strokeWidth={2} />
            ) : (
              <ChevronDown size={classes.icone} strokeWidth={2} />
            )}
          </button>
        )}

        <span className={`${classes.texto} shrink-0 font-normal whitespace-nowrap leading-normal font-['Outfit']`}>
          {rotulo}
        </span>

        <textarea
          ref={textareaRef}
          rows={1}
          className={`w-full min-w-0 resize-none overflow-hidden bg-transparent ${classes.input} font-normal outline-none pb-1 leading-normal break-words font-['Outfit'] placeholder-[#3d3f40]`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        <button
          type="button"
          title={tituloExcluir}
          onClick={onRemover}
          className="shrink-0 text-[#5a5f5f] hover:text-[#ED6A32] transition-colors p-1"
        >
          <X size={classes.icone} strokeWidth={2} />
        </button>
      </div>
      <ErroCampo mensagem={erro} />
    </div>
  );
}
