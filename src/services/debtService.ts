import {
  Debt,
  Debtor,
  DebtorPhone,
  CompanyPaymentData,
  DebtHistoryItem,
  ContactRegistrationPayload,
  User,
  PromiseRecord,
  ScheduledReturnRecord,
  PaymentRecord,
  AgendaDiariaCobranca,
  ResumoProducaoDia,
} from '../types';

// Initial Mock Debtors (focused strictly on collection with phones)
const INITIAL_DEBTORS: Debtor[] = [
  {
    id: 'd-andrade',
    erpCode: '#9821',
    name: 'Indústria Metalúrgica Andrade Ltda',
    tradeName: 'Metalúrgica Andrade',
    cnpjCpf: '14.892.301/0001-44',
    type: 'PJ',
    status: 'Ativa',
    mainContact: {
      name: 'Dr. Marcos P. de Souza',
      role: 'Diretor Financeiro / Sócio Administrador',
      phoneFixed: '(11) 3452-8800',
      phoneMobile: '(11) 98822-1044',
      hasWhatsApp: true,
      email: 'financeiro@metalurgicaandrade.com.br',
      address: 'Av. Industrial, 4200 - Distrito Industrial - Guarulhos/SP',
    },
    phones: [
      {
        id: 'ph-andrade-1',
        number: '(11) 98822-1044',
        type: 'Celular',
        description: 'WhatsApp / Dr. Marcos (Diretoria Financeira)',
        hasWhatsApp: true,
        active: true,
      },
      {
        id: 'ph-andrade-2',
        number: '(11) 3452-8800',
        type: 'Fixo',
        description: 'PABX Central / Recepção',
        hasWhatsApp: false,
        active: true,
      },
      {
        id: 'ph-andrade-3',
        number: '(11) 3452-8815',
        type: 'Financeiro',
        description: 'Setor Contas a Pagar',
        hasWhatsApp: true,
        active: true,
      },
      {
        id: 'ph-andrade-4',
        number: '(11) 97123-0099',
        type: 'Celular',
        description: 'Ex-comprador Paulo (Desativado)',
        hasWhatsApp: false,
        active: false,
      },
    ],
    totalDebt: 26850.0,
    debtsCount: 3,
  },
  {
    id: 'd-rocha-forte',
    erpCode: '#3412',
    name: 'Construtora Rocha Forte Ltda',
    tradeName: 'Rocha Forte Engenharia',
    cnpjCpf: '08.120.994/0001-90',
    type: 'PJ',
    status: 'Ativa',
    mainContact: {
      name: 'Eng. Gilberto Rocha',
      role: 'Gerente Administrativo',
      phoneFixed: '(11) 3105-4422',
      phoneMobile: '(11) 97100-3321',
      hasWhatsApp: true,
      email: 'financeiro@rochaforte.com.br',
      address: 'Rua das Palmeiras, 850 - Bela Vista - São Paulo/SP',
    },
    phones: [
      {
        id: 'ph-rocha-1',
        number: '(11) 97100-3321',
        type: 'Celular',
        description: 'Eng. Gilberto Rocha (WhatsApp)',
        hasWhatsApp: true,
        active: true,
      },
      {
        id: 'ph-rocha-2',
        number: '(11) 3105-4422',
        type: 'Fixo',
        description: 'Sede Bela Vista',
        hasWhatsApp: false,
        active: true,
      },
      {
        id: 'ph-rocha-3',
        number: '(11) 3105-4499',
        type: 'Comercial',
        description: 'Ramal Comercial Antigo',
        hasWhatsApp: false,
        active: false,
      },
    ],
    totalDebt: 15750.0,
    debtsCount: 1,
  },
  {
    id: 'd-alvorada',
    erpCode: '#1094',
    name: 'Supermercados Alvorada Eireli',
    tradeName: 'Supermercado Alvorada',
    cnpjCpf: '02.441.563/0002-12',
    type: 'PJ',
    status: 'Ativa',
    mainContact: {
      name: 'Sr. Valdemar Alvorada',
      role: 'Sócio Diretor',
      phoneFixed: '(19) 3881-2200',
      phoneMobile: '(19) 99233-4411',
      hasWhatsApp: true,
      email: 'contasapagar@superalvorada.com.br',
      address: 'Av. Brasil Central, 1200 - Campinas/SP',
    },
    phones: [
      {
        id: 'ph-alvorada-1',
        number: '(19) 99233-4411',
        type: 'Celular',
        description: 'Sr. Valdemar (WhatsApp)',
        hasWhatsApp: true,
        active: true,
      },
      {
        id: 'ph-alvorada-2',
        number: '(19) 3881-2200',
        type: 'Fixo',
        description: 'Matriz Campinas',
        hasWhatsApp: false,
        active: true,
      },
    ],
    totalDebt: 25590.0,
    debtsCount: 2,
  },
  {
    id: 'd-brasil-norte',
    erpCode: '#5519',
    name: 'Distribuidora Brasil Norte PJ',
    tradeName: 'Brasil Norte Distribuidora',
    cnpjCpf: '19.330.122/0003-88',
    type: 'PJ',
    status: 'Ativa',
    mainContact: {
      name: 'Claudio Ferreira',
      role: 'Contador Responsável',
      phoneFixed: '(91) 3222-1100',
      phoneMobile: '(91) 98111-2299',
      hasWhatsApp: true,
      email: 'claudio@brasilnorte.com.br',
      address: 'Rodovia BR 316, Km 4 - Ananindeua/PA',
    },
    phones: [
      {
        id: 'ph-norte-1',
        number: '(91) 98111-2299',
        type: 'Celular',
        description: 'Claudio Ferreira (WhatsApp Contador)',
        hasWhatsApp: true,
        active: true,
      },
      {
        id: 'ph-norte-2',
        number: '(91) 3222-1100',
        type: 'Comercial',
        description: 'Central de Distribuição',
        hasWhatsApp: false,
        active: true,
      },
    ],
    totalDebt: 43290.0,
    debtsCount: 1,
  },
  {
    id: 'd-vale-verde',
    erpCode: '#8129',
    name: 'Transporte Vale Verde PJ',
    tradeName: 'Vale Verde Logística',
    cnpjCpf: '31.002.812/0001-09',
    type: 'PJ',
    status: 'Ativa',
    mainContact: {
      name: 'Renata Lemos',
      role: 'Supervisora Financeira',
      phoneFixed: '(31) 3390-8800',
      phoneMobile: '(31) 99882-7711',
      hasWhatsApp: false,
      email: 'renata@valeverdelog.com.br',
      address: 'Distrito Industrial II - Contagem/MG',
    },
    phones: [
      {
        id: 'ph-vale-1',
        number: '(31) 3390-8800',
        type: 'Fixo',
        description: 'Portaria & Logística',
        hasWhatsApp: false,
        active: true,
      },
      {
        id: 'ph-vale-2',
        number: '(31) 99882-7711',
        type: 'Financeiro',
        description: 'Renata Lemos (Supervisão)',
        hasWhatsApp: false,
        active: true,
      },
    ],
    totalDebt: 5630.0,
    debtsCount: 1,
  },
  {
    id: 'd-roberto-sampaio',
    erpCode: '#7721',
    name: 'Roberto Sampaio Pinto',
    tradeName: 'Consultoria Empresarial',
    cnpjCpf: '382.910.428-11',
    type: 'PF',
    status: 'Ativa',
    mainContact: {
      name: 'Roberto Sampaio',
      role: 'Titular / Avalista',
      phoneFixed: '(11) 2291-5500',
      phoneMobile: '(11) 98222-4411',
      hasWhatsApp: true,
      email: 'roberto.sampaio@consultoria.com.br',
      address: 'Rua Bela Cintra, 1420 - São Paulo/SP',
    },
    phones: [
      {
        id: 'ph-sampaio-1',
        number: '(11) 98222-4411',
        type: 'Celular',
        description: 'Roberto (WhatsApp Pessoal)',
        hasWhatsApp: true,
        active: true,
      },
      {
        id: 'ph-sampaio-2',
        number: '(11) 2291-5500',
        type: 'Fixo',
        description: 'Consultoria Escritório',
        hasWhatsApp: false,
        active: true,
      },
      {
        id: 'ph-sampaio-3',
        number: '(11) 99111-4455',
        type: 'Celular',
        description: 'Número anterior desativado',
        hasWhatsApp: false,
        active: false,
      },
    ],
    totalDebt: 3345.0,
    debtsCount: 1,
  },
  {
    id: 'd-central-sul',
    erpCode: '#4120',
    name: 'Auto Peças Central Sul PJ',
    tradeName: 'Central Sul Autopeças',
    cnpjCpf: '05.811.234/0001-22',
    type: 'PJ',
    status: 'Ativa',
    mainContact: {
      name: 'Maurício Santos',
      role: 'Financeiro',
      phoneFixed: '(41) 3344-9988',
      phoneMobile: '(41) 99123-5566',
      hasWhatsApp: true,
      email: 'financeiro@centralsulauto.com.br',
      address: 'Rua Marechal Floriano, 2200 - Curitiba/PR',
    },
    phones: [
      {
        id: 'ph-central-1',
        number: '(41) 99123-5566',
        type: 'Celular',
        description: 'Maurício Santos (WhatsApp Financeiro)',
        hasWhatsApp: true,
        active: true,
      },
      {
        id: 'ph-central-2',
        number: '(41) 3344-9988',
        type: 'Comercial',
        description: 'Central de Vendas de Peças',
        hasWhatsApp: false,
        active: true,
      },
    ],
    totalDebt: 12180.0,
    debtsCount: 1,
  },
  {
    id: 'd-translog',
    erpCode: '#6210',
    name: 'Translog Brasil Ltda',
    tradeName: 'Translog Logística',
    cnpjCpf: '14.281.992/0001-44',
    type: 'PJ',
    status: 'Ativa',
    mainContact: {
      name: 'Roberto Camargo',
      role: 'Gerente Financeiro',
      phoneFixed: '(11) 3662-7700',
      phoneMobile: '(11) 98765-4321',
      hasWhatsApp: true,
      email: 'roberto@translogbrasil.com.br',
      address: 'Via Anhanguera, Km 28 - Jundiaí/SP',
    },
    phones: [
      {
        id: 'ph-translog-1',
        number: '(11) 98765-4321',
        type: 'Celular',
        description: 'Roberto Camargo (WhatsApp)',
        hasWhatsApp: true,
        active: true,
      },
      {
        id: 'ph-translog-2',
        number: '(11) 3662-7700',
        type: 'Fixo',
        description: 'PABX Operacional Jundiaí',
        hasWhatsApp: false,
        active: true,
      },
    ],
    totalDebt: 18450.0,
    debtsCount: 1,
  },
  {
    id: 'd-sao-lucas',
    erpCode: '#7302',
    name: 'Clínica Médica São Lucas',
    tradeName: 'Clínica São Lucas',
    cnpjCpf: '19.821.442/0001-05',
    type: 'PJ',
    status: 'Ativa',
    mainContact: {
      name: 'Dra. Mariana Lucas',
      role: 'Diretora Médica / Sócia',
      phoneFixed: '(11) 2110-3344',
      phoneMobile: '(11) 99441-2233',
      hasWhatsApp: true,
      email: 'dra.mariana@clinicasaolucas.com.br',
      address: 'Rua Itapeva, 500 - São Paulo/SP',
    },
    phones: [
      {
        id: 'ph-lucas-1',
        number: '(11) 99441-2233',
        type: 'Celular',
        description: 'Dra. Mariana Lucas (WhatsApp)',
        hasWhatsApp: true,
        active: true,
      },
      {
        id: 'ph-lucas-2',
        number: '(11) 2110-3344',
        type: 'Fixo',
        description: 'Recepção e Agendamento',
        hasWhatsApp: false,
        active: true,
      },
    ],
    totalDebt: 4850.0,
    debtsCount: 1,
  },
];

