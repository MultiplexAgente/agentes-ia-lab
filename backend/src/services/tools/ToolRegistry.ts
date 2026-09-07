import { store } from '../../config/database.js';
import { knowledgeBaseService } from '../knowledge/KnowledgeBaseService.js';
import { memoryService } from '../memory/MemoryService.js';
import { ToolDefinition, ToolExecutionResult, Order, OrderItem } from '../../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface ToolExecutionContext {
  companyId: string;
  agentId: string;
  conversationId: string;
  customerId: string;
}

export class ToolRegistry {
  private static tools: Map<string, {
    definition: ToolDefinition;
    handler: (args: any, context: ToolExecutionContext) => Promise<any>;
  }> = new Map();

  static {
    this.registerCoreTools();
  }

  public static getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  public static async execute(
    name: string,
    args: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        tool_name: name,
        arguments: args,
        result: null,
        error: `Ferramenta '${name}' não encontrada no registro.`
      };
    }

    try {
      const result = await tool.handler(args, context);
      return {
        tool_name: name,
        arguments: args,
        result
      };
    } catch (err: any) {
      return {
        tool_name: name,
        arguments: args,
        result: null,
        error: err.message || 'Erro durante a execução da ferramenta.'
      };
    }
  }

  private static registerCoreTools() {
    // 1. search_knowledge
    this.tools.set('search_knowledge', {
      definition: {
        name: 'search_knowledge',
        description: 'Pesquisa na base de conhecimento sobre políticas, horários, taxas, formas de pagamento ou informações gerais.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Termo de busca ou dúvida do cliente.' }
          },
          required: ['query']
        }
      },
      handler: async (args, ctx) => {
        return await knowledgeBaseService.searchKnowledge(ctx.companyId, args.query);
      }
    });

    // 2. search_products
    this.tools.set('search_products', {
      definition: {
        name: 'search_products',
        description: 'Lista ou busca produtos e itens do cardápio por categoria ou nome.',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Categoria opcional (hamburgueres, porcoes, bebidas).' },
            query: { type: 'string', description: 'Nome ou ingrediente a buscar.' }
          }
        }
      },
      handler: async (args, ctx) => {
        const products = store.products.get(ctx.companyId) || [];
        return products.filter(p => {
          if (!p.available) return false;
          if (args.query && !p.name.toLowerCase().includes(args.query.toLowerCase())) return false;
          return true;
        }).map(p => ({
          name: p.name,
          price: p.price,
          description: p.description,
          ingredients: p.ingredients,
          addons: p.variations
        }));
      }
    });

    // 3. get_product
    this.tools.set('get_product', {
      definition: {
        name: 'get_product',
        description: 'Recupera detalhes completos de um produto específico (preço, ingredientes, adicionais).',
        parameters: {
          type: 'object',
          properties: {
            product_name: { type: 'string', description: 'Nome do produto desejado.' }
          },
          required: ['product_name']
        }
      },
      handler: async (args, ctx) => {
        const product = await knowledgeBaseService.getProductByName(ctx.companyId, args.product_name);
        if (!product) return { found: false, message: 'Produto não encontrado no cardápio.' };
        return {
          found: true,
          name: product.name,
          price: product.price,
          description: product.description,
          ingredients: product.ingredients,
          addons: product.variations || []
        };
      }
    });

    // 4. get_price
    this.tools.set('get_price', {
      definition: {
        name: 'get_price',
        description: 'Consulta o preço exato e oficial de um produto no cardápio. NUNCA invente preços.',
        parameters: {
          type: 'object',
          properties: {
            product_name: { type: 'string', description: 'Nome do produto.' }
          },
          required: ['product_name']
        }
      },
      handler: async (args, ctx) => {
        const product = await knowledgeBaseService.getProductByName(ctx.companyId, args.product_name);
        if (!product) return { found: false, message: 'Produto não cadastrado. Não invente o preço.' };
        return {
          product: product.name,
          price: product.price,
          formatted: `R$ ${product.price.toFixed(2)}`
        };
      }
    });

    // 5. get_business_hours
    this.tools.set('get_business_hours', {
      definition: {
        name: 'get_business_hours',
        description: 'Verifica o horário oficial de funcionamento e se a empresa está aberta agora.',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      handler: async (args, ctx) => {
        return {
          status: 'OPEN',
          schedule: 'Terça a Domingo das 18:00 às 23:00',
          closed_days: 'Segunda-feira',
          delivery_active: true
        };
      }
    });

    // 6. calculate_delivery
    this.tools.set('calculate_delivery', {
      definition: {
        name: 'calculate_delivery',
        description: 'Calcula a taxa e prazo de entrega para uma região ou endereço.',
        parameters: {
          type: 'object',
          properties: {
            region_or_neighborhood: { type: 'string', description: 'Bairro ou região do cliente (ex: Centro).' }
          },
          required: ['region_or_neighborhood']
        }
      },
      handler: async (args, ctx) => {
        const reg = (args.region_or_neighborhood || '').toLowerCase();
        if (reg.includes('centro')) {
          return { region: 'Centro', fee: 5.00, estimated_time: '30 a 40 minutos' };
        }
        return { region: args.region_or_neighborhood, fee: 8.00, estimated_time: '40 a 55 minutos' };
      }
    });

    // 7. create_order
    this.tools.set('create_order', {
      definition: {
        name: 'create_order',
        description: 'Cria formalmente um novo pedido no sistema quando o cliente confirma os itens, endereço e pagamento.',
        parameters: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_name: { type: 'string' },
                  quantity: { type: 'number' },
                  addons: { type: 'array', items: { type: 'string' } }
                },
                required: ['product_name', 'quantity']
              },
              description: 'Lista de itens a incluir no pedido.'
            },
            delivery_address: { type: 'string', description: 'Endereço completo de entrega.' },
            payment_method: { type: 'string', description: 'Forma de pagamento (PIX, Cartão de Crédito, etc.).' },
            notes: { type: 'string', description: 'Observações do pedido (ponto da carne, sem cebola, etc.).' }
          },
          required: ['items', 'delivery_address', 'payment_method']
        }
      },
      handler: async (args, ctx) => {
        let subtotal = 0;
        const orderItems: OrderItem[] = [];

        for (const item of args.items) {
          const product = await knowledgeBaseService.getProductByName(ctx.companyId, item.product_name);
          const price = product ? product.price : 20.00;
          const itemTotal = price * (item.quantity || 1);
          subtotal += itemTotal;

          orderItems.push({
            id: uuidv4(),
            order_id: '',
            product_name: product ? product.name : item.product_name,
            unit_price: price,
            quantity: item.quantity || 1,
            item_total: itemTotal
          });
        }

        const deliveryFee = 5.00;
        const total = subtotal + deliveryFee;

        const newOrder: Order = {
          id: uuidv4(),
          company_id: ctx.companyId,
          customer_id: ctx.customerId,
          conversation_id: ctx.conversationId,
          status: 'PENDING',
          subtotal,
          delivery_fee: deliveryFee,
          total,
          delivery_address: { full: args.delivery_address },
          payment_method: args.payment_method,
          notes: args.notes,
          items: orderItems,
          created_at: new Date().toISOString()
        };

        const existingOrders = store.orders.get(ctx.companyId) || [];
        existingOrders.push(newOrder);
        store.orders.set(ctx.companyId, existingOrders);

        // Salva endereço na memória do cliente
        await memoryService.saveCustomerMemory(
          ctx.customerId,
          ctx.companyId,
          'endereco_padrao',
          args.delivery_address,
          'address'
        );

        return {
          order_id: newOrder.id,
          status: 'PENDING',
          subtotal,
          delivery_fee: deliveryFee,
          total,
          message: 'Pedido criado com sucesso! Aguardando confirmação do pagamento.'
        };
      }
    });

    // 8. transfer_to_human
    this.tools.set('transfer_to_human', {
      definition: {
        name: 'transfer_to_human',
        description: 'Transfere o atendimento imediatamente para um operador humano (pausando o agente de IA).',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string', description: 'Motivo da transferência (reclamação, pedido explícito, dúvida complexa).' }
          },
          required: ['reason']
        }
      },
      handler: async (args, ctx) => {
        const conv = store.conversations.get(ctx.conversationId);
        if (conv) {
          conv.status = 'WAITING_HUMAN';
          store.conversations.set(ctx.conversationId, conv);
        }
        return {
          status: 'TRANSFERRED',
          reason: args.reason,
          message: 'Atendimento transferido para nossa equipe humana. Um atendente entrará em contato em instantes.'
        };
      }
    });

    // 9. register_customer
    this.tools.set('register_customer', {
      definition: {
        name: 'register_customer',
        description: 'Cadastra ou atualiza os dados cadastrais e endereço de um cliente.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome do cliente.' },
            phone: { type: 'string', description: 'Telefone ou WhatsApp.' },
            address: { type: 'string', description: 'Endereço residencial.' }
          },
          required: ['name']
        }
      },
      handler: async (args, ctx) => {
        const customers = store.customers.get(ctx.companyId) || [];
        let customer = customers.find(c => c.id === ctx.customerId);

        if (customer) {
          if (args.name) customer.name = args.name;
          if (args.phone) customer.phone = args.phone;
          if (args.address) customer.address = { full: args.address };
        } else {
          customer = {
            id: ctx.customerId,
            company_id: ctx.companyId,
            name: args.name,
            phone: args.phone,
            address: { full: args.address },
            total_orders: 0,
            lifetime_value: 0
          };
          customers.push(customer);
          store.customers.set(ctx.companyId, customers);
        }

        return { success: true, customer_name: customer.name };
      }
    });

    // 10. schedule_service
    this.tools.set('schedule_service', {
      definition: {
        name: 'schedule_service',
        description: 'Realiza o agendamento de um horário de serviço para clínicas, barbearias ou consultorias.',
        parameters: {
          type: 'object',
          properties: {
            service_name: { type: 'string' },
            date: { type: 'string' },
            time: { type: 'string' }
          },
          required: ['service_name', 'date', 'time']
        }
      },
      handler: async (args, ctx) => {
        return {
          scheduled: true,
          service: args.service_name,
          date: args.date,
          time: args.time,
          confirmation_code: `SCH-${Math.floor(1000 + Math.random() * 9000)}`
        };
      }
    });
  }
}
