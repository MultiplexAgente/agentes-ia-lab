import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { AIBuilderModule, AIBuildPlan, UISchema, UIComponent } from '../../types/index';
import { store } from '../../config/database';
import { ApplicationIntrospectionService, SystemSnapshot } from './ApplicationIntrospectionService';
import { DataSourceRegistry } from './DataSourceRegistry';


export class AIBuilderService {
  private openai: OpenAI | null = null;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (key && !key.includes('your_openai_api_key')) {
      this.openai = new OpenAI({ apiKey: key });
    }
  }

  public async generateBuildPlan(params: {
    companyId: string;
    prompt: string;
    currentModuleId?: string;
  }): Promise<AIBuildPlan> {
    const { companyId, prompt, currentModuleId } = params;
    const promptLower = prompt.toLowerCase();

    // CRÍTICO: Recusa estrita de criação de dados fictícios em produção
    if (
      promptLower.includes('fictício') ||
      promptLower.includes('ficticio') ||
      promptLower.includes('fake') ||
      promptLower.includes('invente') ||
      promptLower.includes('mock') ||
      (promptLower.includes('preencher') && promptLower.includes('cliente'))
    ) {
      throw new Error('A criação de dados fictícios em produção é proibida pelas diretrizes do Multiplex. O sistema opera exclusivamente com dados e integrações reais. Para testes visuais ou demonstrações, utilize explicitamente o Modo Demonstração (DEMO MODE).');
    }

    // STEP 1: Real system introspection - know what exists before planning
    const snapshot = ApplicationIntrospectionService.inspect(companyId);

    // STEP 2: Detect if editing existing module (patch vs create)
    let existingModule: AIBuilderModule | undefined;
    if (currentModuleId) {
      existingModule = store.builderModules.get(currentModuleId);
    } else {
      const detected = ApplicationIntrospectionService.findExistingModuleByIntent(companyId, prompt);
      const isEditRequest = !promptLower.includes('crie') && !promptLower.includes('criar') && !promptLower.includes('novo');
      if (detected && isEditRequest) {
        existingModule = store.builderModules.get(detected.id);
      }
    }

    // STEP 3: Identify relevant real data sources
    const relevantEntities = ApplicationIntrospectionService.getRelevantEntities(prompt, snapshot);

    // STEP 4: Try OpenAI with full system context
    if (this.openai) {
      try {
        const sysMsg = 'Voce e o arquiteto do AI App Builder. REGRAS: 1)JSON AIBuildPlan. 2)NUNCA invente dados. 3)Use apenas fontes em available_data_sources. 4)Se modulo existe e usuario quer modificar: action patch_module. 5)Componentes: metric,chart,table. 6)Graficos: line,bar,donut. 7)Nao crie funcionalidades alem do pedido.';
        const completion = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [
            { role: 'system', content: sysMsg },
            { role: 'user', content: JSON.stringify({
              user_prompt: prompt,
              system_context: snapshot.contextSummary,
              existing_module: existingModule
                ? { id: existingModule.id, name: existingModule.name, slug: existingModule.slug, schema: existingModule.schema }
                : null,
              available_data_sources: relevantEntities.filter((e: any) => e.hasData).map((e: any) => e.name),
              entities: relevantEntities.map((e: any) => ({
                name: e.name, count: e.count, hasData: e.hasData, fields: e.fields
              }))
            }) }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2
        });
        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
        if (parsed.action && parsed.suggested_schema) {
          return {
            action: existingModule ? 'patch_module' : 'create_module',
            target_module: {
              id: existingModule?.id,
              name: parsed.target_module?.name || this.extractModuleName(prompt),
              slug: parsed.target_module?.slug || this.slugify(this.extractModuleName(prompt))
            },
            summary: parsed.summary || 'Plano gerado',
            components_summary: parsed.components_summary || [],
            data_sources: relevantEntities.filter((e: any) => e.hasData).map((e: any) => e.name),
            risk_level: prompt.toLowerCase().includes('excluir') ? 'HIGH_RISK' : 'LOW_RISK',
            suggested_schema: parsed.suggested_schema,
            found_in_system: snapshot.existingModules.map(m => m.name),
            entities_discovered: relevantEntities.map((e: any) => ({ name: e.displayName, count: e.count, hasData: e.hasData })),
            is_patch: !!existingModule
          } as any;
        }
      } catch (err) { console.warn('OpenAI unavailable:', err); }
    }

    return this.generateDeterministicPlan(prompt, snapshot, existingModule);
  }

  private generateDeterministicPlan(prompt: string, snapshot: SystemSnapshot, existingModule?: AIBuilderModule): AIBuildPlan {
    const p = prompt.toLowerCase();
    if (existingModule) return this.generatePatchPlan(prompt, existingModule, snapshot);
    if (p.includes('financ') || p.includes('faturament') || p.includes('lucro') || p.includes('despesa')) return this.createFinancialModule(snapshot);
    if (p.includes('client') || p.includes('consumidor') || p.includes('lead')) return this.createCustomersModule(snapshot);
    if (p.includes('pedido') || p.includes('venda') || p.includes('transac')) return this.createOrdersModule(snapshot);
    if (p.includes('produto') || p.includes('cardapio') || p.includes('catalogo')) return this.createProductsModule(snapshot);
    return this.createGenericModule(prompt, snapshot);
  }

  private generatePatchPlan(prompt: string, existingModule: AIBuilderModule, snapshot: SystemSnapshot): AIBuildPlan {
    const p = prompt.toLowerCase();
    const updatedSchema: UISchema = JSON.parse(JSON.stringify(existingModule.schema));
    const changes: string[] = [];

    if (p.includes('remov') || p.includes('tirar') || p.includes('apague') || p.includes('exclua')) {
      let rt = '';
      updatedSchema.sections.forEach(sec => {
        sec.components = sec.components.filter(c => {
          const m = p.includes(c.title.toLowerCase())
            || (p.includes('despesa') && c.title.toLowerCase().includes('despesa'))
            || (p.includes('grafico') && c.type === 'chart')
            || (p.includes('tabela') && c.type === 'table');
          if (m) rt = c.title;
          return !m;
        });
      });
      changes.push('Remover ' + (rt || 'componente'));
    }

    if (p.includes('grafico') || p.includes('chart')) {
      const ct = p.includes('donut') ? 'donut' : p.includes('barra') ? 'bar' : 'line';
      const sec = updatedSchema.sections.find(s => s.components.some(c => c.type === 'chart')) || updatedSchema.sections[0];
      if (sec) {
        sec.components.push({ id: 'comp-' + uuidv4().slice(0,8), type: 'chart', title: 'Evolucao de Desempenho', chartType: ct, dataSource: 'orders', groupBy: 'date' });
        changes.push('Adicionar grafico ' + ct);
      }
    }

    if (p.includes('ticket') || p.includes('medio')) {
      const sec = updatedSchema.sections.find(s => s.components.some(c => c.type === 'metric')) || updatedSchema.sections[0];
      if (sec) {
        sec.components.push({ id: 'comp-' + uuidv4().slice(0,8), type: 'metric', title: 'Ticket Medio', description: 'Valor medio por pedido', dataSource: 'orders', aggregation: 'avg', format: 'currency' });
        changes.push('Adicionar Ticket Medio');
      }
    }

    if (p.includes('filtro') || p.includes('periodo')) {
      updatedSchema.period_filter_enabled = true;
      changes.push('Ativar filtro por periodo');
    }

    if (p.includes('trocar') || p.includes('mudar') || p.includes('alterar')) {
      if (p.includes('linha') || p.includes('line')) {
        updatedSchema.sections.forEach(sec => sec.components.filter(c => c.type === 'chart').forEach(c => { c.chartType = 'line'; }));
        changes.push('Alterar para linha');
      } else if (p.includes('barra') || p.includes('bar')) {
        updatedSchema.sections.forEach(sec => sec.components.filter(c => c.type === 'chart').forEach(c => { c.chartType = 'bar'; }));
        changes.push('Alterar para barras');
      }
    }

    if (changes.length === 0) changes.push('Atualizacao de layout');

    return {
      action: 'patch_module',
      target_module: { id: existingModule.id, name: existingModule.name, slug: existingModule.slug },
      summary: 'Modificar ' + existingModule.name + ': ' + changes.join(', '),
      components_summary: changes,
      data_sources: snapshot.availableDataSources,
      risk_level: 'LOW_RISK',
      suggested_schema: updatedSchema,
      found_in_system: snapshot.existingModules.map(m => m.name),
      entities_discovered: snapshot.entities.filter(e => e.hasData).map(e => ({ name: e.displayName, count: e.count, hasData: e.hasData })),
      is_patch: true
    } as any;
  }

  private createFinancialModule(snapshot: SystemSnapshot): AIBuildPlan {
    const hasOrders = snapshot.entities.find(e => e.name === 'orders')?.hasData;
    const hasExpenses = snapshot.entities.find(e => e.name === 'expenses')?.hasData;
    const hasPayments = snapshot.entities.find(e => e.name === 'payments')?.hasData;
    const sections: any[] = [];
    const cs: string[] = [];
    const us: string[] = [];
    const kpis: UIComponent[] = [];

    if (hasPayments || hasOrders) {
      kpis.push({ id: 'm-01', type: 'metric', title: 'Faturamento Total', description: 'Total recebido', dataSource: 'payments', aggregation: 'sum', format: 'currency' });
      kpis.push({ id: 'm-04', type: 'metric', title: 'Pedidos Pagos', description: 'Volume de vendas', dataSource: 'orders', aggregation: 'count', format: 'number' });
      us.push('payments', 'orders');
      cs.push('Cards de Faturamento e Pedidos');
    }
    if (hasExpenses) {
      kpis.push({ id: 'm-02', type: 'metric', title: 'Despesas Operacionais', description: 'Custos lancados', dataSource: 'expenses', aggregation: 'sum', format: 'currency' });
      kpis.push({ id: 'm-03', type: 'metric', title: 'Lucro Liquido', description: 'Receita menos despesas', dataSource: 'payments', aggregation: 'sum', format: 'currency' });
      us.push('expenses');
      cs.push('Cards de Despesas e Lucro');
    }
    if (kpis.length > 0) sections.push({ id: 'sec-metrics', title: 'Indicadores Principais', columns: Math.min(kpis.length, 4), components: kpis });

    const charts: UIComponent[] = [];
    if (hasOrders && hasExpenses) {
      charts.push({ id: 'ch-01', type: 'chart', title: 'Faturamento x Despesas', description: 'Evolucao por periodo', chartType: 'line', dataSource: 'payments' });
      cs.push('Grafico de Evolucao');
    }
    if (hasPayments) {
      charts.push({ id: 'ch-02', type: 'chart', title: 'Metodos de Pagamento', description: 'PIX, Cartao e outros', chartType: 'donut', dataSource: 'payments' });
      cs.push('Grafico Donut de Pagamentos');
    }
    if (charts.length > 0) sections.push({ id: 'sec-charts', title: 'Desempenho Financeiro', columns: Math.min(charts.length, 2), components: charts });

    if (hasOrders) {
      sections.push({ id: 'sec-table', title: 'Transacoes', columns: 1, components: [{ id: 'tb-01', type: 'table', title: 'Extrato de Pedidos', dataSource: 'orders', columns: [
        { key: 'id', label: 'Cod. Pedido' }, { key: 'customer_name', label: 'Cliente' }, { key: 'total_amount', label: 'Valor' },
        { key: 'payment_method', label: 'Metodo' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Data' }
      ] }] });
      cs.push('Tabela de Pedidos');
    }

    return {
      action: 'create_module', target_module: { name: 'Gestao Financeira', slug: 'gestao-financeira' },
      summary: kpis.length > 0 ? 'Dashboard financeiro com ' + kpis.length + ' KPIs e dados reais.' : 'Dashboard financeiro criado sem dados ainda.',
      components_summary: cs.length > 0 ? cs : ['Pagina criada sem dados ainda'],
      data_sources: [...new Set(us)], risk_level: 'LOW_RISK',
      suggested_schema: { title: 'Gestao Financeira', description: 'Faturamento, despesas, lucro e pedidos.', icon: 'DollarSign', layout: 'dashboard', period_filter_enabled: true, sections },
      found_in_system: [], entities_discovered: snapshot.entities.filter(e => ['orders','payments','expenses'].includes(e.name)).map(e => ({ name: e.displayName, count: e.count, hasData: e.hasData })), is_patch: false
    } as any;
  }

  private createCustomersModule(snapshot: SystemSnapshot): AIBuildPlan {
    const hasCustomers = snapshot.entities.find(e => e.name === 'customers')?.hasData;
    const hasOrders = snapshot.entities.find(e => e.name === 'orders')?.hasData;
    const custCount = snapshot.entities.find(e => e.name === 'customers')?.count || 0;
    const sections: any[] = [];
    const cs: string[] = [];

    if (hasCustomers) {
      const kpis: any[] = [
        { id: 'cm-01', type: 'metric', title: 'Total de Clientes', description: 'Clientes na base', dataSource: 'customers', aggregation: 'count', format: 'number' },
        { id: 'cm-02', type: 'metric', title: 'Novos Clientes (Mes)', description: 'Cadastros no periodo', dataSource: 'customers', aggregation: 'count', format: 'number' }
      ];
      if (hasOrders) kpis.push({ id: 'cm-03', type: 'metric', title: 'Ticket Medio por Cliente', description: 'Gasto medio acumulado', dataSource: 'orders', aggregation: 'avg', format: 'currency' });
      sections.push({ id: 'sec-client-metrics', title: 'Resumo', columns: kpis.length, components: kpis });
      cs.push('Cards de Clientes');

      const cols: any[] = [{ key: 'name', label: 'Nome' }, { key: 'phone', label: 'Telefone' }, { key: 'email', label: 'E-mail' }];
      if (hasOrders) { cols.push({ key: 'total_orders', label: 'Pedidos' }); cols.push({ key: 'total_spent', label: 'Total Gasto' }); }
      cols.push({ key: 'status', label: 'Status' });
      sections.push({ id: 'sec-client-table', title: 'Diretorio de Clientes', columns: 1, components: [{ id: 'ctb-01', type: 'table', title: 'Clientes Cadastrados', dataSource: 'customers', columns: cols }] });
      cs.push('Tabela de Clientes');
    }

    return {
      action: 'create_module', target_module: { name: 'Clientes', slug: 'clientes' },
      summary: hasCustomers ? 'Area de clientes com ' + custCount + ' clientes reais.' : 'Area de clientes sem dados ainda.',
      components_summary: cs.length > 0 ? cs : ['Pagina criada sem dados ainda'],
      data_sources: [hasCustomers && 'customers', hasOrders && 'orders'].filter(Boolean) as string[],
      risk_level: 'LOW_RISK',
      suggested_schema: { title: 'Clientes', description: custCount + ' clientes cadastrados.', icon: 'Users', layout: 'crud', period_filter_enabled: false, sections },
      found_in_system: [], entities_discovered: snapshot.entities.filter(e => ['customers','orders'].includes(e.name)).map(e => ({ name: e.displayName, count: e.count, hasData: e.hasData })), is_patch: false
    } as any;
  }

  private createOrdersModule(snapshot: SystemSnapshot): AIBuildPlan {
    const hasOrders = snapshot.entities.find(e => e.name === 'orders')?.hasData;
    const hasPayments = snapshot.entities.find(e => e.name === 'payments')?.hasData;
    const ordCount = snapshot.entities.find(e => e.name === 'orders')?.count || 0;
    const sections: any[] = [];
    const cs: string[] = [];

    if (hasOrders || hasPayments) {
      sections.push({ id: 'sec-ped-kpi', columns: 3, components: [
        { id: 'pk-01', type: 'metric', title: 'Pedidos Pagos', dataSource: 'orders', aggregation: 'count', format: 'number' },
        { id: 'pk-02', type: 'metric', title: 'Faturamento Total', dataSource: 'payments', aggregation: 'sum', format: 'currency' },
        { id: 'pk-03', type: 'metric', title: 'Ticket Medio', dataSource: 'orders', aggregation: 'avg', format: 'currency' }
      ] });
      cs.push('Cards de Pedidos');
    }
    sections.push({ id: 'sec-ped-table', columns: 1, components: [{ id: 'pt-01', type: 'table', title: 'Pedidos', dataSource: 'orders', columns: [
      { key: 'id', label: 'ID' }, { key: 'customer_name', label: 'Cliente' }, { key: 'total_amount', label: 'Valor' },
      { key: 'payment_method', label: 'Pagamento' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Data' }
    ] }] });
    cs.push('Tabela de Pedidos');

    return {
      action: 'create_module', target_module: { name: 'Pedidos', slug: 'pedidos' },
      summary: hasOrders ? 'Painel de pedidos com ' + ordCount + ' registros reais.' : 'Painel de pedidos sem dados ainda.',
      components_summary: cs,
      data_sources: [hasOrders && 'orders', hasPayments && 'payments'].filter(Boolean) as string[],
      risk_level: 'LOW_RISK',
      suggested_schema: { title: 'Pedidos', description: ordCount + ' pedidos registrados.', icon: 'Package', layout: 'dashboard', period_filter_enabled: true, sections },
      found_in_system: [], entities_discovered: snapshot.entities.filter(e => ['orders','payments'].includes(e.name)).map(e => ({ name: e.displayName, count: e.count, hasData: e.hasData })), is_patch: false
    } as any;
  }

  private createProductsModule(snapshot: SystemSnapshot): AIBuildPlan {
    const hasProducts = snapshot.entities.find(e => e.name === 'products')?.hasData;
    const prodCount = snapshot.entities.find(e => e.name === 'products')?.count || 0;
    return {
      action: 'create_module', target_module: { name: 'Produtos', slug: 'produtos' },
      summary: hasProducts ? 'Catalogo com ' + prodCount + ' produtos reais.' : 'Catalogo criado sem produtos ainda.',
      components_summary: ['Cards de Contagem e Preco Medio', 'Tabela de Produtos'],
      data_sources: hasProducts ? ['products'] : [], risk_level: 'LOW_RISK',
      suggested_schema: { title: 'Produtos', description: prodCount + ' produtos.', icon: 'Package', layout: 'crud', period_filter_enabled: false, sections: [
        { id: 'sec-prod-metrics', columns: 2, components: [
          { id: 'pm-01', type: 'metric', title: 'Total de Produtos', dataSource: 'products', aggregation: 'count', format: 'number' },
          { id: 'pm-02', type: 'metric', title: 'Preco Medio', dataSource: 'products', aggregation: 'avg', format: 'currency' }
        ] },
        { id: 'sec-prod-table', columns: 1, components: [{ id: 'pt-01', type: 'table', title: 'Catalogo de Produtos', dataSource: 'products', columns: [
          { key: 'name', label: 'Produto' }, { key: 'price', label: 'Preco' }, { key: 'category', label: 'Categoria' }, { key: 'status', label: 'Disponivel' }
        ] }] }
      ] },
      found_in_system: [], entities_discovered: snapshot.entities.filter(e => e.name === 'products').map(e => ({ name: e.displayName, count: e.count, hasData: e.hasData })), is_patch: false
    } as any;
  }

  private createGenericModule(prompt: string, snapshot: SystemSnapshot): AIBuildPlan {
    const moduleName = this.extractModuleName(prompt);
    const available = snapshot.entities.filter(e => e.hasData);
    return {
      action: 'create_module', target_module: { name: moduleName, slug: this.slugify(moduleName) },
      summary: 'Criar modulo ' + moduleName + ' com dados disponiveis.',
      components_summary: available.length > 0 ? available.map(e => e.displayName + ': ' + e.count + ' registros') : ['Nenhum dado disponivel'],
      data_sources: available.map(e => e.name), risk_level: 'LOW_RISK',
      suggested_schema: { title: moduleName, description: 'Modulo gerado.', icon: 'Layout', layout: 'dashboard', period_filter_enabled: false, sections: available.length > 0 ? [{ id: 'sec-info', title: 'Informacoes Disponiveis', columns: Math.min(available.length, 3), components: available.slice(0,3).map((e, i) => ({ id: 'm-' + i, type: 'metric', title: e.displayName, description: e.description, dataSource: e.name, aggregation: 'count', format: 'number' })) }] : [] },
      found_in_system: snapshot.existingModules.map(m => m.name),
      entities_discovered: snapshot.entities.map(e => ({ name: e.displayName, count: e.count, hasData: e.hasData })), is_patch: false
    } as any;
  }

  private extractModuleName(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('financ')) return 'Gestao Financeira';
    if (p.includes('client')) return 'Clientes';
    if (p.includes('pedido')) return 'Pedidos';
    if (p.includes('venda')) return 'Vendas';
    if (p.includes('produto')) return 'Produtos';
    if (p.includes('despesa')) return 'Despesas';
    return 'Novo Modulo';
  }

  private slugify(text: string): string {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
  }
}

export const aiBuilderService = new AIBuilderService();
