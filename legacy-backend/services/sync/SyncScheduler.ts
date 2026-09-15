import { db } from '../../config/database.js';
import { KnowledgeSource, SyncFrequency } from '../../types/index.js';

export class SyncScheduler {
  /**
   * Calculates the next execution timestamp based on frequency.
   */
  static getNextSyncDate(frequency: SyncFrequency, fromDate: Date = new Date()): Date {
    const next = new Date(fromDate);
    switch (frequency) {
      case '1h':
        next.setHours(next.getHours() + 1);
        break;
      case '6h':
        next.setHours(next.getHours() + 6);
        break;
      case '12h':
        next.setHours(next.getHours() + 12);
        break;
      case '24h':
        next.setDate(next.getDate() + 1);
        break;
      case 'semanal':
        next.setDate(next.getDate() + 7);
        break;
      default:
        next.setDate(next.getDate() + 1);
    }
    return next;
  }

  /**
   * Returns all active sources that have auto_sync enabled and are due for synchronization.
   */
  static getSourcesDueForSync(): KnowledgeSource[] {
    const now = new Date();
    const sources = Array.from(db.sources.values());

    return sources.filter(s => {
      if (!s.auto_sync || s.status === 'ERROR') return false;
      if (!s.last_synced_at) return true;

      const last = new Date(s.last_synced_at);
      const next = this.getNextSyncDate(s.sync_frequency, last);
      return now >= next;
    });
  }
}
