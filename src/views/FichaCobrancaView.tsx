import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import { Debt, ContactChannel, ContactResult, ContactRegistrationPayload } from '../types';

interface FichaCobrancaViewProps {
  debtId: string;
  onBackToPortfolio: () => void;
  onBackToTodayWork: () => void;
  onSelectAnotherDebt: (newDebtId: string) => void;
  onOpenFinishModal: () => void;
  onNavigateToDebtor?: (debtorId: string) => void;
  onOpenFastLog?: (debt?: Debt) => void;
}

export const FichaCobrancaView: React.FC<FichaCobrancaViewProps> = ({
  debtId,
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

  // FAZ action mode state: whether the registration form is active
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

  // Queue finished notification state
  const [isQueueFinishedNotice, setIsQueueFinishedNotice] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Reset/populate form when debtId changes
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
    setTimeout(() => setToastMsg(null), 3000);
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

  // Submit action: FAZ -> NEXT
  const handleNextSubmit = (advanceToNext: boolean = true) => {
    if (!debt || !currentUser) return;

    const payload: ContactRegistrationPayload = {
      channel,
      result,
      contactPerson,
      notes: notes || `Contato via ${channel} - Desfecho: ${result}.`,
      hasPromise: (result === 'Prometeu pagar' || result === 'Vai pagar') || hasPromise,
      promisedDate: (hasPromise || result === 'Prometeu pagar') ? promisedDate : undefined,
      promisedValue: (hasPromise || result === 'Prometeu pagar')
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
      showToast(`Ação registrada! Cobrança ${debt.titleNumber} marcada como TRABALHADA no dia.`);
      setIsFazActive(false);

      if (advanceToNext) {
        if (res.nextDebtId) {
          setTimeout(() => {
            onSelectAnotherDebt(res.nextDebtId!);
          }, 400);
        } else {
          // No more debts in queue!
          setIsQueueFinishedNotice(true);
        }
      }
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* 1. TOP BAR: NAVEGAÇÃO LIVRE & CONTEXTO (O Cobrador NUNCA fica preso!) */}
      <div className="p-space-lg bg-surface-container-low flex flex-col gap-space-md border-b border-outline-variant/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
          {/* Breadcrumb com múltiplos caminhos de saída */}
          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              onClick={onBackToTodayWork}
              className="inline-flex items-center gap-1.5 text-primary hover:text-secondary transition-colors font-title-md text-sm font-semibold cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Trabalho de Hoje</span>
            </button>

            <span className="text-outline-variant">•</span>

            <button
              onClick={onBackToPortfolio}
              className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors text-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">folder_open</span>
              <span>Minha Carteira</span>
            </button>

            <span className="text-outline-variant">•</span>

            <span className="text-on-surface font-semibold text-xs truncate max-w-[200px]">
              {debt.debtorName}
            </span>

            <span className="text-outline-variant">•</span>

            <span className="font-data-mono text-xs text-primary font-bold">
              Título {debt.titleNumber}
            </span>
          </div>

          {/* Ações Globais: Botão FAZ em Destaque Absoluto */}
          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              onClick={() => window.print()}
              className="h-8 px-3 bg-surface-container-lowest hover:bg-surface-container text-on-surface rounded-lg shadow-sm font-label-uppercase text-xs tracking-wider inline-flex items-center gap-1 transition-colors cursor-pointer border border-outline-variant/30"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Imprimir Ficha</span>
            </button>

            {/* BOTÃO PRINCIPAL: FAZ */}
            <button
              onClick={() => {
                setIsFazActive(!isFazActive);
                if (!isFazActive) {
                  window.scrollTo({ top: 320, behavior: 'smooth' });
                }
              }}
              className="h-9 px-space-lg bg-secondary hover:bg-on-secondary-container text-on-secondary rounded-lg shadow-md font-title-md text-sm font-bold tracking-wider inline-flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_call</span>
              <span>[ FAZ ] {isFazActive ? 'Recolher Formulário' : 'Registrar Ação de Cobrança'}</span>
            </button>
          </div>
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
                Vencimento
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
                Valor Atual
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
                Você concluiu os títulos pendentes desta fila de execução diária.
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
              Finalizar Dia (FINISH)
            </button>
          </div>
        </div>
      )}

      {/* 2. FORMULÁRIO OPERACIONAL INTEGRADO DE COBRANÇA (FAZ) */}
      {isFazActive && (
        <div className="m-space-lg p-space-lg bg-surface-container-lowest rounded-xl shadow-md border-2 border-secondary animate-fade-in">
          <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/20 mb-space-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">
                edit_note
              </span>
              <div>
                <h3 className="font-headline-sm font-bold text-primary leading-tight">
                  Registro da Ação de Cobrança (FAZ)
                </h3>
                <span className="text-xs text-on-surface-variant font-data-mono">
                  Operador responsável automático:{' '}
                  <strong className="text-primary font-semibold">{currentUser?.name}</strong> • Data:{' '}
                  {debtService.getCurrentDate()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsFazActive(false)}
              className="text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
              type="button"
            >
              Fechar Formulário ✕
            </button>
          </div>

          <div className="space-y-space-md">
            {/* Linha 1: Canal de Contato */}
            <div>
              <label className="block font-label-uppercase text-label-uppercase text-outline font-bold uppercase tracking-wider mb-1.5">
                Canal Utilizado
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
                        ? 'bg-secondary text-on-secondary shadow-sm font-bold'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Linha 2: Pessoa Contatada e Resultado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              <div>
                <label className="block font-label-uppercase text-label-uppercase text-outline font-bold uppercase tracking-wider mb-1">
                  Interlocutor / Pessoa Contatada
                </label>
                <input
                  type="text"
                  className="w-full h-9 px-3 bg-surface-container-low rounded-lg font-body-sm text-sm text-on-surface focus:outline-none border border-outline-variant/30"
                  placeholder="Nome do responsável ou departamento contatado"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-label-uppercase text-label-uppercase text-outline font-bold uppercase tracking-wider mb-1">
                  Resultado do Contato (Desfecho)
                </label>
                <div className="relative">
                  <select
                    className="w-full h-9 pl-3 pr-8 bg-surface-container-low rounded-lg font-body-sm text-sm text-on-surface font-semibold focus:outline-none appearance-none cursor-pointer border border-outline-variant/30"
                    value={result}
                    onChange={(e) => handleResultChange(e.target.value as ContactResult)}
                  >
                    <option value="Prometeu pagar">Prometeu pagar (PTP)</option>
                    <option value="Vai pagar">Vai pagar</option>
                    <option value="Pagou">Pagou (Confirmação de Pagamento)</option>
                    <option value="Solicitou retorno">Solicitou retorno</option>
                    <option value="Não atende">Não atende / Caixa Postal</option>
                    <option value="Não responde">Não responde</option>
                    <option value="Não possui WhatsApp">Não possui WhatsApp</option>
                    <option value="Mensagem enviada">Mensagem enviada</option>
                    <option value="Áudio enviado">Áudio enviado</option>
                    <option value="Ligação realizada">Ligação realizada</option>
                    <option value="Contestação">Contestação Comercial</option>
                    <option value="Enviado para Serasa">Enviado para Serasa</option>
                    <option value="Outro">Outro</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2 text-on-surface-variant text-[18px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {/* Condicional: Promessa de Pagamento */}
            {(result === 'Prometeu pagar' || result === 'Vai pagar' || hasPromise) && (
              <div className="p-3 bg-surface-container-low rounded-xl border border-secondary/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-uppercase text-secondary font-bold text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                    Dados da Promessa de Pagamento (PTP)
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
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-label-uppercase text-outline font-bold block mb-1">
                        DATA PROMETIDA
                      </span>
                      <input
                        type="date"
                        className="w-full h-8 px-2 bg-surface-container-lowest rounded font-data-mono text-sm text-on-surface border border-outline-variant/30"
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
                        className="w-full h-8 px-2 bg-surface-container-lowest rounded font-data-mono text-sm font-bold text-secondary border border-outline-variant/30"
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
              <div className="p-3 bg-surface-container-low rounded-xl border border-primary/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-label-uppercase text-primary font-bold text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                    Pagamento Recebido
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
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-label-uppercase text-outline font-bold block mb-1">
                        DATA DO PAGAMENTO
                      </span>
                      <input
                        type="date"
                        className="w-full h-8 px-2 bg-surface-container-lowest rounded font-data-mono text-sm text-on-surface border border-outline-variant/30"
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
                        className="w-full h-8 px-2 bg-surface-container-lowest rounded font-data-mono text-sm font-bold text-secondary border border-outline-variant/30"
                        value={receivedValue}
                        onChange={(e) => setReceivedValue(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Opcional: Agendar Próximo Retorno */}
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label-uppercase text-on-tertiary-container font-bold text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  Agendamento de Retorno (Callback)
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
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-label-uppercase text-outline font-bold block mb-1">
                        DATA DO RETORNO
                      </span>
                      <input
                        type="date"
                        className="w-full h-8 px-2 bg-surface-container-lowest rounded font-data-mono text-sm text-on-surface border border-outline-variant/30"
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
                        className="w-full h-8 px-2 bg-surface-container-lowest rounded font-data-mono text-sm text-on-surface border border-outline-variant/30"
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
                      className="w-full h-8 px-2 bg-surface-container-lowest rounded text-xs text-on-surface border border-outline-variant/30"
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

            {/* Observação Livre */}
            <div>
              <label className="block font-label-uppercase text-label-uppercase text-outline font-bold uppercase tracking-wider mb-1">
                Observação do Contato / Termos Acordados
              </label>
              <textarea
                rows={3}
                className="w-full p-2.5 bg-surface-container-low rounded-lg font-body-sm text-sm text-on-surface focus:outline-none border border-outline-variant/30 resize-none leading-relaxed"
                placeholder="Descreva detalhes da conversa, motivos alegados de inadimplência ou termos ajustados com o devedor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* BOTÕES OPERACIONAIS: NEXT & SALVAR */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsFazActive(false)}
                className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-label-uppercase text-xs font-semibold cursor-pointer w-full sm:w-auto"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleNextSubmit(false)}
                  className="h-9 px-4 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-title-md text-xs font-semibold transition-colors cursor-pointer"
                  title="Salva a ação e permanece na mesma ficha"
                >
                  Salvar sem Avançar
                </button>

                {/* BOTÃO PRINCIPAL: NEXT */}
                <button
                  type="button"
                  onClick={() => handleNextSubmit(true)}
                  className="h-10 px-6 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] w-full sm:w-auto"
                  title="Salva o contato, marca como Trabalhada e avança para a próxima cobrança da fila diária"
                >
                  <span>[ NEXT → ] Salvar &amp; Próxima Cobrança</span>
                  <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. WORKSPACE SPLIT (70% ESQUERDA PARA HISTÓRICO, PROMESSAS & RETORNOS | 30% DIREITA PARA DEVEDOR & OUTRAS COBRANÇAS) */}
      <div className="px-space-lg pb-space-2xl grid grid-cols-1 xl:grid-cols-12 gap-space-lg mt-space-md">
        {/* COLUNA DA ESQUERDA (8 COLUNAS NO XL ~ 66-70%) */}
        <div className="xl:col-span-8 flex flex-col gap-space-lg">
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
                {debt.promises.length} Registros
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
                  {debt.promises.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-on-surface-variant">
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

          {/* SEÇÃO: HISTÓRICO CRONOLÓGICO PERMANENTE */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-md border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary-container text-[22px]">
                  history_edu
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-base">
                  Histórico Permanente da Cobrança
                </h2>
                <span className="px-space-xs py-space-2xs bg-primary-container text-surface rounded-full font-badge-sm text-badge-sm">
                  {debt.history.length} Ações
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative pl-6 space-y-space-md mt-space-md before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-highest">
              {debt.history.map((item) => (
                <div key={item.id} className="relative flex flex-col gap-1">
                  <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center text-xs shadow-xs">
                    <span className="material-symbols-outlined text-[14px]">
                      {item.channel === 'Ligação'
                        ? 'call'
                        : item.channel === 'WhatsApp'
                        ? 'chat'
                        : 'assignment'}
                    </span>
                  </div>

                  <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-1 border border-outline-variant/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-data-mono font-bold text-on-surface">
                          {item.dateFormatted} às {item.timeFormatted}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-primary-container text-surface font-badge-sm text-[10px]">
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

                    {/* Subcards if Promise / Return / Payment */}
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
                            <span className="font-data-mono text-on-surface">
                              Retorno: {item.attachedReturn.returnDate} às{' '}
                              {item.attachedReturn.returnTime}
                            </span>
                            <span className="text-[10px] text-on-surface-variant truncate max-w-[120px]">
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

        {/* COLUNA DA DIREITA: DADOS DO DEVEDOR & OUTRAS COBRANÇAS */}
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
                <span className="text-outline block font-label-uppercase text-[10px]">
                  TELEFONES
                </span>
                <div className="flex items-center gap-2 mt-0.5">
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

          {/* Card: Outras Cobranças do Mesmo Devedor */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  account_tree
                </span>
                <h3 className="font-title-md font-bold text-primary">
                  Títulos deste Devedor ({debtorDebts.length})
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {debtorDebts.map((d) => {
                const isCurrent = d.id === debt.id;

                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      if (!isCurrent) onSelectAnotherDebt(d.id);
                    }}
                    className={`p-2.5 rounded-lg flex flex-col gap-1 transition-all ${
                      isCurrent
                        ? 'bg-surface-container border-2 border-secondary shadow-xs'
                        : 'bg-surface-container-low hover:bg-surface-container cursor-pointer border border-outline-variant/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-data-mono font-bold text-primary text-xs">
                        Cobrança {d.titleNumber} ({d.installment})
                      </span>
                      {isCurrent ? (
                        <span className="px-1.5 py-0.5 rounded bg-secondary text-on-secondary font-badge-sm text-[9px] uppercase font-bold">
                          Ficha Atual
                        </span>
                      ) : (
                        <span className="text-[10px] text-secondary font-semibold hover:underline">
                          Abrir →
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-data-mono">
                      <span>R$ {d.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className={d.daysOverdue > 0 ? 'text-error' : 'text-secondary'}>
                        {d.daysOverdue > 0 ? `${d.daysOverdue}d atraso` : 'Em dia'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-primary text-surface rounded-lg flex items-center justify-between mt-1">
              <div>
                <span className="text-[10px] font-label-uppercase text-on-primary-container block">
                  DÍVIDA CONSOLIDADA DESTE CLIENTE
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
