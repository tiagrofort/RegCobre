import React, { useState } from 'react';
import { debtService } from '../services/debtService';
import { Debt } from '../types';

interface AgendaRetornosViewProps {
  onSelectDebt: (debtId: string) => void;
  onOpenFastLog: (debt: Debt) => void;
}

export const AgendaRetornosView: React.FC<AgendaRetornosViewProps> = ({
  onSelectDebt,
  onOpenFastLog,
}) => {
  const debts = debtService.getAllDebts();
  const [filterDate, setFilterDate] = useState<'hoje' | 'semana' | 'todos'>('hoje');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const debtsWithReturns = debts.filter((d) => d.scheduledReturns.length > 0 || !!d.nextReturn);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-16">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-tertiary-container text-[24px]">
              calendar_clock
            </span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Agenda de Retornos e Callbacks
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-badge-sm text-badge-sm">
              6 Retornos Programados
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Cronograma priorizado de recontato aos clientes, confirmação de comprovantes bancários e acompanhamento de promessas de pagamento.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-lg border border-outline-variant/30">
          <button
            onClick={() => setFilterDate('hoje')}
            className={`px-3 py-1 rounded font-label-uppercase text-xs font-semibold cursor-pointer ${
              filterDate === 'hoje'
                ? 'bg-surface-container-lowest shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Hoje (04/Nov)
          </button>
          <button
            onClick={() => setFilterDate('semana')}
            className={`px-3 py-1 rounded font-label-uppercase text-xs font-semibold cursor-pointer ${
              filterDate === 'semana'
                ? 'bg-surface-container-lowest shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Próximos 7 Dias
          </button>
          <button
            onClick={() => setFilterDate('todos')}
            className={`px-3 py-1 rounded font-label-uppercase text-xs font-semibold cursor-pointer ${
              filterDate === 'todos'
                ? 'bg-surface-container-lowest shadow-sm text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Returns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {debtsWithReturns.map((d) => {
          const ret = d.nextReturn || d.scheduledReturns[0];

          return (
            <div
              key={d.id}
              className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3 hover:border-secondary transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-data-mono font-bold text-sm">
                    {ret?.time || '09:30'}
                  </div>
                  <div>
                    <h3 className="font-title-md font-semibold text-primary">{d.debtorName}</h3>
                    <span className="text-xs text-on-surface-variant font-data-mono">
                      Título {d.titleNumber} ({d.installment}) • R${' '}
                      {d.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-badge-sm text-[10px]">
                  {ret?.date || '04/11/2024'}
                </span>
              </div>

              <div className="p-3 bg-surface-container-low rounded-lg text-xs flex items-start gap-2 border border-outline-variant/20">
                <span className="material-symbols-outlined text-[16px] text-on-tertiary-container shrink-0">
                  schedule
                </span>
                <p className="text-on-surface leading-tight">
                  <strong className="text-primary font-semibold">Motivo do Retorno:</strong>{' '}
                  {ret?.reason || 'Acompanhar promessa e confirmação de pagamento'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-outline">
                  Responsável: <strong>{d.assignedTo.name}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectDebt(d.id)}
                    className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-variant text-on-surface font-label-uppercase text-[10px] font-semibold cursor-pointer"
                  >
                    Ver Ficha
                  </button>
                  <button
                    onClick={() => onOpenFastLog(d)}
                    className="px-3 py-1 rounded bg-secondary hover:bg-on-secondary-container text-on-secondary font-label-uppercase text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
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
