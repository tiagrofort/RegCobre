import React, { useState } from 'react';
import { debtService } from '../services/debtService';
import { Debtor, Debt } from '../types';

interface BaseDevedoresViewProps {
  onSelectDebt: (debtId: string) => void;
  selectedDebtorIdInitial?: string;
}

export const BaseDevedoresView: React.FC<BaseDevedoresViewProps> = ({
  onSelectDebt,
  selectedDebtorIdInitial,
}) => {
  const debtors = debtService.getAllDebtors();
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>(
    selectedDebtorIdInitial || debtors[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDebtors = debtors.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.cnpjCpf.includes(q) ||
      d.erpCode.toLowerCase().includes(q) ||
      (d.tradeName && d.tradeName.toLowerCase().includes(q))
    );
  });

  const selectedDebtor = debtors.find((d) => d.id === selectedDebtorId) || filteredDebtors[0];
  const relatedDebts = selectedDebtor
    ? debtService.getDebtsByDebtorId(selectedDebtor.id)
    : [];

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-16">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">group</span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Base Geral de Devedores
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-badge-sm text-badge-sm">
              {debtors.length} Devedores Cadastrados
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Consulte o cadastro 360° dos clientes, histórico consolidado e todos os títulos e cobranças vinculadas no ERP.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
            search
          </span>
          <input
            className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none border border-outline-variant/30"
            placeholder="Buscar por Razão, CNPJ ou ERP..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid: Left List (35%) / Right 360 Detail (65%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left List of Debtors */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
          <div className="p-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
            <span className="font-label-uppercase text-xs font-bold text-on-surface-variant">
              Carteira de Clientes ({filteredDebtors.length})
            </span>
            <span className="text-[11px] text-outline font-data-mono">Clique para inspecionar</span>
          </div>

          <div className="divide-y divide-surface-container-high max-h-[640px] overflow-y-auto">
            {filteredDebtors.map((d) => {
              const isSelected = selectedDebtor?.id === d.id;
              const debtsCount = debtService.getDebtsByDebtorId(d.id).length;

              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDebtorId(d.id)}
                  className={`p-3 transition-colors cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-surface-container-high border-l-4 border-primary'
                      : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-title-md font-semibold text-primary truncate max-w-[240px]">
                      {d.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-badge-sm text-[10px]">
                      {d.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-data-mono">
                    <span>{d.cnpjCpf}</span>
                    <span>ERP {d.erpCode}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-secondary font-semibold font-data-mono">
                      {debtsCount} {debtsCount === 1 ? 'título' : 'títulos'} vinculado(s)
                    </span>
                    <span className="font-data-mono font-bold text-primary">
                      R$ {d.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 360 Detail View */}
        {selectedDebtor && (
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            {/* Debtor Profile Header */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary-container text-surface font-badge-sm text-xs uppercase font-bold">
                      {selectedDebtor.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                    </span>
                    <span className="font-data-mono text-outline text-xs">
                      ERP TOTVS {selectedDebtor.erpCode}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-badge-sm text-[10px] font-semibold">
                      RFB: {selectedDebtor.status}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold mt-1">
                    {selectedDebtor.name}
                  </h2>
                  {selectedDebtor.tradeName && (
                    <span className="text-body-sm text-on-surface-variant">
                      Nome Fantasia: {selectedDebtor.tradeName}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-primary text-surface rounded-lg text-right">
                  <span className="block text-[10px] font-label-uppercase text-on-primary-container">
                    DÍVIDA CONSOLIDADA
                  </span>
                  <span className="font-data-mono text-lg font-bold text-secondary-fixed">
                    R$ {selectedDebtor.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Cadastral Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-outline-variant/20 text-xs">
                <div>
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    CONTATO PRINCIPAL
                  </span>
                  <strong className="text-primary font-semibold text-sm">
                    {selectedDebtor.mainContact.name}
                  </strong>
                  <span className="text-on-surface-variant block">
                    {selectedDebtor.mainContact.role}
                  </span>
                </div>

                <div>
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    TELEFONES & WHATSAPP
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-data-mono text-on-surface font-medium">
                      {selectedDebtor.mainContact.phoneFixed}
                    </span>
                    <span>•</span>
                    <span className="font-data-mono text-on-surface font-medium">
                      {selectedDebtor.mainContact.phoneMobile}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    E-MAIL FINANCEIRO
                  </span>
                  <span className="text-on-surface font-mono select-all">
                    {selectedDebtor.mainContact.email}
                  </span>
                </div>

                <div>
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    STATUS CADASTRAL
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold text-xs">
                      {selectedDebtor.status}
                    </span>
                    <span className="text-[11px] text-outline font-data-mono">
                      {selectedDebtor.debtsCount} títulos cadastrados
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    ENDEREÇO FISCAL
                  </span>
                  <span className="text-on-surface leading-tight">
                    {selectedDebtor.mainContact.address}
                  </span>
                </div>
              </div>
            </div>

            {/* Debts Table for this Debtor */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
              <div className="p-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    receipt_long
                  </span>
                  <h3 className="font-title-md font-semibold text-primary">
                    Títulos e Cobranças Vinculadas ({relatedDebts.length})
                  </h3>
                </div>
                <span className="text-xs text-on-surface-variant font-data-mono">
                  Clique em "Abrir Ficha" para acessar o histórico da cobrança
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container text-on-surface font-label-uppercase uppercase tracking-wider">
                      <th className="py-2.5 px-3">Título</th>
                      <th className="py-2.5 px-3">Parcela</th>
                      <th className="py-2.5 px-3">Vencimento</th>
                      <th className="py-2.5 px-3 text-right">Valor Original</th>
                      <th className="py-2.5 px-3 text-right">Valor Atual</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Responsável</th>
                      <th className="py-2.5 px-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {relatedDebts.map((d) => (
                      <tr key={d.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-2.5 px-3 font-data-mono font-bold text-primary">
                          {d.titleNumber}
                        </td>
                        <td className="py-2.5 px-3 font-data-mono">{d.installment}</td>
                        <td className="py-2.5 px-3 font-data-mono">
                          {d.dueDate}
                          {d.daysOverdue > 0 && (
                            <span className="text-[10px] text-error block">
                              ({d.daysOverdue}d atraso)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-data-mono">
                          R$ {d.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-data-mono font-bold text-primary">
                          R$ {d.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-badge-sm text-[10px] font-semibold ${
                              d.status === 'pago'
                                ? 'bg-secondary text-on-secondary'
                                : d.status === 'promessa_firme'
                                ? 'bg-secondary-container text-on-secondary-container'
                                : d.status === 'quebrou_acordo'
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {d.statusLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-on-surface-variant">{d.assignedTo.name}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onSelectDebt(d.id)}
                            className="px-2.5 py-1 rounded bg-primary text-surface hover:bg-primary-container font-label-uppercase text-[10px] font-semibold transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              folder_open
                            </span>
                            <span>Abrir Ficha</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
