# REGCOBRE — Instruções e Documentação de Migrações do Banco de Dados

Este diretório contém os scripts de migração estrutural para o banco de dados **PostgreSQL 18.6** do sistema RegCobre.

---

## 1. Princípios de Segurança e Governança

1. **Separação Rigorosa de Dados:**
   - Este esquema DDL contém **estritamente a definição estrutural** (tabelas, chaves primárias, estrangeiras, constraints e índices).
   - **Nenhum dado simulado, usuário padrão ou registro de demonstração está presente.**
2. **Execução Manual e Controlada:**
   - O código do backend Express não executa migrações automáticas no startup sem intervenção do administrador da base.
   - A execução deve ser realizada diretamente pelo DBA / administrador na VM `srv-app` utilizando o utilitário nativo `psql`.
3. **Credenciais e Acesso Seguro:**
   - Nenhuma senha ou credencial é armazenada nos arquivos de migração.
   - O acesso ao banco permanece restrito localmente à VM (porta 5432 não exposta à internet).

---

## 2. Mapa das 14 Tabelas

| Ordem | Tabela | Finalidade Operacional |
| :---: | :--- | :--- |
| **1** | `empresas` | Credoras cedentes, filiais e regras de desconto/negociação. |
| **2** | `dados_pagamento_empresa` | Chaves PIX e contas bancárias pertencentes exclusivamente à credora. |
| **3** | `usuarios` | Operadores de cobrança, supervisores e administradores (senhas em hash). |
| **4** | `usuarios_empresas` | Tabela associativa N:N para controle explícito de acesso multi-empresa. |
| **5** | `devedores` | Cadastro de devedores PJ (CNPJ) e PF (CPF). |
| **6** | `devedor_telefones` | Telefones de contato, celulares e indicação de WhatsApp do devedor. |
| **7** | `cobrancas` | Títulos de cobrança da carteira com saldo, vencimento e operador atual. |
| **8** | `cobranca_historico` | Linha do tempo imutável de acionamentos (operador, canal, data/hora e desfecho). |
| **9** | `cobranca_promessas` | Promessas de pagamento (PTP) vinculadas à cobrança e ao acionamento. |
| **10** | `cobranca_retornos` | Agendamentos e callbacks telefônicos vinculados à cobrança. |
| **11** | `cobranca_pagamentos` | Registro de recebimentos, baixas e liquidações financeiras comprovadas. |
| **12** | `cobranca_documentos` | Metadados dos comprovantes, boletos e cartas (arquivos físicos no servidor). |
| **13** | `agenda_trabalho_diario` | Fila operacional diária ordenada atribuída a cada operador. |
| **14** | `importacoes_erp` | Auditoria de lotes de importação de arquivos (XLSX, XLS, CSV). |

---

## 3. Estratégias de Integridade e Desduplicação

* **Desduplicação de Cobranças do ERP:**
  A tabela `cobrancas` implementa a restrição composta:
  ```sql
  CONSTRAINT uq_cobrancas_empresa_titulo_parcela UNIQUE (empresa_id, title_number, installment)
  ```
  Essa regra impede que a importação de novas planilhas gere cobranças duplicadas para a mesma parcela do mesmo título na mesma empresa credora. Nas importações subsequentes, o sistema realiza `ON CONFLICT DO UPDATE` atualizando saldos e atrasos sem violar nem apagar o histórico de atendimentos anterior.

* **Imutabilidade do Histórico de Atendimentos:**
  A tabela `cobranca_historico` registra o `operator_id` (com chave estrangeira restritiva `ON DELETE RESTRICT`) e preserva o `operator_name` no instante da ação. Mesmo que a custódia do título seja transferida para outro cobrador, os acionamentos passados permanecem atribuídos a quem de fato os realizou.

* **Segurança e Armazenamento de Documentos:**
  A tabela `cobranca_documentos` armazena apenas metadados (nome, tipo, tamanho, autor e data). O caminho `file_url` referencia arquivos em diretório restrito do sistema operacional (ex: `/var/data/regcobre/uploads/`), evitando sobrecarga do banco de dados com binários e garantindo validação de permissões antes do download.

---

## 4. Como Executar a Migração no Servidor Ubuntu (`srv-app`)

Quando autorizado, conecte-se via terminal na VM `srv-app` e execute:

```bash
# 1. Acessar o diretório do projeto
cd /caminho/do/projeto/RegCobre

# 2. Executar o script DDL no banco PostgreSQL regcobre usando o usuário regcobre_app
psql -h 127.0.0.1 -p 5432 -U regcobre_app -d regcobre -f src/server/migrations/001_initial_schema.sql

# 3. Conferir a criação das 14 tabelas
psql -h 127.0.0.1 -p 5432 -U regcobre_app -d regcobre -c "\dt"
```

---

## 5. Rollback / Reversão Controlada (Se Necessário)

Caso seja necessário remover as tabelas criadas pela migração 001 (em ambiente de homologação ou teste limpo):

```sql
DROP TABLE IF EXISTS importacoes_erp CASCADE;
DROP TABLE IF EXISTS agenda_trabalho_diario CASCADE;
DROP TABLE IF EXISTS cobranca_documentos CASCADE;
DROP TABLE IF EXISTS cobranca_pagamentos CASCADE;
DROP TABLE IF EXISTS cobranca_retornos CASCADE;
DROP TABLE IF EXISTS cobranca_promessas CASCADE;
DROP TABLE IF EXISTS cobranca_historico CASCADE;
DROP TABLE IF EXISTS cobrancas CASCADE;
DROP TABLE IF EXISTS devedor_telefones CASCADE;
DROP TABLE IF EXISTS devedores CASCADE;
DROP TABLE IF EXISTS usuarios_empresas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS dados_pagamento_empresa CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;
```
