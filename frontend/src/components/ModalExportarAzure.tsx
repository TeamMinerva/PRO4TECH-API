import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  X,
} from 'lucide-react';
import type { EpicoDetalhe } from '../services/projectService';
import {
  contarBacklog,
  exportarBacklogProjeto,
  type ResultadoExportacaoBacklog,
} from '../services/azureBoardsService';

interface ModalExportarAzureProps {
  projetoId: number;
  projetoNome: string;
  epicos: EpicoDetalhe[];
  onFechar: () => void;
}

type Etapa = 'confirmar' | 'exportando' | 'concluido';

const fonte = { fontFamily: 'Poppins, sans-serif' };

export function ModalExportarAzure({
  projetoId,
  projetoNome,
  epicos,
  onFechar,
}: ModalExportarAzureProps) {
  const [etapa, setEtapa] = useState<Etapa>('confirmar');
  const [resultado, setResultado] = useState<ResultadoExportacaoBacklog | null>(null);
  const [erroFatal, setErroFatal] = useState<string | null>(null);
  const contagem = contarBacklog(epicos);
  const exportando = etapa === 'exportando';

  async function iniciar() {
    setEtapa('exportando');
    setErroFatal(null);

    try {
      const res = await exportarBacklogProjeto(projetoId);
      setResultado(res);
      setEtapa('concluido');
    } catch (error: unknown) {
      console.error('Erro ao exportar backlog para o Azure Boards:', error);
      const mensagem =
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro inesperado durante a exportação.';
      setErroFatal(mensagem);
      setEtapa('concluido');
    }
  }

  const fechar = () => {
    if (!exportando) {
      onFechar();
    }
  };

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
        className="relative max-h-full w-full max-w-[500px] overflow-y-auto rounded-[14px] bg-[#141617] p-[24px]"
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
              <span className="font-semibold text-white">{projetoNome}</span> para o Azure Boards?
            </p>

            {contagem.total === 0 ? (
              <p className="text-[13px] text-[#ff641f]">
                Este projeto não possui itens de backlog para exportar.
              </p>
            ) : (
              <>
                <ul className="flex flex-col gap-1 rounded-[8px] bg-[#1c1e1f] px-[14px] py-[10px] text-[13px] text-[#d6d6d6]">
                  <li>
                    {contagem.epicos} {contagem.epicos === 1 ? 'épico' : 'épicos'}
                  </li>
                  <li>
                    {contagem.features} {contagem.features === 1 ? 'feature' : 'features'}
                  </li>
                  <li>
                    {contagem.pbis} {contagem.pbis === 1 ? 'PBI' : 'PBIs'}
                  </li>
                </ul>
                <div className="rounded-[8px] border border-[#2d2f31] bg-[#1a1c1d] p-3 text-[12px] text-[#9a9a9a]">
                  <p className="mb-1 text-white font-medium">Atenção sobre o envio:</p>
                  <p>
                    Os itens do backlog serão enviados ao Azure DevOps e criados na ordem hierárquica
                    (Épico → Feature → PBI). Reexportar o mesmo backlog gera novos itens no Azure Boards.
                  </p>
                </div>
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
                Exportar para Azure Boards
              </button>
            </div>
          </div>
        )}

        {exportando && (
          <div
            className="flex flex-col items-center gap-[16px] py-6 text-center"
            style={fonte}
            role="status"
            aria-live="polite"
          >
            <Loader2 size={36} className="animate-spin text-[#ed6a32]" />
            <div className="flex flex-col gap-1">
              <p className="text-[15px] font-medium text-white">
                Exportando backlog para o Azure Boards...
              </p>
              <p className="text-[13px] text-[#9a9a9a]">
                Criando e vinculando Épicos, Features e PBIs na organização de destino. Por favor, aguarde.
              </p>
            </div>
          </div>
        )}

        {etapa === 'concluido' && (
          <ResumoExportacao
            resultado={resultado}
            erroFatal={erroFatal}
            onFechar={onFechar}
          />
        )}
      </div>
    </div>
  );
}

