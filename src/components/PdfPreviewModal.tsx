import React from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const metrics = debtService.getSummaryMetrics();
  const debts = debtService.getAllDebts();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-space-md sm:p-space-xl overflow-y-auto report-modal-backdrop">
      <div className="bg-surface-container-lowest w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col transform transition-all border border-outline-variant/30 report-modal-card">
        {/* Modal Utility Header */}
        <div className="h-14 px-space-xl bg-primary-container text-on-primary flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-space-md">
            <span className="material-symbols-outlined text-secondary-fixed text-[22px]">
              verified
            </span>
            <div>
              <h3 className="font-title-md text-title-md font-bold leading-tight">
                Visualização Prévia do Relatório Oficial (A4 Diretoria)
              </h3>
              <span className="font-label-uppercase text-[10px] text-on-primary-container tracking-wider uppercase">
                Documento Operacional Formatado para Impressão A4
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <button
              className="h-8 px-space-md rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-container font-body-sm text-body-sm font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
              onClick={() => window.print()}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              className="w-8 h-8 rounded-lg bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-on-primary flex items-center justify-center transition-colors cursor-pointer"
              onClick={onClose}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Simulated Document Sheet (A4 Pattern) */}
        <div className="p-8 bg-surface-container-low overflow-y-auto max-h-[768px] report-scroll-container">
          <div className="bg-surface-container-lowest p-8 sm:p-12 rounded-lg shadow-sm border-t-4 border-primary max-w-[800px] mx-auto text-on-surface space-y-6 report-document-sheet">
            {/* Doc Header */}
            <div className="flex items-start justify-between pb-6 border-b border-surface-container print-avoid-break">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-bold text-xl">
                  RC
                </div>
                <div>
                  <h2 className="font-headline-sm text-headline-sm font-bold text-primary">
                    RegCobre Gestão Integrada
                  </h2>
                  <p className="font-label-uppercase text-label-uppercase text-outline uppercase tracking-wider">
                    Diretoria de Recuperação de Ativos • Divisão de Auditoria
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-badge-sm text-[10px] px-2 py-0.5 rounded bg-surface-container text-primary font-bold uppercase border border-outline-variant/30">
                  Relatório Operacional
                </span>
                <div className="font-data-mono text-[11px] text-outline mt-1">
                  EMISSÃO: 04/11/2024 às 14:45:12
                </div>
              </div>
            </div>

            {/* Doc Title & Metadata */}
            <div className="space-y-2 print-avoid-break">
              <div className="font-label-uppercase text-label-uppercase text-secondary font-bold tracking-widest uppercase">
                Relatório Gerencial Oficial
              </div>
              <h1 className="font-headline-md text-headline-md font-bold text-primary">
                RELATÓRIO DE CONTROLE E CONFERÊNCIA DE COBRANÇAS
              </h1>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm">
                <div>
                  <span className="text-outline block text-[11px]">Período de Apuração:</span>
                  <strong className="font-semibold text-primary">01/11/2024 a 04/11/2024</strong>
                </div>
                <div>
                  <span className="text-outline block text-[11px]">Cobrador / Filtro:</span>
                  <strong className="font-semibold text-primary">Todos os Cobradores (Consolidado)</strong>
                </div>
                <div>
                  <span className="text-outline block text-[11px]">Auditor Responsável:</span>
                  <strong className="font-semibold text-primary">{currentUser?.name || 'Diretoria de Cobrança'}</strong>
                </div>
              </div>
            </div>

            {/* Doc Executive Summary */}
            <div className="space-y-2 print-avoid-break">
              <h4 className="font-title-md text-title-md font-bold text-primary">
                Resumo Executivo do Período
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-surface-container rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-outline block">Total Cobrado</span>
                  <span className="font-data-mono font-bold text-primary text-[14px]">
                    R$ {metrics.totalDebtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 bg-secondary-container/50 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-on-secondary-container block">
                    Total Recebido
                  </span>
                  <span className="font-data-mono font-bold text-secondary text-[14px]">
                    R$ {metrics.totalRecovered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 bg-surface-container rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-outline block">Total Prometido</span>
                  <span className="font-data-mono font-bold text-primary text-[14px]">
                    R$ {metrics.totalPromised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 bg-primary-container text-on-primary rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-primary-fixed block">
                    Taxa Liquidação
                  </span>
                  <span className="font-data-mono font-bold text-on-primary text-[14px]">
                    24,4%
                  </span>
                </div>
              </div>
            </div>

            {/* Doc Synthesis Table */}
            <div className="space-y-2 pt-2">
              <h4 className="font-title-md text-title-md font-bold text-primary print-avoid-break">
                Síntese de Operações Auditadas
              </h4>
              <table className="w-full text-left font-body-sm text-[11px] border-collapse">
                <thead>
                  <tr className="bg-surface-container text-on-surface font-semibold border-b border-outline-variant">
                    <th className="p-2">Hora</th>
                    <th className="p-2">Cobrador</th>
                    <th className="p-2">Devedor</th>
                    <th className="p-2">Título</th>
                    <th className="p-2 text-right">Valor Ação</th>
                    <th className="p-2">Resultado</th>
                    <th className="p-2 text-right">Recebido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container font-data-mono">
                  {debts.slice(0, 6).map((d) => (
                    <tr key={d.id}>
                      <td className="p-2 text-outline">{d.lastContact?.date || '04/11'}</td>
                      <td className="p-2 font-sans font-medium">{d.assignedTo.name}</td>
                      <td className="p-2 font-sans">{d.debtorName}</td>
                      <td className="p-2">{d.titleNumber}</td>
                      <td className="p-2 text-right font-semibold">
                        R$ {d.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 font-sans text-secondary font-semibold">
                        {d.lastContact?.result || d.statusLabel}
                      </td>
                      <td className="p-2 text-right text-secondary font-bold">
                        {d.payments[0]
                          ? `R$ ${d.payments[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Operacional & Signature Block */}
            <div className="pt-8 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-6 print-avoid-break">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-surface-container-high rounded p-1 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px] text-primary">
                    assignment
                  </span>
                </div>
                <div className="font-data-mono text-[10px] text-outline">
                  <div>REGISTRO OPERACIONAL CONTROLADO:</div>
                  <div className="text-on-surface font-bold">EMISSÃO SISTÊMICA CONTROLADA</div>
                  <div className="text-secondary font-semibold">
                    Gerado via Sistema RegCobre
                  </div>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="w-48 border-b border-on-surface inline-block mb-1"></div>
                <div className="font-semibold text-primary text-[12px]">
                  {currentUser?.name || 'Dr. Fernando Guimarães'}
                </div>
                <div className="text-[10px] text-outline uppercase">
                  {currentUser?.roleTitle || 'Diretor de Operações e Cobrança'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-space-md bg-surface-container-lowest border-t border-surface-container flex items-center justify-end gap-space-sm shrink-0 print:hidden">
          <button
            className="h-8 px-space-md rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high font-body-sm text-body-sm font-semibold transition-colors cursor-pointer"
            onClick={onClose}
            type="button"
          >
            Fechar Visualização
          </button>
          <button
            className="h-8 px-space-md rounded-lg bg-primary-container text-on-primary hover:bg-primary font-body-sm text-body-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            onClick={() => {
              window.print();
            }}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
