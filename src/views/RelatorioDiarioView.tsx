import React, { useState } from 'react';
import { debtService } from '../services/debtService';
import { useAuth } from '../context/AuthContext';

export const RelatorioDiarioView: React.FC = () => {
  const { currentUser } = useAuth();
  const debts = debtService.getAllDebts();
  const [selectedDate] = useState('04/11/2024');

  // Collect all history items with today's date
  const todayInteractions = debts.flatMap((d) =>
    d.history
      .filter((h) => h.dateFormatted.includes('04/11'))
      .map((h) => ({
        ...h,
        debtTitle: d.titleNumber,
        debtorName: d.debtorName,
        debtCurrentValue: d.currentValue,
      }))
  );

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-16">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">description</span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Relatório Diário Operacional
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-badge-sm text-badge-sm">
              Dia {selectedDate}
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Resumo analítico das ações realizadas hoje, desfechos de atendimento e novos compromissos registrados pelo cobrador.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="h-8 px-4 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimir Resumo Diário</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
          <span className="text-[10px] font-label-uppercase text-outline font-bold">
            TOTAL DE CONTATOS HOJE
          </span>
          <div className="font-headline-md font-bold text-primary font-data-mono mt-1">
            18 contatos
          </div>
          <span className="text-[11px] text-secondary font-semibold">51% da meta de 35</span>
        </div>

        <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
          <span className="text-[10px] font-label-uppercase text-secondary font-bold">
            PAGAMENTOS CONFIRMADOS
          </span>
          <div className="font-headline-md font-bold text-secondary font-data-mono mt-1">
            R$ 25.790,00
          </div>
          <span className="text-[11px] text-secondary font-semibold">2 liquidações TOTVS</span>
        </div>

        <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
          <span className="text-[10px] font-label-uppercase text-outline font-bold">
            PROMESSAS OBTIDAS
          </span>
          <div className="font-headline-md font-bold text-primary font-data-mono mt-1">
            R$ 9.370,10
          </div>
          <span className="text-[11px] text-outline font-semibold">1 novo acordo PTP</span>
        </div>

        <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
          <span className="text-[10px] font-label-uppercase text-outline font-bold">
            OPERADOR LOGADO
          </span>
          <div className="font-headline-md font-bold text-primary truncate mt-1">
            {currentUser?.name || 'Carlos Eduardo'}
          </div>
          <span className="text-[11px] text-outline font-semibold">
            {currentUser?.roleTitle || 'Cobrador Sênior'}
          </span>
        </div>
      </div>

      {/* Timeline of Today's Activities */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
          <h3 className="font-title-md font-bold text-primary">
            Registro Cronológico das Interações de Hoje
          </h3>
          <span className="text-xs text-on-surface-variant font-data-mono">
            {todayInteractions.length} ações registradas
          </span>
        </div>

        <div className="divide-y divide-surface-container-high">
          {todayInteractions.map((item) => (
            <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="px-2 py-1 rounded bg-surface-container text-on-surface font-data-mono text-xs font-bold">
                  {item.timeFormatted}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary text-sm">{item.debtorName}</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-[10px] font-data-mono">
                      Título {item.debtTitle}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container font-badge-sm text-[10px]">
                      {item.channel}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{item.notes}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="px-2 py-0.5 rounded bg-surface-container-low text-primary font-badge-sm text-[11px] font-semibold block">
                  {item.result}
                </span>
                <span className="text-[10px] text-outline font-data-mono mt-1 block">
                  Por: {item.operatorName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
