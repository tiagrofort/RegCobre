import React from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onOpenQuickContact?: () => void;
  onNavigate?: (screen: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onOpenQuickContact,
  onNavigate,
}) => {
  const { currentUser, logout, switchProfile } = useAuth();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-space-lg flex items-center justify-between gap-space-lg border-b border-outline-variant/30">
      {/* Search Input */}
      <div className="flex-1 max-w-md">
        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-space-sm text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            className="w-full h-9 pl-9 pr-space-sm bg-surface-container-low rounded-lg border-0 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary-container"
            placeholder="Buscar por CPF/CNPJ, Código ERP ou Nome..."
            type="text"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      {/* Utilities & Operator Info */}
      <div className="flex items-center gap-space-lg">
        {/* Network status badge */}
        <div className="hidden xl:flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-low">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
            Rede Interna Corp - Online
          </span>
        </div>

        {/* Daily Goal Cockpit Bar */}
        <div className="hidden md:flex flex-col items-end">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
              Meta Hoje:
            </span>
            <span className="font-data-mono text-data-mono text-on-surface font-semibold">
              24/40
            </span>
          </div>
          <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden mt-space-2xs">
            <div className="h-full bg-secondary rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Action Button: + Novo Contato */}
        <button
          className="h-9 px-space-md bg-primary-container hover:bg-primary text-surface font-title-md text-title-md rounded-lg flex items-center gap-space-xs transition-colors shadow-sm cursor-pointer"
          type="button"
          onClick={onOpenQuickContact}
          title="Registrar novo contato"
        >
          <span className="material-symbols-outlined text-[18px]">add_call</span>
          <span className="font-body-sm text-body-sm font-semibold">+ Novo Contato</span>
        </button>

        <div className="h-8 w-px bg-outline-variant"></div>

        {/* User Identity / Automatic Operator */}
        <div className="flex items-center gap-space-sm">
          <div className="hidden lg:flex flex-col text-right">
            <span className="font-title-md text-title-md text-on-surface leading-tight font-semibold">
              {currentUser?.name || 'Operador'}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
              {currentUser?.roleTitle || 'Cobrança Corp'}
            </span>
          </div>

          <div
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary cursor-pointer shadow-sm"
            title={`Conectado como: ${currentUser?.name}`}
          >
            <span className="material-symbols-outlined text-on-primary text-[18px]">
              person
            </span>
          </div>

          {/* Role switcher shortcut for quick testing */}
          <button
            onClick={() =>
              switchProfile(currentUser?.role === 'cobrador' ? 'supervisor' : 'cobrador')
            }
            title={
              currentUser?.role === 'cobrador'
                ? 'Alternar para visão de Supervisor'
                : 'Alternar para visão de Cobrador'
            }
            className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors text-[11px] font-data-mono font-medium hidden sm:flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">switch_account</span>
            <span className="text-[10px] uppercase font-bold">
              {currentUser?.role === 'cobrador' ? 'Cobrador' : 'Supervisor'}
            </span>
          </button>

          {/* Logout button */}
          <button
            className="p-space-xs text-on-surface-variant hover:text-error transition-colors flex items-center cursor-pointer"
            onClick={logout}
            title="Encerrar Sessão (Sair)"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
