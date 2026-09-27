import { ErroCampo } from './ErroCampo';

interface CampoTextoProps {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  espacoInferior?: boolean;
  erro?: string;
}

export function CampoTexto({ label, value, onChange, espacoInferior, erro }: CampoTextoProps) {
  return (
    <div className={espacoInferior ? 'mb-6' : ''}>
      <div className="flex items-center gap-3 font-['Poppins']">
        <span className="text-lg text-gray-300 whitespace-nowrap">{label}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-lg outline-none text-gray-200 pb-1"
        />
      </div>
      <ErroCampo mensagem={erro} />
    </div>
  );
}
