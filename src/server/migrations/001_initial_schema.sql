-- =============================================================================
-- REGCOBRE — ESQUEMA RELACIONAL INICIAL (POSTGRESQL 18.6)
-- Migração: 001_initial_schema.sql
-- Escopo: Criação das 14 tabelas normalizadas, restrições, integridade e índices.
-- ATENÇÃO: Nenhum dado fictício ou semente está embutido neste arquivo DDL.
-- =============================================================================

-- Extensão recomendada para geração de identificadores UUID (se aplicável)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABELA: empresas
-- Credoras cedentes, filiais e parâmetros operacionais de negociação.
-- =============================================================================
CREATE TABLE IF NOT EXISTS empresas (
    id VARCHAR(64) PRIMARY KEY,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) NOT NULL UNIQUE,
    inscricao_estadual VARCHAR(30),
    telefone VARCHAR(30),
    email VARCHAR(255),
    cep VARCHAR(10),
    endereco VARCHAR(255),
    numero VARCHAR(30),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    modo_carteira VARCHAR(20) NOT NULL DEFAULT 'COMPARTILHADA'
        CHECK (modo_carteira IN ('COMPARTILHADA', 'EXCLUSIVA')),
    permitir_negociacao_nao_vencidas BOOLEAN NOT NULL DEFAULT FALSE,
    desconto_maximo_nao_vencidas NUMERIC(5,2) DEFAULT 0.00
        CHECK (desconto_maximo_nao_vencidas >= 0.00 AND desconto_maximo_nao_vencidas <= 100.00),
    permitir_desconto_vencidos BOOLEAN NOT NULL DEFAULT FALSE,
    desconto_maximo_vencidos NUMERIC(5,2) DEFAULT 0.00
        CHECK (desconto_maximo_vencidos >= 0.00 AND desconto_maximo_vencidos <= 100.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. TABELA: dados_pagamento_empresa
-- Contas bancárias e chaves PIX de titularidade estrita da empresa credora.
-- =============================================================================
CREATE TABLE IF NOT EXISTS dados_pagamento_empresa (
    id VARCHAR(64) PRIMARY KEY,
    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PIX', 'Boleto', 'TED', 'Outro')),
    descricao VARCHAR(255) NOT NULL,
    pix_key_type VARCHAR(20) CHECK (pix_key_type IN ('CPF', 'CNPJ', 'E-mail', 'Telefone', 'Aleatória', 'Outro')),
    pix_key VARCHAR(255),
    payment_info TEXT,
    bank_name VARCHAR(100),
    account_description VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dados_pagamento_empresa_id ON dados_pagamento_empresa(empresa_id);

-- =============================================================================
-- 3. TABELA: usuarios
-- Operadores de cobrança, supervisores e administradores do sistema.
-- Senhas deverão ser persistidas exclusivamente na forma de hash seguro.
-- =============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('cobrador', 'supervisor', 'administrador')),
    role_title VARCHAR(150) NOT NULL,
    unit VARCHAR(150) NOT NULL,
    badge_code VARCHAR(50),
    empresa_principal_id VARCHAR(64) REFERENCES empresas(id) ON DELETE SET NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa_principal ON usuarios(empresa_principal_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);

-- =============================================================================
-- 4. TABELA: usuarios_empresas
-- Associação N:N explícita definindo quais empresas cada operador pode acessar.
-- =============================================================================
CREATE TABLE IF NOT EXISTS usuarios_empresas (
    usuario_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_empresa ON usuarios_empresas(empresa_id);

-- =============================================================================
-- 5. TABELA: devedores
-- Cadastro unificado de clientes inadimplentes (Pessoa Jurídica ou Física).
-- =============================================================================
CREATE TABLE IF NOT EXISTS devedores (
    id VARCHAR(64) PRIMARY KEY,
    erp_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    cnpj_cpf VARCHAR(20) NOT NULL UNIQUE,
    type VARCHAR(2) NOT NULL CHECK (type IN ('PJ', 'PF')),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativa' CHECK (status IN ('Ativa', 'Inativa', 'Suspenso')),
    contact_name VARCHAR(255),
    contact_role VARCHAR(150),
    contact_email VARCHAR(255),
    contact_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devedores_cnpj_cpf ON devedores(cnpj_cpf);
CREATE INDEX IF NOT EXISTS idx_devedores_erp_code ON devedores(erp_code);

-- =============================================================================
-- 6. TABELA: devedor_telefones
-- Telefones, celulares e canais de WhatsApp vinculados ao devedor.
-- =============================================================================
CREATE TABLE IF NOT EXISTS devedor_telefones (
    id VARCHAR(64) PRIMARY KEY,
    devedor_id VARCHAR(64) NOT NULL REFERENCES devedores(id) ON DELETE CASCADE,
    number VARCHAR(30) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Fixo', 'Celular', 'Comercial', 'Financeiro', 'Outro')),
    description VARCHAR(255),
    has_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devedor_telefones_devedor_id ON devedor_telefones(devedor_id);

-- =============================================================================
-- 7. TABELA: cobrancas
-- Títulos e faturas de dívida da carteira de cobrança.
-- A unicidade para importação do ERP reside em (empresa_id, title_number, installment).
-- =============================================================================
CREATE TABLE IF NOT EXISTS cobrancas (
    id VARCHAR(64) PRIMARY KEY,
    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE RESTRICT,
    debtor_id VARCHAR(64) NOT NULL REFERENCES devedores(id) ON DELETE RESTRICT,
    erp_code VARCHAR(50),
    title_number VARCHAR(100) NOT NULL,
    installment VARCHAR(20) NOT NULL DEFAULT '01/01',
    invoice_number VARCHAR(100),
    due_date DATE NOT NULL,
    original_value NUMERIC(15,2) NOT NULL CHECK (original_value >= 0),
    interest_fine NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (interest_fine >= 0),
    current_value NUMERIC(15,2) NOT NULL CHECK (current_value >= 0),
    assigned_to_id VARCHAR(64) REFERENCES usuarios(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'em_aberto'
        CHECK (status IN ('em_aberto', 'em_negociacao', 'promessa_firme', 'retorno_agendado', 'pago', 'quebrou_acordo', 'sem_contato')),
    status_label VARCHAR(100),
    venda_origem JSONB,
    custody_audit JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cobrancas_empresa_titulo_parcela UNIQUE (empresa_id, title_number, installment)
);

CREATE INDEX IF NOT EXISTS idx_cobrancas_empresa_id ON cobrancas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_debtor_id ON cobrancas(debtor_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_assigned_to ON cobrancas(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON cobrancas(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_due_date ON cobrancas(due_date);

-- =============================================================================
-- 8. TABELA: cobranca_historico
-- Linha do tempo imutável de acionamentos e atendimentos realizados.
-- Preserva operador_id, operador_nome, canal, data/hora e desfecho no momento da ação.
-- =============================================================================
CREATE TABLE IF NOT EXISTS cobranca_historico (
    id VARCHAR(64) PRIMARY KEY,
    debt_id VARCHAR(64) NOT NULL REFERENCES cobrancas(id) ON DELETE CASCADE,
    operator_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    operator_name VARCHAR(255) NOT NULL,
    operator_role VARCHAR(150),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    channel VARCHAR(50) NOT NULL,
    result VARCHAR(100) NOT NULL,
    notes TEXT,
    contact_person VARCHAR(255),
    contact_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cobranca_historico_debt_id ON cobranca_historico(debt_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_operator ON cobranca_historico(operator_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_historico_timestamp ON cobranca_historico(contact_timestamp);

-- =============================================================================
-- 9. TABELA: cobranca_promessas
-- Promessas de pagamento (PTP) vinculadas ao acionamento e ao histórico.
-- =============================================================================
CREATE TABLE IF NOT EXISTS cobranca_promessas (
    id VARCHAR(64) PRIMARY KEY,
    debt_id VARCHAR(64) NOT NULL REFERENCES cobrancas(id) ON DELETE CASCADE,
    history_id VARCHAR(64) REFERENCES cobranca_historico(id) ON DELETE SET NULL,
    operator_id VARCHAR(64) REFERENCES usuarios(id) ON DELETE SET NULL,
    operator_name VARCHAR(255) NOT NULL,
    date_registered DATE NOT NULL DEFAULT CURRENT_DATE,
    promised_date DATE NOT NULL,
    promised_value NUMERIC(15,2) NOT NULL CHECK (promised_value >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente (Vigente)'
        CHECK (status IN ('Pendente (Vigente)', 'Não Cumprida / Quebrada', 'Cumprida / Liquidada', 'vigente', 'quebrada', 'cumprida')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cobranca_promessas_debt_id ON cobranca_promessas(debt_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_promessas_history_id ON cobranca_promessas(history_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_promessas_promised_date ON cobranca_promessas(promised_date);
CREATE INDEX IF NOT EXISTS idx_cobranca_promessas_status ON cobranca_promessas(status);

-- =============================================================================
-- 10. TABELA: cobranca_retornos
-- Retornos e callbacks telefônicos agendados com os devedores.
-- =============================================================================
CREATE TABLE IF NOT EXISTS cobranca_retornos (
    id VARCHAR(64) PRIMARY KEY,
    debt_id VARCHAR(64) NOT NULL REFERENCES cobrancas(id) ON DELETE CASCADE,
    history_id VARCHAR(64) REFERENCES cobranca_historico(id) ON DELETE SET NULL,
    responsible_id VARCHAR(64) REFERENCES usuarios(id) ON DELETE SET NULL,
    responsible_name VARCHAR(255) NOT NULL,
    return_date DATE NOT NULL,
    return_time TIME NOT NULL DEFAULT '09:00:00',
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Agendado'
        CHECK (status IN ('Agendado', 'Realizado', 'Em Atraso')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cobranca_retornos_debt_id ON cobranca_retornos(debt_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_retornos_history_id ON cobranca_retornos(history_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_retornos_responsible_id ON cobranca_retornos(responsible_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_retornos_date ON cobranca_retornos(return_date);
CREATE INDEX IF NOT EXISTS idx_cobranca_retornos_status ON cobranca_retornos(status);

-- =============================================================================
-- 11. TABELA: cobranca_pagamentos
-- Recebimentos, baixas e liquidações financeiras comprovadas.
-- =============================================================================
CREATE TABLE IF NOT EXISTS cobranca_pagamentos (
    id VARCHAR(64) PRIMARY KEY,
    debt_id VARCHAR(64) NOT NULL REFERENCES cobrancas(id) ON DELETE CASCADE,
    history_id VARCHAR(64) REFERENCES cobranca_historico(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL,
    value NUMERIC(15,2) NOT NULL CHECK (value > 0),
    method VARCHAR(50) DEFAULT 'PIX',
    status VARCHAR(50) NOT NULL DEFAULT 'Confirmado',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cobranca_pagamentos_debt_id ON cobranca_pagamentos(debt_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_pagamentos_history_id ON cobranca_pagamentos(history_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_pagamentos_date ON cobranca_pagamentos(payment_date);

-- =============================================================================
-- 12. TABELA: cobranca_documentos
-- Metadados de documentos, comprovantes, boletos e cartas anexadas à cobrança.
-- Os binários físicos residem em diretório seguro do servidor e são referenciados via file_url.
-- =============================================================================
CREATE TABLE IF NOT EXISTS cobranca_documentos (
    id VARCHAR(64) PRIMARY KEY,
    debt_id VARCHAR(64) NOT NULL REFERENCES cobrancas(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    tamanho VARCHAR(50),
    file_url TEXT,
    file_type VARCHAR(50),
    observacao TEXT,
    usuario_id VARCHAR(64) REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(255) NOT NULL,
    icone VARCHAR(50) DEFAULT 'description',
    cor_tipo VARCHAR(50) DEFAULT 'text-primary',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cobranca_documentos_debt_id ON cobranca_documentos(debt_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_documentos_usuario_id ON cobranca_documentos(usuario_id);

-- =============================================================================
-- 13. TABELA: agenda_trabalho_diario
-- Fila diária de cobrança atribuída ao operador no início do dia de trabalho.
-- =============================================================================
CREATE TABLE IF NOT EXISTS agenda_trabalho_diario (
    id VARCHAR(64) PRIMARY KEY,
    operator_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    debt_id VARCHAR(64) NOT NULL REFERENCES cobrancas(id) ON DELETE CASCADE,
    operational_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente'
        CHECK (status IN ('Pendente', 'Em andamento', 'Trabalhada', 'Não trabalhada', 'Transferida para o próximo dia')),
    execution_order INT NOT NULL DEFAULT 1,
    worked_at TIMESTAMPTZ,
    transferred_at TIMESTAMPTZ,
    is_carried_over BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_agenda_operator_debt_date UNIQUE (operator_id, debt_id, operational_date)
);

CREATE INDEX IF NOT EXISTS idx_agenda_trabalho_operator_date ON agenda_trabalho_diario(operator_id, operational_date);
CREATE INDEX IF NOT EXISTS idx_agenda_trabalho_debt_id ON agenda_trabalho_diario(debt_id);
CREATE INDEX IF NOT EXISTS idx_agenda_trabalho_status ON agenda_trabalho_diario(status);

-- =============================================================================
-- 14. TABELA: importacoes_erp
-- Histórico e auditoria de lotes de importação de arquivos (XLSX, XLS, CSV).
-- =============================================================================
CREATE TABLE IF NOT EXISTS importacoes_erp (
    id VARCHAR(64) PRIMARY KEY,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_arquivo VARCHAR(10) NOT NULL CHECK (tipo_arquivo IN ('XLSX', 'XLS', 'CSV')),
    usuario_id VARCHAR(64) REFERENCES usuarios(id) ON DELETE SET NULL,
    empresa_id VARCHAR(64) REFERENCES empresas(id) ON DELETE SET NULL,
    data_importacao TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_linhas INT NOT NULL DEFAULT 0,
    linhas_importadas INT NOT NULL DEFAULT 0,
    linhas_ignoradas_duplicadas INT NOT NULL DEFAULT 0,
    linhas_com_erro INT NOT NULL DEFAULT 0,
    mapeamento_colunas JSONB,
    resumo_processamento JSONB,
    status VARCHAR(30) NOT NULL DEFAULT 'Concluído'
        CHECK (status IN ('Em processamento', 'Concluído', 'Falha', 'Parcialmente concluído')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_importacoes_erp_empresa_id ON importacoes_erp(empresa_id);
CREATE INDEX IF NOT EXISTS idx_importacoes_erp_usuario_id ON importacoes_erp(usuario_id);
CREATE INDEX IF NOT EXISTS idx_importacoes_erp_data ON importacoes_erp(data_importacao);
