// =========================================================================
// CATALOG SEARCH SERVICE — Motor de Busca Universal do Catálogo
// Supabase-first via CompositeCatalogProvider, com fallback in-memory.
// Suporta todos os segmentos: produto, imóvel, veículo, hotel, curso, vaga,
// restaurante, serviço, evento, agro.
// NUNCA inventa dados.
// =========================================================================

import { store, supabase } from '../../config/database.js';
import {
  CatalogItemResult,
  CatalogSearchFilters,
  NormalizedCatalogItem,
  Product,
  CatalogSearchLog,
  CatalogClickLog,
} from '../../types/index.js';
import { CatalogRankingService } from './CatalogRankingService.js';
import { defaultCatalogProvider } from './CatalogProvider.js';
import { v4 as uuidv4 } from 'uuid';

export interface SearchExecutionResult {
  items: CatalogItemResult[];
  total_found: number;
  is_alternative: boolean;
  alternative_message?: string;
  search_id: string;
}

export class CatalogSearchService {
  /**
   * Formata preços monetários no padrão brasileiro (R$ 129,90 ou R$ 349.000,00)
   */
  static formatPrice(price: number | null | undefined, currency: string = 'BRL'): string {
    if (price === null || price === undefined || isNaN(price) || price <= 0) {
      return 'Sob consulta';
    }
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Normaliza um NormalizedCatalogItem para CatalogItemResult
   * Mantido para compatibilidade com código legado que chama direto
   */
  static normalizeCatalogItem(item: NormalizedCatalogItem): CatalogItemResult {
    const images = item.images && item.images.length > 0 ? item.images : [];
    const mainImage = images[0] || undefined;
    const price = typeof item.price === 'number' ? item.price : null;

    let entityType = item.item_type || 'custom';
    const catLower = (item.category || '').toLowerCase();
    const nameLower = (item.name || '').toLowerCase();
    const biz = (item.attributes?.businessType || '').toUpperCase();

    if (biz === 'IMOBILIÁRIA' || catLower.includes('imóve') || catLower.includes('apart') || catLower.includes('casa')) entityType = 'property';
    else if (biz === 'CONCESSIONÁRIA' || catLower.includes('veículo') || catLower.includes('carro') || catLower.includes('moto')) entityType = 'vehicle';
    else if (biz === 'HOTEL' || catLower.includes('hotel') || catLower.includes('pousada')) entityType = 'hotel';
    else if (biz === 'SERVIÇOS' || catLower.includes('servi')) entityType = 'service';
    else if (biz === 'RESTAURANTE' || catLower.includes('cardáp') || catLower.includes('pizza') || catLower.includes('hamburg')) entityType = 'restaurant';
    else if (catLower.includes('curso') || catLower.includes('treinam') || catLower.includes('certific')) entityType = 'course';
    else if (catLower.includes('vaga') || catLower.includes('emprego') || catLower.includes('trabalho')) entityType = 'job';
    else if (catLower.includes('event') || catLower.includes('ingresso') || catLower.includes('show')) entityType = 'event';
    else if (catLower.includes('agro') || catLower.includes('rural') || catLower.includes('fazenda')) entityType = 'agro';
    else if (catLower.includes('suplement') || nameLower.includes('creatina') || nameLower.includes('whey')) entityType = 'product';

    const ctaLabels: Record<string, string> = {
      property: 'Ver Imóvel', vehicle: 'Ver Veículo', hotel: 'Ver Hotel',
      course: 'Ver Curso', job: 'Ver Vaga', service: 'Ver Serviço',
      restaurant: 'Ver Prato', event: 'Ver Evento', agro: 'Ver Oferta',
    };

    return {
      id: item.id,
      company_id: item.company_id,
      source_id: item.source_id,
      name: item.name,
      brand: item.brand || item.attributes?.brand || item.attributes?.marca,
      category: item.category,
      entity_type: entityType,
      description: item.description,
      price,
      formatted_price: this.formatPrice(price, item.currency),
      currency: item.currency || 'BRL',
      images,
      main_image: mainImage,
      source_url: item.source_url,
      availability: item.status === 'AVAILABLE',
      stock: item.attributes?.stock !== undefined ? Number(item.attributes.stock) : (item.status === 'AVAILABLE' ? 1 : 0),
      attributes: item.attributes || {},
      source_type: 'website_sync',
      cta: item.source_url ? {
        label: ctaLabels[entityType] || 'Ver Detalhes',
        url: item.source_url
      } : undefined
    };
  }

  /**
   * Normaliza Product para CatalogItemResult
   */
  static normalizeProductItem(prod: Product): CatalogItemResult {
    const images = prod.image_url ? [prod.image_url] : [];
    const catLower = (prod.category || '').toLowerCase();

    let entityType: CatalogItemResult['entity_type'] = 'product';
    if (catLower.includes('imóve') || catLower.includes('casa') || catLower.includes('apartamento')) entityType = 'property';
    else if (catLower.includes('servi')) entityType = 'service';
    else if (catLower.includes('curso') || catLower.includes('treinam')) entityType = 'course';
    else if (prod.ingredients && prod.ingredients.length > 0) entityType = 'restaurant';

    return {
      id: prod.id,
      company_id: prod.company_id,
      name: prod.name,
      category: prod.category || 'Geral',
      entity_type: entityType,
      description: prod.description,
      price: prod.price,
      formatted_price: this.formatPrice(prod.price),
      currency: 'BRL',
      images,
      main_image: images[0] || undefined,
      availability: prod.available !== false && (prod.stock === undefined || prod.stock > 0),
      stock: prod.stock,
      attributes: { ingredients: prod.ingredients, variations: prod.variations },
      source_type: 'product_catalog',
      cta: undefined
    };
  }

  /**
   * Recupera todos os itens da empresa via CompositeCatalogProvider
   * Supabase-first com fallback in-memory — NUNCA inventa dados
   */
  static async getAllCompanyItemsAsync(companyId: string): Promise<CatalogItemResult[]> {
    return defaultCatalogProvider.getItems(companyId);
  }

  /**
   * Mantido para compatibilidade síncrona com código legado
   */
  static getAllCompanyItems(companyId: string): CatalogItemResult[] {
    const unified: CatalogItemResult[] = [];
    const seen = new Set<string>();

    for (const item of store.catalogItems.values()) {
      if (item.company_id === companyId) {
        unified.push(this.normalizeCatalogItem(item));
        seen.add(item.name.toLowerCase());
      }
    }

    const prods = store.products.get(companyId) || [];
    for (const prod of prods) {
      if (!seen.has(prod.name.toLowerCase())) {
        unified.push(this.normalizeProductItem(prod));
      }
    }

    return unified;
  }

  /**
   * Persiste log de busca no Supabase + store local
   */
  private static async logSearch(log: CatalogSearchLog, entityType?: string): Promise<void> {
    // Store local (sempre)
    store.catalogSearches.push(log);

    // Supabase (quando disponível)
    if (supabase) {
      try {
        await supabase.from('catalog_searches').insert({
          id: log.id,
          company_id: log.company_id,
          conversation_id: log.conversation_id !== 'default-conv' ? log.conversation_id : null,
          customer_id: log.customer_id || null,
          query: log.query || null,
          category: log.category || null,
          entity_type: entityType || null,
          filters: log.filters,
          results_count: log.results_count,
          results_shown_ids: log.results_shown_ids,
        });
      } catch {
        // Silently — log local já salvo
      }
    }
  }

  /**
   * Persiste log de clique no Supabase + store local
   */
  static async logClick(params: {
    companyId: string;
    conversationId?: string;
    customerId?: string;
    itemId: string;
    itemName?: string;
    entityType?: string;
    sourceUrl?: string;
  }): Promise<void> {
    const click: CatalogClickLog = {
      id: uuidv4(),
      company_id: params.companyId,
      conversation_id: params.conversationId || '',
      customer_id: params.customerId,
      catalog_item_id: params.itemId,
      item_name: params.itemName,
      source_url: params.sourceUrl || '',
      clicked_at: new Date().toISOString(),
    };

    store.catalogClicks.push(click);

    if (supabase) {
      try {
        await supabase.from('catalog_clicks').insert({
          id: click.id,
          company_id: params.companyId,
          conversation_id: params.conversationId || null,
          customer_id: params.customerId || null,
          catalog_item_id: params.itemId,
          item_name: params.itemName || null,
          item_entity_type: params.entityType || null,
          source_url: params.sourceUrl || null,
        });
      } catch {
        // Silently
      }
    }
  }

  /**
   * Executa a busca universal no catálogo com Supabase-first
   */
  static async searchCatalog(
    companyId: string,
    filters: CatalogSearchFilters,
    options: {
      limit?: number;
      conversationId?: string;
      customerId?: string;
      sortMode?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
    } = {}
  ): Promise<SearchExecutionResult> {
    const searchId = uuidv4();
    const settings = store.catalogSettings.get(companyId);
    const maxResults = options.limit || settings?.max_results || 3;
    const sortMode = options.sortMode || settings?.default_sort || 'relevance';

    // 1. Recupera todo o acervo — Supabase-first via CompositeCatalogProvider
    const allItems = await this.getAllCompanyItemsAsync(companyId);

    // 2. Filtragem e pontuação inicial
    let ranked = CatalogRankingService.rankItems(allItems, filters, sortMode);

    let isAlternative = false;
    let alternativeMessage: string | undefined = undefined;

    // 3. Fallback / Recomendação Inteligente quando não encontra resultados exatos
    if (ranked.length === 0 && allItems.length > 0) {
      const relaxedFilters: CatalogSearchFilters = {
        ...filters,
        price_min: filters.price_min ? filters.price_min * 0.8 : undefined,
        price_max: filters.price_max ? filters.price_max * 1.25 : undefined,
        bedrooms: filters.bedrooms ? Math.max(1, filters.bedrooms - 1) : undefined
      };

      const fallbackRanked = CatalogRankingService.rankItems(allItems, relaxedFilters, sortMode);

      if (fallbackRanked.length > 0) {
        ranked = fallbackRanked;
        isAlternative = true;
        if (filters.price_max) {
          alternativeMessage = `Não encontrei opções exatamente até ${this.formatPrice(filters.price_max)}, mas encontrei opções próximas que podem te interessar.`;
        } else {
          alternativeMessage = 'Não encontrei resultados com todos os critérios exatos, mas separei estas ótimas alternativas:';
        }
      }
    }

    // 4. Limita a quantidade
    const finalItems = ranked.slice(0, maxResults);

    // 5. Registra telemetria (Supabase + local)
    const log: CatalogSearchLog = {
      id: searchId,
      company_id: companyId,
      conversation_id: options.conversationId || 'default-conv',
      customer_id: options.customerId,
      query: filters.query,
      category: filters.category,
      filters: { ...filters },
      results_count: finalItems.length,
      results_shown_ids: finalItems.map(i => i.id),
      created_at: new Date().toISOString(),
    };
    await this.logSearch(log, filters.entity_type as string);

    return {
      items: finalItems,
      total_found: ranked.length,
      is_alternative: isAlternative,
      alternative_message: alternativeMessage,
      search_id: searchId
    };
  }

  /**
   * Obtém item individual por ID — Supabase-first via CompositeCatalogProvider
   */
  static async getItemByIdAsync(companyId: string, itemId: string): Promise<CatalogItemResult | null> {
    return defaultCatalogProvider.getItemById(companyId, itemId);
  }

  /**
   * Mantido para compatibilidade síncrona
   */
  static getItemById(companyId: string, itemId: string): CatalogItemResult | null {
    const synced = store.catalogItems.get(itemId);
    if (synced && synced.company_id === companyId) return this.normalizeCatalogItem(synced);
    const prods = store.products.get(companyId) || [];
    const prod = prods.find(p => p.id === itemId);
    if (prod) return this.normalizeProductItem(prod);
    return null;
  }
}
