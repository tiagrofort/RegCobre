import React, { useState, useEffect, useMemo } from 'react';
import { debtService } from '../services/debtService';
import { Empresa, ModoCarteiraEmpresa, CompanyPaymentData, PaymentDataType, PixKeyType } from '../types';

export const EmpresasView: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>(debtService.getAllEmpresas());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // View state: 'list' (grid) or 'form' (ficha individual da empresa)
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');

  // List filters & controls
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modoFilter, setModoFilter] = useState<'all' | ModoCarteiraEmpresa>('all');
  const [sortBy, setSortBy] = useState<'nome' | 'razao' | 'cidade' | 'cobrancas'>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form state
  const [editingEmpresaId, setEditingEmpresaId] = useState<string | null>(null);
  const [tempEmpresaId, setTempEmpresaId] = useState<string>('');

  // Form Fields - DADOS DA EMPRESA
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [ativo, setAtivo] = useState(true);

  // Form Fields - CONFIGURAÇÃO DAS COBRANÇAS
  const [modoCarteira, setModoCarteira] = useState<ModoCarteiraEmpresa>('COMPARTILHADA');

  // Form Fields - REGRAS DE NEGOCIAÇÃO E CONSOLIDAÇÃO
  const [permitirNegociacaoNaoVencidas, setPermitirNegociacaoNaoVencidas] = useState(false);
  const [descontoMaximoNaoVencidas, setDescontoMaximoNaoVencidas] = useState<number | string>(0);
  const [permitirDescontoVencidos, setPermitirDescontoVencidos] = useState(false);
  const [descontoMaximoVencidos, setDescontoMaximoVencidos] = useState<number | string>(0);

  // Sub-CRUD Modal State - FORMAS DE PAGAMENTO / RECEBIMENTO
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentDataType>('PIX');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CNPJ');
  const [pixKey, setPixKey] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountDescription, setAccountDescription] = useState('');
  const [paymentActive, setPaymentActive] = useState(true);
  const [isPrimaryPayment, setIsPrimaryPayment] = useState(false);

  // Subscribe to service updates
  useEffect(() => {
    return debtService.subscribe(() => {
      setEmpresas(debtService.getAllEmpresas());
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // The active company ID being edited or drafted
  const activeEmpresaId = editingEmpresaId || tempEmpresaId;
  const currentPayments = debtService.getCompanyPaymentData(activeEmpresaId);

  // Open Nova Empresa (Ficha limpa)
  const handleOpenNovaEmpresa = () => {
    const newId = `emp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    setEditingEmpresaId(null);
    setTempEmpresaId(newId);
    setRazaoSocial('');
    setNomeFantasia('');
    setCnpj('');
    setInscricaoEstadual('');
    setTelefone('');
    setEmail('');
    setCep('');
    setEndereco('');
    setNumero('');
    setComplemento('');
    setBairro('');
    setCidade('');
    setEstado('SP');
    setAtivo(true);
    setModoCarteira('COMPARTILHADA');
    setPermitirNegociacaoNaoVencidas(false);
    setDescontoMaximoNaoVencidas(0);
    setPermitirDescontoVencidos(false);
    setDescontoMaximoVencidos(0);
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Editar Empresa (Ficha preenchida)
  const handleOpenEditEmpresa = (emp: Empresa) => {
    setEditingEmpresaId(emp.id);
    setTempEmpresaId(emp.id);
    setRazaoSocial(emp.razaoSocial);
    setNomeFantasia(emp.nomeFantasia);
    setCnpj(emp.cnpj);
    setInscricaoEstadual(emp.inscricaoEstadual || '');
    setTelefone(emp.telefone || '');
    setEmail(emp.email || '');
    setCep(emp.cep || '');
    setEndereco(emp.endereco || '');
    setNumero(emp.numero || '');
    setComplemento(emp.complemento || '');
    setBairro(emp.bairro || '');
    setCidade(emp.cidade || '');
    setEstado(emp.estado || 'SP');
    setAtivo(emp.ativo);
    setModoCarteira(emp.modoCarteira || 'COMPARTILHADA');
    setPermitirNegociacaoNaoVencidas(emp.permitirNegociacaoNaoVencidas ?? false);
    setDescontoMaximoNaoVencidas(emp.descontoMaximoNaoVencidas ?? 0);
    setPermitirDescontoVencidos(emp.permitirDescontoVencidos ?? false);
    setDescontoMaximoVencidos(emp.descontoMaximoVencidos ?? 0);
    setViewMode('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save Empresa Ficha
  const handleSaveEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial.trim()) {
      showToast('Por favor, informe a Razão Social da empresa.');
      return;
    }
    if (!nomeFantasia.trim()) {
      showToast('Por favor, informe o Nome Fantasia da empresa.');
      return;
    }
    if (!cnpj.trim()) {
      showToast('Por favor, informe o CNPJ da empresa.');
      return;
    }

    const parsedDescNaoVencidas = permitirNegociacaoNaoVencidas
      ? Math.min(100, Math.max(0, parseFloat(String(descontoMaximoNaoVencidas).replace(',', '.')) || 0))
      : 0;
    const parsedDescVencidos = permitirDescontoVencidos
      ? Math.min(100, Math.max(0, parseFloat(String(descontoMaximoVencidos).replace(',', '.')) || 0))
      : 0;

    if (editingEmpresaId) {
      debtService.updateEmpresa(editingEmpresaId, {
        razaoSocial: razaoSocial.trim(),
        nomeFantasia: nomeFantasia.trim(),
        cnpj: cnpj.trim(),
        inscricaoEstadual: inscricaoEstadual.trim() || undefined,
        telefone: telefone.trim() || undefined,
        email: email.trim() || undefined,
        cep: cep.trim() || undefined,
        endereco: endereco.trim() || undefined,
        numero: numero.trim() || undefined,
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim() || undefined,
        cidade: cidade.trim() || undefined,
        estado: estado.trim() || undefined,
        ativo,
        modoCarteira,
        permitirNegociacaoNaoVencidas,
        descontoMaximoNaoVencidas: parsedDescNaoVencidas,
        permitirDescontoVencidos,
        descontoMaximoVencidos: parsedDescVencidos,
      });
      showToast(`Empresa "${nomeFantasia}" atualizada com sucesso!`);
    } else {
      debtService.addEmpresa(
        {
          razaoSocial: razaoSocial.trim(),
          nomeFantasia: nomeFantasia.trim(),
          cnpj: cnpj.trim(),
          inscricaoEstadual: inscricaoEstadual.trim() || undefined,
          telefone: telefone.trim() || undefined,
          email: email.trim() || undefined,
          cep: cep.trim() || undefined,
          endereco: endereco.trim() || undefined,
          numero: numero.trim() || undefined,
          complemento: complemento.trim() || undefined,
          bairro: bairro.trim() || undefined,
          cidade: cidade.trim() || undefined,
          estado: estado.trim() || undefined,
          ativo,
          modoCarteira,
          permitirNegociacaoNaoVencidas,
          descontoMaximoNaoVencidas: parsedDescNaoVencidas,
          permitirDescontoVencidos,
          descontoMaximoVencidos: parsedDescVencidos,
        },
        tempEmpresaId
      );
      showToast(`Nova empresa "${nomeFantasia}" cadastrada com sucesso!`);
    }

    setViewMode('list');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle status in list
  const handleToggleEmpresaStatus = (emp: Empresa) => {
    debtService.toggleEmpresaStatus(emp.id);
    showToast(`Empresa "${emp.nomeFantasia}" ${emp.ativo ? 'desativada' : 'ativada'} com sucesso.`);
  };

  // Delete Empresa
  const handleDeleteEmpresa = (emp: Empresa) => {
    if (confirm(`Deseja realmente excluir a empresa "${emp.nomeFantasia}" (${emp.cnpj})?`)) {
      const res = debtService.deleteEmpresa(emp.id);
      if (res.success) {
        showToast(`Empresa "${emp.nomeFantasia}" excluída com sucesso.`);
      } else {
        alert(res.message || 'Não foi possível excluir a empresa.');
      }
    }
  };

  // =========================================================================
  // SUB-CRUD DE FORMAS DE PAGAMENTO / RECEBIMENTO
  // =========================================================================
  const handleOpenAddPayment = () => {
    setEditingPaymentId(null);
    setPaymentType('PIX');
    setPixKeyType('CNPJ');
    setPixKey(cnpj ? cnpj.trim() : '');
    setPaymentDescription(nomeFantasia ? `PIX Principal - ${nomeFantasia}` : 'PIX Principal');
    setBankName('');
    setAccountDescription('');
    setPaymentActive(true);
    setIsPrimaryPayment(currentPayments.length === 0);
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditPayment = (p: CompanyPaymentData) => {
    setEditingPaymentId(p.id);
    setPaymentType(p.type);
    setPixKeyType(p.pixKeyType || 'CNPJ');
    setPixKey(p.pixKey || p.paymentInfo || '');
    setPaymentDescription(p.description);
    setBankName(p.bankName || '');
    setAccountDescription(p.accountDescription || '');
    setPaymentActive(p.active);
    setIsPrimaryPayment(p.isPrimary);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey.trim()) {
      showToast('Por favor, informe a chave PIX ou dado do recebimento.');
      return;
    }
    if (!paymentDescription.trim()) {
      showToast('Por favor, informe uma descrição para esta forma.');
      return;
    }

    if (editingPaymentId) {
      debtService.updateCompanyPaymentData(editingPaymentId, {
        empresaId: activeEmpresaId,
        type: paymentType,
        description: paymentDescription.trim(),
        pixKeyType: paymentType === 'PIX' ? pixKeyType : undefined,
        pixKey: pixKey.trim(),
        paymentInfo: pixKey.trim(),
        bankName: bankName.trim() || undefined,
        accountDescription: accountDescription.trim() || undefined,
        active: paymentActive,
        isPrimary: isPrimaryPayment,
      });
      showToast('Forma de recebimento atualizada com sucesso!');
    } else {
      debtService.addCompanyPaymentData({
        empresaId: activeEmpresaId,
        type: paymentType,
        description: paymentDescription.trim(),
        pixKeyType: paymentType === 'PIX' ? pixKeyType : undefined,
        pixKey: pixKey.trim(),
        paymentInfo: pixKey.trim(),
        bankName: bankName.trim() || undefined,
        accountDescription: accountDescription.trim() || undefined,
        active: paymentActive,
        isPrimary: isPrimaryPayment,
      });
      showToast('Nova forma de recebimento adicionada à empresa!');
    }
    setIsPaymentModalOpen(false);
  };

  const handleSetPrimaryPayment = (p: CompanyPaymentData) => {
    debtService.setPrimaryCompanyPaymentData(p.id);
    showToast(`"${p.description}" definida como forma de recebimento principal da empresa.`);
  };

  const handleTogglePaymentStatus = (p: CompanyPaymentData) => {
    debtService.toggleCompanyPaymentDataStatus(p.id);
    showToast(`Forma "${p.description}" ${p.active ? 'desativada' : 'ativada'}.`);
  };

  const handleDeletePayment = (p: CompanyPaymentData) => {
    if (confirm(`Deseja remover a forma de recebimento "${p.description}"?`)) {
      debtService.deleteCompanyPaymentData(p.id);
      showToast(`Forma de recebimento removida com sucesso.`);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`${label} copiado: ${text}`);
  };

  // =========================================================================
  // LIST FILTERING, SORTING & PAGINATION
  // =========================================================================
  const filteredAndSortedEmpresas = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = empresas.filter((emp) => {
      const matchesSearch =
        !q ||
        emp.razaoSocial.toLowerCase().includes(q) ||
        emp.nomeFantasia.toLowerCase().includes(q) ||
        emp.cnpj.toLowerCase().includes(q) ||
        (emp.cidade && emp.cidade.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && emp.ativo) ||
        (statusFilter === 'inactive' && !emp.ativo);

      const matchesModo = modoFilter === 'all' || emp.modoCarteira === modoFilter;

      return matchesSearch && matchesStatus && matchesModo;
    });

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'nome') {
        cmp = a.nomeFantasia.localeCompare(b.nomeFantasia);
      } else if (sortBy === 'razao') {
        cmp = a.razaoSocial.localeCompare(b.razaoSocial);
      } else if (sortBy === 'cidade') {
        cmp = (a.cidade || '').localeCompare(b.cidade || '');
      } else if (sortBy === 'cobrancas') {
        const cA = debtService.getAllDebts().filter((d) => d.empresaId === a.id).length;
        const cB = debtService.getAllDebts().filter((d) => d.empresaId === b.id).length;
        cmp = cA - cB;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [empresas, search, statusFilter, modoFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedEmpresas.length / itemsPerPage));
  const paginatedEmpresas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedEmpresas.slice(start, start + itemsPerPage);
  }, [filteredAndSortedEmpresas, currentPage, itemsPerPage]);

  const handleToggleSort = (column: 'nome' | 'razao' | 'cidade' | 'cobrancas') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Metrics
  const totalAtivas = empresas.filter((e) => e.ativo).length;
  const totalInativas = empresas.filter((e) => !e.ativo).length;

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-20 animate-fade-in">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm font-medium border border-secondary">
          <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
            check_circle
          </span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODO 1: LISTAGEM PRINCIPAL DE EMPRESAS (GRID)                           */}
      {/* ======================================================================= */}
      {viewMode === 'list' && (
        <>
          {/* Header principal */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[26px]">
                  domain
                </span>
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                  EMPRESAS
                </h1>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Gerencie as empresas cadastradas no RegCobre.
              </p>
            </div>

            <button
              onClick={handleOpenNovaEmpresa}
              className="h-10 px-space-md rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer self-start md:self-auto shrink-0"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              <span>+ Nova Empresa</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex items-center justify-between">
              <div>
                <span className="font-label-uppercase text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Total Cadastradas
                </span>
                <span className="font-data-mono text-2xl font-bold text-primary mt-1 block">
                  {empresas.length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">corporate_fare</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex items-center justify-between">
              <div>
                <span className="font-label-uppercase text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Empresas Ativas
                </span>
                <span className="font-data-mono text-2xl font-bold text-emerald-700 mt-1 block">
                  {totalAtivas}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                <span className="material-symbols-outlined text-[22px]">verified</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex items-center justify-between">
              <div>
                <span className="font-label-uppercase text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  Empresas Inativas
                </span>
                <span className="font-data-mono text-2xl font-bold text-on-surface-variant mt-1 block">
                  {totalInativas}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[22px]">pause_circle</span>
              </div>
            </div>
          </div>

          {/* Search, Filters and Sort Toolbar */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px]">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
                className="w-full h-10 pl-9 pr-3 bg-surface-container-low rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-on-surface-variant font-semibold mr-1">Status:</span>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-primary text-surface shadow-2xs'
                    : 'bg-surface-container hover:bg-surface-variant text-on-surface'
                }`}
              >
                Todas ({empresas.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('active');
                  setCurrentPage(1);
                }}
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-primary text-surface shadow-2xs'
                    : 'bg-surface-container hover:bg-surface-variant text-on-surface'
                }`}
              >
                Ativas ({totalAtivas})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('inactive');
                  setCurrentPage(1);
                }}
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'inactive'
                    ? 'bg-primary text-surface shadow-2xs'
                    : 'bg-surface-container hover:bg-surface-variant text-on-surface'
                }`}
              >
                Inativas ({totalInativas})
              </button>
            </div>

            {/* Visibility Mode Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-on-surface-variant font-semibold">Visibilidade:</span>
              <select
                value={modoFilter}
                onChange={(e) => {
                  setModoFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="h-9 px-2 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none cursor-pointer"
              >
                <option value="all">Todas</option>
                <option value="COMPARTILHADA">Compartilhada</option>
                <option value="EXCLUSIVA">Exclusiva</option>
              </select>
            </div>
          </div>

          {/* Grid / Tabela de Empresas */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container text-on-surface font-label-uppercase text-[11px] tracking-wider border-b border-outline-variant/20 select-none">
                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-surface-container-high transition-colors"
                      onClick={() => handleToggleSort('nome')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Empresa</span>
                        {sortBy === 'nome' && (
                          <span className="material-symbols-outlined text-[14px]">
                            {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4">CNPJ</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-surface-container-high transition-colors"
                      onClick={() => handleToggleSort('cidade')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Cidade/UF</span>
                        {sortBy === 'cidade' && (
                          <span className="material-symbols-outlined text-[14px]">
                            {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 text-center cursor-pointer hover:bg-surface-container-high transition-colors"
                      onClick={() => handleToggleSort('cobrancas')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Cobranças</span>
                        {sortBy === 'cobrancas' && (
                          <span className="material-symbols-outlined text-[14px]">
                            {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4">Visibilidade</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 font-body-sm">
                  {paginatedEmpresas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-[36px] text-outline mb-1 block">
                          domain_disabled
                        </span>
                        <p className="font-semibold text-sm text-on-surface">Nenhuma empresa encontrada</p>
                        <p className="text-xs mt-0.5">Tente ajustar a busca ou os filtros de status.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedEmpresas.map((emp) => {
                      const debtsCount = debtService
                        .getAllDebts()
                        .filter((d) => d.empresaId === emp.id).length;
                      const payments = debtService.getCompanyPaymentData(emp.id);
                      const activePaymentsCount = payments.filter((p) => p.active).length;

                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-surface-container-low/50 transition-colors group cursor-pointer"
                          onClick={() => handleOpenEditEmpresa(emp)}
                        >
                          {/* Coluna 1: Empresa */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <strong className="text-primary text-sm font-bold group-hover:underline">
                                {emp.nomeFantasia}
                              </strong>
                              <span className="text-on-surface-variant text-[11px] truncate max-w-[280px]">
                                {emp.razaoSocial}
                              </span>
                              {emp.email && (
                                <span className="text-on-surface-variant/80 text-[10px] mt-0.5">
                                  {emp.email} {emp.telefone ? `• ${emp.telefone}` : ''}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Coluna 2: CNPJ */}
                          <td className="py-3 px-4 font-data-mono">
                            <div className="flex flex-col">
                              <span className="font-semibold text-on-surface">{emp.cnpj}</span>
                              {emp.inscricaoEstadual && (
                                <span className="text-[10px] text-on-surface-variant">
                                  IE: {emp.inscricaoEstadual}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Coluna 3: Cidade/UF */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-on-surface">
                                {emp.cidade || '—'} {emp.estado ? `(${emp.estado})` : ''}
                              </span>
                              <span className="text-[10px] text-on-surface-variant truncate max-w-[160px]">
                                {emp.bairro || emp.endereco || '—'}
                              </span>
                            </div>
                          </td>

                          {/* Coluna 4: Cobranças */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-surface-container font-data-mono font-bold text-xs text-primary">
                              {debtsCount}
                            </span>
                          </td>

                          {/* Coluna 5: Visibilidade */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-badge-sm text-[10px] font-bold uppercase tracking-wider ${
                                emp.modoCarteira === 'COMPARTILHADA'
                                  ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                  : 'bg-purple-100 text-purple-800 border border-purple-300'
                              }`}
                              title={
                                emp.modoCarteira === 'COMPARTILHADA'
                                  ? 'Cobranças podem aparecer junto com cobranças de outras empresas'
                                  : 'Cobranças ficam restritas somente aos usuários desta empresa'
                              }
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  emp.modoCarteira === 'COMPARTILHADA' ? 'bg-sky-600' : 'bg-purple-600'
                                }`}
                              />
                              <span>{emp.modoCarteira}</span>
                            </span>
                          </td>

                          {/* Coluna 6: Status */}
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-badge-sm text-[10px] font-semibold ${
                                emp.ativo
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  emp.ativo ? 'bg-emerald-600' : 'bg-slate-500'
                                }`}
                              />
                              <span>{emp.ativo ? 'Ativa' : 'Inativa'}</span>
                            </span>
                          </td>

                          {/* Coluna 7: Ações */}
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditEmpresa(emp)}
                                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-primary hover:text-surface text-primary font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                title="Abrir cadastro e formas de pagamento da empresa"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                <span>Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleEmpresaStatus(emp)}
                                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                  emp.ativo
                                    ? 'hover:bg-amber-100 hover:text-amber-800 text-on-surface-variant'
                                    : 'hover:bg-emerald-100 hover:text-emerald-800 text-on-surface-variant'
                                }`}
                                title={emp.ativo ? 'Desativar Empresa' : 'Ativar Empresa'}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {emp.ativo ? 'toggle_on' : 'toggle_off'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteEmpresa(emp)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                                title="Excluir Empresa"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span>
                  Mostrando {paginatedEmpresas.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} a{' '}
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedEmpresas.length)} de{' '}
                  <strong>{filteredAndSortedEmpresas.length}</strong> empresas
                </span>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-1">
                  <span>Itens por página:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="h-7 px-1.5 bg-surface-container-lowest rounded border border-outline-variant/30 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-variant disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  Anterior
                </button>
                <span className="px-2 font-data-mono font-semibold">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-variant disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======================================================================= */}
      {/* MODO 2: CADASTRO INDIVIDUAL DA EMPRESA (FICHA COMPLETA)                 */}
      {/* ======================================================================= */}
      {viewMode === 'form' && (
        <form onSubmit={handleSaveEmpresa} className="space-y-6">
          {/* Header da Ficha Individual */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Voltar para Lista de Empresas</span>
                </button>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                {editingEmpresaId ? `Editar Empresa: ${nomeFantasia || 'Empresa'}` : 'Nova Empresa'}
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {editingEmpresaId
                  ? 'Ficha cadastral completa, formas de recebimento e visibilidade das cobranças.'
                  : 'Preencha os dados cadastrais, defina as formas de pagamento e a visibilidade das cobranças.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 px-5 rounded-lg bg-primary hover:bg-primary-container text-surface font-semibold text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Salvar Empresa</span>
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* SEÇÃO 1: DADOS DA EMPRESA                                            */}
          {/* ===================================================================== */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">domain</span>
              <h2 className="font-title-md font-bold text-primary text-sm uppercase tracking-wider">
                Dados da Empresa
              </h2>
            </div>

            <div className="p-space-lg space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[11px]">
                    RAZÃO SOCIAL *
                  </label>
                  <input
                    type="text"
                    required
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Ex: ABC Comércio e Serviços Ltda"
                    className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  />
                </div>

                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[11px]">
                    NOME FANTASIA *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Ex: ABC Comercial"
                    className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[11px]">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface font-data-mono border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  />
                </div>

                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[11px]">
                    INSCRIÇÃO ESTADUAL
                  </label>
                  <input
                    type="text"
                    value={inscricaoEstadual}
                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                    placeholder="Isento ou número da IE"
                    className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface font-data-mono border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  />
                </div>

                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[11px]">
                    TELEFONE
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 0000-0000"
                    className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  />
                </div>

                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[11px]">
                    E-MAIL CORPORATIVO
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="financeiro@empresa.com.br"
                    className="w-full h-10 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-2 border-t border-outline-variant/20">
                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    placeholder="00000-000"
                    className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface font-data-mono border border-outline-variant/30 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    LOGRADOURO / ENDEREÇO
                  </label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Av. Brasil"
                    className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    NÚMERO
                  </label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="1000"
                    className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    COMPLEMENTO
                  </label>
                  <input
                    type="text"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    placeholder="Sala 201"
                    className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    BAIRRO
                  </label>
                  <input
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Centro"
                    className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    CIDADE
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    ESTADO (UF)
                  </label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none cursor-pointer"
                  >
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(
                      (uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ativo}
                      onChange={(e) => setAtivo(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                    />
                    <span className="text-xs font-bold text-on-surface">Empresa Ativa no Sistema</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* SEÇÃO 2: FORMAS DE PAGAMENTO / RECEBIMENTO (SUB-CRUD DA EMPRESA)      */}
          {/* ===================================================================== */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    account_balance_wallet
                  </span>
                  <h2 className="font-title-md font-bold text-primary text-sm uppercase tracking-wider">
                    Formas de Pagamento / Recebimento
                  </h2>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Chaves PIX e dados bancários oficiais utilizados na cobrança para os clientes desta empresa.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddPayment}
                className="h-9 px-3 bg-primary hover:bg-primary-container text-surface rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ Adicionar Forma</span>
              </button>
            </div>

            <div className="p-4">
              {currentPayments.length === 0 ? (
                <div className="p-8 text-center bg-surface-container-low/40 rounded-xl border border-dashed border-outline-variant/40">
                  <span className="material-symbols-outlined text-outline text-[36px] mb-2 block">
                    account_balance
                  </span>
                  <p className="font-semibold text-sm text-on-surface">
                    Nenhuma forma de recebimento cadastrada para esta empresa.
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Cadastre chaves PIX (CNPJ, E-mail, Telefone, Aleatória) ou contas bancárias para repasse aos devedores.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddPayment}
                    className="mt-3 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-container text-on-secondary hover:text-on-secondary-container font-semibold text-xs transition-colors cursor-pointer"
                  >
                    + Cadastrar Primeira Forma
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/15 border border-outline-variant/20 rounded-xl overflow-hidden">
                  {currentPayments.map((p) => (
                    <div
                      key={p.id}
                      className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        p.isPrimary
                          ? 'bg-surface-container-low/70 border-l-4 border-primary'
                          : p.active
                          ? 'hover:bg-surface-container-low/30'
                          : 'bg-surface-container/30 opacity-70'
                      }`}
                    >
                      {/* Left: Info */}
                      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-badge-sm text-[10px] font-bold uppercase">
                            {p.type} {p.pixKeyType ? `• ${p.pixKeyType}` : ''}
                          </span>

                          {p.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-surface font-badge-sm text-[10px] font-bold uppercase flex items-center gap-1 shadow-2xs">
                              <span className="material-symbols-outlined text-[12px]">star</span>
                              Principal
                            </span>
                          )}

                          <strong className="text-sm font-bold text-primary truncate max-w-[300px]">
                            {p.description}
                          </strong>

                          <span
                            className={`px-2 py-0.5 rounded font-badge-sm text-[10px] font-bold ${
                              p.active
                                ? 'bg-secondary-container text-on-secondary-container'
                                : 'bg-surface-container-highest text-outline'
                            }`}
                          >
                            {p.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>

                        {/* Chave / Dado */}
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span className="text-xs text-on-surface-variant font-semibold">Chave / Dado:</span>
                          <span className="font-data-mono text-xs font-bold text-on-surface bg-surface-container px-2.5 py-1 rounded border border-outline-variant/20 select-all inline-block">
                            {p.pixKey || p.paymentInfo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.pixKey || p.paymentInfo || '', 'Chave de Recebimento')}
                            className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                            title="Copiar chave"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>
                        </div>

                        {/* Detalhes Bancários Opcionais */}
                        {(p.bankName || p.accountDescription) && (
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                            <span className="material-symbols-outlined text-[14px] text-outline">
                              account_balance
                            </span>
                            {p.bankName && <span className="font-semibold text-primary">{p.bankName}</span>}
                            {p.bankName && p.accountDescription && <span>•</span>}
                            {p.accountDescription && <span>{p.accountDescription}</span>}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                        {!p.isPrimary && p.active && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryPayment(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-primary hover:text-surface text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Definir como principal para esta empresa"
                          >
                            <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">
                              star
                            </span>
                            <span>Tornar Principal</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditPayment(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePaymentStatus(p)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                            p.active
                              ? 'bg-surface-container text-on-surface-variant hover:bg-error-container hover:text-on-error-container'
                              : 'bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary'
                          }`}
                          title={p.active ? 'Desativar' : 'Ativar'}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {p.active ? 'pause_circle' : 'play_circle'}
                          </span>
                          <span>{p.active ? 'Desativar' : 'Ativar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePayment(p)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* SEÇÃO 3: CONFIGURAÇÃO DAS COBRANÇAS                                   */}
          {/* ===================================================================== */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">
                settings_suggest
              </span>
              <h2 className="font-title-md font-bold text-primary text-sm uppercase tracking-wider">
                Configuração das Cobranças
              </h2>
            </div>

            <div className="p-space-lg space-y-4">
              <div>
                <label className="block font-label-uppercase font-bold text-outline mb-1 text-[11px]">
                  VISIBILIDADE DAS COBRANÇAS
                </label>
                <p className="text-xs text-on-surface-variant mb-3">
                  Determina a política de distribuição e apresentação das dívidas desta empresa na carteira dos operadores autorizados.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Opção COMPARTILHADA */}
                  <label
                    onClick={() => setModoCarteira('COMPARTILHADA')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      modoCarteira === 'COMPARTILHADA'
                        ? 'border-sky-600 bg-sky-50/50 shadow-sm'
                        : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modoCarteira"
                      value="COMPARTILHADA"
                      checked={modoCarteira === 'COMPARTILHADA'}
                      onChange={() => setModoCarteira('COMPARTILHADA')}
                      className="mt-1 text-sky-600 accent-sky-600"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-sky-900">COMPARTILHADA</strong>
                        <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-badge-sm text-[9px] font-bold uppercase">
                          Padrão
                        </span>
                      </div>
                      <p className="text-xs text-on-surface leading-relaxed">
                        As cobranças desta empresa podem aparecer junto com cobranças de outras empresas para usuários que possuem acesso a elas.
                      </p>
                    </div>
                  </label>

                  {/* Opção EXCLUSIVA */}
                  <label
                    onClick={() => setModoCarteira('EXCLUSIVA')}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      modoCarteira === 'EXCLUSIVA'
                        ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                        : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modoCarteira"
                      value="EXCLUSIVA"
                      checked={modoCarteira === 'EXCLUSIVA'}
                      onChange={() => setModoCarteira('EXCLUSIVA')}
                      className="mt-1 text-purple-600 accent-purple-600"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-purple-900">EXCLUSIVA</strong>
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-badge-sm text-[9px] font-bold uppercase">
                          Restrita
                        </span>
                      </div>
                      <p className="text-xs text-on-surface leading-relaxed">
                        As cobranças desta empresa ficam disponíveis somente para usuários autorizados para esta empresa.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* SEÇÃO 4: REGRAS DE NEGOCIAÇÃO E CONSOLIDAÇÃO                          */}
          {/* ===================================================================== */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  rule
                </span>
                <h2 className="font-title-md font-bold text-primary text-sm uppercase tracking-wider">
                  Regras de Negociação e Consolidação
                </h2>
              </div>
              <span className="text-[11px] text-on-surface-variant font-medium hidden sm:inline">
                Políticas de agrupamento e limites de desconto
              </span>
            </div>

            <div className="p-space-lg space-y-5">
              {/* Informação explicativa sobre consolidação e desconto */}
              <div className="p-3 bg-surface-container-low border border-outline-variant/20 rounded-lg flex items-start gap-2.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                  info
                </span>
                <p className="leading-relaxed">
                  Consolidação e desconto são conceitos diferentes: a empresa pode autorizar o agrupamento de títulos para negociação e pagamento conjunto sem necessariamente permitir concessão de desconto.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Permitir negociação/consolidação de parcelas NÃO VENCIDAS */}
                <div
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-4 ${
                    permitirNegociacaoNaoVencidas
                      ? 'border-primary/40 bg-primary/5 shadow-2xs'
                      : 'border-outline-variant/30 bg-surface-container-low'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-label-uppercase text-[11px] font-bold text-outline block">
                          PARCELAS NÃO VENCIDAS
                        </span>
                        <h3 className="font-title-sm font-bold text-sm text-on-surface mt-0.5">
                          Permitir negociação/consolidação de parcelas NÃO VENCIDAS
                        </h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-badge-sm text-[10px] font-bold uppercase shrink-0 ${
                          permitirNegociacaoNaoVencidas
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-surface-container-high text-outline'
                        }`}
                      >
                        {permitirNegociacaoNaoVencidas ? 'Habilitado' : 'Desabilitado'}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Autoriza agrupar e negociar antecipadamente títulos ou parcelas a vencer deste credor junto ao devedor.
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-outline-variant/20">
                    {/* Campo Sim/Não */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label-uppercase text-xs font-bold text-outline">
                        PERMITIR:
                      </span>
                      <div className="inline-flex rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setPermitirNegociacaoNaoVencidas(true)}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            permitirNegociacaoNaoVencidas
                              ? 'bg-primary text-surface shadow-xs font-bold'
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {permitirNegociacaoNaoVencidas ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <span>Sim</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPermitirNegociacaoNaoVencidas(false)}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            !permitirNegociacaoNaoVencidas
                              ? 'bg-surface-container-high text-on-surface shadow-xs font-bold'
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {!permitirNegociacaoNaoVencidas ? 'cancel' : 'radio_button_unchecked'}
                          </span>
                          <span>Não</span>
                        </button>
                      </div>
                    </div>

                    {/* Desconto máximo permitido */}
                    <div
                      className={`p-3 rounded-lg border transition-all ${
                        permitirNegociacaoNaoVencidas
                          ? 'bg-surface-container-lowest border-outline-variant/30'
                          : 'bg-surface-container-high/30 border-dashed border-outline-variant/20 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label
                            htmlFor="desc-nao-vencidas"
                            className="block font-label-uppercase font-bold text-outline text-[11px]"
                          >
                            DESCONTO MÁXIMO PERMITIDO
                          </label>
                          <span className="text-[10px] text-on-surface-variant block mt-0.5">
                            Percentual de 0,00% a 100,00% (ex: 5,00%)
                          </span>
                        </div>
                        <div className="relative w-36 shrink-0">
                          <input
                            id="desc-nao-vencidas"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            disabled={!permitirNegociacaoNaoVencidas}
                            value={descontoMaximoNaoVencidas}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '') {
                                setDescontoMaximoNaoVencidas('');
                                return;
                              }
                              const val = parseFloat(raw);
                              if (val < 0) setDescontoMaximoNaoVencidas(0);
                              else if (val > 100) setDescontoMaximoNaoVencidas(100);
                              else setDescontoMaximoNaoVencidas(raw);
                            }}
                            placeholder="Ex: 5,00"
                            className={`w-full h-9 pl-3 pr-8 rounded-lg text-xs font-data-mono font-bold border transition-colors ${
                              permitirNegociacaoNaoVencidas
                                ? 'bg-surface-container-lowest text-on-surface border-outline-variant/40 focus:outline-none focus:border-primary'
                                : 'bg-surface-container-high text-outline border-outline-variant/20 cursor-not-allowed'
                            }`}
                          />
                          <span className="absolute right-3 top-2 text-xs font-bold text-on-surface-variant font-data-mono pointer-events-none">
                            %
                          </span>
                        </div>
                      </div>
                      {!permitirNegociacaoNaoVencidas && (
                        <span className="text-[10px] text-outline italic block mt-1.5">
                          Habilite a opção acima para permitir e configurar o desconto máximo.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Permitir desconto em consolidação com títulos VENCIDOS */}
                <div
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-4 ${
                    permitirDescontoVencidos
                      ? 'border-primary/40 bg-primary/5 shadow-2xs'
                      : 'border-outline-variant/30 bg-surface-container-low'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-label-uppercase text-[11px] font-bold text-outline block">
                          TÍTULOS VENCIDOS
                        </span>
                        <h3 className="font-title-sm font-bold text-sm text-on-surface mt-0.5">
                          Permitir desconto em consolidação com títulos VENCIDOS
                        </h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-badge-sm text-[10px] font-bold uppercase shrink-0 ${
                          permitirDescontoVencidos
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-surface-container-high text-outline'
                        }`}
                      >
                        {permitirDescontoVencidos ? 'Habilitado' : 'Desabilitado'}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Autoriza conceder desconto sobre títulos já vencidos quando forem agrupados em uma proposta de consolidação.
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-outline-variant/20">
                    {/* Campo Sim/Não */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label-uppercase text-xs font-bold text-outline">
                        PERMITIR:
                      </span>
                      <div className="inline-flex rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-1 gap-1">
                        <button
                          type="button"
                          onClick={() => setPermitirDescontoVencidos(true)}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            permitirDescontoVencidos
                              ? 'bg-primary text-surface shadow-xs font-bold'
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {permitirDescontoVencidos ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <span>Sim</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPermitirDescontoVencidos(false)}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            !permitirDescontoVencidos
                              ? 'bg-surface-container-high text-on-surface shadow-xs font-bold'
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {!permitirDescontoVencidos ? 'cancel' : 'radio_button_unchecked'}
                          </span>
                          <span>Não</span>
                        </button>
                      </div>
                    </div>

                    {/* Desconto máximo permitido */}
                    <div
                      className={`p-3 rounded-lg border transition-all ${
                        permitirDescontoVencidos
                          ? 'bg-surface-container-lowest border-outline-variant/30'
                          : 'bg-surface-container-high/30 border-dashed border-outline-variant/20 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label
                            htmlFor="desc-vencidos"
                            className="block font-label-uppercase font-bold text-outline text-[11px]"
                          >
                            DESCONTO MÁXIMO PERMITIDO
                          </label>
                          <span className="text-[10px] text-on-surface-variant block mt-0.5">
                            Percentual de 0,00% a 100,00% (ex: 5,00%)
                          </span>
                        </div>
                        <div className="relative w-36 shrink-0">
                          <input
                            id="desc-vencidos"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            disabled={!permitirDescontoVencidos}
                            value={descontoMaximoVencidos}
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '') {
                                setDescontoMaximoVencidos('');
                                return;
                              }
                              const val = parseFloat(raw);
                              if (val < 0) setDescontoMaximoVencidos(0);
                              else if (val > 100) setDescontoMaximoVencidos(100);
                              else setDescontoMaximoVencidos(raw);
                            }}
                            placeholder="Ex: 5,00"
                            className={`w-full h-9 pl-3 pr-8 rounded-lg text-xs font-data-mono font-bold border transition-colors ${
                              permitirDescontoVencidos
                                ? 'bg-surface-container-lowest text-on-surface border-outline-variant/40 focus:outline-none focus:border-primary'
                                : 'bg-surface-container-high text-outline border-outline-variant/20 cursor-not-allowed'
                            }`}
                          />
                          <span className="absolute right-3 top-2 text-xs font-bold text-on-surface-variant font-data-mono pointer-events-none">
                            %
                          </span>
                        </div>
                      </div>
                      {!permitirDescontoVencidos && (
                        <span className="text-[10px] text-outline italic block mt-1.5">
                          Habilite a opção acima para permitir e configurar o desconto máximo.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="h-10 px-5 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 px-6 rounded-lg bg-primary hover:bg-primary-container text-surface font-semibold text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Salvar Empresa</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================================= */}
      {/* MODAL DO SUB-CRUD: ADICIONAR / EDITAR FORMA DE RECEBIMENTO               */}
      {/* ======================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-lg w-full border border-outline-variant/30 overflow-hidden">
            <div className="p-4 bg-primary text-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
                  account_balance_wallet
                </span>
                <h3 className="font-title-md font-bold text-sm">
                  {editingPaymentId ? 'Editar Forma de Recebimento' : 'Nova Forma de Recebimento'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-surface hover:opacity-80 cursor-pointer p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    MODALIDADE *
                  </label>
                  <select
                    className="w-full h-9 px-2 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentDataType)}
                  >
                    <option value="PIX">PIX</option>
                    <option value="Boleto">Boleto Bancário</option>
                    <option value="TED">TED / Transferência</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {paymentType === 'PIX' ? (
                  <div>
                    <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                      TIPO DE CHAVE PIX *
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
                      MODALIDADE
                    </label>
                    <input
                      type="text"
                      disabled
                      value={paymentType}
                      className="w-full h-9 px-2 bg-surface-container rounded-lg text-xs text-on-surface-variant border border-outline-variant/30"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                  CHAVE / DADO PRINCIPAL DE PAGAMENTO *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    paymentType === 'PIX'
                      ? pixKeyType === 'CNPJ'
                        ? '00.000.000/0000-00'
                        : pixKeyType === 'CPF'
                        ? '000.000.000-00'
                        : pixKeyType === 'E-mail'
                        ? 'financeiro@empresa.com.br'
                        : pixKeyType === 'Telefone'
                        ? '(00) 90000-0000'
                        : 'Chave aleatória UUID'
                      : 'Informação da conta ou linha digitável'
                  }
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs font-bold text-primary font-data-mono border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                />
              </div>

              <div>
                <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                  DESCRIÇÃO OU IDENTIFICAÇÃO DO DADO *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PIX Principal (CNPJ), Conta Banco Itaú"
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    BANCO (OPCIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Itaú, Bradesco, BB"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    CONTA / IDENTIFICAÇÃO (OPCIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ag. 0123 • C/C 45678-9"
                    value={accountDescription}
                    onChange={(e) => setAccountDescription(e.target.value)}
                    className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/20">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={paymentActive}
                    onChange={(e) => setPaymentActive(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                  />
                  <span className="text-xs font-semibold text-on-surface">Forma Ativa</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPrimaryPayment}
                    onChange={(e) => setIsPrimaryPayment(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                  />
                  <span className="text-xs font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">star</span>
                    Definir como Principal
                  </span>
                </label>
              </div>

              {isPrimaryPayment && (
                <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant/30 text-[11px] text-on-surface-variant flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">
                    info
                  </span>
                  <span>
                    Ao marcar esta forma como principal, qualquer outra forma principal anterior desta empresa será automaticamente desmarcada, continuando ativa.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-container text-surface font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                >
                  {editingPaymentId ? 'Salvar Alterações' : 'Adicionar Forma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
