import { ErroCampo } from './ErroCampo';

interface CabecalhoItemProps {
  rotulo: string;
  value: string;
  onChange: (valor: string) => void;
  onRemover: () => void;
  tituloExcluir: string;
  tamanho: 'epico' | 'feature' | 'pbi';
  erro?: string;
}

const TAMANHOS = {
  epico: {
    texto: 'text-white text-xl',
    input: 'text-white text-xl',
    botao: 'text-xl ml-2',
  },
  feature: {
    texto: 'text-gray-200 text-xl',
    input: 'text-gray-200 text-xl',
    botao: 'text-lg ml-2',
  },
  pbi: {
    texto: 'text-white text-lg',
    input: 'text-white text-lg',
    botao: 'text-base ml-auto',
  },
} as const;

export function CabecalhoItem({ rotulo, value, onChange, onRemover, tituloExcluir, tamanho, erro }: CabecalhoItemProps) {
  const classes = TAMANHOS[tamanho];

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className={`${classes.texto} font-semibold font-medium whitespace-nowrap font-['Outfit']`}>
          {rotulo}
        </span>

        <input
          type="text"
          className={`w-full bg-transparent ${classes.input} font-medium outline-none pb-1 font-['Outfit']`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        <button
          type="button"
          title={tituloExcluir}
          onClick={onRemover}
          className={`text-gray-500 hover:text-red-500 transition-colors p-1 font-bold ${classes.botao}`}
        >
          ✕
        </button>
      </div>
      <ErroCampo mensagem={erro} />
    </div>
  );
}
