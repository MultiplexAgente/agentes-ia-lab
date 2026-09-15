import { Router, Request, Response } from 'express';
import { store } from '../config/database.js';
import { CatalogSearchService } from '../services/catalog/CatalogSearchService.js';
import { SearchSessionService } from '../services/catalog/SearchSessionService.js';
import { CatalogFormatter } from '../services/catalog/CatalogFormatter.js';
import { CatalogConsultantSettings, CatalogClickLog } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export const catalogRouter = Router();
const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

/**
 * GET /api/catalog/search - Busca no catálogo com filtros, ranqueamento e alternativas inteligentes
 */
catalogRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const companyId = (req.query.company_id as string) || (req.query.companyId as string) || DEFAULT_COMPANY_ID;
    const query = req.query.query as string | undefined;
    const category = req.query.category as string | undefined;
    const entity_type = req.query.entity_type as string | undefined;
    const brand = req.query.brand as string | undefined;
    const weight = req.query.weight as string | undefined;
    const city = req.query.city as string | undefined;
    const neighborhood = req.query.neighborhood as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const sortMode = req.query.sort as 'relevance' | 'price_asc' | 'price_desc' | 'newest' | undefined;

    const price_min = req.query.price_min ? parseFloat(req.query.price_min as string) : undefined;
    const price_max = req.query.price_max ? parseFloat(req.query.price_max as string) : undefined;
    const bedrooms = req.query.bedrooms ? parseInt(req.query.bedrooms as string, 10) : undefined;

    const filters = {
      query,
      category,
      entity_type,
      brand,
      weight,
      city,
      neighborhood,
      price_min,
      price_max,
      bedrooms
    };

    const searchRes = await CatalogSearchService.searchCatalog(companyId, filters, {
      limit,
      sortMode
    });

    const settings = store.catalogSettings.get(companyId);
    const formattedText = CatalogFormatter.formatTextResponse(searchRes.items, settings, searchRes.alternative_message);
    const cards = CatalogFormatter.formatStructuredCards(searchRes.items, settings);

    return res.json({
      success: true,
      count: searchRes.items.length,
      total_found: searchRes.total_found,
      is_alternative: searchRes.is_alternative,
      alternative_message: searchRes.alternative_message,
      items: searchRes.items,
      cards,
      formatted_text: formattedText
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao realizar busca no catálogo.' });
  }
});

/**
 * GET /api/catalog/settings - Recupera as configurações do Consultor Inteligente da empresa
 */
catalogRouter.get('/settings', (req: Request, res: Response) => {
  const companyId = (req.query.company_id as string) || (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  let settings = store.catalogSettings.get(companyId);

  if (!settings) {
    settings = {
      company_id: companyId,
      max_results: 3,
      send_images: true,
      send_prices: true,
      send_descriptions: true,
      send_links: true,
      show_stock: true,
      ask_before_search: true,
      presentation_style: 'cards',
      default_sort: 'relevance'
    };
    store.catalogSettings.set(companyId, settings);
  }

  return res.json({ success: true, settings });
});

/**
 * PUT /api/catalog/settings - Atualiza as configurações de busca do empresário
 */
catalogRouter.put('/settings', (req: Request, res: Response) => {
  const companyId = req.body.company_id || req.body.companyId || DEFAULT_COMPANY_ID;
  const existing = store.catalogSettings.get(companyId) || {
    company_id: companyId,
    max_results: 3,
    send_images: true,
    send_prices: true,
    send_descriptions: true,
    send_links: true,
    show_stock: true,
    ask_before_search: true,
    presentation_style: 'cards',
    default_sort: 'relevance'
  };

  const updated: CatalogConsultantSettings = {
    ...existing,
    ...req.body,
    company_id: companyId,
    max_results: req.body.max_results !== undefined ? Number(req.body.max_results) : existing.max_results,
    updated_at: new Date().toISOString()
  };

  store.catalogSettings.set(companyId, updated);
  return res.json({ success: true, settings: updated });
});

/**
 * POST /api/catalog/click - Rastreamento de cliques em links de produtos/imóveis recomendados pela IA
 */
catalogRouter.post('/click', (req: Request, res: Response) => {
  const { company_id, conversation_id, customer_id, catalog_item_id, source_url, item_name } = req.body;

  const targetCompanyId = company_id || DEFAULT_COMPANY_ID;
  if (!catalog_item_id || !source_url) {
    return res.status(400).json({ error: 'catalog_item_id e source_url são obrigatórios.' });
  }

  const clickLog: CatalogClickLog = {
    id: uuidv4(),
    company_id: targetCompanyId,
    conversation_id: conversation_id || 'unknown',
    customer_id,
    catalog_item_id,
    item_name,
    source_url,
    clicked_at: new Date().toISOString()
  };

  store.catalogClicks.push(clickLog);

  return res.json({
    success: true,
    message: 'Clique registrado com sucesso.',
    click: clickLog
  });
});

/**
 * GET /api/catalog/analytics - Métricas de buscas, cliques e conversão do catálogo
 */
catalogRouter.get('/analytics', (req: Request, res: Response) => {
  const companyId = (req.query.company_id as string) || (req.query.companyId as string) || DEFAULT_COMPANY_ID;

  const searches = store.catalogSearches.filter(s => s.company_id === companyId);
  const clicks = store.catalogClicks.filter(c => c.company_id === companyId);

  const totalSearches = searches.length;
  const totalClicks = clicks.length;
  const ctr = totalSearches > 0 ? Number(((totalClicks / totalSearches) * 100).toFixed(1)) : 0;

  // Top categorias pesquisadas
  const categoryCounts = new Map<string, number>();
  for (const s of searches) {
    const cat = s.category || (s.filters?.entity_type ? String(s.filters.entity_type) : 'Geral');
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  }
  const topCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top itens mais clicados
  const itemCounts = new Map<string, { item_id: string; item_name: string; clicks: number; url: string }>();
  for (const c of clicks) {
    const existing = itemCounts.get(c.catalog_item_id) || {
      item_id: c.catalog_item_id,
      item_name: c.item_name || 'Item do Catálogo',
      clicks: 0,
      url: c.source_url
    };
    existing.clicks += 1;
    itemCounts.set(c.catalog_item_id, existing);
  }
  const topClickedItems = Array.from(itemCounts.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  return res.json({
    success: true,
    analytics: {
      total_searches: totalSearches,
      total_clicks: totalClicks,
      click_through_rate: ctr,
      top_categories: topCategories,
      top_clicked_items: topClickedItems,
      recent_searches: searches.slice(-10).reverse()
    }
  });
});

/**
 * GET /api/catalog/session/:convId - Recupera a sessão ativa de busca de uma conversa
 */
catalogRouter.get('/session/:convId', (req: Request, res: Response) => {
  const convId = String(req.params.convId);
  const session = store.searchSessions.get(convId);
  return res.json({ success: true, session: session || null });
});
