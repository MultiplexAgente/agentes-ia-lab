import crypto from 'crypto';
import { db } from '../../config/database';
import {
  KnowledgeSource,
  SourceSyncRun,
  SourceSyncChange,
  NormalizedCatalogItem,
  BusinessType
} from '../../types/index';
import { WebsiteSourceService } from '../crawler/WebsiteSourceService';
import { ContentNormalizer } from '../crawler/ContentNormalizer';

export interface SyncExecutionResult {
  run: SourceSyncRun;
  changes: SourceSyncChange[];
  totalCatalogItems: number;
}

export class CatalogSyncService {
  /**
   * Executes a full or incremental synchronization for a source.
   */
  static async syncSource(
    sourceId: string,
    companyId: string,
    onProgress?: (step: string, percent: number, detail?: string) => void
  ): Promise<SyncExecutionResult> {
    const source = db.sources.get(sourceId);
    if (!source) {
      throw new Error(`Fonte com ID ${sourceId} não encontrada.`);
    }

    const runId = crypto.randomUUID();
    const startTime = new Date().toISOString();

    const currentRun: SourceSyncRun = {
      id: runId,
      source_id: sourceId,
      company_id: companyId,
      status: 'RUNNING',
      items_found: 0,
      items_created: 0,
      items_updated: 0,
      items_removed: 0,
      items_unchanged: 0,
      started_at: startTime
    };
    db.syncRuns.set(runId, currentRun);

    try {
      // 1. Crawl and extract from website
      const crawlResult = await WebsiteSourceService.crawlAndExtract(
        source.url,
        sourceId,
        companyId,
        source.business_type,
        onProgress
      );

      // If business segment was auto-detected and not previously set, persist it
      if (source.business_type !== crawlResult.detectedSegment) {
        source.business_type = crawlResult.detectedSegment;
        source.updated_at = new Date().toISOString();
        db.sources.set(sourceId, source);
      }

      onProgress?.('Comparando itens com catálogo anterior...', 92);

      // 2. Fetch existing items for this source
      const existingItems = Array.from(db.catalogItems.values()).filter(
        item => item.source_id === sourceId && item.company_id === companyId
      );

      // Index existing items by name or SKU
      const existingMapByName = new Map<string, NormalizedCatalogItem>();
      existingItems.forEach(item => {
        existingMapByName.set(item.name.toLowerCase(), item);
      });

      const extractedItems = crawlResult.items;
      const changes: SourceSyncChange[] = [];

      let itemsCreated = 0;
      let itemsUpdated = 0;
      let itemsUnchanged = 0;
      let itemsRemoved = 0;

      const processedExistingIds = new Set<string>();

      // 3. Process extracted items
      for (const extracted of extractedItems) {
        const existing = existingMapByName.get(extracted.name.toLowerCase());

        if (!existing) {
          // CREATED
          itemsCreated++;
          db.catalogItems.set(extracted.id, extracted);

          const change: SourceSyncChange = {
            id: crypto.randomUUID(),
            run_id: runId,
            item_id: extracted.id,
            item_name: extracted.name,
            change_type: 'CREATED',
            new_data: extracted,
            created_at: new Date().toISOString()
          };
          changes.push(change);
          db.syncChanges.set(change.id, change);
        } else {
          processedExistingIds.add(existing.id);

          // Check if hash changed
          const newHash = ContentNormalizer.computeHash(extracted);
          if (existing.content_hash !== newHash) {
            // UPDATED
            itemsUpdated++;

            let specificType: SourceSyncChange['change_type'] = 'UPDATED';
            if (existing.price !== extracted.price) {
              specificType = 'PRICE_CHANGED';
            } else if (existing.status !== extracted.status) {
              specificType = 'AVAILABILITY_CHANGED';
            }

            const updatedItem: NormalizedCatalogItem = {
              ...existing,
              name: extracted.name,
              description: extracted.description,
              price: extracted.price,
              currency: extracted.currency,
              category: extracted.category,
              status: extracted.status,
              images: (extracted.images && extracted.images.length > 0) ? extracted.images : existing.images,
              attributes: { ...existing.attributes, ...extracted.attributes },
              source_url: extracted.source_url,
              content_hash: newHash,
              updated_at: new Date().toISOString()
            };
            db.catalogItems.set(existing.id, updatedItem);

            const change: SourceSyncChange = {
              id: crypto.randomUUID(),
              run_id: runId,
              item_id: existing.id,
              item_name: existing.name,
              change_type: specificType,
              old_data: existing,
              new_data: updatedItem,
              created_at: new Date().toISOString()
            };
            changes.push(change);
            db.syncChanges.set(change.id, change);
          } else {
            // UNCHANGED
            itemsUnchanged++;
          }
        }
      }

      // 4. Check for removed items (items that existed previously but were not found in this crawl)
      for (const existing of existingItems) {
        if (!processedExistingIds.has(existing.id)) {
          // If not already marked as unavailable, mark as UNAVAILABLE (never delete completely)
          if (existing.status !== 'UNAVAILABLE') {
            itemsRemoved++;
            const unavailableItem: NormalizedCatalogItem = {
              ...existing,
              status: 'UNAVAILABLE',
              updated_at: new Date().toISOString()
            };
            db.catalogItems.set(existing.id, unavailableItem);

            const change: SourceSyncChange = {
              id: crypto.randomUUID(),
              run_id: runId,
              item_id: existing.id,
              item_name: existing.name,
              change_type: 'REMOVED',
              old_data: existing,
              new_data: unavailableItem,
              created_at: new Date().toISOString()
            };
            changes.push(change);
            db.syncChanges.set(change.id, change);
          }
        }
      }

      // 5. Finalize run and update source metadata
      const endTime = new Date().toISOString();
      currentRun.status = 'COMPLETED';
      currentRun.items_found = extractedItems.length;
      currentRun.items_created = itemsCreated;
      currentRun.items_updated = itemsUpdated;
      currentRun.items_removed = itemsRemoved;
      currentRun.items_unchanged = itemsUnchanged;
      currentRun.completed_at = endTime;
      db.syncRuns.set(runId, currentRun);

      source.status = 'ACTIVE';
      source.last_synced_at = endTime;
      source.last_sync_status = 'SUCCESS';
      source.items_count = Array.from(db.catalogItems.values()).filter(
        i => i.source_id === sourceId && i.status === 'AVAILABLE'
      ).length;
      source.updated_at = endTime;
      db.sources.set(sourceId, source);

      onProgress?.('Sincronização gravada com sucesso no catálogo da IA!', 100);

      return {
        run: currentRun,
        changes,
        totalCatalogItems: source.items_count
      };
    } catch (err: any) {
      currentRun.status = 'FAILED';
      currentRun.error_message = err.message || 'Erro durante a sincronização.';
      currentRun.completed_at = new Date().toISOString();
      db.syncRuns.set(runId, currentRun);

      source.last_synced_at = currentRun.completed_at;
      source.last_sync_status = 'FAILED';
      source.status = 'ERROR';
      db.sources.set(sourceId, source);

      throw err;
    }
  }
}
