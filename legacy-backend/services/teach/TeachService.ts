import { store } from '../../config/database.js';
import { knowledgeBaseService } from '../knowledge/KnowledgeBaseService.js';
import { StructuredKnowledgeItem, AgentRule, Product } from '../../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface TeachResponse {
  reply: string;
  structured_item?: StructuredKnowledgeItem | null;
  rule_created?: AgentRule | null;
  product_updated?: Product | null;
  category_detected: string;
}

export class TeachService {
  /**
   * Processa uma instrução do administrador e transforma linguagem natural em dados estruturados
   */
  public async teach(companyId: string, text: string): Promise<TeachResponse> {
    const raw = text.trim();
    const lower = raw.toLowerCase();

    // 1. Detecção de Preço de Produto ("Nosso X-Bacon custa R$25" ou "O X-Tudo custa 30")
    const priceMatch = lower.match(/(?:nosso|o|a)?\s*([a-z0-9\-áéíóúãõç\s]+?)\s*custa\s*(?:r\$)?\s*(\d+(?:[.,]\d{2})?)/i);
    if (priceMatch && !lower.includes('entrega') && !lower.includes('centro') && !lower.includes('frete')) {
      const productName = priceMatch[1].trim();
      const price = parseFloat(priceMatch[2].replace(',', '.'));

      // Salva na base de conhecimento estruturada
      const item = await knowledgeBaseService.saveStructuredItem(
        companyId,
        'product_price',
        `preco_${productName.replace(/\s+/g, '_')}`,
        { product: productName, price },
        'chat_training',
        `Definição de preço via Ensinar IA: ${raw}`
      );

      // Atualiza ou cria produto no cardápio
      let products = store.products.get(companyId) || [];
      let product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());

      if (product) {
        product.price = price;
      } else {
        product = {
          id: uuidv4(),
          company_id: companyId,
          name: productName.charAt(0).toUpperCase() + productName.slice(1),
          description: `Produto cadastrado via treinamento conversacional`,
          price,
          available: true,
          ingredients: []
        };
        products.push(product);
      }
      store.products.set(companyId, products);

      return {
        reply: `Entendido! Registrei que o ${product.name} custa R$ ${price.toFixed(2)} e atualizei o cardápio.`,
        structured_item: item,
        product_updated: product,
        category_detected: 'product_price'
      };
    }

    // 2. Detecção de Ingredientes ("Ele contém hambúrguer, bacon, queijo...")
    if (lower.includes('contém') || lower.includes('ingredientes') || lower.includes('leva')) {
      const parts = raw.split(/(?:contém|ingredientes|leva)[:\s]/i);
      const ingredientsText = parts[1] || raw;
      const ingredients = ingredientsText
        .split(/[,e\n]/)
        .map(i => i.trim())
        .filter(i => i.length > 1);

      // Associa ao último produto cadastrado ou X-Bacon
      const products = store.products.get(companyId) || [];
      const product = products[0];

      if (product) {
        product.ingredients = Array.from(new Set([...product.ingredients, ...ingredients]));
        return {
          reply: `Perfeito! Registrei os ingredientes de ${product.name}: ${ingredients.join(', ')}.`,
          product_updated: product,
          category_detected: 'ingredients'
        };
      }
    }

    // 3. Detecção de Regra Comercial ("Quando alguém pedir hambúrguer, ofereça batata")
    if (lower.includes('quando') && (lower.includes('ofereça') || lower.includes('oferecer') || lower.includes('sugira'))) {
      const agent = Array.from(store.agents.values()).find(a => a.company_id === companyId);
      const agentId = agent?.id || '22222222-2222-2222-2222-222222222222';

      const rule: AgentRule = {
        id: uuidv4(),
        agent_id: agentId,
        company_id: companyId,
        rule_text: raw,
        priority: 5,
        condition_trigger: 'order_upsell',
        action_type: 'offer_complement',
        active: true
      };

      const rules = store.agentRules.get(agentId) || [];
      rules.push(rule);
      store.agentRules.set(agentId, rules);

      return {
        reply: `Entendido. Regra comercial criada com sucesso: Sempre que o cliente pedir esse item, vou sugerir o adicional correspondente.`,
        rule_created: rule,
        category_detected: 'commercial_rule'
      };
    }

    // 4. Detecção de Correção ("Você respondeu errado. A entrega no centro custa R$5")
    if (lower.includes('respondeu errado') || lower.includes('está errado') || lower.includes('corrigindo') || lower.includes('correto é')) {
      const feeMatch = lower.match(/(\d+(?:[.,]\d{2})?)/);
      const fee = feeMatch ? parseFloat(feeMatch[1].replace(',', '.')) : 5.00;
      const region = lower.includes('centro') ? 'centro' : 'geral';

      const item = await knowledgeBaseService.saveStructuredItem(
        companyId,
        'correction',
        `taxa_entrega_${region}`,
        { region, fee, corrected: true },
        'correction',
        `Correção manual realizada pelo administrador: "${raw}"`
      );

      return {
        reply: `Entendido! Corrigi a informação na minha base de conhecimento: A entrega para ${region} foi atualizada para R$ ${fee.toFixed(2)}. O histórico da alteração foi registrado.`,
        structured_item: item,
        category_detected: 'correction'
      };
    }

    // Fallback genérico para conhecimento livre
    const generalItem = await knowledgeBaseService.saveStructuredItem(
      companyId,
      'policy',
      `instrucao_${Date.now()}`,
      { text: raw },
      'chat_training',
      'Instrução geral aprendida'
    );

    return {
      reply: `Compreendido! Salvei essa diretriz na minha base de conhecimento para utilizar nos futuros atendimentos.`,
      structured_item: generalItem,
      category_detected: 'general_knowledge'
    };
  }
}

export const teachService = new TeachService();
