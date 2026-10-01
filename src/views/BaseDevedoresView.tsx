import React, { useState, useEffect } from 'react';
import { debtService } from '../services/debtService';
import {
  Debtor,
  Debt,
  DebtorPhone,
  DebtorPaymentData,
  DebtorPhoneType,
  PaymentDataType,
  PixKeyType,
} from '../types';

interface BaseDevedoresViewProps {
  onSelectDebt: (debtId: string) => void;
  selectedDebtorIdInitial?: string;
}

export const BaseDevedoresView: React.FC<BaseDevedoresViewProps> = ({
  onSelectDebt,
  selectedDebtorIdInitial,
}) => {
  const debtors = debtService.getAllDebtors();
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>(
    selectedDebtorIdInitial || debtors[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Re-render trigger when debtService emits changes
  const [, setTick] = useState(0);
  useEffect(() => {
    return debtService.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // --- Phone Modal / Form State ---
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneType, setPhoneType] = useState<DebtorPhoneType>('Celular');
  const [phoneDescription, setPhoneDescription] = useState('');
  const [phoneHasWhatsApp, setPhoneHasWhatsApp] = useState(true);
  const [phoneActive, setPhoneActive] = useState(true);

  // --- Payment Data Modal / Form State ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentDataType>('PIX');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CNPJ');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [paymentActive, setPaymentActive] = useState(true);

  const filteredDebtors = debtors.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.cnpjCpf.includes(q) ||
      d.erpCode.toLowerCase().includes(q) ||
      (d.tradeName && d.tradeName.toLowerCase().includes(q))
    );
  });

  const selectedDebtor = debtors.find((d) => d.id === selectedDebtorId) || filteredDebtors[0];
  const relatedDebts = selectedDebtor
    ? debtService.getDebtsByDebtorId(selectedDebtor.id)
    : [];

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`${label} copiado: ${text}`);
  };

  // Open modal to add phone
  const handleOpenAddPhone = () => {
    setEditingPhoneId(null);
    setPhoneNumber('');
    setPhoneType('Celular');
    setPhoneDescription('');
    setPhoneHasWhatsApp(true);
    setPhoneActive(true);
    setIsPhoneModalOpen(true);
  };

  // Open modal to edit phone
  const handleOpenEditPhone = (phone: DebtorPhone) => {
    setEditingPhoneId(phone.id);
    setPhoneNumber(phone.number);
    setPhoneType(phone.type);
    setPhoneDescription(phone.description);
    setPhoneHasWhatsApp(phone.hasWhatsApp);
    setPhoneActive(phone.active);
    setIsPhoneModalOpen(true);
  };

  // Save phone
  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor) return;
    if (!phoneNumber.trim()) {
      showToast('Por favor, informe o número do telefone.');
      return;
    }

    if (editingPhoneId) {
      debtService.updateDebtorPhone(selectedDebtor.id, editingPhoneId, {
        number: phoneNumber.trim(),
        type: phoneType,
        description: phoneDescription.trim(),
        hasWhatsApp: phoneHasWhatsApp,
        active: phoneActive,
      });
      showToast(`Telefone ${phoneNumber} atualizado com sucesso!`);
    } else {
      debtService.addDebtorPhone(selectedDebtor.id, {
        number: phoneNumber.trim(),
        type: phoneType,
        description: phoneDescription.trim() || `${phoneType} de Contato`,
        hasWhatsApp: phoneHasWhatsApp,
        active: phoneActive,
      });
      showToast(`Novo telefone ${phoneNumber} cadastrado com sucesso!`);
    }
    setIsPhoneModalOpen(false);
  };

  // Toggle phone active
  const handleTogglePhoneActive = (phone: DebtorPhone) => {
    if (!selectedDebtor) return;
    debtService.toggleDebtorPhoneStatus(selectedDebtor.id, phone.id);
    showToast(
      phone.active
        ? `Telefone ${phone.number} desativado.`
        : `Telefone ${phone.number} ativado.`
    );
  };

  // Open modal to add payment data
  const handleOpenAddPayment = () => {
    setEditingPaymentId(null);
    setPaymentType('PIX');
    setPaymentDescription('');
    setPixKeyType('CNPJ');
    setPaymentInfo('');
    setPaymentActive(true);
    setIsPaymentModalOpen(true);
  };

  // Open modal to edit payment data
  const handleOpenEditPayment = (payment: DebtorPaymentData) => {
    setEditingPaymentId(payment.id);
    setPaymentType(payment.type);
    setPaymentDescription(payment.description);
    setPixKeyType(payment.pixKeyType || 'CNPJ');
    setPaymentInfo(payment.paymentInfo || payment.pixKey || '');
    setPaymentActive(payment.active);
    setIsPaymentModalOpen(true);
  };

  // Save payment data
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor) return;
    if (!paymentInfo.trim()) {
      showToast('Por favor, informe a chave PIX ou dado de pagamento.');
      return;
    }

    if (editingPaymentId) {
      debtService.updateDebtorPaymentData(selectedDebtor.id, editingPaymentId, {
        type: paymentType,
        description: paymentDescription.trim() || `Chave ${paymentType}`,
        pixKeyType: paymentType === 'PIX' ? pixKeyType : undefined,
        pixKey: paymentType === 'PIX' ? paymentInfo.trim() : undefined,
        paymentInfo: paymentInfo.trim(),
        active: paymentActive,
      });
      showToast(`Dado de pagamento atualizado com sucesso!`);
    } else {
      debtService.addDebtorPaymentData(selectedDebtor.id, {
        type: paymentType,
        description: paymentDescription.trim() || `Chave ${paymentType} ${pixKeyType}`,
        pixKeyType: paymentType === 'PIX' ? pixKeyType : undefined,
        pixKey: paymentType === 'PIX' ? paymentInfo.trim() : undefined,
        paymentInfo: paymentInfo.trim(),
        active: paymentActive,
      });
      showToast(`Novo dado de pagamento cadastrado com sucesso!`);
    }
    setIsPaymentModalOpen(false);
  };

  // Toggle payment data active
  const handleTogglePaymentActive = (payment: DebtorPaymentData) => {
    if (!selectedDebtor) return;
    debtService.toggleDebtorPaymentDataStatus(selectedDebtor.id, payment.id);
    showToast(
      payment.active
        ? `Dado de pagamento desativado.`
        : `Dado de pagamento ativado.`
    );
  };

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-20">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">group</span>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Base Geral de Devedores
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-badge-sm text-badge-sm">
              {debtors.length} Devedores Cadastrados
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Consulte o cadastro 360° dos clientes, múltiplos telefones para contato, dados oficiais de pagamento/PIX e cobranças vinculadas.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
            search
          </span>
          <input
            className="w-full h-9 pl-9 pr-3 bg-surface-container-low rounded-lg font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none border border-outline-variant/30"
            placeholder="Buscar por Razão, CNPJ ou ERP..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid: Left List (35%) / Right 360 Detail (65%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left List of Debtors */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
          <div className="p-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
            <span className="font-label-uppercase text-xs font-bold text-on-surface-variant">
              Carteira de Clientes ({filteredDebtors.length})
            </span>
            <span className="text-[11px] text-outline font-data-mono">Clique para inspecionar</span>
          </div>

          <div className="divide-y divide-surface-container-high max-h-[720px] overflow-y-auto">
            {filteredDebtors.map((d) => {
              const isSelected = selectedDebtor?.id === d.id;
              const debtsCount = debtService.getDebtsByDebtorId(d.id).length;
              const activePhonesCount = d.phones ? d.phones.filter((p) => p.active).length : 0;
              const activePaymentsCount = d.paymentData ? d.paymentData.filter((p) => p.active).length : 0;

              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDebtorId(d.id)}
                  className={`p-3 transition-colors cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-surface-container-high border-l-4 border-primary'
                      : 'hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-title-md font-semibold text-primary truncate max-w-[240px]">
                      {d.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant font-badge-sm text-[10px]">
                      {d.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-data-mono">
                    <span>{d.cnpjCpf}</span>
                    <span>ERP {d.erpCode}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-on-surface-variant">
                        {activePhonesCount} fone(s)
                      </span>
                      <span>•</span>
                      <span className="text-[10px] text-on-surface-variant">
                        {activePaymentsCount} PIX/Dado(s)
                      </span>
                    </div>
                    <span className="font-data-mono font-bold text-primary">
                      R$ {d.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 360 Detail View */}
        {selectedDebtor && (
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            {/* Debtor Profile Header */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col gap-space-sm">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary-container text-surface font-badge-sm text-xs uppercase font-bold">
                      {selectedDebtor.type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                    </span>
                    <span className="font-data-mono text-outline text-xs">
                      ERP TOTVS {selectedDebtor.erpCode}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-badge-sm text-[10px] font-semibold">
                      RFB: {selectedDebtor.status}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-primary font-bold mt-1 text-xl">
                    {selectedDebtor.name}
                  </h2>
                  {selectedDebtor.tradeName && (
                    <span className="text-body-sm text-on-surface-variant">
                      Nome Fantasia: {selectedDebtor.tradeName}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-primary text-surface rounded-lg text-right">
                  <span className="block text-[10px] font-label-uppercase text-on-primary-container">
                    DÍVIDA CONSOLIDADA
                  </span>
                  <span className="font-data-mono text-lg font-bold text-secondary-fixed">
                    R$ {selectedDebtor.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Cadastral Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-outline-variant/20 text-xs">
                <div>
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    CONTATO PRINCIPAL
                  </span>
                  <strong className="text-primary font-semibold text-sm">
                    {selectedDebtor.mainContact.name}
                  </strong>
                  <span className="text-on-surface-variant block">
                    {selectedDebtor.mainContact.role}
                  </span>
                </div>

                <div>
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    CNPJ / CPF
                  </span>
                  <span className="font-data-mono text-on-surface font-bold text-sm block">
                    {selectedDebtor.cnpjCpf}
                  </span>
                  <span className="text-on-surface-variant text-[11px]">
                    Código ERP: {selectedDebtor.erpCode}
                  </span>
                </div>

                <div>
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    E-MAIL FINANCEIRO
                  </span>
                  <span className="text-on-surface font-mono select-all">
                    {selectedDebtor.mainContact.email}
                  </span>
                </div>

                <div>
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    STATUS CADASTRAL
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-semibold text-xs">
                      {selectedDebtor.status}
                    </span>
                    <span className="text-[11px] text-outline font-data-mono">
                      {selectedDebtor.debtsCount} título(s) cadastrado(s)
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <span className="text-outline block font-label-uppercase text-[10px]">
                    ENDEREÇO FISCAL
                  </span>
                  <span className="text-on-surface leading-tight">
                    {selectedDebtor.mainContact.address}
                  </span>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* 2. BASE DE DEVEDORES: TELEFONES DO DEVEDOR                          */}
            {/* =================================================================== */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
              <div className="p-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">call</span>
                  <h3 className="font-title-md font-semibold text-primary">
                    Telefones do Devedor ({selectedDebtor.phones?.length || 0})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddPhone}
                  className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Adicionar Telefone</span>
                </button>
              </div>

              <div className="p-3 flex flex-col gap-2">
                {(!selectedDebtor.phones || selectedDebtor.phones.length === 0) ? (
                  <p className="text-xs text-on-surface-variant italic py-2 text-center">
                    Nenhum telefone cadastrado.
                  </p>
                ) : (
                  selectedDebtor.phones.map((ph) => (
                    <div
                      key={ph.id}
                      className={`p-2.5 rounded-lg flex items-center justify-between gap-3 border transition-colors ${
                        ph.active
                          ? 'bg-surface-container-low border-outline-variant/20 hover:border-secondary/40'
                          : 'bg-surface-container/40 border-dashed border-outline-variant/30 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="font-data-mono font-bold text-sm text-on-surface">
                              {ph.number}
                            </strong>
                            <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-badge-sm text-[10px] font-semibold">
                              {ph.type}
                            </span>
                            {ph.hasWhatsApp && (
                              <span
                                className="inline-flex items-center text-emerald-700 font-bold text-[10px] gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                                title="Possui WhatsApp"
                              >
                                <span className="material-symbols-outlined text-[13px]">chat</span>
                                <span>WhatsApp</span>
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.5 rounded font-badge-sm text-[10px] font-bold ${
                                ph.active
                                  ? 'bg-secondary-container text-on-secondary-container'
                                  : 'bg-surface-container-highest text-outline'
                              }`}
                            >
                              {ph.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>

                          {ph.description && (
                            <span className="text-xs text-on-surface-variant truncate mt-0.5">
                              {ph.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações do Telefone */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyText(ph.number, 'Telefone')}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                          title="Copiar número"
                        >
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditPhone(ph)}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          title="Editar telefone"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePhoneActive(ph)}
                          className={`px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            ph.active
                              ? 'bg-surface-container text-on-surface-variant hover:bg-error-container hover:text-on-error-container'
                              : 'bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary'
                          }`}
                          title={ph.active ? 'Desativar telefone (sem exclusão física)' : 'Reativar telefone'}
                        >
                          {ph.active ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* =================================================================== */}
            {/* 6. BASE DE DEVEDORES: DADOS DE PAGAMENTO (PIX / OUTROS)             */}
            {/* =================================================================== */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
              <div className="p-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    account_balance_wallet
                  </span>
                  <h3 className="font-title-md font-semibold text-primary uppercase text-xs tracking-wider">
                    Dados de Pagamento ({selectedDebtor.paymentData?.length || 0})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddPayment}
                  className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-on-secondary-container text-on-secondary font-title-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Adicionar Dado de Pagamento</span>
                </button>
              </div>

              <div className="p-3 flex flex-col gap-2">
                {(!selectedDebtor.paymentData || selectedDebtor.paymentData.length === 0) ? (
                  <div className="p-4 bg-surface-container-low rounded-lg border border-dashed border-outline-variant/30 text-center">
                    <p className="text-xs text-on-surface-variant italic">
                      Nenhum dado de pagamento cadastrado.
                    </p>
                  </div>
                ) : (
                  selectedDebtor.paymentData.map((p) => (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-lg flex items-center justify-between gap-3 border transition-colors ${
                        p.active
                          ? 'bg-surface-container-low border-outline-variant/20 hover:border-secondary/40'
                          : 'bg-surface-container/40 border-dashed border-outline-variant/30 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-badge-sm text-[10px] font-bold uppercase">
                            {p.type} {p.pixKeyType ? `• ${p.pixKeyType}` : ''}
                          </span>
                          <strong className="text-xs font-semibold text-primary">
                            {p.description}
                          </strong>
                          <span
                            className={`px-1.5 py-0.5 rounded font-badge-sm text-[10px] font-bold ${
                              p.active
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-surface-container-highest text-outline'
                            }`}
                          >
                            {p.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        <div className="pt-1">
                          <span className="font-data-mono text-xs text-on-surface font-bold select-all bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/20 inline-block">
                            {p.paymentInfo || p.pixKey}
                          </span>
                        </div>
                      </div>

                      {/* Ações do Dado de Pagamento */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyText(p.paymentInfo || p.pixKey || '', 'Chave/Dado de Pagamento')}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                          title="Copiar chave/dado de pagamento"
                        >
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditPayment(p)}
                          className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          title="Editar dado de pagamento"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePaymentActive(p)}
                          className={`px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                            p.active
                              ? 'bg-surface-container text-on-surface-variant hover:bg-error-container hover:text-on-error-container'
                              : 'bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary'
                          }`}
                          title={p.active ? 'Desativar dado de pagamento (sem exclusão física)' : 'Reativar dado'}
                        >
                          {p.active ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Debts Table for this Debtor */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
              <div className="p-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    receipt_long
                  </span>
                  <h3 className="font-title-md font-semibold text-primary">
                    Títulos e Cobranças Vinculadas ({relatedDebts.length})
                  </h3>
                </div>
                <span className="text-xs text-on-surface-variant font-data-mono">
                  Clique em "Abrir Ficha" para acessar o histórico da cobrança
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-body-sm text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container text-on-surface font-label-uppercase uppercase tracking-wider">
                      <th className="py-2.5 px-3">Título</th>
                      <th className="py-2.5 px-3">Parcela</th>
                      <th className="py-2.5 px-3">Vencimento</th>
                      <th className="py-2.5 px-3 text-right">Valor Original</th>
                      <th className="py-2.5 px-3 text-right">Valor Atual</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Responsável</th>
                      <th className="py-2.5 px-3 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-high">
                    {relatedDebts.map((d) => (
                      <tr key={d.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-2.5 px-3 font-data-mono font-bold text-primary">
                          {d.titleNumber}
                        </td>
                        <td className="py-2.5 px-3 font-data-mono">{d.installment}</td>
                        <td className="py-2.5 px-3 font-data-mono">
                          {d.dueDate}
                          {d.daysOverdue > 0 && (
                            <span className="text-[10px] text-error block">
                              ({d.daysOverdue}d atraso)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-data-mono">
                          R$ {d.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-data-mono font-bold text-primary">
                          R$ {d.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-badge-sm text-[10px] font-semibold ${
                              d.status === 'pago'
                                ? 'bg-secondary text-on-secondary'
                                : d.status === 'promessa_firme'
                                ? 'bg-secondary-container text-on-secondary-container'
                                : d.status === 'quebrou_acordo'
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {d.statusLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-on-surface-variant">{d.assignedTo.name}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onSelectDebt(d.id)}
                            className="px-2.5 py-1 rounded bg-primary text-surface hover:bg-primary-container font-label-uppercase text-[10px] font-semibold transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              folder_open
                            </span>
                            <span>Abrir Ficha</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL: ADICIONAR / EDITAR TELEFONE                                  */}
      {/* =================================================================== */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-md w-full border border-outline-variant/30 overflow-hidden animate-fade-in">
            <div className="p-4 bg-primary text-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
                  call
                </span>
                <h3 className="font-title-md font-bold text-sm">
                  {editingPhoneId ? 'Editar Telefone do Devedor' : 'Novo Telefone do Devedor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(false)}
                className="text-surface hover:text-secondary-fixed cursor-pointer"
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
                    STATUS
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
                  DESCRIÇÃO / APELIDO
                </label>
                <input
                  type="text"
                  placeholder="Ex: Diretoria Financeira, Recepção Matriz, Contas a Pagar"
                  className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary"
                  value={phoneDescription}
                  onChange={(e) => setPhoneDescription(e.target.value)}
                />
              </div>

              <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/30 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-on-surface block text-xs">
                    Possui WhatsApp para cobrança?
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Habilita o indicador de mensageria na Ficha
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

      {/* =================================================================== */}
      {/* MODAL: ADICIONAR / EDITAR DADO DE PAGAMENTO                         */}
      {/* =================================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-md w-full border border-outline-variant/30 overflow-hidden animate-fade-in">
            <div className="p-4 bg-secondary text-on-secondary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">
                  account_balance_wallet
                </span>
                <h3 className="font-title-md font-bold text-sm">
                  {editingPaymentId ? 'Editar Dado de Pagamento' : 'Novo Dado de Pagamento / PIX'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-on-secondary hover:opacity-80 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    FORMA DE PAGAMENTO *
                  </label>
                  <select
                    className="w-full h-9 px-2 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentDataType)}
                  >
                    <option value="PIX">PIX</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {paymentType === 'PIX' ? (
                  <div>
                    <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                      TIPO DA CHAVE PIX *
                    </label>
                    <select
                      className="w-full h-9 px-2 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                    >
                      <option value="CNPJ">CNPJ</option>
                      <option value="CPF">CPF</option>
                      <option value="E-mail">E-mail</option>
                      <option value="Telefone">Telefone</option>
                      <option value="Aleatória">Aleatória</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                      STATUS
                    </label>
                    <label className="flex items-center gap-2 h-9 px-2 bg-surface-container-low rounded-lg border border-outline-variant/30 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentActive}
                        onChange={(e) => setPaymentActive(e.target.checked)}
                        className="accent-secondary h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-on-surface">
                        {paymentActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                  CHAVE PIX / INFORMAÇÃO DE PAGAMENTO *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    paymentType === 'PIX'
                      ? 'Informe a chave PIX exata (ex: 14.892.301/0001-44 ou financeiro@empresa.com)'
                      : 'Informe os dados de pagamento'
                  }
                  className="w-full h-9 px-3 bg-surface-container-low rounded-lg font-data-mono text-sm text-on-surface border border-outline-variant/30 focus:outline-none focus:border-secondary"
                  value={paymentInfo}
                  onChange={(e) => setPaymentInfo(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                  DESCRIÇÃO / APELIDO *
                </label>
                <input
                  type="text"
                  placeholder="Ex: PIX Financeiro Principal, PIX Acordos Comerciais"
                  className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-secondary"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                />
              </div>

              {paymentType === 'PIX' && (
                <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/30 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-on-surface block text-xs">
                      Status do Registro
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Chaves ativas ficam disponíveis para cópia na Ficha da Cobrança
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentActive}
                      onChange={(e) => setPaymentActive(e.target.checked)}
                      className="accent-secondary h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-on-surface">
                      {paymentActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-lg bg-secondary hover:bg-on-secondary-container text-on-secondary font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  {editingPaymentId ? 'Salvar Alterações' : 'Cadastrar Pagamento'}
                </button>
              </div>
            </form>
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
