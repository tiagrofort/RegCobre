import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavScreen } from './components/Sidebar';
import { Header } from './components/Header';
import { FastLogDrawer } from './components/FastLogDrawer';
import { FinishDayModal } from './components/FinishDayModal';
import { LoginView } from './views/LoginView';
import { DashboardCobradorView } from './views/DashboardCobradorView';
import { MinhaCarteiraView } from './views/MinhaCarteiraView';
import { FichaCobrancaView } from './views/FichaCobrancaView';
import { BaseDevedoresView } from './views/BaseDevedoresView';
import { ConferenciaView } from './views/ConferenciaView';
import { DashboardGerencialView } from './views/DashboardGerencialView';
import { AgendaRetornosView } from './views/AgendaRetornosView';
import { RelatorioDiarioView } from './views/RelatorioDiarioView';
import { ImportarErpView } from './views/ImportarErpView';
import { debtService } from './services/debtService';
import { Debt } from './types';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'regcobre.sidebar.collapsed';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();

  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('trabalho-de-hoje');
  const [selectedDebtId, setSelectedDebtId] = useState<string>('10002');
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>('d-andrade');

  // Retractable Sidebar State with LocalStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
      return typeof window !== 'undefined' && window.innerWidth < 1280;
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage exceptions
      }
      return next;
    });
  };

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fast Log Drawer Global Controller
  const [isFastLogDrawerOpen, setIsFastLogDrawerOpen] = useState(false);
  const [fastLogTargetDebt, setFastLogTargetDebt] = useState<Debt | undefined>(undefined);

  // Day Finish Modal Controller (FINISH)
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [finishToast, setFinishToast] = useState<{ message: string; date: string } | null>(null);

  // Re-render trigger when service emits changes
  const [, setTick] = useState(0);
  useEffect(() => {
    return debtService.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  // Sync initial screen when supervisor logs in
  useEffect(() => {
    if (currentUser?.role === 'supervisor' && currentScreen === 'trabalho-de-hoje') {
      setCurrentScreen('dashboard-gerencial');
    }
  }, [currentUser]);

  // If user is not authenticated, show Login Screen
  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={() => {
          setCurrentScreen(
            currentUser?.role === 'supervisor'
              ? 'dashboard-gerencial'
              : 'trabalho-de-hoje'
          );
        }}
      />
    );
  }

  const handleSelectDebtAndOpenFicha = (debtId: string) => {
    setSelectedDebtId(debtId);
    setCurrentScreen('ficha-cobranca');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFastLogForDebt = (debt?: Debt) => {
    const target = debt || debtService.getDebtById(selectedDebtId) || debtService.getAllDebts()[0];
    setFastLogTargetDebt(target);
    setIsFastLogDrawerOpen(true);
  };

  const handleFastLogSaved = (updatedDebt: Debt, nextDebtId?: string, goToNext?: boolean) => {
    if (goToNext && nextDebtId) {
      setSelectedDebtId(nextDebtId);
      const nextDebt = debtService.getDebtById(nextDebtId);
      setFastLogTargetDebt(nextDebt);
    }
  };

  const handleDayFinished = (newDate: string, transferredCount: number) => {
    setFinishToast({
      message: `Expediente encerrado! ${transferredCount} cobranças não trabalhadas foram transferidas para a agenda de ${newDate}.`,
      date: newDate,
    });
    setTimeout(() => setFinishToast(null), 5000);
    setCurrentScreen('trabalho-de-hoje');
  };

  const debts = debtService.getAllDebts();
  const producao = debtService.getProducaoDoDia();
  const currentFichaDebt = debts.find((d) => d.id === selectedDebtId) || debts[0];

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex">
      {/* Persistent Left Sidebar Navigation */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => {
          setCurrentScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        portfolioCount={debts.length}
        returnsCount={debts.filter((d) => !!d.nextReturn).length}
        unworkedTodayCount={producao.pendentes}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Viewport */}
      <div
        className={`${
          isSidebarCollapsed ? 'pl-20' : 'pl-64'
        } flex-1 flex flex-col min-w-0 transition-[padding-left] duration-300 ease-in-out`}
      >
        {/* Top Header */}
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onOpenQuickContact={() => handleOpenFastLogForDebt()}
          onNavigate={(screen) => setCurrentScreen(screen as NavScreen)}
          onSearch={(query) => {
            if (query.trim() && currentScreen !== 'minha-carteira') {
              setCurrentScreen('minha-carteira');
            }
          }}
        />

        {/* Dynamic Screen Container */}
        <main className="relative pt-16 w-full min-h-screen bg-surface">
          {currentScreen === 'trabalho-de-hoje' && (
            <DashboardCobradorView
              onSelectDebt={handleSelectDebtAndOpenFicha}
              onOpenFastLog={handleOpenFastLogForDebt}
              onNavigateToPortfolio={() => setCurrentScreen('minha-carteira')}
              onOpenFinishModal={() => setIsFinishModalOpen(true)}
            />
          )}

          {currentScreen === 'minha-carteira' && (
            <MinhaCarteiraView
              onSelectDebt={handleSelectDebtAndOpenFicha}
              onOpenFastLogModal={handleOpenFastLogForDebt}
            />
          )}

          {currentScreen === 'ficha-cobranca' && (
            <FichaCobrancaView
              debtId={selectedDebtId}
              onBackToPortfolio={() => setCurrentScreen('minha-carteira')}
              onBackToTodayWork={() => setCurrentScreen('trabalho-de-hoje')}
              onSelectAnotherDebt={(newDebtId: string) => {
                setSelectedDebtId(newDebtId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenFinishModal={() => setIsFinishModalOpen(true)}
              onNavigateToDebtor={(debtorId: string) => {
                setSelectedDebtorId(debtorId);
                setCurrentScreen('base-de-devedores');
              }}
              onOpenFastLog={handleOpenFastLogForDebt}
            />
          )}

          {currentScreen === 'agenda-de-retornos' && (
            <AgendaRetornosView
              onSelectDebt={handleSelectDebtAndOpenFicha}
              onOpenFastLog={handleOpenFastLogForDebt}
            />
          )}

          {currentScreen === 'producao-do-dia' && (
            <RelatorioDiarioView
              onOpenFinishModal={() => setIsFinishModalOpen(true)}
              onSelectDebt={handleSelectDebtAndOpenFicha}
            />
          )}

          {currentScreen === 'base-de-devedores' && (
            <BaseDevedoresView
              onSelectDebt={handleSelectDebtAndOpenFicha}
              selectedDebtorIdInitial={selectedDebtorId}
            />
          )}

          {currentScreen === 'conferencia-de-cobrancas' && (
            <ConferenciaView onSelectDebt={handleSelectDebtAndOpenFicha} />
          )}

          {currentScreen === 'dashboard-gerencial' && (
            <DashboardGerencialView
              onSelectDebt={handleSelectDebtAndOpenFicha}
              onNavigateToConferencia={() => setCurrentScreen('conferencia-de-cobrancas')}
            />
          )}

          {currentScreen === 'importar-erp' && (
            <ImportarErpView
              onNavigateToTodayWork={() => setCurrentScreen('trabalho-de-hoje')}
              onNavigateToPortfolio={() => setCurrentScreen('minha-carteira')}
            />
          )}
        </main>
      </div>

      {/* Slide-over Drawer for Fast Contact Registration */}
      <FastLogDrawer
        isOpen={isFastLogDrawerOpen}
        debt={fastLogTargetDebt || currentFichaDebt}
        onClose={() => setIsFastLogDrawerOpen(false)}
        onSaved={handleFastLogSaved}
        onOpenFicha={handleSelectDebtAndOpenFicha}
      />

      {/* Modal de Encerramento do Dia (FINISH) */}
      <FinishDayModal
        isOpen={isFinishModalOpen}
        onClose={() => setIsFinishModalOpen(false)}
        onFinished={handleDayFinished}
      />

      {/* Floating notification for day closure */}
      {finishToast && (
        <div className="fixed bottom-6 right-6 bg-primary text-surface px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce text-sm font-medium border border-secondary">
          <span className="material-symbols-outlined text-secondary-fixed text-[24px]">
            verified
          </span>
          <div>
            <strong className="block text-secondary-fixed font-bold text-xs uppercase font-label-uppercase">
              Agenda do Dia Atualizada
            </strong>
            <span>{finishToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