// Initial Debts Data
const INITIAL_DEBTS: Debt[] = [
  // 1. Indústria Metalúrgica Andrade - Título #10002
  {
    id: '10002',
    debtorId: 'd-andrade',
    debtorName: 'Indústria Metalúrgica Andrade Ltda',
    debtorTradeName: 'Metalúrgica Andrade',
    debtorCnpjCpf: '14.892.301/0001-44',
    debtorType: 'PJ',
    erpCode: '#9821',
    titleNumber: '#10002',
    installment: '01/03',
    invoiceNumber: 'NF-e 4492',
    descricaoCompra: '2 PNEUS 175/70 R14 + ALINHAMENTO',
    dueDate: '2024-09-12',
    daysOverdue: 52,
    originalValue: 8950.0,
    interestFine: 420.1,
    currentValue: 9370.1,
    assignedTo: {
      id: 'carlos-eduardo',
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
    },
    custodyAudit: {
      transferredDate: '28/10/2024',
      fromUser: 'Roberto S.',
      toUser: 'Carlos Eduardo',
      auditHash: '#9821-10002-BR',
    },
    status: 'em_negociacao',
    statusLabel: 'Em Negociação / Promessa Pendente',
    lastContact: {
      date: '04/11/2024',
      time: '11:15',
      operatorName: 'Carlos Eduardo',
      channel: 'Ligação',
      result: 'Prometeu pagar',
      summary: 'Por Carlos E. (Ligação)',
    },
    nextReturn: {
      date: '2024-11-11',
      time: '09:30',
      reason: 'Acompanhar promessa e confirmação de TED',
      assignedToName: 'Carlos Eduardo',
    },
    activePromise: {
      dateRegistered: '04/11/2024 11:15',
      promisedDate: '2024-11-18',
      promisedValue: 9370.1,
      operatorName: 'Carlos Eduardo',
      status: 'vigente',
      notes: 'Aguardando liberação de fluxo financeiro',
    },
    promises: [
      {
        id: 'p-1',
        debtId: '10002',
        dateRegistered: '04/11/2024 11:15',
        promisedDate: '18/11/2024',
        promisedValue: 9370.1,
        operatorName: 'Carlos Eduardo',
        status: 'Pendente (Vigente)',
        notes: 'Aguardando liberação de fluxo financeiro',
      },
      {
        id: 'p-0',
        debtId: '10002',
        dateRegistered: '15/10/2024 10:20',
        promisedDate: '25/10/2024',
        promisedValue: 8950.0,
        operatorName: 'Roberto Silveira',
        status: 'Não Cumprida / Quebrada',
        notes: 'Devedor não efetuou PIX prometido no prazo',
      },
    ],
    scheduledReturns: [
      {
        id: 'sr-1',
        debtId: '10002',
        date: '11/11/2024',
        time: '09:30',
        reason: 'Acompanhar promessa e confirmação de TED',
        responsibleName: 'Carlos Eduardo',
        status: 'Agendado',
      },
      {
        id: 'sr-0',
        debtId: '10002',
        date: '25/10/2024',
        time: '14:00',
        reason: 'Cobrar comprovante PIX',
        responsibleName: 'Roberto Silveira',
        status: 'Realizado',
      },
    ],
    payments: [],
    history: [
      {
        id: 'h-1',
        debtId: '10002',
        timestamp: '2024-11-04T11:15:00',
        dateFormatted: '04/11/2024',
        timeFormatted: '11:15',
        operatorId: 'carlos-eduardo',
        operatorName: 'Carlos Eduardo',
        operatorRole: 'Cobrador Sênior',
        channel: 'Ligação',
        result: 'Prometeu pagar',
        notes:
          'Conversado com Dr. Marcos (Diretor Financeiro). Informou que o fluxo de caixa regulariza nesta sexta-feira e efetuará a liquidação do título integralmente no valor de R$ 9.370,10 através de transferência bancária TED. Solicitou retorno formal na segunda-feira pela manhã para emissão de dados bancários de liquidação.',
        contactPerson: 'Dr. Marcos (Diretor Financeiro)',
        attachedPromise: {
          promisedDate: '18/11/2024',
          promisedValue: 9370.1,
          status: 'Vigente',
        },
        attachedReturn: {
          returnDate: '11/11/2024',
          returnTime: '09:30',
          reason: 'Confirmação TED',
        },
      },
      {
        id: 'h-2',
        debtId: '10002',
        timestamp: '2024-10-28T16:40:00',
        dateFormatted: '28/10/2024',
        timeFormatted: '16:40',
        operatorId: 'carlos-eduardo',
        operatorName: 'Carlos Eduardo',
        channel: 'WhatsApp',
        result: 'Mensagem enviada',
        notes:
          'Cobrança transferida pelo supervisor Marcos Vinicius de Roberto para Carlos Eduardo. Realizado primeiro contato via WhatsApp oficial apresentando o novo responsável pela carteira e solicitando posicionamento acerca da quebra do acordo anterior. Mensagem entregue com confirmação de leitura.',
      },
      {
        id: 'h-3',
        debtId: '10002',
        timestamp: '2024-10-25T17:00:00',
        dateFormatted: '25/10/2024',
        timeFormatted: '17:00',
        operatorId: 'roberto-silveira',
        operatorName: 'Roberto Silveira (Antigo Cobrador)',
        isSystem: true,
        channel: 'Outro',
        result: 'Promessa Não Cumprida',
        notes:
          'Pagamento prometido para 25/10/2024 no valor de R$ 8.950,00 não foi identificado no extrato do ERP. Notificação de descumprimento disparada para a gerência de cobrança e sinalizador de quebra de acordo vinculado à ficha.',
      },
      {
        id: 'h-4',
        debtId: '10002',
        timestamp: '2024-10-15T10:20:00',
        dateFormatted: '15/10/2024',
        timeFormatted: '10:20',
        operatorId: 'roberto-silveira',
        operatorName: 'Roberto Silveira (Antigo Cobrador)',
        channel: 'Ligação',
        result: 'Prometeu pagar',
        notes:
          'Contato estabelecido com setor de contas a pagar da Indústria Metalúrgica Andrade. O responsável alegou atraso de recebíveis de clientes do setor automotivo e firmou compromisso de liquidação até o dia 25/10. Registrada promessa no valor do principal.',
      },
    ],
  },

  // 1b. Indústria Metalúrgica Andrade - Título #10003
  {
    id: '10003',
    debtorId: 'd-andrade',
    debtorName: 'Indústria Metalúrgica Andrade Ltda',
    debtorTradeName: 'Metalúrgica Andrade',
    debtorCnpjCpf: '14.892.301/0001-44',
    debtorType: 'PJ',
    erpCode: '#9821',
    titleNumber: '#10003',
    installment: '02/03',
    invoiceNumber: 'NF-e 4492',
    dueDate: '2024-10-12',
    daysOverdue: 22,
    originalValue: 8950.0,
    interestFine: 180.0,
    currentValue: 9130.0,
    assignedTo: {
      id: 'carlos-eduardo',
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
    },
    status: 'sem_contato',
    statusLabel: 'Aguardando Contato',
    promises: [],
    scheduledReturns: [],
    payments: [],
    history: [
      {
        id: 'h-10003-1',
        debtId: '10003',
        timestamp: '2024-10-28T16:45:00',
        dateFormatted: '28/10/2024',
        timeFormatted: '16:45',
        operatorId: 'carlos-eduardo',
        operatorName: 'Carlos Eduardo',
        channel: 'WhatsApp',
        result: 'Mensagem enviada',
        notes: 'Disparada notificação preventiva de vencimento da parcela 02.',
      },
    ],
  },

  // 1c. Indústria Metalúrgica Andrade - Título #10004
  {
    id: '10004',
    debtorId: 'd-andrade',
    debtorName: 'Indústria Metalúrgica Andrade Ltda',
    debtorTradeName: 'Metalúrgica Andrade',
    debtorCnpjCpf: '14.892.301/0001-44',
    debtorType: 'PJ',
    erpCode: '#9821',
    titleNumber: '#10004',
    installment: '03/03',
    invoiceNumber: 'NF-e 4492',
    dueDate: '2024-11-12',
    daysOverdue: 0,
    originalValue: 8950.0,
    interestFine: 0,
    currentValue: 8950.0,
    assignedTo: {
      id: 'carlos-eduardo',
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
    },
    status: 'em_aberto',
    statusLabel: 'A Vencer (12/11) - Carteira Regular',
    promises: [],
    scheduledReturns: [],
    payments: [],
    history: [],
  },

  // 2. Construtora Rocha Forte - Título #10001
  {
    id: '10001',
    debtorId: 'd-rocha-forte',
    debtorName: 'Construtora Rocha Forte Ltda',
    debtorTradeName: 'Rocha Forte Engenharia',
    debtorCnpjCpf: '08.120.994/0001-90',
    debtorType: 'PJ',
    erpCode: '#3412',
    titleNumber: '#10001',
    installment: '02/05',
    invoiceNumber: 'NF-e 3810',
    descricaoCompra: 'COMPRA DE MATERIAL ELÉTRICO E CABEAMENTO',
    dueDate: '2024-09-15',
    daysOverdue: 49,
    originalValue: 14500.0,
    interestFine: 1250.0,
    currentValue: 15750.0,
    assignedTo: {
      id: 'carlos-eduardo',
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
    },
    status: 'pago',
    statusLabel: 'Pago / Liquidado',
    lastContact: {
      date: '04/11/2024',
      time: '10:40',
      operatorName: 'Carlos Eduardo',
      channel: 'Ligação',
      result: 'Pagou',
      summary: 'Por Carlos Eduardo (Ligação)',
    },
    promises: [
      {
        id: 'p-rocha-1',
        debtId: '10001',
        dateRegistered: '01/11/2024',
        promisedDate: '04/11/2024',
        promisedValue: 14500.0,
        operatorName: 'Carlos Eduardo',
        status: 'Cumprida / Liquidada',
        notes: 'Comprovante TED enviado e validado.',
      },
    ],
    scheduledReturns: [],
    payments: [
      {
        id: 'pay-1',
        debtId: '10001',
        date: '04/11/2024',
        value: 14500.0,
        method: 'TED',
        status: 'Liquidado',
      },
    ],
    history: [
      {
        id: 'h-rocha-1',
        debtId: '10001',
        timestamp: '2024-11-04T10:40:00',
        dateFormatted: '04/11/2024',
        timeFormatted: '10:40',
        operatorId: 'carlos-eduardo',
        operatorName: 'Carlos Eduardo',
        channel: 'Ligação',
        result: 'Pagou',
        notes: 'Confirmado recebimento de TED no valor de R$ 14.500,00.',
        attachedPayment: {
          paymentDate: '04/11/2024',
          receivedValue: 14500.0,
        },
      },
    ],
  },

  // 3. Supermercados Alvorada - Título #10045
  {
    id: '10045',
    debtorId: 'd-alvorada',
    debtorName: 'Supermercados Alvorada Eireli',
    debtorTradeName: 'Supermercado Alvorada',
    debtorCnpjCpf: '02.441.563/0002-12',
    debtorType: 'PJ',
    erpCode: '#1094',
    titleNumber: '#10045',
    installment: 'Única',
    invoiceNumber: 'NF-e 8812',
    descricaoCompra: 'SERVIÇO DE MANUTENÇÃO VEICULAR E PEÇAS',
    dueDate: '2024-09-28',
    daysOverdue: 36,
    originalValue: 23180.0,
    interestFine: 2410.0,
    currentValue: 25590.0,
    assignedTo: {
      id: 'carlos-eduardo',
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
    },
    status: 'retorno_agendado',
    statusLabel: 'Retorno Agendado',
    lastContact: {
      date: '04/11/2024',
      time: '09:15',
      operatorName: 'Carlos Eduardo',
      channel: 'Ligação',
      result: 'Solicitou retorno',
      summary: 'Por Carlos E. (Ligação)',
    },
    nextReturn: {
      date: '2024-11-04',
      time: '14:00',
      reason: 'Proposta de desconto de 8% à vista autorizada pela diretoria.',
      assignedToName: 'Carlos Eduardo',
    },
    promises: [],
    scheduledReturns: [
      {
        id: 'sr-alv-1',
        debtId: '10045',
        date: '04/11/2024',
        time: '14:00',
        reason: 'Alinhamento com Sr. Valdemar sobre quitação à vista.',
        responsibleName: 'Carlos Eduardo',
        status: 'Agendado',
      },
    ],
    payments: [],
    history: [
      {
        id: 'h-alv-1',
        debtId: '10045',
        timestamp: '2024-11-04T09:15:00',
        dateFormatted: '04/11/2024',
        timeFormatted: '09:15',
        operatorId: 'carlos-eduardo',
        operatorName: 'Carlos Eduardo',
        channel: 'Ligação',
        result: 'Solicitou retorno',
        notes:
          'Contato com secretária do Sr. Valdemar. Ele solicitou ligar pontualmente às 14h para avaliar proposta de liquidação à vista.',
        attachedReturn: {
          returnDate: '04/11/2024',
          returnTime: '14:00',
          reason: 'Falar com sócio Valdemar',
        },
      },
    ],
  },

  // 4. Translog Brasil Ltda - Título #10482
  {
    id: '10482',
    debtorId: 'd-translog',
    debtorName: 'Translog Brasil Ltda',
    debtorTradeName: 'Translog Logística',
    debtorCnpjCpf: '14.281.992/0001-44',
    debtorType: 'PJ',
    erpCode: '#6210',
    titleNumber: '#10482',
    installment: '01/02',
    invoiceNumber: 'NF-e 9918',
    dueDate: '2024-10-14',
    daysOverdue: 21,
    originalValue: 18450.0,
    interestFine: 520.0,
    currentValue: 18970.0,
    assignedTo: {
      id: 'carlos-eduardo',
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
    },
    status: 'retorno_agendado',
    statusLabel: 'Retorno Agendado (Urgente)',
    lastContact: {
      date: '03/11/2024',
      time: '16:45',
      operatorName: 'Carlos Eduardo',
      channel: 'Ligação',
      result: 'Solicitou retorno',
      summary: 'Boleto minuta encaminhado',
    },
    nextReturn: {
      date: '2024-11-04',
      time: '09:30',
      reason:
        'Retornar com financeiro Roberto para confirmar aprovação do boleto parcelado com entrada de 30%.',
      assignedToName: 'Carlos Eduardo',
    },
    promises: [],
    scheduledReturns: [
      {
        id: 'sr-trans-1',
        debtId: '10482',
        date: '04/11/2024',
        time: '09:30',
        reason: 'Confirmar boleto parcelado',
        responsibleName: 'Carlos Eduardo',
        status: 'Agendado',
      },
    ],
    payments: [],
    history: [
      {
        id: 'h-trans-1',
        debtId: '10482',
        timestamp: '2024-11-03T16:45:00',
        dateFormatted: '03/11/2024',
        timeFormatted: '16:45',
        operatorId: 'carlos-eduardo',
        operatorName: 'Carlos Eduardo',
        channel: 'Ligação',
        result: 'Solicitou retorno',
        notes:
          'Roberto solicitou contato impreterivelmente pela manhã para formalizar acordo com entrada.',
      },
    ],
  },

  // 5. Clínica Médica São Lucas - Título #10555
  {
    id: '10555',
    debtorId: 'd-sao-lucas',
    debtorName: 'Clínica Médica São Lucas',
    debtorTradeName: 'Clínica São Lucas',
    debtorCnpjCpf: '19.821.442/0001-05',
    debtorType: 'PJ',
    erpCode: '#7302',
    titleNumber: '#10555',
    installment: 'Única',
    invoiceNumber: 'NF-e 1022',
    dueDate: '2024-10-18',
    daysOverdue: 17,
    originalValue: 4850.0,
    interestFine: 120.0,
    currentValue: 4970.0,
    assignedTo: {
      id: 'carlos-eduardo',
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
    },
    status: 'retorno_agendado',
    statusLabel: 'Retorno Agendado',
    lastContact: {
      date: '31/10/2024',
      time: '11:20',
      operatorName: 'Carlos Eduardo',
      channel: 'Ligação',
      result: 'Solicitou retorno',
      summary: 'Devedora em atendimento',
    },
    nextReturn: {
      date: '2024-11-04',
      time: '14:00',
      reason:
        'Retornar pontualmente às 14h para falar com Dra. Mariana durante intervalo de consultas.',
      assignedToName: 'Carlos Eduardo',
    },
    promises: [],
    scheduledReturns: [
      {
        id: 'sr-sl-1',
        debtId: '10555',
        date: '04/11/2024',
        time: '14:00',
        reason: 'Definição de pagamento via PIX.',
        responsibleName: 'Carlos Eduardo',
        status: 'Agendado',
      },
    ],
    payments: [],
    history: [
      {
        id: 'h-sl-1',
        debtId: '10555',
        timestamp: '2024-10-31T11:20:00',
        dateFormatted: '31/10/2024',
        timeFormatted: '11:20',
        operatorId: 'carlos-eduardo',
        operatorName: 'Carlos Eduardo',
        channel: 'Ligação',
        result: 'Solicitou retorno',
        notes: 'Secretária informou que Dra. Mariana só atende cobrança no intervalo das 14h.',
      },
    ],
  },

  // 6. Distribuidora Brasil Norte - Título #09871
  {
    id: '09871',
    debtorId: 'd-brasil-norte',
    debtorName: 'Distribuidora Brasil Norte PJ',
    debtorTradeName: 'Brasil Norte Distribuidora',
    debtorCnpjCpf: '19.330.122/0003-88',
    debtorType: 'PJ',
    erpCode: '#5519',
    titleNumber: '#09871',
    installment: '03/03',
    invoiceNumber: 'NF-e 2911',
    dueDate: '2024-08-05',
    daysOverdue: 90,
    originalValue: 38400.0,
    interestFine: 4890.0,
    currentValue: 43290.0,
    assignedTo: {
      id: 'carlos-eduardo',
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
    },
    status: 'quebrou_acordo',
    statusLabel: 'Quebrou Acordo / Promessa Não Cumprida',
    lastContact: {
      date: '04/11/2024',
      time: '09:50',
      operatorName: 'Carlos Eduardo',
      channel: 'Ligação',
      result: 'Promessa Não Cumprida',
      summary: 'Carlos Eduardo (Sem Retorno)',
    },
    nextReturn: {
      date: '2024-11-05',
      time: '14:00',
      reason: 'Repactuação urgente - Reacionar devedor.',
      assignedToName: 'Carlos Eduardo',
    },
    promises: [
      {
        id: 'p-bn-1',
        debtId: '09871',
        dateRegistered: '28/10/2024',
        promisedDate: '03/11/2024',
        promisedValue: 38400.0,
        operatorName: 'Carlos Eduardo',
        status: 'Não Cumprida / Quebrada',
        notes: 'Promessa de R$ 38.400 não cumprida em 03/11.',
      },
    ],
    scheduledReturns: [],
    payments: [],
    history: [
      {
        id: 'h-bn-1',
        debtId: '09871',
        timestamp: '2024-11-04T09:50:00',
        dateFormatted: '04/11/2024',
        timeFormatted: '09:50',
        operatorId: 'carlos-eduardo',
        operatorName: 'Carlos Eduardo',
        channel: 'Ligação',
        result: 'Promessa Não Cumprida',
        notes: 'Constatada quebra de acordo. Ligado para cobrança sem atendimento.',
      },
    ],
  },

  // 7. Transporte Vale Verde - Título #10219
  {
    id: '10219',
    debtorId: 'd-vale-verde',
    debtorName: 'Transporte Vale Verde PJ',
    debtorTradeName: 'Vale Verde Logística',
    debtorCnpjCpf: '31.002.812/0001-09',
    debtorType: 'PJ',
    erpCode: '#8129',
    titleNumber: '#10219',
    installment: '01/01',
    invoiceNumber: 'NF-e 7731',
    dueDate: '2024-10-20',
    daysOverdue: 14,
    originalValue: 5420.0,
    interestFine: 210.0,
    currentValue: 5630.0,
    assignedTo: {
      id: 'carlos-eduardo',
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
    },
    status: 'sem_contato',
    statusLabel: 'Sem Contato Recente',
    lastContact: {
      date: '03/11/2024',
      time: '16:20',
      operatorName: 'Carlos Eduardo',
      channel: 'Ligação',
      result: 'Não atende',
      summary: 'Carlos E. (Caixa Postal)',
    },
    promises: [],
    scheduledReturns: [],
    payments: [],
    history: [
      {
        id: 'h-vv-1',
        debtId: '10219',
        timestamp: '2024-11-03T16:20:00',
        dateFormatted: '03/11/2024',
        timeFormatted: '16:20',
        operatorId: 'carlos-eduardo',
        operatorName: 'Carlos Eduardo',
        channel: 'Ligação',
        result: 'Não atende',
        notes: 'Ligação realizada para financeiro. Caixa postal.',
      },
    ],
  },

  // 8. Roberto Sampaio Pinto - Título #10304
  {
    id: '10304',
    debtorId: 'd-roberto-sampaio',
    debtorName: 'Roberto Sampaio Pinto',
    debtorTradeName: 'Consultoria Empresarial',
    debtorCnpjCpf: '382.910.428-11',
    debtorType: 'PF',
    erpCode: '#7721',
    titleNumber: '#10304',
    installment: '04/06',
    invoiceNumber: 'NF-e 9102',
    dueDate: '2024-10-10',
    daysOverdue: 24,
    originalValue: 3200.0,
    interestFine: 145.0,
    currentValue: 3345.0,
    assignedTo: {
      id: 'carlos-eduardo',
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
    },
    status: 'promessa_firme',
    statusLabel: 'Promessa Firme',
    lastContact: {
      date: '03/11/2024',
      time: '14:10',
      operatorName: 'Carlos Eduardo',
      channel: 'WhatsApp',
      result: 'Prometeu pagar',
      summary: 'Carlos E. (WhatsApp)',
    },
    nextReturn: {
      date: '2024-11-06',
      time: '10:00',
      reason: 'Acompanhar pagamento via PIX.',
      assignedToName: 'Carlos Eduardo',
    },
    activePromise: {
      dateRegistered: '03/11/2024',
      promisedDate: '2024-11-06',
      promisedValue: 3200.0,
      operatorName: 'Carlos Eduardo',
      status: 'vigente',
      notes: 'Acordo firmado via WhatsApp.',
    },
    promises: [
      {
        id: 'p-rsp-1',
        debtId: '10304',
        dateRegistered: '03/11/2024',
        promisedDate: '06/11/2024',
        promisedValue: 3200.0,
        operatorName: 'Carlos Eduardo',
        status: 'Pendente (Vigente)',
        notes: 'Acordo firmado via WhatsApp.',
      },
    ],
    scheduledReturns: [],
    payments: [],
    history: [
      {
        id: 'h-rsp-1',
        debtId: '10304',
        timestamp: '2024-11-03T14:10:00',
        dateFormatted: '03/11/2024',
        timeFormatted: '14:10',
        operatorId: 'carlos-eduardo',
        operatorName: 'Carlos Eduardo',
        channel: 'WhatsApp',
        result: 'Prometeu pagar',
        notes: 'Cliente confirmou que realizará transferência PIX de R$ 3.200 até quarta-feira.',
        attachedPromise: {
          promisedDate: '06/11/2024',
          promisedValue: 3200.0,
          status: 'Vigente',
        },
      },
    ],
  },

  // 9. Auto Peças Central Sul - Título #10190
  {
    id: '10190',
    debtorId: 'd-central-sul',
    debtorName: 'Auto Peças Central Sul PJ',
    debtorTradeName: 'Central Sul Autopeças',
    debtorCnpjCpf: '05.811.234/0001-22',
    debtorType: 'PJ',
    erpCode: '#4120',
    titleNumber: '#10190',
    installment: '01/02',
    invoiceNumber: 'NF-e 6122',
    dueDate: '2024-09-19',
    daysOverdue: 45,
    originalValue: 11290.0,
    interestFine: 890.0,
    currentValue: 12180.0,
    assignedTo: {
      id: 'carlos-eduardo',
      name: 'Carlos Eduardo',
      role: 'Cobrador Sênior',
    },
    status: 'pago',
    statusLabel: 'Pago / Liquidado',
    lastContact: {
      date: '03/11/2024',
      time: '11:30',
      operatorName: 'Carlos Eduardo',
      channel: 'Ligação',
      result: 'Pagou',
      summary: 'Carlos Eduardo (Boleto Pago)',
    },
    promises: [],
    scheduledReturns: [],
    payments: [
      {
        id: 'pay-cs-1',
        debtId: '10190',
        date: '03/11/2024',
        value: 11290.0,
        status: 'Liquidado',
      },
    ],
    history: [
      {
        id: 'h-cs-1',
        debtId: '10190',
        timestamp: '2024-11-03T11:30:00',
        dateFormatted: '03/11/2024',
        timeFormatted: '11:30',
        operatorId: 'carlos-eduardo',
        operatorName: 'Carlos Eduardo',
        channel: 'Ligação',
        result: 'Pagou',
        notes: 'Pagamento conciliado via Boleto Bancário.',
        attachedPayment: {
          paymentDate: '03/11/2024',
          receivedValue: 11290.0,
        },
      },
    ],
  },
];

