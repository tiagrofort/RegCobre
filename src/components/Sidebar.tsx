import React from 'react';
import { RegCobreLogo } from './RegCobreLogo';
import { useAuth } from '../context/AuthContext';

export type NavScreen =
  | 'trabalho-de-hoje'
  | 'minha-carteira'
  | 'ficha-cobranca'
  | 'agenda-de-retornos'
  | 'producao-do-dia'
  | 'base-de-devedores'
  | 'conferencia-de-cobrancas'
  | 'dashboard-gerencial'
  | 'importar-erp'
  | 'empresas'
  | 'usuarios'
  | 'dados-recebimento-empresa';

interface SidebarProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  portfolioCount?: number;
  returnsCount?: number;
  unworkedTodayCount?: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  portfolioCount = 48,
  returnsCount = 6,
  unworkedTodayCount = 24,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { currentUser } = useAuth();
  const isSupervisor = currentUser?.role === 'supervisor' || currentUser?.role === 'administrador';

  const isNavActive = (screen: NavScreen) => {
    if (screen === 'trabalho-de-hoje' && (currentScreen === 'trabalho-de-hoje' || currentScreen === 'ficha-cobranca')) {
      return true;
    }
    return currentScreen === screen;
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full ${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-primary-container z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] select-none transition-[width] duration-300 ease-in-out`}
    >
      <div className="flex flex-col min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {/* Brand Header with Toggle Button */}
        <div className="h-16 px-3 flex items-center justify-between border-b border-primary relative shrink-0">
          {!isCollapsed ? (
            <>
              <div
                className="cursor-pointer overflow-hidden flex items-center gap-2"
                onClick={() => onNavigate(isSupervisor ? 'dashboard-gerencial' : 'trabalho-de-hoje')}
                title="RegCobre - Início"
              >
                <RegCobreLogo variant="dark" size="md" />
              </div>
              <button
                onClick={onToggleCollapse}
                aria-label="Recolher menu lateral"
                title="Recolher menu lateral"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-primary-container hover:text-surface hover:bg-primary transition-colors cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between px-1">
              <div
                className="cursor-pointer shrink-0 flex items-center justify-center p-1 rounded hover:bg-primary/50 transition-colors"
                onClick={() => onNavigate(isSupervisor ? 'dashboard-gerencial' : 'trabalho-de-hoje')}
                title="RegCobre Corp - Início"
                aria-label="RegCobre Início"
              >
                {/* Shield emblem icon for collapsed state */}
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-sm"
                >
                  <path
                    d="M24 4L7 11V23.5C7 34.2 14.3 43.1 24 45.8C33.7 43.1 41 34.2 41 23.5V11L24 4Z"
                    fill="#0F2942"
                    stroke="#1E3E62"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M24 14C18.477 14 14 18.477 14 24C14 29.523 18.477 34 24 34C28.2 34 31.78 31.42 33.24 27.75"
                    stroke="#006A61"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M22 24H33M33 24L28.5 19.5M33 24L28.5 28.5"
                    stroke="#006A61"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 19H26C27.657 19 29 20.343 29 22C29 23.657 27.657 25 26 25H21V19Z"
                    fill="#FFFFFF"
                  />
                  <path
                    d="M21 19V29M26 25L30 29"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="36" cy="15" r="2.5" fill="#86F2E4" />
                </svg>
              </div>
              <button
                onClick={onToggleCollapse}
                aria-label="Expandir menu lateral"
                title="Expandir menu lateral"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-primary-container hover:text-surface hover:bg-primary transition-colors cursor-pointer group relative shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-primary text-surface text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 font-sans border border-primary/40">
                  Expandir menu lateral
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Section: OPERAÇÃO */}
        <div className={isCollapsed ? 'px-2 py-space-sm' : 'px-space-md py-space-sm'}>
          {!isCollapsed ? (
            <div className="px-space-sm py-space-xs font-label-uppercase text-label-uppercase text-on-primary-container uppercase tracking-wider">
              Operação
            </div>
          ) : (
            <div className="w-8 h-px bg-primary/40 mx-auto my-1" />
          )}

          <nav className="flex flex-col gap-space-2xs mt-space-2xs">
            {/* 1. Trabalho de Hoje */}
            <button
              onClick={() => onNavigate('trabalho-de-hoje')}
              aria-label="Trabalho de Hoje"
              title={isCollapsed ? `Trabalho de Hoje (${unworkedTodayCount} pendentes)` : undefined}
              className={`rounded-lg transition-colors cursor-pointer group relative ${
                isCollapsed
                  ? `w-12 h-11 mx-auto flex items-center justify-center ${
                      isNavActive('trabalho-de-hoje')
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
                  : `flex items-center justify-between px-space-sm py-space-xs font-body-md text-body-md text-left ${
                      isNavActive('trabalho-de-hoje')
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
              }`}
            >
              {isCollapsed ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">play_circle</span>
                  {unworkedTodayCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-secondary text-on-secondary px-1 min-w-4 h-4 rounded-full font-badge-sm text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {unworkedTodayCount}
                    </span>
                  )}
                  {/* Floating Tooltip */}
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary text-surface text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 flex items-center gap-2 border border-primary/40">
                    <span>Trabalho de Hoje</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[10px] font-bold">
                      {unworkedTodayCount}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[18px]">play_circle</span>
                    <span>Trabalho de Hoje</span>
                  </div>
                  <span className="bg-secondary text-on-secondary px-space-xs py-space-2xs rounded-full font-badge-sm text-badge-sm font-semibold">
                    {unworkedTodayCount}
                  </span>
                </>
              )}
            </button>

            {/* 2. Minha Carteira */}
            <button
              onClick={() => onNavigate('minha-carteira')}
              aria-label="Minha Carteira"
              title={isCollapsed ? `Minha Carteira (${portfolioCount} títulos)` : undefined}
              className={`rounded-lg transition-colors cursor-pointer group relative ${
                isCollapsed
                  ? `w-12 h-11 mx-auto flex items-center justify-center ${
                      currentScreen === 'minha-carteira'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
                  : `flex items-center justify-between px-space-sm py-space-xs font-body-md text-body-md text-left ${
                      currentScreen === 'minha-carteira'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
              }`}
            >
              {isCollapsed ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">folder_open</span>
                  {portfolioCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-surface-container-high text-surface px-1 min-w-4 h-4 rounded-full font-badge-sm text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {portfolioCount}
                    </span>
                  )}
                  {/* Floating Tooltip */}
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary text-surface text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 flex items-center gap-2 border border-primary/40">
                    <span>Minha Carteira</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-surface-container-high text-surface text-[10px] font-bold">
                      {portfolioCount}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[18px]">folder_open</span>
                    <span>Minha Carteira</span>
                  </div>
                  <span className="bg-surface-container-high/40 text-surface px-space-xs py-space-2xs rounded-full font-badge-sm text-badge-sm">
                    {portfolioCount}
                  </span>
                </>
              )}
            </button>

            {/* 3. Agenda de Retornos */}
            <button
              onClick={() => onNavigate('agenda-de-retornos')}
              aria-label="Agenda de Retornos"
              title={isCollapsed ? `Agenda de Retornos (${returnsCount} agendados)` : undefined}
              className={`rounded-lg transition-colors cursor-pointer group relative ${
                isCollapsed
                  ? `w-12 h-11 mx-auto flex items-center justify-center ${
                      currentScreen === 'agenda-de-retornos'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
                  : `flex items-center justify-between px-space-sm py-space-xs font-body-md text-body-md text-left ${
                      currentScreen === 'agenda-de-retornos'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
              }`}
            >
              {isCollapsed ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">calendar_clock</span>
                  {returnsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-on-tertiary-container text-on-tertiary px-1 min-w-4 h-4 rounded-full font-badge-sm text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {returnsCount}
                    </span>
                  )}
                  {/* Floating Tooltip */}
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary text-surface text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 flex items-center gap-2 border border-primary/40">
                    <span>Agenda de Retornos</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-on-tertiary-container text-on-tertiary text-[10px] font-bold">
                      {returnsCount}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[18px]">calendar_clock</span>
                    <span>Agenda de Retornos</span>
                  </div>
                  <span className="bg-on-tertiary-container text-on-tertiary px-space-xs py-space-2xs rounded-full font-badge-sm text-badge-sm">
                    {returnsCount}
                  </span>
                </>
              )}
            </button>

            {/* 4. Produção do Dia */}
            <button
              onClick={() => onNavigate('producao-do-dia')}
              aria-label="Produção do Dia"
              title={isCollapsed ? 'Produção do Dia' : undefined}
              className={`rounded-lg transition-colors cursor-pointer group relative ${
                isCollapsed
                  ? `w-12 h-11 mx-auto flex items-center justify-center ${
                      currentScreen === 'producao-do-dia'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
                  : `flex items-center justify-between px-space-sm py-space-xs font-body-md text-body-md text-left ${
                      currentScreen === 'producao-do-dia'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
              }`}
            >
              {isCollapsed ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">description</span>
                  {/* Floating Tooltip */}
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary text-surface text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-primary/40">
                    <span>Produção do Dia</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  <span>Produção do Dia</span>
                </div>
              )}
            </button>
          </nav>
        </div>

        {/* Section: SUPERVISÃO & DIRETORIA (Visible for Supervisor / Admin) */}
        {isSupervisor && (
          <div className={isCollapsed ? 'px-2 py-space-xs border-t border-primary/40' : 'px-space-md py-space-xs border-t border-primary/40'}>
            {!isCollapsed ? (
              <div className="px-space-sm py-space-xs flex items-center justify-between">
                <span className="font-label-uppercase text-label-uppercase text-secondary-fixed font-bold uppercase tracking-wider">
                  Supervisão & Diretoria
                </span>
                <span className="font-badge-sm text-[10px] px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold uppercase">
                  Gestão
                </span>
              </div>
            ) : (
              <div className="w-8 h-px bg-primary/40 mx-auto my-1" />
            )}

            <nav className="flex flex-col gap-space-2xs mt-space-2xs">
              {/* Conferência */}
              <button
                onClick={() => onNavigate('conferencia-de-cobrancas')}
                aria-label="Conferência"
                title={isCollapsed ? 'Conferência (Auditoria)' : undefined}
                className={`rounded-lg transition-colors cursor-pointer group relative ${
                  isCollapsed
                    ? `w-12 h-11 mx-auto flex items-center justify-center ${
                        currentScreen === 'conferencia-de-cobrancas'
                          ? 'bg-primary text-surface font-semibold shadow-xs'
                          : 'text-on-primary-container hover:bg-primary hover:text-surface'
                      }`
                    : `flex items-center justify-between px-space-sm py-space-xs font-body-md text-body-md text-left ${
                        currentScreen === 'conferencia-de-cobrancas'
                          ? 'bg-primary text-surface font-semibold shadow-xs'
                          : 'text-on-primary-container hover:bg-primary hover:text-surface'
                      }`
                }`}
              >
                {isCollapsed ? (
                  <>
                    <span className="material-symbols-outlined text-[20px]">fact_check</span>
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary text-surface text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 flex items-center gap-2 border border-primary/40">
                      <span>Conferência</span>
                      <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase">
                        Auditoria
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-[18px]">fact_check</span>
                      <span>Conferência</span>
                    </div>
                    <span className="bg-primary-fixed text-on-primary-fixed px-1.5 py-0.5 rounded font-badge-sm text-[10px] uppercase font-bold">
                      Auditoria
                    </span>
                  </>
                )}
              </button>

              {/* Dashboard Gerencial */}
              <button
                onClick={() => onNavigate('dashboard-gerencial')}
                aria-label="Dashboard Gerencial"
                title={isCollapsed ? 'Dashboard Gerencial' : undefined}
                className={`rounded-lg transition-colors cursor-pointer group relative ${
                  isCollapsed
                    ? `w-12 h-11 mx-auto flex items-center justify-center ${
                        currentScreen === 'dashboard-gerencial'
                          ? 'bg-primary text-surface font-semibold shadow-xs'
                          : 'text-on-primary-container hover:bg-primary hover:text-surface'
                      }`
                    : `flex items-center justify-between px-space-sm py-space-xs font-body-md text-body-md text-left ${
                        currentScreen === 'dashboard-gerencial'
                          ? 'bg-primary text-surface font-semibold shadow-xs'
                          : 'text-on-primary-container hover:bg-primary hover:text-surface'
                      }`
                }`}
              >
                {isCollapsed ? (
                  <>
                    <span className="material-symbols-outlined text-[20px]">monitoring</span>
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary text-surface text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-primary/40">
                      <span>Dashboard Gerencial</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[18px]">monitoring</span>
                    <span>Dashboard Gerencial</span>
                  </div>
                )}
              </button>
            </nav>
          </div>
        )}

        {/* Section: FERRAMENTAS & DADOS */}
        <div className={isCollapsed ? 'px-2 py-space-xs border-t border-primary/40' : 'px-space-md py-space-xs border-t border-primary/40'}>
          {!isCollapsed ? (
            <div className="px-space-sm py-space-xs font-label-uppercase text-label-uppercase text-on-primary-container uppercase tracking-wider">
              Ferramentas &amp; Dados
            </div>
          ) : (
            <div className="w-8 h-px bg-primary/40 mx-auto my-1" />
          )}

          <nav className="flex flex-col gap-space-2xs mt-space-2xs">
            {/* Base de Devedores */}
            <button
              onClick={() => onNavigate('base-de-devedores')}
              aria-label="Base de Devedores"
              title={isCollapsed ? 'Base de Devedores' : undefined}
              className={`rounded-lg transition-colors cursor-pointer group relative ${
                isCollapsed
                  ? `w-12 h-11 mx-auto flex items-center justify-center ${
                      currentScreen === 'base-de-devedores'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
                  : `flex items-center gap-space-sm px-space-sm py-space-xs font-body-md text-body-md text-left w-full ${
                      currentScreen === 'base-de-devedores'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
              }`}
            >
              {isCollapsed ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">group</span>
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary text-surface text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-primary/40">
                    <span>Base de Devedores</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  <span>Base de Devedores</span>
                </>
              )}
            </button>

            {/* Importar ERP */}
            <button
              onClick={() => onNavigate('importar-erp')}
              aria-label="Importar ERP"
              title={isCollapsed ? 'Importar ERP' : undefined}
              className={`rounded-lg transition-colors cursor-pointer group relative ${
                isCollapsed
                  ? `w-12 h-11 mx-auto flex items-center justify-center ${
                      currentScreen === 'importar-erp'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
                  : `flex items-center gap-space-sm px-space-sm py-space-xs font-body-md text-body-md text-left w-full ${
                      currentScreen === 'importar-erp'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
              }`}
            >
              {isCollapsed ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary text-surface text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-primary/40">
                    <span>Importar ERP</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  <span>Importar ERP</span>
                </>
              )}
            </button>
          </nav>
        </div>

        {/* Section: CADASTROS */}
        <div className={isCollapsed ? 'px-2 py-space-xs border-t border-primary/40' : 'px-space-md py-space-xs border-t border-primary/40'}>
          {!isCollapsed ? (
            <div className="px-space-sm py-space-xs font-label-uppercase text-label-uppercase text-on-primary-container uppercase tracking-wider">
              Cadastros
            </div>
          ) : (
            <div className="w-8 h-px bg-primary/40 mx-auto my-1" />
          )}

          <nav className="flex flex-col gap-space-2xs mt-space-2xs">
            {/* Empresas */}
            <button
              onClick={() => onNavigate('empresas')}
              aria-label="Empresas"
              title={isCollapsed ? 'Empresas' : undefined}
              className={`rounded-lg transition-colors cursor-pointer group relative ${
                isCollapsed
                  ? `w-12 h-11 mx-auto flex items-center justify-center ${
                      currentScreen === 'empresas'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
                  : `flex items-center gap-space-sm px-space-sm py-space-xs font-body-md text-body-md text-left w-full ${
                      currentScreen === 'empresas'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
              }`}
            >
              {isCollapsed ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">domain</span>
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary text-surface text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-primary/40">
                    <span>Empresas</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">domain</span>
                  <span>Empresas</span>
                </>
              )}
            </button>

            {/* Usuários */}
            <button
              onClick={() => onNavigate('usuarios')}
              aria-label="Usuários"
              title={isCollapsed ? 'Usuários' : undefined}
              className={`rounded-lg transition-colors cursor-pointer group relative ${
                isCollapsed
                  ? `w-12 h-11 mx-auto flex items-center justify-center ${
                      currentScreen === 'usuarios'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
                  : `flex items-center gap-space-sm px-space-sm py-space-xs font-body-md text-body-md text-left w-full ${
                      currentScreen === 'usuarios'
                        ? 'bg-primary text-surface font-semibold shadow-xs'
                        : 'text-on-primary-container hover:bg-primary hover:text-surface'
                    }`
              }`}
            >
              {isCollapsed ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-primary text-surface text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-primary/40">
                    <span>Usuários</span>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                  <span>Usuários</span>
                </>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Footer Info */}
      <div className={isCollapsed ? 'p-2 border-t border-primary shrink-0 flex justify-center' : 'p-space-md border-t border-primary shrink-0'}>
        {!isCollapsed ? (
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
        ) : (
          <div
            className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center group relative cursor-help"
            title="Ambiente Produção - v3.8.4-corp"
          >
            <span className="material-symbols-outlined text-secondary-fixed text-[18px]">
              verified_user
            </span>
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-primary text-surface text-xs rounded-md shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-primary/40">
              <span className="block font-bold">Ambiente Produção</span>
              <span className="text-[11px] text-on-primary-container">v3.8.4-corp</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
