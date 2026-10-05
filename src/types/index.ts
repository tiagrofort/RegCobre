export type UserRole = 'cobrador' | 'supervisor' | 'administrador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  unit: string;
  badgeCode: string;
}

export type DebtStatus =
  | 'em_aberto'
  | 'em_negociacao'
  | 'promessa_firme'
  | 'retorno_agendado'
  | 'pago'
  | 'quebrou_acordo'
  | 'sem_contato';

export type ContactChannel =
  | 'Ligação'
  | 'WhatsApp'
  | 'Mensagem'
  | 'Áudio'
  | 'E-mail'
  | 'Serasa'
  | 'Outro';

export type ContactResult =
  | 'Pagou'
  | 'Prometeu pagar'
  | 'Vai pagar'
  | 'Solicitou retorno'
  | 'Não atende'
  | 'Não responde'
  | 'Não possui WhatsApp'
  | 'Mensagem enviada'
  | 'Áudio enviado'
  | 'Ligação realizada'
  | 'Contestação'
  | 'Enviado para Serasa'
  | 'Promessa Não Cumprida'
  | 'Outro';

export type DebtorPhoneType = 'Fixo' | 'Celular' | 'Comercial' | 'Financeiro' | 'Outro';

export interface DebtorPhone {
  id: string;
  number: string;
  type: DebtorPhoneType;
  description: string;
  hasWhatsApp: boolean;
  active: boolean;
}

export type PaymentDataType = 'PIX' | 'Outro';
export type PixKeyType = 'CPF' | 'CNPJ' | 'E-mail' | 'Telefone' | 'Aleatória' | 'Outro';

export interface CompanyPaymentData {
  id: string;
  type: PaymentDataType;
  description: string;
  pixKeyType?: PixKeyType;
  pixKey?: string;
  paymentInfo?: string;
  bankName?: string;
  accountDescription?: string;
  active: boolean;
  isPrimary: boolean;
}

export interface Debtor {
  id: string;
  erpCode: string;
  name: string;
  tradeName?: string;
  cnpjCpf: string;
  type: 'PJ' | 'PF';
  status: 'Ativa' | 'Inativa' | 'Suspenso';
  mainContact: {
    name: string;
    role: string;
    email: string;
    address: string;
    // Campos legados mantidos exclusivamente para compatibilidade com dados antigos
    phoneFixed?: string;
    phoneMobile?: string;
    hasWhatsApp?: boolean;
  };
  phones: DebtorPhone[]; // Coleção oficial de telefones do devedor
  totalDebt: number;
  debtsCount: number;
}

// Aliases em português conforme especificação do modelo de dados do RegCobre
export type Usuario = User;
export type Devedor = Debtor;
export type Cobranca = Debt;
export type HistoricoCobranca = DebtHistoryItem;

export interface PromiseRecord {
  id: string;
  debtId: string;
  dateRegistered: string;
  promisedDate: string;
  promisedValue: number;
  operatorName: string;
  status: 'Pendente (Vigente)' | 'Não Cumprida / Quebrada' | 'Cumprida / Liquidada';
  notes: string;
}

export interface ScheduledReturnRecord {
  id: string;
  debtId: string;
  date: string;
  time: string;
  reason: string;
  responsibleName: string;
  status: 'Agendado' | 'Realizado' | 'Em Atraso';
}

export interface PaymentRecord {
  id: string;
  debtId: string;
  date: string;
  value: number;
  method?: string;
  status: string;
}

export interface DebtHistoryItem {
  id: string;
  debtId: string;
  timestamp: string;
  dateFormatted: string;
  timeFormatted: string;
  operatorId: string;
  operatorName: string;
  operatorRole?: string;
  isSystem?: boolean;
  channel: ContactChannel;
  result: ContactResult;
  notes: string;
  contactPerson?: string;
  attachedPromise?: {
    promisedDate: string;
    promisedValue: number;
    status: string;
  };
  attachedReturn?: {
    returnDate: string;
    returnTime: string;
    reason: string;
  };
  attachedPayment?: {
    paymentDate: string;
    receivedValue: number;
  };
}

export type SituacaoParcelaVenda = 'Paga' | 'Vencida' | 'A vencer';

export interface VendaItem {
  descricao: string;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal?: number;
}

export interface ParcelaVenda {
  numero: number;
  vencimento: string;
  valor: number;
  situacao: SituacaoParcelaVenda;
  valorPago?: number;
  dataPagamento?: string;
}

export interface VendaCobranca {
  pedidoNumero?: string;
  dataVenda?: string;
  descricao?: string;
  valorTotal?: number;
  quantidadeParcelas?: number;
  valorParcela?: number;
  itens?: VendaItem[];
  parcelas?: ParcelaVenda[];
}

export interface Debt {
  id: string;
  debtorId: string;
  debtorName: string;
  debtorTradeName?: string;
  debtorCnpjCpf: string;
  debtorType: 'PJ' | 'PF';
  erpCode: string;
  titleNumber: string;
  installment: string; // e.g. "01/03"
  invoiceNumber: string; // e.g. "NF-e 4492"
  vendaOrigem?: VendaCobranca;
  dueDate: string;
  daysOverdue: number;
  originalValue: number;
  interestFine: number;
  currentValue: number;
  assignedTo: {
    id: string;
    name: string;
    role: string;
  };
  custodyAudit?: {
    transferredDate: string;
    fromUser: string;
    toUser: string;
    auditHash: string;
  };
  status: DebtStatus;
  statusLabel: string;
  lastContact?: {
    date: string;
    time: string;
    operatorName: string;
    channel: ContactChannel;
    result: ContactResult;
    summary?: string;
  };
  nextReturn?: {
    date: string;
    time: string;
    reason: string;
    assignedToName: string;
  };
  activePromise?: {
    dateRegistered: string;
    promisedDate: string;
    promisedValue: number;
    operatorName: string;
    status: 'vigente' | 'quebrada' | 'cumprida';
    notes: string;
  };
  promises: PromiseRecord[];
  scheduledReturns: ScheduledReturnRecord[];
  payments: PaymentRecord[];
  history: DebtHistoryItem[];
}

export interface ContactRegistrationPayload {
  channel: ContactChannel;
  result: ContactResult;
  contactPerson: string;
  notes: string;
  hasPromise: boolean;
  promisedDate?: string;
  promisedValue?: number;
  hasReturn: boolean;
  returnDate?: string;
  returnTime?: string;
  returnReason?: string;
  hasPayment: boolean;
  paymentDate?: string;
  receivedValue?: number;
}

// Agenda Diária da Operação
export type AgendaStatus =
  | 'Pendente'
  | 'Em andamento'
  | 'Trabalhada'
  | 'Não trabalhada'
  | 'Transferida para o próximo dia';

export interface AgendaDiariaCobranca {
  id: string;
  debtId: string;
  debt: Debt;
  date: string; // YYYY-MM-DD
  operatorId: string;
  operatorName: string;
  status: AgendaStatus;
  order: number;
  workedAt?: string; // timestamp
  transferredAt?: string; // timestamp
  isCarriedOver?: boolean; // se veio carregada do dia anterior
  lastResult?: ContactResult;
  notes?: string;
}

// Resumo da Produção do Dia
export interface ResumoProducaoDia {
  date: string;
  operatorName: string;
  metaDiaria: number;
  previstas: number;
  trabalhadas: number;
  pendentes: number;
  percentualRealizado: number;
  valorCarteira: number;
  valorTrabalhado: number;
  valorRecuperado: number;
  valorPrometido: number;
  qtdPromessas: number;
  qtdRetornos: number;
  isFinished: boolean;
  finishedAt?: string;
}
