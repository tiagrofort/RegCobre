import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import { Debt, DebtStatus, Empresa } from '../types';
import {
  parseDateString,
  formatDateBR,
  formatDateISO,
  isDateInRange,
  getWeekRange,
  getMonthRange,
  formatCurrencyBR,
} from '../utils/dateUtils';

interface DashboardGerencialViewProps {
  onSelectDebt: (debtId: string) => void;
  onNavigateToConferencia: () => void;
  onNavigateToRelatorios?: () => void;
}

type PeriodPreset = 'hoje' | 'esta_semana' | 'este_mes' | 'personalizado';

interface CobradorPerformance {
  operatorName: string;
  debtsCount: number;
  totalWorkedValue: number;
  totalReceivedValue: number;
  promisesCount: number;
  promisesValue: number;
  conversionRate: number; // % de cobranças com desfecho positivo (pagamento ou promessa)
}

export const DashboardGerencialView: React.FC<DashboardGerencialViewProps> = ({
  onSelectDebt,
  onNavigateToConferencia,
  onNavigateToRelatorios,
}) => {
  const { currentUser } = useAuth();
  const isSupervisorOrAdmin =
    currentUser?.role === 'supervisor' || currentUser?.role === 'administrador';

  // Inscrição reativa aos eventos do debtService
  const [, setTick] = useState(0);
  useEffect(() => {
    return debtService.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  // Data operacional base do sistema (ex: '04/11/2024')
  const opDateStr = debtService.getCurrentDate();
  const refDate = useMemo(() => parseDateString(opDateStr) || new Date(), [opDateStr]);

  // Empresas autorizadas para o usuário logado
  const availableEmpresas = useMemo(() => {
    return debtService.getEmpresasForUser(currentUser);
  }, [currentUser]);

  // Cobradores disponíveis para filtro (se for cobrador comum, apenas ele mesmo)
  const availableOperators = useMemo(() => {
    const allDebts = debtService.getDebtsForUser(currentUser);
    const namesSet = new Set<string>();

    if (!isSupervisorOrAdmin && currentUser) {
      namesSet.add(currentUser.name);
    } else {
      allDebts.forEach((d) => {
        if (d.assignedTo?.name) namesSet.add(d.assignedTo.name);
        d.history?.forEach((h) => {
          if (h.operatorName) namesSet.add(h.operatorName);
        });
      });
    }

    return Array.from(namesSet).sort();
  }, [currentUser, isSupervisorOrAdmin]);

  // Estados dos Filtros (Draft e Aplicados)
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [operatorFilter, setOperatorFilter] = useState<string>(
    !isSupervisorOrAdmin && currentUser ? currentUser.name : 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('este_mes');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const { start } = getMonthRange(refDate);
    return formatDateISO(start);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const { end } = getMonthRange(refDate);
    return formatDateISO(end);
  });

  // Filtros aplicados efetivamente nos cálculos
  const [appliedFilters, setAppliedFilters] = useState({
    empresa: 'all',
    operator: !isSupervisorOrAdmin && currentUser ? currentUser.name : 'all',
    status: 'all',
    periodPreset: 'este_mes' as PeriodPreset,
    startDate: customStartDate,
    endDate: customEndDate,
  });

  // Ordenação da tabela de cobradores
  const [sortField, setSortField] = useState<keyof CobradorPerformance>('totalReceivedValue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Aplicação explícita dos filtros
  const handleApplyFilters = () => {
    setAppliedFilters({
      empresa: empresaFilter,
      operator: !isSupervisorOrAdmin && currentUser ? currentUser.name : operatorFilter,
      status: statusFilter,
      periodPreset,
      startDate: customStartDate,
      endDate: customEndDate,
    });
  };

  // Limpar filtros para o padrão
  const handleResetFilters = () => {
    const defaultOperator = !isSupervisorOrAdmin && currentUser ? currentUser.name : 'all';
    const { start, end } = getMonthRange(refDate);
    const startIso = formatDateISO(start);
    const endIso = formatDateISO(end);

    setEmpresaFilter('all');
    setOperatorFilter(defaultOperator);
    setStatusFilter('all');
    setPeriodPreset('este_mes');
    setCustomStartDate(startIso);
    setCustomEndDate(endIso);

    setAppliedFilters({
      empresa: 'all',
      operator: defaultOperator,
      status: 'all',
      periodPreset: 'este_mes',
      startDate: startIso,
      endDate: endIso,
    });
  };

  // Determina intervalo de datas [start, end] efetivo com base nos filtros aplicados
  const effectiveDateRange = useMemo(() => {
    if (appliedFilters.periodPreset === 'hoje') {
      const start = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0);
      const end = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999);
      return { start, end, label: `Hoje (${formatDateBR(refDate)})` };
    }

    if (appliedFilters.periodPreset === 'esta_semana') {
      const { start, end } = getWeekRange(refDate);
      return {
        start,
        end,
        label: `Esta Semana (${formatDateBR(start)} a ${formatDateBR(end)})`,
      };
    }

    if (appliedFilters.periodPreset === 'este_mes') {
      const { start, end } = getMonthRange(refDate);
      return {
        start,
        end,
        label: `Este Mês (${formatDateBR(start)} a ${formatDateBR(end)})`,
      };
    }

    // Personalizado
    const start = parseDateString(appliedFilters.startDate) || refDate;
    const end = parseDateString(appliedFilters.endDate) || refDate;
    return {
      start,
      end,
      label: `Período: ${formatDateBR(start)} a ${formatDateBR(end)}`,
    };
  }, [appliedFilters, refDate]);

  // Coleção de cobranças autorizadas para o usuário logado
  const baseDebts = useMemo(() => {
    let list = debtService.getDebtsForUser(currentUser);

    // Filtro por Empresa
    if (appliedFilters.empresa !== 'all') {
      list = list.filter((d) => d.empresaId === appliedFilters.empresa);
    }

    // Filtro por Status da Cobrança
    if (appliedFilters.status !== 'all') {
      list = list.filter((d) => d.status === appliedFilters.status);
    }

    return list;
  }, [currentUser, appliedFilters.empresa, appliedFilters.status]);

  // =========================================================================
  // CÁLCULO DOS 6 INDICADORES PRINCIPAIS CONFORME REGRAS ESTRITAS
  // =========================================================================
  const {
    valorCarteiraEmAberto,
    qtdTotalCarteira,
    valorCobradoPeriodo,
    valorRecebidoPeriodo,
    qtdCobrancasTrabalhadas,
    ticketMedio,
    promessasQtd,
    promessasValor,
    distinctWorkedDebts,
    statusDistribution,
    cobradoresTableData,
    dailyTimeline,
  } = useMemo(() => {
    const { start, end } = effectiveDateRange;
    const targetOperator = appliedFilters.operator;

    // 1. VALOR DA CARTEIRA EM ABERTO:
    // Saldo ainda não pago das cobranças abertas no escopo filtrado (evitando duplicidade)
    const openDebts = baseDebts.filter((d) => {
      if (d.status === 'pago') return false;
      if (targetOperator !== 'all') {
        return d.assignedTo?.name === targetOperator;
      }
      return true;
    });

    const valorCarteiraEmAberto = openDebts.reduce((sum, d) => sum + (d.currentValue || 0), 0);
    const qtdTotalCarteira = openDebts.length;

    // 2. AÇÕES E TRABALHO NO PERÍODO (baseado nos eventos históricos reais com ator)
    // Coleta todos os registros de histórico que ocorreram dentro do período
    const workedDebtIdSet = new Set<string>();
    const workedDebtMap = new Map<string, Debt>();

    // Rastreamento por cobrador (atribuído ao operador que realizou a ação)
    const operatorStatsMap = new Map<
      string,
      {
        workedDebts: Set<string>;
        workedValueTotal: number;
        receivedValueTotal: number;
        promisesCount: number;
        promisesValueTotal: number;
        successfulDebts: Set<string>;
      }
    >();

    // Agrupamento temporal diário para o gráfico de evolução
    const dailyMap = new Map<string, { date: string; cobrado: number; recebido: number }>();

    // Inicializa timeline diária para os dias do intervalo (até 14 dias se for semana/hoje ou amostra)
    const curDate = new Date(start);
    while (curDate <= end && dailyMap.size < 31) {
      const dStr = formatDateBR(curDate);
      dailyMap.set(dStr, { date: dStr, cobrado: 0, recebido: 0 });
      curDate.setDate(curDate.getDate() + 1);
    }

    let totalCobrado = 0;
    let totalRecebido = 0;
    let totalPromessasQtd = 0;
    let totalPromessasValor = 0;

    baseDebts.forEach((debt) => {
      // Analisa histórico de contatos
      (debt.history || []).forEach((hist) => {
        const histDate = parseDateString(hist.dateFormatted || hist.timestamp);
        if (!histDate || !isDateInRange(histDate, start, end)) return;

        const opName = hist.operatorName || debt.assignedTo?.name || 'Operador não identificado';

        // Filtro de cobrador na auditoria de eventos
        if (targetOperator !== 'all' && opName !== targetOperator) {
          return;
        }

        // Registra cobrança como trabalhada no período
        if (!workedDebtIdSet.has(debt.id)) {
          workedDebtIdSet.add(debt.id);
          workedDebtMap.set(debt.id, debt);
          totalCobrado += debt.currentValue || 0;

          // Adiciona ao timeline diário
          const dayKey = formatDateBR(histDate);
          if (dailyMap.has(dayKey)) {
            dailyMap.get(dayKey)!.cobrado += debt.currentValue || 0;
          }
        }

        // Estatísticas do operador
        if (!operatorStatsMap.has(opName)) {
          operatorStatsMap.set(opName, {
            workedDebts: new Set<string>(),
            workedValueTotal: 0,
            receivedValueTotal: 0,
            promisesCount: 0,
            promisesValueTotal: 0,
            successfulDebts: new Set<string>(),
          });
        }
        const opStat = operatorStatsMap.get(opName)!;
        if (!opStat.workedDebts.has(debt.id)) {
          opStat.workedDebts.add(debt.id);
          opStat.workedValueTotal += debt.currentValue || 0;
        }

        // Se o contato gerou promessa
        if (hist.attachedPromise) {
          opStat.promisesCount += 1;
          opStat.promisesValueTotal += hist.attachedPromise.promisedValue || 0;
          opStat.successfulDebts.add(debt.id);
        }

        // Se o contato gerou pagamento
        if (hist.attachedPayment) {
          opStat.successfulDebts.add(debt.id);
        }
      });

      // 3. PAGAMENTOS EFETIVAMENTE RECEBIDOS NO PERÍODO
      (debt.payments || []).forEach((payment) => {
        const payDate = parseDateString(payment.date);
        if (!payDate || !isDateInRange(payDate, start, end)) return;

        // Atribuição de pagamento ao cobrador do último contato ou responsável
        const paymentOp = debt.lastContact?.operatorName || debt.assignedTo?.name || 'Carlos Eduardo';
        if (targetOperator !== 'all' && paymentOp !== targetOperator) {
          return;
        }

        const payVal = Number(payment.value) || 0;
        totalRecebido += payVal;

        const dayKey = formatDateBR(payDate);
        if (dailyMap.has(dayKey)) {
          dailyMap.get(dayKey)!.recebido += payVal;
        }

        if (operatorStatsMap.has(paymentOp)) {
          operatorStatsMap.get(paymentOp)!.receivedValueTotal += payVal;
        } else {
          operatorStatsMap.set(paymentOp, {
            workedDebts: new Set<string>([debt.id]),
            workedValueTotal: debt.currentValue,
            receivedValueTotal: payVal,
            promisesCount: 0,
            promisesValueTotal: 0,
            successfulDebts: new Set<string>([debt.id]),
          });
        }
      });

      // 6. PROMESSAS REGISTRADAS NO PERÍODO
      (debt.promises || []).forEach((prom) => {
        const promRegDate = parseDateString(prom.dateRegistered);
        if (!promRegDate || !isDateInRange(promRegDate, start, end)) return;

        const promOp = prom.operatorName || debt.assignedTo?.name || 'Carlos Eduardo';
        if (targetOperator !== 'all' && promOp !== targetOperator) {
          return;
        }

        totalPromessasQtd += 1;
        totalPromessasValor += Number(prom.promisedValue) || 0;
      });
    });

    const qtdCobrancasTrabalhadas = workedDebtIdSet.size;
    const ticketMedio =
      qtdCobrancasTrabalhadas > 0 ? totalCobrado / qtdCobrancasTrabalhadas : 0;

    // 4. DISTRIBUIÇÃO DA CARTEIRA POR STATUS
    const statusCounts: Record<DebtStatus, { count: number; totalValue: number }> = {
      em_aberto: { count: 0, totalValue: 0 },
      em_negociacao: { count: 0, totalValue: 0 },
      promessa_firme: { count: 0, totalValue: 0 },
      retorno_agendado: { count: 0, totalValue: 0 },
      pago: { count: 0, totalValue: 0 },
      quebrou_acordo: { count: 0, totalValue: 0 },
      sem_contato: { count: 0, totalValue: 0 },
    };

    baseDebts.forEach((d) => {
      if (targetOperator !== 'all' && d.assignedTo?.name !== targetOperator) return;
      if (statusCounts[d.status]) {
        statusCounts[d.status].count += 1;
        statusCounts[d.status].totalValue += d.currentValue || 0;
      }
    });

    // 5. TABELA DE COBRADORES
    const cobradoresTableData: CobradorPerformance[] = Array.from(operatorStatsMap.entries()).map(
      ([name, stat]) => {
        const count = stat.workedDebts.size;
        const conversion =
          count > 0 ? Math.round((stat.successfulDebts.size / count) * 100) : 0;
        return {
          operatorName: name,
          debtsCount: count,
          totalWorkedValue: stat.workedValueTotal,
          totalReceivedValue: stat.receivedValueTotal,
          promisesCount: stat.promisesCount,
          promisesValue: stat.promisesValueTotal,
          conversionRate: conversion,
        };
      }
    );

    return {
      valorCarteiraEmAberto,
      qtdTotalCarteira,
      valorCobradoPeriodo: totalCobrado,
      valorRecebidoPeriodo: totalRecebido,
      qtdCobrancasTrabalhadas,
      ticketMedio,
      promessasQtd: totalPromessasQtd,
      promessasValor: totalPromessasValor,
      distinctWorkedDebts: Array.from(workedDebtMap.values()),
      statusDistribution: statusCounts,
      cobradoresTableData,
      dailyTimeline: Array.from(dailyMap.values()),
    };
  }, [baseDebts, effectiveDateRange, appliedFilters.operator]);

  // Ordenação da tabela de cobradores
  const sortedCobradores = useMemo(() => {
    return [...cobradoresTableData].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [cobradoresTableData, sortField, sortAsc]);

  const handleSort = (field: keyof CobradorPerformance) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Status labels amigáveis
  const statusLabels: Record<DebtStatus, { label: string; color: string }> = {
    em_aberto: { label: 'Em Aberto', color: 'bg-primary/80' },
    em_negociacao: { label: 'Em Negociação', color: 'bg-on-tertiary-container' },
    promessa_firme: { label: 'Promessa Vigente (PTP)', color: 'bg-secondary' },
    retorno_agendado: { label: 'Retorno Agendado', color: 'bg-tertiary' },
    pago: { label: 'Liquidado / Pago', color: 'bg-primary-fixed' },
    quebrou_acordo: { label: 'Promessa Quebrada', color: 'bg-error' },
    sem_contato: { label: 'Sem Contato / Não Atende', color: 'bg-outline' },
  };

  const totalBaseDebtsCount = baseDebts.length || 1;

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-16">
      {/* 1. Header do Dashboard Gerencial */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-md border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">monitoring</span>
            <span className="font-label-uppercase text-secondary font-bold uppercase tracking-wider text-xs">
              Painel Executivo de Diretoria &amp; Supervisão Operacional
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold mt-1">
            Dashboard Gerencial Consolidado
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Acompanhamento analítico e em tempo real dos KPIs de recuperação, volume financeiro cobrado, pagamentos liquidados e produtividade dos operadores.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onNavigateToRelatorios && (
            <button
              onClick={onNavigateToRelatorios}
              className="h-9 px-3.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-title-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/30 shadow-2xs"
              type="button"
              title="Abrir Central de Relatórios com exportação CSV e A4"
            >
              <span className="material-symbols-outlined text-[17px] text-primary">summarize</span>
              <span>Central de Relatórios</span>
            </button>
          )}

          <button
            onClick={onNavigateToConferencia}
            className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            type="button"
            title="Abrir tela de conferência detalhada e auditoria"
          >
            <span className="material-symbols-outlined text-[17px]">fact_check</span>
            <span>Conferência da Equipe</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Filtros Multifuncional e Responsiva */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 space-y-3">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">filter_alt</span>
            <span className="font-label-uppercase text-xs font-bold text-primary uppercase tracking-wider">
              Filtros do Painel Gerencial
            </span>
          </div>
          <span className="text-xs text-on-surface-variant font-data-mono">
            {effectiveDateRange.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Filtro: Empresa */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-outline uppercase tracking-wider block">
              Empresa Credora
            </label>
            <select
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-secondary transition-colors"
            >
              <option value="all">Todas as Empresas Autorizadas</option>
              {availableEmpresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nomeFantasia || emp.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Cobrador */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-outline uppercase tracking-wider block">
              Operador / Cobrador
            </label>
            <select
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              disabled={!isSupervisorOrAdmin}
              className={`w-full h-9 px-3 rounded-lg border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-secondary transition-colors ${
                !isSupervisorOrAdmin
                  ? 'bg-surface-container-high/50 cursor-not-allowed opacity-80'
                  : 'bg-surface-container-low'
              }`}
            >
              {isSupervisorOrAdmin && <option value="all">Todos os Cobradores</option>}
              {availableOperators.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Período Predefinido */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-outline uppercase tracking-wider block">
              Período de Análise
            </label>
            <select
              value={periodPreset}
              onChange={(e) => setPeriodPreset(e.target.value as PeriodPreset)}
              className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-secondary transition-colors"
            >
              <option value="hoje">Hoje ({formatDateBR(refDate)})</option>
              <option value="esta_semana">Esta Semana Vigente</option>
              <option value="este_mes">Este Mês Vigente</option>
              <option value="personalizado">Período Personalizado (Datas)</option>
            </select>
          </div>

          {/* Filtro: Status da Cobrança */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-outline uppercase tracking-wider block">
              Status da Cobrança
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-secondary transition-colors"
            >
              <option value="all">Todos os Status</option>
              <option value="em_aberto">Em Aberto</option>
              <option value="em_negociacao">Em Negociação</option>
              <option value="promessa_firme">Promessa Vigente (PTP)</option>
              <option value="retorno_agendado">Retorno Agendado</option>
              <option value="pago">Quitado / Pago</option>
              <option value="quebrou_acordo">Promessa Quebrada</option>
              <option value="sem_contato">Sem Contato</option>
            </select>
          </div>
        </div>

        {/* Linha Opcional para Período Personalizado & Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {periodPreset === 'personalizado' ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div>
                <span className="text-[10px] text-outline font-semibold block">Data Início:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-8 px-2.5 rounded bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface"
                />
              </div>
              <span className="text-outline text-xs mt-3">até</span>
              <div>
                <span className="text-[10px] text-outline font-semibold block">Data Fim:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-8 px-2.5 rounded bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface"
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">check_circle</span>
              <span>Filtro temporal ativo: <strong>{effectiveDateRange.label}</strong></span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleResetFilters}
              type="button"
              className="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold cursor-pointer transition-colors"
            >
              Limpar Filtros
            </button>
            <button
              onClick={handleApplyFilters}
              type="button"
              className="h-8 px-4 rounded-lg bg-secondary hover:bg-on-secondary-container text-on-secondary text-xs font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">done</span>
              <span>Aplicar Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Cards dos 6 Indicadores Principais (Fase 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-sm">
        {/* Card 1: Valor em Aberto */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-label-uppercase text-outline font-bold uppercase">
              Carteira em Aberto
            </span>
            <span className="material-symbols-outlined text-outline text-[18px]">account_balance</span>
          </div>
          <div className="mt-2">
            <span className="font-headline-sm font-bold font-data-mono text-primary block leading-tight text-lg">
              {formatCurrencyBR(valorCarteiraEmAberto)}
            </span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              {qtdTotalCarteira} títulos abertos (sem quitar)
            </span>
          </div>
        </div>

        {/* Card 2: Valor Cobrado no Período */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-primary/20 bg-primary/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-label-uppercase text-primary font-bold uppercase">
              Cobrado no Período
            </span>
            <span
              className="material-symbols-outlined text-primary text-[18px] cursor-help"
              title="Critério: Soma do valor atual dos títulos distintos que tiveram tentativas de contato registradas no período selecionado."
            >
              info
            </span>
          </div>
          <div className="mt-2">
            <span className="font-headline-sm font-bold font-data-mono text-primary block leading-tight text-lg">
              {formatCurrencyBR(valorCobradoPeriodo)}
            </span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5 truncate" title="Títulos distintos com contato">
              {qtdCobrancasTrabalhadas} cobranças acionadas
            </span>
          </div>
        </div>

        {/* Card 3: Valor Recebido no Período */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-secondary/40 bg-secondary-container/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-label-uppercase text-secondary font-bold uppercase">
              Recebido no Período
            </span>
            <span className="material-symbols-outlined text-secondary text-[18px]">payments</span>
          </div>
          <div className="mt-2">
            <span className="font-headline-sm font-bold font-data-mono text-secondary block leading-tight text-lg">
              {formatCurrencyBR(valorRecebidoPeriodo)}
            </span>
            <span className="text-[11px] text-secondary font-semibold block mt-0.5">
              Pagamentos liquidados
            </span>
          </div>
        </div>

        {/* Card 4: Qtd de Cobranças Trabalhadas */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-label-uppercase text-outline font-bold uppercase">
              Cobranças Trabalhadas
            </span>
            <span className="material-symbols-outlined text-outline text-[18px]">phone_in_talk</span>
          </div>
          <div className="mt-2">
            <span className="font-headline-sm font-bold font-data-mono text-primary block leading-tight text-lg">
              {qtdCobrancasTrabalhadas}
            </span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">
              Títulos únicos no período
            </span>
          </div>
        </div>

        {/* Card 5: Ticket Médio */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-label-uppercase text-outline font-bold uppercase">
              Ticket Médio
            </span>
            <span className="material-symbols-outlined text-outline text-[18px]">calculate</span>
          </div>
          <div className="mt-2">
            <span className="font-headline-sm font-bold font-data-mono text-primary block leading-tight text-lg">
              {formatCurrencyBR(ticketMedio)}
            </span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5 truncate" title="Valor cobrado / Qtd trabalhadas">
              Por cobrança acionada
            </span>
          </div>
        </div>

        {/* Card 6: Promessas de Pagamento */}
        <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-label-uppercase text-outline font-bold uppercase">
              Promessas Registradas
            </span>
            <span className="material-symbols-outlined text-on-tertiary-container text-[18px]">event_repeat</span>
          </div>
          <div className="mt-2">
            <span className="font-headline-sm font-bold font-data-mono text-primary block leading-tight text-lg">
              {promessasQtd} PTPs
            </span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5 font-data-mono font-semibold">
              {formatCurrencyBR(promessasValor)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Gráficos Responsivos e Analíticos (Fase 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Gráfico 1: Evolução Diária (Cobrado vs Recebido) (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">bar_chart</span>
                <h3 className="font-title-md font-bold text-primary text-sm sm:text-base">
                  Evolução dos Valores Cobrados e Recebidos
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-primary inline-block"></span>
                  <span>Cobrado</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-secondary inline-block"></span>
                  <span>Recebido</span>
                </span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Comparativo cronológico de valores financeiros acionados vs baixas de pagamentos confirmadas.
            </p>
          </div>

          {/* Gráfico SVG de Barras Dinâmicas */}
          <div className="mt-4 pt-2 border-t border-outline-variant/20">
            {dailyTimeline.length > 0 ? (
              <div className="space-y-2">
                {dailyTimeline.slice(0, 8).map((day, idx) => {
                  const maxVal = Math.max(
                    ...dailyTimeline.map((d) => Math.max(d.cobrado, d.recebido)),
                    1000
                  );
                  const widthCobrado = Math.min(100, Math.round((day.cobrado / maxVal) * 100));
                  const widthRecebido = Math.min(100, Math.round((day.recebido / maxVal) * 100));

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-data-mono">
                        <span className="font-bold text-primary">{day.date}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-semibold">
                            Cobrado: {formatCurrencyBR(day.cobrado)}
                          </span>
                          <span className="text-secondary font-bold">
                            Recebido: {formatCurrencyBR(day.recebido)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 h-3.5 bg-surface-container-low rounded p-0.5">
                        {/* Barra Cobrado */}
                        <div className="w-full bg-surface-container rounded-sm overflow-hidden flex justify-end">
                          <div
                            className="h-full bg-primary rounded-sm transition-all duration-500"
                            style={{ width: `${Math.max(widthCobrado, 2)}%` }}
                          />
                        </div>
                        {/* Barra Recebido */}
                        <div className="w-full bg-surface-container rounded-sm overflow-hidden flex justify-start">
                          <div
                            className="h-full bg-secondary rounded-sm transition-all duration-500"
                            style={{ width: `${Math.max(widthRecebido, day.recebido > 0 ? 2 : 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-on-surface-variant">
                Nenhuma movimentação registrada no período selecionado.
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 2: Distribuição da Carteira por Status (5 cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">pie_chart</span>
              <h3 className="font-title-md font-bold text-primary text-sm sm:text-base">
                Distribuição da Carteira por Status
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Repartição percentual e financeira do portfólio no filtro atual.
            </p>
          </div>

          {/* Barra Multissegmentada Proporcional */}
          <div className="mt-4 space-y-3">
            <div className="w-full h-4 rounded-lg bg-surface-container overflow-hidden flex shadow-inner">
              {(Object.keys(statusDistribution) as DebtStatus[]).map((st) => {
                const item = statusDistribution[st];
                if (item.count === 0) return null;
                const pct = (item.count / totalBaseDebtsCount) * 100;
                return (
                  <div
                    key={st}
                    className={`h-full ${statusLabels[st].color} transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                    title={`${statusLabels[st].label}: ${item.count} títulos (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>

            {/* Legenda Analítica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              {(Object.keys(statusDistribution) as DebtStatus[]).map((st) => {
                const item = statusDistribution[st];
                const pct = Math.round((item.count / totalBaseDebtsCount) * 100);
                return (
                  <div
                    key={st}
                    className="p-1.5 rounded bg-surface-container-low flex items-center justify-between border border-outline-variant/20"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusLabels[st].color}`} />
                      <span className="truncate text-[11px] font-medium" title={statusLabels[st].label}>
                        {statusLabels[st].label}
                      </span>
                    </div>
                    <div className="text-right shrink-0 font-data-mono">
                      <span className="font-bold text-primary text-[11px]">{item.count}</span>
                      <span className="text-[10px] text-outline ml-1">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Tabela de Desempenho por Cobrador (Fase 2) */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
              <h3 className="font-title-md font-bold text-primary">
                Desempenho por Cobrador / Operador da Ação
              </h3>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Produção auditada com base nos eventos e ações reais registradas no período filtrado.
            </p>
          </div>

          <span className="text-xs font-data-mono text-outline self-start sm:self-auto">
            {sortedCobradores.length} operador(es) ativo(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface font-label-uppercase uppercase tracking-wider border-b border-outline-variant">
                <th
                  onClick={() => handleSort('operatorName')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-surface-variant transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Cobrador / Operador</span>
                    {sortField === 'operatorName' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('debtsCount')}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-surface-variant transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Cobranças Trabalhadas</span>
                    {sortField === 'debtsCount' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalWorkedValue')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-surface-variant transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Valor Trabalhado</span>
                    {sortField === 'totalWorkedValue' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalReceivedValue')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-surface-variant transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Valor Recebido</span>
                    {sortField === 'totalReceivedValue' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('promisesCount')}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-surface-variant transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Promessas (PTP)</span>
                    {sortField === 'promisesCount' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('conversionRate')}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-surface-variant transition-colors"
                  title="Percentual de cobranças com desfecho favorável (promessa ou pagamento registrado)"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Taxa Resolução</span>
                    {sortField === 'conversionRate' && (
                      <span className="material-symbols-outlined text-[14px]">
                        {sortAsc ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {sortedCobradores.length > 0 ? (
                sortedCobradores.map((c) => (
                  <tr key={c.operatorName} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {c.operatorName.charAt(0)}
                        </div>
                        <span className="font-semibold text-primary">{c.operatorName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-data-mono font-bold text-primary">
                      {c.debtsCount}
                    </td>
                    <td className="py-3 px-3 text-right font-data-mono font-semibold text-primary">
                      {formatCurrencyBR(c.totalWorkedValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-data-mono font-bold text-secondary">
                      {formatCurrencyBR(c.totalReceivedValue)}
                    </td>
                    <td className="py-3 px-3 text-center font-data-mono">
                      <span className="font-bold">{c.promisesCount}</span>
                      {c.promisesValue > 0 && (
                        <span className="text-[10px] text-outline block">
                          ({formatCurrencyBR(c.promisesValue)})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-16 h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full"
                            style={{ width: `${Math.min(c.conversionRate, 100)}%` }}
                          />
                        </div>
                        <span className="font-data-mono font-bold text-secondary text-xs">
                          {c.conversionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant text-xs">
                    Nenhuma atividade registrada por operadores no período filtrado.
                  </td>
                </tr>
              )}

              {/* Linha de Totais da Tabela */}
              {sortedCobradores.length > 0 && (
                <tr className="bg-surface-container-high/60 font-bold border-t-2 border-primary text-primary">
                  <td className="py-3 px-3">TOTAIS CONSOLIDADOS:</td>
                  <td className="py-3 px-3 text-center font-data-mono">
                    {sortedCobradores.reduce((sum, c) => sum + c.debtsCount, 0)}
                  </td>
                  <td className="py-3 px-3 text-right font-data-mono">
                    {formatCurrencyBR(sortedCobradores.reduce((sum, c) => sum + c.totalWorkedValue, 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-data-mono text-secondary">
                    {formatCurrencyBR(sortedCobradores.reduce((sum, c) => sum + c.totalReceivedValue, 0))}
                  </td>
                  <td className="py-3 px-3 text-center font-data-mono">
                    {sortedCobradores.reduce((sum, c) => sum + c.promisesCount, 0)}
                  </td>
                  <td className="py-3 px-3 text-center font-data-mono">
                    {Math.round(
                      sortedCobradores.reduce((sum, c) => sum + c.conversionRate, 0) /
                        sortedCobradores.length
                    )}
                    %
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
