import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { createBug } from '../services/bugService';
import type { Desenvolvedor } from '../hooks/useDesenvolvedores';

interface ModalCadastroBugProps {
  projetoId: number;
  projetoNome: string;
  desenvolvedores: Desenvolvedor[];
  onFechar: () => void;
  onCadastrado: () => void;
}

const campoClasse =
  'w-full rounded-[8px] border border-[#2a2c2d] bg-[#1c1e1f] px-[14px] text-[14px] text-white placeholder-[#6b6b6b] outline-none focus:border-[#ed6a32]';
const labelClasse = 'mb-[6px] block text-[12px] text-[#9a9a9a]';
const fonte = { fontFamily: 'Poppins, sans-serif' };

export function ModalCadastroBug({
  projetoId,
  projetoNome,
  desenvolvedores,
  onFechar,
  onCadastrado,
}: ModalCadastroBugProps) {
  const [titulo, setTitulo] = useState('');
  const [problema, setProblema] = useState('');
  const [solucao, setSolucao] = useState('');
  const [devId, setDevId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSalvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    if (!devId) {
      setErro('Selecione o desenvolvedor que solucionou.');
      return;
    }

    setEnviando(true);

    try {
      await createBug({
        title: titulo.trim(),
        description: problema.trim(),
        solution: solucao.trim(),
        projectId: projetoId,
        developerId: Number(devId),
      });
      onCadastrado();
    } catch (error: unknown) {
      console.error('Erro ao cadastrar bug:', error);
      setErro(error instanceof Error ? error.message : 'Não foi possível cadastrar o bug.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={onFechar}
    >
      <form
        onSubmit={handleSalvar}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-full w-full max-w-[400px] overflow-y-auto rounded-[14px] bg-[#141617] p-[24px]"
      >
        <div className="mb-[20px] flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-white" style={fonte}>
            Novo bug
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="cursor-pointer border-0 bg-transparent p-0 text-[#9a9a9a] transition-colors hover:text-white"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col gap-[16px]">
          <div>
            <label className={labelClasse} style={fonte}>
              Título
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título do bug"
              className={`${campoClasse} h-[40px]`}
              style={fonte}
            />
          </div>

          <div>
            <label className={labelClasse} style={fonte}>
              Problema
            </label>
            <textarea
              required
              value={problema}
              onChange={(e) => setProblema(e.target.value)}
              placeholder="Descreva o problema encontrado"
              className={`${campoClasse} h-[84px] resize-none py-[10px]`}
              style={fonte}
            />
          </div>

          <div>
            <label className={labelClasse} style={fonte}>
              Solução
            </label>
            <textarea
              required
              value={solucao}
              onChange={(e) => setSolucao(e.target.value)}
              placeholder="Descreva como foi resolvido"
              className={`${campoClasse} h-[84px] resize-none py-[10px]`}
              style={fonte}
            />
          </div>

          <div>
            <label className={labelClasse} style={fonte}>
              Projeto relacionado
            </label>
            <input
              type="text"
              readOnly
              value={projetoNome}
              className={`${campoClasse} h-[40px] cursor-not-allowed text-[#9a9a9a]`}
              style={fonte}
            />
          </div>

          <div>
            <label className={labelClasse} style={fonte}>
              Desenvolvedor que solucionou
            </label>
            <select
              required
              value={devId}
              onChange={(e) => setDevId(e.target.value)}
              className={`${campoClasse} h-[40px] ${devId ? '' : 'text-[#6b6b6b]'}`}
              style={fonte}
            >
              <option value="" disabled>
                Selecione um desenvolvedor
              </option>
              {desenvolvedores.map((d) => (
                <option key={d.id} value={d.id} className="text-white">
                  {d.nome}
                </option>
              ))}
            </select>
          </div>

          {erro && <p className="text-[12px] text-[#ff641f]">{erro}</p>}

          <div className="mt-[4px] flex items-center justify-end gap-[10px]">
            <button
              type="button"
              onClick={onFechar}
              className="h-[38px] cursor-pointer rounded-[8px] border-0 bg-transparent px-[16px] text-[13px] text-[#9a9a9a] transition-colors hover:text-white"
              style={fonte}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="h-[38px] cursor-pointer rounded-[8px] border-0 bg-[#ed6a32] px-[18px] text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={fonte}
            >
              {enviando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
