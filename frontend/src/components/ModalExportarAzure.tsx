import { useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, X } from 'lucide-react';
import type { EpicoDetalhe } from '../services/projectService';
import {
  contarBacklog,
  exportarBacklog,
  type ProgressoExportacao,
  type ResultadoExportacao,
} from '../services/azureBoardsService';

interface ModalExportarAzureProps {
  projetoNome: string;
  epicos: EpicoDetalhe[];
  onFechar: () => void;
}

type Etapa = 'confirmar' | 'exportando' | 'concluido';

const fonte = { fontFamily: 'Poppins, sans-serif' };

export function ModalExportarAzure({ projetoNome, epicos, onFechar }: ModalExportarAzureProps) {
  const [etapa, setEtapa] = useState<Etapa>('confirmar');
  const [progresso, setProgresso] = useState<ProgressoExportacao | null>(null);
  const [resultado, setResultado] = useState<ResultadoExportacao | null>(null);
  const contagem = contarBacklog(epicos);
  const exportando = etapa === 'exportando';

  async function iniciar() {
    setEtapa('exportando');
    setProgresso({ concluidos: 0, total: contagem.total, atual: 'Iniciando...' });

    try {
      setResultado(await exportarBacklog(epicos, setProgresso));
    } catch (error: unknown) {
      console.error('Erro ao exportar backlog para o Azure Boards:', error);
      setResultado({
        exportados: [],
        erros: [],
        ignorados: contagem.total,
        interrompidaPor: 'Ocorreu um erro inesperado durante a exportação.',
      });
    } finally {
      setEtapa('concluido');
    }
  }

  const fechar = () => {
    if (!exportando) onFechar();
  };

  const percentual = progresso && progresso.total > 0
    ? Math.round((progresso.concluidos / progresso.total) * 100)
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={fechar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Exportar backlog para o Azure Boards"
        className="relative max-h-full w-full max-w-[460px] overflow-y-auto rounded-[14px] bg-[#141617] p-[24px]"
      >
        <div className="mb-[20px] flex items-center justify-between">
          <h2 className="text-[16px] font-medium text-white" style={fonte}>
            Exportar para o Azure Boards
          </h2>
          {!exportando && (
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar"
              className="cursor-pointer border-0 bg-transparent p-0 text-[#9a9a9a] transition-colors hover:text-white"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {etapa === 'confirmar' && (
          <div className="flex flex-col gap-[16px]" style={fonte}>
            <p className="text-[14px] leading-relaxed text-[#d6d6d6]">
              Deseja exportar o backlog do projeto{' '}
              <span className="text-white">{projetoNome}</span> para o Azure Boards?
            </p>

            {contagem.total === 0 ? (
              <p className="text-[13px] text-[#ff641f]">
                Este projeto não possui itens de backlog para exportar.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-1 rounded-[8px] bg-[#1c1e1f] px-[14px] py-[10px] text-[13px] text-[#d6d6d6]">
                  <li>{contagem.epicos} {contagem.epicos === 1 ? 'épico' : 'épicos'}</li>
                  <li>{contagem.features} {contagem.features === 1 ? 'feature' : 'features'}</li>
                  <li>{contagem.pbis} {contagem.pbis === 1 ? 'PBI' : 'PBIs'}</li>
                </ul>
                <p className="text-[12px] text-[#9a9a9a]">
                  Os itens serão criados como novos no Azure Boards. Exportar o mesmo backlog mais de uma
                  vez gera itens duplicados.
                </p>
              </>
            )}

            <div className="mt-[4px] flex items-center justify-end gap-[10px]">
              <button
                type="button"
                onClick={onFechar}
                className="h-[38px] cursor-pointer rounded-[8px] border-0 bg-transparent px-[16px] text-[13px] text-[#9a9a9a] transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={iniciar}
                disabled={contagem.total === 0}
                className="h-[38px] cursor-pointer rounded-[8px] border-0 bg-[#ed6a32] px-[18px] text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Exportar
              </button>
            </div>
          </div>
        )}

        {exportando && progresso && (
          <div className="flex flex-col gap-[14px]" style={fonte} role="status" aria-live="polite">
            <p className="flex items-center gap-2 text-[14px] text-[#d6d6d6]">
              <Loader2 size={16} className="animate-spin text-[#ed6a32]" />
              Exportando backlog...
            </p>
            <div className="h-[6px] w-full overflow-hidden rounded-full bg-[#2a2c2d]">
              <div
                className="h-full rounded-full bg-[#ed6a32] transition-[width] duration-300"
                style={{ width: `${percentual}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-[12px] text-[#9a9a9a]">
              <span className="truncate">{progresso.atual}</span>
              <span className="shrink-0">
                {progresso.concluidos}/{progresso.total}
              </span>
            </div>
          </div>
        )}

        {etapa === 'concluido' && resultado && (
          <ResumoExportacao resultado={resultado} onFechar={onFechar} />
        )}
      </div>
    </div>
  );
}

function ResumoExportacao({
  resultado,
  onFechar,
}: {
  resultado: ResultadoExportacao;
  onFechar: () => void;
}) {
  const { exportados, erros, ignorados, interrompidaPor } = resultado;
  const sucessoTotal = erros.length === 0 && ignorados === 0 && !interrompidaPor;

  return (
    <div className="flex flex-col gap-[16px]" style={fonte}>
      {sucessoTotal ? (
        <p className="flex items-center gap-2 text-[14px] text-[#d6d6d6]">
          <CheckCircle2 size={18} className="shrink-0 text-[#4ade80]" />
          Backlog exportado com sucesso.
        </p>
      ) : (
        <p className="flex items-center gap-2 text-[14px] text-[#d6d6d6]">
          <AlertCircle size={18} className="shrink-0 text-[#ff641f]" />
          {exportados.length > 0 ? 'Exportação concluída com problemas.' : 'Não foi possível exportar o backlog.'}
        </p>
      )}

      {interrompidaPor && <p className="text-[13px] text-[#ff641f]">{interrompidaPor}</p>}

      <p className="text-[12px] text-[#9a9a9a]">
        {exportados.length} {exportados.length === 1 ? 'item exportado' : 'itens exportados'}
        {erros.length > 0 && ` · ${erros.length} com erro`}
        {ignorados > 0 && ` · ${ignorados} não enviados`}
      </p>

      {erros.length > 0 && (
        <div>
          <h3 className="mb-[6px] text-[12px] text-[#9a9a9a]">Erros</h3>
          <ul className="flex max-h-[160px] flex-col gap-2 overflow-y-auto rounded-[8px] bg-[#1c1e1f] p-[12px]">
            {erros.map((e, i) => (
              <li key={`${e.tipo}-${i}`} className="text-[12px]">
                <span className="text-[#d6d6d6]">
                  {e.tipo}: {e.titulo}
                </span>
                <span className="block text-[#ff641f]">{e.mensagem}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {exportados.length > 0 && (
        <div>
          <h3 className="mb-[6px] text-[12px] text-[#9a9a9a]">Itens criados</h3>
          <ul className="flex max-h-[200px] flex-col gap-1.5 overflow-y-auto rounded-[8px] bg-[#1c1e1f] p-[12px]">
            {exportados.map((item) => (
              <li key={`${item.tipo}-${item.id}`} className="flex items-center gap-2 text-[12px] text-[#d6d6d6]">
                <span className="shrink-0 text-[#6b6b6b]">{item.tipo}</span>
                <span className="truncate">{item.titulo}</span>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir item ${item.id} no Azure Boards`}
                    className="ml-auto flex shrink-0 items-center gap-1 text-[#ed6a32] hover:text-[#ff8555]"
                  >
                    #{item.id}
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="ml-auto shrink-0 text-[#6b6b6b]">#{item.id}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-[4px] flex justify-end">
        <button
          type="button"
          onClick={onFechar}
          className="h-[38px] cursor-pointer rounded-[8px] border-0 bg-[#ed6a32] px-[18px] text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
