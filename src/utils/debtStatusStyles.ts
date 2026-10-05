import { DebtStatus } from '../types';

export interface DebtStatusStyle {
  status: DebtStatus;
  label: string;
  /** Classe de cor de fundo suave da linha */
  bgClass: string;
  /** Classe de hover suave da linha */
  hoverClass: string;
  /** Classe de borda lateral/acento discreto (ex: borda esquerda) */
  borderClass: string;
  /** Combinação padrão completa para a tag <tr> */
  rowClass: string;
  /** Indicador visual discreto (ponto/badge na 1ª coluna) */
  indicatorClass: string;
  /** Cor de texto relacionada ao status */
  textClass: string;
  /** Badge suave complementar */
  badgeClass: string;
}

export const DEBT_STATUS_STYLES: Record<DebtStatus, DebtStatusStyle> = {
  pago: {
    status: 'pago',
    label: 'Pago',
    bgClass: 'bg-emerald-50/50',
    hoverClass: 'hover:bg-emerald-100/60',
    borderClass: 'border-l-[3px] border-l-emerald-600',
    rowClass: 'bg-emerald-50/50 hover:bg-emerald-100/60 border-l-[3px] border-l-emerald-600',
    indicatorClass: 'bg-emerald-600',
    textClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-100/80 text-emerald-800 border border-emerald-200/50',
  },
  promessa_firme: {
    status: 'promessa_firme',
    label: 'Promessa Firme',
    bgClass: 'bg-sky-50/50',
    hoverClass: 'hover:bg-sky-100/60',
    borderClass: 'border-l-[3px] border-l-sky-600',
    rowClass: 'bg-sky-50/50 hover:bg-sky-100/60 border-l-[3px] border-l-sky-600',
    indicatorClass: 'bg-sky-600',
    textClass: 'text-sky-700',
    badgeClass: 'bg-sky-100/80 text-sky-800 border border-sky-200/50',
  },
  em_negociacao: {
    status: 'em_negociacao',
    label: 'Em Negociação',
    bgClass: 'bg-amber-50/50',
    hoverClass: 'hover:bg-amber-100/60',
    borderClass: 'border-l-[3px] border-l-amber-500',
    rowClass: 'bg-amber-50/50 hover:bg-amber-100/60 border-l-[3px] border-l-amber-500',
    indicatorClass: 'bg-amber-500',
    textClass: 'text-amber-800',
    badgeClass: 'bg-amber-100/80 text-amber-900 border border-amber-200/50',
  },
  retorno_agendado: {
    status: 'retorno_agendado',
    label: 'Retorno Agendado',
    bgClass: 'bg-purple-50/50',
    hoverClass: 'hover:bg-purple-100/60',
    borderClass: 'border-l-[3px] border-l-purple-500',
    rowClass: 'bg-purple-50/50 hover:bg-purple-100/60 border-l-[3px] border-l-purple-500',
    indicatorClass: 'bg-purple-500',
    textClass: 'text-purple-700',
    badgeClass: 'bg-purple-100/80 text-purple-800 border border-purple-200/50',
  },
  quebrou_acordo: {
    status: 'quebrou_acordo',
    label: 'Quebrou Acordo',
    bgClass: 'bg-rose-50/50',
    hoverClass: 'hover:bg-rose-100/60',
    borderClass: 'border-l-[3px] border-l-rose-500',
    rowClass: 'bg-rose-50/50 hover:bg-rose-100/60 border-l-[3px] border-l-rose-500',
    indicatorClass: 'bg-rose-500',
    textClass: 'text-rose-700',
    badgeClass: 'bg-rose-100/80 text-rose-800 border border-rose-200/50',
  },
  sem_contato: {
    status: 'sem_contato',
    label: 'Sem Contato',
    bgClass: 'bg-slate-50/70',
    hoverClass: 'hover:bg-slate-100/80',
    borderClass: 'border-l-[3px] border-l-slate-400',
    rowClass: 'bg-slate-50/70 hover:bg-slate-100/80 border-l-[3px] border-l-slate-400',
    indicatorClass: 'bg-slate-400',
    textClass: 'text-slate-600',
    badgeClass: 'bg-slate-100/80 text-slate-700 border border-slate-200/50',
  },
  em_aberto: {
    status: 'em_aberto',
    label: 'Em Aberto',
    bgClass: 'bg-surface-container-lowest/60',
    hoverClass: 'hover:bg-surface-container-low',
    borderClass: 'border-l-[3px] border-l-slate-300',
    rowClass: 'bg-surface-container-lowest/60 hover:bg-surface-container-low border-l-[3px] border-l-slate-300',
    indicatorClass: 'bg-slate-400',
    textClass: 'text-on-surface',
    badgeClass: 'bg-surface-container text-on-surface-variant border border-outline-variant/30',
  },
};

const DEFAULT_STATUS_STYLE: DebtStatusStyle = DEBT_STATUS_STYLES.em_aberto;

/**
 * Retorna as configurações de estilo visual para o status de cobrança informado.
 */
export function getDebtStatusRowStyle(status: DebtStatus | string | undefined | null): DebtStatusStyle {
  if (!status) return DEFAULT_STATUS_STYLE;
  return DEBT_STATUS_STYLES[status as DebtStatus] || DEFAULT_STATUS_STYLE;
}

/**
 * Retorna a classe CSS completa para a linha da tabela (<tr>).
 * Suporta o estado de seleção ativo, preservando acessibilidade e destaque.
 */
export function getDebtStatusRowClass(
  status: DebtStatus | string | undefined | null,
  isSelected: boolean = false
): string {
  if (isSelected) {
    return 'bg-surface-container-high/90 border-l-4 border-primary shadow-sm hover:bg-surface-container-high';
  }
  const config = getDebtStatusRowStyle(status);
  return config.rowClass;
}
