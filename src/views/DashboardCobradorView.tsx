import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import { Debt } from '../types';

interface DashboardCobradorViewProps {
  onSelectDebt: (debtId: string) => void;
  onOpenFastLog: (debt: Debt) => void;
  onNavigateToPortfolio: () => void;
  onOpenFinishModal: () => void;
}

export const DashboardCobradorView: React.FC<DashboardCobradorViewProps> = ({
  onSelectDebt,
  onOpenFastLog,
  onNavigateToPortfolio,
  onOpenFinishModal,
}) => {
  const { currentUser } = useAuth();
  const producao = debtService.getProducaoDoDia();
  const agenda = debtService.getAgendaDoDia();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartQueue = () => {
    const proxima = debtService.getProximaCobrancaPendente();
    if (proxima) {
      showToast(`Iniciando trabalho de hoje: Abrindo cobrança ${proxima.titleNumber} (${proxima.debtorName})...`);
      setTimeout(() => {
        onSelectDebt(proxima.id);
      }, 700);
    } else {
      showToast('Todas as cobranças da sua fila já foram trabalhadas hoje!');
    }
  };

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-16">
      {/* 1. TOPO: PRODUÇÃO DO DIA & COCKPIT OPERACIONAL */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg border border-outline-variant/30">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-label-uppercase text-label-uppercase text-secondary font-bold uppercase tracking-wider">
              Trabalho de Hoje • Operação Ativa
            </span>
            <span className="text-on-surface-variant font-label-uppercase text-label-uppercase">•</span>
            <span className="font-data-mono text-body-sm text-on-surface-variant font-semibold">
              {producao.date}
            </span>
          </div>

          <div className="flex items-baseline gap-space-sm flex-wrap mt-0.5">
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Bom dia, {currentUser?.name || 'Carlos Eduardo'}!
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Você tem{' '}
              <strong className="text-primary font-bold">{producao.pendentes} cobranças pendentes</strong>{' '}
              para trabalhar hoje de um total de{' '}
              <span className="font-semibold text-primary">{producao.previstas} previstas</span>.
            </p>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center flex-wrap gap-space-sm">
          <button
            onClick={handleStartQueue}
            className="h-10 px-space-lg bg-primary hover:bg-primary-container text-surface rounded-lg shadow-sm flex items-center gap-space-xs font-title-md text-title-md transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
              play_circle
            </span>
            <span>Trabalhar Próxima Cobrança (FAZ)</span>
          </button>

          <button
            onClick={onOpenFinishModal}
            className="h-10 px-space-md bg-surface-container hover:bg-surface-variant text-on-surface rounded-lg font-title-md text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/30"
            type="button"
            title="Encerrar a produção do dia e transferir pendências para amanhã"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              done_all
            </span>
            <span>Finalizar Dia (FINISH)</span>
          </button>
        </div>
      </div>

      {/* 2. INDICADORES DA PRODUÇÃO DIÁRIA (CLAROS, GRANDES E SCANNABLE) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-md">
        {/* Card 1: Previstas no Dia */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="font-label-uppercase text-outline font-bold text-xs uppercase">
            Previstas no Dia
          </span>
          <div className="mt-2">
            <span className="font-headline-lg font-bold font-data-mono text-primary">
              {producao.previstas}
            </span>
            <span className="block text-xs text-on-surface-variant mt-0.5">
              Meta: {producao.metaDiaria} contatos
            </span>
          </div>
        </div>

        {/* Card 2: Trabalhadas Hoje */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-secondary/30 bg-secondary-container/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-uppercase text-secondary font-bold text-xs uppercase">
              Trabalhadas
            </span>
            <span className="font-data-mono font-bold text-secondary text-xs">
              {producao.percentualRealizado}%
            </span>
          </div>
          <div className="mt-2">
            <span className="font-headline-lg font-bold font-data-mono text-secondary">
              {producao.trabalhadas}
            </span>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-secondary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(producao.percentualRealizado, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Pendentes no Dia */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="font-label-uppercase text-outline font-bold text-xs uppercase">
            Pendentes
          </span>
          <div className="mt-2">
            <span className={`font-headline-lg font-bold font-data-mono ${producao.pendentes > 0 ? 'text-primary' : 'text-secondary'}`}>
              {producao.pendentes}
            </span>
            <span className="block text-xs text-on-surface-variant mt-0.5">
              Ainda na fila hoje
            </span>
          </div>
        </div>

        {/* Card 4: Valor da Carteira */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="font-label-uppercase text-outline font-bold text-xs uppercase">
            Valor em Gestão
          </span>
          <div className="mt-2">
            <span className="font-title-md font-bold font-data-mono text-primary truncate block">
              R$ {producao.valorCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-xs text-on-surface-variant mt-0.5">
              Valor total carteira
            </span>
          </div>
        </div>

        {/* Card 5: Valor Recuperado */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-secondary/30 bg-secondary-container/10 flex flex-col justify-between">
          <span className="font-label-uppercase text-secondary font-bold text-xs uppercase">
            Recuperado Hoje
          </span>
          <div className="mt-2">
            <span className="font-title-md font-bold font-data-mono text-secondary truncate block">
              R$ {producao.valorRecuperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-xs text-secondary font-semibold mt-0.5">
              Pagamentos baixados
            </span>
          </div>
        </div>

        {/* Card 6: Valor Prometido (PTP) */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="font-label-uppercase text-outline font-bold text-xs uppercase">
            Prometido (PTP)
          </span>
          <div className="mt-2">
            <span className="font-title-md font-bold font-data-mono text-primary truncate block">
              R$ {producao.valorPrometido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-xs text-on-surface-variant mt-0.5">
              {producao.qtdPromessas} promessas ativas
            </span>
          </div>
        </div>
      </div>

      {/* 3. FILA OPERACIONAL: "PRÓXIMAS COBRANÇAS" */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="p-space-md bg-surface-container-low border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
            </div>
            <div>
              <h2 className="font-title-md font-bold text-primary leading-tight">
                Próximas Cobranças a Trabalhar
              </h2>
              <span className="font-body-sm text-on-surface-variant text-xs">
                Fila de execução diária ordenada por prioridade operacional e severidade do débito
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-sm">
            <button
              onClick={onNavigateToPortfolio}
              className="text-xs text-secondary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Carteira Completa</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Table of Debts Queue */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-body-sm text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface font-label-uppercase uppercase tracking-wider select-none text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">Fila</th>
                <th className="py-2.5 px-3 min-w-[200px]">Devedor</th>
                <th className="py-2.5 px-3">Título / Parcela</th>
                <th className="py-2.5 px-3">Vencimento</th>
                <th className="py-2.5 px-3 text-right">Valor Atual</th>
                <th className="py-2.5 px-3">Status Agenda</th>
                <th className="py-2.5 px-3">Último Contato</th>
                <th className="py-2.5 px-3">Responsável</th>
                <th className="py-2.5 px-3 text-center">Ação Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {agenda.map((item, index) => {
                const d = item.debt;
                const isTrabalhada = item.status === 'Trabalhada';

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isTrabalhada
                        ? 'bg-surface-container-low/40 opacity-75'
                        : 'hover:bg-surface-container-low bg-surface-container-lowest'
                    }`}
                  >
                    {/* Order in Queue */}
                    <td className="py-2.5 px-3 text-center font-data-mono font-bold text-on-surface-variant">
                      {isTrabalhada ? (
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          check_circle
                        </span>
                      ) : (
                        `#${index + 1}`
                      )}
                    </td>

                    {/* Devedor */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => onSelectDebt(d.id)}
                          className="font-title-md font-semibold text-primary hover:underline text-left cursor-pointer text-sm truncate max-w-[220px]"
                        >
                          {d.debtorName}
                        </button>
                        <span className="font-data-mono text-[11px] text-on-surface-variant">
                          CNPJ/CPF: {d.debtorCnpjCpf} • ERP {d.erpCode}
                        </span>
                      </div>
                    </td>

                    {/* Título */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-data-mono font-bold text-primary">
                          {d.titleNumber}
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-data-mono">
                          Parc. {d.installment}
                        </span>
                      </div>
                    </td>

                    {/* Vencimento */}
                    <td className="py-2.5 px-3 font-data-mono">
                      <div className="flex flex-col">
                        <span className="text-on-surface">{d.dueDate}</span>
                        <span
                          className={`text-[10px] font-semibold ${
                            d.daysOverdue > 0 ? 'text-error' : 'text-secondary'
                          }`}
                        >
                          {d.daysOverdue > 0 ? `${d.daysOverdue}d atraso` : 'A vencer'}
                        </span>
                      </div>
                    </td>

                    {/* Valor */}
                    <td className="py-2.5 px-3 text-right font-data-mono font-bold text-primary text-sm">
                      R$ {d.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status Agenda */}
                    <td className="py-2.5 px-3">
                      {isTrabalhada ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-badge-sm text-[10px] font-semibold">
                          <span className="material-symbols-outlined text-[12px]">check</span>
                          Trabalhada
                        </span>
                      ) : item.isCarriedOver ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-badge-sm text-[10px] font-semibold">
                          <span className="material-symbols-outlined text-[12px]">redo</span>
                          Carregada do dia anterior
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-badge-sm text-[10px] font-semibold">
                          <span className="material-symbols-outlined text-[12px]">pending</span>
                          Pendente
                        </span>
                      )}
                    </td>

                    {/* Último Contato */}
                    <td className="py-2.5 px-3 text-on-surface-variant">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-on-surface">
                          {d.lastContact?.result || 'Sem contato'}
                        </span>
                        <span className="text-[10px] font-data-mono">
                          {d.lastContact?.date || '-'} ({d.lastContact?.channel || '-'})
                        </span>
                      </div>
                    </td>

                    {/* Responsável */}
                    <td className="py-2.5 px-3 text-on-surface-variant text-xs">
                      {d.assignedTo.name}
                    </td>

                    {/* Ação Principal: FAZER COBRANÇA */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectDebt(d.id)}
                          className={`h-8 px-3 rounded font-title-md text-xs font-semibold flex items-center gap-1 transition-all shadow-sm cursor-pointer ${
                            isTrabalhada
                              ? 'bg-surface-container hover:bg-surface-variant text-on-surface'
                              : 'bg-primary hover:bg-primary-container text-surface'
                          }`}
                          type="button"
                          title="Abrir a Ficha da Cobrança e registrar contato"
                        >
                          <span className="material-symbols-outlined text-[16px] text-secondary-fixed">
                            add_call
                          </span>
                          <span>{isTrabalhada ? 'Ver Ficha' : 'Fazer Cobrança'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-primary text-surface px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 z-50 animate-bounce text-xs font-medium">
          <span className="material-symbols-outlined text-secondary-fixed text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
