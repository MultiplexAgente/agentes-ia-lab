import { store } from '../../config/database';
import { DataSourceRegistry } from './DataSourceRegistry';

export interface EntityInfo {
  name: string;
  displayName: string;
  count: number;
  hasData: boolean;
  fields: string[];
  description: string;
}

export interface ExistingModuleInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: number;
  dataSources: string[];
  componentTypes: string[];
}

export interface SystemSnapshot {
  companyId: string;
  companyName: string;
  existingModules: ExistingModuleInfo[];
  entities: EntityInfo[];
  availableDataSources: string[];
  hasAnyData: boolean;
  contextSummary: string;
}

export class ApplicationIntrospectionService {

  public static inspect(companyId: string): SystemSnapshot {
    const company = store.companies.get(companyId);
    const companyName = company?.name || 'Empresa';

    const existingModules: ExistingModuleInfo[] = Array.from(store.builderModules.values())
      .filter(m => m.company_id === companyId && m.status === 'active')
      .map(m => {
        const dataSources = new Set<string>();
        const componentTypes = new Set<string>();
        m.schema?.sections?.forEach(sec => {
          sec.components?.forEach(c => {
            if (c.dataSource) dataSources.add(c.dataSource);
            if (c.type) componentTypes.add(c.type);
          });
        });
        return {
          id: m.id,
          name: m.name,
          slug: m.slug,
          description: m.description,
          version: m.version,
          dataSources: Array.from(dataSources),
          componentTypes: Array.from(componentTypes)
        };
      });

    const conversations = Array.from(store.conversations.values()).filter(c => c.company_id === companyId);
    let totalMessages = 0;
    for (const c of conversations) {
      totalMessages += (store.messages.get(c.id) || []).length;
    }
    const customers = store.customers.get(companyId) || [];
    const products = store.products.get(companyId) || [];
    const catalogItems = Array.from(store.catalogItems.values()).filter(i => i.company_id === companyId);
    const orders = store.orders.get(companyId) || [];
    const expenses = store.expenses.get(companyId) || [];

    const entities: EntityInfo[] = [
      { name: 'conversations', displayName: 'Conversas / Atendimentos', count: conversations.length, hasData: conversations.length > 0, fields: ['id', 'customer_id', 'channel_type', 'status', 'created_at'], description: `${conversations.length} conversas registradas` },
      { name: 'messages', displayName: 'Mensagens Trocadas', count: totalMessages, hasData: totalMessages > 0, fields: ['id', 'conversation_id', 'sender', 'content', 'created_at'], description: `${totalMessages} mensagens no histórico` },
      { name: 'customers', displayName: 'Clientes', count: customers.length, hasData: customers.length > 0, fields: ['id', 'name', 'phone', 'email', 'total_orders', 'created_at'], description: `${customers.length} clientes na base` },
      { name: 'catalog_items', displayName: 'Catálogo de Produtos / Serviços', count: (products.length + catalogItems.length), hasData: (products.length + catalogItems.length) > 0, fields: ['id', 'name', 'price', 'category', 'source_url'], description: `${products.length + catalogItems.length} itens cadastrados` },
      { name: 'orders', displayName: 'Pedidos Comerciais', count: orders.length, hasData: orders.length > 0, fields: ['id', 'customer_id', 'total_amount', 'status', 'created_at'], description: `${orders.length} pedidos reais` },
      { name: 'expenses', displayName: 'Despesas Lançadas', count: expenses.length, hasData: expenses.length > 0, fields: ['id', 'title', 'category', 'amount', 'due_date'], description: `${expenses.length} despesas registradas` }
    ];

    const availableDataSources = entities.filter(e => e.hasData).map(e => e.name);
    const hasAnyData = availableDataSources.length > 0;

    const moduleList = existingModules.length > 0
      ? existingModules.map(m => `  * ${m.name} (/${m.slug}) - v${m.version}`).join('\n')
      : '  (nenhum)';
    const entityList = entities.map(e => `  * ${e.displayName}: ${e.count} registros`).join('\n');

    const contextSummary = `SISTEMA ATUAL - ${companyName}:\nMódulos existentes:\n${moduleList}\nEntidades do Domínio:\n${entityList}\nFontes com dados reais no momento: ${availableDataSources.join(', ') || 'nenhuma (mostrar empty state ou zero)'}`;

    return { companyId, companyName, existingModules, entities, availableDataSources, hasAnyData, contextSummary };
  }

  public static findExistingModuleByIntent(companyId: string, intent: string): ExistingModuleInfo | undefined {
    const snapshot = this.inspect(companyId);
    const p = intent.toLowerCase();
    return snapshot.existingModules.find(m => {
      const n = m.name.toLowerCase(), s = m.slug.toLowerCase();
      if (n.includes(p) || p.includes(n) || s.includes(p.replace(/\s+/g, '-'))) return true;
      if ((p.includes('financ') || p.includes('faturament')) && n.includes('financ')) return true;
      if ((p.includes('client') || p.includes('consumidor')) && n.includes('client')) return true;
      if ((p.includes('pedido') || p.includes('venda')) && (n.includes('pedido') || n.includes('venda'))) return true;
      if (p.includes('produto') && n.includes('produto')) return true;
      return false;
    });
  }

  public static getRelevantEntities(intent: string, snapshot: SystemSnapshot): EntityInfo[] {
    const p = intent.toLowerCase();
    const seen = new Set<string>();
    const add = (names: string[]) => names.forEach(n => seen.add(n));

    if (p.includes('conversa') || p.includes('atendimento') || p.includes('chat') || p.includes('mensagem')) {
      add(['conversations', 'messages']);
    }
    if (p.includes('client') || p.includes('consumidor') || p.includes('lead') || p.includes('contato')) {
      add(['customers', 'conversations']);
    }
    if (p.includes('produto') || p.includes('servico') || p.includes('imovel') || p.includes('catalogo') || p.includes('cardapio')) {
      add(['catalog_items']);
    }
    if (p.includes('pedido') || p.includes('venda')) {
      add(['orders']);
    }
    if (p.includes('financ') || p.includes('despesa') || p.includes('faturament')) {
      add(['orders', 'expenses']);
    }

    return snapshot.entities.filter(e => seen.has(e.name));
  }
}
