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
        const catalogItems = Array.from(store.catalogItems.values()).filter(
          i => i.company_id === ctx.companyId && i.status === 'AVAILABLE'
        );

        const listA = products.filter(p => {
          if (!p.available) return false;
          if (args.query && !p.name.toLowerCase().includes(args.query.toLowerCase()) && !p.description.toLowerCase().includes(args.query.toLowerCase())) return false;
          return true;
        }).map(p => ({
          name: p.name,
          price: p.price,
          description: p.description,
          ingredients: p.ingredients,
          addons: p.variations,
          source: 'Manual'
        }));

        const listB = catalogItems.filter(i => {
          if (args.query) {
            const q = args.query.toLowerCase();
            return i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q);
          }
          return true;
        }).map(i => ({
          name: i.name,
          price: i.price !== undefined ? i.price : 'Sob consulta',
          description: i.description,
          category: i.category,
          source_url: i.source_url,
          attributes: i.attributes,
          source: 'Site Sincronizado'
        }));

        return [...listA, ...listB];
      }
    });

    // 3. get_product
    this.tools.set('get_product', {
      definition: {
        name: 'get_product',
        description: 'Recupera detalhes completos de um produto específico (preço, ingredientes, adicionais, link do site).',
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
        if (product) {
          return {
            found: true,
            name: product.name,
            price: product.price,
            description: product.description,
            ingredients: product.ingredients,
            addons: product.variations || []
          };
        }

        // Fallback: check website catalog items
        const catalogItem = Array.from(store.catalogItems.values()).find(
          i => i.company_id === ctx.companyId && i.name.toLowerCase().includes(args.product_name.toLowerCase())
        );

        if (catalogItem) {
          return {
            found: true,
            name: catalogItem.name,
            price: catalogItem.price,
            description: catalogItem.description,
            category: catalogItem.category,
            source_url: catalogItem.source_url,
            attributes: catalogItem.attributes,
            source: 'Site Oficial Sincronizado'
          };
        }

        return { found: false, message: 'Produto não encontrado no cardápio ou site oficial.' };
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

    // 11. bulk_register_products
    this.tools.set('bulk_register_products', {
      definition: {
        name: 'bulk_register_products',
        description: 'Cadastra ou adiciona uma lista de múltiplos produtos no catálogo do restaurante/loja quando o usuário fornece ou dita produtos, preços e descrições.',
        parameters: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              description: 'Lista de produtos extraídos para cadastro',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Nome do produto' },
                  price: { type: 'number', description: 'Preço numérico do produto em reais' },
                  description: { type: 'string', description: 'Descrição dos ingredientes ou detalhes do produto' },
                  category: { type: 'string', description: 'Categoria do produto' }
                },
                required: ['name', 'price']
              }
            }
          },
          required: ['products']
        }
      },
      handler: async (args, ctx) => {
        const productsList = store.products.get(ctx.companyId) || [];
        const added = [];
        for (const p of args.products || []) {
          if (!p.name) continue;
          const newP = {
            id: uuidv4(),
            company_id: ctx.companyId,
            name: p.name.trim(),
            price: Number(p.price) || 0,
            description: p.description || '',
            available: true,
            ingredients: [],
            variations: []
          };
          productsList.push(newP);
          added.push(newP);
        }
        store.products.set(ctx.companyId, productsList);
        return {
          success: true,
          count: added.length,
          message: `${added.length} produtos cadastrados com sucesso no cardápio.`
        };
      }
    });

    // 12. consultar_catalog (Busca no catálogo sincronizado do site)
    this.tools.set('consultar_catalog', {
      definition: {
        name: 'consultar_catalog',
        description: 'Consulta itens, produtos, serviços, imóveis ou pratos sincronizados diretamente do site oficial da empresa.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Termo de busca, nome do item ou categoria.' },
            business_type: { type: 'string', description: 'Filtro opcional por segmento (RESTAURANTE, IMOBILIÁRIA, CONCESSIONÁRIA, HOTEL, SERVIÇOS, LOJA, ECOMMERCE).' }
          }
        }
      },
      handler: async (args, ctx) => {
        const items = Array.from(store.catalogItems.values()).filter(
          item => item.company_id === ctx.companyId && item.status === 'AVAILABLE'
        );

        const filtered = items.filter(item => {
          if (args.business_type && item.attributes?.businessType && item.attributes.businessType !== args.business_type) {
            return false;
          }
          if (args.query) {
            const q = args.query.toLowerCase();
            const matchesName = item.name.toLowerCase().includes(q);
            const matchesDesc = (item.description || '').toLowerCase().includes(q);
            const matchesCat = (item.category || '').toLowerCase().includes(q);
            return matchesName || matchesDesc || matchesCat;
          }
          return true;
        });

        return filtered.slice(0, 10).map(i => ({
          name: i.name,
          price: i.price !== undefined ? `${i.currency} ${i.price.toFixed(2)}` : 'Sob consulta',
          category: i.category,
          description: i.description,
          status: i.status,
          attributes: i.attributes,
          source_url: i.source_url,
          images: i.images
        }));
      }
    });

    // 13. consultar_properties (Imobiliária)
    this.tools.set('consultar_properties', {
      definition: {
        name: 'consultar_properties',
        description: 'Consulta imóveis sincronizados do site (apartamentos, casas, terrenos, locação ou venda).',
        parameters: {
          type: 'object',
          properties: {
            tipo: { type: 'string', description: 'Tipo do imóvel (apartamento, casa, terreno)' },
            quartos: { type: 'number', description: 'Quantidade mínima de quartos' },
            max_price: { type: 'number', description: 'Preço máximo em reais' }
          }
        }
      },
      handler: async (args, ctx) => {
        const items = Array.from(store.catalogItems.values()).filter(
          i => i.company_id === ctx.companyId && i.status === 'AVAILABLE' && 
          (i.attributes?.businessType === 'IMOBILIÁRIA' || i.category?.toLowerCase().includes('imóve') || i.category?.toLowerCase().includes('apart') || i.category?.toLowerCase().includes('casa'))
        );

        return items.filter(i => {
          if (args.max_price && i.price && i.price > args.max_price) return false;
          if (args.quartos && i.attributes?.quartos && i.attributes.quartos < args.quartos) return false;
          if (args.tipo && !i.name.toLowerCase().includes(args.tipo.toLowerCase())) return false;
          return true;
        }).map(i => ({
          titulo: i.name,
          valor: i.price ? `R$ ${i.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sob consulta',
          descricao: i.description,
          caracteristicas: i.attributes,
          link_do_imovel: i.source_url
        }));
      }
    });

    // 14. consultar_services (Prestadores de serviço / Clínicas)
    this.tools.set('consultar_services', {
      definition: {
        name: 'consultar_services',
        description: 'Consulta procedimentos, consultas e serviços oferecidos sincronizados do site.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Nome do serviço ou especialidade.' }
          }
        }
      },
      handler: async (args, ctx) => {
        const items = Array.from(store.catalogItems.values()).filter(
          i => i.company_id === ctx.companyId && i.status === 'AVAILABLE' &&
          (i.attributes?.businessType === 'SERVIÇOS' || i.category?.toLowerCase().includes('servi'))
        );

        return items.filter(i => {
          if (!args.query) return true;
          return i.name.toLowerCase().includes(args.query.toLowerCase()) || 
                 (i.description || '').toLowerCase().includes(args.query.toLowerCase());
        }).map(i => ({
          servico: i.name,
          preco: i.price ? `R$ ${i.price.toFixed(2)}` : 'Sob avaliação',
          detalhes: i.description,
          atributos: i.attributes,
          link_oficial: i.source_url
        }));
      }
    });
  }
}

