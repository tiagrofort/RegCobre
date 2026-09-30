import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavScreen } from './components/Sidebar';
import { Header } from './components/Header';
import { FastLogDrawer } from './components/FastLogDrawer';
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

const MainAppContent: React.FC = () => {
  const { isAuthenticated, currentUser } = useAuth();

  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('dashboard-do-cobrador');
  const [selectedDebtId, setSelectedDebtId] = useState<string>('10002');
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>('d-andrade');

  // Fast Log Drawer Global Controller
  const [isFastLogDrawerOpen, setIsFastLogDrawerOpen] = useState(false);
  const [fastLogTargetDebt, setFastLogTargetDebt] = useState<Debt | undefined>(undefined);

  // Re-render trigger when service emits changes
  const [, setTick] = useState(0);
  useEffect(() => {
    return debtService.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  // Sync initial screen when supervisor logs in
  useEffect(() => {
    if (currentUser?.role === 'supervisor' && currentScreen === 'dashboard-do-cobrador') {
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
              : 'dashboard-do-cobrador'
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

  const debts = debtService.getAllDebts();
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
      />

      {/* Main Viewport */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
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
          {currentScreen === 'dashboard-do-cobrador' && (
            <DashboardCobradorView
              onSelectDebt={handleSelectDebtAndOpenFicha}
              onOpenFastLog={handleOpenFastLogForDebt}
              onNavigateToPortfolio={() => setCurrentScreen('minha-carteira')}
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
              onOpenFastLog={handleOpenFastLogForDebt}
              onNavigateToDebtor={(debtorId) => {
                setSelectedDebtorId(debtorId);
                setCurrentScreen('base-de-devedores');
              }}
              onSelectAnotherDebt={(newDebtId) => {
                setSelectedDebtId(newDebtId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {currentScreen === 'agenda-de-retornos' && (
            <AgendaRetornosView
              onSelectDebt={handleSelectDebtAndOpenFicha}
              onOpenFastLog={handleOpenFastLogForDebt}
            />
          )}

          {currentScreen === 'relatorio-diario' && <RelatorioDiarioView />}

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

          {currentScreen === 'importar-erp' && <ImportarErpView />}
        </main>
      </div>

      {/* Slide-over Drawer for Fast Contact Registration */}
      <FastLogDrawer
        isOpen={isFastLogDrawerOpen}
        debt={fastLogTargetDebt || currentFichaDebt}
        onClose={() => setIsFastLogDrawerOpen(false)}
        onSaved={handleFastLogSaved}
      />
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