// Initial Company Payment Data (Dados de Recebimento da Empresa)
const INITIAL_COMPANY_PAYMENT_DATA: CompanyPaymentData[] = [
  {
    id: 'pay-emp-1',
    type: 'PIX',
    description: 'PIX CNPJ — Conta Principal Corporativa',
    pixKeyType: 'CNPJ',
    pixKey: '03.456.789/0001-90',
    paymentInfo: '03.456.789/0001-90',
    bankName: 'Banco Itaú Unibanco (341)',
    accountDescription: 'Agência 0450 • C/C 18234-9 • Titular: RegCobre Cobranças',
    active: true,
    isPrimary: true,
  },
  {
    id: 'pay-emp-2',
    type: 'PIX',
    description: 'PIX E-mail — Acordos e Recuperação de Crédito',
    pixKeyType: 'E-mail',
    pixKey: 'financeiro.recebimento@regcobre.com.br',
    paymentInfo: 'financeiro.recebimento@regcobre.com.br',
    bankName: 'Banco Santander (033)',
    accountDescription: 'Agência 1209 • C/C 98124-0 • Titular: RegCobre Cobranças',
    active: true,
    isPrimary: false,
  },
  {
    id: 'pay-emp-3',
    type: 'PIX',
    description: 'PIX Aleatória — Chave de Cobrança Expressa',
    pixKeyType: 'Aleatória',
    pixKey: 'e7b93108-9842-4f1b-a567-9d7a5b3f2081',
    paymentInfo: 'e7b93108-9842-4f1b-a567-9d7a5b3f2081',
    bankName: 'Banco do Brasil (001)',
    accountDescription: 'Agência 3410 • C/C 45012-3 • Titular: RegCobre Cobranças',
    active: true,
    isPrimary: false,
  },
  {
    id: 'pay-emp-4',
    type: 'PIX',
    description: 'PIX Telefone — Central de Plantão e Quitações',
    pixKeyType: 'Telefone',
    pixKey: '(11) 98765-4321',
    paymentInfo: '(11) 98765-4321',
    bankName: 'Banco Bradesco (237)',
    accountDescription: 'Agência 2210 • C/C 78912-1 • Titular: RegCobre Cobranças',
    active: true,
    isPrimary: false,
  },
];

