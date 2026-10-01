import React, { useState } from 'react';
import { debtService } from '../services/debtService';
import { useAuth } from '../context/AuthContext';

interface FinishDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinished: (newDate: string, transferredCount: number) => void;
}

export const FinishDayModal: React.FC<FinishDayModalProps> = ({
  isOpen,
  onClose,
  onFinished,
}) => {
  const { currentUser } = useAuth();
  const producao = debtService.getProducaoDoDia();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirmFinish = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const res = debtService.finishDay();
      setIsProcessing(false);
      onFinished(res.newDate, res.transferredCount);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-xs flex items-center justify-center p-space-md overflow-y-auto">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-xl shadow-2xl overflow-hidden my-auto flex flex-col border border-outline-variant/30 animate-fade-in">
        {/* Header */}
        <div className="p-space-md bg-primary text-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-fixed text-[22px]">
              task_alt
            </span>
            <div>
              <h2 className="font-headline-sm font-bold text-surface leading-tight">
                Encerramento da Produção do Dia (FINISH)
              </h2>
              <span className="font-data-mono text-xs text-on-primary-container">
                Cobrador: {currentUser?.name || producao.operatorName} • Data: {producao.date}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-surface/80 hover:text-surface hover:bg-primary-container transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-space-lg flex flex-col gap-space-md bg-surface-container-lowest">
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            Revise os resultados consolidados da sua agenda de cobrança antes de formalizar o encerramento do expediente de hoje.
          </p>

          {/* Quantitative Balance Grid */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-surface-container-low rounded-xl text-center border border-outline-variant/20">
            <div className="p-2 bg-surface-container-lowest rounded-lg">
              <span className="block text-[10px] font-label-uppercase text-outline font-bold">
                PREVISTAS
              </span>
              <span className="font-headline-md font-bold text-primary font-data-mono">
                {producao.previstas}
              </span>
            </div>
            <div className="p-2 bg-secondary-container/40 rounded-lg">
              <span className="block text-[10px] font-label-uppercase text-on-secondary-container font-bold">
                TRABALHADAS
              </span>
              <span className="font-headline-md font-bold text-secondary font-data-mono">
                {producao.trabalhadas}
              </span>
              <span className="text-[10px] font-semibold text-secondary block font-data-mono">
                {producao.percentualRealizado}%
              </span>
            </div>
            <div className="p-2 bg-surface-container-lowest rounded-lg">
              <span className="block text-[10px] font-label-uppercase text-error font-bold">
                PENDENTES
              </span>
              <span className="font-headline-md font-bold text-error font-data-mono">
                {producao.pendentes}
              </span>
            </div>
          </div>

          {/* Financial Values Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
              <span className="text-outline block font-label-uppercase text-[10px]">
                VALOR CARTEIRA TRABALHADA
              </span>
              <strong className="text-primary font-data-mono text-sm block mt-0.5">
                R$ {producao.valorTrabalhado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="p-3 bg-secondary-container/20 rounded-lg border border-secondary/20">
              <span className="text-secondary block font-label-uppercase text-[10px]">
                VALOR TOTAL RECUPERADO
              </span>
              <strong className="text-secondary font-data-mono text-sm block mt-0.5 font-bold">
                R$ {producao.valorRecuperado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
              <span className="text-outline block font-label-uppercase text-[10px]">
                VALOR TOTAL PROMETIDO (PTP)
              </span>
              <strong className="text-primary font-data-mono text-sm block mt-0.5">
                R$ {producao.valorPrometido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
              <span className="text-[10px] text-on-surface-variant">
                {producao.qtdPromessas} promessas acordadas
              </span>
            </div>

            <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/20">
              <span className="text-outline block font-label-uppercase text-[10px]">
                RETORNOS AGENDADOS
              </span>
              <strong className="text-primary font-data-mono text-sm block mt-0.5">
                {producao.qtdRetornos} callbacks agendados
              </strong>
              <span className="text-[10px] text-on-surface-variant">
                Integrados à sua agenda
              </span>
            </div>
          </div>

          {/* Warning banner about unworked debts carried over to next day */}
          {producao.pendentes > 0 ? (
            <div className="p-3 bg-tertiary-fixed/40 border border-on-tertiary-container/30 rounded-lg flex items-start gap-2 text-xs">
              <span className="material-symbols-outlined text-[18px] text-on-tertiary-container shrink-0 mt-0.5">
                forward
              </span>
              <div className="text-on-tertiary-fixed leading-tight">
                <strong>Atenção: Existem {producao.pendentes} cobranças ainda não trabalhadas hoje.</strong>
                <p className="mt-1 text-on-surface-variant">
                  Ao confirmar o encerramento (FINISH), estas {producao.pendentes} cobranças não trabalhadas não serão perdidas: serão <strong>carregadas e transferidas automaticamente para a sua agenda do próximo dia</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-secondary-container/30 border border-secondary/30 rounded-lg flex items-center gap-2 text-xs text-secondary font-semibold">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Parabéns! 100% das cobranças da sua agenda diária foram trabalhadas.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-space-md bg-surface-container-low border-t border-surface-container flex items-center justify-between gap-space-sm shrink-0">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-label-uppercase text-xs font-semibold transition-colors cursor-pointer"
            type="button"
          >
            Continuar Trabalhando
          </button>

          <button
            onClick={handleConfirmFinish}
            disabled={isProcessing}
            className="h-9 px-space-lg bg-primary hover:bg-primary-container text-surface rounded-lg font-title-md text-sm font-semibold flex items-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
            type="button"
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                <span>Transferindo pendências...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
                  done_all
                </span>
                <span>Confirmar Encerramento do Dia (FINISH)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
