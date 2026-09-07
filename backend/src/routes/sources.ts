import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../config/database.js';
import { KnowledgeSource, BusinessType, SyncFrequency } from '../types/index.js';
import { CatalogSyncService } from '../services/sync/CatalogSyncService.js';
import { SyncScheduler } from '../services/sync/SyncScheduler.js';
import { WebsiteSourceService } from '../services/crawler/WebsiteSourceService.js';

const router = Router();
const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

// GET /api/sources - List sources
router.get('/', (req, res) => {
  const companyId = (req.query.company_id as string) || DEFAULT_COMPANY_ID;
  const sources = Array.from(db.sources.values()).filter(s => s.company_id === companyId);
  return res.json({ success: true, sources });
});

// POST /api/sources - Register new source
router.post('/', async (req, res) => {
  try {
    const { url, name, source_type = 'SITE', business_type, auto_sync = true, sync_frequency = '24h' } = req.body;
    const companyId = req.body.company_id || DEFAULT_COMPANY_ID;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL do site é obrigatória.' });
    }

    // Validate URL accessibility
    const validation = await WebsiteSourceService.validateUrl(url);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error || 'URL inacessível ou inválida.' });
    }

    const finalUrl = validation.finalUrl || url;
    const sourceId = crypto.randomUUID();

    const newSource: KnowledgeSource = {
      id: sourceId,
      company_id: companyId,
      name: name || new URL(finalUrl).hostname.replace(/^www\./, ''),
      source_type,
      business_type: business_type || 'EMPRESA_GERAL',
      url: finalUrl,
      status: 'PENDING',
      auto_sync: Boolean(auto_sync),
      sync_frequency: (sync_frequency as SyncFrequency) || '24h',
      items_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.sources.set(sourceId, newSource);

    return res.status(201).json({
      success: true,
      message: 'Fonte de conhecimento cadastrada com sucesso.',
      source: newSource
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao registrar fonte de conhecimento.' });
  }
});

// POST /api/sources/:id/sync - Trigger sync for a source
router.post('/:id/sync', async (req, res) => {
  try {
    const sourceId = req.params.id;
    const companyId = req.body.company_id || DEFAULT_COMPANY_ID;

    const source = db.sources.get(sourceId);
    if (!source) {
      return res.status(404).json({ error: 'Fonte não encontrada.' });
    }

    const result = await CatalogSyncService.syncSource(sourceId, companyId);

    return res.json({
      success: true,
      message: 'Sincronização concluída com sucesso.',
      run: result.run,
      changes_count: result.changes.length,
      total_catalog_items: result.totalCatalogItems
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro durante a sincronização da fonte.' });
  }
});

// GET /api/sources/:id/runs - Get sync runs for source
router.get('/:id/runs', (req, res) => {
  const sourceId = req.params.id;
  const runs = Array.from(db.syncRuns.values())
    .filter(r => r.source_id === sourceId)
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  return res.json({ success: true, runs });
});

// GET /api/sources/runs/:runId/changes - Get changes for a specific run
router.get('/runs/:runId/changes', (req, res) => {
  const runId = req.params.runId;
  const changes = Array.from(db.syncChanges.values()).filter(c => c.run_id === runId);
  return res.json({ success: true, changes });
});

// PUT /api/sources/:id/config - Update configuration
router.put('/:id/config', (req, res) => {
  const sourceId = req.params.id;
  const source = db.sources.get(sourceId);
  if (!source) {
    return res.status(404).json({ error: 'Fonte não encontrada.' });
  }

  const { auto_sync, sync_frequency, business_type, name } = req.body;

  if (auto_sync !== undefined) source.auto_sync = Boolean(auto_sync);
  if (sync_frequency) source.sync_frequency = sync_frequency;
  if (business_type) source.business_type = business_type;
  if (name) source.name = name;
  source.updated_at = new Date().toISOString();

  db.sources.set(sourceId, source);
  return res.json({ success: true, source });
});

// DELETE /api/sources/:id - Delete source and its items
router.delete('/:id', (req, res) => {
  const sourceId = req.params.id;
  const exists = db.sources.has(sourceId);
  if (!exists) {
    return res.status(404).json({ error: 'Fonte não encontrada.' });
  }

  db.sources.delete(sourceId);

  // Remove linked catalog items
  for (const [id, item] of db.catalogItems.entries()) {
    if (item.source_id === sourceId) {
      db.catalogItems.delete(id);
    }
  }

  return res.json({ success: true, message: 'Fonte e itens associados removidos com sucesso.' });
});

// GET /api/sources/catalog - List synchronized catalog items
router.get('/catalog/items', (req, res) => {
  const companyId = (req.query.company_id as string) || DEFAULT_COMPANY_ID;
  const sourceId = req.query.source_id as string;
  const status = req.query.status as string;

  let items = Array.from(db.catalogItems.values()).filter(i => i.company_id === companyId);
  if (sourceId) {
    items = items.filter(i => i.source_id === sourceId);
  }
  if (status) {
    items = items.filter(i => i.status === status);
  }

  return res.json({ success: true, total: items.length, items });
});

// GET /api/sources/sync/due - Endpoint for n8n or external cron
router.get('/sync/due', (req, res) => {
  const dueSources = SyncScheduler.getSourcesDueForSync();
  return res.json({
    success: true,
    count: dueSources.length,
    sources: dueSources
  });
});

export default router;
