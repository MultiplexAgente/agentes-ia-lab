-- =====================================================================================
-- MIGRATION: 001_initial_schema.sql
-- DESCRIÇÃO: Estrutura completa de banco de dados Multi-Tenant para Agente de IA Omnichannel
-- SUPABASE / POSTGRESQL COM RLS E ISOLAMENTO POR TENANT (company_id)
-- =====================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES (Empresas / Tenants)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    document VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'pro',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AGENTS (Agentes de IA)
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT,
    language VARCHAR(10) DEFAULT 'pt-BR',
    active BOOLEAN DEFAULT TRUE,
    auto_reply BOOLEAN DEFAULT TRUE,
    human_handoff_enabled BOOLEAN DEFAULT TRUE,
    model VARCHAR(50) DEFAULT 'gpt-4o-mini',
    temperature NUMERIC(3,2) DEFAULT 0.3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AGENT_SETTINGS
CREATE TABLE IF NOT EXISTS agent_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    fallback_message TEXT DEFAULT 'Vou confirmar essa informação com nossa equipe e já te respondo.',
    out_of_hours_message TEXT DEFAULT 'Nosso atendimento está fechado no momento. Nosso horário de funcionamento é das 18h às 23h.',
    allow_orders BOOLEAN DEFAULT TRUE,
    allow_payments BOOLEAN DEFAULT TRUE,
    max_tokens_per_response INT DEFAULT 800,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_agent_settings UNIQUE (agent_id)
);

-- 4. AGENT_PERSONALITY
CREATE TABLE IF NOT EXISTS agent_personality (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tone VARCHAR(50) DEFAULT 'friendly', -- friendly, professional, casual, objective
    formality VARCHAR(50) DEFAULT 'informal', -- formal, informal, balanced
    use_emojis BOOLEAN DEFAULT TRUE,
    response_length VARCHAR(50) DEFAULT 'concise', -- short, concise, detailed
    commercial_style VARCHAR(50) DEFAULT 'consultative', -- consultative, direct, aggressive
    custom_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_agent_personality UNIQUE (agent_id)
);

-- 5. AGENT_RULES
CREATE TABLE IF NOT EXISTS agent_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    rule_text TEXT NOT NULL,
    priority INT DEFAULT 1, -- Maior número = maior prioridade
    condition_trigger VARCHAR(100), -- ex: 'order_burger', 'ask_discount', 'complaint'
    action_type VARCHAR(100), -- ex: 'offer_fries', 'block_discount', 'transfer_to_human'
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CHANNELS (Canais suportados)
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'whatsapp', 'instagram', 'facebook', 'telegram'
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
    webhook_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_company_channel_type UNIQUE (company_id, type)
);

-- 7. CHANNEL_CREDENTIALS (Credenciais seguras isoladas do front)
CREATE TABLE IF NOT EXISTS channel_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_id VARCHAR(255),
    phone_number_id VARCHAR(255),
    access_token TEXT,
    verify_token VARCHAR(255),
    app_secret TEXT,
    extra_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_channel_credentials UNIQUE (channel_id)
);

-- 8. CUSTOMERS (Clientes atendidos)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    avatar_url TEXT,
    address JSONB DEFAULT '{}',
    notes TEXT,
    total_orders INT DEFAULT 0,
    lifetime_value NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CUSTOMER_CHANNELS (Identificadores em cada rede)
CREATE TABLE IF NOT EXISTS customer_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    channel_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'instagram', 'facebook', 'telegram'
    external_id VARCHAR(255) NOT NULL, -- Telefone no WhatsApp, IGSID no Instagram, etc.
    profile_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_customer_channel UNIQUE (company_id, channel_type, external_id)
);

-- 10. CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    channel_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- NEW, ACTIVE, WAITING_CUSTOMER, WAITING_PAYMENT, WAITING_HUMAN, HUMAN_ACTIVE, COMPLETED, CLOSED
    assigned_user_id UUID,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL, -- 'customer', 'agent', 'human'
    external_message_id VARCHAR(255),
    text TEXT,
    media_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'audio', 'document'
    media_url TEXT,
    status VARCHAR(50) DEFAULT 'sent', -- 'received', 'sent', 'delivered', 'read', 'failed'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. MESSAGE_ATTACHMENTS
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    file_type VARCHAR(50),
    file_name VARCHAR(255),
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. KNOWLEDGE_BASE
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'products', 'services', 'prices', 'faq', 'policies', 'business_hours', 'delivery', 'payments', 'general'
    content TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. KNOWLEDGE_DOCUMENTS (Arquivos anexados)
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'pdf', 'docx', 'txt', 'csv', 'xlsx'
    file_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'processed', -- 'uploaded', 'processing', 'processed', 'failed'
    extracted_text TEXT,
    chunks_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. KNOWLEDGE_ITEMS (Conhecimento Estruturado aprendido por conversa/correções)
