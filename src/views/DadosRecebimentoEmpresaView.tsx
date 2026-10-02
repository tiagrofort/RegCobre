import React, { useState, useEffect } from 'react';
import { debtService } from '../services/debtService';
import { CompanyPaymentData, PaymentDataType, PixKeyType } from '../types';

export const DadosRecebimentoEmpresaView: React.FC = () => {
  const [payments, setPayments] = useState<CompanyPaymentData[]>(debtService.getCompanyPaymentData());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Subscribe to service updates
  useEffect(() => {
    return debtService.subscribe(() => {
      setPayments(debtService.getCompanyPaymentData());
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<PaymentDataType>('PIX');
  const [description, setDescription] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CNPJ');
  const [pixKey, setPixKey] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountDescription, setAccountDescription] = useState('');
  const [active, setActive] = useState(true);
  const [isPrimary, setIsPrimary] = useState(false);

  const handleOpenAdd = () => {
    setEditingId(null);
    setType('PIX');
    setDescription('');
    setPixKeyType('CNPJ');
    setPixKey('');
    setBankName('');
    setAccountDescription('');
    setActive(true);
    setIsPrimary(payments.length === 0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CompanyPaymentData) => {
    setEditingId(item.id);
    setType(item.type);
    setDescription(item.description);
    setPixKeyType(item.pixKeyType || 'CNPJ');
    setPixKey(item.pixKey || item.paymentInfo || '');
    setBankName(item.bankName || '');
    setAccountDescription(item.accountDescription || '');
    setActive(item.active);
    setIsPrimary(item.isPrimary);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey.trim()) {
      showToast('Por favor, informe a chave PIX ou dado para pagamento.');
      return;
    }
    if (!description.trim()) {
      showToast('Por favor, informe a descrição ou identificação do dado.');
      return;
    }

    if (editingId) {
      debtService.updateCompanyPaymentData(editingId, {
        type,
        description: description.trim(),
        pixKeyType: type === 'PIX' ? pixKeyType : undefined,
        pixKey: pixKey.trim(),
        paymentInfo: pixKey.trim(),
        bankName: bankName.trim() || undefined,
        accountDescription: accountDescription.trim() || undefined,
        active,
        isPrimary,
      });
      showToast('Dado de recebimento da empresa atualizado com sucesso!');
    } else {
      debtService.addCompanyPaymentData({
        type,
        description: description.trim(),
        pixKeyType: type === 'PIX' ? pixKeyType : undefined,
        pixKey: pixKey.trim(),
        paymentInfo: pixKey.trim(),
        bankName: bankName.trim() || undefined,
        accountDescription: accountDescription.trim() || undefined,
        active,
        isPrimary,
      });
      showToast('Novo dado de recebimento cadastrado para a empresa!');
    }
    setIsModalOpen(false);
  };

  const handleToggleActive = (item: CompanyPaymentData) => {
    debtService.toggleCompanyPaymentDataStatus(item.id);
    showToast(
      item.active
        ? `Dado "${item.description}" desativado.`
        : `Dado "${item.description}" ativado.`
    );
  };

  const handleSetPrimary = (item: CompanyPaymentData) => {
    debtService.setPrimaryCompanyPaymentData(item.id);
    showToast(`"${item.description}" definido como dado principal de recebimento da empresa!`);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`${label} copiado: ${text}`);
  };

  const activeCount = payments.filter((p) => p.active).length;
  const primaryItem = payments.find((p) => p.isPrimary);

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg max-w-[1720px] mx-auto w-full pb-20 animate-fade-in">
      {/* Header */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md border border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              account_balance
            </span>
            <span className="font-label-uppercase text-xs font-bold text-outline uppercase tracking-wider">
              Configurações / Empresa
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold mt-1">
            Dados de Recebimento da Empresa
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Chaves PIX e contas bancárias oficiais da empresa que os cobradores utilizam para repassar aos clientes devedores.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="h-10 px-space-md rounded-lg bg-primary hover:bg-primary-container text-surface font-title-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer self-start md:self-auto shrink-0"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>+ Novo Dado de Recebimento</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="font-label-uppercase text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Total de Contas / Chaves
            </span>
            <span className="font-data-mono text-2xl font-bold text-primary mt-1 block">
              {payments.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="font-label-uppercase text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Chaves Ativas para Cobrança
            </span>
            <span className="font-data-mono text-2xl font-bold text-secondary mt-1 block">
              {activeCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="font-label-uppercase text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
              Chave Principal Definida
            </span>
            <span className="font-title-md text-sm font-bold text-primary mt-1 block truncate max-w-[200px]" title={primaryItem?.description}>
              {primaryItem ? primaryItem.description : 'Nenhuma definida'}
            </span>
            {primaryItem && (
              <span className="font-data-mono text-[11px] text-secondary font-semibold block truncate max-w-[200px]">
                {primaryItem.pixKey || primaryItem.paymentInfo}
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
            <span className="material-symbols-outlined text-[20px]">star</span>
          </div>
        </div>
      </div>

      {/* Main Table / Card List */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">format_list_bulleted</span>
            <h2 className="font-title-md font-bold text-primary text-sm uppercase tracking-wider">
              Contas e Chaves de Recebimento ({payments.length})
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant font-data-mono">
            Apenas 1 registro pode ser marcado como principal por vez
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-lowest">
            <span className="material-symbols-outlined text-outline text-[40px] mb-2 block">
              account_balance
            </span>
            <p className="font-body-md text-sm text-on-surface-variant">
              Nenhum dado de recebimento cadastrado para a empresa.
            </p>
            <button
              onClick={handleOpenAdd}
              type="button"
              className="mt-3 px-4 py-2 rounded-lg bg-secondary hover:bg-on-secondary-container text-on-secondary font-semibold text-xs transition-colors cursor-pointer"
            >
              Cadastrar Primeiro Dado
            </button>
          </div>
        ) : (
          <div className="divide-y divide-surface-container-high">
            {payments.map((item) => (
              <div
                key={item.id}
                className={`p-4 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  item.isPrimary
                    ? 'bg-surface-container-low/60 border-l-4 border-primary'
                    : item.active
                    ? 'hover:bg-surface-container-low/40'
                    : 'bg-surface-container/30 opacity-70'
                }`}
              >
                {/* Left: Info */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-badge-sm text-xs font-bold uppercase">
                      {item.type} {item.pixKeyType ? `• ${item.pixKeyType}` : ''}
                    </span>

                    {item.isPrimary && (
                      <span className="px-2 py-0.5 rounded-full bg-primary text-surface font-badge-sm text-[10px] font-bold uppercase flex items-center gap-1 shadow-2xs">
                        <span className="material-symbols-outlined text-[12px]">star</span>
                        Principal (Padrão)
                      </span>
                    )}

                    <strong className="text-sm font-bold text-primary truncate max-w-[320px]">
                      {item.description}
                    </strong>

                    <span
                      className={`px-2 py-0.5 rounded font-badge-sm text-[10px] font-bold ${
                        item.active
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-container-highest text-outline'
                      }`}
                    >
                      {item.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Chave PIX ou Info */}
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <span className="text-xs text-on-surface-variant font-label-uppercase font-semibold">
                      Chave / Informação:
                    </span>
                    <span className="font-data-mono text-sm font-bold text-on-surface bg-surface-container px-2.5 py-1 rounded border border-outline-variant/20 select-all inline-block">
                      {item.pixKey || item.paymentInfo}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.pixKey || item.paymentInfo || '', 'Chave de Recebimento')}
                      className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                      title="Copiar chave"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                  </div>

                  {/* Detalhes bancários opcionais */}
                  {(item.bankName || item.accountDescription) && (
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[15px] text-outline">account_balance</span>
                      {item.bankName && <span className="font-semibold text-primary">{item.bankName}</span>}
                      {item.bankName && item.accountDescription && <span>•</span>}
                      {item.accountDescription && <span>{item.accountDescription}</span>}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center flex-wrap">
                  {!item.isPrimary && item.active && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(item)}
                      className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-primary hover:text-surface text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Definir este dado como principal para a empresa"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">star</span>
                      <span>Tornar Principal</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Editar informações"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      item.active
                        ? 'bg-surface-container text-on-surface-variant hover:bg-error-container hover:text-on-error-container'
                        : 'bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary'
                    }`}
                    title={item.active ? 'Desativar este dado' : 'Ativar este dado'}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {item.active ? 'pause_circle' : 'play_circle'}
                    </span>
                    <span>{item.active ? 'Desativar' : 'Ativar'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions Card */}
      <div className="bg-surface-container-low rounded-xl p-space-md border border-outline-variant/30 flex items-start gap-3">
        <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
          info
        </span>
        <div className="text-xs text-on-surface-variant space-y-1">
          <strong className="text-on-surface block font-semibold">
            Como funciona a utilização dos dados de recebimento no RegCobre:
          </strong>
          <p>
            1. Todos os dados cadastrados nesta tela pertencem à <strong>empresa credora</strong> e ficam disponíveis para a equipe de cobrança na <strong>Ficha da Cobrança</strong> através do botão <em>"Copiar PIX / Dados"</em>.
          </p>
          <p>
            2. O registro marcado como <strong>Principal</strong> é o primeiro sugerido e o acionado no clique direto de cópia rápida.
          </p>
          <p>
            3. Nenhum dado financeiro ou chave PIX pertence ao devedor; o cadastro do devedor é restrito a contatos e telefones.
          </p>
        </div>
      </div>

      {/* Modal: Adicionar / Editar Dado de Recebimento da Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-lg w-full border border-outline-variant/30 overflow-hidden animate-fade-in">
            <div className="p-4 bg-primary text-surface flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
                  account_balance
                </span>
                <h3 className="font-title-md font-bold text-sm">
                  {editingId ? 'Editar Dado de Recebimento da Empresa' : 'Novo Dado de Recebimento da Empresa'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-surface hover:opacity-80 cursor-pointer p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    MODALIDADE *
                  </label>
                  <select
                    className="w-full h-9 px-2 bg-surface-container-low rounded-lg text-xs font-semibold text-on-surface border border-outline-variant/30 focus:outline-none"
                    value={type}
                    onChange={(e) => setType(e.target.value as PaymentDataType)}
                  >
                    <option value="PIX">PIX</option>
                    <option value="Outro">Outro (Conta Corrente / Depósito)</option>
                  </select>
                </div>

                {type === 'PIX' ? (
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
                      TIPO
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Transferência / TED"
                      className="w-full h-9 px-2 bg-surface-container rounded-lg text-xs text-on-surface-variant border border-outline-variant/30"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                  CHAVE PIX / DADO PRINCIPAL DE PAGAMENTO *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    type === 'PIX'
                      ? 'Ex: 03.456.789/0001-90 ou financeiro@regcobre.com.br'
                      : 'Ex: Agência 0450 C/C 18234-9'
                  }
                  className="w-full h-9 px-3 bg-surface-container-low rounded-lg font-data-mono text-sm text-on-surface border border-outline-variant/30 focus:outline-none focus:border-secondary"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                  DESCRIÇÃO / IDENTIFICAÇÃO DO DADO *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PIX CNPJ — Conta Principal, PIX E-mail Acordos Comerciais"
                  className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-secondary"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    INSTITUIÇÃO FINANCEIRA / BANCO (OPCIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Banco Itaú (341), Santander"
                    className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-secondary"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-label-uppercase font-bold text-outline mb-1 text-[10px]">
                    AGÊNCIA / CONTA / TITULARIDADE (OPCIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ag: 0450 • C/C: 18234-9"
                    className="w-full h-9 px-3 bg-surface-container-low rounded-lg text-xs text-on-surface border border-outline-variant/30 focus:outline-none focus:border-secondary"
                    value={accountDescription}
                    onChange={(e) => setAccountDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Status and Primary Toggles */}
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-on-surface block text-xs">
                      Definir como Chave Principal
                    </span>
                    <span className="text-[11px] text-on-surface-variant block">
                      Ao marcar, esta chave se tornará o dado padrão da empresa (desmarcando a anterior automaticamente).
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="accent-secondary h-4 w-4 shrink-0"
                  />
                </label>

                <div className="h-px bg-outline-variant/20" />

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-on-surface block text-xs">
                      Status do Registro (Ativo)
                    </span>
                    <span className="text-[11px] text-on-surface-variant block">
                      Apenas chaves ativas ficam visíveis para os operadores na Ficha de Cobrança.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="accent-secondary h-4 w-4 shrink-0"
                  />
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-primary-container text-surface font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Dado de Recebimento'}
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
