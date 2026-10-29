-- ==============================================================================
-- ALTHUS by DATALIS — Script DDL do Banco de Dados PostgreSQL / Supabase (MVP v1.1)
-- Multi-Tenant Seguro (F-03), RLS, Criptografia/Blind Index (ADR-002) e Auditoria (F-10)
-- ==============================================================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABELA DE EMPRESAS (Tenants)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_fantasia VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255),
    documento_encrypted TEXT NOT NULL,          -- AES-256-GCM do CPF ou CNPJ
    documento_blind_index VARCHAR(64) NOT NULL UNIQUE, -- HMAC-SHA256 para busca exata e unicidade
    estado VARCHAR(2) NOT NULL,
    tipo_negocio VARCHAR(100) NOT NULL,
    regime_tributario VARCHAR(50),
    saldo_inicial_caixa DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    dias_funcionamento_mes INT NOT NULL DEFAULT 26,
    limite_desconto_operador DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
    retirada_mensal_dono DECIMAL(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_empresas_blind_index ON empresas(documento_blind_index);

-- ------------------------------------------------------------------------------
-- 2. TABELA DE USUÁRIOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,           -- bcrypt hash
    role VARCHAR(20) NOT NULL CHECK (role IN ('DONO', 'OPERADOR')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- ------------------------------------------------------------------------------
-- 3. TABELA DE PRODUTOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    codigo_barras VARCHAR(100),
    unidade VARCHAR(10) NOT NULL DEFAULT 'un' CHECK (unidade IN ('un', 'kg')),
    custo_unitario DECIMAL(15, 2) NOT NULL CHECK (custo_unitario >= 0),
    preco_venda DECIMAL(15, 2) NOT NULL CHECK (preco_venda >= 0),
    estoque_atual DECIMAL(15, 3) NOT NULL DEFAULT 0.000,
    estoque_minimo DECIMAL(15, 3) NOT NULL DEFAULT 0.000,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    possui_variacoes BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_empresa_produto_barcode UNIQUE(empresa_id, codigo_barras)
);

CREATE INDEX IF NOT EXISTS idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_busca ON produtos(empresa_id, nome);

-- ------------------------------------------------------------------------------
-- 4. TABELA DE VARIAÇÕES DE PRODUTO (Tamanho e Cor - F-26)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produto_variacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tamanho VARCHAR(50) NOT NULL,
    cor VARCHAR(50) NOT NULL,
    codigo_barras VARCHAR(100),
    custo_unitario_proprio DECIMAL(15, 2),
    preco_venda_proprio DECIMAL(15, 2),
    estoque_atual DECIMAL(15, 3) NOT NULL DEFAULT 0.000,
    estoque_minimo DECIMAL(15, 3) NOT NULL DEFAULT 0.000,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_empresa_variacao_barcode UNIQUE(empresa_id, codigo_barras)
);

CREATE INDEX IF NOT EXISTS idx_variacoes_produto ON produto_variacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_variacoes_empresa ON produto_variacoes(empresa_id);

-- ------------------------------------------------------------------------------
-- 5. MOVIMENTAÇÕES DE ESTOQUE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimentos_estoque (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    produto_id UUID NOT NULL REFERENCES produtos(id),
    variacao_id UUID REFERENCES produto_variacoes(id),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('ENTRADA_MANUAL', 'ENTRADA_XML', 'VENDA', 'DEVOLUCAO', 'AJUSTE_INVENTARIO', 'AJUSTE_MANUAL')),
    quantidade DECIMAL(15, 3) NOT NULL,
    custo_unitario DECIMAL(15, 2),
    motivo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mov_estoque_empresa ON movimentos_estoque(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mov_estoque_produto ON movimentos_estoque(produto_id);

-- ------------------------------------------------------------------------------
-- 6. TABELA DE CLIENTES (F-11 / LGPD)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    documento_encrypted TEXT,
    documento_blind_index VARCHAR(64),
    telefone VARCHAR(30),
    email VARCHAR(255),
    endereco TEXT,
    observacoes TEXT,
    limite_credito DECIMAL(15, 2),
    consentimento_lgpd_aceito BOOLEAN NOT NULL DEFAULT TRUE,
    consentimento_lgpd_data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consentimento_lgpd_finalidade VARCHAR(255) NOT NULL DEFAULT 'Venda, cobrança e emissão gerencial',
    consentimento_lgpd_usuario_id UUID REFERENCES usuarios(id),
    anonimizado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_empresa_cliente_blind_index UNIQUE(empresa_id, documento_blind_index)
);

CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(empresa_id);

-- ------------------------------------------------------------------------------
-- 7. TABELA DE DESPESAS (F-06)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    descricao VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('FIXA', 'VARIAVEL')),
    categoria VARCHAR(50) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL CHECK (valor > 0),
    data_competencia DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGA')),
    data_pagamento DATE,
    forma_pagamento VARCHAR(50),
    recorrente_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_despesas_empresa ON despesas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_despesas_vencimento ON despesas(empresa_id, data_vencimento);

-- ------------------------------------------------------------------------------
-- 8. TABELA DE DESPESAS RECORRENTES (F-14)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS despesas_recorrentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    descricao VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('FIXA', 'VARIAVEL')),
    categoria VARCHAR(50) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL CHECK (valor > 0),
    dia_vencimento INT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. TABELA DE VENDAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    cliente_id UUID REFERENCES clientes(id),
    origem VARCHAR(30) NOT NULL CHECK (origem IN ('IMPORTACAO', 'PDV_NATIVO')),
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMADA' CHECK (status IN ('CONFIRMADA', 'CANCELADA', 'DEVOLVIDA')),
    valor_bruto DECIMAL(15, 2) NOT NULL CHECK (valor_bruto >= 0),
    valor_desconto DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    valor_liquido DECIMAL(15, 2) NOT NULL CHECK (valor_liquido >= 0),
    forma_pagamento VARCHAR(30) NOT NULL,
    data_hora_venda TIMESTAMPTZ NOT NULL,
    motivo_cancelamento TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendas_empresa_data ON vendas(empresa_id, data_hora_venda);

-- ------------------------------------------------------------------------------
-- 10. ITENS DA VENDA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS itens_venda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES produtos(id),
    variacao_id UUID REFERENCES produto_variacoes(id),
    quantidade DECIMAL(15, 3) NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(15, 2) NOT NULL CHECK (preco_unitario >= 0),
    custo_unitario_momento DECIMAL(15, 2) NOT NULL DEFAULT 0.00, -- RN-01: custo congelado no momento da venda
    valor_desconto DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    valor_total DECIMAL(15, 2) NOT NULL CHECK (valor_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_itens_venda ON itens_venda(venda_id);

-- ------------------------------------------------------------------------------
-- 11. TABELA DE AUDITORIA E LOGS (F-10)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(100) NOT NULL,
    registro_id UUID,
    estado_anterior JSONB,
    estado_novo JSONB,
    detalhes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria_logs(empresa_id, created_at);

-- ------------------------------------------------------------------------------
-- 12. ROW-LEVEL SECURITY (RLS) PARA ISOLAMENTO MULTI-TENANT (F-03)
-- ------------------------------------------------------------------------------
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produto_variacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas_recorrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS padrão por sessão do Postgres
CREATE POLICY tenant_isolation_produtos ON produtos
    FOR ALL
    USING (empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::uuid);

CREATE POLICY tenant_isolation_variacoes ON produto_variacoes
    FOR ALL
    USING (empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::uuid);

CREATE POLICY tenant_isolation_clientes ON clientes
    FOR ALL
    USING (empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::uuid);

CREATE POLICY tenant_isolation_despesas ON despesas
    FOR ALL
    USING (empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::uuid);

CREATE POLICY tenant_isolation_vendas ON vendas
    FOR ALL
    USING (empresa_id = NULLIF(current_setting('app.current_empresa_id', true), '')::uuid);
