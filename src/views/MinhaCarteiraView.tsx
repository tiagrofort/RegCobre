import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import { Debt } from '../types';
import { getDebtStatusRowClass, getDebtStatusRowStyle } from '../utils/debtStatusStyles';

interface MinhaCarteiraViewProps {
  onSelectDebt: (debtId: string) => void;
  onOpenFastLogModal?: (debt: Debt) => void;
}

export const MinhaCarteiraView: React.FC<MinhaCarteiraViewProps> = ({
  onSelectDebt,
  onOpenFastLogModal,
}) => {
  const { currentUser } = useAuth();
  const allDebts = debtService.getDebtsForUser(currentUser);
  const userEmpresas = debtService.getEmpresasForUser(currentUser);

  // Active Selected Debt for Consultation Drawer
  const [selectedDebtId, setSelectedDebtId] = useState<string>(allDebts[0]?.id || '10002');
  const [filterQuery, setFilterQuery] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [activeFilterPill, setActiveFilterPill] = useState<
    'all' | 'delayed60' | 'promise' | 'return_today' | 'no_contact' | 'worked_today'
  >('all');
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const selectedDebt = allDebts.find((d) => d.id === selectedDebtId) || allDebts[0];
  const selectedDebtor = selectedDebt ? debtService.getDebtorById(selectedDebt.debtorId) : undefined;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filter debts based on pill & query & empresa
  const filteredDebts = allDebts.filter((d) => {
    if (empresaFilter !== 'all' && d.empresaId !== empresaFilter) {
      return false;
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      const match =
        d.debtorName.toLowerCase().includes(q) ||
        d.debtorCnpjCpf.includes(q) ||
        d.titleNumber.toLowerCase().includes(q) ||
        d.erpCode.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (activeFilterPill === 'delayed60') {
      return d.daysOverdue >= 45;
    }
    if (activeFilterPill === 'promise') {
      return d.status === 'promessa_firme' || !!d.activePromise;
    }
    if (activeFilterPill === 'return_today') {
      return d.status === 'retorno_agendado' || !!d.nextReturn;
    }
    if (activeFilterPill === 'no_contact') {
      return d.status === 'sem_contato' || d.daysOverdue > 30;
    }
    if (activeFilterPill === 'worked_today') {
      return d.history.some((h) => h.dateFormatted.includes('04/11') || h.dateFormatted.includes(debtService.getCurrentDate()));
    }

    return true;
  });

  const handleSelectDebtForDrawer = (d: Debt) => {
    setSelectedDebtId(d.id);
    if (isDrawerCollapsed) {
      setIsDrawerCollapsed(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Command & Filter Deck */}
      <div className="px-space-lg py-space-md bg-surface-container-lowest shadow-sm flex flex-col gap-space-md border-b border-outline-variant/30">
        {/* Header Level 1 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-surface flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">folder_special</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm">
                <h1 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                  Minha Carteira de Cobranças
                </h1>
                <span className="px-space-xs py-space-2xs rounded-full bg-secondary-container text-on-secondary-container font-label-uppercase text-label-uppercase">
                  Ferramenta de Consulta
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {allDebts.length} títulos ativos sob sua gestão • Consulta detalhada de títulos, histórico e situações
              </p>
            </div>
          </div>

          {/* High-Frequency Utilities */}
          <div className="flex items-center flex-wrap gap-space-xs">
            <button
              onClick={() => showToast('Sincronização com ERP TOTVS concluída. Todos os saldos atualizados.')}
              className="h-8 px-space-sm rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface transition-colors flex items-center gap-space-xs font-label-uppercase text-label-uppercase shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>Atualizar ERP</span>
            </button>

            <button
              onClick={() => showToast('Exportando carteira em formato CSV corporativo...')}
              className="h-8 px-space-sm rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface transition-colors flex items-center gap-space-xs font-label-uppercase text-label-uppercase shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Exportar CSV</span>
            </button>

            <div className="h-6 w-px bg-surface-container-high mx-space-2xs hidden sm:block"></div>

            <div className="flex items-center bg-primary text-surface px-space-sm py-1 rounded-lg gap-space-xs font-data-mono text-data-mono">
              <span className="text-on-primary-container font-body-sm">Recuperado:</span>
              <span className="font-semibold text-secondary-fixed">R$ 142.850,00</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Pills Bar */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-sm pt-space-xs">
          {/* Universal Quick Finder */}
          <div className="relative w-full xl:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-[18px]">
              manage_search
            </span>
            <input
              className="w-full h-8 pl-9 pr-space-md bg-surface-container-low focus:bg-surface-container-lowest text-on-surface rounded-lg font-body-sm text-body-sm placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary-container shadow-inner border border-outline-variant/30"
              placeholder="Buscar por Razão Social, CNPJ/CPF, Título ERP..."
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>

          {/* Filtro por Empresa (quando operador tem acesso a mais de 1) */}
          {userEmpresas.length > 1 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="material-symbols-outlined text-[16px] text-primary">domain</span>
              <select
                className="h-8 px-2 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none cursor-pointer"
                value={empresaFilter}
                onChange={(e) => setEmpresaFilter(e.target.value)}
                title="Filtrar cobranças por empresa autorizada"
              >
                <option value="all">Todas as Empresas ({userEmpresas.length})</option>
                {userEmpresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nomeFantasia} ({emp.modoCarteira})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Triage Filter Pills */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveFilterPill('all')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
                activeFilterPill === 'all'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span>Todos os Títulos</span>
              <span className="px-1 rounded bg-surface/20 text-surface font-data-mono text-[10px]">
                {allDebts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilterPill('delayed60')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
                activeFilterPill === 'delayed60'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              <span>Atraso &gt; 45 Dias</span>
            </button>

            <button
              onClick={() => setActiveFilterPill('promise')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
                activeFilterPill === 'promise'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>Promessas (PTP)</span>
            </button>

            <button
              onClick={() => setActiveFilterPill('return_today')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
                activeFilterPill === 'return_today'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              <span>Retornos Agendados</span>
            </button>

            <button
              onClick={() => setActiveFilterPill('worked_today')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
                activeFilterPill === 'worked_today'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[13px] text-secondary">check</span>
              <span>Trabalhadas Hoje</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Work Area: Split Panel (65% Table / 35% Consultation Panel) */}
      <div className="flex-1 flex flex-col xl:flex-row p-space-md gap-space-md items-start">
        {/* LEFT: Collections Table */}
        <div
          className={`w-full transition-all bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/30 ${
            isDrawerCollapsed ? 'xl:w-full' : 'xl:w-[65%]'
          }`}
        >
          {/* Table Functional Bar */}
          <div className="px-space-md py-space-xs bg-surface-container-low flex items-center justify-between text-on-surface-variant border-b border-outline-variant/20">
            <span className="font-label-uppercase text-label-uppercase uppercase text-xs">
              Visualizando {filteredDebts.length} de {allDebts.length} registros
            </span>

            <div className="flex items-center gap-space-md font-body-sm text-body-sm">
              <span className="text-on-surface">
                Total em Carteira:{' '}
                <strong className="font-data-mono font-semibold text-primary">
                  R$ 584.220,18
                </strong>
              </span>

              {isDrawerCollapsed && (
                <button
                  onClick={() => setIsDrawerCollapsed(false)}
                  className="px-2 py-0.5 rounded bg-primary text-surface font-label-uppercase text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  <span>Abrir Painel de Detalhes</span>
                </button>
              )}
            </div>
          </div>

          {/* Primary Data Grid */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface font-label-uppercase text-label-uppercase tracking-wider select-none sticky top-0 text-[11px]">
                  <th className="py-2.5 px-3">Devedor &amp; CNPJ</th>
                  <th className="py-2.5 px-3">Título / Parc</th>
                  <th className="py-2.5 px-3">Vencimento</th>
                  <th className="py-2.5 px-3 text-right">Valor Atual</th>
                  <th className="py-2.5 px-3">Situação</th>
                  <th className="py-2.5 px-3">Último Contato</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high font-body-sm text-body-sm">
                {filteredDebts.map((d) => {
                  const isSelected = selectedDebtId === d.id;
                  const statusStyle = getDebtStatusRowStyle(d.status);

                  return (
                    <tr
                      key={d.id}
                      onClick={() => handleSelectDebtForDrawer(d)}
                      className={`transition-colors cursor-pointer group ${getDebtStatusRowClass(
                        d.status,
                        isSelected
                      )}`}
                    >
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle.indicatorClass}`}
                              title={`Status: ${statusStyle.label}`}
                            />
                            <span className="font-title-md text-title-md font-semibold text-on-surface truncate max-w-[180px] group-hover:text-primary">
                              {d.debtorName}
                            </span>
                            <span className="px-1 py-0.2 rounded bg-surface-container-highest text-on-surface font-badge-sm text-badge-sm">
                              {d.debtorType}
                            </span>
                          </div>
                          <span className="font-data-mono text-[11px] text-on-surface-variant">
                            CNPJ: {d.debtorCnpjCpf} • ERP {d.erpCode}
                          </span>
                          {(() => {
                            const emp = debtService.getEmpresaById(d.empresaId);
                            return emp ? (
                              <span className="text-[10px] text-primary/80 font-medium flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[12px] text-primary">domain</span>
                                <span>{emp.nomeFantasia}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-surface-container text-on-surface-variant font-bold uppercase">
                                  {emp.modoCarteira}
                                </span>
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDebt(d.id);
                            }}
                            className="font-data-mono font-semibold text-primary hover:underline text-left cursor-pointer"
                          >
                            {d.titleNumber}
                          </button>
                          <span className="text-[11px] text-on-surface-variant font-data-mono">
                            Parc. {d.installment}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="font-data-mono text-on-surface">{d.dueDate}</span>
                          <span
                            className={`font-label-uppercase text-[10px] font-semibold flex items-center gap-0.5 ${
                              d.daysOverdue > 0 ? 'text-error' : 'text-secondary'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                d.daysOverdue > 0 ? 'bg-error' : 'bg-secondary'
                              }`}
                            ></span>
                            {d.daysOverdue > 0 ? `${d.daysOverdue} dias atraso` : 'A vencer'}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-data-mono font-semibold text-primary">
                            R$ {d.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="font-data-mono text-[10px] text-on-surface-variant">
                            Orig: R$ {d.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-uppercase text-[10px] text-on-surface font-semibold">
                          {d.statusLabel}
                        </span>
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-on-surface">
                            {d.lastContact?.result || 'Sem contato'}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-data-mono">
                            {d.lastContact?.date || '-'} ({d.lastContact?.channel || '-'})
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-on-surface-variant text-xs">
                        {d.assignedTo.name}
                      </td>

                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectDebt(d.id)}
                            className="px-2.5 h-7 rounded bg-primary hover:bg-primary-container text-surface font-label-uppercase text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                            title="Abrir Ficha da Cobrança"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">folder_open</span>
                            <span>Ficha</span>
                          </button>

                          {onOpenFastLogModal && (
                            <button
                              onClick={() => onOpenFastLogModal(d)}
                              className="w-7 h-7 rounded bg-surface-container hover:bg-surface-variant text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                              title="Registrar Contato Rápido"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit_note</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Consultation & History Panel (No duplicated form!) */}
        {!isDrawerCollapsed && selectedDebt && (
          <div className="w-full xl:w-[35%] bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col transition-all border border-outline-variant/30">
            {/* Header: Contexto da Cobrança */}
            <div className="p-space-md bg-primary text-surface flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <span className="text-secondary-fixed font-data-mono text-[11px] font-semibold uppercase">
                  Consulta de Cobrança • Título {selectedDebt.titleNumber}
                </span>
                <button
                  onClick={() => setIsDrawerCollapsed(true)}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-primary-container text-surface transition-colors cursor-pointer"
                  title="Recolher Painel Lateral"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">close_fullscreen</span>
                </button>
              </div>

              <div>
                <h2 className="font-headline-sm font-semibold tracking-tight text-surface truncate">
                  {selectedDebt.debtorName}
                </h2>
                <div className="flex items-center justify-between text-on-primary-container text-xs font-data-mono mt-0.5">
                  <span>CNPJ: {selectedDebt.debtorCnpjCpf}</span>
                  <span className="text-secondary-fixed">ERP {selectedDebt.erpCode}</span>
                </div>
              </div>

              {/* Grid Financeiro Rápido */}
              <div className="grid grid-cols-3 gap-2 mt-2 bg-primary-container/80 p-2.5 rounded-lg text-center border border-surface/10">
                <div>
                  <span className="block text-[10px] font-label-uppercase text-on-primary-container">
                    VALOR ORIGINAL
                  </span>
                  <span className="font-data-mono font-semibold text-xs text-surface">
                    R$ {selectedDebt.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-label-uppercase text-on-primary-container">
                    VENCIMENTO
                  </span>
                  <span className="font-data-mono font-semibold text-xs text-secondary-fixed">
                    {selectedDebt.dueDate} ({selectedDebt.daysOverdue}d)
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-label-uppercase text-on-primary-container">
                    VALOR ATUALIZADO
                  </span>
                  <span className="font-data-mono font-bold text-xs text-surface">
                    R$ {selectedDebt.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Responsável Atual */}
              <div className="flex items-center justify-between bg-primary-container/40 px-2.5 py-1.5 rounded text-xs text-on-primary-container mt-1">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-secondary-fixed">
                    support_agent
                  </span>
                  <span>Responsável: <strong>{selectedDebt.assignedTo.name}</strong></span>
                </span>
                <span className="px-2 py-0.5 rounded bg-surface/20 text-surface text-[10px] font-semibold">
                  {selectedDebt.statusLabel}
                </span>
              </div>
            </div>

            {/* Body: Dados Cadastrais + Histórico Permanente */}
            <div className="p-space-md flex flex-col gap-space-md overflow-y-auto max-h-[600px]">
              {/* Contato Principal do Devedor */}
              {selectedDebtor && (
                <div className="p-3 bg-surface-container-low rounded-lg text-xs space-y-1.5 border border-outline-variant/20">
                  <span className="text-[10px] font-label-uppercase text-outline font-bold block mb-1">
                    CONTATO PRINCIPAL / FINANCEIRO
                  </span>
                  <div className="font-semibold text-primary">{selectedDebtor.mainContact.name} ({selectedDebtor.mainContact.role})</div>
                  
                  {/* Telefones da Coleção Oficial do Devedor */}
                  {selectedDebtor.phones && selectedDebtor.phones.length > 0 ? (
                    <div className="flex flex-col gap-1 pt-0.5">
                      {selectedDebtor.phones
                        .filter((p) => p.active)
                        .map((ph) => (
                          <div key={ph.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-data-mono font-bold text-on-surface">
                                {ph.number}
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px] text-on-surface-variant font-medium">
                                {ph.type}
                              </span>
                              {ph.hasWhatsApp && (
                                <span className="inline-flex items-center text-emerald-700 font-bold text-[10px] gap-0.5" title="WhatsApp Ativo">
                                  <span className="material-symbols-outlined text-[13px]">chat</span>
                                  <span>WhatsApp</span>
                                </span>
                              )}
                            </div>
                            {ph.description && (
                              <span className="text-[10px] text-on-surface-variant truncate max-w-[120px]">
                                {ph.description}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (selectedDebtor.mainContact.phoneMobile || selectedDebtor.mainContact.phoneFixed) ? (
                    <div className="text-on-surface-variant flex items-center gap-3">
                      {selectedDebtor.mainContact.phoneFixed && <span>{selectedDebtor.mainContact.phoneFixed}</span>}
                      {selectedDebtor.mainContact.phoneMobile && (
                        <span className="text-secondary font-semibold">
                          {selectedDebtor.mainContact.phoneMobile} {selectedDebtor.mainContact.hasWhatsApp ? '(WhatsApp)' : ''}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-on-surface-variant italic py-0.5">
                      Nenhum telefone cadastrado.
                    </div>
                  )}

                  <div className="text-on-surface-variant font-mono text-[11px] pt-0.5">{selectedDebtor.mainContact.email}</div>
                </div>
              )}

              {/* Botão de Destaque para abrir a Ficha Oficial da Cobrança */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onSelectDebt(selectedDebt.id)}
                  className="w-full h-10 rounded-lg bg-secondary hover:bg-on-secondary-container text-on-secondary font-title-md text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_call</span>
                  <span>[ FAZ ] Abrir Ficha da Cobrança Completa</span>
                </button>

                {onOpenFastLogModal && (
                  <button
                    type="button"
                    onClick={() => onOpenFastLogModal(selectedDebt)}
                    className="w-full h-8 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-title-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/30"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_note</span>
                    <span>Registrar Contato Rápido</span>
                  </button>
                )}
              </div>

              {/* Histórico Permanente da Cobrança */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1">
                  <span className="font-label-uppercase text-outline font-bold text-[11px] uppercase">
                    Histórico Permanente ({selectedDebt.history.length})
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Preservação perpétua</span>
                </div>

                <div className="space-y-2">
                  {selectedDebt.history.map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 bg-surface-container-low rounded-lg text-xs border border-outline-variant/20 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-primary">{h.operatorName}</span>
                          <span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px]">
                            {h.channel}
                          </span>
                        </div>
                        <span className="font-data-mono text-[10px] text-on-surface-variant">
                          {h.dateFormatted} às {h.timeFormatted}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-secondary text-[11px]">{h.result}</span>
                        {h.attachedPromise && (
                          <span className="text-[10px] text-secondary font-semibold font-data-mono">
                            PTP R$ {h.attachedPromise.promisedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em {h.attachedPromise.promisedDate}
                          </span>
                        )}
                      </div>

                      {h.notes && (
                        <p className="text-on-surface-variant text-[11px] leading-relaxed mt-0.5">
                          {h.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-12 right-6 bg-primary text-surface px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 z-50 animate-fade-in text-xs font-medium">
          <span className="material-symbols-outlined text-secondary-fixed text-[18px]">
            verified
          </span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
