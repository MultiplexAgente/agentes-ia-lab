import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../backend/src/config/database.js';
import { aiBuilderService } from '../backend/src/services/builder/AIBuilderService.js';
import { DataSourceRegistry } from '../backend/src/services/builder/DataSourceRegistry.js';
import { aiService } from '../backend/src/services/ai/AIService.js';

describe('Correção Definitiva - Dashboard Executivo e AI App Builder', () => {
  const companyId = '11111111-1111-1111-1111-111111111111';
  const convId = 'test-conv-identity';
  const custId = 'test-cust-identity';

  beforeEach(() => {
    store.reset();
    store.conversations.set(convId, {
      id: convId,
      company_id: companyId,
      customer_id: custId,
      channel_type: 'whatsapp',
      status: 'IA_ATIVA',
      last_message_text: 'Olá'
    });
  });

  it('1. Deve inicializar o banco sem dados fictícios (0 pedidos, 0 clientes fake, 0 despesas fake)', () => {
    const customers = store.customers.get(companyId) || [];
    const orders = store.orders.get(companyId) || [];
    const expenses = store.expenses.get(companyId) || [];

    expect(customers.length).toBe(0);
    expect(orders.length).toBe(0);
    expect(expenses.length).toBe(0);
  });

  it('2. AI App Builder deve RECUSAR pedidos de criação de dados fictícios em produção', async () => {
    await expect(
      aiBuilderService.generateBuildPlan({
        companyId,
        prompt: 'Crie 10 clientes fictícios para preencher o dashboard.'
      })
    ).rejects.toThrow(/proibida/i);
  });

  it('3. DataSourceRegistry deve validar fontes existentes e rejeitar fontes inexistentes', () => {
    const validConv = DataSourceRegistry.validateDataSource('conversations', companyId);
    expect(validConv.valid).toBe(true);

    const invalid = DataSourceRegistry.validateDataSource('tabela_inventada_xpto', companyId);
    expect(invalid.valid).toBe(false);
    expect(invalid.reason).toContain('não possui uma fonte de dados configurada');
  });

  it('4. Identidade da IA: deve responder com o nome e apresentação configurados', async () => {
    // Configura a identidade para 'Lia' do 'Restaurante Sabor da Terra'
    store.agentIdentities.set(companyId, {
      id: 'id-test',
      company_id: companyId,
      agent_id: '22222222-2222-2222-2222-222222222222',
      display_name: 'Lia',
      company_name: 'Restaurante Sabor da Terra',
      introduction: 'Olá! Eu sou a Lia, assistente virtual do Restaurante Sabor da Terra. Posso te ajudar com nosso cardápio.',
      role_description: 'Apresentar pratos e receber pedidos',
      auto_introduce: true,
      tone: 'friendly',
      communication_style: 'consultative',
      emoji_usage: 'never',
      language: 'pt-BR',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const result = await aiService.processMessage({
      companyId,
      conversationId: convId,
      incomingText: 'Qual o seu nome e quem é você?'
    });

    expect(result.response_text).toContain('Lia');
    expect(result.response_text).toContain('Restaurante Sabor da Terra');
  });
});
