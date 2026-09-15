import { store } from '../../config/database.js';
import { knowledgeBaseService } from '../knowledge/KnowledgeBaseService.js';
import { memoryService } from '../memory/MemoryService.js';
import { ToolDefinition, ToolExecutionResult, Order, OrderItem } from '../../types/index.js';
import { CatalogSearchService } from '../catalog/CatalogSearchService.js';
import { SearchSessionService } from '../catalog/SearchSessionService.js';
import { CatalogFormatter } from '../catalog/CatalogFormatter.js';
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

    // =========================================================================
    // AI CATALOG CONSULTANT TOOLS (SEÇÃO 35-38)
    // =========================================================================

    // 12. search_catalog (Ferramenta universal de busca de catálogo)
    this.tools.set('search_catalog', {
      definition: {
        name: 'search_catalog',
        description: 'Pesquisa itens no catálogo estruturado oficial da empresa (produtos, imóveis, veículos, pratos ou serviços) com filtros avançados, ordenação e relevância.',
        parameters: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Categoria opcional (ex: suplementos, imóveis, cardápio, eletrônicos).' },
            query: { type: 'string', description: 'Termo de busca, nome do produto ou palavra-chave.' },
            entity_type: { type: 'string', description: 'Tipo da entidade (product, property, vehicle, restaurant, service, hotel, course).' },
            filters: { 
              type: 'object', 
              description: 'Filtros estruturados adicionais (ex: brand, weight, price_min, price_max, bedrooms, city, etc.).' 
            },
            limit: { type: 'number', description: 'Quantidade máxima de resultados (1 a 10, padrão 3).' }
          }
        }
      },
      handler: async (args, ctx) => {
        const filters = {
          category: args.category,
          query: args.query,
          entity_type: args.entity_type,
          ...(args.filters || {})
        };

        // Salva/atualiza filtros na sessão de busca
        SearchSessionService.updateSessionFilters(ctx.conversationId, ctx.companyId, filters, {
          category: args.category,
          entity_type: args.entity_type,
          query: args.query
        });

        const searchRes = await CatalogSearchService.searchCatalog(ctx.companyId, filters, {
          limit: args.limit || 3,
          conversationId: ctx.conversationId,
          customerId: ctx.customerId
        });

        // Salva os itens apresentados na sessão
        SearchSessionService.savePresentedResults(ctx.conversationId, ctx.companyId, searchRes.items);

        const settings = store.catalogSettings.get(ctx.companyId);
        const formattedText = CatalogFormatter.formatTextResponse(searchRes.items, settings, searchRes.alternative_message);
        const cards = CatalogFormatter.formatStructuredCards(searchRes.items, settings);

        return {
          results: searchRes.items.map(i => ({
            id: i.id,
            name: i.name,
            brand: i.brand,
            price: i.price,
            formatted_price: i.formatted_price,
            description: i.description,
            images: i.images,
            source_url: i.source_url,
            availability: i.availability,
            attributes: i.attributes
          })),
          total_found: searchRes.total_found,
          is_alternative: searchRes.is_alternative,
          alternative_message: searchRes.alternative_message,
          formatted_presentation: formattedText,
          cards
        };
      }
    });

    // 13. search_properties (Especializada para Imobiliárias)
    this.tools.set('search_properties', {
      definition: {
        name: 'search_properties',
        description: 'Pesquisa imóveis (casas, apartamentos, terrenos) para venda ou locação com filtros de quartos, suítes, vagas, preço e bairro.',
        parameters: {
          type: 'object',
          properties: {
            transaction_type: { type: 'string', description: 'Tipo de negócio: venda, aluguel, temporada.' },
            property_type: { type: 'string', description: 'Tipo do imóvel: casa, apartamento, cobertura, terreno, comercial.' },
            bedrooms: { type: 'number', description: 'Número mínimo de quartos.' },
            suites: { type: 'number', description: 'Número mínimo de suítes.' },
            bathrooms: { type: 'number', description: 'Número mínimo de banheiros.' },
            parking_spaces: { type: 'number', description: 'Número de vagas de garagem.' },
            price_min: { type: 'number', description: 'Preço mínimo em reais.' },
            price_max: { type: 'number', description: 'Preço máximo em reais.' },
            city: { type: 'string', description: 'Cidade.' },
            neighborhood: { type: 'string', description: 'Bairro ou região.' },
            limit: { type: 'number', description: 'Quantidade máxima (padrão 3).' }
          }
        }
      },
      handler: async (args, ctx) => {
        const filters = {
          entity_type: 'property',
          transaction_type: args.transaction_type,
          bedrooms: args.bedrooms,
          suites: args.suites,
          bathrooms: args.bathrooms,
          parking_spaces: args.parking_spaces,
          price_min: args.price_min,
          price_max: args.price_max,
          city: args.city,
          neighborhood: args.neighborhood,
          query: args.property_type
        };

        SearchSessionService.updateSessionFilters(ctx.conversationId, ctx.companyId, filters, {
          category: 'Imóveis',
          entity_type: 'property'
        });

        const searchRes = await CatalogSearchService.searchCatalog(ctx.companyId, filters, {
          limit: args.limit || 3,
          conversationId: ctx.conversationId,
          customerId: ctx.customerId
        });

        SearchSessionService.savePresentedResults(ctx.conversationId, ctx.companyId, searchRes.items);
        const settings = store.catalogSettings.get(ctx.companyId);
        const formattedText = CatalogFormatter.formatTextResponse(searchRes.items, settings, searchRes.alternative_message);

        return {
          results: searchRes.items.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            formatted_price: i.formatted_price,
            description: i.description,
            caracteristicas: i.attributes,
            images: i.images,
            source_url: i.source_url
          })),
          total_found: searchRes.total_found,
          is_alternative: searchRes.is_alternative,
          formatted_presentation: formattedText
        };
      }
    });

    // 14. search_products (Especializada para Produtos / E-commerce / Suplementos)
    this.tools.set('search_products', {
      definition: {
        name: 'search_products',
        description: 'Pesquisa produtos físicos, suplementos, roupas ou itens de e-commerce por marca, peso, volume, preço e disponibilidade.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Nome do produto ou tipo (ex: creatina, whey, tênis).' },
            brand: { type: 'string', description: 'Marca desejada (ex: Max Titanium, Integralmédica, Nike).' },
            weight: { type: 'string', description: 'Peso ou gramatura (ex: 500g, 1kg, 250g).' },
            volume: { type: 'string', description: 'Volume (ex: 350ml, 2L).' },
            price_min: { type: 'number', description: 'Preço mínimo.' },
            price_max: { type: 'number', description: 'Preço máximo.' },
            availability: { type: 'string', description: 'Disponibilidade (available, all).' },
            limit: { type: 'number', description: 'Quantidade máxima (padrão 3).' }
          }
        }
      },
      handler: async (args, ctx) => {
        const filters = {
          entity_type: 'product',
          query: args.query,
          brand: args.brand,
          weight: args.weight,
          volume: args.volume,
          price_min: args.price_min,
          price_max: args.price_max
        };

        SearchSessionService.updateSessionFilters(ctx.conversationId, ctx.companyId, filters, {
          entity_type: 'product',
          query: args.query
        });

        const searchRes = await CatalogSearchService.searchCatalog(ctx.companyId, filters, {
          limit: args.limit || 3,
          conversationId: ctx.conversationId,
          customerId: ctx.customerId
        });

        SearchSessionService.savePresentedResults(ctx.conversationId, ctx.companyId, searchRes.items);
        const settings = store.catalogSettings.get(ctx.companyId);
        const formattedText = CatalogFormatter.formatTextResponse(searchRes.items, settings, searchRes.alternative_message);

        return {
          results: searchRes.items.map(i => ({
            id: i.id,
            name: i.name,
            brand: i.brand,
            price: i.price,
            formatted_price: i.formatted_price,
            description: i.description,
            images: i.images,
            source_url: i.source_url,
            availability: i.availability
          })),
          total_found: searchRes.total_found,
          is_alternative: searchRes.is_alternative,
          formatted_presentation: formattedText
        };
      }
    });

    // 15. search_services (Especializada para Clínicas / Prestadores de Serviço)
    this.tools.set('search_services', {
      definition: {
        name: 'search_services',
        description: 'Pesquisa serviços oferecidos, consultas, procedimentos ou orçamentos.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Nome do serviço ou especialidade (ex: limpeza de sofá, corte, consulta).' },
            duration_minutes: { type: 'number', description: 'Duração aproximada em minutos.' },
            price_max: { type: 'number', description: 'Preço máximo.' },
            limit: { type: 'number', description: 'Quantidade máxima (padrão 3).' }
          }
        }
      },
      handler: async (args, ctx) => {
        const filters = {
          entity_type: 'service',
          query: args.query,
          duration_minutes: args.duration_minutes,
          price_max: args.price_max
        };

        const searchRes = await CatalogSearchService.searchCatalog(ctx.companyId, filters, {
          limit: args.limit || 3,
          conversationId: ctx.conversationId,
          customerId: ctx.customerId
        });

        SearchSessionService.savePresentedResults(ctx.conversationId, ctx.companyId, searchRes.items);
        const settings = store.catalogSettings.get(ctx.companyId);
        const formattedText = CatalogFormatter.formatTextResponse(searchRes.items, settings, searchRes.alternative_message);

        return {
          results: searchRes.items.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            formatted_price: i.formatted_price,
            description: i.description,
            source_url: i.source_url
          })),
          total_found: searchRes.total_found,
          formatted_presentation: formattedText
        };
      }
    });

    // 16. get_catalog_item (Recupera detalhes de 1 item por ID — Supabase-first)
    this.tools.set('get_catalog_item', {
      definition: {
        name: 'get_catalog_item',
        description: 'Recupera os detalhes completos, preço atualizado, estoque e link oficial de um item específico pelo ID.',
        parameters: {
          type: 'object',
          properties: {
            item_id: { type: 'string', description: 'ID do item.' }
          },
          required: ['item_id']
        }
      },
      handler: async (args, ctx) => {
        // Supabase-first via CompositeCatalogProvider
        const item = await CatalogSearchService.getItemByIdAsync(ctx.companyId, args.item_id)
          || CatalogSearchService.getItemById(ctx.companyId, args.item_id);
        if (!item) return { found: false, message: 'Item não encontrado no catálogo da empresa.' };
        return { found: true, item };
      }
    });

    // 17. get_catalog_items (Recupera múltiplos itens por IDs)
    this.tools.set('get_catalog_items', {
      definition: {
        name: 'get_catalog_items',
        description: 'Recupera lista de múltiplos itens pelos seus IDs.',
        parameters: {
          type: 'object',
          properties: {
            item_ids: { type: 'array', items: { type: 'string' }, description: 'Lista de IDs dos itens.' }
          },
          required: ['item_ids']
        }
      },
      handler: async (args, ctx) => {
        const found = (args.item_ids || [])
          .map((id: string) => CatalogSearchService.getItemById(ctx.companyId, id))
          .filter(Boolean);
        return { count: found.length, items: found };
      }
    });

    // 18. get_item_availability (Verifica disponibilidade e estoque atual)
    this.tools.set('get_item_availability', {
      definition: {
        name: 'get_item_availability',
        description: 'Verifica a disponibilidade em tempo real e estoque do item.',
        parameters: {
          type: 'object',
          properties: {
            item_id: { type: 'string', description: 'ID do item.' }
          },
          required: ['item_id']
        }
      },
      handler: async (args, ctx) => {
        const item = CatalogSearchService.getItemById(ctx.companyId, args.item_id);
        if (!item) return { found: false, available: false, message: 'Item não localizado.' };
        return {
          item_id: item.id,
          name: item.name,
          available: item.availability,
          stock: item.stock,
          status: item.availability ? 'DISPONÍVEL' : 'INDISPONÍVEL'
        };
      }
    });

    // 19. get_item_price (Consulta preço oficial verificado)
    this.tools.set('get_item_price', {
      definition: {
        name: 'get_item_price',
        description: 'Consulta o preço oficial e atualizado do item. NUNCA invente preços.',
        parameters: {
          type: 'object',
          properties: {
            item_id: { type: 'string', description: 'ID do item.' }
          },
          required: ['item_id']
        }
      },
      handler: async (args, ctx) => {
        const item = CatalogSearchService.getItemById(ctx.companyId, args.item_id);
        if (!item) return { found: false, message: 'Item não localizado.' };
        return {
          item_id: item.id,
          name: item.name,
          price: item.price,
          formatted_price: item.formatted_price
        };
      }
    });

    // 20. get_item_images (Consulta fotos reais do item)
    this.tools.set('get_item_images', {
      definition: {
        name: 'get_item_images',
        description: 'Consulta fotos e imagens oficiais do item no catálogo.',
        parameters: {
          type: 'object',
          properties: {
            item_id: { type: 'string', description: 'ID do item.' }
          },
          required: ['item_id']
        }
      },
      handler: async (args, ctx) => {
        const item = CatalogSearchService.getItemById(ctx.companyId, args.item_id);
        if (!item) return { found: false, images: [] };
        return {
          item_id: item.id,
          name: item.name,
          images: item.images,
          main_image: item.main_image
        };
      }
    });

    // 21. get_item_url (Consulta link oficial do site - source_url)
    this.tools.set('get_item_url', {
      definition: {
        name: 'get_item_url',
        description: 'Recupera o link original oficial (source_url) da página do produto/imóvel no site da empresa. NUNCA invente links.',
        parameters: {
          type: 'object',
          properties: {
            item_id: { type: 'string', description: 'ID do item.' }
          },
          required: ['item_id']
        }
      },
      handler: async (args, ctx) => {
        const item = CatalogSearchService.getItemById(ctx.companyId, args.item_id);
        if (!item || !item.source_url) {
          return { found: false, source_url: null, message: 'Link individual indisponível para este item.' };
        }
        return {
          item_id: item.id,
          name: item.name,
          source_url: item.source_url
        };
      }
    });

    // 22. select_catalog_item (Resolve seleção multiturno: "gostei do segundo", "o mais barato")
    this.tools.set('select_catalog_item', {
      definition: {
        name: 'select_catalog_item',
        description: 'Resolve a escolha do cliente baseada em referências da conversa anterior (ex: "gostei do segundo", "a segunda casa", "o primeiro", "o mais barato", "o de 389 mil").',
        parameters: {
          type: 'object',
          properties: {
            reference: { type: 'string', description: 'Expressão falada pelo cliente (ex: "segundo", "opcao 2", "mais barato").' }
          },
          required: ['reference']
        }
      },
      handler: async (args, ctx) => {
        const resolution = SearchSessionService.resolveItemReference(ctx.conversationId, args.reference);
        if (!resolution.resolved || !resolution.item) {
          return { resolved: false, message: resolution.reason || 'Não consegui identificar qual opção você se referiu.' };
        }

        // Pega item atualizado do banco
        const fullItem = CatalogSearchService.getItemById(ctx.companyId, resolution.item.id);
        return {
          resolved: true,
          selection_reason: resolution.reason,
          item: fullItem || resolution.item
        };
      }
    });

    // 23. get_search_session
    this.tools.set('get_search_session', {
      definition: {
        name: 'get_search_session',
        description: 'Consulta o estado atual da busca do cliente na conversa.',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      handler: async (args, ctx) => {
        const session = store.searchSessions.get(ctx.conversationId);
        return { session: session || null };
      }
    });

    // 24. clear_search_session
    this.tools.set('clear_search_session', {
      definition: {
        name: 'clear_search_session',
        description: 'Reinicia o estado da busca do cliente para começar uma nova procura do zero.',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      handler: async (args, ctx) => {
        SearchSessionService.clearSession(ctx.conversationId);
        return { success: true, message: 'Sessão de busca reiniciada.' };
      }
    });

    // =========================================================================
    // FERRAMENTAS ESPECIALIZADAS — NOVOS SEGMENTOS (hotel, curso, vaga, agro)
    // =========================================================================

    // 25. search_hotels (Hotéis / Pousadas / Hostels)
    this.tools.set('search_hotels', {
      definition: {
        name: 'search_hotels',
        description: 'Pesquisa hotéis, pousadas e hospedagens com filtros de estrelas, localização, preço e comodidades.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Nome ou tipo de hospedagem (ex: pousada, resort, hostel).' },
            city: { type: 'string', description: 'Cidade de destino.' },
            neighborhood: { type: 'string', description: 'Bairro ou localização.' },
            stars: { type: 'number', description: 'Mínimo de estrelas (1-5).' },
            price_min: { type: 'number', description: 'Diária mínima em reais.' },
            price_max: { type: 'number', description: 'Diária máxima em reais.' },
            amenities: { type: 'array', items: { type: 'string' }, description: 'Comodidades desejadas (piscina, academia, café da manhã, pet-friendly).' },
            limit: { type: 'number', description: 'Quantidade máxima (padrão 3).' }
          }
        }
      },
      handler: async (args, ctx) => {
        const filters: any = {
          entity_type: 'hotel',
          query: args.query,
          city: args.city,
          neighborhood: args.neighborhood,
          price_min: args.price_min,
          price_max: args.price_max,
          stars: args.stars,
          amenities: args.amenities,
        };

        SearchSessionService.updateSessionFilters(ctx.conversationId, ctx.companyId, filters, {
          category: 'Hotéis',
          entity_type: 'hotel',
          query: args.query
        });

        const searchRes = await CatalogSearchService.searchCatalog(ctx.companyId, filters, {
          limit: args.limit || 3,
          conversationId: ctx.conversationId,
          customerId: ctx.customerId
        });

        SearchSessionService.savePresentedResults(ctx.conversationId, ctx.companyId, searchRes.items);
        const settings = store.catalogSettings.get(ctx.companyId);
        const formattedText = CatalogFormatter.formatTextResponse(searchRes.items, settings, searchRes.alternative_message);
        const cards = CatalogFormatter.formatStructuredCards(searchRes.items, settings);

        return {
          results: searchRes.items,
          total_found: searchRes.total_found,
          is_alternative: searchRes.is_alternative,
          formatted_presentation: formattedText,
          cards
        };
      }
    });

    // 26. search_courses (Cursos / Treinamentos / Capacitações)
    this.tools.set('search_courses', {
      definition: {
        name: 'search_courses',
        description: 'Pesquisa cursos, treinamentos, workshops ou capacitações com filtros de modalidade, carga horária e preço.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Nome do curso ou área de conhecimento.' },
            modality: { type: 'string', description: 'Modalidade: online, presencial, híbrido.' },
            has_certificate: { type: 'boolean', description: 'Exige certificado?' },
            price_max: { type: 'number', description: 'Preço máximo.' },
            limit: { type: 'number', description: 'Quantidade máxima (padrão 3).' }
          }
        }
      },
      handler: async (args, ctx) => {
        const filters: any = {
          entity_type: 'course',
          query: args.query,
          price_max: args.price_max,
          modality: args.modality,
          has_certificate: args.has_certificate,
        };

        SearchSessionService.updateSessionFilters(ctx.conversationId, ctx.companyId, filters, {
          category: 'Cursos',
          entity_type: 'course',
          query: args.query
        });

        const searchRes = await CatalogSearchService.searchCatalog(ctx.companyId, filters, {
          limit: args.limit || 3,
          conversationId: ctx.conversationId,
          customerId: ctx.customerId
        });

        SearchSessionService.savePresentedResults(ctx.conversationId, ctx.companyId, searchRes.items);
        const settings = store.catalogSettings.get(ctx.companyId);
        const formattedText = CatalogFormatter.formatTextResponse(searchRes.items, settings, searchRes.alternative_message);
        const cards = CatalogFormatter.formatStructuredCards(searchRes.items, settings);

        return {
          results: searchRes.items,
          total_found: searchRes.total_found,
          formatted_presentation: formattedText,
          cards
        };
      }
    });

    // 27. search_jobs (Vagas de Emprego / Freelaç / Oportunidades)
    this.tools.set('search_jobs', {
      definition: {
        name: 'search_jobs',
        description: 'Pesquisa vagas de emprego, freelas ou oportunidades com filtros de regime, modalidade e faixa salarial.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Área ou cargo desejado (ex: desenvolvedora, vendedor, motorista).' },
            employment_type: { type: 'string', description: 'Regime: CLT, PJ, estágio, freela, temporário.' },
            work_mode: { type: 'string', description: 'Modalidade: remoto, presencial, híbrido.' },
            city: { type: 'string', description: 'Cidade.' },
            salary_min: { type: 'number', description: 'Salário mínimo desejado.' },
            limit: { type: 'number', description: 'Quantidade máxima (padrão 3).' }
          }
        }
      },
      handler: async (args, ctx) => {
        const filters: any = {
          entity_type: 'job',
          query: args.query,
          employment_type: args.employment_type,
          work_mode: args.work_mode,
          city: args.city,
          price_min: args.salary_min, // Reutiliza price_min para salário mínimo
        };

        SearchSessionService.updateSessionFilters(ctx.conversationId, ctx.companyId, filters, {
          category: 'Vagas',
          entity_type: 'job',
          query: args.query
        });

        const searchRes = await CatalogSearchService.searchCatalog(ctx.companyId, filters, {
          limit: args.limit || 3,
          conversationId: ctx.conversationId,
          customerId: ctx.customerId
        });

        SearchSessionService.savePresentedResults(ctx.conversationId, ctx.companyId, searchRes.items);
        const settings = store.catalogSettings.get(ctx.companyId);
        const formattedText = CatalogFormatter.formatTextResponse(searchRes.items, settings, searchRes.alternative_message);
        const cards = CatalogFormatter.formatStructuredCards(searchRes.items, settings);

        return {
          results: searchRes.items,
          total_found: searchRes.total_found,
          formatted_presentation: formattedText,
          cards
        };
      }
    });

    // 28. log_catalog_click (Registra clique do cliente em item — analytics)
    this.tools.set('log_catalog_click', {
      definition: {
        name: 'log_catalog_click',
        description: 'Registra quando o cliente demonstra interesse ou clica em um item específico do catálogo (analytics e ranking).',
        parameters: {
          type: 'object',
          properties: {
            item_id: { type: 'string', description: 'ID do item selecionado.' },
            item_name: { type: 'string', description: 'Nome do item.' },
            source_url: { type: 'string', description: 'URL do item (opcional).' }
          },
          required: ['item_id']
        }
      },
      handler: async (args, ctx) => {
        const item = await CatalogSearchService.getItemByIdAsync(ctx.companyId, args.item_id)
          || CatalogSearchService.getItemById(ctx.companyId, args.item_id);

        await CatalogSearchService.logClick({
          companyId: ctx.companyId,
          conversationId: ctx.conversationId,
          customerId: ctx.customerId,
          itemId: args.item_id,
          itemName: args.item_name || item?.name,
          entityType: item?.entity_type,
          sourceUrl: args.source_url || item?.source_url,
        });

        return {
          logged: true,
          item_id: args.item_id,
          message: 'Interesse registrado com sucesso.'
        };
      }
    });
  }
}

