import { describe, it, expect, beforeEach } from 'vitest';
import { aiService } from '../backend/src/services/ai/AIService.js';
import { teachService } from '../backend/src/services/teach/TeachService.js';
import { ToolRegistry } from '../backend/src/services/tools/ToolRegistry.js';
import { memoryService } from '../backend/src/services/memory/MemoryService.js';
import { store } from '../backend/src/config/database.js';

describe('Suite de Testes Obrigatórios - Agente de IA Omnichannel', () => {
  const companyId = '11111111-1111-1111-1111-111111111111';
  const customerId = '55555555-5555-5555-5555-555555555555';
  const convId = '66666666-6666-6666-6666-666666666666';

  beforeEach(() => {
    // Garante fixtures para testes isolados
    if (!store.companies.has(companyId)) {
      store.companies.set(companyId, { id: companyId, name: 'Empresa Teste', slug: 'empresa-teste', active: true });
    }
    if (!store.agents.has('22222222-2222-2222-2222-222222222222')) {
      store.agents.set('22222222-2222-2222-2222-222222222222', {
        id: '22222222-2222-2222-2222-222222222222',
        company_id: companyId,
        name: 'Multiplex',
        model: 'gpt-4o',
        temperature: 0.2,
        personality: { tone: 'friendly', formality: 'informal', use_emojis: true, response_length: 'concise', commercial_style: 'consultative' },
        rules: [
          { rule_text: 'Sempre ofereça batata frita como adicional quando o cliente pedir um hambúrguer', priority: 5, action: 'offer_fries_on_burger' },
          { rule_text: 'Nunca conceda descontos sem autorização expressa', priority: 10, action: 'block_discount' }
        ],
        active: true
      });
    }
    // Produto de teste para cálculo
    store.products.set(companyId, [
      {
        id: 'prod-xbacon',
        company_id: companyId,
        name: 'X-Bacon Artesanal',
        price: 25.00,
        description: 'Hambúrguer artesanal 180g com bacon crocante e queijo cheddar',
        ingredients: ['carne 180g', 'bacon', 'cheddar'],
        available: true
      }
    ]);

    store.conversations.set(convId, {
      id: convId,
      company_id: companyId,
      customer_id: customerId,
      channel: 'WHATSAPP',
      external_chat_id: '5511999999999@c.us',
      status: 'ACTIVE'
    });
  });

  // 1. Consulta de Preços e Não Alucinação
  it('deve consultar o preço exato do produto no cardápio sem inventar', async () => {
    const result = await aiService.processMessage({
      companyId,
      conversationId: convId,
      incomingText: 'Quanto custa o X-Bacon?'
    });

    expect(result.response_text).toContain('25,00');
    expect(result.rules_applied).toContain('offer_fries_on_burger');
  });

  // 2. Regra de Negócio: Oferecer batata ao pedir hambúrguer
  it('deve oferecer batata frita como adicional quando o cliente pedir hambúrguer', async () => {
    const result = await aiService.processMessage({
      companyId,
      conversationId: convId,
      incomingText: 'Quero um X-Bacon'
    });

    expect(result.response_text.toLowerCase()).toContain('batata');
    expect(result.rules_applied).toContain('offer_fries_on_burger');
  });

  // 3. Regra de Negócio: Bloquear desconto
  it('deve recusar concessão de desconto conforme regra de prioridade máxima', async () => {
    const result = await aiService.processMessage({
      companyId,
      conversationId: convId,
      incomingText: 'Você me dá um desconto no pedido?'
    });

    expect(result.response_text.toLowerCase()).toContain('desconto');
    expect(result.rules_applied).toContain('block_discount');
  });

  // 4. Execução de Ferramenta: Cálculo de Entrega
  it('deve executar a tool calculate_delivery corretamente para a região do Centro', async () => {
    const toolResult = await ToolRegistry.execute('calculate_delivery', {
      region_or_neighborhood: 'Centro'
    }, {
      companyId,
      agentId: '22222222-2222-2222-2222-222222222222',
      conversationId: convId,
      customerId
    });

    expect(toolResult.result.fee).toBe(5.00);
    expect(toolResult.result.region).toBe('Centro');
  });

  // 5. Execução de Ferramenta: Criação de Pedido Formal
  it('deve criar um pedido completo com subtotal, taxa de entrega e endereço salvo', async () => {
    const toolResult = await ToolRegistry.execute('create_order', {
      items: [{ product_name: 'X-Bacon Artesanal', quantity: 2 }],
      delivery_address: 'Rua das Palmeiras, 45',
      payment_method: 'PIX'
    }, {
      companyId,
      agentId: '22222222-2222-2222-2222-222222222222',
      conversationId: convId,
      customerId
    });

    expect(toolResult.result.status).toBe('PENDING');
    expect(toolResult.result.subtotal).toBe(50.00);
    expect(toolResult.result.total).toBe(55.00); // 50 + 5 de frete
  });

  // 6. Handoff para Humano e Pausa da IA
  it('deve acionar a ferramenta transfer_to_human e silenciar a IA quando solicitado', async () => {
    const result = await aiService.processMessage({
      companyId,
      conversationId: convId,
      incomingText: 'Quero falar com um atendente humano agora'
    });

    expect(result.rules_applied).toContain('transfer_to_human');
    
    // Verifica se o status da conversa virou WAITING_HUMAN
    const conv = store.conversations.get(convId);
    expect(conv?.status).toBe('WAITING_HUMAN');

    // Mensagens subsequentes enquanto humano estiver ativo NÃO devem ser respondidas pela IA
    const silentResult = await aiService.processMessage({
      companyId,
      conversationId: convId,
      incomingText: 'Alguém me ouve?'
    });

    expect(silentResult.response_text).toBe('');
    expect(silentResult.rules_applied).toContain('handoff_human_silent');
  });

  // 7. Ensinar IA Conversacionalmente (Transformação em dados estruturados)
  it('deve extrair produto e preço estruturado a partir de frase em linguagem natural', async () => {
    const teachResult = await teachService.teach(companyId, 'Nosso X-Tudo Supremo custa R$ 32,00');

    expect(teachResult.category_detected).toBe('product_price');
    expect(teachResult.structured_item?.data.price).toBe(32);
    expect(teachResult.product_updated?.price).toBe(32);
  });

  // 8. Correção com Histórico de Alterações
  it('deve registrar correção com histórico da alteração anterior', async () => {
    const correctionResult = await teachService.teach(
      companyId,
      'Você respondeu errado. A entrega no centro custa R$ 7,00'
    );

    expect(correctionResult.category_detected).toBe('correction');
    expect(correctionResult.structured_item?.data.fee).toBe(7.00);
    expect(correctionResult.structured_item?.history.length).toBeGreaterThan(0);
  });

  // 9. Memória do Cliente Isolada por Tenant
  it('deve persistir e isolar memórias de clientes por tenant', async () => {
    await memoryService.saveCustomerMemory(
      customerId,
      companyId,
      'restricao_alimentar',
      'sem_lactose',
      'restriction'
    );

    const memories = await memoryService.getCustomerMemory(customerId, companyId);
    const hasRestriction = memories.some(m => m.key === 'restricao_alimentar' && m.value === 'sem_lactose');
    expect(hasRestriction).toBe(true);

    // Outro tenant não deve enxergar
    const otherTenantMemories = await memoryService.getCustomerMemory(customerId, '99999999-9999-9999-9999-999999999999');
    expect(otherTenantMemories.length).toBe(0);
  });
});