CREATE TABLE IF NOT EXISTS knowledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    item_type VARCHAR(100) NOT NULL, -- 'product_price', 'delivery_fee', 'business_hour', 'policy', 'correction'
    subject VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    source VARCHAR(50) DEFAULT 'chat_training', -- 'manual', 'chat_training', 'correction', 'document'
    history JSONB[] DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. PRODUCT_CATEGORIES (Cardápio / Categorias)
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_company_category_slug UNIQUE (company_id, slug)
);

-- 17. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    available BOOLEAN DEFAULT TRUE,
    ingredients TEXT[] DEFAULT '{}',
    preparation_time_minutes INT DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. PRODUCT_VARIATIONS & ADDONS
CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- Ex: 'Bacon extra', 'Tamanho Grande'
    variation_type VARCHAR(50) DEFAULT 'addon', -- 'addon', 'size', 'flavor'
    additional_price NUMERIC(10,2) DEFAULT 0.00,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. SERVICES (Para prestadores de serviço)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2),
    duration_minutes INT DEFAULT 60,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. BUSINESS_HOURS
CREATE TABLE IF NOT EXISTS business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL, -- 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. FAQ
CREATE TABLE IF NOT EXISTS faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. AGENT_MEMORY (Memória de longo prazo por cliente)
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    memory_type VARCHAR(50) NOT NULL, -- 'preference', 'restriction', 'order_habit', 'address'
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    confidence NUMERIC(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_customer_memory_key UNIQUE (customer_id, key)
);

-- 23. AGENT_TOOLS
CREATE TABLE IF NOT EXISTS agent_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    parameters JSONB NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_company_tool UNIQUE (company_id, name)
);

-- 24. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, CONFIRMED, PREPARING, DELIVERING, COMPLETED, CANCELLED
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    delivery_address JSONB DEFAULT '{}',
    payment_method VARCHAR(50) DEFAULT 'PIX',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. ORDER_ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    selected_addons JSONB DEFAULT '[]',
    item_total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL, -- 'pix', 'credit_card', 'cash'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    qr_code TEXT,
    qr_code_url TEXT,
    transaction_id VARCHAR(255),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. HUMAN_HANDOFFS
CREATE TABLE IF NOT EXISTS human_handoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'WAITING', -- 'WAITING', 'ACCEPTED', 'RESOLVED'
    assigned_to VARCHAR(255),
    transferred_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 28. AI_LOGS & AI_USAGE
CREATE TABLE IF NOT EXISTS ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    incoming_message TEXT,
    system_prompt_used TEXT,
    tools_called JSONB DEFAULT '[]',
    knowledge_retrieved JSONB DEFAULT '[]',
    ai_response TEXT,
    tokens_prompt INT DEFAULT 0,
    tokens_completion INT DEFAULT 0,
    estimated_cost_usd NUMERIC(8,6) DEFAULT 0.000000,
    latency_ms INT DEFAULT 0,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_tokens BIGINT DEFAULT 0,
    total_calls INT DEFAULT 0,
    total_cost_usd NUMERIC(10,4) DEFAULT 0.0000,
    CONSTRAINT uq_company_usage_date UNIQUE (company_id, date)
);

-- 29. WEBHOOK_EVENTS & IDEMPOTÊNCIA
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    external_message_id VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    response_status VARCHAR(50) DEFAULT 'SUCCESS',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_webhook_idempotency UNIQUE (company_id, channel, external_message_id)
);

-- 30. INTEGRATION_LOGS (Logs de comunicação com n8n e APIs de mensageria)
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL, -- 'n8n', 'whatsapp', 'instagram', 'facebook', 'telegram'
    direction VARCHAR(20) NOT NULL, -- 'outbound', 'inbound'
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    response_status INT,
    response_body TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================================
-- ÍNDICES DE PERFORMANCE E BUSCA MULTI-TENANT
-- =====================================================================================
CREATE INDEX IF NOT EXISTS idx_conversations_company ON conversations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id, available);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_company ON knowledge_items(company_id, item_type);
CREATE INDEX IF NOT EXISTS idx_agent_memory_customer ON agent_memory(customer_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_company ON ai_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id, status);

-- =====================================================================================
-- ROW LEVEL SECURITY (RLS) PARA CADA TABELA
-- =====================================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_personality ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
