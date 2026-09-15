import * as cheerio from 'cheerio';

export interface RawExtractedItem {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  status?: string;
  images?: string[];
  sku?: string;
  attributes?: Record<string, any>;
  sourceUrl: string;
}

export class StructuredDataParser {
  /**
   * Parses an HTML document and extracts structured catalog items.
   */
  static parse(html: string, sourceUrl: string): RawExtractedItem[] {
    const $ = cheerio.load(html);
    const items: RawExtractedItem[] = [];

    // 1. Check for JSON-LD scripts (Schema.org)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const rawJson = $(el).contents().text().trim();
        if (!rawJson) return;
        const parsed = JSON.parse(rawJson);
        const extracted = this.extractFromJsonLd(parsed, sourceUrl);
        items.push(...extracted);
      } catch {
        // Continue if JSON is malformed
      }
    });

    // 2. If no JSON-LD found, parse Microdata / OpenGraph / Semantic HTML
    if (items.length === 0) {
      const fallbackItem = this.extractFromHtmlFallback($, sourceUrl);
      if (fallbackItem) {
        items.push(fallbackItem);
      }
    }

    return items;
  }

  private static extractFromJsonLd(data: any, sourceUrl: string): RawExtractedItem[] {
    const results: RawExtractedItem[] = [];

    const handleNode = (node: any) => {
      if (!node || typeof node !== 'object') return;

      if (Array.isArray(node)) {
        node.forEach(handleNode);
        return;
      }

      if (node['@graph'] && Array.isArray(node['@graph'])) {
        node['@graph'].forEach(handleNode);
        return;
      }

      const rawType = node['@type'];
      const type = Array.isArray(rawType) ? rawType[0] : rawType;

      if (!type) return;

      const typeUpper = String(type).toUpperCase();
      const isProduct = typeUpper.includes('PRODUCT');
      const isMenuItem = typeUpper.includes('MENUITEM');
      const isService = typeUpper.includes('SERVICE');
      const isRealEstate = typeUpper.includes('REALESTATE') || typeUpper.includes('ACCOMMODATION') || typeUpper.includes('HOUSE') || typeUpper.includes('APARTMENT');
      const isVehicle = typeUpper.includes('VEHICLE') || typeUpper.includes('CAR');

      if (isProduct || isMenuItem || isService || isRealEstate || isVehicle) {
        let price: number | undefined;
        let currency = 'BRL';

        // Extract price from offers
        if (node.offers) {
          const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
          if (offer && offer.price !== undefined) {
            price = parseFloat(String(offer.price).replace(',', '.'));
            if (offer.priceCurrency) currency = offer.priceCurrency;
          }
        } else if (node.price !== undefined) {
          price = parseFloat(String(node.price).replace(',', '.'));
        }

        // Extract images
        let images: string[] = [];
        if (node.image) {
          if (Array.isArray(node.image)) {
            images = node.image.map((img: any) => (typeof img === 'string' ? img : img.url || ''));
          } else if (typeof node.image === 'object' && node.image.url) {
            images = [node.image.url];
          } else if (typeof node.image === 'string') {
            images = [node.image];
          }
        }

        const name = node.name || node.headline || node.title;
        if (name && typeof name === 'string' && name.trim().length > 1) {
          results.push({
            name: name.trim(),
            description: node.description ? String(node.description).trim() : undefined,
            price: isNaN(price as number) ? undefined : price,
            currency,
            category: node.category || (isMenuItem ? 'Cardápio' : isRealEstate ? 'Imóveis' : isService ? 'Serviços' : 'Geral'),
            status: node.offers?.availability ? (String(node.offers.availability).includes('InStock') ? 'AVAILABLE' : 'UNAVAILABLE') : 'AVAILABLE',
            images: images.filter(Boolean),
            sku: node.sku || node.identifier || node.productID,
            attributes: {
              schemaType: type,
              brand: node.brand?.name || (typeof node.brand === 'string' ? node.brand : undefined),
              address: node.address ? (typeof node.address === 'string' ? node.address : node.address.streetAddress) : undefined,
              bedrooms: node.numberOfRooms || node.numberOfBedrooms,
              mileage: node.mileageFromOdometer?.value
            },
            sourceUrl: node.url || sourceUrl
          });
        }
      }
    };

    handleNode(data);
    return results;
  }

  private static extractFromHtmlFallback($: cheerio.CheerioAPI, sourceUrl: string): RawExtractedItem | null {
    // Check OpenGraph
    const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
    const ogDesc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogPrice = $('meta[property="product:price:amount"]').attr('content');
    const ogCurrency = $('meta[property="product:price:currency"]').attr('content') || 'BRL';

    // Look for on-page price patterns: R$ 99,90 or $ 99.90
    let price: number | undefined;
    if (ogPrice) {
      price = parseFloat(ogPrice.replace(',', '.'));
    } else {
      const priceRegex = /R\$\s*([\d\.,]+)/i;
      const bodyText = $('body').text();
      const match = bodyText.match(priceRegex);
      if (match && match[1]) {
        const cleanPrice = match[1].replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleanPrice);
        if (!isNaN(num) && num > 0 && num < 10000000) {
          price = num;
        }
      }
    }

    if (!ogTitle || ogTitle.length < 3 || ogTitle.toLowerCase().includes('404') || ogTitle.toLowerCase().includes('not found')) {
      return null;
    }

    const images: string[] = [];
    if (ogImage) images.push(ogImage);

    // If still no image, pick first relevant img
    if (images.length === 0) {
      $('img').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('logo') && !src.includes('icon') && !src.endsWith('.svg') && images.length < 3) {
          try {
            images.push(new URL(src, sourceUrl).href);
          } catch {
            // ignore
          }
        }
      });
    }

    return {
      name: ogTitle.replace(/\s*[-|].*$/, '').trim(), // Remove site name suffix like "- Minha Loja"
      description: ogDesc ? ogDesc.trim() : undefined,
      price: isNaN(price as number) ? undefined : price,
      currency: ogCurrency,
      category: 'Geral',
      status: 'AVAILABLE',
      images,
      attributes: {
        extractedVia: 'meta-tags-heuristic'
      },
      sourceUrl
    };
  }
}
