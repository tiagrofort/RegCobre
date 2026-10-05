import React, { useState, useEffect } from 'react';
import { debtService } from '../services/debtService';
import { User, UserRole, Empresa } from '../types';

export const UsuariosView: React.FC = () => {
  const [users, setUsers] = useState<User[]>(debtService.getAllUsers());
  const [empresas, setEmpresas] = useState<Empresa[]>(debtService.getAllEmpresas());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [empresaFilter, setEmpresaFilter] = useState<string>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Subscribe to service updates
  useEffect(() => {
    return debtService.subscribe(() => {
      setUsers(debtService.getAllUsers());
      setEmpresas(debtService.getAllEmpresas());
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('cobrador');
  const [roleTitle, setRoleTitle] = useState('');
  const [unit, setUnit] = useState('');
  const [badgeCode, setBadgeCode] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [empresaPrincipalId, setEmpresaPrincipalId] = useState('');
  const [empresasAcessoIds, setEmpresasAcessoIds] = useState<string[]>([]);

  const activeEmpresas = empresas.filter((e) => e.ativo);

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setName('');
    setUsername('');
    setEmail('');
    setRole('cobrador');
    setRoleTitle('Cobrador Operacional');
    setUnit('Matriz');
    setBadgeCode(`RC-${Math.floor(1000 + Math.random() * 9000)}`);
    setAtivo(true);
    const defaultEmp = activeEmpresas[0]?.id || 'emp-matriz';
    setEmpresaPrincipalId(defaultEmp);
    setEmpresasAcessoIds([defaultEmp]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUserId(user.id);
    setName(user.name);
    setUsername(user.username || user.email.split('@')[0]);
    setEmail(user.email);
    setRole(user.role);
    setRoleTitle(user.roleTitle || '');
    setUnit(user.unit || '');
    setBadgeCode(user.badgeCode || '');
    setAtivo(user.ativo);
    setEmpresaPrincipalId(user.empresaPrincipalId);
    setEmpresasAcessoIds(user.empresasAcessoIds || [user.empresaPrincipalId]);
    setIsModalOpen(true);
  };

  // Sync empresaPrincipal with access list: principal must always be included
  const handleSelectEmpresaPrincipal = (empId: string) => {
    setEmpresaPrincipalId(empId);
    if (!empresasAcessoIds.includes(empId)) {
      setEmpresasAcessoIds([...empresasAcessoIds, empId]);
    }
  };

  const handleToggleEmpresaAcesso = (empId: string) => {
    if (empId === empresaPrincipalId) {
      // Cannot uncheck primary company
      return;
    }
    if (empresasAcessoIds.includes(empId)) {
      setEmpresasAcessoIds(empresasAcessoIds.filter((id) => id !== empId));
    } else {
      setEmpresasAcessoIds([...empresasAcessoIds, empId]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Por favor, informe o nome do usuário.');
      return;
    }
    if (!username.trim()) {
      showToast('Por favor, informe o nome de usuário (login).');
      return;
    }
    if (!email.trim()) {
      showToast('Por favor, informe o e-mail corporativo.');
      return;
    }
    if (!empresaPrincipalId) {
      showToast('Por favor, selecione a empresa principal do usuário.');
      return;
    }

    // Ensure primary company is part of access IDs
    const finalAccessIds = Array.from(new Set([empresaPrincipalId, ...empresasAcessoIds]));

    if (editingUserId) {
      debtService.updateUser(editingUserId, {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        role,
        roleTitle: roleTitle.trim() || undefined,
        unit: unit.trim() || undefined,
        badgeCode: badgeCode.trim() || undefined,
        ativo,
        empresaPrincipalId,
        empresasAcessoIds: finalAccessIds,
      });
      showToast('Usuário atualizado com sucesso!');
    } else {
      debtService.addUser({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        role,
        roleTitle: roleTitle.trim() || 'Cobrador Operacional',
        unit: unit.trim() || 'Matriz',
        badgeCode: badgeCode.trim() || `RC-${Math.floor(1000 + Math.random() * 9000)}`,
        ativo,
        empresaPrincipalId,
        empresasAcessoIds: finalAccessIds,
      });
      showToast('Novo usuário cadastrado com sucesso!');
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = (user: User) => {
    debtService.toggleUserStatus(user.id);
    showToast(`Usuário "${user.name}" ${user.ativo ? 'desativado' : 'ativado'}.`);
  };

  const handleDelete = (user: User) => {
    if (confirm(`Deseja realmente excluir o usuário "${user.name}"?`)) {
      const res = debtService.deleteUser(user.id);
      if (res.success) {
        showToast('Usuário removido com sucesso.');
      } else {
        alert(res.message || 'Não foi possível excluir.');
      }
    }
  };

  // Filtered List
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.badgeCode && u.badgeCode.toLowerCase().includes(q));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    const matchesEmpresa =
      empresaFilter === 'all' ||
      u.empresaPrincipalId === empresaFilter ||
      (u.empresasAcessoIds && u.empresasAcessoIds.includes(empresaFilter));

    return matchesSearch && matchesRole && matchesEmpresa;
  });

  const totalAtivos = users.filter((u) => u.ativo).length;
  const totalCobradores = users.filter((u) => u.role === 'cobrador').length;
  const totalSupervisores = users.filter((u) => u.role === 'supervisor' || u.role === 'administrador').length;

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
              manage_accounts
            </span>
            <h1 className="font-headline-md text-headline-md text-on-surface font-bold">
              Cadastro de Usuários
            </h1>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Gestão de cobradores, supervisores, perfis e vínculo de acessos por empresa.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-space-md py-2 bg-primary hover:bg-primary-container text-surface rounded-lg font-title-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span>+ Novo Usuário</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-space-md">
        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between">
          <span className="font-label-uppercase text-label-uppercase text-on-surface-variant font-medium">
            Total de Usuários
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-headline-md font-bold font-data-mono text-2xl text-on-surface">
              {users.length}
            </span>
            <span className="material-symbols-outlined text-outline-variant text-[24px]">
              group
            </span>
          </div>
        </div>

        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between">
          <span className="font-label-uppercase text-label-uppercase text-on-surface-variant font-medium">
            Usuários Ativos
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-headline-md font-bold font-data-mono text-2xl text-emerald-600">
              {totalAtivos}
            </span>
            <span className="material-symbols-outlined text-emerald-600/50 text-[24px]">
              verified_user
            </span>
          </div>
        </div>

        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between">
          <span className="font-label-uppercase text-label-uppercase text-on-surface-variant font-medium">
            Cobradores / Operadores
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-headline-md font-bold font-data-mono text-2xl text-sky-700">
              {totalCobradores}
            </span>
            <span className="material-symbols-outlined text-sky-600/50 text-[24px]">
              support_agent
            </span>
          </div>
        </div>

        <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs flex flex-col justify-between">
          <span className="font-label-uppercase text-label-uppercase text-on-surface-variant font-medium">
            Supervisores / Admin
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-headline-md font-bold font-data-mono text-2xl text-purple-700">
              {totalSupervisores}
            </span>
            <span className="material-symbols-outlined text-purple-600/50 text-[24px]">
              shield_person
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
            placeholder="Buscar por nome, username, e-mail ou matrícula..."
            className="w-full pl-9 pr-3 py-2 bg-surface-container-low rounded-lg border-0 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os Perfis</option>
            <option value="cobrador">Cobrador / Operador</option>
            <option value="supervisor">Supervisor</option>
            <option value="administrador">Administrador</option>
          </select>

          {/* Empresa Filter */}
          <select
            value={empresaFilter}
            onChange={(e) => setEmpresaFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-low rounded-lg border border-outline-variant/30 font-body-sm text-body-sm text-on-surface focus:outline-none cursor-pointer"
          >
            <option value="all">Todas as Empresas</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nomeFantasia}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Users */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body-sm text-xs">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-uppercase tracking-wider border-b border-outline-variant/30">
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Perfil / Cargo</th>
                <th className="py-3 px-4">Empresa Principal</th>
                <th className="py-3 px-4">Empresas com Acesso</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant italic">
                    Nenhum usuário encontrado com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const empPrincipal = empresas.find((e) => e.id === user.empresaPrincipalId);
                  const acessos = (user.empresasAcessoIds || [])
                    .map((id) => empresas.find((e) => e.id === id))
                    .filter(Boolean) as Empresa[];

                  return (
                    <tr key={user.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <strong className="text-on-surface text-sm font-semibold truncate">
                              {user.name}
                            </strong>
                            <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px] font-data-mono">
                              <span>@{user.username || user.email.split('@')[0]}</span>
                              <span>•</span>
                              <span>{user.email}</span>
                            </div>
                            {user.badgeCode && (
                              <span className="text-[10px] text-outline-variant font-data-mono mt-0.5">
                                Matrícula: {user.badgeCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`px-2 py-0.5 rounded font-badge-sm text-[10px] font-bold uppercase tracking-wider ${
                              user.role === 'supervisor' || user.role === 'administrador'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-sky-100 text-sky-800 border border-sky-200'
                            }`}
                          >
                            {user.role}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {user.roleTitle || (user.role === 'cobrador' ? 'Cobrador' : 'Supervisor')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            domain
                          </span>
                          <span className="font-semibold text-primary text-xs">
                            {empPrincipal ? empPrincipal.nomeFantasia : 'Não vinculada'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {acessos.length === 0 ? (
                            <span className="text-on-surface-variant italic text-[11px]">Nenhum</span>
                          ) : (
                            acessos.map((emp) => (
                              <span
                                key={emp.id}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  emp.id === user.empresaPrincipalId
                                    ? 'bg-primary/10 text-primary border-primary/30 font-semibold'
                                    : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                                }`}
                                title={emp.razaoSocial}
                              >
                                {emp.nomeFantasia}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-badge-sm text-[10px] font-semibold ${
                            user.ativo
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.ativo ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                          />
                          <span>{user.ativo ? 'Ativo' : 'Inativo'}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            title="Editar Usuário"
                            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActive(user)}
                            title={user.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
                            className="p-1 rounded text-on-surface-variant hover:text-amber-700 hover:bg-surface-container transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {user.ativo ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            title="Excluir Usuário"
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
      {/* MODAL: CADASTRO / EDIÇÃO DE USUÁRIO                                      */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-scrim/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-space-md border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  {editingUserId ? 'manage_accounts' : 'person_add'}
                </span>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {editingUserId ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-space-lg space-y-4 text-xs">
              {/* Nome & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silveira"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Username (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="carlos.eduardo"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-data-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Email & Perfil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@empresa.com.br"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Perfil / Função *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="cobrador">Cobrador / Operador</option>
                    <option value="supervisor">Supervisor de Cobrança</option>
                    <option value="administrador">Administrador Geral</option>
                  </select>
                </div>
              </div>

              {/* Cargo & Matrícula */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Título do Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Ex: Cobrador Sênior"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-label-uppercase text-[10px] text-outline font-bold uppercase tracking-wider block mb-1">
                    Código Crachá / Matrícula
                  </label>
                  <input
                    type="text"
                    value={badgeCode}
                    onChange={(e) => setBadgeCode(e.target.value)}
                    placeholder="Ex: RC-4412"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-data-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Empresa Principal */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1">
                <label className="font-label-uppercase text-[10px] text-primary font-bold uppercase tracking-wider block">
                  Empresa Principal *
                </label>
                <p className="text-[11px] text-on-surface-variant mb-2">
                  Empresa à qual o colaborador está vinculado profissionalmente.
                </p>
                <select
                  required
                  value={empresaPrincipalId}
                  onChange={(e) => handleSelectEmpresaPrincipal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {activeEmpresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nomeFantasia} ({emp.razaoSocial})
                    </option>
                  ))}
                </select>
              </div>

              {/* Empresas com Acesso */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-2">
                <label className="font-label-uppercase text-[10px] text-primary font-bold uppercase tracking-wider block">
                  Empresas com Acesso Autorizado
                </label>
                <p className="text-[11px] text-on-surface-variant">
                  Marque as empresas cujas cobranças este usuário tem autorização para visualizar e operar.
                </p>

                <div className="space-y-1.5 pt-1">
                  {activeEmpresas.map((emp) => {
                    const isPrincipal = emp.id === empresaPrincipalId;
                    const isChecked = empresasAcessoIds.includes(emp.id) || isPrincipal;

                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                          isPrincipal
                            ? 'bg-primary/5 border-primary/30 font-semibold text-primary'
                            : isChecked
                            ? 'bg-surface-container-lowest border-outline-variant/40 text-on-surface'
                            : 'bg-surface-container-lowest/50 border-outline-variant/20 text-on-surface-variant'
                        } cursor-pointer`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isPrincipal}
                            onChange={() => handleToggleEmpresaAcesso(emp.id)}
                            className="w-4 h-4 accent-primary rounded"
                          />
                          <div>
                            <span className="text-xs">{emp.nomeFantasia}</span>
                            <span className="text-[10px] text-on-surface-variant ml-2 font-data-mono">
                              {emp.cnpj}
                            </span>
                          </div>
                        </div>

                        {isPrincipal && (
                          <span className="px-1.5 py-0.5 rounded bg-primary text-surface font-badge-sm text-[9px] font-bold uppercase tracking-wider">
                            Principal (Obrigatório)
                          </span>
                        )}
                      </label>
                    );
                  })}
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
                    Usuário Ativo no Sistema
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-container text-surface rounded-lg font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  {editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
