import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import {
  Debt,
  DebtorPhone,
  ContactChannel,
  ContactResult,
  ContactRegistrationPayload,
} from '../types';
import { getDebtStatusRowClass, getDebtStatusRowStyle } from '../utils/debtStatusStyles';
import { parseDateString, formatDateISO } from '../utils/dateUtils';
import { FichaCobrancaView } from './FichaCobrancaView';

interface MinhaCarteiraViewProps {
  onSelectDebt: (debtId: string) => void;
  onOpenFastLogModal?: (debt: Debt) => void;
}

const CONTACT_CHANNELS: ContactChannel[] = [
  'Ligação',
  'WhatsApp',
  'Mensagem',
  'Áudio',
  'E-mail',
  'Serasa',
  'Outro',
];

const CONTACT_RESULTS: ContactResult[] = [
  'Prometeu pagar',
  'Vai pagar',
  'Solicitou retorno',
  'Pagou',
  'Ligação realizada',
  'Mensagem enviada',
  'Áudio enviado',
  'Não atende',
  'Não responde',
  'Não possui WhatsApp',
  'Contestação',
  'Enviado para Serasa',
  'Promessa Não Cumprida',
  'Outro',
];

export const MinhaCarteiraView: React.FC<MinhaCarteiraViewProps> = ({
  onSelectDebt,
  onOpenFastLogModal,
}) => {
  const { currentUser } = useAuth();

  // Re-render trigger when debtService emits changes (e.g. registerContact)
  const [, setTick] = useState(0);
  useEffect(() => {
    return debtService.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const allDebts = debtService.getDebtsForUser(currentUser);
  const userEmpresas = debtService.getEmpresasForUser(currentUser);

  // Active Selected Debt for Consultation & Operational Drawer
  const [selectedDebtId, setSelectedDebtId] = useState<string>(allDebts[0]?.id || '10002');
  const [filterQuery, setFilterQuery] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [activeFilterPill, setActiveFilterPill] = useState<
    'all' | 'delayed60' | 'promise' | 'return_today' | 'no_contact' | 'worked_today'
  >('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Fecha modal ou drawer ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFichaModalOpen) {
          setIsFichaModalOpen(false);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFichaModalOpen, isDrawerOpen]);

  const selectedDebt = allDebts.find((d) => d.id === selectedDebtId) || allDebts[0];
  const selectedDebtor = selectedDebt ? debtService.getDebtorById(selectedDebt.debtorId) : undefined;

  // Phone selection state in the operational panel
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);

  // Operational Form Fields for Contact Registration (FAZ)
  const [channel, setChannel] = useState<ContactChannel>('Ligação');
  const [result, setResult] = useState<ContactResult>('Prometeu pagar');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');

  // Helpers para sincronizar datas com a data operacional do sistema (e.g. 04/11/2024)
  const getOperationalDateISO = () => {
    const opDate = debtService.getCurrentDate();
    const parsed = parseDateString(opDate);
    return parsed ? formatDateISO(parsed) : formatDateISO(new Date());
  };

  const getOffsetOperationalDateISO = (daysOffset: number = 3) => {
    const opDate = debtService.getCurrentDate();
    const parsed = parseDateString(opDate) || new Date();
    parsed.setDate(parsed.getDate() + daysOffset);
    return formatDateISO(parsed);
  };

  // Conditional Promise (PTP)
  const [hasPromise, setHasPromise] = useState(false);
  const [promisedDate, setPromisedDate] = useState(() => getOffsetOperationalDateISO(7));
  const [promisedValue, setPromisedValue] = useState('');

  // Conditional Payment
  const [hasPayment, setHasPayment] = useState(false);
  const [paymentDate, setPaymentDate] = useState(() => getOperationalDateISO());
  const [receivedValue, setReceivedValue] = useState('');

  // Conditional Return
  const [hasReturn, setHasReturn] = useState(false);
  const [returnDate, setReturnDate] = useState(() => getOffsetOperationalDateISO(3));
  const [returnTime, setReturnTime] = useState('10:00');
  const [returnReason, setReturnReason] = useState('Cliente solicitou retorno');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Telefones ativos do devedor
  const activeDebtorPhones: DebtorPhone[] = selectedDebtor?.phones?.filter((p) => p.active) || [];

  // Fallback caso não haja phones na coleção oficial mas haja em mainContact
  const fallbackPhones: DebtorPhone[] = [
    ...(selectedDebtor?.mainContact?.phoneMobile
      ? [
          {
            id: 'ph-main-mobile',
            number: selectedDebtor.mainContact.phoneMobile,
            type: 'Celular' as const,
            description: selectedDebtor.mainContact.name
              ? `${selectedDebtor.mainContact.name} (${selectedDebtor.mainContact.role || 'Principal'})`
              : 'Celular Principal',
            hasWhatsApp: !!selectedDebtor.mainContact.hasWhatsApp,
            active: true,
          },
        ]
      : []),
    ...(selectedDebtor?.mainContact?.phoneFixed
      ? [
          {
            id: 'ph-main-fixed',
            number: selectedDebtor.mainContact.phoneFixed,
            type: 'Fixo' as const,
            description: 'Telefone Fixo / PABX',
            hasWhatsApp: false,
            active: true,
          },
        ]
      : []),
  ];

  const availablePhones = activeDebtorPhones.length > 0 ? activeDebtorPhones : fallbackPhones;
  const selectedPhone = availablePhones.find((p) => p.id === selectedPhoneId) || null;

  // Sincroniza formulário e seleção de contato quando a cobrança selecionada mudar
  useEffect(() => {
    if (selectedDebt) {
      const debtor = debtService.getDebtorById(selectedDebt.debtorId);
      const phones =
        debtor?.phones?.filter((p) => p.active).length
          ? debtor.phones.filter((p) => p.active)
          : debtor?.mainContact?.phoneMobile || debtor?.mainContact?.phoneFixed
          ? [
              ...(debtor.mainContact.phoneMobile
                ? [
                    {
                      id: 'ph-main-mobile',
                      number: debtor.mainContact.phoneMobile,
                      type: 'Celular' as const,
                      description: debtor.mainContact.name || 'Contato Principal',
                      hasWhatsApp: !!debtor.mainContact.hasWhatsApp,
                      active: true,
                    },
                  ]
                : []),
              ...(debtor.mainContact.phoneFixed
                ? [
                    {
                      id: 'ph-main-fixed',
                      number: debtor.mainContact.phoneFixed,
                      type: 'Fixo' as const,
                      description: 'Fixo Matriz',
                      hasWhatsApp: false,
                      active: true,
                    },
                  ]
                : []),
            ]
          : [];

      // REGRA: "Não selecionar automaticamente um número quando houver vários disponíveis"
      if (phones.length === 1) {
        setSelectedPhoneId(phones[0].id);
      } else {
        setSelectedPhoneId(null);
      }

      setContactPerson(debtor?.mainContact?.name || '');
      const formattedVal = selectedDebt.currentValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setPromisedValue(formattedVal);
      setReceivedValue(formattedVal);
      setNotes('');
      setChannel('Ligação');
      setResult('Ligação realizada');
      setHasPromise(false);
      setHasPayment(false);
      setHasReturn(false);
      setPaymentDate(getOperationalDateISO());
      setPromisedDate(getOffsetOperationalDateISO(7));
      setReturnDate(getOffsetOperationalDateISO(3));
      setReturnTime('10:00');
      setReturnReason('Cliente solicitou retorno');
    }
  }, [selectedDebtId]);

  // Ações de contato para um telefone específico
  const handleSelectPhone = (phone: DebtorPhone) => {
    setSelectedPhoneId(phone.id);
    if (phone.description) {
      setContactPerson(phone.description);
    }
  };

  const handleCallPhone = (phone: DebtorPhone) => {
    setSelectedPhoneId(phone.id);
    setChannel('Ligação');
    setResult('Ligação realizada');
    if (phone.description) {
      setContactPerson(phone.description);
    }
    const cleanNum = phone.number.replace(/[^\d+]/g, '');
    window.open(`tel:${cleanNum}`, '_self');
    showToast(`Iniciando chamada para ${phone.number}...`);
  };

  const handleWhatsAppPhone = (phone: DebtorPhone) => {
    if (!phone.hasWhatsApp) {
      showToast(`O telefone ${phone.number} não possui WhatsApp cadastrado.`);
      return;
    }
    setSelectedPhoneId(phone.id);
    setChannel('WhatsApp');
    setResult('Mensagem enviada');
    if (phone.description) {
      setContactPerson(phone.description);
    }
    const digits = phone.number.replace(/\D/g, '');
    const cleanDigits = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
    window.open(`https://wa.me/${cleanDigits}`, '_blank', 'noopener,noreferrer');
    showToast(`Abrindo conversa de WhatsApp com ${phone.number}...`);
  };

  const handleCopyPhone = (phone: DebtorPhone) => {
    navigator.clipboard?.writeText(phone.number);
    showToast(`Telefone copiado para a área de transferência: ${phone.number}`);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard?.writeText(email);
    showToast(`E-mail copiado para a área de transferência: ${email}`);
  };

  // Reatividade aos desfechos do contato
  const handleResultChange = (newResult: ContactResult) => {
    setResult(newResult);
    if (newResult === 'Prometeu pagar' || newResult === 'Vai pagar') {
      setHasPromise(true);
      setHasPayment(false);
      setHasReturn(false);
    } else if (newResult === 'Pagou') {
      setHasPayment(true);
      setHasPromise(false);
      setHasReturn(false);
    } else if (newResult === 'Solicitou retorno') {
      setHasReturn(true);
      setHasPromise(false);
      setHasPayment(false);
    } else {
      setHasPromise(false);
      setHasPayment(false);
      setHasReturn(false);
    }
  };

  // Salvar registro de contato no histórico permanente e agenda
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !currentUser) return;

    const numPromisedValue =
      parseFloat(String(promisedValue).replace(/\./g, '').replace(',', '.')) || selectedDebt.currentValue;
    const numReceivedValue =
      parseFloat(String(receivedValue).replace(/\./g, '').replace(',', '.')) || selectedDebt.currentValue;

    if ((result === 'Prometeu pagar' || result === 'Vai pagar' || hasPromise) && !promisedDate) {
      showToast('Por favor, informe a data prevista para a promessa de pagamento.');
      return;
    }

    if ((result === 'Solicitou retorno' || hasReturn) && (!returnDate || !returnTime)) {
      showToast('Por favor, informe a data e horário agendados para o retorno.');
      return;
    }

    if ((result === 'Pagou' || hasPayment) && !paymentDate) {
      showToast('Por favor, informe a data do pagamento.');
      return;
    }

    const payload: ContactRegistrationPayload = {
      channel,
      result,
      contactPerson:
        contactPerson.trim() ||
        selectedPhone?.description ||
        selectedDebtor?.mainContact.name ||
        'Contato da empresa',
      notes: notes.trim() || `Tentativa realizada via ${channel} - Desfecho: ${result}.`,
      hasPromise: result === 'Prometeu pagar' || result === 'Vai pagar' || hasPromise,
      promisedDate:
        result === 'Prometeu pagar' || result === 'Vai pagar' || hasPromise ? promisedDate : undefined,
      promisedValue:
        result === 'Prometeu pagar' || result === 'Vai pagar' || hasPromise ? numPromisedValue : undefined,
      hasPayment: result === 'Pagou' || hasPayment,
      paymentDate: result === 'Pagou' || hasPayment ? paymentDate : undefined,
      receivedValue: result === 'Pagou' || hasPayment ? numReceivedValue : undefined,
      hasReturn: result === 'Solicitou retorno' || hasReturn,
      returnDate: result === 'Solicitou retorno' || hasReturn ? returnDate : undefined,
      returnTime: result === 'Solicitou retorno' || hasReturn ? returnTime : undefined,
      returnReason: result === 'Solicitou retorno' || hasReturn ? returnReason : undefined,
    };

    const res = debtService.registerContact(selectedDebt.id, payload, currentUser);
    if (res.success) {
      showToast(`Tentativa via ${channel} registrada com sucesso no histórico permanente!`);
      setNotes('');
      setHasPromise(false);
      setHasPayment(false);
      setHasReturn(false);
      setResult('Ligação realizada');
    } else {
      showToast('Não foi possível registrar o contato.');
    }
  };

  // Filter debts based on pill & query & empresa
  const filteredDebts = allDebts.filter((d) => {
    if (empresaFilter !== 'all' && d.empresaId !== empresaFilter) {
      return false;
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      const match =
        d.debtorName.toLowerCase().includes(q) ||
        d.debtorCnpjCpf.includes(q) ||
        d.titleNumber.toLowerCase().includes(q) ||
        d.erpCode.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (activeFilterPill === 'delayed60') {
      return d.daysOverdue >= 45;
    }
    if (activeFilterPill === 'promise') {
      return d.status === 'promessa_firme' || !!d.activePromise;
    }
    if (activeFilterPill === 'return_today') {
      return d.status === 'retorno_agendado' || !!d.nextReturn;
    }
    if (activeFilterPill === 'no_contact') {
      return d.status === 'sem_contato' || d.daysOverdue > 30;
    }
    if (activeFilterPill === 'worked_today') {
      return d.history.some(
        (h) =>
          h.dateFormatted.includes('04/11') ||
          h.dateFormatted.includes(debtService.getCurrentDate())
      );
    }

    return true;
  });

  const handleSelectDebt = (d: Debt) => {
    setSelectedDebtId(d.id);
  };

  const handleOpenDrawerForDebt = (d: Debt) => {
    setSelectedDebtId(d.id);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex flex-col w-full max-w-full min-w-0 pb-16 overflow-x-hidden">
      {/* Top Command & Filter Deck */}
      <div className="px-space-lg py-space-md bg-surface-container-lowest shadow-sm flex flex-col gap-space-md border-b border-outline-variant/30">
        {/* Header Level 1 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-surface flex items-center justify-center shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[22px]">folder_special</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm">
                <h1 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                  Minha Carteira de Cobranças
                </h1>
                <span className="px-space-xs py-space-2xs rounded-full bg-secondary-container text-on-secondary-container font-label-uppercase text-label-uppercase">
                  Ferramenta de Consulta &amp; Ação
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {allDebts.length} títulos ativos sob sua gestão • Consulta detalhada, início de contatos e registro operacional
              </p>
            </div>
          </div>

          {/* High-Frequency Utilities */}
          <div className="flex items-center flex-wrap gap-space-xs">
            <button
              onClick={() => showToast('Sincronização com ERP TOTVS concluída. Todos os saldos atualizados.')}
              className="h-8 px-space-sm rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface transition-colors flex items-center gap-space-xs font-label-uppercase text-label-uppercase shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>Atualizar ERP</span>
            </button>

            <button
              onClick={() => showToast('Exportando carteira em formato CSV corporativo...')}
              className="h-8 px-space-sm rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface transition-colors flex items-center gap-space-xs font-label-uppercase text-label-uppercase shadow-sm cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Exportar CSV</span>
            </button>

            <div className="h-6 w-px bg-surface-container-high mx-space-2xs hidden sm:block"></div>

            <div className="flex items-center bg-primary text-surface px-space-sm py-1 rounded-lg gap-space-xs font-data-mono text-data-mono">
              <span className="text-on-primary-container font-body-sm">Recuperado:</span>
              <span className="font-semibold text-secondary-fixed">R$ 142.850,00</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Pills Bar */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-sm pt-space-xs">
          {/* Universal Quick Finder */}
          <div className="relative w-full xl:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-[18px]">
              manage_search
            </span>
            <input
              className="w-full h-8 pl-9 pr-space-md bg-surface-container-low focus:bg-surface-container-lowest text-on-surface rounded-lg font-body-sm text-body-sm placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary-container shadow-inner border border-outline-variant/30"
              placeholder="Buscar por Razão Social, CNPJ/CPF, Título ERP..."
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>

          {/* Filtro por Empresa (quando operador tem acesso a mais de 1) */}
          {userEmpresas.length > 1 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="material-symbols-outlined text-[16px] text-primary">domain</span>
              <select
                className="h-8 px-2 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none cursor-pointer"
                value={empresaFilter}
                onChange={(e) => setEmpresaFilter(e.target.value)}
                title="Filtrar cobranças por empresa autorizada"
              >
                <option value="all">Todas as Empresas ({userEmpresas.length})</option>
                {userEmpresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nomeFantasia} ({emp.modoCarteira})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Triage Filter Pills */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveFilterPill('all')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
                activeFilterPill === 'all'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span>Todos os Títulos</span>
              <span className="px-1 rounded bg-surface/20 text-surface font-data-mono text-[10px]">
                {allDebts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilterPill('delayed60')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
                activeFilterPill === 'delayed60'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              <span>Atraso &gt; 45 Dias</span>
            </button>

            <button
              onClick={() => setActiveFilterPill('promise')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
                activeFilterPill === 'promise'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>Promessas (PTP)</span>
            </button>

            <button
              onClick={() => setActiveFilterPill('return_today')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
                activeFilterPill === 'return_today'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              <span>Retornos Agendados</span>
            </button>

            <button
              onClick={() => setActiveFilterPill('worked_today')}
              className={`h-7 px-2.5 rounded-full font-label-uppercase text-label-uppercase whitespace-nowrap flex items-center gap-1 shadow-sm cursor-pointer transition-colors ${
                activeFilterPill === 'worked_today'
                  ? 'bg-primary-container text-surface'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[13px] text-secondary">check</span>
              <span>Trabalhadas Hoje</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Work Area: Full Width Table */}
      <div className="flex-1 flex flex-col p-space-md w-full min-w-0 max-w-full">
        {/* Collections Table Container */}
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/30 min-w-0">
          {/* Table Functional Bar */}
          <div className="px-space-md py-space-xs bg-surface-container-low flex flex-wrap items-center justify-between gap-2 text-on-surface-variant border-b border-outline-variant/20">
            <span className="font-label-uppercase text-label-uppercase uppercase text-xs">
              Visualizando {filteredDebts.length} de {allDebts.length} registros
            </span>

            <div className="flex items-center gap-space-md font-body-sm text-body-sm">
              <span className="text-on-surface">
                Total em Carteira:{' '}
                <strong className="font-data-mono font-semibold text-primary">
                  R$ 584.220,18
                </strong>
              </span>

              <button
                onClick={() => setIsDrawerOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-container text-surface font-label-uppercase text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Abrir painel operacional e de consulta"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">call</span>
                <span>Painel Operacional</span>
              </button>
            </div>
          </div>

          {/* Primary Data Grid: Strict table-fixed to eliminate page horizontal scroll */}
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface font-label-uppercase text-label-uppercase tracking-wider select-none sticky top-0 text-[11px]">
                  <th className="py-2.5 px-3 w-[22%]">Devedor &amp; CNPJ</th>
                  <th className="py-2.5 px-3 w-[10%]">Título / Parc</th>
                  <th className="py-2.5 px-3 w-[10%]">Vencimento</th>
                  <th className="py-2.5 px-3 text-right w-[11%]">Valor Atual</th>
                  <th className="py-2.5 px-3 w-[12%]">Situação</th>
                  <th className="py-2.5 px-3 w-[14%]">Último Contato</th>
                  <th className="py-2.5 px-3 w-[10%]">Responsável</th>
                  <th className="py-2.5 px-3 text-center w-[11%]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high font-body-sm text-body-sm">
                {filteredDebts.map((d) => {
                  const isSelected = selectedDebtId === d.id;
                  const statusStyle = getDebtStatusRowStyle(d.status);

                  return (
                    <tr
                      key={d.id}
                      onClick={() => handleSelectDebt(d)}
                      className={`transition-colors cursor-pointer group ${getDebtStatusRowClass(
                        d.status,
                        isSelected
                      )}`}
                    >
                      <td className="py-2 px-3">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle.indicatorClass}`}
                              title={`Status: ${statusStyle.label}`}
                            />
                            <span
                              className="font-title-md text-title-md font-semibold text-on-surface truncate group-hover:text-primary"
                              title={d.debtorName}
                            >
                              {d.debtorName}
                            </span>
                            <span className="px-1 py-0.2 rounded bg-surface-container-highest text-on-surface font-badge-sm text-badge-sm shrink-0">
                              {d.debtorType}
                            </span>
                          </div>
                          <span className="font-data-mono text-[11px] text-on-surface-variant truncate block">
                            CNPJ: {d.debtorCnpjCpf} • ERP {d.erpCode}
                          </span>
                          {(() => {
                            const emp = debtService.getEmpresaById(d.empresaId);
                            return emp ? (
                              <span className="text-[10px] text-primary/80 font-medium flex items-center gap-1 mt-0.5 truncate">
                                <span className="material-symbols-outlined text-[12px] text-primary shrink-0">
                                  domain
                                </span>
                                <span className="truncate">{emp.nomeFantasia}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-surface-container text-on-surface-variant font-bold uppercase shrink-0">
                                  {emp.modoCarteira}
                                </span>
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex flex-col min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDebt(d.id);
                            }}
                            className="font-data-mono font-semibold text-primary hover:underline text-left cursor-pointer truncate block"
                            title="Abrir Ficha da Cobrança"
                          >
                            {d.titleNumber}
                          </button>
                          <span className="text-[11px] text-on-surface-variant font-data-mono truncate block">
                            Parc. {d.installment}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex flex-col min-w-0">
                          <span className="font-data-mono text-on-surface truncate block">{d.dueDate}</span>
                          <span
                            className={`font-label-uppercase text-[10px] font-semibold flex items-center gap-0.5 truncate ${
                              d.daysOverdue > 0 ? 'text-error' : 'text-secondary'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                d.daysOverdue > 0 ? 'bg-error' : 'bg-secondary'
                              }`}
                            ></span>
                            <span className="truncate">
                              {d.daysOverdue > 0 ? `${d.daysOverdue} dias atraso` : 'A vencer'}
                            </span>
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-right">
                        <div className="flex flex-col items-end min-w-0">
                          <span className="font-data-mono font-semibold text-primary truncate block">
                            R$ {d.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="font-data-mono text-[10px] text-on-surface-variant truncate block">
                            Orig: R$ {d.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <div className="min-w-0">
                          <span
                            className="px-2 py-0.5 rounded-full bg-surface-container font-label-uppercase text-[10px] text-on-surface font-semibold truncate block text-center"
                            title={d.statusLabel}
                          >
                            {d.statusLabel}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex flex-col text-xs min-w-0">
                          <span
                            className="font-medium text-on-surface truncate block"
                            title={d.lastContact?.result || 'Sem contato'}
                          >
                            {d.lastContact?.result || 'Sem contato'}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-data-mono truncate block">
                            {d.lastContact?.date || '-'} ({d.lastContact?.channel || '-'})
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3">
                        <div className="min-w-0">
                          <span className="text-on-surface-variant text-xs truncate block" title={d.assignedTo.name}>
                            {d.assignedTo.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1 shrink-0">
                          {/* Botão de ação explícito: Abrir painel operacional */}
                          <button
                            onClick={() => handleOpenDrawerForDebt(d)}
                            className="w-7 h-7 rounded bg-surface-container hover:bg-primary hover:text-surface text-on-surface flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                            title="Abrir painel de contato e detalhes"
                            aria-label="Abrir painel de detalhes"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[15px]">call</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedDebtId(d.id);
                              setIsFichaModalOpen(true);
                            }}
                            className="px-2 h-7 rounded bg-primary hover:bg-primary-container text-surface font-label-uppercase text-[10px] font-semibold flex items-center gap-0.5 shadow-2xs transition-colors cursor-pointer"
                            title="Abrir Ficha completa da cobrança em modal"
                            aria-label="Abrir Ficha completa da cobrança"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[13px]">folder_open</span>
                            <span>Ficha</span>
                          </button>

                          {onOpenFastLogModal && (
                            <button
                              onClick={() => onOpenFastLogModal(d)}
                              className="w-7 h-7 rounded bg-surface-container hover:bg-surface-variant text-on-surface flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                              title="Registrar Contato Rápido"
                              aria-label="Registrar Contato Rápido"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit_note</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Painel Lateral Operacional (Overlay Drawer - sobreposto ao conteúdo sem diminuir a tabela) */}
      {isDrawerOpen && selectedDebt && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-12">
            <div className="w-screen max-w-lg xl:max-w-xl bg-surface-container-lowest shadow-2xl flex flex-col border-l border-outline-variant/30 h-full overflow-hidden animate-in slide-in-from-right duration-200">
              {/* Header: Contexto Operacional da Cobrança */}
              <div className="p-space-md bg-primary text-surface flex flex-col gap-space-xs shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary-fixed text-[18px]">
                      support_agent
                    </span>
                    <span className="text-secondary-fixed font-data-mono text-[11px] font-semibold uppercase tracking-wider">
                      Painel Operacional de Contato • Título {selectedDebt.titleNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsFichaModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-surface/15 hover:bg-surface/25 text-secondary-fixed text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-secondary-fixed/30"
                      title="Abrir Ficha Completa da cobrança em modal amplo"
                      aria-label="Abrir Ficha completa"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[15px]">open_in_full</span>
                      <span>Ficha completa</span>
                    </button>
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/20 text-surface transition-colors cursor-pointer"
                      title="Fechar painel"
                      aria-label="Fechar painel"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h2
                    id="drawer-title"
                    className="font-headline-sm font-semibold tracking-tight text-surface truncate"
                    title={selectedDebt.debtorName}
                  >
                    {selectedDebt.debtorName}
                  </h2>
                  <div className="flex items-center justify-between text-on-primary-container text-xs font-data-mono mt-0.5">
                    <span>CNPJ: {selectedDebt.debtorCnpjCpf}</span>
                    <span className="text-secondary-fixed">
                      ERP {selectedDebt.erpCode} • Parc. {selectedDebt.installment}
                    </span>
                  </div>
                </div>

                {/* Grid Financeiro Rápido */}
                <div className="grid grid-cols-3 gap-2 mt-2 bg-primary-container/80 p-2.5 rounded-lg text-center border border-surface/10">
                  <div>
                    <span className="block text-[10px] font-label-uppercase text-on-primary-container">
                      VALOR ORIGINAL
                    </span>
                    <span className="font-data-mono font-semibold text-xs text-surface">
                      R$ {selectedDebt.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-label-uppercase text-on-primary-container">
                      VENCIMENTO
                    </span>
                    <span className="font-data-mono font-semibold text-xs text-secondary-fixed">
                      {selectedDebt.dueDate} ({selectedDebt.daysOverdue}d)
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-label-uppercase text-on-primary-container">
                      VALOR ATUALIZADO
                    </span>
                    <span className="font-data-mono font-bold text-xs text-surface">
                      R$ {selectedDebt.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Responsável Atual & Situação */}
                <div className="flex items-center justify-between bg-primary-container/40 px-2.5 py-1.5 rounded text-xs text-on-primary-container mt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-secondary-fixed">
                      person
                    </span>
                    <span>
                      Responsável: <strong>{selectedDebt.assignedTo.name}</strong>
                    </span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface/20 text-surface text-[10px] font-semibold">
                    {selectedDebt.statusLabel}
                  </span>
                </div>
              </div>

              {/* Body do Painel: Contatos, Ações, Formulário Operacional e Histórico */}
              <div className="p-space-md flex flex-col gap-space-md overflow-y-auto flex-1">
                {/* 1. SELEÇÃO DO CONTATO (Telefones Ativos & E-mails) */}
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                    <span className="font-label-uppercase text-outline font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">contacts</span>
                      <span>Contatos Cadastrados do Devedor</span>
                    </span>
                    {selectedDebtor?.mainContact?.name && (
                      <span className="text-[11px] text-primary font-semibold truncate max-w-[200px]" title={selectedDebtor.mainContact.name}>
                        {selectedDebtor.mainContact.name} ({selectedDebtor.mainContact.role || 'Financeiro'})
                      </span>
                    )}
                  </div>

                  {/* Lista de Telefones Ativos com Seleção Explícita */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
                      <span>Telefones Ativos ({availablePhones.length})</span>
                      {availablePhones.length > 1 && !selectedPhone && (
                        <span className="text-amber-700 font-semibold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Selecione o telefone para a tentativa
                        </span>
                      )}
                    </div>

                    {availablePhones.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {availablePhones.map((ph) => {
                          const isSelected = selectedPhoneId === ph.id;
                          return (
                            <div
                              key={ph.id}
                              onClick={() => handleSelectPhone(ph)}
                              className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 ${
                                isSelected
                                  ? 'bg-primary/5 border-primary ring-1 ring-primary'
                                  : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant/60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {/* Radio indicator */}
                                  <span
                                    className={`material-symbols-outlined text-[18px] ${
                                      isSelected ? 'text-primary' : 'text-on-surface-variant'
                                    }`}
                                  >
                                    {isSelected ? 'radio_button_checked' : 'radio_button_unchecked'}
                                  </span>
                                  <span className="font-data-mono font-bold text-xs text-on-surface">
                                    {ph.number}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px] text-on-surface-variant font-semibold">
                                    {ph.type}
                                  </span>
                                  {ph.hasWhatsApp ? (
                                    <span
                                      className="inline-flex items-center text-emerald-700 font-bold text-[10px] gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                                      title="Possui WhatsApp Ativo"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">chat</span>
                                      <span>WhatsApp</span>
                                    </span>
                                  ) : (
                                    <span
                                      className="text-on-surface-variant/70 text-[10px] italic"
                                      title="Sem WhatsApp registrado"
                                    >
                                      Sem WhatsApp
                                    </span>
                                  )}
                                </div>

                                {isSelected && (
                                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    Selecionado
                                  </span>
                                )}
                              </div>

                              {ph.description && (
                                <div className="text-[11px] text-on-surface-variant pl-6 flex items-center justify-between">
                                  <span>{ph.description}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-on-surface-variant italic py-1">
                        Nenhum telefone ativo cadastrado para este devedor.
                      </div>
                    )}
                  </div>

                  {/* E-mails Cadastrados com Botão de Copiar */}
                  {selectedDebtor?.mainContact?.email && (
                    <div className="pt-1.5 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-on-surface-variant min-w-0">
                        <span className="material-symbols-outlined text-[16px] text-primary shrink-0">mail</span>
                        <span className="font-data-mono text-[11px] truncate" title={selectedDebtor.mainContact.email}>
                          {selectedDebtor.mainContact.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(selectedDebtor.mainContact.email)}
                        className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-variant text-on-surface text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        title="Copiar endereço de e-mail"
                      >
                        <span className="material-symbols-outlined text-[13px]">content_copy</span>
                        <span>Copiar E-mail</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. BARRA DE AÇÕES DO CONTATO (Ligar, WhatsApp, Copiar) */}
                <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-label-uppercase text-outline font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">touch_app</span>
                      <span>Ações Imediatas de Contato</span>
                    </span>
                    {selectedPhone && (
                      <span className="text-[11px] font-data-mono font-semibold text-primary truncate max-w-[200px]">
                        {selectedPhone.number}
                      </span>
                    )}
                  </div>

                  {selectedPhone ? (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {/* Botão Ligar */}
                      <button
                        type="button"
                        onClick={() => handleCallPhone(selectedPhone)}
                        className="h-9 px-2 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                        title={`Efetuar ligação para ${selectedPhone.number}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">call</span>
                        <span>Ligar</span>
                      </button>

                      {/* Botão WhatsApp */}
                      <button
                        type="button"
                        disabled={!selectedPhone.hasWhatsApp}
                        onClick={() => handleWhatsAppPhone(selectedPhone)}
                        className={`h-9 px-2 rounded-lg font-title-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer ${
                          selectedPhone.hasWhatsApp
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-surface-container text-on-surface-variant opacity-60 cursor-not-allowed'
                        }`}
                        title={
                          selectedPhone.hasWhatsApp
                            ? `Iniciar conversa no WhatsApp com ${selectedPhone.number}`
                            : 'Este número não possui WhatsApp'
                        }
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        <span>WhatsApp</span>
                      </button>

                      {/* Botão Copiar */}
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(selectedPhone)}
                        className="h-9 px-2 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-title-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-outline-variant/30"
                        title="Copiar número do telefone selecionado"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        <span>Copiar</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 text-xs text-amber-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0">
                        info
                      </span>
                      <span>
                        Selecione um dos telefones acima para liberar as ações de <strong>Ligar</strong>,{' '}
                        <strong>WhatsApp</strong> e <strong>Copiar</strong>.
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. FORMULÁRIO DE REGISTRO OPERACIONAL DA TENTATIVA (FAZ NO PAINEL) */}
                <form
                  onSubmit={handleSaveContact}
                  className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
                      <span className="font-label-uppercase text-outline font-bold text-[11px] uppercase tracking-wide">
                        Registrar Tentativa de Contato
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant">Histórico perpétuo</span>
                  </div>

                  {/* Canal e Contato Abordado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-label-uppercase text-on-surface-variant font-semibold mb-1">
                        CANAL UTILIZADO
                      </label>
                      <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value as ContactChannel)}
                        className="w-full h-8 px-2 bg-surface-container-lowest rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        {CONTACT_CHANNELS.map((ch) => (
                          <option key={ch} value={ch}>
                            {ch}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-label-uppercase text-on-surface-variant font-semibold mb-1">
                        PESSOA CONTATADA / RAMAL
                      </label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Ex: Dr. Marcos (Diretoria)"
                        className="w-full h-8 px-2.5 bg-surface-container-lowest rounded-lg text-xs text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/60"
                      />
                    </div>
                  </div>

                  {/* Resultado do Contato */}
                  <div>
                    <label className="block text-[10px] font-label-uppercase text-on-surface-variant font-semibold mb-1">
                      DESFECHO / RESULTADO DO CONTATO
                    </label>
                    <select
                      value={result}
                      onChange={(e) => handleResultChange(e.target.value as ContactResult)}
                      className="w-full h-8 px-2 bg-surface-container-lowest rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {CONTACT_RESULTS.map((res) => (
                        <option key={res} value={res}>
                          {res}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Condicional: Promessa de Pagamento (PTP) */}
                  {(result === 'Prometeu pagar' || result === 'Vai pagar' || hasPromise) && (
                    <div className="p-2.5 bg-secondary-container/20 border border-secondary-container rounded-lg flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
                        <span className="material-symbols-outlined text-[16px]">handshake</span>
                        <span>Dados da Promessa de Pagamento (PTP)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-label-uppercase text-on-surface-variant font-medium mb-1">
                            DATA PROMETIDA
                          </label>
                          <input
                            type="date"
                            value={promisedDate}
                            onChange={(e) => setPromisedDate(e.target.value)}
                            className="w-full h-8 px-2 bg-surface-container-lowest rounded text-xs text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-label-uppercase text-on-surface-variant font-medium mb-1">
                            VALOR PROMETIDO (R$)
                          </label>
                          <input
                            type="text"
                            value={promisedValue}
                            onChange={(e) => setPromisedValue(e.target.value)}
                            placeholder="0,00"
                            className="w-full h-8 px-2 bg-surface-container-lowest rounded text-xs text-on-surface font-data-mono font-semibold border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Agendamento de Retorno (Callback) com Checkbox Explícito */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-outline-variant/20">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-on-surface">
                        <input
                          type="checkbox"
                          checked={hasReturn || result === 'Solicitou retorno'}
                          onChange={(e) => setHasReturn(e.target.checked)}
                          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-blue-700">schedule</span>
                          <span>Agendar Retorno / Callback</span>
                        </span>
                      </label>
                      {(hasReturn || result === 'Solicitou retorno') && (
                        <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Retorno Ativo
                        </span>
                      )}
                    </div>

                    {(hasReturn || result === 'Solicitou retorno') && (
                      <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex flex-col gap-2 animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-label-uppercase text-on-surface-variant font-medium mb-1">
                              DATA DO RETORNO
                            </label>
                            <input
                              type="date"
                              value={returnDate}
                              onChange={(e) => setReturnDate(e.target.value)}
                              className="w-full h-8 px-2 bg-surface-container-lowest rounded text-xs text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-label-uppercase text-on-surface-variant font-medium mb-1">
                              HORÁRIO
                            </label>
                            <input
                              type="time"
                              value={returnTime}
                              onChange={(e) => setReturnTime(e.target.value)}
                              className="w-full h-8 px-2 bg-surface-container-lowest rounded text-xs text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-label-uppercase text-on-surface-variant font-medium mb-1">
                            MOTIVO DO RETORNO
                          </label>
                          <input
                            type="text"
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            placeholder="Ex: Diretor em reunião, pediu para ligar amanhã"
                            className="w-full h-8 px-2 bg-surface-container-lowest rounded text-xs text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Condicional: Pagamento Realizado */}
                  {(result === 'Pagou' || hasPayment) && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                        <span>Confirmação de Pagamento Recebido</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-label-uppercase text-on-surface-variant font-medium mb-1">
                            DATA DO PAGAMENTO
                          </label>
                          <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full h-8 px-2 bg-surface-container-lowest rounded text-xs text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-label-uppercase text-on-surface-variant font-medium mb-1">
                            VALOR RECEBIDO (R$)
                          </label>
                          <input
                            type="text"
                            value={receivedValue}
                            onChange={(e) => setReceivedValue(e.target.value)}
                            placeholder="0,00"
                            className="w-full h-8 px-2 bg-surface-container-lowest rounded text-xs text-on-surface font-data-mono font-semibold border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Observações / Notas */}
                  <div>
                    <label className="block text-[10px] font-label-uppercase text-on-surface-variant font-semibold mb-1">
                      OBSERVAÇÕES DA CONVERSA
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Registre detalhes da negociação, argumentos apresentados ou motivo do desfecho..."
                      className="w-full p-2 bg-surface-container-lowest rounded-lg text-xs text-on-surface border border-outline-variant/40 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/60 resize-none"
                    />
                  </div>

                  {/* Botão de Salvar Contato */}
                  <button
                    type="submit"
                    className="w-full h-9 rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[17px]">save</span>
                    <span>Salvar Registro de Contato</span>
                  </button>
                </form>

                {/* 4. AÇÃO CLARA: FICHA COMPLETA (EM MODAL) */}
                <div className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <span className="font-label-uppercase text-outline font-bold text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-secondary">folder_open</span>
                      <span>Consulta Detalhada da Cobrança</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-secondary-container/40 text-secondary text-[10px] font-semibold">
                      Sobreposição em Modal
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Abra a Ficha Completa para consultar venda original, parcelamento, documentos anexados, opções de negociação, cartas de anuência e consolidações sem sair da Minha Carteira.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsFichaModalOpen(true)}
                    className="w-full h-10 rounded-xl bg-secondary hover:bg-on-secondary-container text-on-secondary font-title-md text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                    title="Abrir a Ficha Completa da cobrança em modal amplo sobreposto à carteira"
                    aria-label="Abrir Ficha completa da cobrança"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_full</span>
                    <span>Ficha completa</span>
                  </button>
                </div>

                {/* 5. HISTÓRICO PERMANENTE DA COBRANÇA */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1">
                    <span className="font-label-uppercase text-outline font-bold text-[11px] uppercase">
                      Histórico Permanente ({selectedDebt.history.length})
                    </span>
                    <span className="text-[10px] text-on-surface-variant">Preservação perpétua</span>
                  </div>

                  <div className="space-y-2">
                    {selectedDebt.history.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 bg-surface-container-low rounded-lg text-xs border border-outline-variant/20 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-primary">{h.operatorName}</span>
                            <span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px]">
                              {h.channel}
                            </span>
                          </div>
                          <span className="font-data-mono text-[10px] text-on-surface-variant">
                            {h.dateFormatted} às {h.timeFormatted}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="font-bold text-secondary text-[11px]">{h.result}</span>
                          {h.attachedPromise && (
                            <span className="text-[10px] text-secondary font-semibold font-data-mono">
                              PTP R${' '}
                              {h.attachedPromise.promisedValue.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}{' '}
                              em {h.attachedPromise.promisedDate}
                            </span>
                          )}
                          {h.attachedReturn && (
                            <span className="text-[10px] text-blue-700 font-semibold font-data-mono">
                              Retorno em {h.attachedReturn.returnDate} às {h.attachedReturn.returnTime}
                            </span>
                          )}
                          {h.attachedPayment && (
                            <span className="text-[10px] text-emerald-700 font-semibold font-data-mono">
                              Pago R${' '}
                              {h.attachedPayment.receivedValue.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}{' '}
                              em {h.attachedPayment.paymentDate}
                            </span>
                          )}
                        </div>

                        {h.notes && (
                          <p className="text-on-surface-variant text-[11px] leading-relaxed mt-0.5">
                            {h.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Painel Lateral Operacional (Drawer) termina acima */}

      {/* Modal Amplo: Ficha da Cobrança Completa Sobreposta à Minha Carteira */}
      {isFichaModalOpen && selectedDebt && (
        <div
          className="fixed inset-0 z-[60] overflow-hidden flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ficha-modal-title"
          onClick={() => setIsFichaModalOpen(false)}
        >
          <div
            className="relative w-full max-w-[1480px] h-[92vh] max-h-[92vh] bg-surface rounded-2xl shadow-2xl flex flex-col border border-outline-variant/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal com Identificação da Cobrança e Botão Fechar */}
            <div className="px-5 py-3.5 bg-primary text-surface flex items-center justify-between shrink-0 shadow-sm border-b border-surface/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-surface/10 flex items-center justify-center text-secondary-fixed shrink-0">
                  <span className="material-symbols-outlined text-[22px]">folder_open</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-label-uppercase text-secondary-fixed text-[11px] font-bold uppercase tracking-wider">
                      Ficha Completa da Cobrança • Título {selectedDebt.titleNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface/20 text-surface text-[10px] font-semibold">
                      {selectedDebt.statusLabel}
                    </span>
                  </div>
                  <h2 id="ficha-modal-title" className="font-headline-sm font-bold text-surface text-sm sm:text-base truncate">
                    {selectedDebt.debtorName} •{' '}
                    <span className="text-secondary-fixed font-data-mono font-normal">
                      R$ {selectedDebt.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-on-primary-container text-xs font-data-mono ml-2 font-normal hidden md:inline">
                      (CNPJ/CPF: {selectedDebt.debtorCnpjCpf} • ERP: {selectedDebt.erpCode} • Parc. {selectedDebt.installment})
                    </span>
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFichaModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-surface font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs border border-white/20"
                  title="Fechar Ficha e voltar ao Painel da Carteira (Esc)"
                  aria-label="Fechar Ficha da Cobrança"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  <span className="hidden sm:inline">Fechar Ficha</span>
                </button>
              </div>
            </div>

            {/* Conteúdo da Ficha Completa com Rolagem Interna sem Rolagem Horizontal */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-surface">
              <FichaCobrancaView
                debtId={selectedDebt.id}
                isModal={true}
                onCloseModal={() => setIsFichaModalOpen(false)}
                onBack={() => setIsFichaModalOpen(false)}
                onBackToPortfolio={() => setIsFichaModalOpen(false)}
                onBackToTodayWork={() => setIsFichaModalOpen(false)}
                onSelectAnotherDebt={(newDebtId) => {
                  setSelectedDebtId(newDebtId);
                }}
                onOpenFinishModal={() => {}}
                onNavigateToDebtor={() => {}}
                onOpenFastLog={onOpenFastLogModal ? (d) => onOpenFastLogModal(d || selectedDebt) : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-12 right-6 bg-primary text-surface px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 z-50 animate-fade-in text-xs font-medium">
          <span className="material-symbols-outlined text-secondary-fixed text-[18px]">
            verified
          </span>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

