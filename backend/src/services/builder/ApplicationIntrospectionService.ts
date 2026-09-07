import { store } from '../../config/database.js';

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

    const orders = store.orders.get(companyId) || [];
    const customers = store.customers.get(companyId) || [];
    const products = store.products.get(companyId) || [];
    const expenses = store.expenses.get(companyId) || [];
    const catalogItems = Array.from(store.catalogItems.values()).filter(i => i.company_id === companyId);
    const paidOrders = orders.filter(o => o.payment_status === 'paid');

    const entities: EntityInfo[] = [
      { name: 'orders', displayName: 'Pedidos', count: orders.length, hasData: orders.length > 0, fields: ['id','customer_id','total_amount','payment_status','payment_method','status','created_at'], description: orders.length + ' pedidos (' + paidOrders.length + ' pagos)' },
      { name: 'payments', displayName: 'Pagamentos', count: paidOrders.length, hasData: paidOrders.length > 0, fields: ['id','total_amount','payment_method','status','created_at'], description: paidOrders.length + ' pagamentos confirmados' },
      { name: 'customers', displayName: 'Clientes', count: customers.length, hasData: customers.length > 0, fields: ['id','name','phone','email','total_orders','created_at'], description: customers.length + ' clientes na base' },
      { name: 'products', displayName: 'Produtos', count: products.length, hasData: products.length > 0, fields: ['id','name','price','category','active','description'], description: products.length + ' produtos' },
      { name: 'expenses', displayName: 'Despesas', count: expenses.length, hasData: expenses.length > 0, fields: ['id','title','category','amount','status','due_date'], description: expenses.length + ' lancamentos' },
      { name: 'catalog', displayName: 'Catalogo IA', count: catalogItems.length, hasData: catalogItems.length > 0, fields: ['id','name','price','category','source_url','images'], description: catalogItems.length + ' itens no catalogo' }
    ];

    const availableDataSources = entities.filter(e => e.hasData).map(e => e.name);
    const hasAnyData = availableDataSources.length > 0;

    const moduleList = existingModules.length > 0
      ? existingModules.map(m => '  * ' + m.name + ' (/' + m.slug + ') - v' + m.version).join('\n')
      : '  (nenhum)';
    const entityList = entities.map(e => '  * ' + e.displayName + ': ' + e.count + ' registros').join('\n');

    const contextSummary = 'SISTEMA ATUAL - ' + companyName + ':\nModulos existentes:\n' + moduleList + '\nEntidades:\n' + entityList + '\nFontes com dados reais: ' + (availableDataSources.join(', ') || 'nenhuma');

    return { companyId, companyName, existingModules, entities, availableDataSources, hasAnyData, contextSummary };
  }

  public static findExistingModuleByIntent(companyId: string, intent: string): ExistingModuleInfo | undefined {
    const snapshot = this.inspect(companyId);
    const p = intent.toLowerCase();
    return snapshot.existingModules.find(m => {
      const n = m.name.toLowerCase(), s = m.slug.toLowerCase();
      if (n.includes(p) || p.includes(n) || s.includes(p.replace(/\s+/g,'-'))) return true;
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
    if (p.includes('financ') || p.includes('faturament') || p.includes('lucro') || p.includes('receita')) add(['payments','expenses','orders']);
    if (p.includes('despesa') || p.includes('custo')) add(['expenses']);
    if (p.includes('client') || p.includes('consumidor') || p.includes('lead')) add(['customers','orders']);
    if (p.includes('pedido') || p.includes('venda') || p.includes('transa')) add(['orders','payments','customers']);
    if (p.includes('produto') || p.includes('card') || p.includes('catalog')) add(['products','catalog']);
    return snapshot.entities.filter(e => seen.has(e.name));
  }
}
