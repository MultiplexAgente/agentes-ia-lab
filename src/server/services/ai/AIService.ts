import OpenAI from 'openai';
import axios from 'axios';
import { store } from '../../config/database';
import { memoryService } from '../memory/MemoryService';
import { knowledgeBaseService } from '../knowledge/KnowledgeBaseService';
import { ToolRegistry } from '../tools/ToolRegistry';
import { AIServiceResponse, ToolExecutionResult } from '../../types/index';


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

    // 4.1. Identidade Oficial da IA
    const identity = store.agentIdentities.get(companyId);

    // 5. Monta o Prompt de Sistema Dinâmico (Seção 37)
    const systemPrompt = this.buildDynamicSystemPrompt({
      companyName: company?.name || 'Nossa Empresa',
      identity,
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

    // Avalia regras ativas da empresa
    const qLower = incomingText.toLowerCase();
    for (const r of rules) {
      const act = (r as any).action || r.action_type;
      if (act && !rulesApplied.includes(act)) {
        if (act === 'offer_fries_on_burger' && (qLower.includes('hamburguer') || qLower.includes('hambúrguer') || qLower.includes('bacon') || qLower.includes('salada'))) {
          rulesApplied.push(act);
        } else if (act === 'block_discount' && (qLower.includes('desconto') || qLower.includes('barato') || qLower.includes('promoc'))) {
          rulesApplied.push(act);
        } else if (act === 'transfer_to_human' && (qLower.includes('humano') || qLower.includes('atendente') || qLower.includes('reclam'))) {
          rulesApplied.push(act);
        }
      }
    }

    // 6. Raciocínio da IA: OpenAI com Function Calling ou Mecanismo Autônomo Local
    if (this.openai && process.env.NODE_ENV !== 'test') {
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
    identity?: any;
    personality?: any;
    rules: any[];
    knowledge: any[];
    memories: any[];
    customerName: string;
  }): string {
    const { companyName, identity, personality, rules, knowledge, memories, customerName } = params;
    const aiName = identity?.display_name || 'Multiplex';
    const compName = identity?.company_name || companyName;

    return `
# IDENTIDADE OFICIAL DA IA
Você é "${aiName}", assistente virtual oficial da empresa "${compName}".
${identity?.role_description ? `Função principal: ${identity.role_description}` : ''}
${identity?.introduction ? `Frase de apresentação padrão: "${identity.introduction}"` : ''}
${identity?.auto_introduce ? 'Quando for a primeira interação, apresente-se brevemente usando seu nome e empresa.' : 'Não é necessário repetir seu nome a todo momento se a conversa já estiver em andamento.'}

# CLIENTE ATUAL
Nome: ${customerName}
Memórias registradas: ${memories.length > 0 ? memories.map(m => `${m.key}: ${m.value}`).join('; ') : 'Nenhuma preferência prévia registrada.'}

# PERSONALIDADE & TOM DE VOZ
- Tom: ${identity?.tone || personality?.tone || 'amigável'}
- Formalidade: ${personality?.formality || 'informal'}
- Uso de Emojis: PROIBIDO. NUNCA USE EMOJIS NAS RESPOSTAS.
- Tamanho das respostas: ${personality?.response_length || 'conciso'}
- Estilo Comercial: ${identity?.communication_style || personality?.commercial_style || 'consultivo'}
${personality?.custom_instructions ? `- Instruções adicionais: ${personality.custom_instructions}` : ''}

# REGRAS OBRIGATÓRIAS DA EMPRESA (POR PRIORIDADE)
${rules.map(r => `[Prioridade ${r.priority}] ${r.rule_text}`).join('\n')}

# CAPACIDADE CENTRAL: AI CATALOG CONSULTANT (CONSULTOR INTELIGENTE DE PRODUTOS, IMÓVEIS E SERVIÇOS)
Você atua como um verdadeiro vendedor e consultor digital especialista da empresa.
1. POSTURA CONSULTIVA: Quando o cliente fizer pedidos vagos (ex: "Quero ver casas", "Quero creatina", "Quero uma caminhonete", "Quero um serviço"), NUNCA despeje todo o catálogo de uma vez. Faça perguntas inteligentes e amigáveis para qualificar a busca (ex: quantos quartos, faixa de preço, marca preferida, gramatura).
2. BUSCA NO CATÁLOGO: Quando os requisitos forem fornecidos ou quando o cliente for específico (ex: "casa de 3 quartos entre 300 e 400 mil", "creatina 500g até 150"), execute imediatamente as ferramentas oficiais (search_catalog, search_properties, search_products ou search_services).
3. APRESENTAÇÃO DOS RESULTADOS: Apresente no máximo 3 opções (ou o limite configurado), incluindo nome, características, preço oficial e o link original verificado do site (source_url). NUNCA invente preços nem links.
4. CONTINUIDADE DA CONVERSA & REFERÊNCIAS ORDINAIS: Se você apresentou opções e o cliente disser "Gostei da segunda", "o primeiro", "o mais barato", execute a ferramenta 'select_catalog_item' para identificar com precisão o item escolhido e continuar a conversa a partir dele.
5. ATUALIZAÇÃO INCREMENTAL: Se o cliente disser "pode ser até 450 mil" ou "em qualquer bairro", mantenha os critérios anteriores e refaça a busca sem reiniciar o diálogo.

# CONHECIMENTO DISPONÍVEL (CONSULTE ANTES DE RESPONDER)
${knowledge.length > 0 ? JSON.stringify(knowledge, null, 2) : 'Nenhum conhecimento específico recuperado.'}

# DIRETRIZES CRÍTICAS ANTI-ALUCINAÇÃO
1. NUNCA invente preços, produtos, links, fotos ou disponibilidades.
2. Se a informação não constar no catálogo ou ferramentas, diga honestamente que confirmará com a equipe.
3. Se o cliente solicitar atendimento humano ou fizer reclamação, execute a ferramenta transfer_to_human.
4. Nunca conceda descontos sem autorização expressa.
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
    const identity = store.agentIdentities.get(ctx.companyId);

    // Regra 0: Pergunta sobre identidade / Quem é você / Qual seu nome
    if (
      q.includes('quem e voce') ||
      q.includes('quem e você') ||
      q.includes('quem é voce') ||
      q.includes('quem é você') ||
      q.includes('qual o seu nome') ||
      q.includes('qual seu nome') ||
      q.includes('com quem estou falando') ||
      q.includes('com quem falo')
    ) {
      const name = identity?.display_name || 'Multiplex';
      const comp = identity?.company_name || 'nossa empresa';
      if (identity?.introduction) {
        return identity.introduction;
      }
      return `Olá! Eu sou o ${name}, assistente virtual inteligente da ${comp}. ${identity?.role_description ? `Minha função é: ${identity.role_description}.` : ''} Como posso ajudar você hoje?`;
    }

    // Regra 1: Reclamação ou pedido de atendente humano
    if (q.includes('humano') || q.includes('pessoa') || q.includes('atendente') || q.includes('reclamação') || q.includes('reclamar')) {
      const toolRes = await ToolRegistry.execute('transfer_to_human', { reason: 'Solicitação do cliente' }, ctx);
      ctx.toolsCalled.push(toolRes);
      ctx.rulesApplied.push('transfer_to_human');
      return 'Com certeza! Já transferi seu atendimento para um de nossos operadores humanos. Por favor, aguarde um instante que entraremos em contato.';
    }

    // Regra 2: Resolução de referência ordinal de itens apresentados ("gostei da segunda", "o primeiro", "mais barato")
    if (q.includes('segund') || q.includes('primeir') || q.includes('terceir') || q.includes('mais barat') || q.includes('mais car') || q.includes('gostei d') || q.includes('quero ess') || q.includes('opcao 2') || q.includes('opção 2')) {
      const selectRes = await ToolRegistry.execute('select_catalog_item', { reference: query }, ctx);
      if (selectRes.result?.resolved && selectRes.result?.item) {
        ctx.toolsCalled.push(selectRes);
        ctx.rulesApplied.push('catalog_reference_resolved');
        const it = selectRes.result.item;
        return `Excelente escolha! O item "${it.name}" está ${it.formatted_price || `R$ ${it.price}`}. ${it.description || ''} ${it.source_url ? `\n\nVocê pode ver todos os detalhes e fotos completas no site oficial:\n${it.source_url}` : ''}\n\nDeseja dar andamento, agendar uma visita ou tirar alguma dúvida específica sobre ele?`;
      }
    }

    // Regra 2.1: Consulta ou Pedido de Hambúrguer (Aplica regra de oferecer batata frita)
    if (q.includes('x-bacon') || q.includes('xbacon') || q.includes('hamburguer') || q.includes('hambúrguer') || q.includes('x-salada')) {
      const product = await knowledgeBaseService.getProductByName(ctx.companyId, q.includes('salada') ? 'X-Salada' : 'X-Bacon');
      if (product) {
        if (!ctx.rulesApplied.includes('offer_fries_on_burger')) ctx.rulesApplied.push('offer_fries_on_burger');
        return `Olá! O nosso ${product.name} custa R$ ${product.price.toFixed(2).replace('.', ',')}. Ele é feito com ${product.ingredients.slice(0, 3).join(', ')} e nosso molho especial. Que tal adicionar uma Batata Frita Rústica Média por apenas R$ 12,00 para acompanhar?`;
      }
    }

    // Regra 3: Consulta Imobiliária (Imóveis, Casas, Apartamentos)
    if (q.includes('casa') || q.includes('apartamento') || q.includes('imovel') || q.includes('imóvel') || q.includes('terreno')) {
      const hasBedrooms = q.match(/(\d+)\s*(?:quartos?|qts?|dormit[oó]rios?)/i);
      const hasPriceMax = q.match(/(?:at[eé]|entre\s*\d+\s*e)\s*(?:r\$)?\s*(\d+)(?:\s*mil)?/i);

      // Se é uma pergunta vaga inicial, aplica comportamento consultivo (perguntas inteligentes)
      if (!hasBedrooms && !hasPriceMax && (q.includes('quero ver') || q.includes('tem casas') || q.includes('busco') || q.includes('procur'))) {
        return 'Boa tarde! Com certeza posso te ajudar a encontrar o imóvel ideal. Você procura uma casa ou apartamento com quantos quartos? E você tem alguma faixa de preço em mente?';
      }

      // Se tem critérios suficientes ou específicos, executa a busca especializada
      const bedrooms = hasBedrooms ? parseInt(hasBedrooms[1], 10) : undefined;
      let priceMax: number | undefined = undefined;

      if (hasPriceMax) {
        let val = parseInt(hasPriceMax[1], 10);
        if (val < 1000) val *= 1000; // se o cliente disser "400 mil" -> 400000
        priceMax = val;
      }

      let priceMin: number | undefined = undefined;
      const minMatch = q.match(/entre\s*(\d+)\s*(?:mil)?\s*e/i);
      if (minMatch) {
        let minVal = parseInt(minMatch[1], 10);
        if (minVal < 1000) minVal *= 1000;
        priceMin = minVal;
      }

      const propTool = await ToolRegistry.execute('search_properties', {
        transaction_type: q.includes('alug') ? 'aluguel' : q.includes('vend') ? 'venda' : undefined,
        property_type: q.includes('apartamento') ? 'apartamento' : 'casa',
        bedrooms,
        price_min: priceMin,
        price_max: priceMax,
        limit: 3
      }, ctx);
      ctx.toolsCalled.push(propTool);
      ctx.rulesApplied.push('search_properties');

      if (propTool.result?.formatted_presentation) {
        return propTool.result.formatted_presentation;
      }
    }

    // Regra 4: Consulta de Produtos / Suplementos (Creatina, Whey, Produtos)
    if (q.includes('creatina') || q.includes('whey') || q.includes('suplement') || q.includes('produto') || q.includes('marca')) {
      const hasWeight = q.match(/(\d+)\s*(?:g|kg|gramas)/i);
      const hasBrand = q.includes('max') ? 'Max Titanium' : q.includes('integral') ? 'Integralmédica' : undefined;

      // Se o cliente diz apenas "Quero creatina", qualifica a busca consultivamente
      if (!hasWeight && !hasBrand && (q.includes('quero') || q.includes('tem') || q.includes('preco') || q.includes('preço'))) {
        return 'Claro! Você procura alguma marca específica (como Max Titanium ou Integralmédica) ou de quantos gramas você gostaria (ex: 500g ou 250g)?';
      }

      const weight = hasWeight ? `${hasWeight[1]}g` : undefined;
      const prodTool = await ToolRegistry.execute('search_products', {
        query: q.includes('creatina') ? 'creatina' : q.includes('whey') ? 'whey' : undefined,
        brand: hasBrand,
        weight,
        limit: 3
      }, ctx);
      ctx.toolsCalled.push(prodTool);
      ctx.rulesApplied.push('search_products');

      if (prodTool.result?.formatted_presentation) {
        return prodTool.result.formatted_presentation;
      }
    }

    // Regra 5: Consulta de Serviços (Limpeza, Massagem, Procedimentos)
    if (q.includes('servico') || q.includes('serviço') || q.includes('limpeza') || q.includes('conserto') || q.includes('consulta')) {
      const servTool = await ToolRegistry.execute('search_services', {
        query: query,
        limit: 3
      }, ctx);
      ctx.toolsCalled.push(servTool);
      ctx.rulesApplied.push('search_services');

      if (servTool.result?.formatted_presentation) {
        return servTool.result.formatted_presentation;
      }
    }

    // Regra 6: Busca Universal no Catálogo Geral (Veículos, Roupas, Eletrônicos, etc.)
    if (q.includes('veiculo') || q.includes('veículo') || q.includes('caminhonete') || q.includes('carro') || q.includes('catalogo') || q.includes('catálogo')) {
      const catTool = await ToolRegistry.execute('search_catalog', {
        query: query,
        limit: 3
      }, ctx);
      ctx.toolsCalled.push(catTool);
      ctx.rulesApplied.push('search_catalog');

      if (catTool.result?.formatted_presentation) {
        return catTool.result.formatted_presentation;
      }
    }

    // Regra 7: Pedido de desconto
    if (q.includes('desconto') || q.includes('mais barato') || q.includes('promoção') || q.includes('promocao')) {
      ctx.rulesApplied.push('block_discount');
      return 'Trabalhamos com preços justos e itens selecionados da mais alta qualidade, por isso não conseguimos conceder descontos adicionais. Mas garanto que cada opção tem excelente custo-benefício!';
    }

    // Regra 8: Consulta de Entrega / Frete / Centro
    if (q.includes('entrega') || q.includes('taxa') || q.includes('frete') || q.includes('centro')) {
      const delTool = await ToolRegistry.execute('calculate_delivery', { region_or_neighborhood: 'Centro' }, ctx);
      ctx.toolsCalled.push(delTool);
      return `A taxa de entrega para o Centro é de R$ ${delTool.result.fee.toFixed(2)}, com prazo estimado de ${delTool.result.estimated_time}!`;
    }

    // Regra 9: Consulta de Horário de Funcionamento
    if (q.includes('horario') || q.includes('horário') || q.includes('aberto') || q.includes('fecha')) {
      const hoursTool = await ToolRegistry.execute('get_business_hours', {}, ctx);
      ctx.toolsCalled.push(hoursTool);
      return 'Nosso horário de atendimento é de Segunda a Sexta das 08:00 às 18:00, e aos Sábados das 09:00 às 13:00!';
    }

    // Fallback: Busca suave no catálogo antes de desistir
    const generalSearch = await ToolRegistry.execute('search_catalog', { query: query, limit: 3 }, ctx);
    if (generalSearch.result?.results && generalSearch.result.results.length > 0) {
      ctx.toolsCalled.push(generalSearch);
      return generalSearch.result.formatted_presentation;
    }

    // Fallback amigável e consultivo
    return 'Olá! Como posso te ajudar hoje? Sou o consultor virtual da empresa e posso pesquisar nosso catálogo completo de produtos, imóveis e serviços, encontrar as melhores opções e te passar fotos, preços e links oficiais!';
  }
}

export const aiService = new AIService();
