// =========================================================================
// CATALOG PROVIDER — Abstração Universal de Fonte de Dados do Catálogo
// Permite que o CatalogSearchService não dependa de uma única origem.
//
// Providers disponíveis:
//   InMemoryCatalogProvider  → usa store local (Map) — sempre disponível
//   SupabaseCatalogProvider  → busca do banco (Supabase) — quando configurado
//   CompositeCatalogProvider → Supabase + InMemory merged, deduplicated
// =========================================================================

import { supabase, store } from '../../config/database.js';
import { CatalogItemResult, NormalizedCatalogItem, Product } from '../../types/index.js';

// ---------------------------------------------------------------------------
// Interface base
// ---------------------------------------------------------------------------
export interface CatalogProvider {
  getItems(companyId: string): Promise<CatalogItemResult[]>;
  getItemById(companyId: string, id: string): Promise<CatalogItemResult | null>;
}

// ---------------------------------------------------------------------------
// Helpers de normalização (extraídos do CatalogSearchService para reuso)
// ---------------------------------------------------------------------------
function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(price) || price <= 0) return 'Sob consulta';
  return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function inferEntityType(item: NormalizedCatalogItem): string {
  if (item.item_type && item.item_type !== 'other') return item.item_type;
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  const biz = (item.attributes?.businessType || '').toUpperCase();

  if (biz === 'IMOBILIÁRIA' || cat.includes('imóv') || cat.includes('apart') || cat.includes('casa') || cat.includes('terreno')) return 'property';
  if (biz === 'CONCESSIONÁRIA' || cat.includes('veículo') || cat.includes('carro') || cat.includes('moto') || cat.includes('caminhão')) return 'vehicle';
  if (biz === 'HOTEL' || cat.includes('hotel') || cat.includes('pousada') || cat.includes('hostel')) return 'hotel';
  if (biz === 'RESTAURANTE' || cat.includes('cardáp') || cat.includes('prato') || cat.includes('pizza') || cat.includes('burger')) return 'restaurant';
  if (cat.includes('servi') || cat.includes('consult') || cat.includes('manut') || cat.includes('instalaç')) return 'service';
  if (cat.includes('curso') || cat.includes('treinam') || cat.includes('capacit') || cat.includes('certific')) return 'course';
  if (cat.includes('vaga') || cat.includes('emprego') || cat.includes('carreira') || cat.includes('trabalho')) return 'job';
  if (cat.includes('event') || cat.includes('ingresso') || cat.includes('show') || cat.includes('confer')) return 'event';
  if (cat.includes('agro') || cat.includes('rural') || cat.includes('fazenda') || cat.includes('cultiv') || cat.includes('soja') || cat.includes('milho')) return 'agro';
  return 'product';
}

