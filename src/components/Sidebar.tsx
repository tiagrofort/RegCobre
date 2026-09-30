import React from 'react';
import { RegCobreLogo } from './RegCobreLogo';
import { useAuth } from '../context/AuthContext';

export type NavScreen =
  | 'dashboard-do-cobrador'
  | 'minha-carteira'
  | 'ficha-cobranca'
  | 'agenda-de-retornos'
  | 'relatorio-diario'
  | 'base-de-devedores'
  | 'conferencia-de-cobrancas'
  | 'dashboard-gerencial'
  | 'importar-erp';

interface SidebarProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  portfolioCount?: number;
  returnsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  portfolioCount = 48,
  returnsCount = 6,
}) => {
  const { currentUser } = useAuth();
  const isSupervisor = currentUser?.role === 'supervisor';

  const isNavActive = (screen: NavScreen) => {
    if (screen === 'minha-carteira' && currentScreen === 'ficha-cobranca') {
      return true;
    }
    return currentScreen === screen;
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-primary-container z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] select-none">
      <div className="flex flex-col min-h-0 flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div
          className="h-16 px-space-lg flex items-center gap-space-sm border-b border-primary cursor-pointer"
          onClick={() => onNavigate(isSupervisor ? 'dashboard-gerencial' : 'dashboard-do-cobrador')}
        >
          <RegCobreLogo variant="dark" size="md" />
        </div>

        {/* Section: OPERACIONAL */}
        <div className="px-space-md py-space-sm">
          <div className="px-space-sm py-space-xs font-label-uppercase text-label-uppercase text-on-primary-container uppercase tracking-wider">
            Operacional
          </div>
          <nav className="flex flex-col gap-space-2xs mt-space-2xs">
            <button
              onClick={() => onNavigate('dashboard-do-cobrador')}
              className={`flex items-center justify-between px-space-sm py-space-xs rounded-lg transition-colors font-body-md text-body-md text-left cursor-pointer ${
                isNavActive('dashboard-do-cobrador')
                  ? 'bg-primary text-surface font-semibold'
                  : 'text-on-primary-container hover:bg-primary hover:text-surface'
              }`}
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Dashboard do Cobrador</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('minha-carteira')}
              className={`flex items-center justify-between px-space-sm py-space-xs rounded-lg transition-colors font-body-md text-body-md text-left cursor-pointer ${
                isNavActive('minha-carteira')
                  ? 'bg-primary text-surface font-semibold'
                  : 'text-on-primary-container hover:bg-primary hover:text-surface'
              }`}
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">folder_open</span>
                <span>Minha Carteira</span>
              </div>
              <span className="bg-secondary text-on-secondary px-space-xs py-space-2xs rounded-full font-badge-sm text-badge-sm">
                {portfolioCount}
              </span>
            </button>

            <button
              onClick={() => onNavigate('agenda-de-retornos')}
              className={`flex items-center justify-between px-space-sm py-space-xs rounded-lg transition-colors font-body-md text-body-md text-left cursor-pointer ${
                isNavActive('agenda-de-retornos')
                  ? 'bg-primary text-surface font-semibold'
                  : 'text-on-primary-container hover:bg-primary hover:text-surface'
              }`}
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">calendar_clock</span>
                <span>Agenda de Retornos</span>
              </div>
              <span className="bg-on-tertiary-container text-on-tertiary px-space-xs py-space-2xs rounded-full font-badge-sm text-badge-sm">
                {returnsCount}
              </span>
            </button>

            <button
              onClick={() => onNavigate('relatorio-diario')}
              className={`flex items-center justify-between px-space-sm py-space-xs rounded-lg transition-colors font-body-md text-body-md text-left cursor-pointer ${
                isNavActive('relatorio-diario')
                  ? 'bg-primary text-surface font-semibold'
                  : 'text-on-primary-container hover:bg-primary hover:text-surface'
              }`}
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">description</span>
                <span>Relatório Diário</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Section: SUPERVISÃO & DIRETORIA */}
        <div className="px-space-md py-space-xs border-t border-primary/40">
          <div className="px-space-sm py-space-xs flex items-center justify-between">
            <span className="font-label-uppercase text-label-uppercase text-secondary-fixed font-bold uppercase tracking-wider">
              Supervisão & Diretoria
            </span>
            <span className="font-badge-sm text-[10px] px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold uppercase">
              Gestão
            </span>
          </div>
          <nav className="flex flex-col gap-space-2xs mt-space-2xs">
            <button
              onClick={() => onNavigate('conferencia-de-cobrancas')}
              className={`flex items-center justify-between px-space-sm py-space-xs rounded-lg transition-colors font-body-md text-body-md text-left cursor-pointer ${
                isNavActive('conferencia-de-cobrancas')
                  ? 'bg-primary text-surface font-semibold'
                  : 'text-on-primary-container hover:bg-primary hover:text-surface'
              }`}
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">fact_check</span>
                <span>Conferência Cobranças</span>
              </div>
              <span className="bg-primary-fixed text-on-primary-fixed px-1.5 py-0.5 rounded font-badge-sm text-[10px] uppercase font-bold">
                Auditoria
              </span>
            </button>

            <button
              onClick={() => onNavigate('dashboard-gerencial')}
              className={`flex items-center justify-between px-space-sm py-space-xs rounded-lg transition-colors font-body-md text-body-md text-left cursor-pointer ${
                isNavActive('dashboard-gerencial')
                  ? 'bg-primary text-surface font-semibold'
                  : 'text-on-primary-container hover:bg-primary hover:text-surface'
              }`}
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[18px]">monitoring</span>
                <span>Dashboard Gerencial</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Section: FERRAMENTAS & DADOS */}
        <div className="px-space-md py-space-xs border-t border-primary/40">
          <div className="px-space-sm py-space-xs font-label-uppercase text-label-uppercase text-on-primary-container uppercase tracking-wider">
            Ferramentas & Dados
          </div>
          <nav className="flex flex-col gap-space-2xs mt-space-2xs">
            <button
              onClick={() => onNavigate('base-de-devedores')}
              className={`flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg transition-colors font-body-md text-body-md text-left cursor-pointer w-full ${
                isNavActive('base-de-devedores')
                  ? 'bg-primary text-surface font-semibold'
                  : 'text-on-primary-container hover:bg-primary hover:text-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span>Base de Devedores</span>
            </button>

            <button
              onClick={() => onNavigate('importar-erp')}
              className={`flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg transition-colors font-body-md text-body-md text-left cursor-pointer w-full ${
                isNavActive('importar-erp')
                  ? 'bg-primary text-surface font-semibold'
                  : 'text-on-primary-container hover:bg-primary hover:text-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              <span>Importar ERP</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-space-md border-t border-primary shrink-0">
        <div className="bg-primary px-space-sm py-space-xs rounded-lg flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-uppercase text-label-uppercase text-on-primary-container">
              Ambiente Produção
            </span>
            <span className="font-data-mono text-data-mono text-surface font-semibold">
              v3.8.4-corp
            </span>
          </div>
          <span className="material-symbols-outlined text-secondary-fixed text-[16px]">
            verified_user
          </span>
        </div>
      </div>
    </aside>
  );
};
