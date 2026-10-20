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
import { exportToCsv, CsvColumn } from '../utils/csvExporter';
import {
  ReportViewerModal,
  ReportViewerColumn,
  ReportViewerSummaryTile,
} from '../components/ReportViewerModal';
import { getDebtStatusRowClass } from '../utils/debtStatusStyles';

interface RelatoriosViewProps {
  onSelectDebt: (debtId: string) => void;
  onNavigateToDashboard?: () => void;
}

type ReportTab = 'producao' | 'recebimentos' | 'carteira' | 'promessas_retornos';
type PeriodPreset = 'hoje' | 'esta_semana' | 'este_mes' | 'personalizado' | 'todos';

// 1. Linha do Relatório de Produção
interface ProducaoRow {
  debtId: string;
  historyId: string;
  date: string;
  time: string;
  operatorName: string;
  debtorName: string;
  debtorCnpjCpf: string;
  titleNumber: string;
  installment: string;
  workedValue: number;
  channel: string;
  result: string;
  notes: string;
  empresaName: string;
}

// 2. Linha do Relatório de Recebimentos
interface RecebimentoRow {
  debtId: string;
  paymentId: string;
  paymentDate: string;
  debtorName: string;
  debtorCnpjCpf: string;
  titleNumber: string;
  installment: string;
  empresaName: string;
  receivedValue: number;
  paymentMethod: string;
  status: string;
  operatorName: string;
}

// 3. Linha do Relatório da Carteira em Aberto
interface CarteiraRow {
  debtId: string;
  debtorName: string;
  debtorCnpjCpf: string;
  titleNumber: string;
  installment: string;
  empresaName: string;
  originalValue: number;
  currentValue: number;
  dueDate: string;
  daysOverdue: number;
  status: DebtStatus;
  statusLabel: string;
  responsibleName: string;
}

// 4. Linha do Relatório de Promessas e Retornos
interface PromessaRetornoRow {
  debtId: string;
  uniqueId: string;
  type: 'Promessa (PTP)' | 'Retorno Agendado';
  debtorName: string;
  debtorCnpjCpf: string;
  titleNumber: string;
  scheduledDate: string;
  scheduledTime: string;
  promisedValue: number | null;
  status: string;
  responsibleName: string;
  reasonOrNotes: string;
  empresaName: string;
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  onSelectDebt,
  onNavigateToDashboard,
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

  const opDateStr = debtService.getCurrentDate();
  const refDate = useMemo(() => parseDateString(opDateStr) || new Date(), [opDateStr]);

  // Tab do Relatório Ativo
  const [activeTab, setActiveTab] = useState<ReportTab>('producao');

  // Filtros Globais
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [operatorFilter, setOperatorFilter] = useState<string>(
    !isSupervisorOrAdmin && currentUser ? currentUser.name : 'all'
  );
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('este_mes');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const { start } = getMonthRange(refDate);
    return formatDateISO(start);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const { end } = getMonthRange(refDate);
    return formatDateISO(end);
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal de Visualização A4
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Empresas autorizadas
  const availableEmpresas = useMemo(() => {
    return debtService.getEmpresasForUser(currentUser);
  }, [currentUser]);

  // Cobradores autorizados
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

