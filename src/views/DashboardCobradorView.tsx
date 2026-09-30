import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { debtService } from '../services/debtService';
import { Debt } from '../types';

interface DashboardCobradorViewProps {
  onSelectDebt: (debtId: string) => void;
  onOpenFastLog: (debt: Debt) => void;
  onNavigateToPortfolio: () => void;
}

export const DashboardCobradorView: React.FC<DashboardCobradorViewProps> = ({
  onSelectDebt,
  onOpenFastLog,
  onNavigateToPortfolio,
}) => {
  const { currentUser } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const debts = debtService.getAllDebts();
  const metrics = debtService.getSummaryMetrics();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartQueue = () => {
    showToast('Iniciando fila prioritária: Discando para Translog Brasil Ltda (09:30)...');
    setTimeout(() => {
      onSelectDebt('10482');
    }, 1200);
  };

  // Find featured records
  const andradeDebt = debts.find((d) => d.id === '10002') || debts[0];
  const translogDebt = debts.find((d) => d.id === '10482') || debts[1];
  const alvoradaDebt = debts.find((d) => d.id === '10045') || debts[2];
  const saoLucasDebt = debts.find((d) => d.id === '10555') || debts[3];

  return (
    <div className="p-space-lg lg:p-space-xl flex flex-col gap-space-lg">
      {/* Top Cockpit Header & Daily Mission Control */}
      <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg border border-outline-variant/30">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-label-uppercase text-label-uppercase text-secondary uppercase tracking-wider">
              Cockpit Operacional Ativo
            </span>
            <span className="text-on-surface-variant font-label-uppercase text-label-uppercase">•</span>
            <span className="font-data-mono text-body-sm text-on-surface-variant">
              04 de Novembro de 2024
            </span>
          </div>
          <div className="flex items-baseline gap-space-sm flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
              Bom dia, {currentUser?.name || 'Carlos Eduardo'}!
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Você possui{' '}
              <span className="font-title-md text-primary font-semibold">6 retornos prioritários</span>{' '}
              hoje e{' '}
              <span className="font-data-mono text-secondary font-semibold">
                R$ 142.850,00
              </span>{' '}
              em promessas ativas.
            </p>
          </div>
        </div>

        {/* Quick Action Controls & Filters */}
        <div className="flex items-center flex-wrap gap-space-sm">
          <div className="flex items-center bg-surface-container-low p-space-2xs rounded-lg border border-outline-variant/30">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-space-sm py-space-xs rounded-DEFAULT font-label-uppercase text-label-uppercase cursor-pointer transition-colors ${
                selectedPeriod === 'today'
                  ? 'bg-surface-container-lowest shadow-sm text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Hoje (04/Nov)
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-space-sm py-space-xs rounded-DEFAULT font-label-uppercase text-label-uppercase cursor-pointer transition-colors ${
                selectedPeriod === 'week'
                  ? 'bg-surface-container-lowest shadow-sm text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Esta Semana
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-space-sm py-space-xs rounded-DEFAULT font-label-uppercase text-label-uppercase cursor-pointer transition-colors ${
                selectedPeriod === 'month'
                  ? 'bg-surface-container-lowest shadow-sm text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Mês Atual
            </button>
          </div>

          <button
            onClick={handleStartQueue}
            className="h-10 px-space-lg bg-primary hover:bg-primary-container text-surface rounded-lg shadow-sm flex items-center gap-space-xs font-title-md text-title-md transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary-fixed">
              play_circle
            </span>
            <span>Iniciar Fila de Retornos de Hoje</span>
          </button>
        </div>
      </div>

      {/* 6-Tile Key Performance Metric Cockpit */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-space-md">
        {/* Card 1: Cobranças na Carteira */}
        <div
          onClick={onNavigateToPortfolio}
          className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-xs hover:bg-surface-container-low/40 transition-colors border border-outline-variant/30 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider">
              Carteira Ativa
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              folder_special
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-primary font-bold">
              48 títulos
            </span>
            <span className="font-data-mono text-body-sm text-on-surface-variant font-medium">
              R$ 384.200,00 sob gestão
            </span>
          </div>
          <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-badge-sm text-badge-sm">
            <span>Ticket médio</span>
            <span className="font-data-mono font-semibold">R$ 8.004,16</span>
          </div>
        </div>

        {/* Card 2: Trabalhadas Hoje */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-xs hover:bg-surface-container-low/40 transition-colors border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider">
              Trabalhadas Hoje
            </span>
            <span className="material-symbols-outlined text-secondary text-[18px]">
              support_agent
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline justify-between">
              <span className="font-headline-md text-headline-md text-primary font-bold">
                18 devedores
              </span>
              <span className="font-data-mono text-badge-sm text-secondary font-semibold">
                51%
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Meta Diária: 35 contatos
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-space-2xs">
            <div
              className="bg-secondary h-full rounded-full transition-all duration-500"
              style={{ width: '51%' }}
            ></div>
          </div>
        </div>

        {/* Card 3: Retornos Agendados Hoje */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-xs hover:bg-surface-container-low/40 transition-colors border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider">
              Retornos Hoje
            </span>
            <span className="px-space-xs py-space-2xs bg-tertiary-fixed text-on-tertiary-fixed rounded font-badge-sm text-badge-sm font-semibold flex items-center gap-space-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-ping"></span>
              2 em atraso
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-primary font-bold">
              6 agendados
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              4 pendentes no cronograma
            </span>
          </div>
          <div className="pt-space-xs flex items-center justify-between font-badge-sm text-badge-sm text-on-tertiary-container">
            <span className="flex items-center gap-space-2xs">
              <span className="material-symbols-outlined text-[14px]">alarm</span> Próximo às 09:30
            </span>
          </div>
        </div>

        {/* Card 4: Promessas Próximas */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-xs hover:bg-surface-container-low/40 transition-colors border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider">
              Promessas Próx.
            </span>
            <span className="px-space-xs py-space-2xs bg-secondary-fixed text-on-secondary-fixed-variant rounded font-badge-sm text-badge-sm font-semibold">
              3 Dias
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-secondary font-bold font-data-mono">
              R$ 28.450,00
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              5 promessas registradas
            </span>
          </div>
          <div className="pt-space-xs flex items-center justify-between font-badge-sm text-badge-sm text-on-surface-variant">
            <span>Confirmação prévia</span>
            <span className="font-semibold text-secondary">80% adesão</span>
          </div>
        </div>

        {/* Card 5: Acordos Quebrados */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-xs hover:bg-surface-container-low/40 transition-colors border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider">
              Acordos Quebrados
            </span>
            <span className="px-space-xs py-space-2xs bg-error-container text-on-error-container rounded font-badge-sm text-badge-sm font-semibold flex items-center gap-space-2xs">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              3 Críticos
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-error font-bold font-data-mono">
              R$ 14.120,00
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Repactuação urgente necessária
            </span>
          </div>
          <div className="pt-space-xs flex items-center justify-between font-badge-sm text-badge-sm text-error">
            <span>Tempo médio quebra</span>
            <span className="font-semibold font-data-mono">48h</span>
          </div>
        </div>

        {/* Card 6: Recuperado no Mês */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between gap-space-xs hover:bg-surface-container-low/40 transition-colors border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <span className="font-label-uppercase text-label-uppercase text-on-surface-variant uppercase tracking-wider">
              Recuperado Mês
            </span>
            <span className="material-symbols-outlined text-secondary text-[18px]">
              verified
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-headline-md text-primary font-bold font-data-mono">
              R$ 62.800,00
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              16 acordos quitados
            </span>
          </div>
          <div className="pt-space-xs flex items-center justify-between font-badge-sm text-badge-sm text-secondary">
            <span>Taxa efetiva</span>
            <span className="font-semibold font-data-mono">+14.2% meta</span>
          </div>
        </div>
      </div>

      {/* Operational Split Viewport (60% Retornos Cronológicos / 40% Promessas & Alertas) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: Retornos Prioritários para Hoje (7 Cols on XL ~ 60%) */}
        <div className="xl:col-span-7 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-md border border-outline-variant/30">
            {/* Section Header */}
            <div className="flex items-center justify-between flex-wrap gap-space-sm pb-space-xs">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="font-title-md text-title-md text-primary leading-tight font-semibold">
                    Retornos Prioritários para Hoje
                  </h2>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Fila ordenada por horário programado e severidade do débito
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="px-space-sm py-space-xs rounded-full bg-surface-container-low text-on-surface-variant font-badge-sm text-badge-sm">
                  6 Pendentes
                </span>
              </div>
            </div>

            {/* Interactive Action Queue List */}
            <div className="flex flex-col gap-space-sm">
              {/* Item 1: 09:30 - Translog Brasil (Urgente) */}
              <div className="group bg-surface-container-lowest hover:bg-surface-container-low/70 rounded-lg p-space-md shadow-sm transition-all flex flex-col gap-space-sm border border-outline-variant/30">
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="px-space-sm py-space-xs rounded bg-tertiary-fixed text-on-tertiary-fixed font-data-mono text-body-sm font-bold flex items-center gap-space-2xs">
                      <span className="material-symbols-outlined text-[16px] text-on-tertiary-container animate-pulse">
                        timer
                      </span>
                      09:30
                    </div>
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <button
                          onClick={() => onSelectDebt('10482')}
                          className="font-title-md text-title-md text-primary font-semibold hover:underline text-left cursor-pointer"
                        >
                          Translog Brasil Ltda
                        </button>
                        <span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-badge-sm text-badge-sm">
                          CNPJ: 14.281.992/0001-44
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs mt-space-2xs">
                        <span className="font-data-mono text-body-sm text-on-surface-variant font-medium">
                          Título #10482
                        </span>
                        <span className="text-on-surface-variant">•</span>
                        <span className="font-data-mono text-body-sm text-primary font-bold">
                          R$ 18.450,00
                        </span>
                        <span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-badge-sm text-badge-sm uppercase font-semibold">
                          Urgente
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-sm py-space-xs bg-surface-container-high text-primary rounded-full font-label-uppercase text-label-uppercase flex items-center gap-space-2xs">
                      <span className="material-symbols-outlined text-[14px] text-secondary">
                        phone_forwarded
                      </span>
                      Ligação Direta
                    </span>
                  </div>
                </div>

                {/* Context Briefing */}
                <div className="bg-surface-container-low p-space-sm rounded-lg flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-on-tertiary-container text-[18px] shrink-0">
                    info
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface leading-tight">
                    <strong className="font-semibold text-primary">Instrução de Abordagem:</strong>{' '}
                    Retornar com financeiro Roberto para confirmar aprovação do boleto parcelado com entrada de 30%. Ele solicitou contato impreterivelmente pela manhã.
                  </p>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-between pt-space-2xs flex-wrap gap-space-sm">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    <span>Último contato: Ontem às 16:45 (Boleto minuta encaminhado)</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button
                      onClick={() => showToast('Iniciando discagem para Roberto (Translog)...')}
                      className="h-8 px-space-sm bg-primary hover:bg-primary-container text-surface rounded font-body-sm text-body-sm font-semibold flex items-center gap-space-xs transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      <span>Ligar Agora</span>
                    </button>
                    <button
                      onClick={() => showToast('Mensagem personalizada copiada e enviada via WhatsApp!')}
                      className="h-8 px-space-sm bg-secondary hover:bg-on-secondary-container text-on-secondary rounded font-body-sm text-body-sm font-semibold flex items-center gap-space-xs transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>WhatsApp</span>
                    </button>
                    <button
                      onClick={() => onOpenFastLog(translogDebt)}
                      className="h-8 px-space-sm bg-surface-container-high hover:bg-surface-variant text-on-surface rounded font-body-sm text-body-sm font-semibold flex items-center gap-space-xs transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      <span>Registrar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Item 2: 10:15 - Metalúrgica Andrade (Promessa Hoje) */}
              <div className="group bg-surface-container-lowest hover:bg-surface-container-low/70 rounded-lg p-space-md shadow-sm transition-all flex flex-col gap-space-sm border border-outline-variant/30">
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="px-space-sm py-space-xs rounded bg-surface-container-high text-primary font-data-mono text-body-sm font-bold flex items-center gap-space-2xs">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      10:15
                    </div>
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <button
                          onClick={() => onSelectDebt('10002')}
                          className="font-title-md text-title-md text-primary font-semibold hover:underline text-left cursor-pointer"
                        >
                          Indústria Metalúrgica Andrade Ltda
                        </button>
                        <span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-badge-sm text-badge-sm">
                          CNPJ: 14.892.301/0001-44
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs mt-space-2xs">
                        <span className="font-data-mono text-body-sm text-on-surface-variant font-medium">
                          Título #10002
                        </span>
                        <span className="text-on-surface-variant">•</span>
                        <span className="font-data-mono text-body-sm text-secondary font-bold">
                          R$ 9.370,10
                        </span>
                        <span className="px-space-xs py-space-2xs rounded bg-secondary-fixed text-on-secondary-fixed-variant font-badge-sm text-badge-sm uppercase font-semibold">
                          Promessa Hoje
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-sm py-space-xs bg-surface-container-high text-primary rounded-full font-label-uppercase text-label-uppercase flex items-center gap-space-2xs">
                      <span className="material-symbols-outlined text-[14px] text-secondary">
                        forum
                      </span>
                      WhatsApp First
                    </span>
                  </div>
                </div>

                {/* Context Briefing */}
                <div className="bg-surface-container-low p-space-sm rounded-lg flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0">
                    receipt_long
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface leading-tight">
                    <strong className="font-semibold text-primary">Instrução de Abordagem:</strong>{' '}
                    Aguardando comprovante de TED prometido até as 10h. Devedor solicitou não ligar antes de enviar o arquivo em anexo.
                  </p>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-between pt-space-2xs flex-wrap gap-space-sm">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    <span>Último contato: 01/Nov às 14:20 (Promessa confirmada verbalmente)</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button
                      onClick={() => showToast('Mensagem de cobrança de comprovante gerada no WhatsApp Web!')}
                      className="h-8 px-space-sm bg-secondary hover:bg-on-secondary-container text-on-secondary rounded font-body-sm text-body-sm font-semibold flex items-center gap-space-xs transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>Cobrar Comprovante</span>
                    </button>
                    <button
                      onClick={() => onSelectDebt('10002')}
                      className="h-8 px-space-sm bg-surface-container-high hover:bg-surface-variant text-on-surface rounded font-body-sm text-body-sm font-semibold flex items-center gap-space-xs transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">folder_open</span>
                      <span>Ver Ficha</span>
                    </button>
                    <button
                      onClick={() => onOpenFastLog(andradeDebt)}
                      className="h-8 px-space-sm bg-primary text-surface hover:bg-primary-container rounded font-body-sm text-body-sm font-semibold flex items-center gap-space-xs transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Confirmar Pagto</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Item 3: 11:00 - Supermercado Alvorada */}
              <div className="group bg-surface-container-lowest hover:bg-surface-container-low/70 rounded-lg p-space-md shadow-sm transition-all flex flex-col gap-space-sm border border-outline-variant/30">
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="px-space-sm py-space-xs rounded bg-surface-container-high text-primary font-data-mono text-body-sm font-bold flex items-center gap-space-2xs">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      11:00
                    </div>
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <button
                          onClick={() => onSelectDebt('10045')}
                          className="font-title-md text-title-md text-primary font-semibold hover:underline text-left cursor-pointer"
                        >
                          Supermercados Alvorada Eireli
                        </button>
                        <span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-badge-sm text-badge-sm">
                          CNPJ: 02.441.563/0002-12
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs mt-space-2xs">
                        <span className="font-data-mono text-body-sm text-on-surface-variant font-medium">
                          Título #10045
                        </span>
                        <span className="text-on-surface-variant">•</span>
                        <span className="font-data-mono text-body-sm text-primary font-bold">
                          R$ 23.180,00
                        </span>
                        <span className="px-space-xs py-space-2xs rounded bg-surface-container-highest text-primary font-badge-sm text-badge-sm uppercase font-semibold">
                          Negociação Aberta
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-sm py-space-xs bg-surface-container-high text-primary rounded-full font-label-uppercase text-label-uppercase flex items-center gap-space-2xs">
                      <span className="material-symbols-outlined text-[14px]">phone</span>
                      Ligação / Decisor
                    </span>
                  </div>
                </div>

                {/* Context Briefing */}
                <div className="bg-surface-container-low p-space-sm rounded-lg flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                    handshake
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface leading-tight">
                    <strong className="font-semibold text-primary">Instrução de Abordagem:</strong>{' '}
                    Proposta de desconto de 8% à vista autorizada pela diretoria para quitação integral até 12:00. Falar direto com Sr. Valdemar (Sócio).
                  </p>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-between pt-space-2xs flex-wrap gap-space-sm">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    <span>Último contato: Sexta-feira às 17:10 (Alinhamento de margem de juros)</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button
                      onClick={() => showToast('Chamando Sr. Valdemar no fixo da diretoria...')}
                      className="h-8 px-space-sm bg-primary hover:bg-primary-container text-surface rounded font-body-sm text-body-sm font-semibold flex items-center gap-space-xs transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      <span>Ligar Decisor</span>
                    </button>
                    <button
                      onClick={() => onOpenFastLog(alvoradaDebt)}
                      className="h-8 px-space-sm bg-surface-container-high hover:bg-surface-variant text-on-surface rounded font-body-sm text-body-sm font-semibold flex items-center gap-space-xs transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      <span>Registrar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Item 4: 14:00 - Clínica São Lucas */}
              <div className="group bg-surface-container-lowest hover:bg-surface-container-low/70 rounded-lg p-space-md shadow-sm transition-all flex flex-col gap-space-sm border border-outline-variant/30">
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <div className="px-space-sm py-space-xs rounded bg-surface-container-high text-primary font-data-mono text-body-sm font-bold flex items-center gap-space-2xs">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      14:00
                    </div>
                    <div>
                      <div className="flex items-center gap-space-xs">
                        <button
                          onClick={() => onSelectDebt('10555')}
                          className="font-title-md text-title-md text-primary font-semibold hover:underline text-left cursor-pointer"
                        >
                          Clínica Médica São Lucas
                        </button>
                        <span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-badge-sm text-badge-sm">
                          CNPJ: 19.821.442/0001-05
                        </span>
                      </div>
                      <div className="flex items-center gap-space-xs mt-space-2xs">
                        <span className="font-data-mono text-body-sm text-on-surface-variant font-medium">
                          Título #10555
                        </span>
                        <span className="text-on-surface-variant">•</span>
                        <span className="font-data-mono text-body-sm text-primary font-bold">
                          R$ 4.850,00
                        </span>
                        <span className="px-space-xs py-space-2xs rounded bg-surface-container-highest text-on-surface-variant font-badge-sm text-badge-sm uppercase font-semibold">
                          Agendado
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-sm py-space-xs bg-surface-container-high text-primary rounded-full font-label-uppercase text-label-uppercase flex items-center gap-space-2xs">
                      <span className="material-symbols-outlined text-[14px]">call</span>
                      Contato Secretária / Dra.
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-space-sm rounded-lg flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0">
                    calendar_clock
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface leading-tight">
                    <strong className="font-semibold text-primary">Instrução de Abordagem:</strong>{' '}
                    Retornar pontualmente às 14h para falar com Dra. Mariana durante o intervalo de consultas para definição de pagamento via PIX.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-space-2xs flex-wrap gap-space-sm">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    <span>Último contato: 31/Out às 11:20 (Devedora em atendimento)</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <button
                      onClick={() => onOpenFastLog(saoLucasDebt)}
                      className="h-8 px-space-sm bg-primary hover:bg-primary-container text-surface rounded font-body-sm text-body-sm font-semibold flex items-center gap-space-xs transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      <span>Registrar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Operational Hint */}
            <div className="p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between border border-outline-variant/20">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Restam outros 2 retornos programados para o período vespertino (15:30 e 16:45)
              </span>
              <button
                onClick={onNavigateToPortfolio}
                className="font-label-uppercase text-label-uppercase text-primary hover:underline font-semibold flex items-center gap-space-2xs cursor-pointer"
                type="button"
              >
                <span>Ver grade completa</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Monitor de Promessas, Quebras & Eficiência (5 Cols on XL ~ 40%) */}
        <div className="xl:col-span-5 flex flex-col gap-space-lg">
          {/* Bloco 1: Promessas Vencidas / Quebras de Acordo */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="w-3 h-3 rounded bg-error flex items-center justify-center text-on-error font-bold text-[9px]">
                  !
                </span>
                <h3 className="font-title-md text-title-md text-error leading-tight font-semibold">
                  Promessas Quebradas (Repactuação)
                </h3>
              </div>
              <span className="px-space-xs py-space-2xs bg-error-container text-on-error-container rounded font-badge-sm text-badge-sm font-semibold">
                3 Casos
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              {/* Quebra 1 */}
              <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs hover:bg-surface-container-high/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-body-md text-primary font-semibold">
                    Distribuidora Minas Petróleo
                  </span>
                  <span className="font-data-mono text-body-sm text-error font-bold">
                    R$ 6.300,00
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                  <span className="flex items-center gap-space-2xs">
                    <span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-badge-sm text-badge-sm font-semibold">
                      Venceu há 2 dias
                    </span>
                    <span>(02/Nov)</span>
                  </span>
                  <button
                    onClick={() => showToast('Reacionando Distribuidora Minas Petróleo...')}
                    className="h-7 px-space-sm bg-error hover:bg-on-error-container text-on-error rounded font-badge-sm text-badge-sm font-semibold flex items-center gap-space-2xs transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">phone_in_talk</span>
                    <span>Reacionar Devedor</span>
                  </button>
                </div>
              </div>

              {/* Quebra 2 */}
              <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs hover:bg-surface-container-high/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-body-md text-primary font-semibold">
                    Auto Peças Progresso Eireli
                  </span>
                  <span className="font-data-mono text-body-sm text-error font-bold">
                    R$ 4.120,00
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                  <span className="flex items-center gap-space-2xs">
                    <span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-badge-sm text-badge-sm font-semibold">
                      Venceu ontem
                    </span>
                    <span>(03/Nov)</span>
                  </span>
                  <button
                    onClick={() => showToast('Reacionando Auto Peças Progresso...')}
                    className="h-7 px-space-sm bg-error hover:bg-on-error-container text-on-error rounded font-badge-sm text-badge-sm font-semibold flex items-center gap-space-2xs transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">phone_in_talk</span>
                    <span>Reacionar Devedor</span>
                  </button>
                </div>
              </div>

              {/* Quebra 3 */}
              <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs hover:bg-surface-container-high/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-body-md text-primary font-semibold">
                    Construtora Horizonte Azul
                  </span>
                  <span className="font-data-mono text-body-sm text-error font-bold">
                    R$ 3.700,00
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                  <span className="flex items-center gap-space-2xs">
                    <span className="px-space-xs py-space-2xs rounded bg-error-container text-on-error-container font-badge-sm text-badge-sm font-semibold">
                      Venceu ontem
                    </span>
                    <span>(03/Nov)</span>
                  </span>
                  <button
                    onClick={() => showToast('Reacionando Construtora Horizonte Azul...')}
                    className="h-7 px-space-sm bg-error hover:bg-on-error-container text-on-error rounded font-badge-sm text-badge-sm font-semibold flex items-center gap-space-2xs transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">phone_in_talk</span>
                    <span>Reacionar Devedor</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bloco 2: Promessas para Amanhã (05/Nov) */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm border border-outline-variant/30">
            <div className="flex items-center justify-between pb-space-2xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  notification_important
                </span>
                <h3 className="font-title-md text-title-md text-primary leading-tight font-semibold">
                  Promessas para Amanhã (05/Nov)
                </h3>
              </div>
              <span className="px-space-xs py-space-2xs bg-secondary-fixed text-on-secondary-fixed-variant rounded font-badge-sm text-badge-sm font-semibold">
                Pré-Notificação
              </span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs hover:bg-surface-container-high/60 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-title-md text-body-md text-primary font-semibold">
                      Padaria Central & Conveniência
                    </span>
                    <div className="font-data-mono text-body-sm text-secondary font-bold">
                      R$ 11.200,00 (Parcela 1/3)
                    </div>
                  </div>
                  <button
                    onClick={() => showToast('Lembrete amigável enviado via WhatsApp!')}
                    className="h-7 px-space-sm bg-secondary hover:bg-on-secondary-container text-on-secondary rounded font-badge-sm text-badge-sm font-semibold flex items-center gap-space-2xs transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    <span>Lembrete WhatsApp</span>
                  </button>
                </div>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-2xs hover:bg-surface-container-high/60 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-title-md text-body-md text-primary font-semibold">
                      Ferragens Modelo Ltda
                    </span>
                    <div className="font-data-mono text-body-sm text-secondary font-bold">
                      R$ 8.950,00 (Quitação à vista)
                    </div>
                  </div>
                  <button
                    onClick={() => showToast('Lembrete amigável enviado via WhatsApp!')}
                    className="h-7 px-space-sm bg-secondary hover:bg-on-secondary-container text-on-secondary rounded font-badge-sm text-badge-sm font-semibold flex items-center gap-space-2xs transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">send</span>
                    <span>Lembrete WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bloco 3: Resumo de Eficiência por Canal */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col gap-space-sm border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-primary leading-tight font-semibold">
                Eficiência de Conversão dos Canais
              </h3>
              <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                Taxa de Adesão Hoje
              </span>
            </div>
            <div className="grid grid-cols-3 gap-space-sm pt-space-xs">
              <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-space-2xs text-center">
                <div className="flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </div>
                <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                  WhatsApp
                </span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold font-data-mono">
                  42%
                </span>
                <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full" style={{ width: '42%' }}></div>
                </div>
              </div>

              <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-space-2xs text-center">
                <div className="flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">phone</span>
                </div>
                <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                  Ligação
                </span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold font-data-mono">
                  28%
                </span>
                <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: '28%' }}></div>
                </div>
              </div>

              <div className="p-space-sm bg-surface-container-low rounded-lg flex flex-col gap-space-2xs text-center">
                <div className="flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <span className="font-label-uppercase text-label-uppercase text-on-surface-variant">
                  E-mail
                </span>
                <span className="font-headline-sm text-headline-sm text-primary font-bold font-data-mono">
                  14%
                </span>
                <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                  <div className="bg-on-surface-variant h-full" style={{ width: '14%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-space-xs p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
              <span className="flex items-center gap-space-2xs">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  tips_and_updates
                </span>
                WhatsApp tem gerado 1.5x mais compromissos no 1º contato.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-primary text-surface px-space-md py-space-sm rounded-lg shadow-xl flex items-center gap-space-sm z-50 animate-bounce">
          <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
            check_circle
          </span>
          <span className="font-body-sm text-body-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
