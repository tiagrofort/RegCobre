import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import { Debt } from '../types';

interface DashboardGerencialViewProps {
  onSelectDebt: (debtId: string) => void;
  onNavigateToConferencia: () => void;
}

export const DashboardGerencialView: React.FC<DashboardGerencialViewProps> = ({
  onSelectDebt,
  onNavigateToConferencia,
}) => {
  const { currentUser } = useAuth();
  const metrics = debtService.getSummaryMetrics(currentUser);
  const debts = debtService.getDebtsForUser(currentUser);
  const [selectedPeriod, setSelectedPeriod] = useState<'mes' | 'trimestre' | 'ano'>('mes');

  // Performance by Cobrador
  const cobradoresStats = [
    {
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
      debtsCount: 22,
      recovered: 78450.0,
      promised: 44200.0,
      rate: '88%',
    },
    {
      name: 'Maria Oliveira',
      role: 'Cobradora Pleno',
      debtsCount: 14,
      recovered: 41200.0,
      promised: 21000.0,
      rate: '91%',
    },
    {
      name: 'Roberto Silveira',
      role: 'Cobrador Júnior',
      debtsCount: 8,
      recovered: 15300.0,
      promised: 8400.0,
      rate: '64%',
    },
    {
      name: 'Juliana Mendes',
      role: 'Cobradora',
      debtsCount: 4,
      recovered: 7900.0,
      promised: 4800.0,
      rate: '75%',
    },
  ];

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-16">
      {/* Top Header */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">monitoring</span>
            <span className="font-label-uppercase text-secondary font-bold uppercase tracking-wider">
              Painel Executivo de Diretoria & Recuperação
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold mt-1">
            Dashboard Gerencial Consolidado
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Acompanhamento em tempo real de KPIs de recuperação, volume financeiro, efetividade por operador e índice de conversão de promessas.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-surface-container-low p-space-2xs rounded-lg border border-outline-variant/30">
            <button
              onClick={() => setSelectedPeriod('mes')}
              className={`px-3 py-1 rounded font-label-uppercase text-xs font-semibold cursor-pointer ${
                selectedPeriod === 'mes'
                  ? 'bg-surface-container-lowest shadow-sm text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Mês Vigente
            </button>
            <button
              onClick={() => setSelectedPeriod('trimestre')}
              className={`px-3 py-1 rounded font-label-uppercase text-xs font-semibold cursor-pointer ${
                selectedPeriod === 'trimestre'
                  ? 'bg-surface-container-lowest shadow-sm text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Trimestre
            </button>
            <button
              onClick={() => setSelectedPeriod('ano')}
              className={`px-3 py-1 rounded font-label-uppercase text-xs font-semibold cursor-pointer ${
                selectedPeriod === 'ano'
                  ? 'bg-surface-container-lowest shadow-sm text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Ano 2024
            </button>
          </div>

          <button
            onClick={onNavigateToConferencia}
            className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            <span>Abrir Conferência da Equipe</span>
          </button>
        </div>
      </div>

      {/* KPI 8-Grid Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-space-md">
        {/* KPI 1 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-uppercase text-outline font-bold text-xs uppercase">
              Total Cobrado (Carteira)
            </span>
            <span className="material-symbols-outlined text-outline text-[20px]">account_balance</span>
          </div>
          <div className="mt-2">
            <span className="font-headline-lg font-bold font-data-mono text-primary">
              R$ {metrics.totalDebtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-xs text-on-surface-variant mt-0.5">
              {metrics.totalDebtsCount} cobranças ativas auditadas
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-secondary/30 bg-secondary-container/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-uppercase text-secondary font-bold text-xs uppercase">
              Total Recuperado (Baixado)
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
          </div>
          <div className="mt-2">
            <span className="font-headline-lg font-bold font-data-mono text-secondary">
              R$ {metrics.totalRecovered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-xs text-secondary font-semibold mt-0.5">
              {metrics.paidDebtsCount} títulos quitados (24,4% de liquidação)
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-uppercase text-outline font-bold text-xs uppercase">
              Total Prometido (PTP Ativa)
            </span>
            <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
          </div>
          <div className="mt-2">
            <span className="font-headline-lg font-bold font-data-mono text-primary">
              R$ {metrics.totalPromised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-xs text-on-surface-variant mt-0.5">
              {metrics.promisedDebtsCount} acordos com liquidação prevista
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-error/30 bg-error-container/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-uppercase text-error font-bold text-xs uppercase">
              Promessas Não Cumpridas
            </span>
            <span className="material-symbols-outlined text-error text-[20px]">warning</span>
          </div>
          <div className="mt-2">
            <span className="font-headline-lg font-bold font-data-mono text-error">
              R$ {metrics.brokenPromisesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-xs text-error font-semibold mt-0.5">
              {metrics.brokenPromisesCount} quebras sob repactuação urgente
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Rows */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* Performance by Cobrador (7 cols) */}
        <div className="xl:col-span-7 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
          <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                badge
              </span>
              <h3 className="font-title-md font-bold text-primary">
                Desempenho por Cobrador / Operador
              </h3>
            </div>
            <span className="font-data-mono text-xs text-on-surface-variant">Metas e Atingimento</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface font-label-uppercase uppercase tracking-wider">
                  <th className="py-2.5 px-3">Operador</th>
                  <th className="py-2.5 px-3 text-center">Carteira</th>
                  <th className="py-2.5 px-3 text-right">Recuperado</th>
                  <th className="py-2.5 px-3 text-right">Promessas</th>
                  <th className="py-2.5 px-3 text-center">Taxa Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high">
                {cobradoresStats.map((c) => (
                  <tr key={c.name} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-primary text-sm">{c.name}</span>
                        <span className="text-[11px] text-outline">{c.role}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-data-mono font-bold text-primary">
                      {c.debtsCount} títulos
                    </td>
                    <td className="py-3 px-3 text-right font-data-mono font-bold text-secondary">
                      R$ {c.recovered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-data-mono font-semibold text-primary">
                      R$ {c.promised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full"
                            style={{ width: c.rate }}
                          ></div>
                        </div>
                        <span className="font-data-mono font-bold text-secondary text-xs">
                          {c.rate}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Funil & Distribuição de Atrasos (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-space-md">
          {/* Faixa de Inadimplência */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
            <h3 className="font-title-md font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">pie_chart</span>
              <span>Distribuição de Aging / Faixa de Atraso</span>
            </h3>

            <div className="space-y-2 pt-1 text-xs">
              <div>
                <div className="flex items-center justify-between pb-1">
                  <span>Até 30 dias (Faixa 1)</span>
                  <strong className="font-data-mono">R$ 114.200,00 (28%)</strong>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full" style={{ width: '28%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between pb-1">
                  <span>31 a 60 dias (Faixa 2 - Crítica)</span>
                  <strong className="font-data-mono">R$ 218.400,00 (52%)</strong>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-on-tertiary-container h-full" style={{ width: '52%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between pb-1">
                  <span>Acima de 60 dias (Faixa 3 - Pré-Jurídico)</span>
                  <strong className="font-data-mono text-error">R$ 81.620,00 (20%)</strong>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-error h-full" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-primary text-surface p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-3">
            <div>
              <span className="text-secondary-fixed text-xs font-bold uppercase tracking-wider font-label-uppercase">
                Ações Rápidas de Supervisão
              </span>
              <h4 className="font-headline-sm font-bold mt-1 text-surface">
                Auditoria de Carteiras e Transferência
              </h4>
              <p className="text-xs text-on-primary-container mt-1 leading-relaxed">
                Você pode rebalancear títulos entre operadores, redistribuir promessas quebradas ou emitir o relatório A4 consolidado para a diretoria.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onNavigateToConferencia}
                className="flex-1 py-2 px-3 bg-secondary hover:bg-on-secondary-container text-on-secondary rounded font-label-uppercase text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Auditar Todas as Cobranças
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
