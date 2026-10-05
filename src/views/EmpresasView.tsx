import React, { useState, useEffect } from 'react';
import { debtService } from '../services/debtService';
import { Empresa, ModoCarteiraEmpresa, CompanyPaymentData, PaymentDataType, PixKeyType } from '../types';

export const EmpresasView: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>(debtService.getAllEmpresas());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modoFilter, setModoFilter] = useState<'all' | ModoCarteiraEmpresa>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Subscribe to service changes
  useEffect(() => {
    return debtService.subscribe(() => {
      setEmpresas(debtService.getAllEmpresas());
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Empresa Form Modal State
  const [isEmpresaModalOpen, setIsEmpresaModalOpen] = useState(false);
  const [editingEmpresaId, setEditingEmpresaId] = useState<string | null>(null);

  // Form Fields
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
  const [modoCarteira, setModoCarteira] = useState<ModoCarteiraEmpresa>('COMPARTILHADA');

  // Dados de Recebimento Modal State for specific Empresa
  const [managingPaymentsEmpresa, setManagingPaymentsEmpresa] = useState<Empresa | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentDataType>('PIX');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CNPJ');
  const [pixKey, setPixKey] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountDescription, setAccountDescription] = useState('');
  const [paymentActive, setPaymentActive] = useState(true);
  const [isPrimaryPayment, setIsPrimaryPayment] = useState(false);

  // Open Add Empresa Modal
  const handleOpenAddEmpresa = () => {
    setEditingEmpresaId(null);
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
    setIsEmpresaModalOpen(true);
  };

  // Open Edit Empresa Modal
  const handleOpenEditEmpresa = (emp: Empresa) => {
    setEditingEmpresaId(emp.id);
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
    setIsEmpresaModalOpen(true);
  };

  // Save Empresa
  const handleSaveEmpresa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial.trim()) {
      showToast('Por favor, informe a Razão Social da empresa.');
      return;
    }
    if (!nomeFantasia.trim()) {
      showToast('Por favor, informe o Nome Fantasia.');
      return;
    }
    if (!cnpj.trim()) {
      showToast('Por favor, informe o CNPJ.');
      return;
    }

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
      });
      showToast('Empresa atualizada com sucesso!');
    } else {
      debtService.addEmpresa({
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
      });
      showToast('Nova empresa cadastrada com sucesso!');
    }
    setIsEmpresaModalOpen(false);
  };

  const handleToggleEmpresaStatus = (emp: Empresa) => {
    debtService.toggleEmpresaStatus(emp.id);
    showToast(`Empresa "${emp.nomeFantasia}" ${emp.ativo ? 'desativada' : 'ativada'} com sucesso.`);
  };

  const handleDeleteEmpresa = (emp: Empresa) => {
    if (confirm(`Deseja realmente excluir a empresa "${emp.nomeFantasia}"?`)) {
      const res = debtService.deleteEmpresa(emp.id);
      if (res.success) {
        showToast('Empresa excluída com sucesso.');
      } else {
        alert(res.message || 'Não foi possível excluir.');
      }
    }
  };

  // --- Payment Data Sub-management ---
  const handleOpenPayments = (emp: Empresa) => {
    setManagingPaymentsEmpresa(emp);
  };

  const handleOpenAddPayment = () => {
    setEditingPaymentId(null);
    setPaymentType('PIX');
    setPaymentDescription('');
    setPixKeyType('CNPJ');
    setPixKey('');
    setBankName('');
    setAccountDescription('');
    setPaymentActive(true);
    const existing = managingPaymentsEmpresa
      ? debtService.getCompanyPaymentData(managingPaymentsEmpresa.id)
      : [];
    setIsPrimaryPayment(existing.length === 0);
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditPayment = (item: CompanyPaymentData) => {
    setEditingPaymentId(item.id);
    setPaymentType(item.type);
    setPaymentDescription(item.description);
    setPixKeyType(item.pixKeyType || 'CNPJ');
    setPixKey(item.pixKey || item.paymentInfo || '');
    setBankName(item.bankName || '');
    setAccountDescription(item.accountDescription || '');
    setPaymentActive(item.active);
    setIsPrimaryPayment(item.isPrimary);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingPaymentsEmpresa) return;
    if (!pixKey.trim()) {
      showToast('Por favor, informe a chave PIX ou dados de pagamento.');
      return;
    }
    if (!paymentDescription.trim()) {
      showToast('Por favor, informe a descrição.');
      return;
    }

    if (editingPaymentId) {
      debtService.updateCompanyPaymentData(editingPaymentId, {
        empresaId: managingPaymentsEmpresa.id,
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
      showToast('Dado de recebimento atualizado com sucesso!');
    } else {
      debtService.addCompanyPaymentData({
        empresaId: managingPaymentsEmpresa.id,
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
      showToast('Novo dado de recebimento adicionado à empresa!');
    }
    setIsPaymentModalOpen(false);
  };

  // Filtered List
  const filteredEmpresas = empresas.filter((emp) => {
    const q = search.toLowerCase();
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

  const totalAtivas = empresas.filter((e) => e.ativo).length;
  const totalCompartilhadas = empresas.filter((e) => e.modoCarteira === 'COMPARTILHADA').length;
  const totalExclusivas = empresas.filter((e) => e.modoCarteira === 'EXCLUSIVA').length;

  return (
    <div className="space-y-space-md">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-primary text-surface px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-fadeIn">
          <span className="material-symbols-outlined text-secondary text-[20px]">
            check_circle
          </span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-xs border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">
              domain
            </span>
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
              Cadastro de Empresas
            </h1>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Gestão multiempresa, dados cadastrais, modo de carteira e dados de recebimento vinculados.
          </p>
        </div>

        <button
          onClick={handleOpenAddEmpresa}
          className="px-space-md py-2 bg-primary hover:bg-primary-container text-surface rounded-lg font-title-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add_business</span>
          <span>+ Nova Empresa</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between">
          <span className="font-label-uppercase text-label-uppercase text-on-surface-variant font-medium">
            Total de Empresas
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-headline-md font-bold font-data-mono text-2xl text-on-surface">
              {empresas.length}
            </span>
            <span className="material-symbols-outlined text-outline-variant text-[24px]">
              corporate_fare
            </span>
          </div>
        </div>

        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between">
          <span className="font-label-uppercase text-label-uppercase text-on-surface-variant font-medium">
            Empresas Ativas
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-headline-md font-bold font-data-mono text-2xl text-emerald-600">
              {totalAtivas}
            </span>
            <span className="material-symbols-outlined text-emerald-600/50 text-[24px]">
              check_circle
            </span>
          </div>
        </div>

        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between">
          <span className="font-label-uppercase text-label-uppercase text-on-surface-variant font-medium">
            Carteira Compartilhada
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-headline-md font-bold font-data-mono text-2xl text-sky-700">
              {totalCompartilhadas}
            </span>
            <span className="material-symbols-outlined text-sky-600/50 text-[24px]">
              share
            </span>
          </div>
        </div>

        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between">
          <span className="font-label-uppercase text-label-uppercase text-on-surface-variant font-medium">
            Carteira Exclusiva
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-headline-md font-bold font-data-mono text-2xl text-purple-700">
              {totalExclusivas}
            </span>
            <span className="material-symbols-outlined text-purple-600/50 text-[24px]">
              lock
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs flex flex-col md:flex-row items-center gap-space-md justify-between">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Razão Social, Fantasia, CNPJ ou Cidade..."
            className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-lg border-0 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Somente Ativas</option>
            <option value="inactive">Somente Inativas</option>
          </select>

          {/* Modo Carteira Filter */}
          <select
            value={modoFilter}
            onChange={(e) => setModoFilter(e.target.value as any)}
            className="px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os Modos de Carteira</option>
            <option value="COMPARTILHADA">Modo: Compartilhada</option>
            <option value="EXCLUSIVA">Modo: Exclusiva</option>
          </select>
        </div>
      </div>

      {/* Table of Empresas */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-xs">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-uppercase tracking-wider border-b border-outline-variant/30">
                <th className="py-3 px-4">Empresa</th>
                <th className="py-3 px-4">CNPJ / Inscrição</th>
                <th className="py-3 px-4">Localização</th>
                <th className="py-3 px-4">Modo de Carteira</th>
                <th className="py-3 px-4 text-center">Cobranças</th>
                <th className="py-3 px-4">Recebimentos</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {filteredEmpresas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-on-surface-variant italic">
                    Nenhuma empresa encontrada com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredEmpresas.map((emp) => {
                  const debtsCount = debtService
                    .getAllDebts()
                    .filter((d) => d.empresaId === emp.id).length;
                  const payments = debtService.getCompanyPaymentData(emp.id);
                  const activePaymentsCount = payments.filter((p) => p.active).length;

                  return (
                    <tr key={emp.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <strong className="text-primary text-sm font-semibold">
                            {emp.nomeFantasia}
                          </strong>
                          <span className="text-on-surface-variant text-[11px]">
                            {emp.razaoSocial}
                          </span>
                          {emp.email && (
                            <span className="text-on-surface-variant/80 text-[10px] mt-0.5">
                              {emp.email} • {emp.telefone || ''}
                            </span>
                          )}
                        </div>
                      </td>

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

                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-on-surface">
                            {emp.cidade || '—'} {emp.estado ? `(${emp.estado})` : ''}
                          </span>
                          <span className="text-[10px] text-on-surface-variant truncate max-w-[150px]">
                            {emp.bairro || emp.endereco || '—'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-badge-sm text-[10px] font-bold uppercase tracking-wider ${
                              emp.modoCarteira === 'COMPARTILHADA'
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}
                            title={
                              emp.modoCarteira === 'COMPARTILHADA'
                                ? 'Cobranças podem ser visualizadas conjuntamente por usuários autorizados'
                                : 'Cobranças restritas a usuários autorizados desta empresa'
                            }
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                emp.modoCarteira === 'COMPARTILHADA' ? 'bg-sky-600' : 'bg-purple-600'
                              }`}
                            />
                            <span>{emp.modoCarteira === 'COMPARTILHADA' ? 'Compartilhada' : 'Exclusiva'}</span>
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-data-mono font-semibold text-on-surface">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-xs">
                          {debtsCount}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenPayments(emp)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary font-medium text-[11px] transition-colors cursor-pointer"
                          title="Gerenciar formas de recebimento e chaves PIX desta empresa"
                        >
                          <span className="material-symbols-outlined text-[14px]">account_balance</span>
                          <span>
                            {activePaymentsCount} forma{activePaymentsCount !== 1 ? 's' : ''}
                          </span>
                          <span className="material-symbols-outlined text-[12px]">edit</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-badge-sm text-[10px] font-semibold ${
                            emp.ativo
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              emp.ativo ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          <span>{emp.ativo ? 'Ativa' : 'Inativa'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEmpresa(emp)}
                            title="Editar Dados Cadastrais"
                            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleEmpresaStatus(emp)}
                            title={emp.ativo ? 'Desativar Empresa' : 'Ativar Empresa'}
                            className="p-1 rounded text-on-surface-variant hover:text-amber-700 hover:bg-surface-container transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {emp.ativo ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteEmpresa(emp)}
                            title="Excluir Empresa"
                            className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
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
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CADASTRO / EDIÇÃO DE EMPRESA                                      */}
      {/* ========================================================================= */}
      {isEmpresaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-scrim/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-space-md border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  {editingEmpresaId ? 'edit_square' : 'add_business'}
                </span>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {editingEmpresaId ? 'Editar Empresa' : 'Nova Empresa'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEmpresaModalOpen(false)}
                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveEmpresa} className="flex-1 overflow-y-auto p-space-lg space-y-4 text-xs">
              {/* Razão Social & Nome Fantasia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Ex: ABC Recuperação de Ativos Ltda"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Ex: ABC Cobranças"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* CNPJ & IE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-data-mono font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Inscrição Estadual (Opcional)
                  </label>
                  <input
                    type="text"
                    value={inscricaoEstadual}
                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                    placeholder="Ex: 123.456.789.000"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-data-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Telefone & E-mail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Telefone Corporativo
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 0000-0000"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-data-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com.br"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="p-3 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 space-y-2">
                <span className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block">
                  Endereço da Sede
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="text-[10px] text-on-surface-variant block mb-0.5">CEP</label>
                    <input
                      type="text"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="00000-000"
                      className="w-full px-2.5 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-data-mono focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-on-surface-variant block mb-0.5">Logradouro</label>
                    <input
                      type="text"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Av. / Rua..."
                      className="w-full px-2.5 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-on-surface-variant block mb-0.5">Número</label>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="123"
                      className="w-full px-2.5 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant block mb-0.5">Complemento</label>
                    <input
                      type="text"
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      placeholder="Sala 10"
                      className="w-full px-2.5 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant block mb-0.5">Bairro</label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Centro"
                      className="w-full px-2.5 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-on-surface-variant block mb-0.5">Cidade / UF</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        placeholder="São Paulo"
                        className="w-full px-2 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface focus:outline-none"
                      />
                      <input
                        type="text"
                        maxLength={2}
                        value={estado}
                        onChange={(e) => setEstado(e.target.value.toUpperCase())}
                        placeholder="SP"
                        className="w-12 text-center uppercase px-1 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-data-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modo de Carteira */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
                <label className="font-label-uppercase text-[10px] text-primary font-bold uppercase tracking-wider block">
                  Modo de Carteira
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      modoCarteira === 'COMPARTILHADA'
                        ? 'bg-sky-50 border-sky-400 text-sky-900 font-semibold'
                        : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modoCarteira"
                      value="COMPARTILHADA"
                      checked={modoCarteira === 'COMPARTILHADA'}
                      onChange={() => setModoCarteira('COMPARTILHADA')}
                      className="accent-primary"
                    />
                    <div>
                      <div className="text-xs">Compartilhada</div>
                      <div className="text-[10px] font-normal text-on-surface-variant leading-tight mt-0.5">
                        Cobranças podem ser visualizadas conjuntamente por usuários autorizados.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      modoCarteira === 'EXCLUSIVA'
                        ? 'bg-purple-50 border-purple-400 text-purple-900 font-semibold'
                        : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modoCarteira"
                      value="EXCLUSIVA"
                      checked={modoCarteira === 'EXCLUSIVA'}
                      onChange={() => setModoCarteira('EXCLUSIVA')}
                      className="accent-primary"
                    />
                    <div>
                      <div className="text-xs">Exclusiva</div>
                      <div className="text-[10px] font-normal text-on-surface-variant leading-tight mt-0.5">
                        Cobranças restritas unicamente aos operadores designados para esta empresa.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Status Ativo Toggle */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="font-semibold text-on-surface text-xs">
                    Empresa Ativa no Sistema
                  </span>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEmpresaModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-container text-surface rounded-lg font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  {editingEmpresaId ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GERENCIAR DADOS DE RECEBIMENTO DA EMPRESA                          */}
      {/* ========================================================================= */}
      {managingPaymentsEmpresa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-scrim/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-space-md border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  account_balance
                </span>
                <div>
                  <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Dados de Recebimento — {managingPaymentsEmpresa.nomeFantasia}
                  </h2>
                  <span className="text-[11px] text-on-surface-variant font-data-mono">
                    CNPJ: {managingPaymentsEmpresa.cnpj}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingPaymentsEmpresa(null)}
                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-space-md flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-on-surface-variant">
                  Chaves PIX e contas bancárias oficiais utilizadas pelos cobradores para envio ao devedor.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddPayment}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-container text-surface rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>+ Nova Chave / Dado</span>
                </button>
              </div>

              {/* Payment Records List */}
              <div className="space-y-2">
                {debtService.getCompanyPaymentData(managingPaymentsEmpresa.id).length === 0 ? (
                  <div className="p-8 text-center text-on-surface-variant italic bg-surface-container-low rounded-xl border border-dashed border-outline-variant/40">
                    Nenhum dado de recebimento cadastrado para esta empresa.
                  </div>
                ) : (
                  debtService.getCompanyPaymentData(managingPaymentsEmpresa.id).map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        item.isPrimary
                          ? 'bg-primary-container/10 border-primary/40 shadow-xs'
                          : 'bg-surface-container-low border-outline-variant/25'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[20px]">
                            {item.type === 'PIX' ? 'qr_code_2' : 'account_balance'}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-on-surface text-xs">
                              {item.description}
                            </span>
                            {item.isPrimary && (
                              <span className="px-1.5 py-0.2 rounded bg-primary text-surface font-badge-sm text-[9px] font-bold uppercase tracking-wider">
                                Principal
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.2 rounded font-badge-sm text-[9px] font-semibold ${
                                item.active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs font-data-mono">
                            <span className="text-outline-variant text-[11px]">Chave/Dado:</span>
                            <strong className="text-primary truncate">
                              {item.pixKey || item.paymentInfo}
                            </strong>
                            {item.pixKeyType && (
                              <span className="text-[10px] text-on-surface-variant bg-surface-container px-1 rounded">
                                {item.pixKeyType}
                              </span>
                            )}
                          </div>

                          {item.bankName && (
                            <span className="text-[11px] text-on-surface-variant mt-0.5 truncate">
                              {item.bankName} {item.accountDescription ? `• ${item.accountDescription}` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {!item.isPrimary && item.active && (
                          <button
                            type="button"
                            onClick={() => {
                              debtService.setPrimaryCompanyPaymentData(item.id);
                              showToast('Definido como dado principal!');
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-primary hover:bg-surface-container-high rounded transition-colors"
                            title="Tornar este dado o principal da empresa"
                          >
                            Tornar Principal
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditPayment(item)}
                          className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            debtService.toggleCompanyPaymentDataStatus(item.id);
                            showToast('Status do recebimento alterado.');
                          }}
                          className="p-1 rounded text-on-surface-variant hover:text-amber-700 hover:bg-surface-container transition-colors"
                          title={item.active ? 'Desativar' : 'Ativar'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {item.active ? 'toggle_on' : 'toggle_off'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Deseja excluir este dado de recebimento?')) {
                              debtService.deleteCompanyPaymentData(item.id);
                              showToast('Dado de recebimento removido.');
                            }
                          }}
                          className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-space-md border-t border-outline-variant/20 flex justify-end bg-surface-container-low shrink-0">
              <button
                type="button"
                onClick={() => setManagingPaymentsEmpresa(null)}
                className="px-4 py-2 rounded-lg bg-surface-container-highest hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL: ADICIONAR / EDITAR DADO DE RECEBIMENTO                        */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && managingPaymentsEmpresa && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-surface-scrim/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden">
            <div className="p-space-md border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
              <h3 className="font-title-md font-bold text-on-surface">
                {editingPaymentId ? 'Editar Dado de Recebimento' : 'Novo Dado de Recebimento'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-space-lg space-y-3 text-xs">
              <div>
                <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                  Tipo de Recebimento *
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentDataType)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface font-body-sm focus:outline-none"
                >
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="TED">TED / Transferência</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                  Identificação / Descrição *
                </label>
                <input
                  type="text"
                  required
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  placeholder="Ex: PIX CNPJ — Conta Principal Matriz"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
                />
              </div>

              {paymentType === 'PIX' && (
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Tipo de Chave PIX
                  </label>
                  <select
                    value={pixKeyType}
                    onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
                  >
                    <option value="CNPJ">CNPJ</option>
                    <option value="CPF">CPF</option>
                    <option value="E-mail">E-mail</option>
                    <option value="Telefone">Telefone</option>
                    <option value="Aleatória">Chave Aleatória (EVP)</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              )}

              <div>
                <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                  {paymentType === 'PIX' ? 'Chave PIX *' : 'Informação de Pagamento / Código *'}
                </label>
                <input
                  type="text"
                  required
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder={paymentType === 'PIX' ? 'Informe a chave PIX exata' : 'Dados da conta / boleto'}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface font-data-mono font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Banco (Opcional)
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ex: Banco Itaú (341)"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Agência / Conta (Opcional)
                  </label>
                  <input
                    type="text"
                    value={accountDescription}
                    onChange={(e) => setAccountDescription(e.target.value)}
                    placeholder="Ag. 1234 • C/C 5678-9"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimaryPayment}
                    onChange={(e) => setIsPrimaryPayment(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="font-semibold text-on-surface text-xs">
                    Definir como Dado Principal desta Empresa
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-container text-surface rounded-lg font-semibold shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
