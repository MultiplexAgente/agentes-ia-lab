import OpenAI from 'openai';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { 
  AIBuilderModule, AIBuilderModuleVersion, AIBuildPlan, 
  UISchema, UIComponent, UISection 
} from '../../types/index.js';
import { store, supabase } from '../../config/database.js';

dotenv.config();

export class AIBuilderService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai_api_key')) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  /**
   * Interpreta o prompt do usuário e gera um AIBuildPlan estruturado com Preview
   */
  public async generateBuildPlan(params: {
    companyId: string;
    prompt: string;
    currentModuleId?: string;
  }): Promise<AIBuildPlan> {
    const { companyId, prompt, currentModuleId } = params;
    const promptLower = prompt.toLowerCase();

    // Se estiver editando um módulo existente
    let existingModule: AIBuilderModule | undefined;
    if (currentModuleId) {
      existingModule = store.builderModules.get(currentModuleId);
    }

    // Tenta usar OpenAI se configurado
    if (this.openai) {
      try {
        const systemPrompt = `Você é o arquiteto do AI App Builder da plataforma Multiplex IA.
Sua missão é transformar a solicitação do usuário em um plano estruturado de UI Schema para a empresa.
Regras:
1. Responda ESTRITAMENTE em formato JSON com a estrutura do AIBuildPlan.
2. NUNCA gere código arbitrário (HTML/JS). Use apenas os tipos de componentes permitidos: metric, chart, table, form, filter.
3. Tipos de gráficos permitidos: line, bar, area, pie, donut.
4. Fontes de dados permitidas: orders, payments, expenses, customers, products.
5. Se for uma edição de módulo existente, adapte o schema preservando os componentes existentes e adicionando ou removendo o que foi pedido.`;

        const userContent = JSON.stringify({
          prompt,
          current_module: existingModule ? {
            name: existingModule.name,
            slug: existingModule.slug,
            schema: existingModule.schema
          } : null,
          available_data_sources: ['orders', 'payments', 'expenses', 'customers', 'products']
        });

        const completion = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
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
              name: parsed.target_module?.name || (existingModule ? existingModule.name : this.extractModuleName(prompt)),
              slug: parsed.target_module?.slug || (existingModule ? existingModule.slug : this.slugify(this.extractModuleName(prompt)))
            },
            summary: parsed.summary || `Plano gerado para ${prompt}`,
            components_summary: parsed.components_summary || ['Cards de Indicadores', 'Gráfico de Desempenho', 'Tabela de Dados'],
            data_sources: parsed.data_sources || ['orders', 'payments', 'expenses'],
            risk_level: promptLower.includes('excluir') || promptLower.includes('apagar') ? 'HIGH_RISK' : 'LOW_RISK',
            suggested_schema: parsed.suggested_schema
          };
        }
      } catch (err) {
        console.warn('Falha no modelo da OpenAI para build plan, acionando gerador determinístico inteligente:', err);
      }
    }

    // ── GERADOR INTELIGENTE DETERMINÍSTICO (RESILIENTE E ULTRA-RÁPIDO) ──
    return this.generateDeterministicPlan(prompt, existingModule);
  }

  /**
   * Gerador especializado de UI Schemas quando OpenAI não estiver ativo
   */
  private generateDeterministicPlan(prompt: string, existingModule?: AIBuilderModule): AIBuildPlan {
    const p = prompt.toLowerCase();

    // 1. EDIÇÃO DE MÓDULO EXISTENTE (PATCH)
    if (existingModule) {
      const updatedSchema: UISchema = JSON.parse(JSON.stringify(existingModule.schema));
      const componentsAdded: string[] = [];

      // Remoção de componente
      if (p.includes('remov') || p.includes('tirar') || p.includes('apague o')) {
        let removedTitle = '';
        updatedSchema.sections.forEach(sec => {
          sec.components = sec.components.filter(c => {
            const matches = p.includes(c.title.toLowerCase()) || (p.includes('despesa') && c.title.toLowerCase().includes('despesa'));
            if (matches) removedTitle = c.title;
            return !matches;
          });
        });
        return {
          action: 'patch_module',
          target_module: { id: existingModule.id, name: existingModule.name, slug: existingModule.slug },
          summary: `Remover "${removedTitle || 'componente solicitado'}" de ${existingModule.name}`,
          components_summary: [`Remoção de ${removedTitle}`],
          data_sources: ['orders', 'payments'],
          risk_level: 'LOW_RISK',
          suggested_schema: updatedSchema
        };
      }

      // Adição de Ticket Médio
      if (p.includes('ticket') || p.includes('medio') || p.includes('médio')) {
        const metricSec = updatedSchema.sections.find(s => s.components.some(c => c.type === 'metric')) || updatedSchema.sections[0];
        metricSec.components.push({
          id: `comp-${uuidv4().slice(0, 8)}`,
          type: 'metric',
          title: 'Ticket Médio',
          description: 'Valor médio por pedido pago',
          dataSource: 'orders',
          aggregation: 'avg',
          field: 'total_amount',
          format: 'currency'
        });
        componentsAdded.push('Card Ticket Médio');
      }

      // Adição de Gráfico
      if (p.includes('gráfico') || p.includes('grafico')) {
        const chartType = p.includes('pizza') || p.includes('donut') ? 'donut' : (p.includes('barra') ? 'bar' : 'line');
        const chartSec = updatedSchema.sections.find(s => s.components.some(c => c.type === 'chart')) || updatedSchema.sections[1] || updatedSchema.sections[0];
        chartSec.components.push({
          id: `comp-${uuidv4().slice(0, 8)}`,
          type: 'chart',
          title: p.includes('mês') ? 'Faturamento Mensal' : 'Evolução de Vendas',
          chartType,
          dataSource: 'payments',
          groupBy: 'date'
        });
        componentsAdded.push(`Gráfico (${chartType})`);
      }

      return {
        action: 'patch_module',
        target_module: { id: existingModule.id, name: existingModule.name, slug: existingModule.slug },
        summary: `Atualizar módulo ${existingModule.name} com novas métricas/gráficos`,
        components_summary: componentsAdded.length > 0 ? componentsAdded : ['Atualização do layout'],
        data_sources: ['orders', 'payments'],
        risk_level: 'LOW_RISK',
        suggested_schema: updatedSchema
      };
    }

    // 2. CRIAÇÃO: MÓDULO FINANCEIRO
    if (p.includes('financ') || p.includes('faturament') || p.includes('lucro') || p.includes('despesa')) {
      const schema: UISchema = {
        title: 'Gestão Financeira',
        description: 'Acompanhamento consolidado de faturamento, despesas operacionais, lucro e pedidos pagos.',
        icon: 'DollarSign',
        layout: 'dashboard',
        period_filter_enabled: true,
        sections: [
          {
            id: 'sec-metrics',
            title: 'Indicadores Principais',
            columns: 4,
            components: [
              { id: 'm-01', type: 'metric', title: 'Faturamento Total', description: 'Total recebido de pedidos', dataSource: 'payments', aggregation: 'sum', format: 'currency' },
              { id: 'm-02', type: 'metric', title: 'Despesas Operacionais', description: 'Custos lançados da empresa', dataSource: 'expenses', aggregation: 'sum', format: 'currency' },
              { id: 'm-03', type: 'metric', title: 'Lucro Líquido', description: 'Receita líquida deduzida das despesas', dataSource: 'payments', aggregation: 'sum', format: 'currency' },
              { id: 'm-04', type: 'metric', title: 'Pedidos Pagos', description: 'Volume de vendas concluídas', dataSource: 'orders', aggregation: 'count', format: 'number' }
            ]
          },
          {
            id: 'sec-charts',
            title: 'Desempenho Financeiro e Canais',
            columns: 2,
            components: [
              { id: 'ch-01', type: 'chart', title: 'Faturamento x Despesas', description: 'Evolução comparativa por período', chartType: 'line', dataSource: 'payments' },
              { id: 'ch-02', type: 'chart', title: 'Distribuição por Método de Pagamento', description: 'PIX, Cartão e Dinheiro', chartType: 'donut', dataSource: 'payments' }
            ]
          },
          {
            id: 'sec-table',
            title: 'Transações e Pedidos Pagos',
            columns: 1,
            components: [
              {
                id: 'tb-01',
                type: 'table',
                title: 'Extrato de Pedidos Concluídos',
                dataSource: 'orders',
                columns: [
                  { key: 'id', label: 'Cód. Pedido' },
                  { key: 'customer_name', label: 'Cliente' },
                  { key: 'total_amount', label: 'Valor' },
                  { key: 'payment_method', label: 'Método' },
                  { key: 'status', label: 'Status' },
                  { key: 'date', label: 'Data & Hora' }
                ]
              }
            ]
          }
        ]
      };

      return {
        action: 'create_module',
        target_module: { name: 'Gestão Financeira', slug: 'gestao-financeira' },
        summary: 'Criar dashboard financeiro completo com KPIs de lucro, faturamento, despesas, gráficos de evolução e tabela de pedidos pagos.',
        components_summary: ['4 Cards de KPIs Financeiros (Faturamento, Despesas, Lucro, Pedidos)', 'Gráfico de Linha (Receita vs Despesas)', 'Gráfico Donut (Métodos de Pagamento)', 'Tabela de Transações com Busca'],
        data_sources: ['orders', 'payments', 'expenses'],
        risk_level: 'LOW_RISK',
        suggested_schema: schema
      };
    }

    // 3. CRIAÇÃO: MÓDULO DE CLIENTES
    if (p.includes('client') || p.includes('consumidor') || p.includes('lead')) {
      const schema: UISchema = {
        title: 'Gestão de Clientes',
        description: 'Base de clientes cadastrados, histórico de pedidos, contato e total gasto.',
        icon: 'Users',
        layout: 'crud',
        period_filter_enabled: false,
        sections: [
          {
            id: 'sec-client-metrics',
            title: 'Resumo da Carteira',
            columns: 3,
            components: [
              { id: 'cm-01', type: 'metric', title: 'Total de Clientes', description: 'Clientes na base', dataSource: 'customers', aggregation: 'count', format: 'number' },
              { id: 'cm-02', type: 'metric', title: 'Clientes Ativos', description: 'Com pedidos recentes', dataSource: 'customers', aggregation: 'count', format: 'number' },
              { id: 'cm-03', type: 'metric', title: 'Ticket Médio por Cliente', description: 'Gasto médio acumulado', dataSource: 'orders', aggregation: 'avg', format: 'currency' }
            ]
          },
          {
            id: 'sec-client-table',
            title: 'Diretório de Clientes',
            columns: 1,
            components: [
              {
                id: 'ctb-01',
                type: 'table',
                title: 'Clientes Cadastrados',
                dataSource: 'customers',
                columns: [
                  { key: 'name', label: 'Nome do Cliente' },
                  { key: 'phone', label: 'Telefone / WhatsApp' },
                  { key: 'email', label: 'E-mail' },
                  { key: 'total_orders', label: 'Pedidos' },
                  { key: 'total_spent', label: 'Total Gasto' },
                  { key: 'status', label: 'Status' }
                ],
                actions: [{ label: 'Ver Detalhes', action: 'view' }]
              }
            ]
          }
        ]
      };

      return {
        action: 'create_module',
        target_module: { name: 'Clientes', slug: 'clientes' },
        summary: 'Criar área de gestão de clientes com cards de total de clientes ativos, ticket médio e tabela detalhada de contatos com total gasto.',
        components_summary: ['Cards de Contagem de Clientes e Gasto Médio', 'Tabela Completa de Clientes com Busca e Filtros'],
        data_sources: ['customers', 'orders'],
        risk_level: 'LOW_RISK',
        suggested_schema: schema
      };
    }

    // 4. CRIAÇÃO: MÓDULO DE PEDIDOS PAGOS
    const schema: UISchema = {
      title: 'Pedidos Pagos',
      description: 'Painel operacional de pedidos concluídos e faturados.',
      icon: 'Package',
      layout: 'dashboard',
      period_filter_enabled: true,
      sections: [
        {
          id: 'sec-ped-kpi',
          columns: 3,
          components: [
            { id: 'pk-01', type: 'metric', title: 'Pedidos Pagos', dataSource: 'orders', aggregation: 'count', format: 'number' },
            { id: 'pk-02', type: 'metric', title: 'Faturamento Total', dataSource: 'payments', aggregation: 'sum', format: 'currency' },
            { id: 'pk-03', type: 'metric', title: 'Ticket Médio', dataSource: 'orders', aggregation: 'avg', format: 'currency' }
          ]
        },
        {
          id: 'sec-ped-table',
          columns: 1,
          components: [
            {
              id: 'pt-01',
              type: 'table',
              title: 'Relação de Pedidos Faturados',
              dataSource: 'orders',
              columns: [
                { key: 'id', label: 'ID Pedido' },
                { key: 'customer_name', label: 'Cliente' },
                { key: 'total_amount', label: 'Valor' },
                { key: 'payment_method', label: 'Forma Pgto.' },
                { key: 'delivery_address', label: 'Endereço' },
                { key: 'status', label: 'Status' }
              ]
            }
          ]
        }
      ]
    };

    return {
      action: 'create_module',
      target_module: { name: 'Pedidos Pagos', slug: 'pedidos-pagos' },
      summary: 'Criar painel dedicado de pedidos pagos com métricas de faturamento e extrato operacional.',
      components_summary: ['Métricas de Pedidos e Ticket Médio', 'Tabela Operacional com Busca e Filtro de Período'],
      data_sources: ['orders', 'payments'],
      risk_level: 'LOW_RISK',
      suggested_schema: schema
    };
  }

  private extractModuleName(prompt: string): string {
    if (prompt.toLowerCase().includes('financ')) return 'Gestão Financeira';
    if (prompt.toLowerCase().includes('client')) return 'Clientes';
    if (prompt.toLowerCase().includes('pedido')) return 'Pedidos Pagos';
    if (prompt.toLowerCase().includes('venda')) return 'Vendas & Desempenho';
    return 'Novo Módulo';
  }

  private slugify(text: string): string {
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }
}

export const aiBuilderService = new AIBuilderService();