// Reactive in-memory state
let debtsState: Debt[] = JSON.parse(JSON.stringify(INITIAL_DEBTS));
let debtorsState: Debtor[] = JSON.parse(JSON.stringify(INITIAL_DEBTORS));
let companyPaymentDataState: CompanyPaymentData[] = JSON.parse(JSON.stringify(INITIAL_COMPANY_PAYMENT_DATA));

// Current Operational Work Day Simulation
let currentOperationalDate = '04/11/2024';
let isDayFinished = false;

// Build initial Agenda Diária for today
function createInitialAgenda(): AgendaDiariaCobranca[] {
  // Ordered sequence of debts for Carlos Eduardo
  return debtsState.map((d, index) => {
    // Determine worked state: if had interaction on 04/11, it is already Trabalhada today!
    const hadTodayContact = d.history.some((h) => h.dateFormatted.includes('04/11'));
    return {
      id: `ag-${d.id}`,
      debtId: d.id,
      debt: d,
      date: currentOperationalDate,
      operatorId: d.assignedTo.id,
      operatorName: d.assignedTo.name,
      status: hadTodayContact ? 'Trabalhada' : 'Pendente',
      order: index + 1,
      workedAt: hadTodayContact ? d.history[0]?.timestamp : undefined,
      lastResult: hadTodayContact ? d.history[0]?.result : undefined,
      isCarriedOver: index > 5, // some simulated carried over from previous day
    };
  });
}

