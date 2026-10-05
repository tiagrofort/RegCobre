import React, { useState } from 'react';
import { debtService } from '../services/debtService';
import { Debt } from '../types';
import { PdfPreviewModal } from '../components/PdfPreviewModal';
import { getDebtStatusRowClass, getDebtStatusRowStyle } from '../utils/debtStatusStyles';

interface ConferenciaViewProps {
  onSelectDebt: (debtId: string) => void;
}

export const ConferenciaView: React.FC<ConferenciaViewProps> = ({ onSelectDebt }) => {
  const [operatorFilter, setOperatorFilter] = useState('Todos os Cobradores');
  const [statusFilter, setStatusFilter] = useState('Todos os Status');
  const [channelFilter, setChannelFilter] = useState('Todos os Canais');
  const [searchQuery, setSearchQuery] = useState('');
  const [periodPreset, setPeriodPreset] = useState<'hoje' | 'ontem' | 'semana' | 'mes'>('mes');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredDebts = debtService.getAuditedRecords({
    operator: operatorFilter,
    status: statusFilter,
    channel: channelFilter,
    search: searchQuery,
  });

  const metrics = debtService.getSummaryMetrics();

  const handleResetFilters = () => {
    setOperatorFilter('Todos os Cobradores');
    setStatusFilter('Todos os Status');
    setChannelFilter('Todos os Canais');
    setSearchQuery('');
    setPeriodPreset('mes');
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Visual Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary-container to-secondary"></div>

      <div className="p-space-xl space-y-space-xl max-w-[1720px] mx-auto w-full">
        {/* 1. TOPO DA PÁGINA / BREADCRUMB E TÍTULO */}
        <section className="flex flex-col gap-space-md lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-space-xs max-w-3xl">
            <nav aria-label="Breadcrumb" className="flex items-center gap-space-xs font-body-sm text-body-sm text-outline">
              <span>Supervisão &amp; Diretoria</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>Auditoria Operacional</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface font-medium">Conferência de Cobranças</span>
            </nav>

            <div className="flex flex-wrap items-center gap-space-sm pt-1">
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                Conferência de Cobranças da Equipe
              </h1>
              <span className="font-badge-sm text-badge-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-semibold tracking-wider uppercase">
                [Perfil: Diretor/Supervisor]
              </span>
              <span className="font-badge-sm text-badge-sm px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold tracking-wider uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                [Permissão Avançada - Visão Consolidada de Carteiras]
              </span>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Consulta analítica e auditoria de ações registradas por todos os cobradores no período selecionado, com conciliação de recebimentos e rastreabilidade total.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-space-xs self-start shrink-0 pt-1">
            <button
              className="h-8 px-space-md rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-body-sm text-body-sm font-medium flex items-center gap-1.5 shadow-sm cursor-pointer border border-outline-variant/30"
              onClick={() => window.print()}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir</span>
            </button>

            <button
              className="h-8 px-space-md rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors font-body-sm text-body-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer group"
              onClick={() => setIsPdfModalOpen(true)}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-primary-fixed group-hover:scale-110 transition-transform">
                picture_as_pdf
              </span>
              <span>Gerar PDF</span>
              <span className="font-badge-sm text-[10px] px-1.5 py-0.2 rounded bg-surface-container-lowest/20 text-on-primary uppercase font-bold tracking-wider">
                A4 Corp
              </span>
            </button>

            <button
              className="h-8 px-space-md rounded-lg bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim transition-colors font-body-sm text-body-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              type="button"
              onClick={() => showToast('Planilha Excel de Auditoria exportada com sucesso.')}
            >
              <span className="material-symbols-outlined text-[16px]">table_view</span>
              <span>Exportar Excel</span>
            </button>

            <button
              className="h-8 px-space-md rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors font-body-sm text-body-sm font-medium flex items-center gap-1.5 shadow-sm cursor-pointer border border-outline-variant/30"
              type="button"
              onClick={() => showToast('Arquivo CSV consolidado gerado.')}
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>CSV</span>
            </button>
          </div>
        </section>

        {/* 2. BARRA DE FILTROS PROFISSIONAL E COMPACTA */}
        <section className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm space-y-space-md border border-outline-variant/30">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-space-md items-end">
            {/* Period Filter (Cols 1-4) */}
            <div className="xl:col-span-4 space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-label-uppercase text-label-uppercase text-outline font-bold tracking-wider uppercase">
                  Período de Auditoria
                </label>
                <div className="flex items-center gap-1 font-badge-sm text-[11px] font-semibold">
                  <button
                    onClick={() => setPeriodPreset('hoje')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      periodPreset === 'hoje'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                    type="button"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setPeriodPreset('ontem')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      periodPreset === 'ontem'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                    type="button"
                  >
                    Ontem
                  </button>
                  <button
                    onClick={() => setPeriodPreset('semana')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      periodPreset === 'semana'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                    type="button"
                  >
                    Semana Atual
                  </button>
                  <button
                    onClick={() => setPeriodPreset('mes')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      periodPreset === 'mes'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                    type="button"
                  >
                    Mês Atual
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-xs">
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-2 text-outline text-[16px] pointer-events-none">
                    calendar_today
                  </span>
                  <input
                    className="w-full h-8 pl-7 pr-2 bg-surface-container-low rounded-lg font-data-mono text-data-mono text-on-surface focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/30"
                    type="text"
                    defaultValue="01/11/2024"
                  />
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-2 text-outline text-[16px] pointer-events-none">
                    event
                  </span>
                  <input
                    className="w-full h-8 pl-7 pr-2 bg-surface-container-low rounded-lg font-data-mono text-data-mono text-on-surface focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/30"
                    type="text"
                    defaultValue="04/11/2024"
                  />
                </div>
              </div>
            </div>

            {/* Cobrador Filter (Cols 5-7) */}
            <div className="xl:col-span-3 space-y-1">
              <label className="font-label-uppercase text-label-uppercase text-outline font-bold tracking-wider uppercase">
                Operador / Cobrador
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2 text-outline text-[18px] pointer-events-none">
                  person_search
                </span>
                <select
                  className="w-full h-8 pl-7 pr-7 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest appearance-none cursor-pointer border border-outline-variant/30"
                  value={operatorFilter}
                  onChange={(e) => setOperatorFilter(e.target.value)}
                >
                  <option value="Todos os Cobradores">Todos os Cobradores</option>
                  <option value="Carlos Eduardo">Carlos Eduardo (Cobrador Sênior)</option>
                  <option value="Maria Oliveira">Maria Oliveira (Cobradora Pleno)</option>
                  <option value="Roberto Silveira">Roberto Silveira (Cobrador Jr)</option>
                  <option value="Juliana Mendes">Juliana Mendes (Cobradora)</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 text-outline text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Status Filter (Cols 8-9) */}
            <div className="xl:col-span-2 space-y-1">
              <label className="font-label-uppercase text-label-uppercase text-outline font-bold tracking-wider uppercase">
                Status / Situação
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2 text-outline text-[18px] pointer-events-none">
                  flag
                </span>
                <select
                  className="w-full h-8 pl-7 pr-7 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest appearance-none cursor-pointer border border-outline-variant/30"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Todos os Status">Todos os Status</option>
                  <option value="Em negociação">Em negociação</option>
                  <option value="Promessa">Promessa (PTP)</option>
                  <option value="Pago">Pago / Liquidado</option>
                  <option value="Quebrada">Promessa não cumprida</option>
                  <option value="Sem contato">Sem contato</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 text-outline text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Channel Filter (Col 10) */}
            <div className="xl:col-span-2 space-y-1">
              <label className="font-label-uppercase text-label-uppercase text-outline font-bold tracking-wider uppercase">
                Canal de Contato
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2 text-outline text-[18px] pointer-events-none">
                  forum
                </span>
                <select
                  className="w-full h-8 pl-7 pr-7 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-lowest appearance-none cursor-pointer border border-outline-variant/30"
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                >
                  <option value="Todos os Canais">Todos os Canais</option>
                  <option value="Ligação">Ligação Telefônica</option>
                  <option value="WhatsApp">WhatsApp Corporativo</option>
                  <option value="E-mail">E-mail Notificação</option>
                  <option value="Mensagem">SMS / Mensagem</option>
                  <option value="Serasa">Notificação Serasa</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 text-outline text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="xl:col-span-1 flex items-center gap-space-xs">
              <button
                className="w-full h-8 px-space-sm bg-primary-container hover:bg-primary text-on-primary rounded-lg font-body-sm text-body-sm font-semibold flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                title="Aplicar Filtros"
                type="button"
                onClick={() => showToast('Filtros aplicados com sucesso.')}
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                <span className="hidden sm:inline">Filtrar</span>
              </button>
              <button
                className="h-8 w-8 shrink-0 bg-surface-container-low hover:bg-surface-container-high text-outline hover:text-on-surface rounded-lg flex items-center justify-center transition-colors cursor-pointer border border-outline-variant/30"
                title="Limpar Filtros"
                type="button"
                onClick={handleResetFilters}
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              </button>
            </div>
          </div>

          {/* Active Filter Status Pill */}
          <div className="pt-space-xs flex flex-wrap items-center justify-between gap-space-sm border-t border-outline-variant/20">
            <div className="flex items-center gap-2 px-space-md py-1 bg-surface-container-low rounded-full border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-[16px]">tune</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Exibindo resultados para: <strong className="text-on-surface font-semibold">Período 01/11 a 04/11</strong> •{' '}
                <span className="text-on-surface">{operatorFilter}</span> •{' '}
                <span className="font-data-mono font-semibold text-primary">
                  {filteredDebts.length} Registros Encontrados
                </span>
              </span>
            </div>

            <div className="flex items-center gap-space-sm font-badge-sm text-badge-sm text-outline">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary"></span> Auditoria em Tempo Real
              </span>
              <span>•</span>
              <span className="font-data-mono">Última sincronização: hoje às 14:48:02</span>
            </div>
          </div>
        </section>

        {/* 3. CARDS DE RESUMO E INDICADORES CALCULADOS (7 METRIC TILES) */}
        <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-space-sm">
          {/* Card 1 */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-1 relative overflow-hidden group border border-outline-variant/30">
            <span className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block">
              Cobranças Trabalhadas
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-md text-headline-md font-bold text-primary font-data-mono">
                {filteredDebts.length}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">ações</span>
            </div>
            <span className="font-badge-sm text-[11px] text-outline block">100% da meta operacional</span>
          </div>

          {/* Card 2 */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-1 relative overflow-hidden group border border-outline-variant/30">
            <span className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block">
              Total Cobrado (Volume)
            </span>
            <div className="font-headline-md text-headline-md font-bold text-primary font-data-mono truncate">
              R${' '}
              {metrics.totalDebtAmount.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </div>
            <span className="font-badge-sm text-[11px] text-outline block">Em carteira ativa auditada</span>
          </div>

          {/* Card 3 (Destaque Recebido) */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-1 relative overflow-hidden group border border-secondary/30 bg-secondary-container/10">
            <div className="flex items-center justify-between">
              <span className="font-label-uppercase text-[10px] text-secondary font-bold uppercase tracking-wider block">
                Total Recebido (Baixado)
              </span>
              <span className="font-badge-sm text-[10px] px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold uppercase">
                24,4%
              </span>
            </div>
            <div className="font-headline-md text-headline-md font-bold text-secondary font-data-mono truncate">
              R${' '}
              {metrics.totalRecovered.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </div>
            <span className="font-badge-sm text-[11px] text-secondary font-semibold block flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">verified</span> TED/Pix Conciliados
            </span>
          </div>

          {/* Card 4 */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-1 relative overflow-hidden group border border-outline-variant/30">
            <span className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block">
              Total Prometido (PTP)
            </span>
            <div className="font-headline-md text-headline-md font-bold text-primary font-data-mono truncate">
              R${' '}
              {metrics.totalPromised.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </div>
            <span className="font-badge-sm text-[11px] text-outline block">Vencimentos até 20/11</span>
          </div>

          {/* Card 5 */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-1 relative overflow-hidden group border border-outline-variant/30">
            <span className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block">
              Promessas Geradas
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-md text-headline-md font-bold text-primary font-data-mono">
                {metrics.promisedDebtsCount}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">acordos</span>
            </div>
            <div className="flex items-center gap-1 font-badge-sm text-[10px]">
              <span className="text-secondary font-semibold">6 vigentes</span>
              <span className="text-outline">/</span>
              <span className="text-error font-semibold">2 quebras</span>
            </div>
          </div>

          {/* Card 6 */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-1 relative overflow-hidden group border border-outline-variant/30">
            <span className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block">
              Pagamentos Registrados
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-md text-headline-md font-bold text-primary font-data-mono">
                {metrics.paidDebtsCount}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">quitação</span>
            </div>
            <span className="font-badge-sm text-[11px] text-secondary font-semibold block">
              100% integradas ERP
            </span>
          </div>

          {/* Card 7 */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm space-y-1 relative overflow-hidden group border border-outline-variant/30">
            <span className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block">
              Retornos Agendados
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-md text-headline-md font-bold text-primary font-data-mono">
                {metrics.scheduledReturnsCount}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">retornos</span>
            </div>
            <span className="font-badge-sm text-[11px] text-outline block">Distribuição equilibrada</span>
          </div>
        </section>

        {/* 4. TABELA PROFISSIONAL DE CONFERÊNCIA AUDITÁVEL */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/30">
          {/* Table Header Bar */}
          <div className="p-space-md bg-surface-container-low flex flex-col lg:flex-row items-center justify-between gap-space-md border-b border-outline-variant/20">
            <div className="flex items-center gap-space-md w-full lg:w-auto">
              <div className="relative w-full sm:w-96">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input
                  className="w-full h-8 pl-8 pr-space-md bg-surface-container-lowest rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none border border-outline-variant/30"
                  placeholder="Buscar por devedor, título, CPF/CNPJ ou cobrador..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <span className="font-body-sm text-body-sm text-outline hidden sm:inline whitespace-nowrap">
                Mostrando <strong>{filteredDebts.length}</strong> registros auditáveis
              </span>
            </div>

            <div className="flex items-center gap-space-xs self-end lg:self-auto shrink-0">
              <button
                className="h-8 px-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-body-sm text-body-sm flex items-center gap-1 shadow-sm cursor-pointer border border-outline-variant/30"
                type="button"
                onClick={() => showToast('Visualização de colunas customizada.')}
              >
                <span className="material-symbols-outlined text-[16px]">view_column</span>
                <span>Colunas</span>
              </button>
              <button
                className="h-8 px-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-body-sm text-body-sm flex items-center gap-1 shadow-sm cursor-pointer border border-outline-variant/30"
                type="button"
                onClick={() => showToast('Densidade compacta ativada.')}
              >
                <span className="material-symbols-outlined text-[16px]">density_medium</span>
                <span>Densidade</span>
              </button>
              <button
                className="h-8 px-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-on-surface-variant font-body-sm text-body-sm flex items-center gap-1 shadow-sm cursor-pointer border border-outline-variant/30"
                type="button"
                onClick={() => showToast('Exportando registros selecionados em CSV...')}
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Exportar Seleção</span>
              </button>
            </div>
          </div>

          {/* Responsive Table Viewport */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface font-label-uppercase text-label-uppercase uppercase tracking-wider select-none text-[11px]">
                  <th className="py-2.5 px-3 whitespace-nowrap" scope="col">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
                      <span>Data / Hora</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap" scope="col">
                    Cobrador
                  </th>
                  <th className="py-2.5 px-3 min-w-[200px]" scope="col">
                    Devedor &amp; CNPJ/CPF
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap" scope="col">
                    Cobrança
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap" scope="col">
                    Vencimento
                  </th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap" scope="col">
                    Valor Cobrança
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-center" scope="col">
                    Resultado do Contato
                  </th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap" scope="col">
                    Valor Recebido
                  </th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap" scope="col">
                    Promessa (PTP)
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap" scope="col">
                    Data Prom.
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap" scope="col">
                    Próx. Retorno
                  </th>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap" scope="col">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {filteredDebts.map((d) => {
                  const statusStyle = getDebtStatusRowStyle(d.status);
                  const initials = d.assignedTo.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('');

                  return (
                    <tr
                      key={d.id}
                      className={`transition-colors group cursor-pointer ${getDebtStatusRowClass(d.status)}`}
                      onClick={() => onSelectDebt(d.id)}
                    >
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${statusStyle.indicatorClass}`}
                            title={`Status: ${statusStyle.label}`}
                          ></span>
                          <div className="font-data-mono text-data-mono font-medium text-primary">
                            {d.lastContact?.date || '04/11'} {d.lastContact?.time || '11:15'}
                          </div>
                        </div>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-primary leading-none">
                              {d.assignedTo.name}
                            </span>
                            <span className="text-[10px] text-outline">
                              {d.assignedTo.role.split(' ')[1] || 'Operador'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-primary truncate max-w-[220px]">
                              {d.debtorName}
                            </span>
                            <span className="font-badge-sm text-[9px] px-1 py-0.2 rounded bg-surface-container text-on-surface-variant font-bold">
                              {d.debtorType}
                            </span>
                          </div>
                          <span className="font-data-mono text-[11px] text-outline">
                            {d.debtorType === 'PJ' ? 'CNPJ' : 'CPF'}: {d.debtorCnpjCpf}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-data-mono font-bold text-primary">
                            {d.titleNumber}
                          </span>
                          <span className="font-badge-sm text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-medium">
                            {d.installment}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-data-mono text-on-surface">{d.dueDate}</span>
                          <span
                            className={`text-[10px] font-semibold ${
                              d.daysOverdue > 0 ? 'text-error' : 'text-secondary'
                            }`}
                          >
                            {d.daysOverdue > 0 ? `${d.daysOverdue}d atraso` : 'Em dia'}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-right whitespace-nowrap font-data-mono">
                        <div className="font-semibold text-primary">
                          R${' '}
                          {d.currentValue.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-[10px] text-outline">
                          Orig: R${' '}
                          {d.originalValue.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </td>

                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {d.status === 'pago' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-badge-sm text-badge-sm bg-secondary text-on-secondary font-semibold uppercase">
                            <span className="material-symbols-outlined text-[13px]">done_all</span>
                            Liquidado
                          </span>
                        ) : d.status === 'promessa_firme' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-badge-sm text-badge-sm bg-secondary-container text-on-secondary-container font-semibold uppercase">
                            <span className="material-symbols-outlined text-[13px]">handshake</span>
                            Prometeu Pagar
                          </span>
                        ) : d.status === 'quebrou_acordo' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-badge-sm text-badge-sm bg-error-container text-on-error-container font-semibold uppercase">
                            <span className="material-symbols-outlined text-[13px]">warning</span>
                            Promessa Quebrada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-badge-sm text-badge-sm bg-surface-container-high text-on-surface-variant font-semibold uppercase">
                            {d.lastContact?.result || d.statusLabel}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-right whitespace-nowrap font-data-mono">
                        {d.payments[0] ? (
                          <>
                            <div className="font-bold text-secondary">
                              R${' '}
                              {d.payments[0].value.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-[10px] text-secondary font-semibold">
                              {d.payments[0].method}
                            </div>
                          </>
                        ) : (
                          <span className="text-outline">-</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-right whitespace-nowrap font-data-mono">
                        {d.activePromise ? (
                          <>
                            <div className="font-bold text-secondary">
                              R${' '}
                              {d.activePromise.promisedValue.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            <div className="font-badge-sm text-[9px] text-on-secondary-fixed-variant uppercase font-semibold">
                              {d.activePromise.status}
                            </div>
                          </>
                        ) : (
                          <span className="text-outline">-</span>
                        )}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap font-data-mono font-semibold text-primary">
                        {d.activePromise?.promisedDate || '-'}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap">
                        {d.nextReturn ? (
                          <div className="flex items-center gap-1 text-on-tertiary-container font-data-mono text-[11px] font-semibold">
                            <span className="material-symbols-outlined text-[14px]">alarm</span>
                            {d.nextReturn.date.slice(5)} {d.nextReturn.time}
                          </div>
                        ) : (
                          <span className="text-outline text-xs">-</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectDebt(d.id)}
                            className="h-7 px-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-body-sm text-[11px] font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
                            title={`Abrir Ficha da Cobrança ${d.titleNumber}`}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[14px]">folder_open</span>
                            <span>Ver Ficha</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-md border-t border-outline-variant/20">
            <div className="flex items-center gap-space-md font-body-sm text-body-sm text-outline">
              <span>
                Exibindo <strong>1 a {filteredDebts.length}</strong> de <strong>48</strong> cobranças auditadas
              </span>
            </div>

            <nav aria-label="Paginação" className="flex items-center gap-1 font-body-sm text-body-sm">
              <button
                className="h-7 px-2 rounded bg-surface-container-lowest text-outline-variant cursor-not-allowed flex items-center"
                disabled
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span className="hidden sm:inline">Anterior</span>
              </button>
              <button
                className="h-7 w-7 rounded bg-primary-container text-on-primary font-bold flex items-center justify-center shadow-sm"
                type="button"
              >
                1
              </button>
              <button
                className="h-7 w-7 rounded bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-medium flex items-center justify-center transition-colors cursor-pointer"
                type="button"
              >
                2
              </button>
              <button
                className="h-7 px-2 rounded bg-surface-container-lowest hover:bg-surface-container-high text-on-surface font-medium flex items-center transition-colors cursor-pointer"
                type="button"
              >
                <span className="hidden sm:inline">Próximo</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </nav>
          </div>
        </section>

        {/* Audit Footer Log Metadata */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-outline font-data-mono pt-2 px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
            <span>REGCOBRE AUDIT ENGINE • Protocolo de Inspeção: #AUD-2024-1104-9842</span>
          </div>
          <div>
            HASH CRIPTOGRÁFICO DE CONFERÊNCIA:{' '}
            <span className="text-on-surface font-semibold">9e4a81cf208b47e2a4bc031908d</span>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      <PdfPreviewModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} />

      {/* Toast Alert */}
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
