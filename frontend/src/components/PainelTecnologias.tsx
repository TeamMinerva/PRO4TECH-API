import { useState, type KeyboardEvent } from 'react';
import { Check, ChevronLeft, Ellipsis, Plus, Trash2 } from 'lucide-react';
import type { GerenciadorTecnologias } from '../hooks/useTecnologias';
import type { Technology } from '../services/technologyService';

interface PainelTecnologiasProps {
  gerenciador: GerenciadorTecnologias;
  selecionadas: number[];
  onAlternar: (id: number) => void;
}

const mensagemDeErro = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function PainelTecnologias({ gerenciador, selecionadas, onAlternar }: PainelTecnologiasProps) {
  const { tecnologias, carregando, erro, criar, editar, remover } = gerenciador;

  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Technology | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const termo = busca.trim();
  const termoMinusculo = termo.toLowerCase();
  const filtradas = tecnologias.filter((t) => t.name.toLowerCase().includes(termoMinusculo));
  const correspondenciaExata = tecnologias.find((t) => t.name.toLowerCase() === termoMinusculo);

  async function executar(acao: () => Promise<void>, fallback: string) {
    setOcupado(true);
    setErroAcao(null);
    try {
      await acao();
    } catch (error) {
      setErroAcao(mensagemDeErro(error, fallback));
    } finally {
      setOcupado(false);
    }
  }

  const criarNova = () =>
    executar(async () => {
      const criada = await criar(termo);
      onAlternar(criada.id);
      setBusca('');
    }, 'Não foi possível criar a tecnologia.');

  function abrirEdicao(tecnologia: Technology) {
    setEditando(tecnologia);
    setNomeEdicao(tecnologia.name);
    setConfirmandoExclusao(false);
    setErroAcao(null);
  }

  function voltar() {
    setEditando(null);
    setConfirmandoExclusao(false);
    setErroAcao(null);
  }

  const salvarEdicao = () =>
    executar(async () => {
      if (!editando) return;
      const nome = nomeEdicao.trim();
      if (nome === '') throw new Error('O nome não pode ficar vazio.');
      if (nome !== editando.name) await editar(editando.id, nome);
      voltar();
    }, 'Não foi possível salvar a tecnologia.');

  const excluir = () =>
    executar(async () => {
      if (!editando) return;
      await remover(editando.id);
      if (selecionadas.includes(editando.id)) onAlternar(editando.id);
      voltar();
    }, 'Não foi possível excluir a tecnologia.');

  // Enter dentro de um <form> enviaria o formulário inteiro; aqui ele vira a ação do painel.
  function aoPressionarEnterNaBusca(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (ocupado || termo === '') return;
    if (correspondenciaExata) onAlternar(correspondenciaExata.id);
    else criarNova();
  }

  function aoPressionarEnterNaEdicao(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (!ocupado) salvarEdicao();
  }

  const mensagem = erroAcao && <p className="px-4 py-2 text-xs text-[#ff641f]">{erroAcao}</p>;

  if (editando) {
    return (
      <div className="font-['Poppins'] text-sm">
        <button
          type="button"
          onClick={voltar}
          className="flex w-full cursor-pointer items-center gap-1.5 border-0 bg-transparent px-3 py-2 text-left text-xs text-[#8a8f8f] transition-colors hover:text-white"
        >
          <ChevronLeft size={14} strokeWidth={2} />
          Voltar
        </button>

        <div className="px-3 pb-2">
          <input
            type="text"
            autoFocus
            value={nomeEdicao}
            onChange={(e) => setNomeEdicao(e.target.value)}
            onKeyDown={aoPressionarEnterNaEdicao}
            maxLength={100}
            className="h-[36px] w-full rounded-[8px] border border-[#2a2c2d] bg-[#1c1e1f] px-3 text-sm text-white outline-none focus:border-[#ed6a32]"
          />
        </div>

        <div className="flex items-center justify-between gap-2 px-3 pb-2">
          {confirmandoExclusao ? (
            <button
              type="button"
              onClick={excluir}
              disabled={ocupado}
              className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs text-[#ff641f] transition-opacity hover:opacity-80 disabled:opacity-60"
            >
              <Trash2 size={14} strokeWidth={1.5} />
              Confirmar exclusão
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoExclusao(true)}
              disabled={ocupado}
              className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs text-[#8a8f8f] transition-colors hover:text-[#ff641f]"
            >
              <Trash2 size={14} strokeWidth={1.5} />
              Excluir
            </button>
          )}

          <button
            type="button"
            onClick={salvarEdicao}
            disabled={ocupado}
            className="h-[30px] cursor-pointer rounded-[8px] border-0 bg-[#ed6a32] px-3 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Salvar
          </button>
        </div>

        {confirmandoExclusao && (
          <p className="px-3 pb-2 text-[11px] leading-snug text-[#8a8f8f]">
            Isso remove "{editando.name}" de todos os desenvolvedores e projetos.
          </p>
        )}
        {mensagem}
      </div>
    );
  }

  return (
    <div className="font-['Poppins'] text-sm">
      <div className="border-b border-[#2d2d2d] px-3 pb-2 pt-1">
        <input
          type="text"
          autoFocus
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setErroAcao(null);
          }}
          onKeyDown={aoPressionarEnterNaBusca}
          placeholder="Buscar ou criar tecnologia..."
          maxLength={100}
          className="h-[34px] w-full border-0 bg-transparent text-sm text-white placeholder-[#6b6b6b] outline-none"
        />
      </div>

      <div className="max-h-48 overflow-y-auto py-1.5">
        {carregando && <p className="px-4 py-2 text-xs text-[#5a5f5f]">Carregando tecnologias...</p>}
        {erro && <p className="px-4 py-2 text-xs text-[#ff641f]">Não foi possível carregar as tecnologias.</p>}
        {!carregando && !erro && tecnologias.length === 0 && termo === '' && (
          <p className="px-4 py-2 text-xs text-[#5a5f5f]">Nenhuma tecnologia cadastrada. Digite para criar.</p>
        )}

        {filtradas.map((t) => {
          const selecionada = selecionadas.includes(t.id);
          return (
            <div key={t.id} className="group flex items-center hover:bg-[#1c1e1f]">
              <button
                type="button"
                onClick={() => onAlternar(t.id)}
                className={`flex min-w-0 flex-1 cursor-pointer items-center justify-between border-0 bg-transparent px-4 py-2 text-left transition-colors ${
                  selecionada ? 'text-white' : 'text-[#8a8f8f] group-hover:text-white'
                }`}
              >
                <span className="truncate">{t.name}</span>
                {selecionada && <Check size={13} strokeWidth={2.5} className="shrink-0 text-[#ED6A32]" />}
              </button>
              <button
                type="button"
                onClick={() => abrirEdicao(t)}
                title={`Editar ${t.name}`}
                aria-label={`Editar ${t.name}`}
                className="mr-2 shrink-0 cursor-pointer rounded border-0 bg-transparent p-1 text-[#5a5f5f] transition-colors hover:text-white"
              >
                <Ellipsis size={16} strokeWidth={2} />
              </button>
            </div>
          );
        })}

        {termo !== '' && !correspondenciaExata && (
          <button
            type="button"
            onClick={criarNova}
            disabled={ocupado}
            className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-2 text-left text-[#ED6A32] transition-colors hover:bg-[#1c1e1f] disabled:opacity-60"
          >
            <Plus size={14} strokeWidth={2.5} className="shrink-0" />
            <span className="truncate">Criar "{termo}"</span>
          </button>
        )}
      </div>

      {mensagem}
    </div>
  );
}
