import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import { Debt, ContactChannel, ContactResult, ContactRegistrationPayload } from '../types';

interface MinhaCarteiraViewProps {
  onSelectDebt: (debtId: string) => void;
  onOpenFastLogModal?: (debt: Debt) => void;
}

export const MinhaCarteiraView: React.FC<MinhaCarteiraViewProps> = ({
  onSelectDebt,
  onOpenFastLogModal,
}) => {
  const { currentUser } = useAuth();
  const allDebts = debtService.getAllDebts();

  // Active Selected Debt for Drawer
  const [selectedDebtId, setSelectedDebtId] = useState<string>(allDebts[0]?.id || '10002');
  const [filterQuery, setFilterQuery] = useState('');
  const [activeFilterPill, setActiveFilterPill] = useState<
    'all' | 'delayed60' | 'promise' | 'return_today' | 'no_contact' | 'worked_today'
  >('all');
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);

  // Form State for Docked Drawer
  const selectedDebt = allDebts.find((d) => d.id === selectedDebtId) || allDebts[0];

  const [channel, setChannel] = useState<ContactChannel>('Ligação');
  const [result, setResult] = useState<ContactResult>('Prometeu pagar');
  const [contactPerson, setContactPerson] = useState('Dr. Marcos P. de Souza');
  const [notes, setNotes] = useState(
    'Cliente informou que o fluxo de caixa regulariza nesta sexta-feira e prometeu efetuar o pagamento do valor integral via transferência bancária. Solicitou retorno na segunda-feira pela manhã para confirmação do comprovante.'
  );

  const [hasPromise, setHasPromise] = useState(true);
  const [promisedDate, setPromisedDate] = useState('2024-11-18');
  const [promisedValue, setPromisedValue] = useState('9.370,10');

  const [hasPayment, setHasPayment] = useState(false);
  const [paymentDate, setPaymentDate] = useState('2024-11-04');
  const [receivedValue, setReceivedValue] = useState('9.370,10');

  const [hasReturn, setHasReturn] = useState(true);
  const [returnDate, setReturnDate] = useState('2024-11-11');
  const [returnTime, setReturnTime] = useState('09:30');
  const [returnReason, setReturnReason] = useState('Cliente pediu retorno');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filter debts based on pill & query
  const filteredDebts = allDebts.filter((d) => {
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
      return d.history.some((h) => h.dateFormatted.includes('04/11'));
    }

    return true;
  });

  const handleSelectDebtForDrawer = (d: Debt) => {
    setSelectedDebtId(d.id);
    const formatted = d.currentValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setPromisedValue(formatted);
    setReceivedValue(formatted);
    if (isDrawerCollapsed) {
      setIsDrawerCollapsed(false);
    }
  };

  const handleSaveContact = (goToNext: boolean = false) => {
    if (!selectedDebt || !currentUser) return;

    const payload: ContactRegistrationPayload = {
      channel,
      result,
      contactPerson,
      notes: notes || `Contato via ${channel} registrado por ${currentUser.name}.`,
      hasPromise: result === 'Prometeu pagar' || hasPromise,
      promisedDate,
      promisedValue: parseFloat(promisedValue.replace(/\./g, '').replace(',', '.')) || selectedDebt.currentValue,
      hasPayment: result === 'Pagou' || hasPayment,
      paymentDate,
      receivedValue: parseFloat(receivedValue.replace(/\./g, '').replace(',', '.')) || selectedDebt.currentValue,
      hasReturn,
      returnDate,
      returnTime,
      returnReason,
    };

    const res = debtService.registerContact(selectedDebt.id, payload, currentUser);

    if (res.success) {
      showToast(`Contato registrado com sucesso na Cobrança ${selectedDebt.titleNumber}!`);
      if (goToNext && res.nextDebtId) {
        setSelectedDebtId(res.nextDebtId);
      }
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
                  Operação Ativa
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                48 títulos ativos sob sua responsabilidade direta • ERP TOTVS Sync: há 4 min
              </p>
            </div>
          </div>

          {/* High-Frequency Batch Actions & Utilities */}
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

            <button
              onClick={() => showToast('Exibindo 10 de 10 colunas operacionais ativas.')}
              className="h-8 px-space-sm rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface transition-colors flex items-center gap-space-xs font-label-uppercase text-label-uppercase shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">view_column</span>
              <span>Colunas (10/10)</span>
            </button>

            <div className="h-6 w-px bg-surface-container-high mx-space-2xs hidden sm:block"></div>

            <div className="flex items-center bg-primary text-surface px-space-sm py-1 rounded-lg gap-space-xs font-data-mono text-data-mono">
              <span className="text-on-primary-container font-body-sm">Recuperado Mês:</span>
              <span className="font-semibold text-secondary-fixed">R$ 142.850,00</span>
            </div>
          </div>
        </div>

        {/* Search & Metric Badges Bar */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-sm pt-space-xs">
          {/* Universal Quick Finder */}
          <div className="relative w-full xl:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-[18px]">
              manage_search
            </span>
            <input
              className="w-full h-8 pl-9 pr-space-md bg-surface-container-low focus:bg-surface-container-lowest text-on-surface rounded-lg font-body-sm text-body-sm placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary-container shadow-inner border border-outline-variant/30"
              placeholder="Filtrar por Razão Social, CNPJ/CPF, Título ERP ou Contato..."
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
            <div className="absolute right-2 top-1.5 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-data-mono bg-surface-container-high text-on-surface-variant rounded">
                Ctrl+K
              </kbd>
            </div>
          </div>

          {/* Quick Triage Filter Pills */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveFilterPill('all')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
                activeFilterPill === 'all'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              }`}
              type="button"
            >
              <span>Todas</span>
              <span className="w-4 h-4 rounded-full bg-primary text-surface flex items-center justify-center text-[10px]">
                {allDebts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilterPill('delayed60')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors ${
                activeFilterPill === 'delayed60'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              }`}
              type="button"
            >
              <span>Atraso &gt;45 dias</span>
              <span className="px-1 rounded bg-error-container text-on-error-container font-data-mono text-[10px]">
                14
              </span>
            </button>

            <button
              onClick={() => setActiveFilterPill('promise')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors ${
                activeFilterPill === 'promise'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              }`}
              type="button"
            >
              <span>Com Promessa</span>
              <span className="px-1 rounded bg-secondary-container text-on-secondary-container font-data-mono text-[10px]">
                8
              </span>
            </button>

            <button
              onClick={() => setActiveFilterPill('return_today')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors ${
                activeFilterPill === 'return_today'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              }`}
              type="button"
            >
              <span>Retorno Hoje</span>
              <span className="px-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-data-mono text-[10px]">
                6
              </span>
            </button>

            <button
              onClick={() => setActiveFilterPill('no_contact')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors ${
                activeFilterPill === 'no_contact'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              }`}
              type="button"
            >
              <span>Sem Contato &gt;7d</span>
              <span className="px-1 rounded bg-surface-container-highest text-on-surface-variant font-data-mono text-[10px]">
                9
              </span>
            </button>

            <button
              onClick={() => setActiveFilterPill('worked_today')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 cursor-pointer transition-colors ${
                activeFilterPill === 'worked_today'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
              }`}
              type="button"
            >
              <span>Trabalhadas Hoje</span>
              <span className="px-1 rounded bg-surface-variant text-on-surface-variant font-data-mono text-[10px]">
                18
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Work Area: Split Panel (67% Table / 33% Docked Drawer) */}
      <div className="flex-1 flex flex-col xl:flex-row p-space-md gap-space-md items-start">
        {/* LEFT: High-Density Collections Table */}
        <div
          className={`w-full transition-all bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/30 ${
            isDrawerCollapsed ? 'xl:w-full' : 'xl:w-[67%]'
          }`}
        >
          {/* Table Functional Bar */}
          <div className="px-space-md py-space-xs bg-surface-container-low flex items-center justify-between text-on-surface-variant border-b border-outline-variant/20">
            <div className="flex items-center gap-space-sm">
              <input type="checkbox" className="w-3.5 h-3.5 rounded text-primary focus:ring-0 cursor-pointer" />
              <span className="font-label-uppercase text-label-uppercase uppercase text-xs">
                Visualizando {filteredDebts.length} de {allDebts.length} registros
              </span>
            </div>
            <div className="flex items-center gap-space-md font-body-sm text-body-sm">
              <span className="text-on-surface">
                Total em Carteira:{' '}
                <strong className="font-data-mono font-semibold text-primary">
                  R$ 584.220,18
                </strong>
              </span>
              <span className="text-on-surface hidden md:inline">
                PTP Confirmadas:{' '}
                <strong className="font-data-mono font-semibold text-secondary">
                  R$ 78.400,00
                </strong>
              </span>
              {isDrawerCollapsed && (
                <button
                  onClick={() => setIsDrawerCollapsed(false)}
                  className="px-2 py-0.5 rounded bg-primary text-surface font-label-uppercase text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  <span>Abrir Painel Lateral</span>
                </button>
              )}
            </div>
          </div>

          {/* Primary Data Grid */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface font-label-uppercase text-label-uppercase tracking-wider select-none sticky top-0 text-[11px]">
                  <th className="py-2.5 px-3 w-8 text-center">#</th>
                  <th className="py-2.5 px-3">Devedor &amp; CNPJ</th>
                  <th className="py-2.5 px-3">Título / Parc</th>
                  <th className="py-2.5 px-3">Vencimento &amp; Atraso</th>
                  <th className="py-2.5 px-3 text-right">Valor Original/Atual</th>
                  <th className="py-2.5 px-3">Situação</th>
                  <th className="py-2.5 px-3">Último Contato</th>
                  <th className="py-2.5 px-3">Próximo Retorno</th>
                  <th className="py-2.5 px-3 text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high font-body-sm text-body-sm">
                {filteredDebts.map((d) => {
                  const isSelected = selectedDebtId === d.id;

                  return (
                    <tr
                      key={d.id}
                      onClick={() => handleSelectDebtForDrawer(d)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-surface-container-high/70 border-l-4 border-primary'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectDebtForDrawer(d)}
                          className="w-3.5 h-3.5 rounded text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-title-md text-title-md font-semibold text-on-surface truncate max-w-[180px] group-hover:text-primary">
                              {d.debtorName}
                            </span>
                            <span className="px-1 py-0.2 rounded bg-surface-container-highest text-on-surface font-badge-sm text-badge-sm">
                              {d.debtorType}
                            </span>
                          </div>
                          <span className="font-data-mono text-[11px] text-on-surface-variant">
                            CNPJ: {d.debtorCnpjCpf} • COD: {d.erpCode}
                          </span>
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
                          <span className="font-data-mono font-semibold text-on-surface">
                            R$ {d.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="font-data-mono text-[10px] text-on-surface-variant">
                            + Juros R$ {d.interestFine.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        {d.status === 'promessa_firme' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-uppercase text-label-uppercase">
                            <span className="material-symbols-outlined text-[12px]">verified</span>{' '}
                            Promessa Firme
                          </span>
                        ) : d.status === 'retorno_agendado' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-uppercase text-label-uppercase">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>{' '}
                            Retorno Agendado
                          </span>
                        ) : d.status === 'quebrou_acordo' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-uppercase text-label-uppercase">
                            <span className="material-symbols-outlined text-[12px]">warning</span>{' '}
                            Quebrou Acordo
                          </span>
                        ) : d.status === 'pago' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-uppercase text-label-uppercase">
                            <span className="material-symbols-outlined text-[12px]">done_all</span>{' '}
                            Liquidado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-uppercase text-label-uppercase">
                            <span className="material-symbols-outlined text-[12px]">handshake</span>{' '}
                            Em Negociação
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5 text-on-surface">
                          <span className="material-symbols-outlined text-[15px] text-secondary">
                            {d.lastContact?.channel === 'WhatsApp' ? 'forum' : 'phone_in_talk'}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[11px]">
                              {d.lastContact?.date.includes('04/11') ? 'Hoje, 11:15' : d.lastContact?.date || '-'}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-data-mono">
                              {d.lastContact?.operatorName || 'Carlos E.'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        {d.nextReturn ? (
                          <div className="flex items-center gap-1 text-tertiary">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            <span className="font-data-mono text-[11px] font-semibold">
                              {d.nextReturn.date.slice(5)} {d.nextReturn.time}
                            </span>
                          </div>
                        ) : (
                          <span className="font-data-mono text-[11px] text-on-surface-variant">
                            Sem agend.
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectDebt(d.id)}
                            className="px-2 h-7 rounded bg-primary text-surface font-label-uppercase text-label-uppercase flex items-center gap-1 shadow-sm hover:bg-primary-container transition-colors cursor-pointer"
                            title="Abrir Ficha Completa da Cobrança"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">folder_open</span>
                            <span>Ficha</span>
                          </button>

                          <button
                            onClick={() => onOpenFastLogModal?.(d)}
                            className="w-7 h-7 rounded bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary flex items-center justify-center transition-colors cursor-pointer"
                            title="Registrar Ocorrência Rápida"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit_note</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="px-space-md py-space-xs bg-surface-container-lowest border-t border-outline-variant/30 flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
            <div className="flex items-center gap-space-sm">
              <span>Linhas por página:</span>
              <select className="h-6 bg-surface-container-low rounded text-on-surface font-data-mono text-[11px] px-1 focus:ring-0 border border-outline-variant/30">
                <option>25</option>
                <option defaultValue="50">50</option>
                <option>100</option>
              </select>
              <span className="font-data-mono">Página 1 de 2 ({allDebts.length} títulos)</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="h-7 w-7 rounded bg-surface-container-low flex items-center justify-center text-on-surface-variant opacity-50 cursor-not-allowed"
                type="button"
                disabled
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button className="h-7 px-2.5 rounded bg-primary text-surface font-data-mono text-[11px] font-semibold" type="button">
                1
              </button>
              <button className="h-7 px-2.5 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-data-mono text-[11px] cursor-pointer" type="button">
                2
              </button>
              <button className="h-7 w-7 rounded bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface cursor-pointer" type="button">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Persistent Docked Drawer (Fast Log & PTP Scheduler) */}
        {!isDrawerCollapsed && selectedDebt && (
          <div className="w-full xl:w-[33%] bg-surface-container-lowest rounded-xl shadow-md overflow-hidden flex flex-col transition-all border border-outline-variant/30">
            {/* Top: Contexto da Cobrança */}
            <div className="p-space-md bg-primary text-surface flex flex-col gap-space-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 font-data-mono text-[10px] text-surface-variant">
                  <span className="material-symbols-outlined text-[14px] text-secondary-fixed">
                    account_tree
                  </span>
                  <span>Devedor</span>
                  <span className="text-outline-variant">›</span>
                  <span className="text-secondary-fixed font-semibold">
                    Cobrança {selectedDebt.titleNumber}
                  </span>
                  <span className="text-outline-variant">›</span>
                  <span>Registro de Histórico</span>
                </div>
                <button
                  onClick={() => setIsDrawerCollapsed(true)}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-primary-container text-surface transition-colors cursor-pointer"
                  title="Recolher Painel Lateral"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">close_fullscreen</span>
                </button>
              </div>

              <div className="pt-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-headline-sm font-semibold tracking-tight text-surface truncate">
                    {selectedDebt.debtorName}
                  </h2>
                  <button
                    onClick={() => onSelectDebt(selectedDebt.id)}
                    className="text-[11px] text-secondary-fixed underline hover:text-surface shrink-0 ml-2"
                  >
                    Ver Ficha Completa
                  </button>
                </div>
                <div className="flex items-center justify-between text-on-primary-container text-body-sm font-data-mono mt-0.5">
                  <span>CNPJ: {selectedDebt.debtorCnpjCpf}</span>
                  <span className="text-secondary-fixed font-semibold bg-surface/10 px-2 py-0.5 rounded text-[11px]">
                    Cobrança Título {selectedDebt.titleNumber} ({selectedDebt.installment})
                  </span>
                </div>
              </div>

              {/* Painel de Valores e Vencimento */}
              <div className="grid grid-cols-3 gap-2 mt-2 bg-primary-container/80 p-2 rounded-lg text-center border border-surface/10">
                <div>
                  <span className="block text-[10px] font-label-uppercase text-on-primary-container">
                    VALOR ORIGINAL
                  </span>
                  <span className="font-data-mono font-semibold text-[12px] text-surface">
                    R$ {selectedDebt.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-label-uppercase text-on-primary-container">
                    VENCIMENTO
                  </span>
                  <span className="font-data-mono font-semibold text-[12px] text-secondary-fixed">
                    {selectedDebt.dueDate} ({selectedDebt.daysOverdue}d)
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-label-uppercase text-on-primary-container">
                    VALOR ATUALIZADO
                  </span>
                  <span className="font-data-mono font-semibold text-[12px] text-surface">
                    R$ {selectedDebt.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Operador Automático (Identificação Fixo sem campo de seleção manual) */}
              <div className="flex items-center justify-between bg-primary-container/40 px-2.5 py-1 rounded text-[11px] text-on-primary-container mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-secondary-fixed">
                    badge
                  </span>
                  <span>
                    Responsável:{' '}
                    <strong className="text-surface font-semibold">
                      {currentUser?.name || 'Carlos Eduardo'}
                    </strong>{' '}
                    ({currentUser?.roleTitle || 'Cobrador Sênior'})
                  </span>
                </div>
                <span className="text-[10px] text-secondary-fixed bg-primary px-1.5 py-0.5 rounded">
                  Registrado auto pelo sistema
                </span>
              </div>
            </div>

            {/* Formulário Dinâmico de Registro de Contato */}
            <form
              className="p-space-md flex flex-col gap-space-md bg-surface-container-lowest"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveContact(false);
              }}
            >
              {/* Seção 1: Canal de Contato */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-uppercase text-label-uppercase text-on-surface-variant font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-secondary">hub</span>
                    <span>Canal de Contato</span>
                  </label>
                  <span className="text-[10px] text-on-surface-variant font-data-mono">
                    Seleção Única
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Ligação', icon: 'call' },
                    { label: 'WhatsApp', icon: 'chat' },
                    { label: 'Mensagem', icon: 'sms' },
                    { label: 'Áudio', icon: 'mic' },
                    { label: 'E-mail', icon: 'mail' },
                    { label: 'Serasa', icon: 'verified_user' },
                    { label: 'Outro', icon: 'more_horiz' },
                  ].map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => setChannel(c.label as ContactChannel)}
                      className={`h-8 rounded flex items-center justify-center gap-1 font-body-sm text-body-sm transition-all shadow-sm cursor-pointer ${
                        channel === c.label
                          ? 'bg-primary text-surface font-semibold'
                          : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                      } ${c.label === 'Outro' ? 'col-span-2' : ''}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">{c.icon}</span>
                      <span className="text-[11px] font-semibold">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seção 2: Resultado do Contato */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-uppercase text-label-uppercase text-on-surface-variant font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-secondary">
                      fact_check
                    </span>
                    <span>Resultado do Contato</span>
                  </label>
                  <span className="text-[10px] text-secondary font-semibold font-data-mono">
                    Campo Obrigatório
                  </span>
                </div>

                <div className="relative">
                  <select
                    className="w-full h-8 pl-2.5 pr-8 bg-surface-container-low rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary-container appearance-none cursor-pointer font-semibold border border-outline-variant/30"
                    value={result}
                    onChange={(e) => setResult(e.target.value as ContactResult)}
                  >
                    <option value="Prometeu pagar">Prometeu pagar</option>
                    <option value="Vai pagar">Vai pagar</option>
                    <option value="Pagou">Pagou</option>
                    <option value="Solicitou retorno">Solicitou retorno</option>
                    <option value="Não atende">Não atende</option>
                    <option value="Não responde">Não responde</option>
                    <option value="Não possui WhatsApp">Não possui WhatsApp</option>
                    <option value="Mensagem enviada">Mensagem enviada</option>
                    <option value="Áudio enviado">Áudio enviado</option>
                    <option value="Ligação realizada">Ligação realizada</option>
                    <option value="Contestação">Contestação</option>
                    <option value="Enviado para Serasa">Enviado para Serasa</option>
                    <option value="Outro">Outro</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2 text-on-surface-variant text-[16px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Seção 3: Condicional - Promessa de Pagamento */}
              <div className="p-space-sm rounded-lg bg-surface-container-low border-l-2 border-secondary flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      handshake
                    </span>
                    <span className="font-title-md text-title-md font-semibold text-secondary">
                      Promessa de Pagamento
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-uppercase text-[10px] font-semibold">
                    Condicional Ativa
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-space-sm pt-1">
                  <div className="flex flex-col gap-1">
                    <span className="font-label-uppercase text-[10px] text-on-surface-variant font-semibold">
                      DATA PROMETIDA
                    </span>
                    <input
                      className="h-8 px-2 bg-surface-container-lowest rounded font-data-mono text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary border border-outline-variant/30"
                      type="date"
                      value={promisedDate}
                      onChange={(e) => setPromisedDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-label-uppercase text-[10px] text-on-surface-variant font-semibold">
                      VALOR PROMETIDO
                    </span>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-[11px] font-data-mono text-on-surface-variant font-semibold">
                        R$
                      </span>
                      <input
                        className="h-8 pl-8 pr-2 w-full bg-surface-container-lowest rounded font-data-mono text-body-sm text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-secondary border border-outline-variant/30"
                        type="text"
                        value={promisedValue}
                        onChange={(e) => setPromisedValue(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant flex items-center gap-1 pt-0.5">
                  <span className="material-symbols-outlined text-[13px] text-secondary">info</span>
                  <span>
                    Promessa vinculada à Cobrança {selectedDebt.titleNumber} sob responsabilidade de{' '}
                    {currentUser?.name}.
                  </span>
                </p>
              </div>

              {/* Seção 4: Condicional - Pagamento Recebido (se selecionado Pagou) */}
              {result === 'Pagou' && (
                <div className="p-space-sm rounded-lg bg-surface-container-low border-l-2 border-primary-container flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        payments
                      </span>
                      <span className="font-title-md text-title-md font-semibold text-primary">
                        Pagamento Recebido
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-uppercase text-[10px]">
                      Exibido se 'Pagou'
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-space-sm pt-1">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-uppercase text-[10px] text-on-surface-variant font-semibold">
                        DATA DO PAGAMENTO
                      </span>
                      <input
                        className="h-8 px-2 bg-surface-container-lowest rounded font-data-mono text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container border border-outline-variant/30"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-label-uppercase text-[10px] text-on-surface-variant font-semibold">
                        VALOR RECEBIDO <strong className="text-error">*</strong>
                      </span>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-[11px] font-data-mono text-on-surface-variant font-semibold">
                          R$
                        </span>
                        <input
                          className="h-8 pl-8 pr-2 w-full bg-surface-container-lowest rounded font-data-mono text-body-sm text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-primary-container border border-outline-variant/30"
                          type="text"
                          value={receivedValue}
                          onChange={(e) => setReceivedValue(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-on-surface-variant flex items-center gap-1 pt-0.5">
                    <span className="material-symbols-outlined text-[13px] text-secondary">
                      check_circle
                    </span>
                    <span>
                      O valor recebido é registrado para a conciliação desta cobrança e alimentará o Relatório Diário.
                    </span>
                  </p>
                </div>
              )}

              {/* Seção 5: Agendamento de Próximo Retorno */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasReturn}
                      onChange={(e) => setHasReturn(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-primary focus:ring-0 cursor-pointer"
                    />
                    <span className="font-label-uppercase text-label-uppercase text-on-surface font-semibold">
                      Agendar próximo retorno
                    </span>
                  </label>
                  <span className="text-[10px] text-on-tertiary-container font-semibold">
                    Agenda Integrada
                  </span>
                </div>

                {hasReturn && (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-space-sm">
                      <input
                        className="w-full h-8 px-2 bg-surface-container-low rounded font-data-mono text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container border border-outline-variant/30"
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                      />
                      <input
                        className="w-full h-8 px-2 bg-surface-container-low rounded font-data-mono text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container border border-outline-variant/30"
                        type="time"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <select
                        className="w-full h-8 pl-2.5 pr-8 bg-surface-container-low rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary-container appearance-none cursor-pointer border border-outline-variant/30"
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                      >
                        <option value="Cliente pediu retorno">Cliente pediu retorno</option>
                        <option value="Confirmar pagamento">Confirmar pagamento</option>
                        <option value="Acompanhar promessa">Acompanhar promessa</option>
                        <option value="Negociação">Negociação</option>
                        <option value="Enviar informação/documento">Enviar informação/documento</option>
                        <option value="Nova tentativa de contato">Nova tentativa de contato</option>
                        <option value="Outro">Outro</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-2 top-2 text-on-surface-variant text-[16px] pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 6: Descrição do contato / observação */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-uppercase text-label-uppercase text-on-surface-variant font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-secondary">
                      edit_note
                    </span>
                    <span>Descrição do contato / observação</span>
                  </label>
                  <span className="text-[10px] font-data-mono text-on-surface-variant">
                    Auditável
                  </span>
                </div>
                <textarea
                  className="w-full p-2 bg-surface-container-low rounded font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container resize-none leading-relaxed border border-outline-variant/30"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <p className="text-[10px] text-on-surface-variant">
                  Fará parte do histórico permanente e auditável da cobrança.
                </p>
              </div>

              {/* Seção 7: Ações e Botões */}
              <div className="pt-space-xs flex flex-col gap-2">
                <button
                  className="w-full h-10 px-space-md rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-title-md font-semibold transition-all flex items-center justify-center gap-space-sm shadow-md cursor-pointer"
                  type="submit"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
                    save
                  </span>
                  <span>Salvar contato</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 h-8 rounded bg-secondary hover:bg-secondary-container hover:text-on-secondary-container text-on-secondary font-label-uppercase text-label-uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer font-semibold"
                    type="button"
                    onClick={() => handleSaveContact(true)}
                  >
                    <span className="material-symbols-outlined text-[14px]">skip_next</span>
                    <span>Salvar e ir para próxima cobrança</span>
                  </button>
                  <button
                    className="h-8 px-3 rounded bg-surface-container hover:bg-surface-variant text-on-surface-variant font-label-uppercase text-label-uppercase transition-colors cursor-pointer"
                    type="button"
                    onClick={() => setIsDrawerCollapsed(true)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>

            {/* Seção 8: Históricos Anteriores Desta Cobrança */}
            <div className="p-space-sm bg-surface-container flex flex-col gap-space-xs border-t border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-uppercase text-[11px] font-semibold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    history
                  </span>
                  <span>Últimos Históricos Desta Cobrança</span>
                </span>
                <span className="text-[10px] font-data-mono text-on-surface-variant">
                  {selectedDebt.history.length} registros
                </span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                {selectedDebt.history.slice(0, 3).map((h) => (
                  <div
                    key={h.id}
                    className="p-1.5 rounded bg-surface-container-lowest text-[11px] flex flex-col gap-0.5 shadow-xs border border-outline-variant/20"
                  >
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-data-mono">
                      <span>
                        {h.dateFormatted} às {h.timeFormatted} • {h.operatorName}
                      </span>
                      <span className="px-1 rounded bg-secondary-container text-on-secondary-container font-semibold">
                        {h.channel}
                      </span>
                    </div>
                    <p className="text-on-surface leading-tight">{h.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Productivity HUD Strip */}
      <div className="fixed bottom-0 left-64 right-0 px-space-lg py-space-xs bg-surface-container-high text-on-surface flex flex-col sm:flex-row items-center justify-between text-body-sm font-data-mono gap-space-xs border-t border-outline-variant/30 z-30">
        <div className="flex items-center gap-space-md text-[11px]">
          <span className="flex items-center gap-1 text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            Operador Conectado: <strong>{currentUser?.name || 'Carlos Eduardo'} ({currentUser?.badgeCode || 'RC-4412'})</strong>
          </span>
          <span className="text-on-surface-variant">•</span>
          <span className="text-on-surface-variant">
            Tempo Médio p/ Contato: <strong>2m 45s</strong>
          </span>
          <span className="text-on-surface-variant">•</span>
          <span className="text-on-surface-variant">
            Sucesso Hoje: <strong className="text-secondary">75%</strong>
          </span>
        </div>
        <div className="flex items-center gap-space-sm text-[11px] text-on-surface-variant">
          <span>Atalhos de Teclado:</span>
          <span className="bg-surface-container-lowest px-1.5 py-0.5 rounded text-on-surface shadow-xs">
            Alt + D (Discar)
          </span>
          <span className="bg-surface-container-lowest px-1.5 py-0.5 rounded text-on-surface shadow-xs">
            Alt + W (WhatsApp)
          </span>
          <span className="bg-surface-container-lowest px-1.5 py-0.5 rounded text-on-surface shadow-xs">
            Ctrl + Enter (Salvar)
          </span>
        </div>
      </div>

      {/* Toast confirmation */}
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
