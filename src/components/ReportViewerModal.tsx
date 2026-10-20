import React from 'react';
import { useAuth } from '../context/AuthContext';

export interface ReportViewerSummaryTile {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
  colorClass?: string;
}

export interface ReportViewerColumn<T = any> {
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (item: T, index: number) => React.ReactNode;
}

export interface ReportViewerModalProps<T = any> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  periodLabel: string;
  filterSummary: { label: string; value: string }[];
  summaryTiles?: ReportViewerSummaryTile[];
  columns: ReportViewerColumn<T>[];
  data: T[];
  totalsRow?: Record<number, string | undefined>;
  onExportCsv?: () => void;
  empresaName?: string;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  periodLabel,
  filterSummary,
  summaryTiles,
  columns,
  data,
  totalsRow,
  onExportCsv,
  empresaName,
}) => {
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('report-modal-open');
      return () => {
        document.body.classList.remove('report-modal-open');
      };
    }
  }, [isOpen]);

  const emissionDate = new Date().toLocaleDateString('pt-BR');
  const emissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-space-lg overflow-y-auto animate-fade-in report-modal-backdrop">
      <div className="bg-surface-container-lowest w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col transform transition-all border border-outline-variant/30 max-h-[95vh] report-modal-card">
        {/* Barra de utilitários do Modal (Oculta na impressão) */}
        <div className="h-14 px-4 sm:px-6 bg-primary-container text-on-primary flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <span className="material-symbols-outlined text-secondary-fixed text-[22px] shrink-0">
              description
            </span>
            <div className="min-w-0">
              <h3 className="font-title-md text-sm sm:text-base font-bold leading-tight truncate">
                Visualização Prévia do Relatório (Padrão A4)
              </h3>
              <span className="font-label-uppercase text-[10px] text-on-primary-container tracking-wider uppercase block truncate">
                {title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onExportCsv && (
              <button
                className="h-8 px-3 rounded-lg bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-surface font-body-sm text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                onClick={onExportCsv}
                type="button"
                title="Exportar dados filtrados para planilha CSV"
              >
                <span className="material-symbols-outlined text-[15px]">file_download</span>
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            )}

            <button
              className="h-8 px-3.5 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container font-body-sm text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              onClick={handlePrint}
              type="button"
              title="Abrir diálogo nativo de impressão (permitindo escolher Salvar como PDF)"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              className="w-8 h-8 rounded-lg bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-on-primary flex items-center justify-center transition-colors cursor-pointer"
              onClick={onClose}
              type="button"
              title="Fechar visualização"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Folha do Documento (Formatada para tela e para papel A4) */}
        <div className="p-4 sm:p-8 bg-surface-container-low overflow-y-auto flex-1 report-scroll-container">
          <div
            id="report-printable-document"
            className="bg-surface-container-lowest p-6 sm:p-10 rounded-lg shadow-sm border-t-4 border-primary max-w-[850px] mx-auto text-on-surface space-y-6 report-document-sheet"
          >
            {/* 1. Cabeçalho Corporativo Oficial */}
            <div className="flex items-start justify-between pb-4 border-b border-surface-container print-avoid-break">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-bold text-xl shadow-xs shrink-0 print:border print:border-gray-300">
                  RC
                </div>
                <div>
                  <h2 className="font-headline-sm text-lg font-bold text-primary">
                    RegCobre Gestão Integrada
                  </h2>
                  <p className="font-label-uppercase text-[11px] text-outline uppercase tracking-wider">
                    {empresaName ? `${empresaName} • ` : ''}Diretoria de Recuperação de Ativos
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-badge-sm text-[10px] px-2 py-0.5 rounded bg-surface-container text-primary font-bold uppercase inline-block border border-outline-variant/30 print:border-gray-400">
                  Relatório Operacional
                </span>
                <div className="font-data-mono text-[11px] text-outline mt-1">
                  EMISSÃO: {emissionDate} às {emissionTime}
                </div>
              </div>
            </div>

            {/* 2. Título do Relatório e Filtros Aplicados */}
            <div className="space-y-3 print-avoid-break">
              <div>
                <span className="font-label-uppercase text-[11px] text-secondary font-bold tracking-widest uppercase block">
                  Relatório Gerencial
                </span>
                <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-primary mt-0.5">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Banner de Metadados e Filtros Aplicados */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-surface-container-low rounded-lg font-body-sm text-xs border border-outline-variant/30 print:border print:border-gray-300 print:bg-gray-50">
                <div>
                  <span className="text-outline block text-[10px] uppercase font-bold">Período:</span>
                  <strong className="font-semibold text-primary">{periodLabel}</strong>
                </div>
                {filterSummary.map((f, i) => (
                  <div key={i}>
                    <span className="text-outline block text-[10px] uppercase font-bold">{f.label}:</span>
                    <strong className="font-semibold text-primary truncate block" title={f.value}>
                      {f.value}
                    </strong>
                  </div>
                ))}
                <div>
                  <span className="text-outline block text-[10px] uppercase font-bold">Emitido Por:</span>
                  <strong className="font-semibold text-primary">{currentUser?.name || 'Sistema RegCobre'}</strong>
                </div>
              </div>
            </div>

            {/* 3. Indicadores Resumidos (Tiles Executivos) */}
            {summaryTiles && summaryTiles.length > 0 && (
              <div className="space-y-2 print-avoid-break">
                <h4 className="font-title-md text-xs font-bold text-primary uppercase tracking-wider">
                  Síntese do Período
                </h4>
                <div
                  className="grid gap-2 text-center"
                  style={{ gridTemplateColumns: `repeat(${Math.min(summaryTiles.length, 4)}, minmax(0, 1fr))` }}
                >
                  {summaryTiles.map((tile, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border border-outline-variant/30 print:border-gray-300 ${
                        tile.highlight
                          ? 'bg-secondary-container/30 border-secondary/40 print:bg-gray-100'
                          : 'bg-surface-container print:bg-gray-50'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-outline block leading-tight">
                        {tile.label}
                      </span>
                      <span
                        className={`font-data-mono font-bold text-sm sm:text-base block mt-0.5 ${
                          tile.colorClass || (tile.highlight ? 'text-secondary' : 'text-primary')
                        }`}
                      >
                        {tile.value}
                      </span>
                      {tile.sublabel && (
                        <span className="text-[10px] text-on-surface-variant block mt-0.5 font-medium">
                          {tile.sublabel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Tabela Analítica com Repetição de Cabeçalho na Impressão */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between print-avoid-break">
                <h4 className="font-title-md text-xs font-bold text-primary uppercase tracking-wider">
                  Detalhamento de Registros ({data.length} encontrado{data.length === 1 ? '' : 's'})
                </h4>
                <span className="font-data-mono text-[10px] text-outline">
                  Valores em Reais (R$)
                </span>
              </div>

              {data.length > 0 ? (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left font-body-sm text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-surface-container text-on-surface font-semibold border-b border-outline-variant print:bg-gray-100 print:text-black">
                        {columns.map((col, idx) => (
                          <th
                            key={idx}
                            style={{ width: col.width }}
                            className={`p-2 text-[10px] font-bold uppercase tracking-wider ${
                              col.align === 'right'
                                ? 'text-right'
                                : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                            }`}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-data-mono text-[11px] print:divide-gray-200">
                      {data.map((item, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className="hover:bg-surface-container-low transition-colors print:break-inside-avoid print:hover:bg-transparent"
                        >
                          {columns.map((col, colIdx) => (
                            <td
                              key={colIdx}
                              className={`p-2 ${
                                col.align === 'right'
                                  ? 'text-right'
                                  : col.align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                              }`}
                            >
                              {col.render(item, rowIdx)}
                            </td>
                          ))}
                        </tr>
                      ))}

                      {/* Linha de Totais da Tabela */}
                      {totalsRow && (
                        <tr className="bg-surface-container-high/60 font-bold border-t-2 border-primary text-primary print:bg-gray-200 print:break-inside-avoid">
                          {columns.map((col, colIdx) => (
                            <td
                              key={colIdx}
                              className={`p-2 ${
                                col.align === 'right'
                                  ? 'text-right'
                                  : col.align === 'center'
                                  ? 'text-center'
                                  : 'text-left'
                              }`}
                            >
                              {totalsRow[colIdx] !== undefined ? totalsRow[colIdx] : ''}
                            </td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center bg-surface-container-low rounded-lg border border-outline-variant/30 text-xs text-on-surface-variant print:border-gray-300 print:bg-white">
                  Nenhum registro localizado para os filtros selecionados.
                </div>
              )}
            </div>

            {/* 5. Rodapé Operacional e Linha de Assinatura */}
            <div className="pt-6 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4 print-avoid-break">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded bg-surface-container-high flex items-center justify-center text-primary shrink-0 print:border print:border-gray-300">
                  <span className="material-symbols-outlined text-[20px]">assignment</span>
                </div>
                <div className="text-[11px] text-outline font-sans">
                  <div className="font-semibold text-primary">RegCobre — Gestão Integrada de Cobrança</div>
                  <div>Documento emitido eletronicamente para fins operacionais e prestação de contas.</div>
                </div>
              </div>

              <div className="text-center sm:text-right shrink-0">
                <div className="w-48 border-b border-on-surface/40 inline-block mb-1"></div>
                <div className="font-semibold text-primary text-[11px]">
                  {currentUser?.name || 'Operador Responsável'}
                </div>
                <div className="text-[10px] text-outline uppercase font-medium">
                  {currentUser?.roleTitle || 'Diretoria de Operações / Supervisão'}
                </div>
                <div className="text-[10px] text-outline font-data-mono">
                  {emissionDate} às {emissionTime}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal (Oculto na impressão) */}
        <div className="p-3 sm:p-4 bg-surface-container-lowest border-t border-surface-container flex items-center justify-between gap-2 shrink-0 print:hidden">
          <span className="text-[11px] text-outline font-data-mono hidden sm:inline">
            Visualizador A4 • {data.length} linha(s) apurada(s)
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <button
              className="h-8 px-4 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high font-body-sm text-xs font-semibold transition-colors cursor-pointer"
              onClick={onClose}
              type="button"
            >
              Fechar Visualização
            </button>
            <button
              className="h-8 px-4 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-body-sm text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              onClick={handlePrint}
              type="button"
              title="Abrir diálogo nativo de impressão"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
