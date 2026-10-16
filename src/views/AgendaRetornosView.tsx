import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import { Debt, ScheduledReturnRecord } from '../types';
import {
  parseDateString,
  formatDateBR,
  isSameDay,
  isWithinNextDays,
  getShortMonthName,
} from '../utils/dateUtils';

interface AgendaRetornosViewProps {
  onSelectDebt: (debtId: string) => void;
  onOpenFastLog: (debt: Debt) => void;
}

export const AgendaRetornosView: React.FC<AgendaRetornosViewProps> = ({
  onSelectDebt,
  onOpenFastLog,
}) => {
  const { currentUser } = useAuth();
  const [filterDate, setFilterDate] = useState<'hoje' | 'semana' | 'todos'>('hoje');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Inscrição reativa aos eventos do debtService para atualização em tempo real
  const [, setTick] = useState(0);
  useEffect(() => {
    return debtService.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Data operacional de referência (e.g. '04/11/2024') e data real do sistema
  const opDateStr = debtService.getCurrentDate();
  const refDate = useMemo(() => parseDateString(opDateStr) || new Date(), [opDateStr]);
  const realToday = useMemo(() => new Date(), []);

  // Rótulo dinâmico do botão "Hoje", calculado a partir da data de operação
  const hojeBtnLabel = useMemo(() => {
    const day = String(refDate.getDate()).padStart(2, '0');
    const month = getShortMonthName(refDate.getMonth());
    return `Hoje (${day}/${month})`;
  }, [refDate]);

  // Recupera todos os agendamentos individuais de retorno do usuário
  const allScheduledReturns = useMemo(() => {
    return debtService.getScheduledReturnsForUser(currentUser);
  }, [currentUser, setTick]);

  // Filtra os retornos de acordo com o filtro selecionado (Hoje, Próximos 7 Dias, Todos)
  const filteredReturns = useMemo(() => {
    return allScheduledReturns.filter(({ returnItem }) => {
      if (filterDate === 'todos') return true;

      const itemDate = parseDateString(returnItem.date);
      if (!itemDate) return true;

      const isToday = isSameDay(itemDate, refDate) || isSameDay(itemDate, realToday);

      if (filterDate === 'hoje') {
        return isToday;
      }

      if (filterDate === 'semana') {
        return (
          isWithinNextDays(itemDate, refDate, 7) ||
          isWithinNextDays(itemDate, realToday, 7)
        );
      }

      return true;
    }).sort((a, b) => {
      const dateA = parseDateString(a.returnItem.date)?.getTime() || 0;
      const dateB = parseDateString(b.returnItem.date)?.getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      return (a.returnItem.time || '').localeCompare(b.returnItem.time || '');
    });
  }, [allScheduledReturns, filterDate, refDate, realToday]);

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-16">
      {/* Header com Resumo Dinâmico e Filtros Funcionais */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="material-symbols-outlined text-on-tertiary-container text-[24px]">
              calendar_clock
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Agenda de Retornos e Callbacks
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-badge-sm text-badge-sm font-semibold">
              {filteredReturns.length}{' '}
              {filteredReturns.length === 1 ? 'Retorno Programado' : 'Retornos Programados'}
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Cronograma priorizado de recontato aos clientes, confirmação de comprovantes bancários e acompanhamento de promessas de pagamento.
          </p>
        </div>

        {/* Barra de Filtros por Período */}
        <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 shrink-0">
          <button
            onClick={() => setFilterDate('hoje')}
            className={`px-3 py-1.5 rounded font-label-uppercase text-xs font-semibold cursor-pointer transition-colors ${
              filterDate === 'hoje'
                ? 'bg-surface-container-lowest shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Exibir retornos agendados para a data de hoje"
          >
            {hojeBtnLabel}
          </button>
          <button
            onClick={() => setFilterDate('semana')}
            className={`px-3 py-1.5 rounded font-label-uppercase text-xs font-semibold cursor-pointer transition-colors ${
              filterDate === 'semana'
                ? 'bg-surface-container-lowest shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Exibir retornos agendados para os próximos 7 dias"
          >
            Próximos 7 Dias
          </button>
          <button
            onClick={() => setFilterDate('todos')}
            className={`px-3 py-1.5 rounded font-label-uppercase text-xs font-semibold cursor-pointer transition-colors ${
              filterDate === 'todos'
                ? 'bg-surface-container-lowest shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Exibir todos os retornos agendados"
          >
            Todos ({allScheduledReturns.length})
          </button>
        </div>
      </div>

      {/* Grid de Retornos Agendados ou Estado Vazio Informativo */}
      {filteredReturns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
          {filteredReturns.map(({ debt, returnItem }, index) => {
            const displayDate = formatDateBR(returnItem.date);
            const itemDate = parseDateString(returnItem.date);
            const isLate =
              itemDate &&
              itemDate.getTime() < refDate.getTime() &&
              itemDate.getTime() < realToday.getTime() &&
              !isSameDay(itemDate, refDate);

            return (
              <div
                key={`${debt.id}-${returnItem.id || index}`}
                className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3 hover:border-secondary transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="px-2.5 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-data-mono font-bold text-sm shrink-0">
                      {returnItem.time || '09:30'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-title-md font-semibold text-primary truncate" title={debt.debtorName}>
                        {debt.debtorName}
                      </h3>
                      <span className="text-xs text-on-surface-variant font-data-mono block truncate">
                        Título {debt.titleNumber} ({debt.installment}) • R${' '}
                        {debt.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-data-mono text-[11px] font-semibold">
                      {displayDate}
                    </span>
                    {isLate && (
                      <span className="px-1.5 py-0.2 rounded bg-error/10 text-error font-label-uppercase text-[9px] font-bold">
                        Atrasado
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-surface-container-low rounded-lg text-xs flex items-start gap-2 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[16px] text-on-tertiary-container shrink-0 mt-0.5">
                    schedule
                  </span>
                  <p className="text-on-surface leading-tight">
                    <strong className="text-primary font-semibold">Motivo do Retorno:</strong>{' '}
                    {returnItem.reason || 'Acompanhar promessa e confirmação de pagamento'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs flex-wrap gap-2">
                  <span className="text-outline text-[11px]">
                    Responsável: <strong>{returnItem.responsibleName || debt.assignedTo.name}</strong>
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectDebt(debt.id)}
                      className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-variant text-on-surface font-label-uppercase text-[10px] font-semibold cursor-pointer transition-colors"
                      title="Abrir Ficha completa desta cobrança"
                    >
                      Ver Ficha
                    </button>
                    <button
                      onClick={() => onOpenFastLog(debt)}
                      className="px-3 py-1 rounded bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-uppercase text-[10px] font-semibold flex items-center gap-1 cursor-pointer shadow-2xs transition-all"
                      title="Iniciar contato telefônico ou WhatsApp com o devedor"
                    >
                      <span className="material-symbols-outlined text-[13px]">phone_in_talk</span>
                      <span>Iniciar Contato</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Estado Vazio Informativo */
        <div className="bg-surface-container-lowest rounded-xl p-12 text-center border border-outline-variant/30 flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px]">event_busy</span>
          </div>
          <div className="max-w-md">
            <h3 className="font-title-md font-bold text-primary text-base">
              Nenhum retorno programado encontrado
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              {filterDate === 'hoje'
                ? `Não existem retornos agendados para a data de hoje (${hojeBtnLabel.replace('Hoje ', '')}). Alterne para "Próximos 7 Dias" ou "Todos" para visualizar outros períodos.`
                : filterDate === 'semana'
                ? 'Nenhum retorno programado para os próximos 7 dias. Você pode agendar novos retornos na Minha Carteira ou na Ficha da Cobrança.'
                : 'Nenhum retorno agendado em sua carteira no momento.'}
            </p>
          </div>
          {filterDate !== 'todos' && (
            <button
              onClick={() => setFilterDate('todos')}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-variant text-primary text-xs font-semibold cursor-pointer transition-colors border border-outline-variant/30"
            >
              Ver todos os retornos ({allScheduledReturns.length})
            </button>
          )}
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-primary text-surface px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 z-50 animate-bounce text-xs font-medium">
          <span className="material-symbols-outlined text-secondary-fixed text-[18px]">
            check_circle
          </span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
