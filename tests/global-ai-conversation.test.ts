import { describe, it, expect, beforeEach } from 'vitest';
import { globalAIConversationService } from '../backend/src/services/ai/GlobalAIConversationService.js';
import { store } from '../backend/src/config/database.js';

describe('Global AI Conversation Layer — Multiplex', () => {
  const companyId = '11111111-1111-1111-1111-111111111111';
  const otherCompanyId = '99999999-9999-9999-9999-999999999999';

  beforeEach(() => {
    store.resetAll();
  });

  // TESTE 1: Pedido ambíguo no Builder (Área de Leads) deve fazer pergunta antes de criar
  it('TESTE 1: Deve responder com uma pergunta sobre área de leads e NÃO criar imediatamente', async () => {
    const res = await globalAIConversationService.processUserMessage({
      companyId,
      message: 'Quero uma área de leads.',
      context: { page: 'builder', module: 'builder' }
    });

    expect(res.assistantMessage).toBeDefined();
    const content = res.assistantMessage.content;
    
    // A IA deve responder com pergunta e opções, sem criar o módulo ainda
    expect(content.toLowerCase()).toContain('leads');
    expect(content).toMatch(/somente|apenas|manualmente/i);
    expect(res.assistantMessage.intent).toBe('clarification');
    expect(res.assistantMessage.suggested_options).toBeDefined();
    expect(res.assistantMessage.suggested_options?.length).toBeGreaterThanOrEqual(2);

    // Não deve ter criado nenhum módulo no store ainda
    const modules = Array.from(store.builderModules.values()).filter(m => m.company_id === companyId);
    expect(modules.length).toBe(0);
  });

  // TESTE 2: Pedido genérico de mudar nome
  it('TESTE 2: Usuário quer mudar o nome da IA -> A IA deve perguntar qual nome', async () => {
    const res = await globalAIConversationService.processUserMessage({
      companyId,
      message: 'Quero mudar o nome da minha IA.'
    });

    const content = res.assistantMessage.content;
    expect(content.toLowerCase()).toMatch(/qual|nome/i);
    expect(res.assistantMessage.intent).toBe('clarification');
  });

  // TESTE 3: Identidade da IA -> Assistente Casa Nova
  it('TESTE 3: Contexto de identidade -> Assistente Casa Nova -> Pergunta sobre apresentação', async () => {
    const res = await globalAIConversationService.processUserMessage({
      companyId,
      message: 'Quero que ela se chame Assistente Casa Nova.',
      context: { page: 'agent_identity', module: 'ai_agent' }
    });

    const content = res.assistantMessage.content;
    expect(content).toContain('Assistente Casa Nova');
    expect(content.toLowerCase()).toMatch(/apenas|apresenta|apresentação/i);
    expect(res.assistantMessage.suggested_options).toBeDefined();
  });

  // TESTE 4: Consulta de dados reais no catálogo
  it('TESTE 4: No catálogo -> Quais produtos estão sem preço? -> Consulta dados reais', async () => {
    // Cadastra produto com preço e produto sem preço no store
    store.products.set(companyId, [
      {
        id: 'p-1',
        company_id: companyId,
        name: 'Hambúrguer Gourmet',
        description: 'Delicioso',
        price: 32.5,
        available: true,
        ingredients: []
      },
      {
        id: 'p-2',
        company_id: companyId,
        name: 'Sobremesa Especial de Morango',
        description: 'Sem preço cadastrado',
        price: 0,
        available: true,
        ingredients: []
      }
    ]);

    const res = await globalAIConversationService.processUserMessage({
      companyId,
      message: 'Quero saber: quais produtos estão sem preço?',
      context: { page: 'catalog', module: 'catalog' }
    });

    const content = res.assistantMessage.content;
    expect(content).toContain('Sobremesa Especial de Morango');
    expect(content).not.toContain('Hambúrguer Gourmet');
  });

  // TESTE 5: Integrações -> MT 24 Horas Express
  it('TESTE 5: Nas integrações -> Conectar MT 24 Horas Express -> Inicia conversa contextual', async () => {
    const res = await globalAIConversationService.processUserMessage({
      companyId,
      message: 'Quero conectar o MT 24 Horas Express.',
      context: { page: 'integrations', module: 'integrations' }
    });

    const content = res.assistantMessage.content;
    expect(content).toMatch(/MT 24/i);
    expect(content.toLowerCase()).toMatch(/chave|token|integração|api/i);
    expect(res.conversation.context.integration_context).toBe('MT24');
  });

  // TESTE 6: Corrida pelo WhatsApp (WhatsApp + MT24 + Corridas)
  it('TESTE 6: Pedir corrida pelo WhatsApp -> Entende WhatsApp + MT24 + corridas', async () => {
    const res = await globalAIConversationService.processUserMessage({
      companyId,
      message: 'Quero pedir uma corrida pelo WhatsApp.'
    });

    const content = res.assistantMessage.content;
    expect(content).toMatch(/WhatsApp/i);
    expect(content).toMatch(/MT 24/i);
    expect(content.toLowerCase()).toMatch(/corrida|despacho|endereço/i);
  });

  // TESTE 7: Novo Chat -> Gera novo conversation_id
  it('TESTE 7: + Novo chat -> Deve criar novo conversation_id distinto', () => {
    const conv1 = globalAIConversationService.getOrCreateConversation({
      companyId,
      title: 'Chat 1'
    });

    const conv2 = globalAIConversationService.getOrCreateConversation({
      companyId,
      title: 'Chat 2'
    });

    expect(conv1.id).toBeDefined();
    expect(conv2.id).toBeDefined();
    expect(conv1.id).not.toBe(conv2.id);
  });

  // TESTE 8: Continuação de conversa preservando histórico e contexto
  it('TESTE 8: Continuação -> Usuário continua no mesmo chat -> Preserva contexto do MT24 e motorista', async () => {
    // 1ª interação: MT24
    const res1 = await globalAIConversationService.processUserMessage({
      companyId,
      message: 'Quero conectar o MT 24 Horas Express.'
    });

    const convId = res1.conversation.id;

    // 2ª interação na MESMA conversa
    const res2 = await globalAIConversationService.processUserMessage({
      companyId,
      conversationId: convId,
      message: 'E como ficará para o motorista?'
    });

    expect(res2.conversation.id).toBe(convId);
    const content = res2.assistantMessage.content;
    expect(content.toLowerCase()).toMatch(/motorista|aplicativo|despachad/i);
  });

  // TESTE 9: Segurança e Multi-tenancy
  it('TESTE 9: Segurança -> Empresa A não pode acessar conversas da Empresa B', () => {
    // Cria conversa para empresa A
    const convA = globalAIConversationService.getOrCreateConversation({
      companyId,
      title: 'Chat Empresa A'
    });

    // Empresa B tenta carregar ou injetar na conversa da Empresa A
    expect(() => {
      globalAIConversationService.getOrCreateConversation({
        companyId: otherCompanyId,
        conversationId: convA.id
      });
    }).toThrow(/Acesso negado/i);
  });

  // TESTE 10: Dados Ausentes -> Não inventar dados
  it('TESTE 10: Dados ausentes -> Quantos pedidos eu tive hoje? -> Informa ausência de dados sem inventar', async () => {
    // Garante que a empresa não tem pedidos cadastrados
    store.orders.set(companyId, []);

    const res = await globalAIConversationService.processUserMessage({
      companyId,
      message: 'Quantos pedidos eu tive hoje?'
    });

    const content = res.assistantMessage.content;
    expect(content.toLowerCase()).toMatch(/não encontrei|não existem|sem registros/i);
    expect(content).not.toMatch(/você teve \d+ pedidos/i);
  });
});
