-- =====================================================================================
-- MIGRATION: 002_seed_demo_data.sql
-- DESCRIÇÃO: Dados iniciais para demonstração e testes da Hamburgueria & Agente de IA
-- =====================================================================================

DO $$
DECLARE
    v_company_id UUID := '11111111-1111-1111-1111-111111111111';
    v_agent_id UUID := '22222222-2222-2222-2222-222222222222';
    v_cat_burgers UUID := '33333333-3333-3333-3333-333333333331';
    v_cat_portions UUID := '33333333-3333-3333-3333-333333333332';
    v_cat_drinks UUID := '33333333-3333-3333-3333-333333333333';
    v_prod_xbacon UUID := '44444444-4444-4444-4444-444444444441';
    v_prod_xsalada UUID := '44444444-4444-4444-4444-444444444442';
    v_prod_batata UUID := '44444444-4444-4444-4444-444444444443';
    v_prod_coca UUID := '44444444-4444-4444-4444-444444444444';
    v_customer_id UUID := '55555555-5555-5555-5555-555555555555';
    v_conv_id UUID := '66666666-6666-6666-6666-666666666666';
BEGIN
    -- 1. EMPRESA MODELO
    INSERT INTO companies (id, name, slug, email, phone, plan, active)
    VALUES (v_company_id, 'Hamburgueria Artesanal Anthony', 'hamburgueria-anthony', 'contato@anthonyburgers.com', '+5511999998888', 'pro', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- 2. AGENTE VIRTUAL
    INSERT INTO agents (id, company_id, name, description, system_prompt, language, active, auto_reply, human_handoff_enabled, model)
    VALUES (v_agent_id, v_company_id, 'AnthonyBot Atendente', 'Atendente virtual especialista no cardápio, pedidos e atendimento via redes sociais', 
    'Você é o assistente virtual da Hamburgueria Artesanal Anthony. Seja prestativo, ágil e garanta precisão total nos pedidos e preços.', 'pt-BR', TRUE, TRUE, TRUE, 'gpt-4o-mini')
    ON CONFLICT (id) DO NOTHING;

    -- 3. CONFIGURAÇÕES DO AGENTE
    INSERT INTO agent_settings (agent_id, company_id, fallback_message, out_of_hours_message, allow_orders, allow_payments)
    VALUES (v_agent_id, v_company_id, 'Vou confirmar esse detalhe com a cozinha e já te respondo!', 'Estamos fechados no momento! Nosso horário é de Terça a Domingo das 18:00 às 23:00.', TRUE, TRUE)
    ON CONFLICT (agent_id) DO NOTHING;

    -- 4. PERSONALIDADE
    INSERT INTO agent_personality (agent_id, company_id, tone, formality, use_emojis, response_length, commercial_style, custom_instructions)
    VALUES (v_agent_id, v_company_id, 'friendly', 'informal', TRUE, 'concise', 'consultative', 'Sempre chame o cliente pelo primeiro nome quando disponível. Use emojis de hambúrguer 🍔 e batata 🍟 com moderação.')
    ON CONFLICT (agent_id) DO NOTHING;

    -- 5. REGRAS DE NEGÓCIO COM PRIORIDADES
    INSERT INTO agent_rules (agent_id, company_id, rule_text, priority, condition_trigger, action_type, active)
    VALUES 
    (v_agent_id, v_company_id, 'Quando o cliente pedir hambúrguer, ofereça batata frita como acompanhamento adicional.', 5, 'order_burger', 'offer_fries', TRUE),
    (v_agent_id, v_company_id, 'Nunca conceder descontos não cadastrados sob hipótese alguma.', 10, 'ask_discount', 'block_discount', TRUE),
    (v_agent_id, v_company_id, 'Não aceitar pedidos fora do horário de funcionamento.', 9, 'out_of_hours', 'reject_order', TRUE),
    (v_agent_id, v_company_id, 'Transferir imediatamente para atendente humano quando houver reclamação ou pedido explícito.', 10, 'complaint', 'transfer_to_human', TRUE),
    (v_agent_id, v_company_id, 'Nunca inventar preços de produtos ou taxas de entrega ausentes na base.', 10, 'price_inquiry', 'strict_knowledge', TRUE)
    ON CONFLICT DO NOTHING;

    -- 6. CANAIS
    INSERT INTO channels (company_id, type, name, status, active)
    VALUES 
    (v_company_id, 'whatsapp', 'WhatsApp Oficial', 'connected', TRUE),
    (v_company_id, 'instagram', 'Instagram Direct (@Anthony)', 'connected', TRUE),
    (v_company_id, 'facebook', 'Facebook Messenger Página', 'disconnected', TRUE),
    (v_company_id, 'telegram', 'Telegram Bot Atendimento', 'connected', TRUE)
    ON CONFLICT DO NOTHING;

    -- 7. CATEGORIAS DE CARDÁPIO
    INSERT INTO product_categories (id, company_id, name, slug, description, sort_order)
    VALUES 
    (v_cat_burgers, v_company_id, 'Hambúrgueres Artesanais', 'hamburgueres', 'Feitos na brasa com blend 100% bovino', 1),
    (v_cat_portions, v_company_id, 'Porções & Acompanhamentos', 'porcoes', 'Batatas crocantes e petiscos', 2),
    (v_cat_drinks, v_company_id, 'Bebidas Geladas', 'bebidas', 'Refrigerantes, sucos e água', 3)
    ON CONFLICT (id) DO NOTHING;

    -- 8. PRODUTOS DO CARDÁPIO
    INSERT INTO products (id, company_id, category_id, name, description, price, available, ingredients)
    VALUES 
    (v_prod_xbacon, v_company_id, v_cat_burgers, 'X-Bacon Artesanal', 'Pão brioche, hambúrguer 160g na brasa, queijo cheddar, fatias generosas de bacon crocante e molho especial da casa.', 25.00, TRUE, ARRAY['pão brioche', 'blend 160g', 'queijo cheddar', 'bacon crocante', 'molho especial']),
    (v_prod_xsalada, v_company_id, v_cat_burgers, 'X-Salada Tradicional', 'Pão com gergelim, hambúrguer 160g, queijo prato, alface americana fresca, tomate e maionese artesanal.', 22.00, TRUE, ARRAY['pão gergelim', 'blend 160g', 'queijo prato', 'alface', 'tomate', 'maionese artesanal']),
    (v_prod_batata, v_company_id, v_cat_portions, 'Batata Frita Rústica Média', 'Batatas cortadas em gomos crocantes temperadas com páprica doce e sal fino.', 12.00, TRUE, ARRAY['batata', 'páprica', 'sal fino']),
    (v_prod_coca, v_company_id, v_cat_drinks, 'Coca-Cola Lata 350ml', 'Lata gelada 350ml tradicional.', 6.00, TRUE, ARRAY['refrigerante'])
    ON CONFLICT (id) DO NOTHING;

    -- 9. ADICIONAIS / VARIAÇÕES
    INSERT INTO product_variations (product_id, company_id, name, variation_type, additional_price)
    VALUES 
    (v_prod_xbacon, v_company_id, 'Bacon Extra em Tiras', 'addon', 5.00),
    (v_prod_xbacon, v_company_id, 'Queijo Cheddar Extra', 'addon', 3.00),
    (v_prod_xbacon, v_company_id, 'Hambúrguer Extra 160g', 'addon', 9.00)
    ON CONFLICT DO NOTHING;

    -- 10. BASE DE CONHECIMENTO E KNOWLEDGE ITEMS ESTRUTURADOS
    INSERT INTO knowledge_items (company_id, item_type, subject, data, source)
    VALUES 
    (v_company_id, 'delivery_fee', 'taxa_entrega_centro', '{"region": "centro", "fee": 5.00, "estimated_time_min": 30}'::jsonb, 'chat_training'),
    (v_company_id, 'delivery_fee', 'taxa_entrega_bairros', '{"region": "bairros_proximos", "fee": 8.00, "estimated_time_min": 45}'::jsonb, 'chat_training'),
    (v_company_id, 'business_hours', 'horario_funcionamento', '{"days": "Terça a Domingo", "open": "18:00", "close": "23:00", "closed_days": ["Segunda"]}'::jsonb, 'manual'),
    (v_company_id, 'payment_policy', 'formas_pagamento', '{"accepted": ["PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro"], "pix_key": "pix@anthonyburgers.com"}'::jsonb, 'manual')
    ON CONFLICT DO NOTHING;

    -- 11. HORÁRIO DE FUNCIONAMENTO (Tabela estruturada)
    INSERT INTO business_hours (company_id, day_of_week, open_time, close_time, closed)
    VALUES 
    (v_company_id, 0, '18:00', '23:00', FALSE), -- Domingo
    (v_company_id, 1, '18:00', '23:00', TRUE),  -- Segunda (Fechado)
    (v_company_id, 2, '18:00', '23:00', FALSE), -- Terça
    (v_company_id, 3, '18:00', '23:00', FALSE), -- Quarta
    (v_company_id, 4, '18:00', '23:00', FALSE), -- Quinta
    (v_company_id, 5, '18:00', '23:30', FALSE), -- Sexta
    (v_company_id, 6, '18:00', '23:30', FALSE)  -- Sábado
    ON CONFLICT DO NOTHING;

    -- 12. CLIENTE DEMO & CONVERSA OMNICHANNEL
    INSERT INTO customers (id, company_id, name, phone, email, address, notes, total_orders, lifetime_value)
    VALUES (v_customer_id, v_company_id, 'João Victor', '+5511987654321', 'joao.victor@exemplo.com', '{"street": "Rua das Flores", "number": "120", "neighborhood": "Centro"}'::jsonb, 'Prefere hambúrguer bem passado.', 3, 115.00)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO customer_channels (customer_id, company_id, channel_type, external_id, profile_name)
    VALUES (v_customer_id, v_company_id, 'instagram', 'joao_victor_insta', 'João Victor')
    ON CONFLICT DO NOTHING;

    INSERT INTO conversations (id, company_id, customer_id, agent_id, channel_type, status, last_message_text, last_message_at, tags)
    VALUES (v_conv_id, v_company_id, v_customer_id, v_agent_id, 'instagram', 'ACTIVE', 'Perfeito! A batata média custa R$12. Posso adicionar ao seu pedido?', NOW(), ARRAY['lead_quente', 'delivery'])
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO messages (conversation_id, company_id, sender_type, text, media_type, status, created_at)
    VALUES 
    (v_conv_id, v_company_id, 'customer', 'Olá! Quanto custa o X-Bacon?', 'text', 'received', NOW() - INTERVAL '3 minutes'),
    (v_conv_id, v_company_id, 'agent', 'Olá João! 🍔 O nosso X-Bacon Artesanal custa R$ 25,00. Quer adicionar uma batatinha rústica média para acompanhar por R$ 12,00?', 'text', 'sent', NOW() - INTERVAL '2 minutes'),
    (v_conv_id, v_company_id, 'customer', 'Sim, quero com batata! Qual a taxa de entrega para o Centro?', 'text', 'received', NOW() - INTERVAL '1 minute'),
    (v_conv_id, v_company_id, 'agent', 'A taxa de entrega para o Centro custa apenas R$ 5,00 e o prazo estimado é de 30 minutos! Total do pedido até agora: R$ 42,00. Qual o endereço completo para eu gerar o pedido?', 'text', 'sent', NOW())
    ON CONFLICT DO NOTHING;

    -- 13. MEMÓRIA DE LONGO PRAZO DO CLIENTE
    INSERT INTO agent_memory (company_id, customer_id, memory_type, key, value)
    VALUES 
    (v_company_id, v_customer_id, 'preference', 'ponto_da_carne', 'bem_passado'),
    (v_company_id, v_customer_id, 'address', 'endereco_padrao', 'Rua das Flores, 120 - Centro')
    ON CONFLICT DO NOTHING;

END $$;