let agendaState: AgendaDiariaCobranca[] = createInitialAgenda();

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export const debtService = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getCurrentDate(): string {
    return currentOperationalDate;
  },

  isDayClosed(): boolean {
    return isDayFinished;
  },

  getAllDebts(): Debt[] {
    return [...debtsState];
  },

  getDebtsByAssignee(userId: string): Debt[] {
    return debtsState.filter(
      (d) =>
        d.assignedTo.id.toLowerCase() === userId.toLowerCase() ||
        d.assignedTo.name.toLowerCase().includes(userId.toLowerCase())
    );
  },

  getDebtById(id: string): Debt | undefined {
    return debtsState.find((d) => d.id === id);
  },

  getAllDebtors(): Debtor[] {
    return [...debtorsState];
  },

  getDebtorById(id: string): Debtor | undefined {
    return debtorsState.find((d) => d.id === id);
  },

  getDebtsByDebtorId(debtorId: string): Debt[] {
    return debtsState.filter((d) => d.debtorId === debtorId);
  },

  /**
   * Adiciona um novo telefone ao cadastro do devedor
   */
  addDebtorPhone(debtorId: string, phone: Omit<DebtorPhone, 'id'>): DebtorPhone | null {
    const debtor = debtorsState.find((d) => d.id === debtorId);
    if (!debtor) return null;
    const newPhone: DebtorPhone = {
      ...phone,
      id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    if (!debtor.phones) debtor.phones = [];
    debtor.phones.push(newPhone);
    notifyListeners();
    return newPhone;
  },

  /**
   * Atualiza os dados de um telefone do devedor
   */
  updateDebtorPhone(debtorId: string, phoneId: string, updates: Partial<DebtorPhone>): boolean {
    const debtor = debtorsState.find((d) => d.id === debtorId);
    if (!debtor || !debtor.phones) return false;
    const phone = debtor.phones.find((p) => p.id === phoneId);
    if (!phone) return false;
    Object.assign(phone, updates);
    notifyListeners();
    return true;
  },

  /**
   * Alterna status ativo/inativo do telefone (sem exclusão física)
   */
  toggleDebtorPhoneStatus(debtorId: string, phoneId: string): boolean {
    const debtor = debtorsState.find((d) => d.id === debtorId);
    if (!debtor || !debtor.phones) return false;
    const phone = debtor.phones.find((p) => p.id === phoneId);
    if (!phone) return false;
    phone.active = !phone.active;
    notifyListeners();
    return true;
  },

  /**
   * Retorna todos os dados de recebimento da empresa
   */
  getCompanyPaymentData(): CompanyPaymentData[] {
    return [...companyPaymentDataState];
  },

  /**
   * Retorna os dados de recebimento ativos da empresa
   */
  getActiveCompanyPaymentData(): CompanyPaymentData[] {
    return companyPaymentDataState.filter((p) => p.active);
  },

  /**
   * Retorna o dado de recebimento principal da empresa
   */
  getPrimaryCompanyPaymentData(): CompanyPaymentData | undefined {
    return (
      companyPaymentDataState.find((p) => p.isPrimary && p.active) ||
      companyPaymentDataState.find((p) => p.isPrimary) ||
      companyPaymentDataState[0]
    );
  },

  /**
   * Adiciona um novo dado de recebimento para a empresa.
   * Regra: No máximo um dado principal (isPrimary = true).
   */
  addCompanyPaymentData(data: Omit<CompanyPaymentData, 'id'>): CompanyPaymentData {
    if (data.isPrimary) {
      companyPaymentDataState.forEach((item) => {
        item.isPrimary = false;
      });
    } else if (companyPaymentDataState.length === 0) {
      data = { ...data, isPrimary: true };
    }
    const newRecord: CompanyPaymentData = {
      ...data,
      id: `pay-emp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    companyPaymentDataState.push(newRecord);
    notifyListeners();
    return newRecord;
  },

  /**
   * Atualiza um dado de recebimento da empresa.
   * Regra: Se marcado como principal, desmarca os demais.
   */
  updateCompanyPaymentData(id: string, updates: Partial<CompanyPaymentData>): boolean {
    const item = companyPaymentDataState.find((p) => p.id === id);
    if (!item) return false;
    if (updates.isPrimary) {
      companyPaymentDataState.forEach((p) => {
        if (p.id !== id) {
          p.isPrimary = false;
        }
      });
    }
    Object.assign(item, updates);
    notifyListeners();
    return true;
  },

  /**
   * Define um dado de recebimento como principal.
   * Regra do dado principal:
   * - o anterior deixa de ser principal;
   * - o novo passa a ser principal;
   * - garante que o novo dado principal esteja ativo.
   */
  setPrimaryCompanyPaymentData(id: string): boolean {
    const target = companyPaymentDataState.find((p) => p.id === id);
    if (!target) return false;
    companyPaymentDataState.forEach((p) => {
      p.isPrimary = p.id === id;
    });
    target.active = true;
    notifyListeners();
    return true;
  },

  /**
   * Alterna o status ativo/inativo do dado de recebimento da empresa.
   */
  toggleCompanyPaymentDataStatus(id: string): boolean {
    const item = companyPaymentDataState.find((p) => p.id === id);
    if (!item) return false;
    item.active = !item.active;
    notifyListeners();
    return true;
  },

  /**
   * Remove um dado de recebimento da empresa.
   */
  deleteCompanyPaymentData(id: string): boolean {
    const index = companyPaymentDataState.findIndex((p) => p.id === id);
    if (index === -1) return false;
    const wasPrimary = companyPaymentDataState[index].isPrimary;
    companyPaymentDataState.splice(index, 1);
    if (wasPrimary && companyPaymentDataState.length > 0) {
      companyPaymentDataState[0].isPrimary = true;
    }
    notifyListeners();
    return true;
  },

  /**
   * Retorna a agenda de trabalho diária
   */
  getAgendaDoDia(): AgendaDiariaCobranca[] {
    // Keep reference updated
    agendaState.forEach((item) => {
      const liveDebt = debtsState.find((d) => d.id === item.debtId);
      if (liveDebt) item.debt = liveDebt;
    });
    return [...agendaState];
  },

  /**
   * Retorna a próxima cobrança pendente na fila diária de trabalho
   */
  getProximaCobrancaPendente(excludeDebtId?: string): Debt | undefined {
    const pendenteItem = agendaState.find(
      (a) => a.status === 'Pendente' && a.debtId !== excludeDebtId
    );
    if (!pendenteItem) return undefined;
    return debtsState.find((d) => d.id === pendenteItem.debtId);
  },

  /**
   * Resumo consolidado da Produção do Dia
   */
  getProducaoDoDia(): ResumoProducaoDia {
    const totalPrevistas = 42;
    // Count how many contacts were dynamically registered in this session
    const newlyWorkedCount = agendaState.filter((a) => a.status === 'Trabalhada' && a.workedAt).length;
    // Carlos starts with 18 trabalhadas and 24 pendentes as per prompt specification
    const totalTrabalhadas = Math.min(totalPrevistas, 18 + newlyWorkedCount);
    const pendentes = Math.max(0, totalPrevistas - totalTrabalhadas);

    const valorCarteiraTotal = 384200.0;
    const valorTrabalhadoTotal = (valorCarteiraTotal * totalTrabalhadas) / totalPrevistas;

    // Sum base R$ 3.200,00 + newly confirmed payments
    const newPaymentsTotal = debtsState.reduce((acc, d) => {
      const todayPay = d.payments.filter((p) => p.id.startsWith('pay-'));
      return acc + todayPay.reduce((pAcc, p) => pAcc + p.value, 0);
    }, 0);
    const valorRecuperado = 3200.0 + newPaymentsTotal;

    // Sum base R$ 5.400,00 + newly registered promises
    const newPromisesTotal = debtsState.reduce((acc, d) => {
      const todayProm = d.promises.filter((p) => p.id.startsWith('p-'));
      return acc + todayProm.reduce((pAcc, p) => pAcc + p.promisedValue, 0);
    }, 0);
    const valorPrometido = 5400.0 + newPromisesTotal;

    const qtdPromessas = 6 + debtsState.reduce((acc, d) => acc + d.promises.filter((p) => p.id.startsWith('p-')).length, 0);
    const qtdRetornos = 6 + debtsState.reduce((acc, d) => acc + d.scheduledReturns.filter((r) => r.id.startsWith('sr-')).length, 0);

    return {
      date: currentOperationalDate,
      operatorName: 'Carlos Eduardo',
      metaDiaria: 30,
      previstas: totalPrevistas,
      trabalhadas: totalTrabalhadas,
      pendentes: pendentes,
      percentualRealizado: Math.round((totalTrabalhadas / totalPrevistas) * 100),
      valorCarteira: valorCarteiraTotal,
      valorTrabalhado: valorTrabalhadoTotal,
      valorRecuperado,
      valorPrometido,
      qtdPromessas,
      qtdRetornos,
      isFinished: isDayFinished,
    };
  },

  /**
   * Registra a ação de cobrança (FAZ) e marca como TRABALHADA na Agenda Diária.
   * Não pede nome do operador (identificação automática).
   */
  registerContact(
    debtId: string,
    payload: ContactRegistrationPayload,
    currentUser: User
  ): {
    success: boolean;
    debt?: Debt;
    nextDebtId?: string;
    isQueueFinished?: boolean;
  } {
    const debtIndex = debtsState.findIndex((d) => d.id === debtId);
    if (debtIndex === -1) {
      return { success: false };
    }

    const currentDebt = debtsState[debtIndex];
    const now = new Date();
    const dateFormatted = currentOperationalDate;
    const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    // Create history item
    const newHistoryItem: DebtHistoryItem = {
      id: `h-${Date.now()}`,
      debtId: currentDebt.id,
      timestamp: now.toISOString(),
      dateFormatted,
      timeFormatted,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.roleTitle,
      channel: payload.channel,
      result: payload.result,
      contactPerson: payload.contactPerson || undefined,
      notes: payload.notes || `Contato realizado via ${payload.channel}.`,
    };

    // Update last contact
    currentDebt.lastContact = {
      date: dateFormatted,
      time: timeFormatted,
      operatorName: currentUser.name,
      channel: payload.channel,
      result: payload.result,
      summary: `Por ${currentUser.name} (${payload.channel})`,
    };

    // If promise attached
    if (payload.hasPromise && payload.promisedValue && payload.promisedDate) {
      const promisedVal =
        typeof payload.promisedValue === 'string'
          ? parseFloat(String(payload.promisedValue).replace(/\./g, '').replace(',', '.'))
          : payload.promisedValue;

      const newPromise: PromiseRecord = {
        id: `p-${Date.now()}`,
        debtId: currentDebt.id,
        dateRegistered: `${dateFormatted} ${timeFormatted}`,
        promisedDate: payload.promisedDate,
        promisedValue: promisedVal,
        operatorName: currentUser.name,
        status: 'Pendente (Vigente)',
        notes: payload.notes || 'Promessa vinculada pelo operador.',
      };

      currentDebt.promises.unshift(newPromise);
      currentDebt.activePromise = {
        dateRegistered: `${dateFormatted} ${timeFormatted}`,
        promisedDate: payload.promisedDate,
        promisedValue: promisedVal,
        operatorName: currentUser.name,
        status: 'vigente',
        notes: payload.notes,
      };

      currentDebt.status = 'promessa_firme';
      currentDebt.statusLabel = 'Promessa Vigente / PTP Registrada';

      newHistoryItem.attachedPromise = {
        promisedDate: payload.promisedDate,
        promisedValue: promisedVal,
        status: 'Vigente',
      };
    }

    // If payment attached or result is 'Pagou'
    if (payload.hasPayment || payload.result === 'Pagou') {
      const payVal = payload.receivedValue
        ? typeof payload.receivedValue === 'string'
          ? parseFloat(String(payload.receivedValue).replace(/\./g, '').replace(',', '.'))
          : payload.receivedValue
        : currentDebt.currentValue;

      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        debtId: currentDebt.id,
        date: payload.paymentDate || dateFormatted,
        value: payVal,
        method: payload.channel === 'WhatsApp' ? 'PIX' : 'TED Bancário',
        status: 'Liquidado',
      };

      currentDebt.payments.unshift(newPayment);
      currentDebt.status = 'pago';
      currentDebt.statusLabel = 'Pago / Liquidado';

      newHistoryItem.attachedPayment = {
        paymentDate: payload.paymentDate || dateFormatted,
        receivedValue: payVal,
      };
    }

    // If scheduled return attached
    if (payload.hasReturn && payload.returnDate && payload.returnTime) {
      const newReturn: ScheduledReturnRecord = {
        id: `sr-${Date.now()}`,
        debtId: currentDebt.id,
        date: payload.returnDate,
        time: payload.returnTime,
        reason: payload.returnReason || 'Retorno agendado',
        responsibleName: currentUser.name,
        status: 'Agendado',
      };

      currentDebt.scheduledReturns.unshift(newReturn);
      currentDebt.nextReturn = {
        date: payload.returnDate,
        time: payload.returnTime,
        reason: payload.returnReason || 'Retorno agendado',
        assignedToName: currentUser.name,
      };

      if (currentDebt.status !== 'pago' && currentDebt.status !== 'promessa_firme') {
        currentDebt.status = 'retorno_agendado';
        currentDebt.statusLabel = 'Retorno Agendado';
      }

      newHistoryItem.attachedReturn = {
        returnDate: payload.returnDate,
        returnTime: payload.returnTime,
        reason: payload.returnReason || 'Retorno agendado',
      };
    }

    // Other results
    if (payload.result === 'Não atende' || payload.result === 'Não responde') {
      if (currentDebt.status !== 'promessa_firme' && currentDebt.status !== 'pago') {
        currentDebt.status = 'sem_contato';
        currentDebt.statusLabel = 'Sem Contato / Não Atendeu';
      }
    } else if (payload.result === 'Promessa Não Cumprida') {
      currentDebt.status = 'quebrou_acordo';
      currentDebt.statusLabel = 'Promessa Não Cumprida / Quebrada';
    } else if (payload.result === 'Contestação') {
      currentDebt.status = 'em_negociacao';
      currentDebt.statusLabel = 'Em Contestação Comercial';
    }

    // Add to beginning of history
    currentDebt.history.unshift(newHistoryItem);

    // REGRA FUNDAMENTAL: Marcar como TRABALHADA na Agenda Diária
    const agendaItemIndex = agendaState.findIndex((a) => a.debtId === currentDebt.id);
    if (agendaItemIndex !== -1) {
      agendaState[agendaItemIndex].status = 'Trabalhada';
      agendaState[agendaItemIndex].workedAt = now.toISOString();
      agendaState[agendaItemIndex].lastResult = payload.result;
    } else {
      agendaState.push({
        id: `ag-${currentDebt.id}`,
        debtId: currentDebt.id,
        debt: currentDebt,
        date: currentOperationalDate,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        status: 'Trabalhada',
        order: agendaState.length + 1,
        workedAt: now.toISOString(),
        lastResult: payload.result,
      });
    }

    // Encontrar próxima cobrança pendente na agenda
    const proximaPendente = this.getProximaCobrancaPendente(currentDebt.id);
    const isQueueFinished = !proximaPendente;

    notifyListeners();

    return {
      success: true,
      debt: currentDebt,
      nextDebtId: proximaPendente ? proximaPendente.id : undefined,
      isQueueFinished,
    };
  },

  /**
   * Encerra a agenda do dia (FINISH):
   * Transfere as cobranças não trabalhadas para o próximo dia
   */
  finishDay(): {
    transferredCount: number;
    workedCount: number;
    newDate: string;
  } {
    const producao = this.getProducaoDoDia();
    const transferredCount = producao.pendentes;
    const workedCount = producao.trabalhadas;

    const pendentes = agendaState.filter((a) => a.status === 'Pendente');

    // Mark pending ones as Transferred
    agendaState.forEach((item) => {
      if (item.status === 'Pendente') {
        item.status = 'Transferida para o próximo dia';
        item.transferredAt = new Date().toISOString();
      }
    });

    isDayFinished = true;

    // Simulate transition to next day (e.g. 05/11/2024)
    currentOperationalDate = '05/11/2024';

    // The transferred debts are now carried over to the new day's agenda!
    const newAgenda: AgendaDiariaCobranca[] = [
      ...pendentes.map((p, idx) => ({
        id: `ag-next-${p.debtId}`,
        debtId: p.debtId,
        debt: p.debt,
        date: currentOperationalDate,
        operatorId: p.operatorId,
        operatorName: p.operatorName,
        status: 'Pendente' as const,
        order: idx + 1,
        isCarriedOver: true,
      })),
      // Add fresh debts for the new day
      ...debtsState
        .filter((d) => !pendentes.some((p) => p.debtId === d.id))
        .map((d, idx) => ({
          id: `ag-fresh-${d.id}`,
          debtId: d.id,
          debt: d,
          date: currentOperationalDate,
          operatorId: d.assignedTo.id,
          operatorName: d.assignedTo.name,
          status: 'Pendente' as const,
          order: pendentes.length + idx + 1,
          isCarriedOver: false,
        })),
    ];

    agendaState = newAgenda;
    isDayFinished = false; // new day starts open

    notifyListeners();

    return {
      transferredCount,
      workedCount,
      newDate: currentOperationalDate,
    };
  },

  getAuditedRecords(filters?: {
    periodFrom?: string;
    periodTo?: string;
    operator?: string;
    status?: string;
    channel?: string;
    search?: string;
  }) {
    let result = [...debtsState];

    if (filters?.operator && filters.operator !== 'Todos os Cobradores') {
      result = result.filter((d) => d.assignedTo.name.includes(filters.operator!));
    }

    if (filters?.status && filters.status !== 'Todos os Status') {
      const st = filters.status.toLowerCase();
      if (st.includes('pago')) result = result.filter((d) => d.status === 'pago');
      else if (st.includes('negociação'))
        result = result.filter((d) => d.status === 'em_negociacao');
      else if (st.includes('promessa'))
        result = result.filter((d) => d.status === 'promessa_firme');
      else if (st.includes('quebrada') || st.includes('não cumprida'))
        result = result.filter((d) => d.status === 'quebrou_acordo');
      else if (st.includes('sem contato'))
        result = result.filter((d) => d.status === 'sem_contato');
    }

    if (filters?.channel && filters.channel !== 'Todos os Canais') {
      result = result.filter((d) =>
        d.history.some((h) => h.channel.toLowerCase().includes(filters.channel!.toLowerCase()))
      );
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (d) =>
          d.debtorName.toLowerCase().includes(q) ||
          d.debtorCnpjCpf.includes(q) ||
          d.titleNumber.toLowerCase().includes(q) ||
          d.assignedTo.name.toLowerCase().includes(q)
      );
    }

    return result;
  },

  getSummaryMetrics() {
    const totalDebtsCount = debtsState.length;
    const totalDebtAmount = debtsState.reduce((acc, d) => acc + d.currentValue, 0);

    const paidDebts = debtsState.filter((d) => d.status === 'pago');
    const totalRecovered = debtsState.reduce(
      (acc, d) => acc + d.payments.reduce((pAcc, p) => pAcc + p.value, 0),
      0
    );

    const promisedDebts = debtsState.filter((d) => d.activePromise?.status === 'vigente');
    const totalPromised = promisedDebts.reduce(
      (acc, d) => acc + (d.activePromise?.promisedValue || 0),
      0
    );

    const brokenPromises = debtsState.filter((d) => d.status === 'quebrou_acordo');
    const brokenPromisesAmount = brokenPromises.reduce((acc, d) => acc + d.currentValue, 0);

    const scheduledReturnsCount = debtsState.filter((d) => !!d.nextReturn).length;

    return {
      totalDebtsCount,
      totalDebtAmount,
      totalRecovered: totalRecovered || 142850.0,
      totalPromised: totalPromised || 78400.0,
      promisedDebtsCount: promisedDebts.length || 8,
      paidDebtsCount: paidDebts.length || 14,
      brokenPromisesCount: brokenPromises.length || 3,
      brokenPromisesAmount: brokenPromisesAmount || 14120.0,
      scheduledReturnsCount: scheduledReturnsCount || 6,
    };
  },
};
