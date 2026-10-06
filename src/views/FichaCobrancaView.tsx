import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import {
  Debt,
  DebtorPhone,
  CompanyPaymentData,
  DebtorPhoneType,
  ContactChannel,
  ContactResult,
  ContactRegistrationPayload,
} from '../types';
import { getDebtStatusRowStyle } from '../utils/debtStatusStyles';

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

// Interface e dados mockados para Documentos da Cobrança
interface CobrancaDocumentoMock {
  id: string;
  nomeArquivo: string;
  tipo: string;
  data: string;
  usuario: string;
  tamanho: string;
  icone: string;
  corTipo: string;
}

const MOCK_DOCUMENTOS: CobrancaDocumentoMock[] = [
  {
    id: 'doc-1',
    nomeArquivo: 'Boleto.pdf',
    tipo: 'Boleto Bancário',
    data: '28/10/2024',
    usuario: 'Sistema ERP',
    tamanho: '245 KB',
    icone: 'receipt',
    corTipo: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'doc-2',
    nomeArquivo: 'Comprovante_Pagamento.pdf',
    tipo: 'Comprovante PIX / TED',
    data: '31/10/2024',
    usuario: 'Carlos Eduardo',
    tamanho: '180 KB',
    icone: 'payments',
    corTipo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'doc-3',
    nomeArquivo: 'Ficha_Protesto.pdf',
    tipo: 'Ficha de Protesto',
    data: '15/10/2024',
    usuario: 'Dr. Fernando Guimarães',
    tamanho: '512 KB',
    icone: 'gavel',
    corTipo: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'doc-4',
    nomeArquivo: 'Carta_Anuencia.pdf',
    tipo: 'Carta de Anuência',
    data: '01/11/2024',
    usuario: 'Carlos Eduardo',
    tamanho: '320 KB',
    icone: 'verified',
    corTipo: 'bg-purple-100 text-purple-800 border-purple-200',
  },
];

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

  // Re-render trigger when debtService emits changes
  const [, setTick] = useState(0);
  useEffect(() => {
    return debtService.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const debt = debtService.getDebtById(debtId) || debtService.getAllDebts()[0];
  const debtor = debtService.getDebtorById(debt.debtorId) || debtService.getAllDebtors()[0];
  const debtorDebts = debtService.getDebtsByDebtorId(debt.debtorId);
  const currentStatusStyle = getDebtStatusRowStyle(debt.status);

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

  // Dropdown states for quick copy buttons
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);

  // --- Phone Modal / Form State ---
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneType, setPhoneType] = useState<DebtorPhoneType>('Celular');
  const [phoneDescription, setPhoneDescription] = useState('');
  const [phoneHasWhatsApp, setPhoneHasWhatsApp] = useState(true);
  const [phoneActive, setPhoneActive] = useState(true);

  // Venda & Parcelamento expand/collapse state (initial closed)
  const [isVendaExpanded, setIsVendaExpanded] = useState(false);

  // Documentos da Cobrança expand/collapse state (initial open) & preview modal state
  const [isDocsExpanded, setIsDocsExpanded] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<CobrancaDocumentoMock | null>(null);

  // Consolidação de Cobranças (aparece quando o mesmo devedor possuir 2 ou mais cobranças em aberto)
  const openDebtorDebts = debtorDebts.filter((d) => d.status !== 'pago');
  const canConsolidate = openDebtorDebts.length >= 2;
  const [isConsolidateModalOpen, setIsConsolidateModalOpen] = useState(false);
  const [selectedDebtIdsForConsolidation, setSelectedDebtIdsForConsolidation] = useState<string[]>([]);
  const [mockConsolidation, setMockConsolidation] = useState<{
    protocol: string;
    createdAt: string;
    debtorId: string;
    debtorName: string;
    debtIds: string[];
    totalValue: number;
    totalDebtsCount: number;
    status: string;
  } | null>(null);

  const handleOpenConsolidateModal = () => {
    // Pré-selecionar todas as cobranças em aberto se nenhuma estiver selecionada
    if (selectedDebtIdsForConsolidation.length === 0 || !selectedDebtIdsForConsolidation.every((id) => openDebtorDebts.some((d) => d.id === id))) {
      setSelectedDebtIdsForConsolidation(openDebtorDebts.map((d) => d.id));
    }
    setIsConsolidateModalOpen(true);
  };

  const toggleDebtSelectionForConsolidation = (id: string) => {
    setSelectedDebtIdsForConsolidation((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllConsolidation = () => {
    if (selectedDebtIdsForConsolidation.length === openDebtorDebts.length) {
      setSelectedDebtIdsForConsolidation([]);
    } else {
      setSelectedDebtIdsForConsolidation(openDebtorDebts.map((d) => d.id));
    }
  };

  const selectedDebtsForConsolidation = openDebtorDebts.filter((d) =>
    selectedDebtIdsForConsolidation.includes(d.id)
  );

  const totalConsolidatedValue = selectedDebtsForConsolidation.reduce(
    (acc, d) => acc + d.currentValue,
    0
  );

  const handleCreateConsolidation = () => {
    if (selectedDebtIdsForConsolidation.length < 2) {
      showToast('Selecione pelo menos 2 cobranças para criar a consolidação.');
      return;
    }
    const protocol = `CNS-2024-${Math.floor(1000 + Math.random() * 9000)}`;
    setMockConsolidation({
      protocol,
      createdAt: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      debtorId: debtor.id,
      debtorName: debtor.name,
      debtIds: [...selectedDebtIdsForConsolidation],
      totalValue: totalConsolidatedValue,
      totalDebtsCount: selectedDebtsForConsolidation.length,
      status: 'Agrupado para Negociação Conjunta',
    });
    setIsConsolidateModalOpen(false);
    showToast(`Consolidação ${protocol} criada com sucesso! ${selectedDebtsForConsolidation.length} títulos agrupados.`);
  };

  const handleDownloadMockDoc = (doc: CobrancaDocumentoMock) => {
    try {
      const element = document.createElement('a');
      const file = new Blob(
        [
          `REGCOBRE - DOCUMENTO OFICIAL\n\nArquivo: ${doc.nomeArquivo}\nTipo: ${doc.tipo}\nData: ${doc.data}\nAnexado por: ${doc.usuario}\nTítulo: ${debt.titleNumber}\nDevedor: ${debt.debtorName}\n\nDocumento emitido eletronicamente para fins de instrução e conferência de cobrança.`
        ],
        { type: 'text/plain;charset=utf-8' }
      );
      element.href = URL.createObjectURL(file);
      element.download = doc.nomeArquivo;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showToast(`Download de "${doc.nomeArquivo}" iniciado com sucesso!`);
    } catch {
      showToast(`Download de "${doc.nomeArquivo}" concluído.`);
    }
  };

  // Reset / populate form when debtId changes
  useEffect(() => {
    setIsFazActive(false);
    setIsQueueFinishedNotice(false);
    setIsPhoneDropdownOpen(false);
    setIsPaymentDropdownOpen(false);
    setIsVendaExpanded(false);
    setPreviewDoc(null);
    setIsConsolidateModalOpen(false);
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

  // Coleção oficial de telefones do devedor (sem inventar fallback fictício)
  const debtorPhones: DebtorPhone[] = debtor.phones || [];
  const activePhones = debtorPhones.filter((p) => p.active);
  const primaryPhone = activePhones[0] || null;

  // Empresa Credora responsável pela cobrança
  const debtEmpresa = debtService.getEmpresaById(debt.empresaId);

  // Dados de recebimento oficiais EXCLUSIVOS da EMPRESA desta cobrança
  const companyPayments: CompanyPaymentData[] = debtService.getCompanyPaymentData(debt.empresaId);
  const activeCompanyPayments = companyPayments.filter((p) => p.active);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const primaryCompanyPayment =
    (selectedPaymentId ? activeCompanyPayments.find((p) => p.id === selectedPaymentId) : null) ||
    debtService.getPrimaryCompanyPaymentData(debt.empresaId) ||
    activeCompanyPayments[0] ||
    null;

  const handleCopyPaymentInfo = (payment?: CompanyPaymentData) => {
    const target = payment || primaryCompanyPayment;
    if (!target) {
      showToast('Nenhum dado de recebimento cadastrado para a empresa desta cobrança.');
      return;
    }
    const textToCopy = target.pixKey || target.paymentInfo || '';
    navigator.clipboard?.writeText(textToCopy);
    showToast(`Dado de recebimento copiado (${target.type}): ${textToCopy} - ${target.description}`);
    setIsPaymentDropdownOpen(false);
  };

  const handleCopyPhoneNumber = (phone?: string, desc?: string) => {
    const num = phone || (primaryPhone ? primaryPhone.number : '');
    if (!num) {
      showToast('Nenhum telefone cadastrado.');
      return;
    }
    navigator.clipboard?.writeText(num);
    showToast(`Telefone copiado: ${num}${desc ? ` (${desc})` : ''}`);
    setIsPhoneDropdownOpen(false);
  };

  const handleUsePaymentInNotes = (payment: CompanyPaymentData) => {
    const bankDetails = payment.bankName ? ` [${payment.bankName}${payment.accountDescription ? ` - ${payment.accountDescription}` : ''}]` : '';
    const payText = `Dados para Pagamento (Empresa): ${payment.type}${payment.pixKeyType ? ` (${payment.pixKeyType})` : ''}: ${payment.pixKey || payment.paymentInfo}${bankDetails} - ${payment.description}`;
    setNotes((prev) => (prev ? `${prev}\n${payText}` : payText));
    if (!isFazActive) {
      setIsFazActive(true);
    }
    showToast('Dados de recebimento da empresa inseridos na observação!');
    setIsPaymentDropdownOpen(false);
  };

  // --- Phone Handlers ---
  const handleOpenAddPhone = () => {
    setEditingPhoneId(null);
    setPhoneNumber('');
    setPhoneType('Celular');
    setPhoneDescription('');
    setPhoneHasWhatsApp(true);
    setPhoneActive(true);
    setIsPhoneModalOpen(true);
  };

  const handleOpenEditPhone = (phone: DebtorPhone) => {
    setEditingPhoneId(phone.id);
    setPhoneNumber(phone.number);
    setPhoneType(phone.type);
    setPhoneDescription(phone.description);
    setPhoneHasWhatsApp(phone.hasWhatsApp);
    setPhoneActive(phone.active);
    setIsPhoneModalOpen(true);
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtor) return;
    if (!phoneNumber.trim()) {
      showToast('Por favor, informe o número do telefone.');
      return;
    }

    if (editingPhoneId) {
      debtService.updateDebtorPhone(debtor.id, editingPhoneId, {
        number: phoneNumber.trim(),
        type: phoneType,
        description: phoneDescription.trim(),
        hasWhatsApp: phoneHasWhatsApp,
        active: phoneActive,
      });
      showToast(`Telefone ${phoneNumber} atualizado com sucesso!`);
    } else {
      debtService.addDebtorPhone(debtor.id, {
        number: phoneNumber.trim(),
        type: phoneType,
        description: phoneDescription.trim() || `${phoneType} de Contato`,
        hasWhatsApp: phoneHasWhatsApp,
        active: phoneActive,
      });
      showToast(`Novo telefone ${phoneNumber} cadastrado para ${debtor.name}!`);
    }
    setIsPhoneModalOpen(false);
  };

  const handleTogglePhoneActive = (phone: DebtorPhone) => {
    if (!debtor) return;
    debtService.toggleDebtorPhoneStatus(debtor.id, phone.id);
    showToast(
      phone.active
        ? `Telefone ${phone.number} desativado.`
        : `Telefone ${phone.number} ativado.`
    );
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
            {/* BOTÃO 1: COPIAR TELEFONE (COM SUPORTE A MÚLTIPLOS TELEFONES) */}
            <div className="relative">
              <div className="inline-flex rounded-lg shadow-2xs border border-outline-variant/30 bg-surface-container-lowest">
                <button
                  onClick={() => {
                    if (primaryPhone) {
                      handleCopyPhoneNumber(primaryPhone.number, primaryPhone.description);
                    } else {
                      showToast('Nenhum telefone cadastrado para este devedor.');
                    }
                  }}
                  className="h-9 px-3 hover:bg-surface-container text-on-surface font-label-uppercase text-xs tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer rounded-l-lg"
                  type="button"
                  title={primaryPhone ? `Copiar ${primaryPhone.number} (${primaryPhone.type})` : 'Copiar telefone'}
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                  <span>Copiar Telefone</span>
                </button>
                {activePhones.length > 1 && (
                  <button
                    onClick={() => {
                      setIsPhoneDropdownOpen(!isPhoneDropdownOpen);
                      setIsPaymentDropdownOpen(false);
                    }}
                    className="h-9 px-1.5 hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-l border-outline-variant/20 rounded-r-lg"
                    type="button"
                    title={`Ver todos os ${activePhones.length} telefones ativos`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isPhoneDropdownOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                )}
              </div>

              {/* Dropdown de Telefones */}
              {isPhoneDropdownOpen && activePhones.length > 1 && (
                <div className="absolute left-0 top-10 w-72 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 p-2 z-50 animate-fade-in flex flex-col gap-1">
                  <div className="px-2 py-1 text-[10px] font-label-uppercase font-bold text-outline border-b border-outline-variant/20 flex items-center justify-between">
                    <span>Telefones Ativos ({activePhones.length})</span>
                    <span className="text-[10px] text-primary font-semibold">Clique para copiar</span>
                  </div>
                  {activePhones.map((ph) => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => handleCopyPhoneNumber(ph.number, ph.description)}
                      className="p-2 rounded-lg hover:bg-surface-container flex items-center justify-between text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-data-mono font-bold text-xs text-primary group-hover:text-secondary">
                            {ph.number}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-[9px] font-semibold text-on-surface-variant">
                            {ph.type}
                          </span>
                          {ph.hasWhatsApp && (
                            <span className="material-symbols-outlined text-[13px] text-emerald-600" title="Possui WhatsApp">
                              chat
                            </span>
                          )}
                        </div>
                        {ph.description && (
                          <span className="text-[10px] text-on-surface-variant truncate mt-0.5">
                            {ph.description}
                          </span>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-outline group-hover:text-secondary shrink-0">
                        content_copy
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* BOTÃO 2: COPIAR PIX / DADOS DE RECEBIMENTO DA EMPRESA */}
            <div className="relative">
              <div className="inline-flex rounded-lg shadow-2xs border border-outline-variant/30 bg-surface-container-lowest">
                <button
                  onClick={() => handleCopyPaymentInfo(primaryCompanyPayment || undefined)}
                  className="h-9 px-3 hover:bg-surface-container text-on-surface font-label-uppercase text-xs tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer rounded-l-lg"
                  type="button"
                  title={primaryCompanyPayment ? `Copiar dado principal da empresa: ${primaryCompanyPayment.description}` : 'Copiar dados de recebimento da empresa'}
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">account_balance</span>
                  <span>Copiar PIX / Dados</span>
                </button>
                {activeCompanyPayments.length > 1 && (
                  <button
                    onClick={() => {
                      setIsPaymentDropdownOpen(!isPaymentDropdownOpen);
                      setIsPhoneDropdownOpen(false);
                    }}
                    className="h-9 px-1.5 hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors cursor-pointer border-l border-outline-variant/20 rounded-r-lg"
                    type="button"
                    title={`Ver todos os ${activeCompanyPayments.length} dados de recebimento ativos da empresa`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isPaymentDropdownOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                )}
              </div>

              {/* Dropdown de Dados de Recebimento da Empresa */}
              {isPaymentDropdownOpen && activeCompanyPayments.length > 0 && (
                <div className="absolute left-0 top-10 w-88 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 p-2 z-50 animate-fade-in flex flex-col gap-1">
                  <div className="px-2 py-1.5 text-[10px] font-label-uppercase font-bold text-outline border-b border-outline-variant/20 flex items-center justify-between">
                    <span>
                      {debtEmpresa?.nomeFantasia || 'Empresa'} • {activeCompanyPayments.length} forma(s)
                    </span>
                    <span className="text-[10px] text-secondary font-semibold">Clique para selecionar / copiar</span>
                  </div>
                  {activeCompanyPayments.map((p) => (
                    <div
                      key={p.id}
                      className={`p-2 rounded-lg hover:bg-surface-container flex items-center justify-between text-left transition-colors group ${
                        primaryCompanyPayment?.id === p.id ? 'bg-surface-container-low border border-primary/20' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPaymentId(p.id);
                          handleCopyPaymentInfo(p);
                        }}
                        className="flex flex-col min-w-0 pr-2 flex-1 text-left cursor-pointer"
                        title="Selecionar e copiar este dado de recebimento"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container text-[9px] font-bold uppercase">
                            {p.type} {p.pixKeyType ? `• ${p.pixKeyType}` : ''}
                          </span>
                          {p.isPrimary && (
                            <span className="px-1 py-0.2 rounded bg-primary-fixed text-on-primary-fixed text-[8px] font-bold uppercase">
                              Padrão
                            </span>
                          )}
                          {primaryCompanyPayment?.id === p.id && (
                            <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[8px] font-bold uppercase">
                              ✓ Selecionada
                            </span>
                          )}
                          <span className="text-xs font-semibold text-primary truncate max-w-[140px]">
                            {p.description}
                          </span>
                        </div>
                        <span className="font-data-mono text-[11px] text-on-surface font-semibold truncate mt-0.5 select-all">
                          {p.pixKey || p.paymentInfo}
                        </span>
                        {p.bankName && (
                          <span className="text-[10px] text-on-surface-variant truncate">
                            {p.bankName}
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaymentId(p.id);
                            showToast(`Forma de recebimento selecionada: ${p.description}`);
                            setIsPaymentDropdownOpen(false);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                            primaryCompanyPayment?.id === p.id
                              ? 'bg-primary text-surface'
                              : 'bg-surface-container-high hover:bg-primary/20 text-primary'
                          }`}
                          title="Selecionar esta forma para repasse"
                        >
                          {primaryCompanyPayment?.id === p.id ? 'Ativa' : 'Selecionar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUsePaymentInNotes(p)}
                          className="px-1.5 py-0.5 rounded bg-surface-container-high hover:bg-secondary-container text-[10px] text-primary font-semibold transition-colors cursor-pointer"
                          title="Inserir nas observações da cobrança"
                        >
                          Usar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyPaymentInfo(p)}
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                          title="Copiar"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AÇÃO: CONSOLIDAR COBRANÇAS (Exibida quando o mesmo devedor possuir 2 ou mais cobranças em aberto) */}
            {canConsolidate && (
              <button
                type="button"
                onClick={handleOpenConsolidateModal}
                className={`h-9 px-3 rounded-lg shadow-2xs font-label-uppercase text-xs tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
                  mockConsolidation && mockConsolidation.debtorId === debtor.id
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-400 font-bold'
                    : 'bg-surface-container-lowest hover:bg-amber-500/10 text-amber-800 border-amber-500/40'
                }`}
                title={`Este devedor possui ${openDebtorDebts.length} cobranças em aberto. Clique para abrir a consolidação.`}
              >
                <span className="material-symbols-outlined text-[17px] text-amber-600">
                  {mockConsolidation && mockConsolidation.debtorId === debtor.id ? 'task_alt' : 'merge_type'}
                </span>
                <span>
                  {mockConsolidation && mockConsolidation.debtorId === debtor.id
                    ? 'Cobranças Consolidadas'
                    : 'Consolidar Cobranças'}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                  {openDebtorDebts.length}
                </span>
              </button>
            )}

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

            {/* EMPRESA RESPONSÁVEL PELA COBRANÇA */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="material-symbols-outlined text-[18px] text-primary">domain</span>
              <span className="font-label-uppercase text-xs font-bold text-primary tracking-wider uppercase">
                {debtEmpresa ? debtEmpresa.razaoSocial || debtEmpresa.nomeFantasia : 'RegCobre Cobranças'}
              </span>
              {debtEmpresa?.cnpj && (
                <span className="text-[11px] text-on-surface-variant font-data-mono">
                  • CNPJ: {debtEmpresa.cnpj}
                </span>
              )}
              {debtEmpresa?.modoCarteira && (
                <span
                  className={`px-1.5 py-0.5 rounded font-badge-sm text-[9px] font-bold uppercase ${
                    debtEmpresa.modoCarteira === 'COMPARTILHADA'
                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                  }`}
                  title={
                    debtEmpresa.modoCarteira === 'COMPARTILHADA'
                      ? 'Cobranças compartilhadas entre operadores com acesso'
                      : 'Cobranças exclusivas para usuários desta empresa'
                  }
                >
                  {debtEmpresa.modoCarteira}
                </span>
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

              {/* STATUS ATUAL DA COBRANÇA */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-badge-sm text-xs font-semibold uppercase tracking-wider ${currentStatusStyle.badgeClass}`}
                title={`Status da Cobrança: ${currentStatusStyle.label}`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${currentStatusStyle.indicatorClass}`}
                  aria-hidden="true"
                />
                <span>{debt.statusLabel || currentStatusStyle.label}</span>
              </span>

              {/* Informações de Vencimento / Atraso */}
              {debt.daysOverdue > 0 && (
                <span className="px-2.5 py-1 rounded bg-error-container text-on-error-container font-badge-sm text-xs font-bold flex items-center gap-1.5 border border-error/30 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                  <span>{debt.daysOverdue} dias em atraso (Vencida)</span>
                </span>
              )}

              {debt.daysOverdue === 0 && (
                <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-badge-sm text-xs font-bold flex items-center gap-1.5 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <span>Vence Hoje</span>
                </span>
              )}
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
        {/* BANNER DE COBRANÇAS CONSOLIDADAS (SIMULAÇÃO MOCK)                          */}
        {/* ========================================================================= */}
        {mockConsolidation && mockConsolidation.debtorId === debtor.id && (
          <div className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-xl shadow-xs animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[24px]">merge_type</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-title-md font-bold text-sm text-on-surface">
                      Consolidação de Cobranças em Andamento
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-mono text-[10px] font-bold">
                      {mockConsolidation.protocol}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-[10px] font-semibold border border-amber-300">
                      {mockConsolidation.status}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Este devedor possui <strong>{mockConsolidation.totalDebtsCount} cobranças agrupadas</strong> totalizando{' '}
                    <strong className="text-on-surface font-mono">
                      R$ {mockConsolidation.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>{' '}
                    para negociação conjunta. As cobranças individuais e seus históricos permanecem integralmente preservados para fins de auditoria.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsConsolidateModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">list</span>
                  <span>Ver / Editar Agrupamento</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMockConsolidation(null);
                    showToast('Consolidação simulada desfeita com sucesso.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-error/10 text-xs font-semibold text-error border border-error/20 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="Desfazer a simulação desta consolidação"
                >
                  <span className="material-symbols-outlined text-[15px]">close</span>
                  <span>Desfazer</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
          {/* DADOS DA VENDA E PARCELAMENTO (ORIGEM DA COBRANÇA)                    */}
          {/* ===================================================================== */}
          {debt.vendaOrigem && (() => {
            const venda = debt.vendaOrigem;
            const parcelas = venda.parcelas || [];
            const itens = venda.itens || [];

            // Cálculos financeiros do parcelamento
            const valorTotalVenda = venda.valorTotal ?? parcelas.reduce((acc, p) => acc + p.valor, 0);

            // Total Pago: soma das parcelas pagas, considerando o valor efetivamente pago quando informado
            const totalPago = parcelas
              .filter((p) => p.situacao === 'Paga')
              .reduce((acc, p) => acc + (p.valorPago !== undefined ? p.valorPago : p.valor), 0);

            // Total Vencido: soma das parcelas com situação "Vencida"
            const totalVencido = parcelas
              .filter((p) => p.situacao === 'Vencida')
              .reduce((acc, p) => acc + p.valor, 0);

            // Total A vencer: soma das parcelas com situação "A vencer"
            const totalAVencer = parcelas
              .filter((p) => p.situacao === 'A vencer')
              .reduce((acc, p) => acc + p.valor, 0);

            // Em aberto: valor total da venda - total pago
            const totalEmAberto = Math.max(0, valorTotalVenda - totalPago);

            const totalParcelasQtd = venda.quantidadeParcelas ?? parcelas.length;
            const valorParcelaBase = venda.valorParcela ?? (parcelas[0]?.valor ?? (totalParcelasQtd > 0 ? valorTotalVenda / totalParcelasQtd : 0));

            // Identificar se a parcela corresponde à cobrança aberta
            const isCurrentDebtInstallment = (pNum: number) => {
              if (!debt.installment) return false;
              const clean = debt.installment.trim();
              const match = clean.match(/^(\d+)/);
              if (match) {
                return parseInt(match[1], 10) === pNum;
              }
              if (clean.toLowerCase().includes('única') && pNum === 1) {
                return true;
              }
              return false;
            };

            return (
              <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30 transition-all">
                {/* Header Recolhível */}
                <div
                  onClick={() => setIsVendaExpanded(!isVendaExpanded)}
                  className="flex items-center justify-between cursor-pointer select-none group"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsVendaExpanded(!isVendaExpanded);
                    }
                  }}
                  aria-expanded={isVendaExpanded}
                >
                  <div className="flex items-center gap-space-xs flex-wrap min-w-0">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      shopping_cart
                    </span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-base group-hover:text-primary transition-colors">
                      Dados da Venda
                    </h2>

                    {/* Resumo compacto na mesma linha */}
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-data-mono flex-wrap">
                      <span className="text-outline-variant">•</span>
                      {venda.pedidoNumero && (
                        <span>
                          Pedido <strong className="text-on-surface">{venda.pedidoNumero}</strong>
                        </span>
                      )}
                      {venda.pedidoNumero && <span className="text-outline-variant">·</span>}
                      <span>
                        Total:{' '}
                        <strong className="text-primary font-bold">
                          R$ {valorTotalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      </span>
                      {totalParcelasQtd > 0 && (
                        <>
                          <span className="text-outline-variant">·</span>
                          <span>
                            {totalParcelasQtd}x de R${' '}
                            <strong className="text-on-surface">
                              {valorParcelaBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-primary font-medium hidden sm:inline">
                      {isVendaExpanded ? 'Recolher detalhes' : 'Ver detalhes e parcelas'}
                    </span>
                    <button
                      type="button"
                      className="p-1 rounded-full text-on-surface-variant group-hover:text-primary group-hover:bg-surface-container-high transition-colors"
                      aria-label={isVendaExpanded ? 'Recolher' : 'Expandir'}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isVendaExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Conteúdo Detalhado (Expandido) */}
                {isVendaExpanded && (
                  <div className="mt-space-md pt-space-md border-t border-outline-variant/20 flex flex-col gap-space-lg">
                    {/* A) DADOS GERAIS DA VENDA */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2 text-on-surface-variant font-label-uppercase text-xs font-bold tracking-wider">
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          receipt_long
                        </span>
                        <span>Origem Financeira da Venda</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant/20 text-xs">
                        <div>
                          <span className="text-outline block font-label-uppercase text-[10px]">
                            PEDIDO
                          </span>
                          <strong className="text-primary font-data-mono">
                            {venda.pedidoNumero || 'Não informado'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-outline block font-label-uppercase text-[10px]">
                            DATA DA VENDA
                          </span>
                          <strong className="text-on-surface font-data-mono">
                            {venda.dataVenda || 'Não informada'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-outline block font-label-uppercase text-[10px]">
                            NOTA FISCAL
                          </span>
                          <strong className="text-on-surface font-data-mono">
                            {debt.invoiceNumber || 'Não informada'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-outline block font-label-uppercase text-[10px]">
                            VALOR TOTAL
                          </span>
                          <strong className="text-primary font-data-mono font-bold">
                            R$ {valorTotalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                        <div>
                          <span className="text-outline block font-label-uppercase text-[10px]">
                            PARCELAMENTO
                          </span>
                          <strong className="text-on-surface font-data-mono">
                            {totalParcelasQtd > 0
                              ? `${totalParcelasQtd}x de R$ ${valorParcelaBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              : 'À vista'}
                          </strong>
                        </div>
                      </div>

                      {venda.descricao && (
                        <div className="mt-2 text-xs text-on-surface-variant bg-surface-container-low/50 px-3 py-1.5 rounded border border-outline-variant/15">
                          <span className="font-semibold text-on-surface">Descrição: </span>
                          <span>{venda.descricao}</span>
                        </div>
                      )}
                    </div>

                    {/* B) ITENS DA VENDA (OPCIONAL) */}
                    {itens.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-label-uppercase text-xs font-bold text-on-surface-variant flex items-center gap-1.5 tracking-wider">
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              inventory_2
                            </span>
                            <span>Itens da Venda ({itens.length})</span>
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
                          <table className="w-full text-left font-body-sm text-xs">
                            <thead>
                              <tr className="bg-surface-container-low text-on-surface-variant font-label-uppercase tracking-wider">
                                <th className="py-2 px-3">Produto / Serviço</th>
                                <th className="py-2 px-3 text-center">Qtd.</th>
                                <th className="py-2 px-3 text-right">Valor Unitário</th>
                                <th className="py-2 px-3 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/15 bg-surface-container-lowest">
                              {itens.map((it, idx) => (
                                <tr key={idx} className="hover:bg-surface-container-low/50 transition-colors">
                                  <td className="py-2 px-3 font-medium text-on-surface">
                                    {it.descricao}
                                  </td>
                                  <td className="py-2 px-3 text-center font-data-mono text-on-surface">
                                    {it.quantidade ?? 1}
                                  </td>
                                  <td className="py-2 px-3 text-right font-data-mono text-on-surface-variant">
                                    {it.valorUnitario !== undefined
                                      ? `R$ ${it.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                      : '—'}
                                  </td>
                                  <td className="py-2 px-3 text-right font-data-mono font-bold text-primary">
                                    {it.valorTotal !== undefined
                                      ? `R$ ${it.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                      : it.quantidade !== undefined && it.valorUnitario !== undefined
                                      ? `R$ ${(it.quantidade * it.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                      : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* C) PARCELAMENTO & RESUMO FINANCEIRO */}
                    {parcelas.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-label-uppercase text-xs font-bold text-on-surface-variant flex items-center gap-1.5 tracking-wider">
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              calendar_month
                            </span>
                            <span>
                              Parcelamento — {totalParcelasQtd}x de R${' '}
                              {valorParcelaBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </span>
                        </div>

                        {/* Cards Resumo Financeiro do Parcelamento */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
                          <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/20 flex flex-col">
                            <span className="text-outline font-label-uppercase text-[10px]">
                              Venda Total
                            </span>
                            <span className="font-data-mono font-bold text-sm text-on-surface mt-0.5">
                              R$ {valorTotalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/20 flex flex-col">
                            <span className="text-outline font-label-uppercase text-[10px]">
                              Parcelamento
                            </span>
                            <span className="font-data-mono font-semibold text-xs text-on-surface mt-0.5">
                              {totalParcelasQtd}x de R${' '}
                              {valorParcelaBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200/50 flex flex-col">
                            <span className="text-emerald-800 font-label-uppercase text-[10px] font-semibold">
                              Pago
                            </span>
                            <span className="font-data-mono font-bold text-sm text-emerald-700 mt-0.5">
                              R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="p-2.5 bg-rose-50/70 rounded-lg border border-rose-200/50 flex flex-col">
                            <span className="text-rose-800 font-label-uppercase text-[10px] font-semibold">
                              Vencido
                            </span>
                            <span className="font-data-mono font-bold text-sm text-rose-700 mt-0.5">
                              R$ {totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col">
                            <span className="text-slate-700 font-label-uppercase text-[10px] font-semibold">
                              A Vencer
                            </span>
                            <span className="font-data-mono font-semibold text-sm text-slate-700 mt-0.5">
                              R$ {totalAVencer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="p-2.5 bg-primary-container/20 rounded-lg border border-primary/30 flex flex-col">
                            <span className="text-primary font-label-uppercase text-[10px] font-bold">
                              Em Aberto
                            </span>
                            <span className="font-data-mono font-bold text-sm text-primary mt-0.5">
                              R$ {totalEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Tabela de Parcelas */}
                        <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
                          <table className="w-full text-left font-body-sm text-xs">
                            <thead>
                              <tr className="bg-surface-container-low text-on-surface-variant font-label-uppercase tracking-wider">
                                <th className="py-2 px-3">Parcela</th>
                                <th className="py-2 px-3">Vencimento</th>
                                <th className="py-2 px-3 text-right">Valor</th>
                                <th className="py-2 px-3">Situação</th>
                                <th className="py-2 px-3">Informações Adicionais</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/15 bg-surface-container-lowest">
                              {parcelas.map((parc) => {
                                const isCurrent = isCurrentDebtInstallment(parc.numero);
                                const parcFormatted = `${String(parc.numero).padStart(2, '0')}/${String(totalParcelasQtd).padStart(2, '0')}`;

                                return (
                                  <tr
                                    key={parc.numero}
                                    className={`transition-colors ${
                                      isCurrent
                                        ? 'bg-primary/5 hover:bg-primary/10 border-l-[3px] border-l-primary'
                                        : 'hover:bg-surface-container-low/50'
                                    }`}
                                  >
                                    <td className="py-2.5 px-3 font-data-mono font-semibold text-on-surface">
                                      <div className="flex items-center gap-2">
                                        <span>{parcFormatted}</span>
                                        {isCurrent && (
                                          <span className="px-1.5 py-0.5 rounded bg-primary text-surface font-badge-sm text-[9px] font-bold uppercase tracking-wider">
                                            Cobrança Atual
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 font-data-mono text-on-surface">
                                      {parc.vencimento}
                                    </td>
                                    <td className="py-2.5 px-3 font-data-mono font-bold text-on-surface text-right">
                                      R$ {parc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-badge-sm text-[10px] font-semibold ${
                                          parc.situacao === 'Paga'
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                                            : parc.situacao === 'Vencida'
                                            ? 'bg-rose-100 text-rose-800 border border-rose-200/60'
                                            : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                                        }`}
                                      >
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            parc.situacao === 'Paga'
                                              ? 'bg-emerald-600'
                                              : parc.situacao === 'Vencida'
                                              ? 'bg-rose-600'
                                              : 'bg-slate-400'
                                          }`}
                                        />
                                        <span>{parc.situacao}</span>
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-on-surface-variant font-data-mono text-[11px]">
                                      {parc.situacao === 'Paga' ? (
                                        <span className="text-emerald-700">
                                          Pago:{' '}
                                          <strong>
                                            R${' '}
                                            {(parc.valorPago ?? parc.valor).toLocaleString('pt-BR', {
                                              minimumFractionDigits: 2,
                                            })}
                                          </strong>
                                          {parc.dataPagamento ? ` em ${parc.dataPagamento}` : ''}
                                        </span>
                                      ) : parc.situacao === 'Vencida' ? (
                                        <span className="text-rose-700">
                                          {isCurrent ? 'Cobrança em andamento na ficha' : 'Aguardando liquidação'}
                                        </span>
                                      ) : (
                                        <span className="text-on-surface-variant italic">
                                          Parcela futura
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ===================================================================== */}
          {/* SEÇÃO RECOLHÍVEL: DOCUMENTOS DA COBRANÇA                              */}
          {/* ===================================================================== */}
          <div className="p-space-lg bg-surface-container-lowest rounded-xl shadow-sm flex flex-col border border-outline-variant/30 transition-all">
            {/* Header Recolhível */}
            <div
              onClick={() => setIsDocsExpanded(!isDocsExpanded)}
              className="flex items-center justify-between cursor-pointer select-none group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsDocsExpanded(!isDocsExpanded);
                }
              }}
              aria-expanded={isDocsExpanded}
            >
              <div className="flex items-center gap-space-xs flex-wrap min-w-0">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  folder_open
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-base group-hover:text-primary transition-colors">
                  Documentos da Cobrança
                </h2>

                {/* Resumo compacto */}
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-data-mono flex-wrap">
                  <span className="text-outline-variant">•</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container font-data-mono font-bold text-xs text-primary">
                    {MOCK_DOCUMENTOS.length} Arquivos
                  </span>
                  <span className="text-outline-variant hidden sm:inline">·</span>
                  <span className="text-on-surface-variant text-[11px] hidden sm:inline">
                    Boleto, Comprovante, Protesto e Anuência
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-primary font-medium hidden sm:inline">
                  {isDocsExpanded ? 'Recolher' : 'Ver documentos'}
                </span>
                <button
                  type="button"
                  className="p-1 rounded-full text-on-surface-variant group-hover:text-primary group-hover:bg-surface-container-high transition-colors"
                  aria-label={isDocsExpanded ? 'Recolher' : 'Expandir'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isDocsExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>
            </div>

            {/* Conteúdo Detalhado (Expandido) */}
            {isDocsExpanded && (
              <div className="mt-space-md pt-space-md border-t border-outline-variant/20 flex flex-col gap-3">
                <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
                  <table className="w-full text-left font-body-sm text-xs">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant font-label-uppercase tracking-wider">
                        <th className="py-2.5 px-3">Nome do Arquivo</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">Usuário que Anexou</th>
                        <th className="py-2.5 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15 bg-surface-container-lowest">
                      {MOCK_DOCUMENTOS.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-surface-container-low/60 transition-colors group"
                        >
                          {/* Nome do arquivo */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
                                <span className="material-symbols-outlined text-[18px]">
                                  picture_as_pdf
                                </span>
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-primary font-data-mono text-xs truncate group-hover:underline">
                                  {doc.nomeArquivo}
                                </span>
                                <span className="text-[10px] text-on-surface-variant font-data-mono">
                                  {doc.tamanho}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Tipo */}
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-badge-sm text-[10px] font-semibold border ${doc.corTipo}`}
                            >
                              <span className="material-symbols-outlined text-[12px]">
                                {doc.icone}
                              </span>
                              <span>{doc.tipo}</span>
                            </span>
                          </td>

                          {/* Data */}
                          <td className="py-2.5 px-3 font-data-mono text-on-surface font-medium">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] text-outline">
                                calendar_today
                              </span>
                              <span>{doc.data}</span>
                            </div>
                          </td>

                          {/* Usuário que anexou */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-primary">
                                {doc.usuario.charAt(0)}
                              </div>
                              <span className="text-on-surface font-medium text-xs">
                                {doc.usuario}
                              </span>
                            </div>
                          </td>

                          {/* Ações: Visualizar e Baixar */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="px-2.5 py-1 rounded-md bg-surface-container hover:bg-primary hover:text-surface text-primary font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title={`Visualizar ${doc.nomeArquivo}`}
                              >
                                <span className="material-symbols-outlined text-[15px]">
                                  visibility
                                </span>
                                <span>Visualizar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadMockDoc(doc)}
                                className="px-2.5 py-1 rounded-md bg-surface-container hover:bg-secondary hover:text-on-secondary text-on-surface-variant font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                title={`Baixar ${doc.nomeArquivo}`}
                              >
                                <span className="material-symbols-outlined text-[15px]">
                                  download
                                </span>
                                <span>Baixar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1 pt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      info
                    </span>
                    <span>Documentos vinculados eletronicamente à pasta judicial e extrajudicial do título.</span>
                  </span>
                  <span className="font-data-mono">Hash SHA-256 verificado</span>
                </div>
              </div>
            )}
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

              {/* TELEFONES DO DEVEDOR (MÚLTIPLOS TELEFONES) */}
              <div className="pt-2 border-t border-outline-variant/15">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                    <span className="text-outline font-label-uppercase text-[10px] font-bold">
                      TELEFONES DO DEVEDOR ({debtorPhones.length})
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-data-mono">
                      • {debtorPhones.filter((p) => p.active).length} ativo(s)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddPhone}
                    className="text-[11px] text-primary hover:text-secondary font-semibold inline-flex items-center gap-0.5 cursor-pointer bg-surface-container hover:bg-surface-variant px-2 py-0.5 rounded transition-colors"
                    title="Cadastrar novo telefone para este devedor"
                  >
                    <span className="material-symbols-outlined text-[13px]">add</span>
                    <span>Adicionar</span>
                  </button>
                </div>

                {debtorPhones.length === 0 ? (
                  <div className="p-2.5 bg-surface-container-low rounded-lg border border-dashed border-outline-variant/30 text-center">
                    <p className="text-xs text-on-surface-variant italic">
                      Nenhum telefone cadastrado.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {debtorPhones.map((ph) => (
                      <div
                        key={ph.id}
                        className={`p-2 rounded-lg flex items-center justify-between gap-2 border transition-colors ${
                          ph.active
                            ? 'bg-surface-container-low border-outline-variant/20 hover:border-secondary/30'
                            : 'bg-surface-container/50 border-dashed border-outline-variant/30 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-data-mono font-bold text-xs text-on-surface">
                              {ph.number}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-[9px] font-semibold text-on-surface-variant">
                              {ph.type}
                            </span>
                            {ph.hasWhatsApp && (
                              <span
                                className="inline-flex items-center text-emerald-700 font-bold text-[10px] gap-0.5"
                                title="Possui WhatsApp"
                              >
                                <span className="material-symbols-outlined text-[13px]">chat</span>
                                <span>WhatsApp</span>
                              </span>
                            )}
                            <span
                              className={`px-1 py-0.2 rounded font-badge-sm text-[9px] font-bold ${
                                ph.active
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : 'bg-surface-container-highest text-outline'
                              }`}
                            >
                              {ph.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          {ph.description && (
                            <span className="text-[10px] text-on-surface-variant truncate mt-0.5">
                              {ph.description}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyPhoneNumber(ph.number, ph.description)}
                            className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                            title={`Copiar telefone ${ph.number}`}
                          >
                            <span className="material-symbols-outlined text-[15px]">content_copy</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditPhone(ph)}
                            className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                            title="Editar telefone"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePhoneActive(ph)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                              ph.active
                                ? 'text-on-surface-variant hover:text-error hover:bg-error-container/40'
                                : 'text-secondary hover:bg-secondary-container/40'
                            }`}
                            title={ph.active ? 'Desativar telefone (sem exclusão física)' : 'Reativar telefone'}
                          >
                            {ph.active ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DADOS DE RECEBIMENTO DA EMPRESA (PARA COBRANÇA) */}
              <div className="pt-2.5 border-t border-outline-variant/20">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      account_balance
                    </span>
                    <span className="text-outline font-label-uppercase text-[10px] font-bold">
                      DADOS DE RECEBIMENTO DA EMPRESA ({activeCompanyPayments.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-secondary font-semibold font-data-mono">
                    Chaves Corporativas
                  </span>
                </div>

                {activeCompanyPayments.length === 0 ? (
                  <div className="p-2.5 bg-surface-container-low rounded-lg border border-dashed border-outline-variant/30 text-center">
                    <p className="text-xs text-on-surface-variant italic">
                      Nenhum dado de recebimento da empresa ativo.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {activeCompanyPayments.map((p) => (
                      <div
                        key={p.id}
                        className={`p-2.5 rounded-lg flex flex-col gap-1 border transition-colors bg-surface-container-low border-outline-variant/20 hover:border-secondary/40 ${
                          p.isPrimary ? 'border-secondary/40 bg-surface-container-low/80' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                            <span className="px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container text-[9px] font-bold uppercase shrink-0">
                              {p.type} {p.pixKeyType ? `• ${p.pixKeyType}` : ''}
                            </span>
                            {p.isPrimary && (
                              <span className="px-1 py-0.2 rounded bg-primary-fixed text-on-primary-fixed text-[8px] font-bold uppercase shrink-0">
                                Principal
                              </span>
                            )}
                            <span className="text-xs font-semibold text-primary truncate">
                              {p.description}
                            </span>
                          </div>
                          {p.bankName && (
                            <span className="text-[10px] text-on-surface-variant font-data-mono truncate max-w-[100px]">
                              {p.bankName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-1.5 pt-0.5">
                          <span className="font-data-mono text-xs text-on-surface select-all truncate font-semibold">
                            {p.pixKey || p.paymentInfo}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUsePaymentInNotes(p)}
                              className="px-1.5 py-0.5 rounded bg-surface-container hover:bg-secondary-container text-[10px] text-primary font-semibold transition-colors cursor-pointer"
                              title="Inserir dado de recebimento da empresa nas observações da cobrança"
                            >
                              Usar na cobrança
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyPaymentInfo(p)}
                              className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                              title="Copiar chave/dado de recebimento"
                            >
                              <span className="material-symbols-outlined text-[15px]">content_copy</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
              {canConsolidate && (
                <button
                  type="button"
                  onClick={handleOpenConsolidateModal}
                  className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Consolidar cobranças em aberto deste devedor"
                >
                  <span className="material-symbols-outlined text-[14px]">merge_type</span>
                  <span>Consolidar ({openDebtorDebts.length})</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {debtorDebts.map((d) => {
                const isCurrent = d.id === debt.id;
                const isConsolidatedInMock =
                  mockConsolidation &&
                  mockConsolidation.debtorId === debtor.id &&
                  mockConsolidation.debtIds.includes(d.id);

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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-data-mono font-bold text-primary text-xs">
                          Título {d.titleNumber} ({d.installment})
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          • {d.invoiceNumber}
                        </span>
                        {isConsolidatedInMock && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-badge-sm text-[9px] uppercase font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[11px]">link</span>
                            Consolidado
                          </span>
                        )}
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
                      {(() => {
                        const dStyle = getDebtStatusRowStyle(d.status);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-badge-sm text-[10px] font-semibold ${dStyle.badgeClass}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${dStyle.indicatorClass}`}
                            />
                            <span>{d.statusLabel || dStyle.label}</span>
                          </span>
                        );
                      })()}
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

      {/* =================================================================== */}
      {/* MODAL: ADICIONAR / EDITAR TELEFONE NO DEVEDOR                       */}
      {/* =================================================================== */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-md w-full border border-outline-variant/30 overflow-hidden animate-fade-in">
            <div className="p-4 bg-primary text-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
                  call
                </span>
                <div>
                  <h3 className="font-title-md font-bold text-sm">
                    {editingPhoneId ? 'Editar Telefone do Devedor' : 'Novo Telefone do Devedor'}
                  </h3>
                  <span className="text-[10px] text-on-primary-container block truncate max-w-[260px]">
                    {debtor.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(false)}
                className="text-surface hover:text-secondary-fixed cursor-pointer p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePhone} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                  NÚMERO DO TELEFONE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: (11) 98822-1044 ou (11) 3452-8800"
                  className="w-full h-9 px-3 bg-surface-container-low rounded-lg font-data-mono text-sm text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    TIPO *
                  </label>
                  <select
                    className="w-full h-9 px-2 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                    value={phoneType}
                    onChange={(e) => setPhoneType(e.target.value as DebtorPhoneType)}
                  >
                    <option value="Celular">Celular</option>
                    <option value="Fixo">Fixo</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    STATUS DO TELEFONE
                  </label>
                  <label className="flex items-center gap-2 h-9 px-2 bg-surface-container-low rounded-lg border border-outline-variant/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={phoneActive}
                      onChange={(e) => setPhoneActive(e.target.checked)}
                      className="accent-secondary h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-on-surface">
                      {phoneActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                  DESCRIÇÃO / APELIDO / RESPONSÁVEL
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dr. Marcos (Diretoria), Setor Cobrança, Recepção"
                  className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
                  value={phoneDescription}
                  onChange={(e) => setPhoneDescription(e.target.value)}
                />
              </div>

              <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-on-surface block text-xs">
                    Possui WhatsApp ativo?
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Exibe o selo de mensageria na Ficha de Cobrança
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={phoneHasWhatsApp}
                  onChange={(e) => setPhoneHasWhatsApp(e.target.checked)}
                  className="accent-emerald-600 h-4 w-4"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsPhoneModalOpen(false)}
                  className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-primary-container text-surface font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  {editingPhoneId ? 'Salvar Alterações' : 'Cadastrar Telefone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE PRÉ-VISUALIZAÇÃO DE DOCUMENTO (UI MOCK)                          */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-space-md sm:p-space-xl overflow-y-auto animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col border border-outline-variant/30">
            {/* Header do Modal */}
            <div className="h-14 px-space-lg bg-primary text-surface flex items-center justify-between shrink-0">
              <div className="flex items-center gap-space-sm min-w-0">
                <span className="material-symbols-outlined text-rose-300 text-[24px]">
                  picture_as_pdf
                </span>
                <div className="min-w-0">
                  <h3 className="font-title-md text-title-md font-bold leading-tight truncate">
                    {previewDoc.nomeArquivo}
                  </h3>
                  <span className="font-label-uppercase text-[10px] text-surface/80 tracking-wider">
                    {previewDoc.tipo} • Anexado em {previewDoc.data} por {previewDoc.usuario}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-space-xs shrink-0">
                <button
                  type="button"
                  onClick={() => handleDownloadMockDoc(previewDoc)}
                  className="h-8 px-3 rounded-lg bg-surface/10 hover:bg-surface/20 text-surface text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Baixar arquivo"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Baixar</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-8 px-3 rounded-lg bg-surface/10 hover:bg-surface/20 text-surface text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Imprimir visualização"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-lg bg-surface/10 hover:bg-surface/20 text-surface flex items-center justify-center transition-colors cursor-pointer"
                  title="Fechar visualizador"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Folha do Documento Simulado */}
            <div className="p-6 sm:p-8 bg-surface-container-low overflow-y-auto max-h-[70vh]">
              <div className="bg-surface-container-lowest p-8 sm:p-10 rounded-xl shadow-md border border-outline-variant/30 max-w-2xl mx-auto space-y-6 text-on-surface">
                {/* Cabeçalho da Folha */}
                <div className="flex items-start justify-between pb-4 border-b border-outline-variant/30">
                  <div>
                    <span className="text-[10px] font-label-uppercase font-bold text-outline tracking-wider uppercase block">
                      RegCobre • Sistema de Recuperação de Ativos
                    </span>
                    <h4 className="font-headline-sm font-bold text-primary text-lg mt-0.5">
                      {previewDoc.tipo.toUpperCase()}
                    </h4>
                    <span className="text-xs text-on-surface-variant font-data-mono">
                      Título Ref: {debt.titleNumber} • Parcela: {debt.installment}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-surface-container font-data-mono text-[11px] font-bold text-primary">
                      {previewDoc.nomeArquivo}
                    </span>
                    <span className="text-[10px] text-on-surface-variant block mt-1 font-data-mono">
                      Data: {previewDoc.data}
                    </span>
                  </div>
                </div>

                {/* Dados da Cobrança no Documento */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-surface-container-low rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] text-outline font-label-uppercase font-bold block">
                      DEVEDOR
                    </span>
                    <strong className="text-on-surface block mt-0.5">{debt.debtorName}</strong>
                    <span className="font-data-mono text-[11px] text-on-surface-variant">
                      {debt.debtorType === 'PJ' ? 'CNPJ' : 'CPF'}: {debt.debtorCnpjCpf}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline font-label-uppercase font-bold block">
                      EMPRESA CREDORA
                    </span>
                    <strong className="text-primary block mt-0.5">
                      {debtEmpresa ? debtEmpresa.razaoSocial || debtEmpresa.nomeFantasia : 'RegCobre Matriz'}
                    </strong>
                    <span className="font-data-mono text-[11px] text-on-surface-variant">
                      CNPJ: {debtEmpresa?.cnpj || '18.234.567/0001-89'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline font-label-uppercase font-bold block">
                      VALOR ATUALIZADO
                    </span>
                    <strong className="text-secondary font-bold text-sm font-data-mono block mt-0.5">
                      R$ {debt.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline font-label-uppercase font-bold block">
                      OPERADOR RESPONSÁVEL
                    </span>
                    <span className="text-on-surface block mt-0.5">{previewDoc.usuario}</span>
                  </div>
                </div>

                {/* Conteúdo específico baseado no documento */}
                {previewDoc.nomeArquivo === 'Boleto.pdf' && (
                  <div className="space-y-4 pt-2">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded font-data-mono text-xs text-slate-800 break-all select-all text-center">
                      34191.79001 01043.510047 91020.150008 4 99120000{Math.round(debt.currentValue)}
                    </div>
                    <div className="h-14 bg-slate-100 border border-slate-200 rounded flex items-center justify-center p-2">
                      <div className="flex items-center gap-[2px] h-full w-full justify-center opacity-80">
                        {Array.from({ length: 55 }).map((_, i) => (
                          <div
                            key={i}
                            className="bg-black h-full"
                            style={{ width: i % 3 === 0 ? '3px' : i % 2 === 0 ? '1px' : '2px' }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {previewDoc.nomeArquivo === 'Comprovante_Pagamento.pdf' && (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>COMPROVANTE DE TRANSAÇÃO AUTENTICADA</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      Operação liquidada junto ao Sistema Financeiro Nacional via chave PIX / TED.
                    </p>
                    <div className="pt-2 border-t border-emerald-200 text-[11px] font-data-mono text-emerald-900 flex justify-between">
                      <span>Autenticação: E849.2B10.984C.332A</span>
                      <span>Canal: Internet Banking</span>
                    </div>
                  </div>
                )}

                {previewDoc.nomeArquivo === 'Ficha_Protesto.pdf' && (
                  <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <span className="material-symbols-outlined text-[18px]">gavel</span>
                      <span>CERTIDÃO DE APONTAMENTO / PROTESTO EXTRAJUDICIAL</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      Instrumento lavrado no Cartório de Notas e Registro de Títulos e Documentos com base na duplicata mercantil inadimplida.
                    </p>
                    <div className="pt-2 border-t border-amber-200 text-[11px] font-data-mono text-amber-900 flex justify-between">
                      <span>Livro 14-B • Folha 102</span>
                      <span>Status: Notificação Efetivada</span>
                    </div>
                  </div>
                )}

                {previewDoc.nomeArquivo === 'Carta_Anuencia.pdf' && (
                  <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-purple-900 font-bold">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                      <span>TERMO DE ANUÊNCIA E QUITAÇÃO INTEGRAL</span>
                    </div>
                    <p className="text-on-surface-variant leading-relaxed">
                      Declaramos para os devidos fins que o débito objeto do título supra foi regularizado, conferindo plena, geral e irrevogável quitação para cancelamento de apontamentos cadastrais.
                    </p>
                    <div className="pt-2 border-t border-purple-200 text-[11px] font-data-mono text-purple-900 flex justify-between">
                      <span>Representante Legal: RegCobre Ativos</span>
                      <span>Hash de Validação: OK</span>
                    </div>
                  </div>
                )}

                {/* Rodapé da Folha */}
                <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between text-[10px] text-outline font-data-mono">
                  <span>Documento emitido para fins de conferência operacional</span>
                  <span>Ambiente RegCobre v3.8.4</span>
                </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-semibold text-xs transition-colors cursor-pointer"
              >
                Fechar Visualizador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONSOLIDAR COBRANÇAS EM ABERTO                                     */}
      {/* ========================================================================= */}
      {isConsolidateModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-space-md sm:p-space-xl overflow-y-auto animate-fade-in">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col border border-outline-variant/30">
            {/* Header do Modal */}
            <div className="h-16 px-space-lg bg-primary text-surface flex items-center justify-between shrink-0">
              <div className="flex items-center gap-space-sm min-w-0">
                <span className="material-symbols-outlined text-secondary-fixed text-[24px]">
                  merge_type
                </span>
                <div className="min-w-0">
                  <h3 className="font-title-md text-title-md font-bold leading-tight truncate">
                    Consolidar Cobranças em Aberto
                  </h3>
                  <span className="font-label-uppercase text-[11px] text-surface/80 tracking-wider truncate block">
                    Devedor: {debtor.name} ({openDebtorDebts.length} cobranças em aberto)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConsolidateModalOpen(false)}
                className="text-surface hover:text-secondary-fixed transition-colors p-1.5 rounded-lg cursor-pointer"
                title="Fechar"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-space-lg flex flex-col gap-space-md max-h-[75vh] overflow-y-auto">
              {/* Informativo */}
              <div className="p-3 bg-surface-container-low border border-outline-variant/20 rounded-lg flex items-start gap-2.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                  info
                </span>
                <div className="leading-relaxed">
                  <p>
                    Selecione as cobranças em aberto que deseja agrupar para uma negociação ou pagamento conjunto.
                  </p>
                  <p className="mt-1 text-[11px] text-outline">
                    <strong>Importante:</strong> Esta ação agrupa os títulos para proposta unificada. As cobranças individuais e todos os seus históricos de acionamentos permanecem integralmente preservados.
                  </p>
                </div>
              </div>

              {/* Barra de Seleção Rápida */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-label-uppercase text-xs font-bold text-outline uppercase tracking-wider">
                  Cobranças Disponíveis ({openDebtorDebts.length})
                </span>
                <button
                  type="button"
                  onClick={handleToggleSelectAllConsolidation}
                  className="text-xs text-primary hover:text-primary/80 font-semibold cursor-pointer underline"
                >
                  {selectedDebtIdsForConsolidation.length === openDebtorDebts.length
                    ? 'Desmarcar Todas'
                    : 'Selecionar Todas'}
                </button>
              </div>

              {/* Lista de Cobranças em Aberto */}
              <div className="flex flex-col gap-2">
                {openDebtorDebts.map((d) => {
                  const isSelected = selectedDebtIdsForConsolidation.includes(d.id);
                  const isCurrent = d.id === debt.id;
                  const dStyle = getDebtStatusRowStyle(d.status);

                  return (
                    <label
                      key={d.id}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500/5 border-amber-500/40 shadow-2xs'
                          : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/20 opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDebtSelectionForConsolidation(d.id)}
                          className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer shrink-0"
                        />

                        <div className="flex flex-col gap-1 min-w-0">
                          {/* Número / Título */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-data-mono font-bold text-xs text-primary">
                              Título {d.titleNumber}
                            </span>
                            {d.installment && (
                              <span className="text-[11px] text-on-surface-variant font-medium">
                                ({d.installment})
                              </span>
                            )}
                            {d.invoiceNumber && (
                              <span className="text-[10px] text-on-surface-variant font-mono">
                                • {d.invoiceNumber}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase">
                                Cobrança Atual
                              </span>
                            )}
                          </div>

                          {/* Vencimento */}
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                              <span>Vencimento: <strong className="text-on-surface">{d.dueDate}</strong></span>
                            </span>
                            {d.daysOverdue > 0 && (
                              <span className="text-error text-[11px] font-medium">
                                • {d.daysOverdue} dias em atraso
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Valor e Status */}
                      <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                        {/* Valor */}
                        <span className="font-data-mono font-bold text-sm text-on-surface">
                          R$ {d.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>

                        {/* Status */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-badge-sm text-[10px] font-semibold ${dStyle.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dStyle.indicatorClass}`} />
                          <span>{d.statusLabel || dStyle.label}</span>
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* RESUMO NO FINAL */}
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                <div>
                  <span className="text-[10px] font-label-uppercase font-bold text-outline block">
                    QUANTIDADE SELECIONADA
                  </span>
                  <span className="text-sm font-bold text-on-surface">
                    {selectedDebtIdsForConsolidation.length} de {openDebtorDebts.length} cobranças selecionadas
                  </span>
                  {selectedDebtIdsForConsolidation.length < 2 && (
                    <span className="text-[11px] text-error block mt-0.5 font-medium">
                      ⚠️ Selecione pelo menos 2 cobranças para criar a consolidação.
                    </span>
                  )}
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] font-label-uppercase font-bold text-outline block">
                    VALOR TOTAL SELECIONADO
                  </span>
                  <span className="font-data-mono text-lg font-bold text-primary">
                    R$ {totalConsolidatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer do Modal com Botões */}
            <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConsolidateModalOpen(false)}
                className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateConsolidation}
                disabled={selectedDebtIdsForConsolidation.length < 2}
                className={`h-10 px-5 rounded-lg font-semibold text-xs transition-all inline-flex items-center gap-2 shadow-sm ${
                  selectedDebtIdsForConsolidation.length >= 2
                    ? 'bg-primary hover:bg-primary/90 text-surface cursor-pointer'
                    : 'bg-surface-container-high text-outline cursor-not-allowed opacity-60'
                }`}
                title={
                  selectedDebtIdsForConsolidation.length < 2
                    ? 'Selecione pelo menos 2 cobranças'
                    : 'Criar consolidação de cobranças'
                }
              >
                <span className="material-symbols-outlined text-[18px]">merge_type</span>
                <span>Criar Consolidação</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
