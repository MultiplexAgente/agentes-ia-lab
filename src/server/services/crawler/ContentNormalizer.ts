import crypto from 'crypto';
import { RawExtractedItem } from './StructuredDataParser';
import { NormalizedCatalogItem, BusinessType } from '../../types/index';

export class ContentNormalizer {
  /**
   * Generates a deterministic SHA-256 hash from the normalized attributes of an item.
   */
  static computeHash(item: Partial<NormalizedCatalogItem>): string {
    const payload = JSON.stringify({
      name: (item.name || '').trim().toLowerCase(),
      description: (item.description || '').trim().toLowerCase(),
      price: item.price !== undefined ? Number(item.price).toFixed(2) : null,
      currency: item.currency || 'BRL',
      status: item.status || 'AVAILABLE',
      category: (item.category || '').trim().toLowerCase(),
      attributes: item.attributes || {}
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Converts a raw extracted item into a standard NormalizedCatalogItem.
   */
  static normalize(
    raw: RawExtractedItem,
    sourceId: string,
    companyId: string,
    businessType: BusinessType
  ): NormalizedCatalogItem {
    const cleanName = raw.name.replace(/\s+/g, ' ').trim();
    const cleanDesc = raw.description ? raw.description.replace(/\s+/g, ' ').trim() : undefined;
    
    // Normalize category according to business segment if not clearly provided
    let category = raw.category || 'Geral';
    if (category === 'Geral') {
      if (businessType === 'RESTAURANTE') category = 'Cardápio';
      else if (businessType === 'IMOBILIÁRIA') category = 'Imóveis';
      else if (businessType === 'CONCESSIONÁRIA') category = 'Veículos';
      else if (businessType === 'HOTEL') category = 'Acomodações';
      else if (businessType === 'SERVIÇOS') category = 'Serviços';
      else if (businessType === 'ECOMMERCE' || businessType === 'LOJA') category = 'Produtos';
    }

    const attributes: Record<string, any> = {
      businessType,
      ...(raw.attributes || {})
    };

    // Calculate initial hash
    const partialItem = {
      name: cleanName,
      description: cleanDesc,
      price: raw.price,
      currency: raw.currency || 'BRL',
      category,
      status: (raw.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE') as 'AVAILABLE' | 'UNAVAILABLE' | 'OUT_OF_STOCK',
      attributes
    };

    const content_hash = this.computeHash(partialItem);

    return {
      id: crypto.randomUUID(),
      source_id: sourceId,
      company_id: companyId,
      name: cleanName,
      description: cleanDesc,
      price: raw.price,
      currency: raw.currency || 'BRL',
      category,
      status: partialItem.status,
      images: raw.images || [],
      sku: raw.sku,
      attributes,
      source_url: raw.sourceUrl,
      content_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}
