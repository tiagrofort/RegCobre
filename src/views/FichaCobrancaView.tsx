import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import { Debt, ContactChannel, ContactResult, ContactRegistrationPayload } from '../types';

interface FichaCobrancaViewProps {
  debtId: string;
  originScreen?: string;
  onBack?: () => void;
  onBackToPortfolio: () => void;
  onBackToTodayWork: () => void;
  onSelectAnotherDebt: (newDebtId: string) => void;
  onOpenFinishModal: () => void;
  onNavigateToDebtor?: (debtorId: string) => void;
  onOpenFastLog?: (debt?: Debt) => void;
}

export const FichaCobrancaView: React.FC<FichaCobrancaViewProps> = ({
  debtId,
  originScreen,
  onBack,
  onBackToPortfolio,
  onBackToTodayWork,
  onSelectAnotherDebt,
  onOpenFinishModal,
  onNavigateToDebtor,
  onOpenFastLog: _onOpenFastLog,
}) => {
  const { currentUser } = useAuth();
  const debt = debtService.getDebtById(debtId) || debtService.getAllDebts()[0];
  const debtor = debtService.getDebtorById(debt.debtorId) || debtService.getAllDebtors()[0];
  const debtorDebts = debtService.getDebtsByDebtorId(debt.debtorId);

  // FAZ action mode state: whether the registration form is open/active
  const [isFazActive, setIsFazActive] = useState(false);

  // Form Fields
  const [channel, setChannel] = useState<ContactChannel>('Ligação');
  const [result, setResult] = useState<ContactResult>('Prometeu pagar');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');

  // Conditional Promise
  const [hasPromise, setHasPromise] = useState(true);
  const [promisedDate, setPromisedDate] = useState('2024-11-18');
  const [promisedValue, setPromisedValue] = useState('');

  // Conditional Payment
  const [hasPayment, setHasPayment] = useState(false);
  const [paymentDate, setPaymentDate] = useState('2024-11-04');
  const [receivedValue, setReceivedValue] = useState('');

  // Conditional Return
  const [hasReturn, setHasReturn] = useState(false);
  const [returnDate, setReturnDate] = useState('2024-11-11');
  const [returnTime, setReturnTime] = useState('09:30');
  const [returnReason, setReturnReason] = useState('Cliente solicitou retorno');

  // Queue finished notification state & toast
  const [isQueueFinishedNotice, setIsQueueFinishedNotice] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Reset / populate form when debtId changes
  useEffect(() => {
    setIsFazActive(false);
    setIsQueueFinishedNotice(false);
    if (debt) {
      setContactPerson(debt.debtorName.includes('Andrade') ? 'Dr. Marcos P. de Souza' : debtor.mainContact.name);
      const formatted = debt.currentValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setPromisedValue(formatted);
      setReceivedValue(formatted);
      setNotes('');
      setResult('Prometeu pagar');
      setHasPromise(true);
      setHasPayment(false);
      setHasReturn(false);
    }
  }, [debtId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopyPaymentInfo = () => {
    const text = `RegCobre - Cobrança Título ${debt.titleNumber} | Devedor: ${debt.debtorName} | Valor: R$ ${debt.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Vencimento: ${debt.dueDate} | Linha PIX/Cód: 34191.79001 01043.510047 91020.150008 8 98210000${Math.round(debt.currentValue)}`;
    navigator.clipboard?.writeText(text);
    showToast('Dados de pagamento e linha digitável copiados para a área de transferência!');
  };

  const handleCopyWhatsApp = () => {
    const phone = debtor.mainContact.phoneMobile || debtor.mainContact.phoneFixed;
    navigator.clipboard?.writeText(phone);
    showToast(`Telefone ${phone} copiado!`);
  };

  // Adjust conditional toggles when result changes
  const handleResultChange = (newResult: ContactResult) => {
    setResult(newResult);
    if (newResult === 'Prometeu pagar' || newResult === 'Vai pagar') {
      setHasPromise(true);
      setHasPayment(false);
    } else if (newResult === 'Pagou') {
      setHasPayment(true);
      setHasPromise(false);
    } else if (newResult === 'Solicitou retorno') {
      setHasReturn(true);
      setHasPromise(false);
      setHasPayment(false);
    }
  };

  // Submit action: FAZ -> NEXT or Salvar sem avançar
  const handleSaveContact = (advanceToNext: boolean = false) => {
    if (!debt || !currentUser) return;

    const payload: ContactRegistrationPayload = {
      channel,
      result,
      contactPerson,
      notes: notes || `Contato via ${channel} - Desfecho: ${result}.`,
      hasPromise: (result === 'Prometeu pagar' || result === 'Vai pagar') || hasPromise,
      promisedDate: (hasPromise || result === 'Prometeu pagar' || result === 'Vai pagar') ? promisedDate : undefined,
      promisedValue: (hasPromise || result === 'Prometeu pagar' || result === 'Vai pagar')
        ? parseFloat(promisedValue.replace(/\./g, '').replace(',', '.')) || debt.currentValue
        : undefined,
      hasPayment: result === 'Pagou' || hasPayment,
      paymentDate: (hasPayment || result === 'Pagou') ? paymentDate : undefined,
      receivedValue: (hasPayment || result === 'Pagou')
        ? parseFloat(receivedValue.replace(/\./g, '').replace(',', '.')) || debt.currentValue
        : undefined,
      hasReturn,
      returnDate: hasReturn ? returnDate : undefined,
      returnTime: hasReturn ? returnTime : undefined,
      returnReason: hasReturn ? returnReason : undefined,
    };

    const res = debtService.registerContact(debt.id, payload, currentUser);

    if (res.success) {
      setIsFazActive(false);

      if (advanceToNext) {
        showToast(`Ação registrada! Cobrança ${debt.titleNumber} salva como TRABALHADA. Avançando para a próxima...`);
        if (res.nextDebtId) {
          setTimeout(() => {
            onSelectAnotherDebt(res.nextDebtId!);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 400);
        } else {
          // No more pending debts in daily queue
          setIsQueueFinishedNotice(true);
        }
      } else {
        showToast(`Ação registrada com sucesso! Ficha do título ${debt.titleNumber} atualizada.`);
      }
    }
  };

  // Helper for origin screen label
  const getOriginScreenLabel = () => {
    switch (originScreen) {
      case 'minha-carteira':
        return 'Minha Carteira';
      case 'agenda-de-retornos':
        return 'Agenda de Retornos';
      case 'conferencia-de-cobrancas':
        return 'Conferência';
      case 'base-de-devedores':
        return 'Base de Devedores';
      case 'dashboard-gerencial':
        return 'Dashboard Gerencial';
      case 'producao-do-dia':
        return 'Produção do Dia';
      case 'trabalho-de-hoje':
      default:
        return 'Trabalho de Hoje';
    }
  };

  const handleBackAction = () => {
    if (onBack) {
      onBack();
    } else {
      onBackToTodayWork();
    }
  };

  // Derived summaries for Section B
  const latestHistory = debt.history && debt.history.length > 0 ? debt.history[0] : null;
  const lastContactInfo = debt.lastContact || (latestHistory ? {
    date: latestHistory.dateFormatted,
    time: latestHistory.timeFormatted,
    operatorName: latestHistory.operatorName,
    channel: latestHistory.channel,
    result: latestHistory.result,
  } : null);

  const activePromiseInfo = debt.activePromise || (debt.promises && debt.promises.length > 0 ? {
    dateRegistered: debt.promises[0].dateRegistered,
    promisedDate: debt.promises[0].promisedDate,
    promisedValue: debt.promises[0].promisedValue,
    operatorName: debt.promises[0].operatorName,
    status: debt.promises[0].status,
    notes: debt.promises[0].notes,
  } : null);

  const nextReturnInfo = debt.nextReturn || (debt.scheduledReturns && debt.scheduledReturns.length > 0 ? {
    date: debt.scheduledReturns[0].date,
    time: debt.scheduledReturns[0].time,
    reason: debt.scheduledReturns[0].reason,
    assignedToName: debt.scheduledReturns[0].responsibleName,
  } : null);

  return (
    <div className="flex flex-col w-full pb-20">
      {/* ========================================================================= */}
      {/* 1. TOP BAR: NAVEGAÇÃO LIVRE, BREADCRUMB & AÇÕES RÁPIDAS                   */}
      {/* ========================================================================= */}
      <div className="p-space-lg bg-surface-container-low flex flex-col gap-space-md border-b border-outline-variant/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          {/* Breadcrumb e botão Voltar para origem */}
          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              onClick={handleBackAction}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-variant text-primary font-title-md text-xs font-semibold transition-colors cursor-pointer border border-outline-variant/30"
              type="button"
              title={`Voltar para ${getOriginScreenLabel()}`}
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Voltar para {getOriginScreenLabel()}</span>
            </button>

            <span className="text-outline-variant">•</span>

            <button
              onClick={onBackToTodayWork}
              className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">play_circle</span>
              <span>Trabalho de Hoje</span>
            </button>

            <span className="text-outline-variant">•</span>

            <button
              onClick={onBackToPortfolio}
              className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">folder_open</span>
              <span>Minha Carteira</span>
            </button>

            <span className="text-outline-variant">•</span>

            <span className="text-on-surface font-semibold text-xs truncate max-w-[200px]" title={debt.debtorName}>
              {debt.debtorName}
            </span>

            <span className="text-outline-variant">•</span>

            <span className="font-data-mono text-xs text-primary font-bold">
              Título {debt.titleNumber}
            </span>
          </div>

          {/* AÇÕES RÁPIDAS DA FICHA */}
          <div className="flex items-center gap-space-xs flex-wrap">
            <button
              onClick={handleCopyPaymentInfo}
              className="h-9 px-3 bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-lg shadow-2xs font-label-uppercase text-xs tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/30"
              type="button"
              title="Copiar linha digitável e PIX do título"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">content_copy</span>
              <span>Copiar PIX / Dados</span>
            </button>

            <button
              onClick={() => window.print()}
              className="h-9 px-3 bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-lg shadow-2xs font-label-uppercase text-xs tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/30"
              type="button"
              title="Imprimir relatório da Ficha de Cobrança"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir Ficha</span>
            </button>

            {/* BOTÃO PRINCIPAL EM DESTAQUE EVIDENTE: REGISTRAR COBRANÇA (FAZ) */}
            <button
              onClick={() => {
                setIsFazActive(!isFazActive);
                if (!isFazActive) {
                  setTimeout(() => {
                    const formElement = document.getElementById('form-registro-cobranca');
                    if (formElement) {
                      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }
              }}
              className="h-10 px-5 bg-secondary hover:bg-on-secondary-container text-on-secondary rounded-lg shadow-md font-title-md text-sm font-bold tracking-wider inline-flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isFazActive ? 'expand_less' : 'add_call'}
              </span>
              <span>{isFazActive ? 'Recolher Formulário' : 'Registrar Cobrança'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* A) CABEÇALHO DA COBRANÇA (HERO OPERACIONAL)                               */}
        {/* ========================================================================= */}
        <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg border border-outline-variant/30">
          {/* Bloco Devedor e Título */}
          <div className="flex flex-col gap-space-2xs min-w-0">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="px-space-xs py-space-2xs rounded bg-surface-container-highest text-on-surface font-badge-sm text-badge-sm uppercase tracking-wider font-semibold">
                {debt.debtorType === 'PJ' ? 'Pessoa Jurídica (PJ)' : 'Pessoa Física (PF)'}
              </span>
              <span className="font-data-mono text-data-mono text-on-surface-variant">
                Código ERP: <strong>{debt.erpCode}</strong>
              </span>
              {debt.debtorCnpjCpf && (
                <>
                  <span className="text-outline-variant">•</span>
                  <span className="font-data-mono text-data-mono text-on-surface-variant">
                    {debt.debtorType === 'PJ' ? 'CNPJ' : 'CPF'}: <strong>{debt.debtorCnpjCpf}</strong>
                  </span>
                </>
              )}
            </div>

            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight truncate mt-space-2xs font-bold text-2xl">
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

              {/* DESTAQUES VISUAIS CONFORME STATUS DA COBRANÇA */}
              {/* 1. Vencida */}
              {debt.daysOverdue > 0 && (
                <span className="px-2.5 py-1 rounded bg-error-container text-on-error-container font-badge-sm text-xs font-bold flex items-center gap-1.5 border border-error/30 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  <span>{debt.daysOverdue} dias em atraso (Vencida)</span>
                </span>
              )}

              {/* 2. Vencendo hoje */}
              {debt.daysOverdue === 0 && (
                <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-badge-sm text-xs font-bold flex items-center gap-1.5 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <span>Vence Hoje</span>
                </span>
              )}

              {/* 3. Paga */}
              {(debt.status === 'pago' || debt.statusLabel.toLowerCase().includes('pago') || debt.statusLabel.toLowerCase().includes('liquidado')) && (
                <span className="px-2.5 py-1 rounded bg-secondary text-on-secondary font-badge-sm text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  <span>Paga / Liquidada</span>
                </span>
              )}

              {/* 4. Em negociação */}
              {(debt.status === 'em_negociacao' || debt.statusLabel.toLowerCase().includes('negociação')) && (
                <span className="px-2.5 py-1 rounded bg-primary-fixed text-on-primary-fixed font-badge-sm text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">sync</span>
                  <span>Em Negociação</span>
                </span>
              )}

              {/* 5. Aguardando retorno */}
              {(debt.status === 'retorno_agendado' || debt.statusLabel.toLowerCase().includes('retorno')) && (
                <span className="px-2.5 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-badge-sm text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  <span>Aguardando Retorno</span>
                </span>
              )}

              {/* Status Geral Label */}
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-badge-sm text-[11px] font-semibold">
                {debt.statusLabel}
              </span>
            </div>
          </div>

          {/* Bloco Valores e Responsável Atual */}
          <div className="flex items-center gap-space-lg flex-wrap xl:flex-nowrap bg-surface-container-low p-space-md rounded-xl border border-outline-variant/30">
            <div className="flex flex-col">
              <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                Vencimento
              </span>
              <span className="font-data-mono text-data-mono text-on-surface font-semibold text-base">
                {debt.dueDate}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                Orig: R$ {debt.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="h-10 w-px bg-outline-variant opacity-40" />

            <div className="flex flex-col">
              <span className="font-label-uppercase text-label-uppercase text-secondary font-semibold">
                Valor da Cobrança
              </span>
              <span className="font-headline-md text-headline-md text-on-surface font-bold font-data-mono tabular-nums text-xl">
                R$ {debt.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="font-badge-sm text-[11px] text-error font-medium">
                +R$ {debt.interestFine.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} encargos
              </span>
            </div>

            <div className="h-10 w-px bg-outline-variant opacity-40" />

            {/* RESPONSÁVEL ATUAL DA COBRANÇA (Distinto do operador que registra eventos) */}
            <div className="flex flex-col min-w-[150px]">
              <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                Responsável Atual
              </span>
              <span className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  support_agent
                </span>
                {debt.assignedTo.name}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                {debt.assignedTo.role}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* B) RESUMO DA COBRANÇA (ÁREA COMPACTA)                                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md p-space-md bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs">
          {/* 1. ÚLTIMO CONTATO */}
          <div className="p-3 bg-surface-container-low rounded-lg flex flex-col justify-between border border-outline-variant/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">history</span>
                Último Contato Realizado
              </span>
              {lastContactInfo && (
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-uppercase text-[9px]">
                  {lastContactInfo.channel}
                </span>
              )}
            </div>

            {lastContactInfo ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <strong className="text-primary font-semibold font-data-mono">
                    {lastContactInfo.date} {lastContactInfo.time ? `às ${lastContactInfo.time}` : ''}
                  </strong>
                  <span className="text-[11px] text-on-surface-variant">
                    Por: <strong className="text-on-surface">{lastContactInfo.operatorName}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-on-surface-variant">Resultado:</span>
                  <span className="font-bold text-primary">
                    {lastContactInfo.result}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic py-1">
                Nenhum contato prévio registrado neste título.
              </p>
            )}
          </div>

          {/* 2. PRÓXIMO RETORNO */}
          <div className="p-3 bg-surface-container-low rounded-lg flex flex-col justify-between border border-outline-variant/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">schedule</span>
                Próximo Retorno Agendado
              </span>
              {nextReturnInfo && (
                <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-badge-sm text-[9px] font-bold uppercase">
                  Agendado
                </span>
              )}
            </div>

            {nextReturnInfo ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <strong className="text-on-tertiary-container font-semibold font-data-mono">
                    {nextReturnInfo.date} às {nextReturnInfo.time}
                  </strong>
                  <span className="text-[11px] text-on-surface-variant">
                    Com: <strong className="text-on-surface">{nextReturnInfo.assignedToName}</strong>
                  </span>
                </div>
                <div className="text-xs text-on-surface truncate" title={nextReturnInfo.reason}>
                  Motivo: {nextReturnInfo.reason}
                </div>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic py-1">
                Nenhum retorno agendado para esta cobrança.
              </p>
            )}
          </div>

          {/* 3. ÚLTIMA PROMESSA */}
          <div className="p-3 bg-surface-container-low rounded-lg flex flex-col justify-between border border-outline-variant/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-secondary">payments</span>
                Última Promessa de Pagamento
              </span>
              {activePromiseInfo && (
                <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-badge-sm text-[9px] font-bold uppercase">
                  PTP
                </span>
              )}
            </div>

            {activePromiseInfo ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <strong className="font-data-mono font-bold text-secondary text-sm">
                    R$ {activePromiseInfo.promisedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="font-data-mono text-[11px] text-on-surface">
                    Para: <strong>{activePromiseInfo.promisedDate}</strong>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-on-surface-variant">
                    Situação: <strong className="text-primary">{activePromiseInfo.status}</strong>
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Por: {activePromiseInfo.operatorName}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic py-1">
                Nenhuma promessa ativa registrada.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AVISO SE A FILA DO DIA FOI CONCLUÍDA */}
      {isQueueFinishedNotice && (
        <div className="m-space-lg p-space-lg bg-secondary-container/30 border-2 border-secondary rounded-xl flex flex-col md:flex-row items-center justify-between gap-space-md shadow-md animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-[32px]">
              task_alt
            </span>
            <div>
              <h3 className="font-title-md font-bold text-primary text-base">
                Todas as cobranças previstas para esta sequência foram trabalhadas!
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Você concluiu todos os títulos pendentes desta fila de execução diária.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToTodayWork}
              className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-title-md text-xs font-semibold transition-colors cursor-pointer"
              type="button"
            >
              Voltar para a Agenda
            </button>
            <button
              onClick={onOpenFinishModal}
              className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-xs font-bold transition-colors cursor-pointer shadow-sm"
              type="button"
            >
              Encerrar Expediente (FINISH)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FORMULÁRIO DE REGISTRO DA COBRANÇA (FAZ)                               */}
      {/* ========================================================================= */}
      {isFazActive && (
        <div
          id="form-registro-cobranca"
          className="m-space-lg p-space-lg bg-surface-container-lowest rounded-xl shadow-md border-2 border-secondary animate-fade-in"
        >
          {/* Cabeçalho do Formulário */}
          <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20 mb-space-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[24px]">
                edit_note
              </span>
              <div>
                <h3 className="font-headline-sm font-bold text-primary text-base leading-tight">
                  Registro da Ação de Cobrança (FAZ)
                </h3>
                <span className="text-xs text-on-surface-variant font-data-mono">
                  Usuário registrando o evento:{' '}
                  <strong className="text-primary font-semibold">{currentUser?.name}</strong> ({currentUser?.roleTitle || currentUser?.role}) • Data:{' '}
                  {debtService.getCurrentDate()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsFazActive(false)}
              className="text-xs text-on-surface-variant hover:text-on-surface cursor-pointer p-1 rounded hover:bg-surface-container flex items-center gap-1"
              type="button"
            >
              <span>Fechar Formulário</span>
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          <div className="space-y-space-md">
            {/* ETAPA 1: CANAL DE CONTATO */}
            <div>
              <label className="block font-label-uppercase text-label-uppercase text-outline font-bold uppercase tracking-wider mb-1.5 text-xs">
                1. Canal Utilizado
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
                {[
                  { label: 'Ligação', icon: 'call' },
                  { label: 'WhatsApp', icon: 'chat' },
                  { label: 'Mensagem', icon: 'sms' },
                  { label: 'Áudio', icon: 'mic' },
                  { label: 'E-mail', icon: 'mail' },
                  { label: 'Serasa', icon: 'verified_user' },
                  { label: 'Outro', icon: 'more_horiz' },
                ].map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setChannel(c.label as ContactChannel)}
                    className={`py-2 px-1 rounded flex flex-col items-center gap-1 font-body-sm text-xs transition-all cursor-pointer ${
                      channel === c.label
                        ? 'bg-secondary text-on-secondary shadow-sm font-bold scale-[1.02]'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ETAPA 2: RESULTADO DO CONTATO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div>
                <label className="block font-label-uppercase text-label-uppercase text-outline font-bold uppercase tracking-wider mb-1 text-xs">
                  2. Resultado do Contato (Desfecho)
                </label>
                <div className="relative">
                  <select
                    className="w-full h-10 pl-3 pr-8 bg-surface-container-low rounded-lg font-body-sm text-sm text-on-surface font-semibold focus:outline-none appearance-none cursor-pointer border border-outline-variant/30"
                    value={result}
                    onChange={(e) => handleResultChange(e.target.value as ContactResult)}
                  >
                    <optgroup label="Acordos e Pagamento">
                      <option value="Prometeu pagar">Prometeu pagar (PTP)</option>
                      <option value="Vai pagar">Vai pagar</option>
                      <option value="Pagou">Pagou (Confirmação de Pagamento)</option>
                      <option value="Solicitou retorno">Solicitou retorno</option>
                    </optgroup>
                    <optgroup label="Tentativas sem Contato">
                      <option value="Não atende">Não atende / Caixa Postal</option>
                      <option value="Não responde">Não responde</option>
                      <option value="Não possui WhatsApp">Não possui WhatsApp</option>
                      <option value="Mensagem enviada">Mensagem enviada</option>
                      <option value="Áudio enviado">Áudio enviado</option>
                      <option value="Ligação realizada">Ligação realizada</option>
                    </optgroup>
                    <optgroup label="Outros Desfechos">
                      <option value="Contestação">Contestação Comercial</option>
                      <option value="Enviado para Serasa">Enviado para Serasa</option>
                      <option value="Promessa Não Cumprida">Promessa Não Cumprida</option>
                      <option value="Outro">Outro</option>
                    </optgroup>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-on-surface-variant text-[18px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-label-uppercase text-label-uppercase text-outline font-bold uppercase tracking-wider mb-1 text-xs">
                  Interlocutor / Pessoa Contatada
                </label>
                <input
                  type="text"
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-sm text-sm text-on-surface focus:outline-none border border-outline-variant/30"
                  placeholder="Nome do responsável ou departamento contatado"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
            </div>

            {/* ETAPA 3: INFORMAÇÕES COMPLEMENTARES (CONDICIONAIS) */}

            {/* Condicional: Promessa de Pagamento */}
            {(result === 'Prometeu pagar' || result === 'Vai pagar' || hasPromise) && (
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-secondary/40 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-label-uppercase text-secondary font-bold text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    3. Informações da Promessa de Pagamento (PTP)
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasPromise}
                      onChange={(e) => setHasPromise(e.target.checked)}
                      className="accent-secondary h-4 w-4"
                    />
                    <span>Vincular Promessa</span>
                  </label>
                </div>
                {hasPromise && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-label-uppercase text-outline font-bold block mb-1">
                        DATA PROMETIDA
                      </span>
                      <input
                        type="date"
                        className="w-full h-9 px-2 bg-surface-container-lowest rounded font-data-mono text-sm text-on-surface border border-outline-variant/30 focus:border-secondary"
                        value={promisedDate}
                        onChange={(e) => setPromisedDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-label-uppercase text-outline font-bold block mb-1">
                        VALOR PROMETIDO (R$)
                      </span>
                      <input
                        type="text"
                        className="w-full h-9 px-2 bg-surface-container-lowest rounded font-data-mono text-sm font-bold text-secondary border border-outline-variant/30 focus:border-secondary"
                        value={promisedValue}
                        onChange={(e) => setPromisedValue(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Condicional: Pagamento Recebido */}
            {(result === 'Pagou' || hasPayment) && (
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-primary/40 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-label-uppercase text-primary font-bold text-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                    3. Informações do Pagamento Recebido
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasPayment}
                      onChange={(e) => setHasPayment(e.target.checked)}
                      className="accent-primary h-4 w-4"
                    />
                    <span>Registrar Quitação</span>
                  </label>
                </div>
                {hasPayment && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-label-uppercase text-outline font-bold block mb-1">
                        DATA DO PAGAMENTO
                      </span>
                      <input
                        type="date"
                        className="w-full h-9 px-2 bg-surface-container-lowest rounded font-data-mono text-sm text-on-surface border border-outline-variant/30 focus:border-primary"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-label-uppercase text-outline font-bold block mb-1">
                        VALOR RECEBIDO (R$)
                      </span>
                      <input
                        type="text"
                        className="w-full h-9 px-2 bg-surface-container-lowest rounded font-data-mono text-sm font-bold text-secondary border border-outline-variant/30 focus:border-primary"
                        value={receivedValue}
                        onChange={(e) => setReceivedValue(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 4: OBSERVAÇÃO LIVRE */}
            <div>
              <label className="block font-label-uppercase text-label-uppercase text-outline font-bold uppercase tracking-wider mb-1 text-xs">
                4. Observação do Contato / Termos Acordados
              </label>
              <textarea
                rows={3}
                className="w-full p-2.5 bg-surface-container-low rounded-lg font-body-sm text-sm text-on-surface focus:outline-none border border-outline-variant/30 resize-none leading-relaxed"
                placeholder="Descreva detalhes da conversa, motivos alegados pelo devedor ou acordos firmados..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* ETAPA 5: PRÓXIMO RETORNO */}
            <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-label-uppercase text-on-tertiary-container font-bold text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                  5. Próximo Retorno (Callback)
                </span>
                <label className="flex items-center gap-1.5 text-xs text-on-surface cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasReturn}
                    onChange={(e) => setHasReturn(e.target.checked)}
                    className="accent-secondary h-4 w-4"
                  />
                  <span>Agendar Retorno</span>
                </label>
              </div>

              {hasReturn && (
                <div className="space-y-2.5 pt-1 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-label-uppercase text-outline font-bold block mb-1">
                        DATA DO RETORNO
                      </span>
                      <input
                        type="date"
                        className="w-full h-9 px-2 bg-surface-container-lowest rounded font-data-mono text-sm text-on-surface border border-outline-variant/30"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-label-uppercase text-outline font-bold block mb-1">
                        HORÁRIO
                      </span>
                      <input
                        type="time"
                        className="w-full h-9 px-2 bg-surface-container-lowest rounded font-data-mono text-sm text-on-surface border border-outline-variant/30"
                        value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-label-uppercase text-outline font-bold block mb-1">
                      MOTIVO DO RETORNO
                    </span>
                    <select
                      className="w-full h-9 px-2 bg-surface-container-lowest rounded text-xs text-on-surface border border-outline-variant/30"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                    >
                      <option value="Cliente solicitou retorno">Cliente solicitou retorno</option>
                      <option value="Confirmar pagamento">Confirmar pagamento</option>
                      <option value="Acompanhar promessa">Acompanhar promessa</option>
                      <option value="Nova tentativa de contato">Nova tentativa de contato</option>
                      <option value="Enviar informação/documento">Enviar informação/documento</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* ===================================================================== */}
            {/* 4. BOTÕES DO FORMULÁRIO: "Cancelar", "Salvar", "Salvar e Avançar"     */}
            {/* ===================================================================== */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsFazActive(false)}
                className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-label-uppercase text-xs font-semibold cursor-pointer w-full sm:w-auto transition-colors"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {/* SALVAR (Permanece na mesma cobrança) */}
                <button
                  type="button"
                  onClick={() => handleSaveContact(false)}
                  className="h-10 px-5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-title-md text-xs font-bold transition-colors cursor-pointer border border-outline-variant/30 flex items-center gap-1.5"
                  title="Salva a ação e permanece na mesma Ficha"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Salvar</span>
                </button>

                {/* SALVAR E AVANÇAR (NEXT: Salva e avança para a próxima cobrança) */}
                <button
                  type="button"
                  onClick={() => handleSaveContact(true)}
                  className="h-10 px-6 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] w-full sm:w-auto"
                  title="Registra a ação, marca como Trabalhada e avança para a próxima cobrança pendente"
                >
                  <span>Salvar e Avançar</span>
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WORKSPACE PRINCIPAL (COLUNA ESQUERDA: HISTÓRICO & RETORNOS | DIREITA: DADOS) */}
      {/* ========================================================================= */}
      <div className="px-space-lg grid grid-cols-1 xl:grid-cols-12 gap-space-lg mt-space-md">
        {/* COLUNA ESQUERDA (8 colunas no XL) */}
        <div className="xl:col-span-8 flex flex-col gap-space-lg">
          {/* ===================================================================== */}
          {/* 6. SEÇÃO: PRÓXIMOS RETORNOS AGENDADOS                                */}
          {/* ===================================================================== */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">
                  calendar_clock
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-base">
                  Próximos Retornos Agendados
                </h2>
              </div>
              <span className="font-badge-sm text-badge-sm text-on-surface-variant bg-surface-container-low px-space-xs py-space-2xs rounded">
                {debt.scheduledReturns?.length || 0} Registros
              </span>
            </div>

            <div className="overflow-x-auto mt-space-xs">
              <table className="w-full text-left font-body-sm text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-uppercase tracking-wider">
                    <th className="py-2 px-3 rounded-l">Data &amp; Hora</th>
                    <th className="py-2 px-3">Motivo do Retorno</th>
                    <th className="py-2 px-3">Responsável</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 rounded-r text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {(!debt.scheduledReturns || debt.scheduledReturns.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-on-surface-variant italic">
                        Nenhum retorno agendado para esta cobrança até o momento.
                      </td>
                    </tr>
                  ) : (
                    debt.scheduledReturns.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-container-low/70 transition-colors">
                        <td className="py-2.5 px-3 font-data-mono font-semibold text-on-surface">
                          {r.date} às {r.time}
                        </td>
                        <td className="py-2.5 px-3 text-on-surface">{r.reason}</td>
                        <td className="py-2.5 px-3 font-medium text-primary">{r.responsibleName}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-badge-sm text-[10px] font-semibold ${
                              r.status === 'Agendado'
                                ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                                : r.status === 'Realizado'
                                ? 'bg-secondary text-on-secondary'
                                : 'bg-error-container text-on-error-container'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setIsFazActive(true);
                              setChannel('Ligação');
                              setResult('Solicitou retorno');
                            }}
                            className="text-secondary hover:underline font-semibold text-xs cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <span>Atender</span>
                            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SEÇÃO: PROMESSAS DE PAGAMENTO VINCULADAS */}
          <div className="p-space-md bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  receipt_long
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-base">
                  Promessas de Pagamento Vinculadas a este Título
                </h2>
              </div>
              <span className="font-badge-sm text-badge-sm text-on-surface-variant bg-surface-container-low px-space-xs py-space-2xs rounded">
                {debt.promises?.length || 0} Registros
              </span>
            </div>

            <div className="overflow-x-auto mt-space-xs">
              <table className="w-full text-left font-body-sm text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-uppercase tracking-wider">
                    <th className="py-2 px-3 rounded-l">Data Registro</th>
                    <th className="py-2 px-3 text-right">Valor Prometido</th>
                    <th className="py-2 px-3">Data Prometida</th>
                    <th className="py-2 px-3">Cobrador</th>
                    <th className="py-2 px-3">Situação</th>
                    <th className="py-2 px-3 rounded-r">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0">
                  {(!debt.promises || debt.promises.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-on-surface-variant italic">
                        Nenhuma promessa de pagamento vinculada até o momento.
                      </td>
                    </tr>
                  ) : (
                    debt.promises.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-container-low/70 transition-colors">
                        <td className="py-2 px-3 font-data-mono text-on-surface">
                          {p.dateRegistered}
                        </td>
                        <td className="py-2 px-3 font-data-mono font-bold text-secondary text-right">
                          R$ {p.promisedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 font-data-mono font-semibold text-on-surface">
                          {p.promisedDate}
                        </td>
                        <td className="py-2 px-3 text-on-surface font-medium">{p.operatorName}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-badge-sm text-[10px] font-semibold ${
                              p.status.includes('Vigente') || p.status.includes('Pendente')
                                ? 'bg-secondary-container text-on-secondary-container'
                                : p.status.includes('Liquidada') || p.status.includes('Cumprida')
                                ? 'bg-secondary text-on-secondary'
                                : 'bg-error-container text-on-error-container'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-on-surface-variant">{p.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 5. HISTÓRICO DA COBRANÇA (TIMELINE PERMANENTE)                        */}
          {/* ===================================================================== */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-md border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary-container text-[22px]">
                  history_edu
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-base">
                  Histórico Permanente da Cobrança
                </h2>
                <span className="px-space-xs py-space-2xs bg-primary-container text-surface rounded-full font-badge-sm text-badge-sm font-semibold">
                  {debt.history?.length || 0} Ações
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-6 space-y-space-md mt-space-md before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-highest">
              {debt.history.map((item) => (
                <div key={item.id} className="relative flex flex-col gap-1">
                  {/* Marcador do canal */}
                  <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center text-xs shadow-xs">
                    <span className="material-symbols-outlined text-[14px]">
                      {item.channel === 'Ligação'
                        ? 'call'
                        : item.channel === 'WhatsApp'
                        ? 'chat'
                        : item.channel === 'Mensagem'
                        ? 'sms'
                        : item.channel === 'Áudio'
                        ? 'mic'
                        : item.channel === 'E-mail'
                        ? 'mail'
                        : item.channel === 'Serasa'
                        ? 'verified_user'
                        : 'assignment'}
                    </span>
                  </div>

                  <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-1 border border-outline-variant/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-data-mono font-bold text-on-surface">
                          {item.dateFormatted} às {item.timeFormatted}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-primary-container text-surface font-badge-sm text-[10px] font-semibold">
                          {item.operatorName}
                        </span>
                        <span className="text-outline-variant">•</span>
                        <span className="font-semibold text-primary">
                          Resultado: {item.result}
                        </span>
                      </div>
                      <span className="font-label-uppercase text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded text-[10px]">
                        Canal: {item.channel}
                      </span>
                    </div>

                    <p className="text-sm text-on-surface leading-relaxed mt-1">{item.notes}</p>

                    {/* Subcards de Promessa / Retorno / Pagamento embutidos no evento */}
                    {(item.attachedPromise || item.attachedReturn || item.attachedPayment) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-outline-variant/20 text-xs">
                        {item.attachedPromise && (
                          <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant/20 flex items-center justify-between">
                            <span className="font-data-mono font-bold text-secondary">
                              Promessa: R${' '}
                              {item.attachedPromise.promisedValue.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}{' '}
                              ({item.attachedPromise.promisedDate})
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[9px] font-bold">
                              PTP
                            </span>
                          </div>
                        )}

                        {item.attachedReturn && (
                          <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant/20 flex items-center justify-between">
                            <span className="font-data-mono text-on-surface font-semibold">
                              Retorno: {item.attachedReturn.returnDate} às {item.attachedReturn.returnTime}
                            </span>
                            <span className="text-[10px] text-on-surface-variant truncate max-w-[130px]">
                              {item.attachedReturn.reason}
                            </span>
                          </div>
                        )}

                        {item.attachedPayment && (
                          <div className="p-2 bg-secondary-container/40 rounded border border-secondary/30 flex items-center justify-between col-span-2">
                            <span className="font-data-mono font-bold text-secondary">
                              Pagamento Recebido: R${' '}
                              {item.attachedPayment.receivedValue.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-secondary text-on-secondary text-[9px] font-bold">
                              Liquidado
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUNA DIREITA: DADOS DO DEVEDOR & OUTRAS COBRANÇAS                       */}
        {/* ========================================================================= */}
        <div className="xl:col-span-4 flex flex-col gap-space-lg">
          {/* Card: Dados do Devedor */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  corporate_fare
                </span>
                <h3 className="font-title-md font-bold text-primary">Dados do Devedor</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-secondary-container text-on-secondary-container rounded font-badge-sm text-[10px]">
                  {debtor.status}
                </span>
                {onNavigateToDebtor && (
                  <button
                    type="button"
                    onClick={() => onNavigateToDebtor(debtor.id)}
                    className="text-xs text-secondary hover:underline font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                    title="Consultar ficha cadastral 360°"
                  >
                    <span>Ficha 360°</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-outline block font-label-uppercase text-[10px]">
                  RAZÃO SOCIAL
                </span>
                <strong className="text-primary text-sm font-semibold">{debtor.name}</strong>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    {debtor.type === 'PJ' ? 'CNPJ' : 'CPF'}
                  </span>
                  <span className="font-data-mono text-on-surface font-semibold">
                    {debtor.cnpjCpf}
                  </span>
                </div>
                <div>
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    CÓDIGO ERP
                  </span>
                  <span className="font-data-mono text-on-surface font-semibold">
                    {debtor.erpCode}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-outline block font-label-uppercase text-[10px]">
                  CONTATO PRINCIPAL
                </span>
                <span className="text-on-surface font-medium block">
                  {debtor.mainContact.name} ({debtor.mainContact.role})
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-outline font-label-uppercase text-[10px]">
                    TELEFONES
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="text-[10px] text-secondary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                    title="Copiar telefone principal"
                  >
                    <span>Copiar número</span>
                    <span className="material-symbols-outlined text-[11px]">content_copy</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-data-mono text-on-surface">
                    {debtor.mainContact.phoneFixed}
                  </span>
                  <span>•</span>
                  <span className="font-data-mono text-on-surface font-semibold text-secondary">
                    {debtor.mainContact.phoneMobile} (WhatsApp)
                  </span>
                </div>
              </div>

              <div>
                <span className="text-outline block font-label-uppercase text-[10px]">E-MAIL</span>
                <span className="text-on-surface select-all">{debtor.mainContact.email}</span>
              </div>

              <div>
                <span className="text-outline block font-label-uppercase text-[10px]">
                  ENDEREÇO
                </span>
                <span className="text-on-surface leading-tight">
                  {debtor.mainContact.address}
                </span>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 7. OUTRAS COBRANÇAS DESTE DEVEDOR (MUITO IMPORTANTE)                  */}
          {/* ===================================================================== */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  account_tree
                </span>
                <h3 className="font-title-md font-bold text-primary">
                  Outras Cobranças deste Devedor ({debtorDebts.length})
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {debtorDebts.map((d) => {
                const isCurrent = d.id === debt.id;

                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      if (!isCurrent) {
                        onSelectAnotherDebt(d.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`p-3 rounded-lg flex flex-col gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-surface-container border-2 border-secondary shadow-xs'
                        : 'bg-surface-container-low hover:bg-surface-container cursor-pointer border border-outline-variant/20 hover:border-secondary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-data-mono font-bold text-primary text-xs">
                          Título {d.titleNumber} ({d.installment})
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          • {d.invoiceNumber}
                        </span>
                      </div>
                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded bg-secondary text-on-secondary font-badge-sm text-[9px] uppercase font-bold">
                          Ficha Atual
                        </span>
                      ) : (
                        <span className="text-[11px] text-secondary font-semibold hover:underline flex items-center gap-0.5">
                          <span>Abrir Ficha</span>
                          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-data-mono">
                      <span className="font-bold text-on-surface">
                        R$ {d.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-on-surface-variant text-[11px]">
                        Venc: {d.dueDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-outline-variant/15">
                      <span className="text-on-surface-variant truncate max-w-[140px]">
                        Resp: <strong className="text-on-surface">{d.assignedTo.name}</strong>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-badge-sm text-[10px] font-semibold">
                        {d.statusLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-0.5">
                      <span className="truncate max-w-[190px]" title={d.lastContact ? `${d.lastContact.date} - ${d.lastContact.result}` : 'Sem contato prévio'}>
                        Última interação: <strong className="text-primary">{d.lastContact ? `${d.lastContact.date} (${d.lastContact.channel})` : 'Nenhuma'}</strong>
                      </span>
                      <span
                        className={`font-semibold shrink-0 ${
                          d.daysOverdue > 0 ? 'text-error' : 'text-secondary'
                        }`}
                      >
                        {d.daysOverdue > 0 ? `${d.daysOverdue}d atraso` : 'Em dia'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dívida Consolidada do Devedor */}
            <div className="p-3 bg-primary text-surface rounded-lg flex items-center justify-between mt-1">
              <div>
                <span className="text-[10px] font-label-uppercase text-on-primary-container block">
                  DÍVIDA TOTAL CONSOLIDADA
                </span>
                <strong className="font-data-mono font-bold text-base text-secondary-fixed">
                  R$ {debtor.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
              <span className="material-symbols-outlined text-secondary-fixed text-[24px]">
                account_balance
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-primary text-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 animate-bounce text-xs font-medium border border-secondary">
          <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
            check_circle
          </span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
