import React, { useState } from 'react';
import { debtService } from '../services/debtService';
import { useAuth } from '../context/AuthContext';
import { ContactChannel, ContactResult } from '../types';
import { getDebtStatusRowClass, getDebtStatusRowStyle } from '../utils/debtStatusStyles';

interface RelatorioDiarioViewProps {
  onOpenFinishModal?: () => void;
  onSelectDebt?: (debtId: string) => void;
}

export const RelatorioDiarioView: React.FC<RelatorioDiarioViewProps> = ({
  onOpenFinishModal,
  onSelectDebt,
}) => {
  const { currentUser } = useAuth();
  const producao = debtService.getProducaoDoDia();
  const agenda = debtService.getAgendaDoDia();
  const debts = debtService.getAllDebts();

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'trabalhadas' | 'pendentes' | 'todas'>('trabalhadas');
  const [selectedChannel, setSelectedChannel] = useState<string>('todos');
  const [selectedResult, setSelectedResult] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const workingDate = producao.date;

  // Contact history items from today
  const todayHistory = debts.flatMap((d) =>
    d.history
      .filter((h) => h.dateFormatted.includes(workingDate) || h.dateFormatted.includes('04/11'))
      .map((h) => ({
        ...h,
        debtId: d.id,
        debtTitle: d.titleNumber,
        debtorName: d.debtorName,
        debtorCnpjCpf: d.debtorCnpjCpf,
        debtCurrentValue: d.currentValue,
      }))
  );

  // Group count by result
  const resultCounts = todayHistory.reduce((acc, item) => {
    acc[item.result] = (acc[item.result] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Agenda separated into worked vs pending
  const workedItems = agenda.filter((a) => a.status === 'Trabalhada');
  const pendingItems = agenda.filter((a) => a.status !== 'Trabalhada');

  // Filtered list based on active tab and query
  const getFilteredItems = () => {
    let baseList =
      activeTab === 'trabalhadas'
        ? workedItems
        : activeTab === 'pendentes'
        ? pendingItems
        : agenda;

    if (selectedChannel !== 'todos') {
      baseList = baseList.filter((item) => {
        const lastHist = item.debt.history[0];
        return lastHist && lastHist.channel.toLowerCase() === selectedChannel.toLowerCase();
      });
    }

    if (selectedResult !== 'todos') {
      baseList = baseList.filter((item) => {
        const lastHist = item.debt.history[0];
        return lastHist && lastHist.result.toLowerCase() === selectedResult.toLowerCase();
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      baseList = baseList.filter(
        (item) =>
          item.debt.debtorName.toLowerCase().includes(q) ||
          item.debt.debtorCnpjCpf.includes(q) ||
          item.debt.titleNumber.toLowerCase().includes(q)
      );
    }

    return baseList;
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-16">
      {/* 1. Header do Relatório Diário */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="material-symbols-outlined text-primary text-[26px]">description</span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Produção &amp; Relatório do Dia
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-badge-sm text-badge-sm font-semibold">
              Data: {workingDate}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-badge-sm text-[11px] font-semibold">
              Cobrador: {currentUser?.name || producao.operatorName}
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Espelho real das ações operacionais realizadas hoje, balanço quantitativo e financeiro da carteira, e controle de cobranças transferidas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenFinishModal && (
            <button
              onClick={onOpenFinishModal}
              className="h-9 px-4 rounded-lg bg-secondary hover:bg-on-secondary-container text-on-secondary font-title-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              type="button"
              title="Encerrar o expediente e transferir não trabalhadas para o próximo dia"
            >
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              <span>Encerrar Dia (FINISH)</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="h-9 px-4 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-title-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/30"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* 2. Grid de Indicadores Quantitativos e Financeiros (Especificação Exata) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-space-sm">
        {/* Previstas */}
        <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[10px] font-label-uppercase text-outline font-bold uppercase">
            Previstas no Dia
          </span>
          <div className="mt-1">
            <span className="font-headline-md font-bold text-primary font-data-mono block">
              {producao.previstas}
            </span>
            <span className="text-[11px] text-on-surface-variant">Meta: {producao.metaDiaria} ações</span>
          </div>
        </div>

        {/* Trabalhadas */}
        <div className="p-3.5 bg-secondary-container/20 rounded-xl shadow-sm border border-secondary/30 flex flex-col justify-between">
          <span className="text-[10px] font-label-uppercase text-secondary font-bold uppercase">
            Trabalhadas
          </span>
          <div className="mt-1">
            <span className="font-headline-md font-bold text-secondary font-data-mono block">
              {producao.trabalhadas}
            </span>
            <span className="text-[11px] text-secondary font-semibold">
              {producao.percentualRealizado}% do previsto
            </span>
          </div>
        </div>

        {/* Não Trabalhadas / Pendentes */}
        <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[10px] font-label-uppercase text-error font-bold uppercase">
            Não Trabalhadas
          </span>
          <div className="mt-1">
            <span className={`font-headline-md font-bold font-data-mono block ${producao.pendentes > 0 ? 'text-error' : 'text-secondary'}`}>
              {producao.pendentes}
            </span>
            <span className="text-[11px] text-on-surface-variant">Para próximo dia</span>
          </div>
        </div>

        {/* Valor Previsto (Carteira) */}
        <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[10px] font-label-uppercase text-outline font-bold uppercase">
            Valor Previsto
          </span>
          <div className="mt-1">
            <span className="font-title-md font-bold text-primary font-data-mono block truncate">
              R$ {producao.valorCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-on-surface-variant">Carteira total do dia</span>
          </div>
        </div>

        {/* Valor Trabalhado */}
        <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[10px] font-label-uppercase text-outline font-bold uppercase">
            Valor Trabalhado
          </span>
          <div className="mt-1">
            <span className="font-title-md font-bold text-primary font-data-mono block truncate">
              R$ {producao.valorTrabalhado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-on-surface-variant">Títulos acionados</span>
          </div>
        </div>

        {/* Valor Recebido */}
        <div className="p-3.5 bg-secondary-container/20 rounded-xl shadow-sm border border-secondary/30 flex flex-col justify-between">
          <span className="text-[10px] font-label-uppercase text-secondary font-bold uppercase">
            Valor Recebido
          </span>
          <div className="mt-1">
            <span className="font-title-md font-bold text-secondary font-data-mono block truncate">
              R$ {producao.valorRecuperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-secondary font-semibold">Baixas confirmadas</span>
          </div>
        </div>

        {/* Valor Prometido */}
        <div className="p-3.5 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between">
          <span className="text-[10px] font-label-uppercase text-outline font-bold uppercase">
            Valor Prometido
          </span>
          <div className="mt-1">
            <span className="font-title-md font-bold text-primary font-data-mono block truncate">
              R$ {producao.valorPrometido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-on-surface-variant">{producao.qtdPromessas} promessas</span>
          </div>
        </div>
      </div>

      {/* 3. Resultados dos Contatos Realizados */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/30 flex flex-col gap-2">
        <span className="text-xs font-label-uppercase text-outline font-bold uppercase tracking-wider">
          Desfechos e Resultados dos Contatos Registrados Hoje
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(resultCounts).length === 0 ? (
            <span className="text-xs text-on-surface-variant">Nenhum contato registrado nesta data ainda.</span>
          ) : (
            Object.entries(resultCounts).map(([resName, count]) => {
              const isSelected = selectedResult === resName;
              return (
                <button
                  key={resName}
                  type="button"
                  onClick={() => setSelectedResult(isSelected ? 'todos' : resName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-surface shadow-xs'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  <span>{resName}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-surface-container-lowest text-primary font-data-mono font-bold text-[11px]">
                    {count}
                  </span>
                </button>
              );
            })
          )}
          {selectedResult !== 'todos' && (
            <button
              type="button"
              onClick={() => setSelectedResult('todos')}
              className="text-xs text-secondary hover:underline font-semibold ml-2 cursor-pointer"
            >
              Limpar filtro de resultado
            </button>
          )}
        </div>
      </div>

      {/* 4. Abas e Filtros das Cobranças */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        {/* Barra de Abas */}
        <div className="p-space-md bg-surface-container-low border-b border-outline-variant/20 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          {/* Abas */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('trabalhadas')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-title-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'trabalhadas'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:text-primary font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
              <span>Cobranças Trabalhadas ({workedItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pendentes')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-title-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pendentes'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:text-primary font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-error">pending_actions</span>
              <span>Não Trabalhadas / Pendentes ({pendingItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('todas')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-title-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'todas'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
                  : 'text-on-surface-variant hover:text-primary font-medium'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">list_alt</span>
              <span>Todas da Agenda ({agenda.length})</span>
            </button>
          </div>

          {/* Filtros Secundários */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-outline">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar devedor, título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 bg-surface-container-lowest rounded-lg text-xs text-on-surface border border-outline-variant/40 focus:border-primary w-48 sm:w-56"
              />
            </div>

            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="h-8 px-2 bg-surface-container-lowest rounded-lg text-xs text-on-surface border border-outline-variant/40"
            >
              <option value="todos">Todos os Canais</option>
              <option value="ligação">Ligação</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="mensagem">Mensagem</option>
              <option value="e-mail">E-mail</option>
              <option value="serasa">Serasa</option>
            </select>
          </div>
        </div>

        {/* Tabela de Cobranças */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-body-sm text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface font-label-uppercase text-[11px] uppercase tracking-wider select-none">
                <th className="py-2.5 px-3">Devedor</th>
                <th className="py-2.5 px-3">Título</th>
                <th className="py-2.5 px-3">Vencimento</th>
                <th className="py-2.5 px-3 text-right">Valor Atual</th>
                <th className="py-2.5 px-3">Status no Dia</th>
                <th className="py-2.5 px-3">Última Ação / Desfecho</th>
                <th className="py-2.5 px-3">Canal</th>
                <th className="py-2.5 px-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-on-surface-variant text-xs">
                    Nenhuma cobrança encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const d = item.debt;
                  const isTrabalhada = item.status === 'Trabalhada';
                  const lastHist = d.history[0];
                  const statusStyle = getDebtStatusRowStyle(d.status);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${getDebtStatusRowClass(d.status)} ${
                        !isTrabalhada ? 'opacity-85' : ''
                      }`}
                    >
                      {/* Devedor */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle.indicatorClass}`}
                              title={`Status: ${statusStyle.label}`}
                            />
                            <button
                              type="button"
                              onClick={() => onSelectDebt && onSelectDebt(d.id)}
                              className="font-title-md font-semibold text-primary hover:underline text-left cursor-pointer truncate max-w-[220px]"
                            >
                              {d.debtorName}
                            </button>
                          </div>
                          <span className="font-data-mono text-[10px] text-on-surface-variant">
                            CNPJ/CPF: {d.debtorCnpjCpf}
                          </span>
                        </div>
                      </td>

                      {/* Título */}
                      <td className="py-2.5 px-3 font-data-mono">
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">{d.titleNumber}</span>
                          <span className="text-[10px] text-on-surface-variant">
                            Parc. {d.installment}
                          </span>
                        </div>
                      </td>

                      {/* Vencimento */}
                      <td className="py-2.5 px-3 font-data-mono">
                        <span className="text-on-surface">{d.dueDate}</span>
                      </td>

                      {/* Valor */}
                      <td className="py-2.5 px-3 text-right font-data-mono font-bold text-primary text-sm">
                        R$ {d.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status no Dia */}
                      <td className="py-2.5 px-3">
                        {isTrabalhada ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-badge-sm text-[10px] font-semibold">
                            <span className="material-symbols-outlined text-[12px]">check</span>
                            Trabalhada
                          </span>
                        ) : item.isCarriedOver ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-badge-sm text-[10px] font-semibold">
                            <span className="material-symbols-outlined text-[12px]">redo</span>
                            Carregada anterior
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-badge-sm text-[10px] font-semibold">
                            <span className="material-symbols-outlined text-[12px]">pending</span>
                            Pendente / Carregar
                          </span>
                        )}
                      </td>

                      {/* Última Ação / Desfecho */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-primary text-xs">
                            {isTrabalhada ? item.lastResult || d.lastContact?.result || 'Atendido' : 'Sem contato hoje'}
                          </span>
                          {lastHist && isTrabalhada && (
                            <span className="text-[10px] text-on-surface-variant truncate max-w-[200px]">
                              {lastHist.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Canal */}
                      <td className="py-2.5 px-3 font-data-mono text-xs">
                        {isTrabalhada ? (
                          <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface text-[11px]">
                            {lastHist?.channel || 'WhatsApp'}
                          </span>
                        ) : (
                          <span className="text-outline text-[11px]">-</span>
                        )}
                      </td>

                      {/* Ação */}
                      <td className="py-2.5 px-3 text-center">
                        {onSelectDebt && (
                          <button
                            type="button"
                            onClick={() => onSelectDebt(d.id)}
                            className={`h-7 px-2.5 rounded font-title-md text-[11px] font-semibold transition-all cursor-pointer ${
                              isTrabalhada
                                ? 'bg-surface-container hover:bg-surface-variant text-on-surface'
                                : 'bg-primary hover:bg-primary-container text-surface'
                            }`}
                          >
                            {isTrabalhada ? 'Ver Ficha' : 'FAZ (Cobrar)'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
