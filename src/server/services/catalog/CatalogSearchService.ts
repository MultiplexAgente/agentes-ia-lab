import { store } from '../../config/database';
import { 
  CatalogItemResult, 
  CatalogSearchFilters, 
  NormalizedCatalogItem, 
  Product,
  CatalogSearchLog
} from '../../types/index';
import { CatalogRankingService } from './CatalogRankingService';
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
   * Normaliza um item do catálogo sincronizado (NormalizedCatalogItem) para o formato unificado CatalogItemResult
   */
  static normalizeCatalogItem(item: NormalizedCatalogItem): CatalogItemResult {
    const images = item.images && item.images.length > 0 ? item.images : [];
    const mainImage = images[0] || undefined;
    const price = typeof item.price === 'number' ? item.price : null;

    let entityType = item.item_type || 'custom';
    const catLower = (item.category || '').toLowerCase();
    const nameLower = (item.name || '').toLowerCase();

    if (item.attributes?.businessType === 'IMOBILIÁRIA' || catLower.includes('imóve') || catLower.includes('apart') || catLower.includes('casa')) {
      entityType = 'property';
    } else if (item.attributes?.businessType === 'CONCESSIONÁRIA' || catLower.includes('veículo') || catLower.includes('carro') || catLower.includes('moto')) {
      entityType = 'vehicle';
    } else if (item.attributes?.businessType === 'SERVIÇOS' || catLower.includes('servi')) {
      entityType = 'service';
    } else if (item.attributes?.businessType === 'RESTAURANTE' || catLower.includes('cardáp') || catLower.includes('pizza') || catLower.includes('hamburg')) {
      entityType = 'restaurant';
    } else if (catLower.includes('suplement') || nameLower.includes('creatina') || nameLower.includes('whey')) {
      entityType = 'product';
    }

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
        label: entityType === 'property' ? 'Ver Imóvel' : entityType === 'service' ? 'Ver Serviço' : 'Ver Produto',
        url: item.source_url
      } : undefined
    };
  }

  /**
   * Normaliza um item cadastrado no cardápio/produtos (Product) para CatalogItemResult
   */
  static normalizeProductItem(prod: Product): CatalogItemResult {
    const images = prod.image_url ? [prod.image_url] : [];
    const catLower = (prod.category || '').toLowerCase();
    const nameLower = prod.name.toLowerCase();

    let entityType: CatalogItemResult['entity_type'] = 'product';
    if (catLower.includes('imóve') || catLower.includes('casa') || catLower.includes('apartamento')) {
      entityType = 'property';
    } else if (catLower.includes('servi')) {
      entityType = 'service';
    } else if (prod.ingredients && prod.ingredients.length > 0) {
      entityType = 'restaurant';
    }

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
      attributes: {
        ingredients: prod.ingredients,
        variations: prod.variations
      },
      source_type: 'product_catalog',
      cta: undefined
    };
  }

  /**
   * Recupera todos os itens da empresa (catalogItems do site + products manuais)
   */
  static getAllCompanyItems(companyId: string): CatalogItemResult[] {
    const unified: CatalogItemResult[] = [];

    // 1. Itens sincronizados do site (NormalizedCatalogItem)
    for (const item of store.catalogItems.values()) {
      if (item.company_id === companyId) {
        unified.push(this.normalizeCatalogItem(item));
      }
    }

    // 2. Produtos manuais do cardápio/catálogo (Product)
    const prods = store.products.get(companyId) || [];
    for (const prod of prods) {
      // Evita duplicação caso já exista no site sincronizado com o mesmo nome
      const exists = unified.some(u => u.name.toLowerCase() === prod.name.toLowerCase());
      if (!exists) {
        unified.push(this.normalizeProductItem(prod));
      }
    }

    return unified;
  }

  /**
   * Executa a busca no catálogo aplicando filtros, ranqueamento e recomendação inteligente
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

    // 1. Recupera todo o acervo da empresa
    const allItems = this.getAllCompanyItems(companyId);

    // 2. Filtragem e pontuação inicial
    let ranked = CatalogRankingService.rankItems(allItems, filters, sortMode);

    let isAlternative = false;
    let alternativeMessage: string | undefined = undefined;

    // 3. Fallback / Recomendação Inteligente quando não encontra resultados exatos
    if (ranked.length === 0 && allItems.length > 0) {
      // Tenta busca relaxada: expande margem de preço em 20% ou relaxa termo específico
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
          alternativeMessage = `Não encontrei opções exatamente até ${this.formatPrice(filters.price_max)}, mas encontrei opções excelentes bem próximas.`;
        } else {
          alternativeMessage = 'Não encontrei resultados com todos os critérios exatos, mas separei estas ótimas alternativas que podem te interessar:';
        }
      }
    }

    // 4. Limita a quantidade de itens conforme configuração do empresário
    const finalItems = ranked.slice(0, maxResults);

    // 5. Registra telemetria de busca (catalog_searches)
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
      created_at: new Date().toISOString()
    };
    store.catalogSearches.push(log);

    return {
      items: finalItems,
      total_found: ranked.length,
      is_alternative: isAlternative,
      alternative_message: alternativeMessage,
      search_id: searchId
    };
  }

  /**
   * Obtém item individual por ID com validação de multi-tenancy
   */
  static getItemById(companyId: string, itemId: string): CatalogItemResult | null {
    // 1. Checa catalogItems
    const synced = store.catalogItems.get(itemId);
    if (synced && synced.company_id === companyId) {
      return this.normalizeCatalogItem(synced);
    }

    // 2. Checa products
    const prods = store.products.get(companyId) || [];
    const prod = prods.find(p => p.id === itemId);
    if (prod) {
      return this.normalizeProductItem(prod);
    }

    return null;
  }
}
