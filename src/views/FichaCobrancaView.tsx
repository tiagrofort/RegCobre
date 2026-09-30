import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import { Debt, Debtor, ContactChannel } from '../types';

interface FichaCobrancaViewProps {
  debtId: string;
  onBackToPortfolio: () => void;
  onOpenFastLog: (debt: Debt) => void;
  onNavigateToDebtor: (debtorId: string) => void;
  onSelectAnotherDebt: (newDebtId: string) => void;
}

export const FichaCobrancaView: React.FC<FichaCobrancaViewProps> = ({
  debtId,
  onBackToPortfolio,
  onOpenFastLog,
  onNavigateToDebtor,
  onSelectAnotherDebt,
}) => {
  const { currentUser } = useAuth();
  const debt = debtService.getDebtById(debtId) || debtService.getAllDebts()[0];
  const debtor = debtService.getDebtorById(debt.debtorId) || debtService.getAllDebtors()[0];
  const debtorDebts = debtService.getDebtsByDebtorId(debt.debtorId);

  const [historyFilter, setHistoryFilter] = useState<'all' | 'call' | 'whatsapp' | 'promise' | 'system'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filter history items
  const filteredHistory = debt.history.filter((h) => {
    if (historyFilter === 'call') return h.channel === 'Ligação';
    if (historyFilter === 'whatsapp') return h.channel === 'WhatsApp';
    if (historyFilter === 'promise') return !!h.attachedPromise || h.result === 'Prometeu pagar';
    if (historyFilter === 'system') return h.isSystem || h.channel === 'Outro';
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Topo de Contexto e Auditoria */}
      <div className="p-space-lg bg-surface-container-low flex flex-col gap-space-md border-b border-outline-variant/30">
        {/* Breadcrumb e Ações Globais */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              onClick={onBackToPortfolio}
              className="inline-flex items-center gap-space-2xs text-secondary hover:text-on-secondary-container transition-colors font-title-md text-title-md cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Voltar para Minha Carteira</span>
            </button>
            <span className="text-outline-variant">•</span>
            <nav className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant flex-wrap">
              <span>Cobranças Corporativas</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <button
                onClick={() => onNavigateToDebtor(debtor.id)}
                className="hover:text-primary hover:underline cursor-pointer"
              >
                Devedores
              </button>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface font-semibold truncate max-w-[200px]">
                {debt.debtorName}
              </span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-data-mono text-data-mono text-primary-container font-semibold">
                Cobrança {debt.titleNumber}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              onClick={() => window.print()}
              className="h-8 px-space-md bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-lg shadow-sm font-label-uppercase text-label-uppercase tracking-wider inline-flex items-center gap-space-xs transition-colors cursor-pointer border border-outline-variant/30"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                print
              </span>
              <span>Imprimir Ficha Completa</span>
            </button>

            <button
              onClick={() =>
                showToast(`Solicitação de transferência da Cobrança ${debt.titleNumber} registrada para a supervisão.`)
              }
              className="h-8 px-space-md bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-lg shadow-sm font-label-uppercase text-label-uppercase tracking-wider inline-flex items-center gap-space-xs transition-colors cursor-pointer border border-outline-variant/30"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                swap_horiz
              </span>
              <span>Transferir Cobrança</span>
            </button>

            <button
              onClick={() => onOpenFastLog(debt)}
              className="h-8 px-space-md bg-secondary hover:bg-on-secondary-container text-on-secondary rounded-lg shadow-md font-label-uppercase text-label-uppercase tracking-wider inline-flex items-center gap-space-xs transition-all hover:scale-[1.02] cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_call</span>
              <span>+ Registrar Cobrança</span>
            </button>
          </div>
        </div>

        {/* Banner Informativo de Custódia e Auditoria */}
        <div className="px-space-md py-space-xs bg-surface-container rounded-lg flex items-center justify-between gap-space-sm border border-outline-variant/20">
          <div className="flex items-center gap-space-sm min-w-0">
            <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
              verified
            </span>
            <span className="font-body-sm text-body-sm text-on-surface truncate">
              <strong>Auditoria de Custódia:</strong> Cobrança sob gestão de{' '}
              <span className="font-medium text-secondary">{debt.assignedTo.name}</span>. Histórico permanente de interações e promessas preservado integralmente.
            </span>
          </div>
          <span className="hidden sm:inline-block font-data-mono text-data-mono text-on-surface-variant shrink-0 text-xs">
            HASH-AUDIT: #{debt.erpCode.replace('#', '')}-{debt.titleNumber.replace('#', '')}-BR
          </span>
        </div>

        {/* Ficha Principal do Título / Header Hero Operacional */}
        <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg border border-outline-variant/30">
          {/* Bloco Devedor e Título */}
          <div className="flex flex-col gap-space-2xs min-w-0">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="px-space-xs py-space-2xs rounded bg-surface-container-highest text-on-surface font-badge-sm text-badge-sm uppercase tracking-wider">
                {debt.debtorType === 'PJ' ? 'Pessoa Jurídica - PJ' : 'Pessoa Física - PF'}
              </span>
              <span className="font-data-mono text-data-mono text-on-surface-variant">
                ERP TOTVS {debt.erpCode}
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-data-mono text-data-mono text-on-surface-variant">
                {debt.debtorType === 'PJ' ? 'CNPJ' : 'CPF'}: {debt.debtorCnpjCpf}
              </span>
              <span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-container font-badge-sm text-badge-sm font-semibold">
                RFB: {debtor.status}
              </span>
            </div>

            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight truncate mt-space-2xs font-bold">
              {debt.debtorName}
            </h1>

            <div className="flex items-center gap-space-sm flex-wrap mt-space-2xs">
              <span className="px-space-sm py-space-2xs rounded bg-primary-container text-surface font-data-mono text-data-mono font-semibold">
                Título {debt.titleNumber}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                Parcela {debt.installment} • {debt.invoiceNumber}
              </span>
              <span className="text-outline-variant">•</span>
              <span
                className={`px-space-xs py-space-2xs rounded font-badge-sm text-badge-sm font-semibold flex items-center gap-space-2xs ${
                  debt.daysOverdue > 0
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-secondary-container text-on-secondary-container'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    debt.daysOverdue > 0 ? 'bg-error' : 'bg-secondary'
                  }`}
                ></span>
                {debt.daysOverdue > 0 ? `${debt.daysOverdue} dias em atraso` : 'Em dia'}
              </span>
              <span className="px-space-xs py-space-2xs rounded bg-tertiary-fixed text-on-tertiary-fixed font-badge-sm text-badge-sm font-semibold">
                {debt.statusLabel}
              </span>
            </div>
          </div>

          {/* Bloco Valores e Operador Atual */}
          <div className="flex items-center gap-space-xl flex-wrap xl:flex-nowrap bg-surface-container-low p-space-md rounded-xl border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                Vencimento Original
              </span>
              <span className="font-data-mono text-data-mono text-on-surface font-semibold text-base">
                {debt.dueDate}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Orig: R$ {debt.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="h-10 w-px bg-outline-variant opacity-40"></div>

            <div className="flex flex-col">
              <span className="font-label-uppercase text-label-uppercase text-secondary font-semibold">
                Valor Corrigido (Multa/Juros)
              </span>
              <span className="font-headline-md text-headline-md text-on-surface font-bold font-data-mono tabular-nums">
                R$ {debt.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="font-badge-sm text-badge-sm text-error font-medium">
                +R$ {debt.interestFine.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} encargos
              </span>
            </div>

            <div className="h-10 w-px bg-outline-variant opacity-40"></div>

            <div className="flex flex-col min-w-[140px]">
              <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                Responsável Atual
              </span>
              <span className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-space-2xs">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  support_agent
                </span>
                {debt.assignedTo.name}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {debt.assignedTo.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: RESUMO EXECUTIVO DA SITUAÇÃO ATUAL (5 METRIC CARDS) */}
      <div className="px-space-lg py-space-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
          {/* Card 1 */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                Status Operacional
              </span>
              <span className="material-symbols-outlined text-secondary text-[20px]">handshake</span>
            </div>
            <div className="mt-space-sm">
              <span className="font-title-md text-title-md text-secondary font-bold block leading-tight">
                {debt.status === 'promessa_firme'
                  ? 'Promessa Vigente'
                  : debt.status === 'pago'
                  ? 'Título Liquidado'
                  : debt.status === 'quebrou_acordo'
                  ? 'Acordo Quebrado'
                  : 'Em Tratativa'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs block">
                {debt.statusLabel}
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                Último Contato
              </span>
              <span className="material-symbols-outlined text-primary-container text-[20px]">call</span>
            </div>
            <div className="mt-space-sm">
              <span className="font-data-mono text-data-mono font-semibold text-on-surface block">
                {debt.lastContact ? `${debt.lastContact.date} às ${debt.lastContact.time}` : 'Sem registro'}
              </span>
              <span
                className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs block truncate"
                title={debt.lastContact?.summary || 'Contato recente'}
              >
                {debt.lastContact?.summary || 'Nenhum contato anterior'}
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                Próximo Retorno
              </span>
              <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">
                event_repeat
              </span>
            </div>
            <div className="mt-space-sm">
              <span className="font-data-mono text-data-mono font-semibold text-on-surface block">
                {debt.nextReturn ? `${debt.nextReturn.date} às ${debt.nextReturn.time}` : 'Não agendado'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs block truncate">
                {debt.nextReturn?.reason || 'Sem retorno pendente'}
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                Promessa Firme
              </span>
              <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
            </div>
            <div className="mt-space-sm">
              <span className="font-data-mono text-data-mono font-bold text-secondary block">
                {debt.activePromise
                  ? `R$ ${debt.activePromise.promisedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'Nenhuma ativa'}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs block">
                {debt.activePromise ? `Vence em ${debt.activePromise.promisedDate}` : 'Sem PTP vigente'}
              </span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col justify-between border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                Indicador Histórico
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">timeline</span>
            </div>
            <div className="mt-space-sm">
              <span className="font-data-mono text-data-mono font-bold text-on-surface block">
                {debt.history.length} Registros
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs block">
                {debt.promises.length} PTPs / {debt.scheduledReturns.length} Retornos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* WORKSPACE SPLIT (70% ESQUERDA PARA HISTÓRICO, PROMESSAS & RETORNOS | 30% DIREITA PARA DEVEDOR & OUTRAS COBRANÇAS) */}
      <div className="px-space-lg pb-space-2xl grid grid-cols-1 xl:grid-cols-12 gap-space-lg">
        {/* COLUNA DA ESQUERDA (8 COLUNAS NO XL ~ 66-70%) */}
        <div className="xl:col-span-8 flex flex-col gap-space-lg">
          {/* SEÇÃO 2: TABELA DE PROMESSAS DE PAGAMENTO HISTÓRICAS */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">receipt_long</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Promessas de Pagamento Vinculadas a este Título
                </h2>
              </div>
              <span className="font-badge-sm text-badge-sm text-on-surface-variant bg-surface-container-low px-space-xs py-space-2xs rounded">
                {debt.promises.length} Acordos Registrados
              </span>
            </div>

            <div className="overflow-x-auto mt-space-xs">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-uppercase text-label-uppercase tracking-wider">
                    <th className="py-space-xs px-space-sm rounded-l">Data Registro</th>
                    <th className="py-space-xs px-space-sm text-right">Valor Prometido</th>
                    <th className="py-space-xs px-space-sm">Data Prometida</th>
                    <th className="py-space-xs px-space-sm">Cobrador</th>
                    <th className="py-space-xs px-space-sm">Situação</th>
                    <th className="py-space-xs px-space-sm rounded-r">Observação / Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {debt.promises.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-on-surface-variant text-xs">
                        Nenhuma promessa de pagamento vinculada a este título até o momento.
                      </td>
                    </tr>
                  ) : (
                    debt.promises.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-container-low/70 transition-colors">
                        <td className="py-space-sm px-space-sm font-data-mono text-data-mono text-on-surface">
                          {p.dateRegistered}
                        </td>
                        <td className="py-space-sm px-space-sm font-data-mono text-data-mono font-bold text-secondary text-right">
                          R$ {p.promisedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-space-sm px-space-sm font-data-mono text-data-mono font-semibold text-on-surface">
                          {p.promisedDate}
                        </td>
                        <td className="py-space-sm px-space-sm text-on-surface font-medium">
                          {p.operatorName}
                        </td>
                        <td className="py-space-sm px-space-sm">
                          {p.status.includes('Vigente') || p.status.includes('Pendente') ? (
                            <span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-container font-badge-sm text-badge-sm font-semibold inline-flex items-center gap-space-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              Pendente (Vigente)
                            </span>
                          ) : p.status.includes('Liquidada') || p.status.includes('Cumprida') ? (
                            <span className="px-space-xs py-space-2xs rounded bg-secondary text-on-secondary font-badge-sm text-badge-sm font-semibold inline-flex items-center gap-space-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-surface"></span>
                              Liquidada
                            </span>
                          ) : (
                            <span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-badge-sm text-badge-sm font-semibold inline-flex items-center gap-space-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                              Não Cumprida / Quebrada
                            </span>
                          )}
                        </td>
                        <td className="py-space-sm px-space-sm text-on-surface-variant font-body-sm">
                          {p.notes}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SEÇÃO 3: TIMELINE CRONOLÓGICA COMPLETA DE CONTATOS & AUDITORIA */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md gap-space-sm border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary-container text-[22px]">
                  history_edu
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Histórico Permanente da Cobrança
                </h2>
                <span className="px-space-xs py-space-2xs bg-primary-container text-surface rounded-full font-badge-sm text-badge-sm">
                  {debt.history.length} Registros
                </span>
              </div>

              {/* Filtros Rápidos da Timeline */}
              <div className="flex items-center gap-space-2xs bg-surface-container-low p-space-2xs rounded-lg border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setHistoryFilter('all')}
                  className={`px-space-xs py-space-2xs rounded font-label-uppercase text-label-uppercase cursor-pointer transition-colors ${
                    historyFilter === 'all'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('call')}
                  className={`px-space-xs py-space-2xs rounded font-label-uppercase text-label-uppercase cursor-pointer transition-colors ${
                    historyFilter === 'call'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Ligações
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('whatsapp')}
                  className={`px-space-xs py-space-2xs rounded font-label-uppercase text-label-uppercase cursor-pointer transition-colors ${
                    historyFilter === 'whatsapp'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('promise')}
                  className={`px-space-xs py-space-2xs rounded font-label-uppercase text-label-uppercase cursor-pointer transition-colors ${
                    historyFilter === 'promise'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Promessas
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('system')}
                  className={`px-space-xs py-space-2xs rounded font-label-uppercase text-label-uppercase cursor-pointer transition-colors ${
                    historyFilter === 'system'
                      ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Sistema
                </button>
              </div>
            </div>

            {/* Vertical Timeline Flow */}
            <div className="relative pl-6 space-y-space-lg mt-space-md before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-highest">
              {filteredHistory.map((item) => {
                const isPromiseOrSuccess = item.result === 'Prometeu pagar' || item.result === 'Pagou';
                const isWarning = item.result === 'Promessa Não Cumprida' || item.result === 'Contestação';

                return (
                  <div key={item.id} className="relative flex flex-col gap-space-xs group">
                    <div
                      className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-sm text-xs ${
                        isPromiseOrSuccess
                          ? 'bg-secondary text-on-secondary'
                          : isWarning
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {item.channel === 'Ligação'
                          ? 'phone_in_talk'
                          : item.channel === 'WhatsApp'
                          ? 'chat'
                          : item.isSystem
                          ? 'warning'
                          : 'assignment'}
                      </span>
                    </div>

                    <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-xs border border-outline-variant/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
                        <div className="flex items-center gap-space-xs flex-wrap">
                          <span className="font-data-mono text-data-mono font-bold text-on-surface">
                            {item.dateFormatted} às {item.timeFormatted}
                          </span>
                          <span className="px-space-xs py-space-2xs rounded bg-primary-container text-surface font-badge-sm text-badge-sm">
                            {item.operatorName}
                          </span>
                          <span className="text-outline-variant">•</span>
                          <span className="font-body-sm text-body-sm font-semibold text-on-surface-variant flex items-center gap-space-2xs">
                            <span
                              className={`material-symbols-outlined text-[16px] ${
                                isPromiseOrSuccess
                                  ? 'text-secondary'
                                  : isWarning
                                  ? 'text-error'
                                  : 'text-on-surface-variant'
                              }`}
                            >
                              {isPromiseOrSuccess
                                ? 'check_circle'
                                : isWarning
                                ? 'error'
                                : 'radio_button_checked'}
                            </span>
                            Resultado: {item.result}
                          </span>
                        </div>
                        <span className="font-label-uppercase text-label-uppercase text-on-surface-variant bg-surface-container px-space-xs py-space-2xs rounded">
                          Canal: {item.channel}
                        </span>
                      </div>

                      <p className="font-body-md text-body-md text-on-surface leading-relaxed mt-space-2xs">
                        {item.notes}
                      </p>

                      {/* Sub-cards Anexados a este Evento */}
                      {(item.attachedPromise || item.attachedReturn || item.attachedPayment) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm mt-space-xs">
                          {/* Subcard Promessa */}
                          {item.attachedPromise && (
                            <div className="p-space-sm bg-surface-container-lowest rounded-lg shadow-sm flex items-center justify-between border border-outline-variant/20">
                              <div className="flex items-center gap-space-xs">
                                <span className="material-symbols-outlined text-secondary text-[20px]">
                                  assignment_turned_in
                                </span>
                                <div className="flex flex-col">
                                  <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                                    Promessa Registrada
                                  </span>
                                  <span className="font-data-mono text-data-mono font-bold text-secondary">
                                    R${' '}
                                    {item.attachedPromise.promisedValue.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                    })}{' '}
                                    • Vence {item.attachedPromise.promisedDate}
                                  </span>
                                </div>
                              </div>
                              <span className="px-space-xs py-space-2xs rounded bg-secondary-container text-on-secondary-container font-badge-sm text-badge-sm">
                                {item.attachedPromise.status}
                              </span>
                            </div>
                          )}

                          {/* Subcard Retorno */}
                          {item.attachedReturn && (
                            <div className="p-space-sm bg-surface-container-lowest rounded-lg shadow-sm flex items-center justify-between border border-outline-variant/20">
                              <div className="flex items-center gap-space-xs">
                                <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">
                                  notification_important
                                </span>
                                <div className="flex flex-col">
                                  <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                                    Retorno Agendado
                                  </span>
                                  <span className="font-data-mono text-data-mono font-semibold text-on-surface">
                                    {item.attachedReturn.returnDate} às {item.attachedReturn.returnTime}
                                  </span>
                                </div>
                              </div>
                              <span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[120px]">
                                {item.attachedReturn.reason}
                              </span>
                            </div>
                          )}

                          {/* Subcard Pagamento */}
                          {item.attachedPayment && (
                            <div className="p-space-sm bg-surface-container-lowest rounded-lg shadow-sm flex items-center justify-between border border-outline-variant/20 col-span-2">
                              <div className="flex items-center gap-space-xs">
                                <span className="material-symbols-outlined text-secondary text-[20px]">
                                  verified
                                </span>
                                <div className="flex flex-col">
                                  <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                                    Pagamento Conciliado
                                  </span>
                                  <span className="font-data-mono text-data-mono font-bold text-secondary">
                                    R${' '}
                                    {item.attachedPayment.receivedValue.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                    })}{' '}
                                    • Recebido em {item.attachedPayment.paymentDate}
                                  </span>
                                </div>
                              </div>
                              <span className="px-space-xs py-space-2xs rounded bg-secondary text-on-secondary font-badge-sm text-badge-sm">
                                Liquidado
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 4 & 5 EM GRID DUPLO: RETORNOS AGENDADOS & BAIXAS CONCILIADAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
            {/* SEÇÃO 4: RETORNOS AGENDADOS & FUTUROS */}
            <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30">
              <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">
                    schedule
                  </span>
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                    Retornos Agendados
                  </h3>
                </div>
                <span className="font-badge-sm text-badge-sm text-secondary font-bold">
                  {debt.scheduledReturns.filter((r) => r.status === 'Agendado').length} Iminente
                </span>
              </div>
              <div className="space-y-space-xs mt-space-2xs">
                {debt.scheduledReturns.length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-4 text-center">
                    Nenhum retorno agendado para esta cobrança.
                  </p>
                ) : (
                  debt.scheduledReturns.map((r) => (
                    <div
                      key={r.id}
                      className={`p-space-sm rounded-lg flex flex-col gap-space-2xs ${
                        r.status === 'Agendado'
                          ? 'bg-surface-container-low border border-outline-variant/30'
                          : 'bg-surface-container-lowest opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-data-mono text-data-mono font-bold text-on-surface">
                          {r.date} às {r.time}
                        </span>
                        <span
                          className={`px-space-xs py-space-2xs rounded font-badge-sm text-badge-sm font-semibold ${
                            r.status === 'Agendado'
                              ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                              : 'bg-surface-container-highest text-on-surface-variant'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface font-medium">
                        Motivo: {r.reason}
                      </span>
                      <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-space-2xs">
                        <span>Responsável: {r.responsibleName}</span>
                        {r.status === 'Agendado' && (
                          <button
                            type="button"
                            onClick={() => onOpenFastLog(debt)}
                            className="text-secondary hover:text-on-secondary-container font-semibold cursor-pointer text-xs"
                          >
                            Iniciar Contato →
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* SEÇÃO 5: HISTÓRICO DE PAGAMENTOS E BAIXAS CONCILIADAS */}
            <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30">
              <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    account_balance_wallet
                  </span>
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                    Baixas &amp; Pagamentos ERP
                  </h3>
                </div>
                <span className="font-badge-sm text-badge-sm text-on-surface-variant">
                  Conciliação TOTVS
                </span>
              </div>

              {debt.payments.length === 0 ? (
                <div className="p-space-md bg-surface-container-low rounded-lg flex flex-col justify-center items-center text-center my-auto">
                  <span className="material-symbols-outlined text-on-surface-variant text-[32px] mb-space-xs">
                    hourglass_empty
                  </span>
                  <span className="font-title-md text-title-md text-on-surface font-semibold">
                    Nenhum pagamento liquidado
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs max-w-xs">
                    Não constam baixas parciais ou integrais até a data presente. Saldo em aberto permanece em{' '}
                    <span className="font-data-mono font-bold text-on-surface">
                      R$ {debt.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {debt.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-lg bg-secondary-container/30 border border-secondary/20 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-data-mono text-sm font-bold text-secondary">
                          R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-secondary text-on-secondary font-badge-sm text-[10px] uppercase font-bold">
                          {p.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-on-surface-variant">
                        <span>Forma: {p.method}</span>
                        <span>Data: {p.date}</span>
                      </div>
                      <span className="font-data-mono text-[10px] text-outline">
                        Cód. Conciliação: {p.conciliationCode}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* COLUNA DA DIREITA (4 COLUNAS NO XL ~ 30-34%): DEVEDOR 360° & MÚLTIPLOS TÍTULOS */}
        <div className="xl:col-span-4 flex flex-col gap-space-lg">
          {/* SEÇÃO 6: FICHA CADASTRAL DO DEVEDOR (ENTIDADE ÚNICA) */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-md border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  corporate_fare
                </span>
                <h2 className="font-title-md text-title-md text-on-surface font-semibold">
                  Dados Cadastrais do Devedor
                </h2>
              </div>
              <span className="px-space-xs py-space-2xs bg-secondary-container text-on-secondary-container rounded font-badge-sm text-badge-sm">
                Ativo
              </span>
            </div>

            <div className="space-y-space-sm mt-3">
              <div className="flex flex-col">
                <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                  Razão Social
                </span>
                <span className="font-body-md text-body-md font-semibold text-on-surface">
                  {debtor.name}
                </span>
              </div>

              {debtor.tradeName && (
                <div className="flex flex-col">
                  <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                    Nome Fantasia
                  </span>
                  <span className="font-body-md text-body-md text-on-surface">
                    {debtor.tradeName}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col">
                  <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                    {debtor.type === 'PJ' ? 'CNPJ' : 'CPF'}
                  </span>
                  <span className="font-data-mono text-data-mono text-on-surface font-semibold">
                    {debtor.cnpjCpf}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                    Código ERP
                  </span>
                  <span className="font-data-mono text-data-mono text-on-surface font-semibold">
                    {debtor.erpCode}
                  </span>
                </div>
              </div>

              <div className="flex flex-col pt-space-xs">
                <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                  Contato Principal
                </span>
                <span className="font-body-md text-body-md text-on-surface font-semibold">
                  {debtor.mainContact.name}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {debtor.mainContact.role}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                  Telefones Operacionais
                </span>
                <div className="flex items-center justify-between mt-space-2xs">
                  <span className="font-data-mono text-data-mono text-on-surface font-medium">
                    {debtor.mainContact.phoneFixed}
                  </span>
                  <button
                    className="text-primary hover:text-secondary cursor-pointer"
                    type="button"
                    onClick={() => showToast(`Discando para ${debtor.mainContact.phoneFixed}...`)}
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
                  </button>
                </div>
                <div className="flex items-center justify-between mt-space-2xs">
                  <span className="font-data-mono text-data-mono text-on-surface font-medium">
                    {debtor.mainContact.phoneMobile}
                  </span>
                  <button
                    onClick={() => showToast('Conversa aberta via WhatsApp Corporativo!')}
                    className="px-space-xs py-space-2xs bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary transition-colors rounded font-badge-sm text-badge-sm flex items-center gap-space-2xs cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> WhatsApp
                  </button>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                  E-mail Financeiro
                </span>
                <span className="font-body-sm text-body-sm text-on-surface font-medium select-all">
                  {debtor.mainContact.email}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                  Endereço Fiscal
                </span>
                <span className="font-body-sm text-body-sm text-on-surface leading-tight">
                  {debtor.mainContact.address}
                </span>
              </div>

              <div className="p-space-sm bg-surface-container-low rounded-lg mt-space-sm flex items-center justify-between border border-outline-variant/20">
                <div className="flex flex-col">
                  <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                    Score de Crédito Serasa
                  </span>
                  <span className="font-data-mono text-data-mono font-bold text-on-surface">
                    {debtor.creditScore} / 1000
                  </span>
                </div>
                <span className="px-space-xs py-space-2xs bg-error-container text-on-error-container rounded font-badge-sm text-badge-sm font-semibold">
                  {debtor.creditStatus}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToDebtor(debtor.id)}
              className="w-full mt-space-md py-space-xs bg-surface-container-low hover:bg-surface-container text-secondary text-center rounded-lg font-label-uppercase text-label-uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-space-xs cursor-pointer border border-outline-variant/30"
              type="button"
            >
              <span>Ver Ficha Completa do Devedor 360°</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          {/* SEÇÃO 7: OUTRAS COBRANÇAS DESTE MESMO DEVEDOR */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  account_tree
                </span>
                <h2 className="font-title-md text-title-md text-on-surface font-semibold">
                  Títulos deste Devedor
                </h2>
              </div>
              <span className="px-space-xs py-space-2xs rounded bg-surface-container text-on-surface font-badge-sm text-badge-sm font-semibold">
                {debtorDebts.length} Títulos
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              O devedor possui múltiplos títulos no ERP. Clique em um título para alternar a ficha de cobrança.
            </p>

            {/* Mini-Tabela / Switcher de Cobranças do Devedor */}
            <div className="flex flex-col gap-space-sm">
              {debtorDebts.map((d) => {
                const isCurrent = d.id === debt.id;

                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      if (!isCurrent) {
                        onSelectAnotherDebt(d.id);
                      }
                    }}
                    className={`p-space-sm rounded-lg flex flex-col gap-space-2xs transition-all ${
                      isCurrent
                        ? 'bg-surface-container border-2 border-secondary shadow-sm'
                        : 'bg-surface-container-low hover:bg-surface-container cursor-pointer border border-outline-variant/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-data-mono text-data-mono font-bold text-on-surface">
                        Cobrança {d.titleNumber} (Parc. {d.installment})
                      </span>
                      {isCurrent ? (
                        <span className="px-space-xs py-space-2xs rounded bg-secondary text-on-secondary font-badge-sm text-badge-sm uppercase font-bold">
                          Ficha Atual
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                          open_in_new
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-data-mono text-data-mono font-semibold text-on-surface">
                        R$ {d.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span
                        className={`px-space-xs py-space-2xs rounded font-badge-sm text-badge-sm ${
                          d.daysOverdue > 0
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-surface-container text-on-surface'
                        }`}
                      >
                        {d.daysOverdue > 0 ? `${d.daysOverdue}d atraso` : 'A Vencer'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-space-2xs">
                      <span className="text-secondary font-semibold">{d.statusLabel}</span>
                      <span>Resp: {d.assignedTo.name.split(' ')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Consolidado do Devedor */}
            <div className="mt-space-md p-space-sm bg-primary-container text-surface rounded-lg flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-uppercase text-label-uppercase text-on-primary-container">
                  Dívida Total Consolidada
                </span>
                <span className="font-headline-sm text-headline-sm font-bold font-data-mono">
                  R$ {debtor.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="material-symbols-outlined text-secondary-fixed text-[24px]">
                account_balance
              </span>
            </div>
          </div>
        </div>
      </div>

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