function normalizedItemToResult(item: NormalizedCatalogItem): CatalogItemResult {
  const images = item.images && item.images.length > 0 ? item.images : [];
  const price = typeof item.price === 'number' ? item.price : null;
  const entityType = inferEntityType(item);
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
    formatted_price: formatPrice(price),
    currency: item.currency || 'BRL',
    images,
    main_image: images[0] || undefined,
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

function productToResult(prod: Product): CatalogItemResult {
  const images = prod.image_url ? [prod.image_url] : [];
  const cat = (prod.category || '').toLowerCase();
  let entityType = 'product';
  if (cat.includes('imóv') || cat.includes('casa') || cat.includes('apart')) entityType = 'property';
  else if (cat.includes('servi')) entityType = 'service';
  else if (prod.ingredients && prod.ingredients.length > 0) entityType = 'restaurant';

  return {
    id: prod.id,
    company_id: prod.company_id,
    name: prod.name,
    category: prod.category || 'Geral',
    entity_type: entityType,
    description: prod.description,
    price: prod.price,
    formatted_price: formatPrice(prod.price),
    currency: 'BRL',
    images,
    main_image: images[0] || undefined,
    availability: prod.available !== false && (prod.stock === undefined || prod.stock > 0),
    stock: prod.stock,
    attributes: { ingredients: prod.ingredients, variations: prod.variations },
    source_type: 'product_catalog',
  };
}

// ---------------------------------------------------------------------------
// 1. InMemoryCatalogProvider — Store local (Map) — sempre disponível
// ---------------------------------------------------------------------------
export class InMemoryCatalogProvider implements CatalogProvider {
  async getItems(companyId: string): Promise<CatalogItemResult[]> {
    const results: CatalogItemResult[] = [];
    const seen = new Set<string>();

    // catalogItems (site sincronizado)
    for (const item of store.catalogItems.values()) {
      if (item.company_id === companyId) {
        results.push(normalizedItemToResult(item));
        seen.add(item.name.toLowerCase());
      }
    }

    // products (cadastro manual), evita duplicação
    const prods = store.products.get(companyId) || [];
    for (const prod of prods) {
      if (!seen.has(prod.name.toLowerCase())) {
        results.push(productToResult(prod));
      }
    }

    return results;
  }

  async getItemById(companyId: string, id: string): Promise<CatalogItemResult | null> {
    const synced = store.catalogItems.get(id);
    if (synced && synced.company_id === companyId) return normalizedItemToResult(synced);
    const prods = store.products.get(companyId) || [];
    const prod = prods.find(p => p.id === id);
    return prod ? productToResult(prod) : null;
  }
}

// ---------------------------------------------------------------------------
// 2. SupabaseCatalogProvider — Busca direto do banco Supabase
// ---------------------------------------------------------------------------
export class SupabaseCatalogProvider implements CatalogProvider {
  async getItems(companyId: string): Promise<CatalogItemResult[]> {
    if (!supabase) return [];
    try {
      // Busca da tabela normalized_catalog_items (criada no schema inicial)
      const { data: catalogData } = await supabase
        .from('normalized_catalog_items')
        .select('*')
        .eq('company_id', companyId)
        .in('status', ['AVAILABLE', 'OUT_OF_STOCK'])
        .order('updated_at', { ascending: false })
        .limit(500);

      const results: CatalogItemResult[] = [];
      const seen = new Set<string>();

      if (catalogData) {
        for (const item of catalogData as NormalizedCatalogItem[]) {
          results.push(normalizedItemToResult(item));
          seen.add(item.name.toLowerCase());
        }
      }

      // Complementa com products do Supabase
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .eq('available', true);

      if (productsData) {
        for (const prod of productsData as Product[]) {
          if (!seen.has(prod.name.toLowerCase())) {
            results.push(productToResult(prod));
          }
        }
      }

      return results;
    } catch {
      return []; // Deixa o composite fazer fallback
    }
  }

  async getItemById(companyId: string, id: string): Promise<CatalogItemResult | null> {
    if (!supabase) return null;
    try {
      // Tenta em normalized_catalog_items
      const { data: catalogItem } = await supabase
        .from('normalized_catalog_items')
        .select('*')
        .eq('company_id', companyId)
        .eq('id', id)
        .single();
      if (catalogItem) return normalizedItemToResult(catalogItem as NormalizedCatalogItem);

      // Tenta em products
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('company_id', companyId)
        .eq('id', id)
        .single();
      if (product) return productToResult(product as Product);
    } catch {
      // Fallback
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3. CompositeCatalogProvider — Supabase + InMemory merged (recomendado)
//    Supabase-first: se retornar items, usa-os; caso contrário usa InMemory
// ---------------------------------------------------------------------------
export class CompositeCatalogProvider implements CatalogProvider {
  private supabaseProvider = new SupabaseCatalogProvider();
  private inMemoryProvider = new InMemoryCatalogProvider();

  async getItems(companyId: string): Promise<CatalogItemResult[]> {
    const fromSupabase = await this.supabaseProvider.getItems(companyId);

    if (fromSupabase.length > 0) {
      // Supabase tem dados — mas também merges itens do store que não estão no banco
      const inMemory = await this.inMemoryProvider.getItems(companyId);
      const supabaseIds = new Set(fromSupabase.map(i => i.id));
      const onlyInMemory = inMemory.filter(i => !supabaseIds.has(i.id));
      return [...fromSupabase, ...onlyInMemory];
    }

    // Fallback total para InMemory
    return this.inMemoryProvider.getItems(companyId);
  }

  async getItemById(companyId: string, id: string): Promise<CatalogItemResult | null> {
    const fromSupabase = await this.supabaseProvider.getItemById(companyId, id);
    if (fromSupabase) return fromSupabase;
    return this.inMemoryProvider.getItemById(companyId, id);
  }
}

// Instância singleton padrão para uso geral
export const defaultCatalogProvider = new CompositeCatalogProvider();
