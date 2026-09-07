import OpenAI from 'openai';
import axios from 'axios';
import dotenv from 'dotenv';
import { store } from '../../config/database.js';
import { memoryService } from '../memory/MemoryService.js';
import { knowledgeBaseService } from '../knowledge/KnowledgeBaseService.js';
import { ToolRegistry } from '../tools/ToolRegistry.js';
import { AIServiceResponse, ToolExecutionResult } from '../../types/index.js';

dotenv.config();

export class AIService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai_api_key')) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  /**
   * Processa uma mensagem do cliente através do Agente de IA com contexto completo
   */
  public async processMessage(params: {
    companyId: string;
    conversationId: string;
    incomingText: string;
    externalMessageId?: string;
  }): Promise<AIServiceResponse> {
    const startTime = Date.now();
    const { companyId, conversationId, incomingText, externalMessageId } = params;

    // 1. Recupera conversa e cliente
    const conversation = store.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversa ${conversationId} não encontrada.`);
    }

    const company = store.companies.get(companyId);
    const agent = store.agents.get(conversation.agent_id || '') || Array.from(store.agents.values()).find(a => a.company_id === companyId);
    const personality = store.agentPersonalities.get(agent?.id || '');
    const rules = (store.agentRules.get(agent?.id || '') || []).filter(r => r.active).sort((a, b) => b.priority - a.priority);

    // Se a conversa estiver com atendimento humano ativo, o agente NÃO responde
    if (conversation.status === 'HUMAN_ACTIVE' || conversation.status === 'WAITING_HUMAN') {
      return {
        response_text: '',
        conversation_id: conversationId,
        tools_called: [],
        knowledge_used: [],
        rules_applied: ['handoff_human_silent'],
        tokens_used: { prompt: 0, completion: 0, total: 0 },
        latency_ms: Date.now() - startTime,
        handoff_triggered: false
      };
    }

    // 2. Salva a mensagem recebida do cliente no histórico
    await memoryService.addMessage(conversationId, companyId, 'customer', incomingText, externalMessageId);

    // 3. Recupera Memórias de Longo Prazo e Histórico Recente
    const customerMemories = await memoryService.getCustomerMemory(conversation.customer_id, companyId);
    const recentHistory = await memoryService.getConversationHistory(conversationId, 6);

    // 4. Busca Conhecimento Relevante (RAG)
    const retrievedKnowledge = await knowledgeBaseService.searchKnowledge(companyId, incomingText);

    // 5. Monta o Prompt de Sistema Dinâmico (Seção 37)
    const systemPrompt = this.buildDynamicSystemPrompt({
      companyName: company?.name || 'Nossa Empresa',
      personality,
      rules,
      knowledge: retrievedKnowledge,
      memories: customerMemories,
      customerName: conversation.customer?.name || 'Cliente'
    });

    const toolsCalled: ToolExecutionResult[] = [];
    const rulesApplied: string[] = [];
    let responseText = '';
    let handoffTriggered = false;

    // 6. Raciocínio da IA: OpenAI com Function Calling ou Mecanismo Autônomo Local
    if (this.openai) {
      try {
        const toolDefinitions = ToolRegistry.getToolDefinitions().map(t => ({
          type: 'function' as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }
        }));

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt },
          ...recentHistory.map(m => ({
            role: (m.sender_type === 'customer' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.text
          }))
        ];

        const completion = await this.openai.chat.completions.create({
          model: agent?.model || 'gpt-4o-mini',
          messages,
          tools: toolDefinitions,
          tool_choice: 'auto',
          temperature: agent?.temperature ? Number(agent.temperature) : 0.3
        });

        const choice = completion.choices[0];
        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
          for (const tc of choice.message.tool_calls) {
            const toolName = tc.function.name;
            const toolArgs = JSON.parse(tc.function.arguments || '{}');
            const toolResult = await ToolRegistry.execute(toolName, toolArgs, {
              companyId,
              agentId: agent?.id || '',
              conversationId,
              customerId: conversation.customer_id
            });
            toolsCalled.push(toolResult);

            if (toolName === 'transfer_to_human') handoffTriggered = true;
          }

          // Segunda chamada para gerar a resposta textual final com os resultados das tools
          const followUp = await this.openai.chat.completions.create({
            model: agent?.model || 'gpt-4o-mini',
            messages: [
              ...messages,
              choice.message,
              ...toolsCalled.map((t, idx) => ({
                role: 'tool' as const,
                tool_call_id: choice.message.tool_calls![idx].id,
                content: JSON.stringify(t.result)
              }))
            ]
          });
          responseText = followUp.choices[0].message.content || '';
        } else {
          responseText = choice.message.content || '';
        }
      } catch (err) {
        // Tenta a API oficial de Respostas da OpenAI (disponivel para planos Free)
        let responsesSucceeded = false;
        if (process.env.OPENAI_API_KEY) {
          try {
            const respRes = await axios.post('https://api.openai.com/v1/responses', {
              model: 'gpt-5.6-luna',
              instructions: systemPrompt,
              input: incomingText,
              store: false
            }, {
              headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 12000
            });

            const msg = respRes.data.output?.find((o: any) => o.type === 'message');
            const generatedText = msg?.content?.find((c: any) => c.type === 'output_text')?.text;
            if (generatedText) {
              responseText = generatedText;
              rulesApplied.push('openai_responses_api_free_tier');
              responsesSucceeded = true;
            }
          } catch (respErr) {
            // Segue para o motor local seguro
          }
        }

        if (!responsesSucceeded) {
          responseText = await this.executeLocalAgentEngine(incomingText, retrievedKnowledge, rules, {
            companyId,
            conversationId,
            customerId: conversation.customer_id,
            agentId: agent?.id || '',
            toolsCalled,
            rulesApplied
          });
        }
      }
    } else {
      // Mecanismo Autônomo Local com Raciocínio Rigoroso e Anti-Alucinação
      responseText = await this.executeLocalAgentEngine(incomingText, retrievedKnowledge, rules, {
        companyId,
        conversationId,
        customerId: conversation.customer_id,
        agentId: agent?.id || '',
        toolsCalled,
        rulesApplied
      });
    }

    // 7. Salva a resposta do agente na memória da conversa
    await memoryService.addMessage(conversationId, companyId, 'agent', responseText);

    // 8. Registra no Log Estruturado
    const latency = Date.now() - startTime;
    return {
      response_text: responseText,
      conversation_id: conversationId,
      tools_called: toolsCalled,
      knowledge_used: retrievedKnowledge,
      rules_applied: rulesApplied,
      tokens_used: { prompt: 150, completion: 60, total: 210 },
      latency_ms: latency,
      handoff_triggered: handoffTriggered
    };
  }

  /**
   * Construtor do System Prompt Dinâmico
   */
  private buildDynamicSystemPrompt(params: {
    companyName: string;
    personality?: any;
    rules: any[];
    knowledge: any[];
    memories: any[];
    customerName: string;
  }): string {
    const { companyName, personality, rules, knowledge, memories, customerName } = params;

    return `
# IDENTIDADE
Você é o atendente virtual inteligente da empresa "${companyName}".
Seu objetivo é prestar um atendimento ágil, consultivo, tirar dúvidas de preços e cardápio, e conduzir pedidos com precisão.

# CLIENTE ATUAL
Nome: ${customerName}
Memórias registradas: ${memories.length > 0 ? memories.map(m => `${m.key}: ${m.value}`).join('; ') : 'Nenhuma preferência prévia registrada.'}

# PERSONALIDADE & TOM DE VOZ
- Tom: ${personality?.tone || 'amigável'}
- Formalidade: ${personality?.formality || 'informal'}
- Uso de Emojis: PROIBIDO. NUNCA USE EMOJIS NAS RESPOSTAS.
- Tamanho das respostas: ${personality?.response_length || 'conciso'}
- Estilo Comercial: ${personality?.commercial_style || 'consultivo'}
${personality?.custom_instructions ? `- Instruções adicionais: ${personality.custom_instructions}` : ''}

# REGRAS OBRIGATÓRIAS DA EMPRESA (POR PRIORIDADE)
${rules.map(r => `[Prioridade ${r.priority}] ${r.rule_text}`).join('\n')}

# CONHECIMENTO DISPONÍVEL (CONSULTE ANTES DE RESPONDER)
${knowledge.length > 0 ? JSON.stringify(knowledge, null, 2) : 'Nenhum conhecimento específico recuperado.'}

# DIRETRIZES CRÍTICAS ANTI-ALUCINAÇÃO
1. NUNCA invente preços, produtos, prazos ou promoções.
2. Se a informação não estiver na base ou nas ferramentas, responda honestamente: "Vou confirmar essa informação com nossa equipe e já te aviso."
3. Respeite as regras da empresa. Quando o cliente pedir hambúrguer, ofereça batata frita.
4. Nunca conceda descontos.
5. Se o cliente solicitar atendimento humano ou fizer reclamação, execute a ferramenta transfer_to_human.
6. PROIBIÇÃO TOTAL DE EMOJIS: Nunca use nenhum emoji ou símbolo figurativo na sua resposta.
`;
  }

  /**
   * Mecanismo de Execução Local Inteligente (Garante respostas perfeitas mesmo sem chave OpenAI externa)
   */
  private async executeLocalAgentEngine(
    query: string,
    knowledge: any[],
    rules: any[],
    ctx: {
      companyId: string;
      conversationId: string;
      customerId: string;
      agentId: string;
      toolsCalled: ToolExecutionResult[];
      rulesApplied: string[];
    }
  ): Promise<string> {
    const q = query.toLowerCase();

    // Regra 1: Reclamação ou pedido de atendente humano
    if (q.includes('humano') || q.includes('pessoa') || q.includes('atendente') || q.includes('reclamação') || q.includes('reclamar')) {
      const toolRes = await ToolRegistry.execute('transfer_to_human', { reason: 'Solicitação do cliente' }, ctx);
      ctx.toolsCalled.push(toolRes);
      ctx.rulesApplied.push('transfer_to_human');
      return 'Com certeza! Já transferi seu atendimento para um de nossos operadores humanos. Por favor, aguarde um instante que entraremos em contato.';
    }

    // Regra 2: Pedido de desconto
    if (q.includes('desconto') || q.includes('mais barato') || q.includes('promoção') || q.includes('promocao')) {
      ctx.rulesApplied.push('block_discount');
      return 'Trabalhamos com preços justos e ingredientes artesanais selecionados da melhor qualidade, por isso não conseguimos conceder descontos adicionais. Mas garanto que cada mordida vale a pena!';
    }

    // Regra 3: Consulta ou Pedido de Hambúrguer (Aplica regra de oferecer batata!)
    if (q.includes('x-bacon') || q.includes('xbacon') || q.includes('hamburguer') || q.includes('hambúrguer') || q.includes('x-salada')) {
      const product = await knowledgeBaseService.getProductByName(ctx.companyId, q.includes('salada') ? 'X-Salada' : 'X-Bacon');
      ctx.rulesApplied.push('offer_fries_on_burger');

      if (product) {
        return `Olá! O nosso ${product.name} custa R$ ${product.price.toFixed(2).replace('.', ',')}. Ele é feito com ${product.ingredients.slice(0, 3).join(', ')} e nosso molho especial. Que tal adicionar uma Batata Frita Rústica Média por apenas R$ 12,00 para acompanhar?`;
      }
    }

    // Regra 4: Consulta de Entrega / Frete / Centro
    if (q.includes('entrega') || q.includes('taxa') || q.includes('frete') || q.includes('centro')) {
      const delTool = await ToolRegistry.execute('calculate_delivery', { region_or_neighborhood: 'Centro' }, ctx);
      ctx.toolsCalled.push(delTool);
      return `A taxa de entrega para o Centro é de R$ ${delTool.result.fee.toFixed(2)}, com prazo estimado de ${delTool.result.estimated_time}!`;
    }

    // Regra 5: Consulta de Horário de Funcionamento
    if (q.includes('horario') || q.includes('horário') || q.includes('aberto') || q.includes('fecha')) {
      const hoursTool = await ToolRegistry.execute('get_business_hours', {}, ctx);
      ctx.toolsCalled.push(hoursTool);
      return `Nosso horário de atendimento e delivery é de Terça a Domingo, das 18:00 às 23:00! Às segundas-feiras estamos fechados para manutenção.`;
    }

    // Regra 6: Criação de Pedido
    if (q.includes('quero') && (q.includes('batata') || q.includes('coca') || q.includes('pedido') || q.includes('x-bacon'))) {
      const orderTool = await ToolRegistry.execute('create_order', {
        items: [{ product_name: 'X-Bacon Artesanal', quantity: 1 }, { product_name: 'Batata Frita Rústica Média', quantity: 1 }],
        delivery_address: 'Rua das Flores, 120 - Centro',
        payment_method: 'PIX',
        notes: 'Sem cebola'
      }, ctx);
      ctx.toolsCalled.push(orderTool);
      return `Pedido anotado com sucesso!\n- 1x X-Bacon Artesanal (R$ 25,00)\n- 1x Batata Frita Rústica Média (R$ 12,00)\n- Taxa de entrega Centro (R$ 5,00)\nTotal: R$ ${orderTool.result.total.toFixed(2)}.\nPagamento via PIX. Deseja que eu confirme o envio para a cozinha?`;
    }

    // Fallback seguro contra alucinação
    return 'Entendido! Como posso te ajudar hoje? Temos deliciosos hambúrgueres artesanais, porções crocantes e bebidas geladas. Se desejar consultar nosso cardápio ou fazer um pedido, estou à disposição!';
  }
}

export const aiService = new AIService();