  // Intervalo de Datas
  const dateRange = useMemo(() => {
    if (periodPreset === 'todos') {
      return { start: null, end: null, label: 'Todo o Histórico' };
    }
    if (periodPreset === 'hoje') {
      const start = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 0, 0, 0, 0);
      const end = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 23, 59, 59, 999);
      return { start, end, label: `Hoje (${formatDateBR(refDate)})` };
    }
    if (periodPreset === 'esta_semana') {
      const { start, end } = getWeekRange(refDate);
      return { start, end, label: `Esta Semana (${formatDateBR(start)} a ${formatDateBR(end)})` };
    }
    if (periodPreset === 'este_mes') {
      const { start, end } = getMonthRange(refDate);
      return { start, end, label: `Este Mês (${formatDateBR(start)} a ${formatDateBR(end)})` };
    }
    const start = parseDateString(customStartDate) || refDate;
    const end = parseDateString(customEndDate) || refDate;
    return { start, end, label: `De ${formatDateBR(start)} a ${formatDateBR(end)}` };
  }, [periodPreset, refDate, customStartDate, customEndDate]);

  // Coleção base de cobranças respeitando acessos
  const baseDebts = useMemo(() => {
    let list = debtService.getDebtsForUser(currentUser);
    if (empresaFilter !== 'all') {
      list = list.filter((d) => d.empresaId === empresaFilter);
    }
    return list;
  }, [currentUser, empresaFilter]);

  // Mapa de empresas para resolução de nomes
  const empresaMap = useMemo(() => {
    const map = new Map<string, string>();
    debtService.getActiveEmpresas().forEach((emp) => {
      map.set(emp.id, emp.nomeFantasia || emp.razaoSocial);
    });
    return map;
  }, []);

  // =========================================================================
  // 1. PROCESSAMENTO: RELATÓRIO DE PRODUÇÃO DE COBRANÇAS
  // =========================================================================
  const producaoData = useMemo<ProducaoRow[]>(() => {
    const rows: ProducaoRow[] = [];
    const q = searchQuery.trim().toLowerCase();

    baseDebts.forEach((debt) => {
      (debt.history || []).forEach((hist) => {
        const histDate = parseDateString(hist.dateFormatted || hist.timestamp);
        if (dateRange.start && dateRange.end) {
          if (!histDate || !isDateInRange(histDate, dateRange.start, dateRange.end)) return;
        }

        const opName = hist.operatorName || debt.assignedTo?.name || 'Não identificado';
        if (operatorFilter !== 'all' && opName !== operatorFilter) return;

        if (statusFilter !== 'all' && debt.status !== statusFilter) return;

        if (
          q &&
          !debt.debtorName.toLowerCase().includes(q) &&
          !debt.debtorCnpjCpf.includes(q) &&
          !debt.titleNumber.toLowerCase().includes(q) &&
          !opName.toLowerCase().includes(q)
        ) {
          return;
        }

        rows.push({
          debtId: debt.id,
          historyId: hist.id,
          date: hist.dateFormatted || formatDateBR(histDate),
          time: hist.timeFormatted || '00:00',
          operatorName: opName,
          debtorName: debt.debtorName,
          debtorCnpjCpf: debt.debtorCnpjCpf,
          titleNumber: debt.titleNumber,
          installment: debt.installment,
          workedValue: debt.currentValue || 0,
          channel: hist.channel,
          result: hist.result,
          notes: hist.notes,
          empresaName: empresaMap.get(debt.empresaId) || 'Matriz',
        });
      });
    });

    return rows.sort((a, b) => {
      const dateA = parseDateString(a.date)?.getTime() || 0;
      const dateB = parseDateString(b.date)?.getTime() || 0;
      if (dateA !== dateB) return dateB - dateA; // Mais recente primeiro
      return (b.time || '').localeCompare(a.time || '');
    });
  }, [baseDebts, dateRange, operatorFilter, statusFilter, searchQuery, empresaMap]);

  // =========================================================================
  // 2. PROCESSAMENTO: RELATÓRIO DE RECEBIMENTOS
  // =========================================================================
  const recebimentosData = useMemo<RecebimentoRow[]>(() => {
    const rows: RecebimentoRow[] = [];
    const q = searchQuery.trim().toLowerCase();

    baseDebts.forEach((debt) => {
      (debt.payments || []).forEach((payment) => {
        const payDate = parseDateString(payment.date);
        if (dateRange.start && dateRange.end) {
          if (!payDate || !isDateInRange(payDate, dateRange.start, dateRange.end)) return;
        }

        const opName = debt.lastContact?.operatorName || debt.assignedTo?.name || 'Carlos Eduardo';
        if (operatorFilter !== 'all' && opName !== operatorFilter) return;

        if (
          q &&
          !debt.debtorName.toLowerCase().includes(q) &&
          !debt.debtorCnpjCpf.includes(q) &&
          !debt.titleNumber.toLowerCase().includes(q)
        ) {
          return;
        }

        rows.push({
          debtId: debt.id,
          paymentId: payment.id,
          paymentDate: payment.date,
          debtorName: debt.debtorName,
          debtorCnpjCpf: debt.debtorCnpjCpf,
          titleNumber: debt.titleNumber,
          installment: debt.installment,
          empresaName: empresaMap.get(debt.empresaId) || 'Matriz',
          receivedValue: Number(payment.value) || 0,
          paymentMethod: payment.method || 'PIX',
          status: payment.status || 'Liquidado',
          operatorName: opName,
        });
      });
    });

    return rows.sort((a, b) => {
      const dateA = parseDateString(a.paymentDate)?.getTime() || 0;
      const dateB = parseDateString(b.paymentDate)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [baseDebts, dateRange, operatorFilter, searchQuery, empresaMap]);

  // =========================================================================
  // 3. PROCESSAMENTO: RELATÓRIO DA CARTEIRA EM ABERTO
  // =========================================================================
  const carteiraData = useMemo<CarteiraRow[]>(() => {
    const rows: CarteiraRow[] = [];
    const q = searchQuery.trim().toLowerCase();

    baseDebts.forEach((debt) => {
      if (debt.status === 'pago') return; // Apenas cobranças em aberto

      if (operatorFilter !== 'all' && debt.assignedTo?.name !== operatorFilter) return;

      if (statusFilter !== 'all' && debt.status !== statusFilter) return;

      if (
        q &&
        !debt.debtorName.toLowerCase().includes(q) &&
        !debt.debtorCnpjCpf.includes(q) &&
        !debt.titleNumber.toLowerCase().includes(q)
      ) {
        return;
      }

      rows.push({
        debtId: debt.id,
        debtorName: debt.debtorName,
        debtorCnpjCpf: debt.debtorCnpjCpf,
        titleNumber: debt.titleNumber,
        installment: debt.installment,
        empresaName: empresaMap.get(debt.empresaId) || 'Matriz',
        originalValue: debt.originalValue || 0,
        currentValue: debt.currentValue || 0,
        dueDate: debt.dueDate,
        daysOverdue: debt.daysOverdue || 0,
        status: debt.status,
        statusLabel: debt.statusLabel,
        responsibleName: debt.assignedTo?.name || 'Não atribuído',
      });
    });

    return rows.sort((a, b) => b.daysOverdue - a.daysOverdue); // Maior atraso primeiro
  }, [baseDebts, operatorFilter, statusFilter, searchQuery, empresaMap]);

  // =========================================================================
  // 4. PROCESSAMENTO: RELATÓRIO DE PROMESSAS E RETORNOS (PRESERVANDO MÚLTIPLOS)
  // =========================================================================
  const promessasRetornosData = useMemo<PromessaRetornoRow[]>(() => {
    const rows: PromessaRetornoRow[] = [];
    const q = searchQuery.trim().toLowerCase();

    baseDebts.forEach((debt) => {
      const empName = empresaMap.get(debt.empresaId) || 'Matriz';

      // 4.1 Retornos Agendados (Múltiplos preservados)
      const returns = debt.scheduledReturns || [];
      returns.forEach((ret) => {
        const retDate = parseDateString(ret.date);
        if (dateRange.start && dateRange.end) {
          if (!retDate || !isDateInRange(retDate, dateRange.start, dateRange.end)) return;
        }

        const respName = ret.responsibleName || debt.assignedTo?.name || 'Carlos Eduardo';
        if (operatorFilter !== 'all' && respName !== operatorFilter) return;

        if (
          q &&
          !debt.debtorName.toLowerCase().includes(q) &&
          !debt.titleNumber.toLowerCase().includes(q) &&
          !ret.reason.toLowerCase().includes(q)
        ) {
          return;
        }

        rows.push({
          debtId: debt.id,
          uniqueId: ret.id,
          type: 'Retorno Agendado',
          debtorName: debt.debtorName,
          debtorCnpjCpf: debt.debtorCnpjCpf,
          titleNumber: debt.titleNumber,
          scheduledDate: ret.date,
          scheduledTime: ret.time || '09:00',
          promisedValue: null,
          status: ret.status || 'Agendado',
          responsibleName: respName,
          reasonOrNotes: ret.reason || 'Retorno operacional agendado',
          empresaName: empName,
        });
      });

      // 4.2 Promessas de Pagamento (PTPs)
      const promises = debt.promises || [];
      promises.forEach((prom) => {
        const promDate = parseDateString(prom.promisedDate || prom.dateRegistered);
        if (dateRange.start && dateRange.end) {
          if (!promDate || !isDateInRange(promDate, dateRange.start, dateRange.end)) return;
        }

        const respName = prom.operatorName || debt.assignedTo?.name || 'Carlos Eduardo';
        if (operatorFilter !== 'all' && respName !== operatorFilter) return;

        if (
          q &&
          !debt.debtorName.toLowerCase().includes(q) &&
          !debt.titleNumber.toLowerCase().includes(q) &&
          !prom.notes.toLowerCase().includes(q)
        ) {
          return;
        }

        rows.push({
          debtId: debt.id,
          uniqueId: prom.id,
          type: 'Promessa (PTP)',
          debtorName: debt.debtorName,
          debtorCnpjCpf: debt.debtorCnpjCpf,
          titleNumber: debt.titleNumber,
          scheduledDate: prom.promisedDate,
          scheduledTime: '18:00',
          promisedValue: Number(prom.promisedValue) || 0,
          status: prom.status || 'Pendente (Vigente)',
          responsibleName: respName,
          reasonOrNotes: prom.notes || 'Promessa de liquidação registrada',
          empresaName: empName,
        });
      });
    });

    return rows.sort((a, b) => {
      const dateA = parseDateString(a.scheduledDate)?.getTime() || 0;
      const dateB = parseDateString(b.scheduledDate)?.getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      return (a.scheduledTime || '').localeCompare(b.scheduledTime || '');
    });
  }, [baseDebts, dateRange, operatorFilter, searchQuery, empresaMap]);

  // =========================================================================
  // EXPORTAÇÃO CSV PARA O RELATÓRIO ATIVO (FASE 4)
  // =========================================================================
  const handleExportCsv = () => {
    const todayIso = formatDateISO(new Date());

    if (activeTab === 'producao') {
      const columns: CsvColumn<ProducaoRow>[] = [
        { header: 'Data', accessor: (r) => r.date, type: 'date' },
        { header: 'Hora', accessor: (r) => r.time },
        { header: 'Cobrador Responsável', accessor: (r) => r.operatorName },
        { header: 'Devedor', accessor: (r) => r.debtorName },
        { header: 'CNPJ/CPF', accessor: (r) => r.debtorCnpjCpf },
        { header: 'Título', accessor: (r) => r.titleNumber },
        { header: 'Parcela', accessor: (r) => r.installment },
        { header: 'Valor do Título (R$)', accessor: (r) => r.workedValue, type: 'currency' },
        { header: 'Canal', accessor: (r) => r.channel },
        { header: 'Resultado', accessor: (r) => r.result },
        { header: 'Empresa Credora', accessor: (r) => r.empresaName },
        { header: 'Observações / Histórico', accessor: (r) => r.notes },
      ];
      const ok = exportToCsv({
        filename: `regcobre_relatorio_producao_${todayIso}`,
        columns,
        data: producaoData,
      });
      if (ok) showToast('Relatório de Produção exportado em CSV com sucesso!');
      return;
    }

    if (activeTab === 'recebimentos') {
      const columns: CsvColumn<RecebimentoRow>[] = [
        { header: 'Data do Recebimento', accessor: (r) => r.paymentDate, type: 'date' },
        { header: 'Devedor', accessor: (r) => r.debtorName },
        { header: 'CNPJ/CPF', accessor: (r) => r.debtorCnpjCpf },
        { header: 'Título', accessor: (r) => r.titleNumber },
        { header: 'Parcela', accessor: (r) => r.installment },
        { header: 'Empresa Credora', accessor: (r) => r.empresaName },
        { header: 'Valor Recebido (R$)', accessor: (r) => r.receivedValue, type: 'currency' },
        { header: 'Forma de Pagamento', accessor: (r) => r.paymentMethod },
        { header: 'Situação', accessor: (r) => r.status },
        { header: 'Cobrador / Operador', accessor: (r) => r.operatorName },
      ];
      const ok = exportToCsv({
        filename: `regcobre_relatorio_recebimentos_${todayIso}`,
        columns,
        data: recebimentosData,
      });
      if (ok) showToast('Relatório de Recebimentos exportado em CSV com sucesso!');
      return;
    }

    if (activeTab === 'carteira') {
      const columns: CsvColumn<CarteiraRow>[] = [
        { header: 'Devedor', accessor: (r) => r.debtorName },
        { header: 'CNPJ/CPF', accessor: (r) => r.debtorCnpjCpf },
        { header: 'Título', accessor: (r) => r.titleNumber },
        { header: 'Parcela', accessor: (r) => r.installment },
        { header: 'Empresa Credora', accessor: (r) => r.empresaName },
        { header: 'Valor Original (R$)', accessor: (r) => r.originalValue, type: 'currency' },
        { header: 'Saldo Atual em Aberto (R$)', accessor: (r) => r.currentValue, type: 'currency' },
        { header: 'Data de Vencimento', accessor: (r) => r.dueDate, type: 'date' },
        { header: 'Dias em Atraso', accessor: (r) => r.daysOverdue, type: 'number' },
        { header: 'Status da Cobrança', accessor: (r) => r.statusLabel },
        { header: 'Responsável Atual', accessor: (r) => r.responsibleName },
      ];
      const ok = exportToCsv({
        filename: `regcobre_relatorio_carteira_em_aberto_${todayIso}`,
        columns,
        data: carteiraData,
      });
      if (ok) showToast('Relatório da Carteira em Aberto exportado em CSV com sucesso!');
      return;
    }

    if (activeTab === 'promessas_retornos') {
      const columns: CsvColumn<PromessaRetornoRow>[] = [
        { header: 'Tipo de Agendamento', accessor: (r) => r.type },
        { header: 'Data Prevista', accessor: (r) => r.scheduledDate, type: 'date' },
        { header: 'Hora Prevista', accessor: (r) => r.scheduledTime },
        { header: 'Devedor', accessor: (r) => r.debtorName },
        { header: 'CNPJ/CPF', accessor: (r) => r.debtorCnpjCpf },
        { header: 'Título', accessor: (r) => r.titleNumber },
        { header: 'Valor Prometido (R$)', accessor: (r) => r.promisedValue ?? 0, type: 'currency' },
        { header: 'Situação / Status', accessor: (r) => r.status },
        { header: 'Responsável', accessor: (r) => r.responsibleName },
        { header: 'Empresa Credora', accessor: (r) => r.empresaName },
        { header: 'Motivo / Detalhes', accessor: (r) => r.reasonOrNotes },
      ];
      const ok = exportToCsv({
        filename: `regcobre_relatorio_promessas_retornos_${todayIso}`,
        columns,
        data: promessasRetornosData,
      });
      if (ok) showToast('Relatório de Promessas e Retornos exportado em CSV com sucesso!');
    }
  };

  // =========================================================================
  // CONFIGURAÇÃO DO MODAL DE VISUALIZAÇÃO A4 / PDF (FASE 5)
  // =========================================================================
  const modalConfig = useMemo(() => {
    const filterSummary = [
      {
        label: 'Empresa',
        value:
          empresaFilter === 'all'
            ? 'Todas as Autorizadas'
            : empresaMap.get(empresaFilter) || 'Filial Selecionada',
      },
      {
        label: 'Cobrador',
        value: operatorFilter === 'all' ? 'Todos os Cobradores' : operatorFilter,
      },
    ];

    if (activeTab === 'producao') {
      const totalValor = producaoData.reduce((sum, r) => sum + r.workedValue, 0);
      const tiles: ReportViewerSummaryTile[] = [
        { label: 'Ações Registradas', value: String(producaoData.length) },
        {
          label: 'Cobranças Distintas',
          value: String(new Set(producaoData.map((r) => r.debtId)).size),
        },
        { label: 'Volume Auditado', value: formatCurrencyBR(totalValor), highlight: true },
      ];

      const columns: ReportViewerColumn<ProducaoRow>[] = [
        { header: 'Data/Hora', width: '12%', render: (r) => `${r.date} ${r.time}` },
        { header: 'Cobrador', width: '15%', render: (r) => r.operatorName },
        { header: 'Devedor', width: '22%', render: (r) => r.debtorName },
        { header: 'Título / Parcela', width: '13%', render: (r) => `${r.titleNumber} (${r.installment})` },
        {
          header: 'Valor Ação',
          width: '13%',
          align: 'right',
          render: (r) => formatCurrencyBR(r.workedValue),
        },
        { header: 'Canal', width: '10%', render: (r) => r.channel },
        { header: 'Desfecho / Resultado', width: '15%', render: (r) => r.result },
      ];

      return {
        title: 'RELATÓRIO DE PRODUÇÃO OPERACIONAL DE COBRANÇAS',
        subtitle:
          'Histórico completo de acionamentos, canais utilizados, valores trabalhados e desfechos registrados por operador no período.',
        periodLabel: dateRange.label,
        filterSummary,
        summaryTiles: tiles,
        columns,
        data: producaoData,
        totalsRow: {
          0: 'TOTAL:',
          4: formatCurrencyBR(totalValor),
        },
      };
    }

    if (activeTab === 'recebimentos') {
      const totalRecebido = recebimentosData.reduce((sum, r) => sum + r.receivedValue, 0);
      const tiles: ReportViewerSummaryTile[] = [
        { label: 'Total de Baixas', value: String(recebimentosData.length) },
        { label: 'Valor Efetivamente Recebido', value: formatCurrencyBR(totalRecebido), highlight: true },
      ];

      const columns: ReportViewerColumn<RecebimentoRow>[] = [
        { header: 'Data Baixa', width: '12%', render: (r) => r.paymentDate },
        { header: 'Devedor', width: '26%', render: (r) => r.debtorName },
        { header: 'Título / Parc.', width: '14%', render: (r) => `${r.titleNumber} (${r.installment})` },
        { header: 'Empresa Credora', width: '16%', render: (r) => r.empresaName },
        {
          header: 'Valor Recebido',
          width: '14%',
          align: 'right',
          render: (r) => formatCurrencyBR(r.receivedValue),
        },
        { header: 'Forma', width: '10%', render: (r) => r.paymentMethod },
        { header: 'Operador', width: '14%', render: (r) => r.operatorName },
      ];

      return {
        title: 'RELATÓRIO DE RECEBIMENTOS E LIQUIDAÇÕES DE COBRANÇA',
        subtitle:
          'Comprovantes bancários e pagamentos efetivamente creditados e conciliados na carteira.',
        periodLabel: dateRange.label,
        filterSummary,
        summaryTiles: tiles,
        columns,
        data: recebimentosData,
        totalsRow: {
          0: 'TOTAL RECEBIDO:',
          4: formatCurrencyBR(totalRecebido),
        },
      };
    }

    if (activeTab === 'carteira') {
      const totalCarteira = carteiraData.reduce((sum, r) => sum + r.currentValue, 0);
      const tiles: ReportViewerSummaryTile[] = [
        { label: 'Títulos em Aberto', value: String(carteiraData.length) },
        { label: 'Saldo Atual em Aberto', value: formatCurrencyBR(totalCarteira), highlight: true },
        {
          label: 'Atraso Médio',
          value: `${Math.round(
            carteiraData.reduce((sum, r) => sum + r.daysOverdue, 0) / (carteiraData.length || 1)
          )} dias`,
        },
      ];

      const columns: ReportViewerColumn<CarteiraRow>[] = [
        { header: 'Devedor', width: '26%', render: (r) => r.debtorName },
        { header: 'Título / Parc.', width: '14%', render: (r) => `${r.titleNumber} (${r.installment})` },
        { header: 'Empresa Credora', width: '16%', render: (r) => r.empresaName },
        { header: 'Vencimento', width: '12%', render: (r) => r.dueDate },
        { header: 'Atraso', width: '8%', align: 'center', render: (r) => `${r.daysOverdue}d` },
        {
          header: 'Saldo Atual',
          width: '14%',
          align: 'right',
          render: (r) => formatCurrencyBR(r.currentValue),
        },
        { header: 'Situação / Status', width: '16%', render: (r) => r.statusLabel },
      ];

      return {
        title: 'RELATÓRIO DA CARTEIRA EM ABERTO E INADIMPLÊNCIA',
        subtitle:
          'Posição sintética e analítica das cobranças ativas com saldo devedor pendente de liquidação.',
        periodLabel: dateRange.label,
        filterSummary,
        summaryTiles: tiles,
        columns,
        data: carteiraData,
        totalsRow: {
          0: 'SALDO EM ABERTO:',
          5: formatCurrencyBR(totalCarteira),
        },
      };
    }

    // promessas_retornos
    const totalPromessasVal = promessasRetornosData.reduce((sum, r) => sum + (r.promisedValue || 0), 0);
    const qtdRetornos = promessasRetornosData.filter((r) => r.type === 'Retorno Agendado').length;
    const qtdPromessas = promessasRetornosData.filter((r) => r.type === 'Promessa (PTP)').length;

    const tiles: ReportViewerSummaryTile[] = [
      { label: 'Total Agendamentos', value: String(promessasRetornosData.length) },
      { label: 'Retornos Telefônicos', value: String(qtdRetornos) },
      { label: 'Promessas (PTP)', value: String(qtdPromessas) },
      { label: 'Valor Prometido', value: formatCurrencyBR(totalPromessasVal), highlight: true },
    ];

    const columns: ReportViewerColumn<PromessaRetornoRow>[] = [
      { header: 'Tipo', width: '14%', render: (r) => r.type },
      { header: 'Data/Hora', width: '12%', render: (r) => `${r.scheduledDate} ${r.scheduledTime}` },
      { header: 'Devedor', width: '22%', render: (r) => r.debtorName },
      { header: 'Título', width: '10%', render: (r) => r.titleNumber },
      {
        header: 'Valor PTP',
        width: '13%',
        align: 'right',
        render: (r) => (r.promisedValue !== null ? formatCurrencyBR(r.promisedValue) : '-'),
      },
      { header: 'Status', width: '13%', render: (r) => r.status },
      { header: 'Responsável', width: '14%', render: (r) => r.responsibleName },
    ];

    return {
      title: 'RELATÓRIO DE PROMESSAS DE PAGAMENTO E RETORNOS AGENDADOS',
      subtitle:
        'Cronograma consolidado de callbacks telefônicos e promessas firmes (PTPs) registradas, preservando múltiplos retornos por cobrança.',
      periodLabel: dateRange.label,
      filterSummary,
      summaryTiles: tiles,
      columns,
      data: promessasRetornosData,
      totalsRow: {
        0: 'VALOR PROMETIDO:',
        4: formatCurrencyBR(totalPromessasVal),
      },
    };
  }, [
    activeTab,
    dateRange,
    empresaFilter,
    operatorFilter,
    empresaMap,
    producaoData,
    recebimentosData,
    carteiraData,
    promessasRetornosData,
  ]);

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-16 print:p-0 print:m-0 print:gap-0 print:pb-0 print:max-w-none">
      {/* Conteúdo Interativo da Tela da Central (Oculto estritamente na Impressão/PDF) */}
      <div className="flex flex-col gap-space-lg print:hidden">
        {/* 1. Header da Central de Relatórios */}
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-md border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[26px]">summarize</span>
            <span className="font-label-uppercase text-secondary font-bold uppercase tracking-wider text-xs">
              Módulo Oficial de Relatórios e Auditoria Corporativa
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold mt-1">
            Central de Relatórios Gerenciais
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Emissão analítica de relatórios de produção, recebimentos financeiros, posição da carteira em aberto e acompanhamento de retornos e promessas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="h-9 px-3.5 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-title-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/30"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">monitoring</span>
              <span>Dashboard Gerencial</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="h-9 px-4 rounded-lg bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-title-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            type="button"
            title="Exportar registros filtrados para planilha CSV (formato compatível com Excel)"
          >
            <span className="material-symbols-outlined text-[17px]">file_download</span>
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            type="button"
            title="Visualizar documento em formato A4 e imprimir ou salvar em PDF"
          >
            <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span>
            <span>Visualizar / PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* 2. Navegação por Abas dos 4 Relatórios Exigidos (Fase 3) */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('producao')}
          className={`px-4 py-2.5 font-title-md text-xs sm:text-sm font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'producao'
              ? 'border-primary text-primary bg-surface-container-lowest shadow-2xs font-bold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">engineering</span>
          <span>1. Produção de Cobranças</span>
          <span className="px-2 py-0.2 rounded-full bg-surface-container text-[11px] font-data-mono font-bold">
            {producaoData.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('recebimentos')}
          className={`px-4 py-2.5 font-title-md text-xs sm:text-sm font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'recebimentos'
              ? 'border-secondary text-secondary bg-surface-container-lowest shadow-2xs font-bold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>2. Recebimentos e Baixas</span>
          <span className="px-2 py-0.2 rounded-full bg-secondary-container/40 text-[11px] font-data-mono font-bold text-secondary">
            {recebimentosData.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('carteira')}
          className={`px-4 py-2.5 font-title-md text-xs sm:text-sm font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'carteira'
              ? 'border-primary text-primary bg-surface-container-lowest shadow-2xs font-bold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">folder_open</span>
          <span>3. Carteira em Aberto</span>
          <span className="px-2 py-0.2 rounded-full bg-surface-container text-[11px] font-data-mono font-bold">
            {carteiraData.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('promessas_retornos')}
          className={`px-4 py-2.5 font-title-md text-xs sm:text-sm font-semibold rounded-t-lg transition-colors cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'promessas_retornos'
              ? 'border-primary text-primary bg-surface-container-lowest shadow-2xs font-bold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">calendar_clock</span>
          <span>4. Promessas e Retornos</span>
          <span className="px-2 py-0.2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-data-mono font-bold">
            {promessasRetornosData.length}
          </span>
        </button>
      </div>

      {/* 3. Painel de Filtros Integrado */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Busca Rápida */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-outline uppercase tracking-wider block">
              Busca Rápida
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-outline">
                search
              </span>
              <input
                type="text"
                placeholder="Devedor, CNPJ, título ou operador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
          </div>

          {/* Empresa */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-outline uppercase tracking-wider block">
              Empresa Credora
            </label>
            <select
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-secondary transition-colors"
            >
              <option value="all">Todas as Empresas</option>
              {availableEmpresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nomeFantasia || emp.razaoSocial}
                </option>
              ))}
            </select>
          </div>

          {/* Cobrador */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-outline uppercase tracking-wider block">
              Cobrador / Operador
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

          {/* Período */}
          <div className="lg:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-outline uppercase tracking-wider block">
              Período de Apuração
            </label>
            <select
              value={periodPreset}
              onChange={(e) => setPeriodPreset(e.target.value as PeriodPreset)}
              className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-secondary transition-colors"
            >
              <option value="hoje">Hoje ({formatDateBR(refDate)})</option>
              <option value="esta_semana">Esta Semana</option>
              <option value="este_mes">Este Mês</option>
              <option value="todos">Todo o Histórico</option>
              <option value="personalizado">Personalizado (Datas)</option>
            </select>
          </div>
        </div>

        {periodPreset === 'personalizado' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-outline font-semibold">Datas:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-8 px-2.5 rounded bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface"
            />
            <span className="text-xs text-outline">até</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-8 px-2.5 rounded bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface"
            />
          </div>
        )}
      </div>

      {/* 4. Resumo de Indicadores da Aba Ativa */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
        {activeTab === 'producao' && (
          <>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Acionamentos</span>
              <span className="text-lg font-bold font-data-mono text-primary block mt-0.5">
                {producaoData.length}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Títulos Distintos</span>
              <span className="text-lg font-bold font-data-mono text-primary block mt-0.5">
                {new Set(producaoData.map((r) => r.debtId)).size}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Volume Trabalhado</span>
              <span className="text-lg font-bold font-data-mono text-primary block mt-0.5">
                {formatCurrencyBR(producaoData.reduce((sum, r) => sum + r.workedValue, 0))}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Período</span>
              <span className="text-xs font-semibold text-secondary block mt-1 truncate" title={dateRange.label}>
                {dateRange.label}
              </span>
            </div>
          </>
        )}

        {activeTab === 'recebimentos' && (
          <>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Qtd Pagamentos</span>
              <span className="text-lg font-bold font-data-mono text-primary block mt-0.5">
                {recebimentosData.length}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-secondary/40 bg-secondary-container/20">
              <span className="text-[10px] text-secondary font-bold uppercase block">Total Recebido</span>
              <span className="text-lg font-bold font-data-mono text-secondary block mt-0.5">
                {formatCurrencyBR(recebimentosData.reduce((sum, r) => sum + r.receivedValue, 0))}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Ticket Médio Baixa</span>
              <span className="text-lg font-bold font-data-mono text-primary block mt-0.5">
                {formatCurrencyBR(
                  recebimentosData.length > 0
                    ? recebimentosData.reduce((sum, r) => sum + r.receivedValue, 0) /
                        recebimentosData.length
                    : 0
                )}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Status</span>
              <span className="text-xs font-semibold text-secondary block mt-1">100% Conciliado</span>
            </div>
          </>
        )}

        {activeTab === 'carteira' && (
          <>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Títulos Abertos</span>
              <span className="text-lg font-bold font-data-mono text-primary block mt-0.5">
                {carteiraData.length}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-primary/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Saldo Total em Aberto</span>
              <span className="text-lg font-bold font-data-mono text-primary block mt-0.5">
                {formatCurrencyBR(carteiraData.reduce((sum, r) => sum + r.currentValue, 0))}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Valor Original</span>
              <span className="text-lg font-bold font-data-mono text-outline block mt-0.5">
                {formatCurrencyBR(carteiraData.reduce((sum, r) => sum + r.originalValue, 0))}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Atraso Médio</span>
              <span className="text-lg font-bold font-data-mono text-error block mt-0.5">
                {Math.round(
                  carteiraData.reduce((sum, r) => sum + r.daysOverdue, 0) / (carteiraData.length || 1)
                )}{' '}
                dias
              </span>
            </div>
          </>
        )}

        {activeTab === 'promessas_retornos' && (
          <>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Total Agendados</span>
              <span className="text-lg font-bold font-data-mono text-primary block mt-0.5">
                {promessasRetornosData.length}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Retornos Telefônicos</span>
              <span className="text-lg font-bold font-data-mono text-primary block mt-0.5">
                {promessasRetornosData.filter((r) => r.type === 'Retorno Agendado').length}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Promessas (PTP)</span>
              <span className="text-lg font-bold font-data-mono text-secondary block mt-0.5">
                {promessasRetornosData.filter((r) => r.type === 'Promessa (PTP)').length}
              </span>
            </div>
            <div className="p-3 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30">
              <span className="text-[10px] text-outline font-bold uppercase block">Volume Prometido</span>
              <span className="text-lg font-bold font-data-mono text-primary block mt-0.5">
                {formatCurrencyBR(
                  promessasRetornosData.reduce((sum, r) => sum + (r.promisedValue || 0), 0)
                )}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 5. Tabela do Relatório Selecionado */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        {/* 5.1 Tabela de Produção */}
        {activeTab === 'producao' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface font-label-uppercase uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Cobrador</th>
                  <th className="py-2.5 px-3">Devedor</th>
                  <th className="py-2.5 px-3">Título (Parc.)</th>
                  <th className="py-2.5 px-3 text-right">Valor Ação</th>
                  <th className="py-2.5 px-3">Canal</th>
                  <th className="py-2.5 px-3">Desfecho / Resultado</th>
                  <th className="py-2.5 px-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high font-data-mono text-xs">
                {producaoData.length > 0 ? (
                  producaoData.map((r, i) => (
                    <tr key={`${r.historyId}-${i}`} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-primary">{r.date}</span>{' '}
                        <span className="text-[11px] text-outline">{r.time}</span>
                      </td>
                      <td className="py-3 px-3 font-sans font-medium text-primary">{r.operatorName}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className="font-semibold text-primary block truncate max-w-[200px]" title={r.debtorName}>
                          {r.debtorName}
                        </span>
                        <span className="text-[10px] text-outline font-data-mono">{r.debtorCnpjCpf}</span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        {r.titleNumber} ({r.installment})
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-primary">
                        {formatCurrencyBR(r.workedValue)}
                      </td>
                      <td className="py-3 px-3 font-sans font-medium">{r.channel}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-semibold text-primary">
                          {r.result}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onSelectDebt(r.debtId)}
                          className="px-2 py-1 rounded bg-surface-container hover:bg-surface-variant text-primary font-sans text-[11px] font-semibold cursor-pointer transition-colors"
                          title="Abrir Ficha desta Cobrança"
                        >
                          Ver Ficha
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-on-surface-variant font-sans text-xs">
                      Nenhum registro de produção localizado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5.2 Tabela de Recebimentos */}
        {activeTab === 'recebimentos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface font-label-uppercase uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-2.5 px-3">Data Baixa</th>
                  <th className="py-2.5 px-3">Devedor</th>
                  <th className="py-2.5 px-3">Título (Parc.)</th>
                  <th className="py-2.5 px-3">Empresa Credora</th>
                  <th className="py-2.5 px-3 text-right">Valor Recebido</th>
                  <th className="py-2.5 px-3">Forma Pagto</th>
                  <th className="py-2.5 px-3">Situação</th>
                  <th className="py-2.5 px-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high font-data-mono text-xs">
                {recebimentosData.length > 0 ? (
                  recebimentosData.map((r, i) => (
                    <tr key={`${r.paymentId}-${i}`} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-3 font-bold text-primary">{r.paymentDate}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className="font-semibold text-primary block truncate max-w-[200px]" title={r.debtorName}>
                          {r.debtorName}
                        </span>
                        <span className="text-[10px] text-outline font-data-mono">{r.debtorCnpjCpf}</span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        {r.titleNumber} ({r.installment})
                      </td>
                      <td className="py-3 px-3 font-sans text-outline">{r.empresaName}</td>
                      <td className="py-3 px-3 text-right font-bold text-secondary text-sm">
                        {formatCurrencyBR(r.receivedValue)}
                      </td>
                      <td className="py-3 px-3 font-sans font-semibold">{r.paymentMethod}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onSelectDebt(r.debtId)}
                          className="px-2 py-1 rounded bg-surface-container hover:bg-surface-variant text-primary font-sans text-[11px] font-semibold cursor-pointer transition-colors"
                        >
                          Ver Ficha
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-on-surface-variant font-sans text-xs">
                      Nenhum recebimento registrado no período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5.3 Tabela da Carteira em Aberto */}
        {activeTab === 'carteira' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface font-label-uppercase uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-2.5 px-3">Devedor</th>
                  <th className="py-2.5 px-3">Título (Parc.)</th>
                  <th className="py-2.5 px-3">Empresa</th>
                  <th className="py-2.5 px-3">Vencimento</th>
                  <th className="py-2.5 px-3 text-center">Atraso</th>
                  <th className="py-2.5 px-3 text-right">Saldo em Aberto</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high font-data-mono text-xs">
                {carteiraData.length > 0 ? (
                  carteiraData.map((r) => (
                    <tr key={r.debtId} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-3 font-sans">
                        <span className="font-semibold text-primary block truncate max-w-[200px]" title={r.debtorName}>
                          {r.debtorName}
                        </span>
                        <span className="text-[10px] text-outline font-data-mono">{r.debtorCnpjCpf}</span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        {r.titleNumber} ({r.installment})
                      </td>
                      <td className="py-3 px-3 font-sans text-outline">{r.empresaName}</td>
                      <td className="py-3 px-3">{r.dueDate}</td>
                      <td className="py-3 px-3 text-center font-bold text-error">{r.daysOverdue} dias</td>
                      <td className="py-3 px-3 text-right font-bold text-primary text-sm">
                        {formatCurrencyBR(r.currentValue)}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${getDebtStatusRowClass(r.status)}`}>
                          {r.statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans">{r.responsibleName}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onSelectDebt(r.debtId)}
                          className="px-2 py-1 rounded bg-surface-container hover:bg-surface-variant text-primary font-sans text-[11px] font-semibold cursor-pointer transition-colors"
                        >
                          Ver Ficha
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-on-surface-variant font-sans text-xs">
                      Nenhuma cobrança em aberto encontrada com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 5.4 Tabela de Promessas e Retornos (Preservando múltiplos retornos) */}
        {activeTab === 'promessas_retornos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface font-label-uppercase uppercase tracking-wider border-b border-outline-variant">
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Data / Hora Agendada</th>
                  <th className="py-2.5 px-3">Devedor</th>
                  <th className="py-2.5 px-3">Título</th>
                  <th className="py-2.5 px-3 text-right">Valor Prometido</th>
                  <th className="py-2.5 px-3">Situação</th>
                  <th className="py-2.5 px-3">Responsável</th>
                  <th className="py-2.5 px-3">Motivo / Observações</th>
                  <th className="py-2.5 px-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high font-data-mono text-xs">
                {promessasRetornosData.length > 0 ? (
                  promessasRetornosData.map((r, i) => (
                    <tr key={`${r.uniqueId}-${i}`} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            r.type === 'Promessa (PTP)'
                              ? 'bg-secondary-container text-on-secondary-container'
                              : 'bg-tertiary-fixed text-on-tertiary-fixed'
                          }`}
                        >
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-primary">{r.scheduledDate}</span>{' '}
                        <span className="text-[11px] text-outline font-semibold">({r.scheduledTime})</span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="font-semibold text-primary block truncate max-w-[200px]" title={r.debtorName}>
                          {r.debtorName}
                        </span>
                        <span className="text-[10px] text-outline font-data-mono">{r.debtorCnpjCpf}</span>
                      </td>
                      <td className="py-3 px-3 font-sans">{r.titleNumber}</td>
                      <td className="py-3 px-3 text-right font-bold text-primary">
                        {r.promisedValue !== null ? formatCurrencyBR(r.promisedValue) : '-'}
                      </td>
                      <td className="py-3 px-3 font-sans font-semibold">{r.status}</td>
                      <td className="py-3 px-3 font-sans">{r.responsibleName}</td>
                      <td className="py-3 px-3 font-sans max-w-[220px] truncate text-on-surface-variant" title={r.reasonOrNotes}>
                        {r.reasonOrNotes}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onSelectDebt(r.debtId)}
                          className="px-2 py-1 rounded bg-surface-container hover:bg-surface-variant text-primary font-sans text-[11px] font-semibold cursor-pointer transition-colors"
                        >
                          Ver Ficha
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-on-surface-variant font-sans text-xs">
                      Nenhum agendamento de retorno ou promessa encontrado no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* 6. Modal Oficial de Visualização A4 / PDF (Fase 5) */}
      <ReportViewerModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={modalConfig.title}
        subtitle={modalConfig.subtitle}
        periodLabel={modalConfig.periodLabel}
        filterSummary={modalConfig.filterSummary}
        summaryTiles={modalConfig.summaryTiles}
        columns={modalConfig.columns}
        data={modalConfig.data}
        totalsRow={modalConfig.totalsRow}
        onExportCsv={handleExportCsv}
        empresaName={empresaFilter !== 'all' ? empresaMap.get(empresaFilter) : undefined}
      />

      {/* Toast de Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-primary text-surface px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 z-50 animate-bounce text-xs font-medium print:hidden">
          <span className="material-symbols-outlined text-secondary-fixed text-[18px]">
            check_circle
          </span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