function ResumoExportacao({
  resultado,
  erroFatal,
  onFechar,
}: {
  resultado: ResultadoExportacaoBacklog | null;
  erroFatal: string | null;
  onFechar: () => void;
}) {
  if (erroFatal || !resultado) {
    return (
      <div className="flex flex-col gap-[16px]" style={fonte}>
        <div className="flex items-center gap-2 text-[14px] text-[#ff641f]">
          <AlertCircle size={20} className="shrink-0 text-[#ff641f]" />
          <span>Não foi possível concluir a exportação.</span>
        </div>
        <div className="rounded-[8px] bg-[#291717] border border-[#522323] p-[12px] text-[13px] text-[#ff8d8d]">
          {erroFatal || 'Erro desconhecido durante o processamento da exportação.'}
        </div>
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

  const { summary, items, success, message } = resultado;
  const falhas = items.filter((i) => i.status === 'FAILED');
  const ignorados = items.filter((i) => i.status === 'SKIPPED');
  const exportados = items.filter((i) => i.status === 'EXPORTED');

  const parcial = !success && exportados.length > 0;
  const falhaGeral = !success && exportados.length === 0;

  return (
    <div className="flex flex-col gap-[16px]" style={fonte}>
      {success && (
        <div className="flex items-center gap-2 text-[14px] text-[#4ade80]">
          <CheckCircle2 size={20} className="shrink-0 text-[#4ade80]" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {parcial && (
        <div className="flex items-center gap-2 text-[14px] text-[#f59e0b]">
          <AlertTriangle size={20} className="shrink-0 text-[#f59e0b]" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {falhaGeral && (
        <div className="flex items-center gap-2 text-[14px] text-[#ff641f]">
          <AlertCircle size={20} className="shrink-0 text-[#ff641f]" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-4 gap-2 text-center text-[12px]">
        <div className="rounded-[8px] bg-[#1c1e1f] p-2">
          <span className="block text-[11px] text-[#8a8a8a]">Total</span>
          <span className="text-[16px] font-semibold text-white">{summary.total}</span>
        </div>
        <div className="rounded-[8px] bg-[#1c1e1f] p-2">
          <span className="block text-[11px] text-[#4ade80]">Exportados</span>
          <span className="text-[16px] font-semibold text-[#4ade80]">{summary.exported}</span>
        </div>
        <div className="rounded-[8px] bg-[#1c1e1f] p-2">
          <span className="block text-[11px] text-[#ff641f]">Falhas</span>
          <span className="text-[16px] font-semibold text-[#ff641f]">{summary.failed}</span>
        </div>
        <div className="rounded-[8px] bg-[#1c1e1f] p-2">
          <span className="block text-[11px] text-[#f59e0b]">Ignorados</span>
          <span className="text-[16px] font-semibold text-[#f59e0b]">{summary.skipped}</span>
        </div>
      </div>

      {/* Lista de Erros e Falhas */}
      {falhas.length > 0 && (
        <div>
          <h3 className="mb-[6px] text-[12px] font-medium text-[#ff641f]">
            Itens que falharam ({falhas.length})
          </h3>
          <ul className="flex max-h-[140px] flex-col gap-2 overflow-y-auto rounded-[8px] bg-[#221616] p-[12px]">
            {falhas.map((item) => (
              <li key={`fail-${item.type}-${item.sourceId}`} className="text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#ff641f]/20 px-1 py-0.5 text-[10px] text-[#ff641f]">
                    {item.type}
                  </span>
                  <span className="font-medium text-[#d6d6d6]">{item.name}</span>
                </div>
                {item.error && (
                  <span className="mt-0.5 block text-[11px] text-[#ff8d8d]">{item.error}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lista de Itens Ignorados por dependência */}
      {ignorados.length > 0 && (
        <div>
          <h3 className="mb-[6px] text-[12px] font-medium text-[#f59e0b]">
            Itens não exportados por dependência ({ignorados.length})
          </h3>
          <ul className="flex max-h-[120px] flex-col gap-2 overflow-y-auto rounded-[8px] bg-[#221d14] p-[12px]">
            {ignorados.map((item) => (
              <li key={`skip-${item.type}-${item.sourceId}`} className="text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#f59e0b]/20 px-1 py-0.5 text-[10px] text-[#f59e0b]">
                    {item.type}
                  </span>
                  <span className="font-medium text-[#d6d6d6]">{item.name}</span>
                </div>
                {item.error && (
                  <span className="mt-0.5 block text-[11px] text-[#fbbf24]">{item.error}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lista de Itens Criados com sucesso */}
      {exportados.length > 0 && (
        <div>
          <h3 className="mb-[6px] text-[12px] font-medium text-[#4ade80]">
            Itens criados no Azure Boards ({exportados.length})
          </h3>
          <ul className="flex max-h-[160px] flex-col gap-1.5 overflow-y-auto rounded-[8px] bg-[#1c1e1f] p-[12px]">
            {exportados.map((item) => {
              const linkUrl = item.webUrl || item.url;
              return (
                <li
                  key={`ok-${item.type}-${item.sourceId}`}
                  className="flex items-center gap-2 text-[12px] text-[#d6d6d6]"
                >
                  <span className="w-[50px] shrink-0 text-[11px] text-[#8a8a8a]">{item.type}</span>
                  <span className="truncate">{item.name}</span>
                  {item.azureId && (
                    linkUrl ? (
                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Abrir item #${item.azureId} no Azure Boards`}
                        className="ml-auto flex shrink-0 items-center gap-1 text-[#ed6a32] hover:text-[#ff8555]"
                      >
                        #{item.azureId}
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="ml-auto shrink-0 text-[#8a8a8a]">#{item.azureId}</span>
                    )
                  )}
                </li>
              );
            })}
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
