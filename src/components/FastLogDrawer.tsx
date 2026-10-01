import React, { useState, useEffect } from 'react';
import { Debt, ContactChannel, ContactResult, ContactRegistrationPayload } from '../types';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';

interface FastLogDrawerProps {
  isOpen: boolean;
  debt?: Debt;
  onClose: () => void;
  onSaved?: (updatedDebt: Debt, nextDebtId?: string, goToNext?: boolean) => void;
  onOpenFicha?: (debtId: string) => void;
}

export const FastLogDrawer: React.FC<FastLogDrawerProps> = ({
  isOpen,
  debt,
  onClose,
  onSaved,
  onOpenFicha,
}) => {
  const { currentUser } = useAuth();

  const [channel, setChannel] = useState<ContactChannel>('Ligação');
  const [result, setResult] = useState<ContactResult>('Prometeu pagar');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');

  // Conditional Promise
  const [hasPromise, setHasPromise] = useState(true);
  const [promisedDate, setPromisedDate] = useState('2024-11-18');
  const [promisedValue, setPromisedValue] = useState('9.370,10');

  // Conditional Payment
  const [hasPayment, setHasPayment] = useState(false);
  const [paymentDate, setPaymentDate] = useState('2024-11-04');
  const [receivedValue, setReceivedValue] = useState('');

  // Conditional Return
  const [hasReturn, setHasReturn] = useState(true);
  const [returnDate, setReturnDate] = useState('2024-11-11');
  const [returnTime, setReturnTime] = useState('09:30');
  const [returnReason, setReturnReason] = useState('Cliente solicitou retorno');

  // Success Feedback
  const [showToast, setShowToast] = useState(false);

  // Sync state when debt changes
  useEffect(() => {
    if (debt) {
      setContactPerson(debt.debtorName.includes('Andrade') ? 'Dr. Marcos P. de Souza (Dir. Financeiro)' : '');
      const formattedVal = debt.currentValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setPromisedValue(formattedVal);
      setReceivedValue(formattedVal);
      setNotes(
        debt.id === '10002'
          ? 'Cliente informou que o fluxo de caixa regulariza nesta sexta-feira e efetuará o pagamento integral via TED bancária.'
          : ''
      );
    }
  }, [debt]);

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

  const handleSubmit = (goToNext: boolean = false) => {
    if (!debt || !currentUser) return;

    const payload: ContactRegistrationPayload = {
      channel,
      result,
      contactPerson,
      notes: notes || `Contato realizado via ${channel} - Resultado: ${result}`,
      hasPromise,
      promisedDate: hasPromise ? promisedDate : undefined,
      promisedValue: hasPromise ? parseFloat(promisedValue.replace(/\./g, '').replace(',', '.')) || debt.currentValue : undefined,
      hasPayment,
      paymentDate: hasPayment ? paymentDate : undefined,
      receivedValue: hasPayment ? parseFloat(receivedValue.replace(/\./g, '').replace(',', '.')) || debt.currentValue : undefined,
      hasReturn,
      returnDate: hasReturn ? returnDate : undefined,
      returnTime: hasReturn ? returnTime : undefined,
      returnReason: hasReturn ? returnReason : undefined,
    };

    const res = debtService.registerContact(debt.id, payload, currentUser);

    if (res.success && res.debt) {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onSaved?.(res.debt!, res.nextDebtId, goToNext);
        if (!goToNext) {
          onClose();
        }
      }, 700);
    }
  };

  if (!isOpen && !debt) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-surface-container-lowest shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-space-md bg-primary-container text-surface flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-secondary-fixed text-[22px]">
              add_call
            </span>
            <div>
              <h2 className="font-title-md text-title-md font-semibold text-surface leading-tight">
                Registrar Contato / Ocorrência
              </h2>
              <span className="font-data-mono text-data-mono text-on-primary-container text-xs">
                {debt ? `Cobrança ${debt.titleNumber} • ${debt.debtorName}` : 'Selecione uma cobrança'}
              </span>
            </div>
          </div>
          <button
            className="p-space-2xs text-surface hover:text-secondary-fixed transition-colors cursor-pointer"
            onClick={onClose}
            type="button"
            title="Fechar painel"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-space-lg flex-1 overflow-y-auto space-y-space-md bg-surface-container-lowest">
          {/* Debt Summary Pill in Drawer */}
          {debt && (
            <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between font-data-mono text-xs border border-outline-variant/30">
              <div>
                <span className="text-on-surface-variant block font-label-uppercase text-[10px]">
                  VALOR ATUALIZADO
                </span>
                <span className="font-bold text-primary text-sm">
                  R$ {debt.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-on-surface-variant block font-label-uppercase text-[10px]">
                  VENCIMENTO
                </span>
                <span className="text-error font-semibold">
                  {debt.dueDate} ({debt.daysOverdue}d atraso)
                </span>
              </div>
            </div>
          )}

          {/* Section: Canal de Contato */}
          <div>
            <div className="flex items-center justify-between mb-space-xs">
              <label className="block font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider">
                Canal Utilizado
              </label>
              {onOpenFicha && debt && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFicha(debt.id);
                  }}
                  className="text-xs text-secondary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir Ficha da Cobrança</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
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
                  className={`p-2 rounded text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    channel === c.label
                      ? 'bg-secondary text-on-secondary shadow-sm font-semibold'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{c.icon}</span>
                  <span className="font-badge-sm text-[11px]">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Pessoa Contatada */}
          <div>
            <label className="block font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider mb-space-xs">
              Pessoa / Interlocutor
            </label>
            <input
              className="w-full h-9 px-space-sm bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              type="text"
              placeholder="Ex: Dr. Marcos (Diretor Financeiro) ou Carla (Contas a Pagar)"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </div>

          {/* Section: Resultado da Interação */}
          <div>
            <label className="block font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider mb-space-xs">
              Resultado do Contato
            </label>
            <div className="relative">
              <select
                className="w-full h-9 pl-space-sm pr-8 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface font-semibold focus:outline-none focus:ring-1 focus:ring-primary-container appearance-none cursor-pointer"
                value={result}
                onChange={(e) => handleResultChange(e.target.value as ContactResult)}
              >
                <option value="Prometeu pagar">Prometeu pagar (PTP Registrada)</option>
                <option value="Vai pagar">Vai pagar</option>
                <option value="Pagou">Pagou (Confirmação de Quitação / Comprovante)</option>
                <option value="Solicitou retorno">Solicitou retorno</option>
                <option value="Não atende">Não atende / Caixa Postal</option>
                <option value="Não responde">Não responde</option>
                <option value="Não possui WhatsApp">Não possui WhatsApp</option>
                <option value="Mensagem enviada">Mensagem enviada</option>
                <option value="Áudio enviado">Áudio enviado</option>
                <option value="Ligação realizada">Ligação realizada</option>
                <option value="Contestação">Contestação / Disputa Comercial</option>
                <option value="Enviado para Serasa">Enviado para Serasa</option>
                <option value="Outro">Outro</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-2 text-on-surface-variant text-[18px] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* CONDITIONAL 1: Promessa de Pagamento (PTP) */}
          <div
            className={`p-space-md rounded-xl transition-all border ${
              hasPromise
                ? 'bg-surface-container-low border-secondary shadow-xs'
                : 'bg-surface-container-low/60 border-outline-variant/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-uppercase text-label-uppercase text-secondary font-bold flex items-center gap-space-2xs">
                <span className="material-symbols-outlined text-[16px]">payments</span>
                Vincular Nova Promessa de Pagamento
              </span>
              <input
                type="checkbox"
                checked={hasPromise}
                onChange={(e) => setHasPromise(e.target.checked)}
                className="accent-secondary h-4 w-4 cursor-pointer"
              />
            </div>
            {hasPromise && (
              <div className="grid grid-cols-2 gap-space-sm mt-space-sm pt-space-xs border-t border-surface-container">
                <div>
                  <label className="block font-badge-sm text-badge-sm text-on-surface-variant mb-space-2xs">
                    Valor Prometido (R$)
                  </label>
                  <input
                    className="w-full h-8 px-space-sm bg-surface-container-lowest rounded font-data-mono text-data-mono font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
                    type="text"
                    value={promisedValue}
                    onChange={(e) => setPromisedValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-badge-sm text-badge-sm text-on-surface-variant mb-space-2xs">
                    Data Prevista
                  </label>
                  <input
                    className="w-full h-8 px-space-sm bg-surface-container-lowest rounded font-data-mono text-data-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary"
                    type="date"
                    value={promisedDate}
                    onChange={(e) => setPromisedDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* CONDITIONAL 2: Pagamento Recebido */}
          <div
            className={`p-space-md rounded-xl transition-all border ${
              hasPayment
                ? 'bg-surface-container-low border-primary shadow-xs'
                : 'bg-surface-container-low/60 border-outline-variant/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-uppercase text-label-uppercase text-primary font-bold flex items-center gap-space-2xs">
                <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                Registrar Pagamento / Quitação
              </span>
              <input
                type="checkbox"
                checked={hasPayment}
                onChange={(e) => setHasPayment(e.target.checked)}
                className="accent-primary h-4 w-4 cursor-pointer"
              />
            </div>
            {hasPayment && (
              <div className="grid grid-cols-2 gap-space-sm mt-space-sm pt-space-xs border-t border-surface-container">
                <div>
                  <label className="block font-badge-sm text-badge-sm text-on-surface-variant mb-space-2xs">
                    Valor Recebido (R$) *
                  </label>
                  <input
                    className="w-full h-8 px-space-sm bg-surface-container-lowest rounded font-data-mono text-data-mono font-bold text-secondary focus:outline-none focus:ring-1 focus:ring-primary"
                    type="text"
                    value={receivedValue}
                    onChange={(e) => setReceivedValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-badge-sm text-badge-sm text-on-surface-variant mb-space-2xs">
                    Data do Pagamento
                  </label>
                  <input
                    className="w-full h-8 px-space-sm bg-surface-container-lowest rounded font-data-mono text-data-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* CONDITIONAL 3: Agendar Próximo Retorno */}
          <div
            className={`p-space-md rounded-xl transition-all border ${
              hasReturn
                ? 'bg-surface-container-low border-on-tertiary-container shadow-xs'
                : 'bg-surface-container-low/60 border-outline-variant/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-uppercase text-label-uppercase text-on-tertiary-container font-bold flex items-center gap-space-2xs">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                Agendar Próximo Retorno
              </span>
              <input
                type="checkbox"
                checked={hasReturn}
                onChange={(e) => setHasReturn(e.target.checked)}
                className="accent-secondary h-4 w-4 cursor-pointer"
              />
            </div>
            {hasReturn && (
              <div className="space-y-2 mt-space-sm pt-space-xs border-t border-surface-container">
                <div className="grid grid-cols-2 gap-space-sm">
                  <div>
                    <label className="block font-badge-sm text-badge-sm text-on-surface-variant mb-space-2xs">
                      Data Retorno
                    </label>
                    <input
                      className="w-full h-8 px-space-sm bg-surface-container-lowest rounded font-data-mono text-data-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-on-tertiary-container"
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-badge-sm text-badge-sm text-on-surface-variant mb-space-2xs">
                      Horário
                    </label>
                    <input
                      className="w-full h-8 px-space-sm bg-surface-container-lowest rounded font-data-mono text-data-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-on-tertiary-container"
                      type="time"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-badge-sm text-badge-sm text-on-surface-variant mb-space-2xs">
                    Motivo do Retorno
                  </label>
                  <select
                    className="w-full h-8 px-space-sm bg-surface-container-lowest rounded font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  >
                    <option value="Cliente solicitou retorno">Cliente solicitou retorno</option>
                    <option value="Confirmar pagamento">Confirmar pagamento</option>
                    <option value="Acompanhar promessa">Acompanhar promessa</option>
                    <option value="Negociação">Negociação</option>
                    <option value="Enviar informação/documento">Enviar informação/documento</option>
                    <option value="Nova tentativa de contato">Nova tentativa de contato</option>
                    <option value="Outro">Outro motivo</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section: Parecer Técnico / Observações */}
          <div>
            <label className="block font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider mb-space-xs">
              Parecer Técnico / Observações
            </label>
            <textarea
              className="w-full p-space-sm bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container resize-none leading-relaxed"
              rows={3}
              placeholder="Descreva detalhadamente o teor da conversa, justificativa alegada pelo cliente ou contraproposta acordada..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <p className="text-[10px] text-on-surface-variant mt-1">
              Registro auditável permanente vinculado à matrícula{' '}
              <strong className="text-primary font-semibold">{currentUser?.name}</strong>.
            </p>
          </div>

          {/* Recent History snippet for this debt */}
          {debt && debt.history.length > 0 && (
            <div className="p-space-sm bg-surface-container-low rounded-lg space-y-1.5 border border-outline-variant/30">
              <span className="font-label-uppercase text-[10px] font-bold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-primary">history</span>
                Última Interação Registrada:
              </span>
              <p className="text-xs text-on-surface leading-tight font-medium">
                {debt.history[0].dateFormatted} às {debt.history[0].timeFormatted} por{' '}
                <strong>{debt.history[0].operatorName}</strong> ({debt.history[0].channel}):{' '}
                {debt.history[0].notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-space-md bg-surface-container-low border-t border-surface-container flex flex-col gap-2 shrink-0">
          <button
            className="w-full h-10 px-space-lg bg-secondary hover:bg-on-secondary-container text-on-secondary rounded-lg font-title-md text-title-md font-semibold flex items-center justify-center gap-space-xs shadow-md transition-all active:scale-[0.99] cursor-pointer"
            type="button"
            onClick={() => handleSubmit(false)}
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Salvar contato</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              className="flex-1 h-8 rounded bg-primary-container hover:bg-primary text-surface font-label-uppercase text-label-uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer font-semibold"
              type="button"
              onClick={() => handleSubmit(true)}
              title="Salvar registro e navegar para a próxima cobrança da fila"
            >
              <span className="material-symbols-outlined text-[14px]">skip_next</span>
              <span>Salvar e ir p/ próxima</span>
            </button>

            <button
              className="h-8 px-4 rounded bg-surface-container hover:bg-surface-variant text-on-surface font-label-uppercase text-label-uppercase transition-colors cursor-pointer"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Toast confirmation */}
        {showToast && (
          <div className="absolute top-4 left-4 right-4 bg-primary text-surface p-3 rounded-lg shadow-xl flex items-center gap-2 z-50 text-xs animate-bounce">
            <span className="material-symbols-outlined text-secondary-fixed text-[18px]">
              verified
            </span>
            <span>Contato e histórico salvos com sucesso no prontuário!</span>
          </div>
        )}
      </div>
    </>
  );
};
