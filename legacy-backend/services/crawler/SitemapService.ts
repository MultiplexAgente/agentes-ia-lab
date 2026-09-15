import * as cheerio from 'cheerio';

export interface DiscoveredUrl {
  url: string;
  type: 'catalog' | 'product' | 'service' | 'property' | 'menu' | 'general';
  lastmod?: string;
}

export class SitemapService {
  /**
   * Attempts to discover sitemap from robots.txt or standard paths
   */
  static async discoverUrls(baseUrl: string): Promise<DiscoveredUrl[]> {
    const urls: Map<string, DiscoveredUrl> = new Map();
    const cleanBase = baseUrl.replace(/\/+$/, '');
    
    // 1. Try robots.txt
    try {
      const robotsRes = await fetch(`${cleanBase}/robots.txt`, {
        headers: { 'User-Agent': 'MultiplexAI-Bot/2.0 (+https://multiplex.ia)' },
        signal: AbortSignal.timeout(6000)
      });
      if (robotsRes.ok) {
        const text = await robotsRes.text();
        const sitemapMatches = text.match(/Sitemap:\s*(https?:\/\/[^\s]+)/gi);
        if (sitemapMatches) {
          for (const match of sitemapMatches) {
            const smUrl = match.replace(/Sitemap:\s*/i, '').trim();
            const extracted = await this.parseSitemap(smUrl, cleanBase);
            extracted.forEach(u => urls.set(u.url, u));
          }
        }
      }
    } catch {
      // Continue to standard fallbacks
    }

    // 2. If no URLs found, try /sitemap.xml and /sitemap_index.xml
    if (urls.size === 0) {
      const candidates = [
        `${cleanBase}/sitemap.xml`,
        `${cleanBase}/sitemap_index.xml`,
        `${cleanBase}/sitemap-products.xml`
      ];

      for (const smUrl of candidates) {
        try {
          const extracted = await this.parseSitemap(smUrl, cleanBase);
          extracted.forEach(u => urls.set(u.url, u));
          if (urls.size > 0) break;
        } catch {
          // try next
        }
      }
    }

    // 3. If sitemaps not found or empty, crawl home page to extract navigation links
    if (urls.size === 0) {
      try {
        const homeRes = await fetch(cleanBase, {
          headers: { 'User-Agent': 'MultiplexAI-Bot/2.0 (+https://multiplex.ia)' },
          signal: AbortSignal.timeout(8000)
        });
        if (homeRes.ok) {
          const html = await homeRes.text();
          const $ = cheerio.load(html);
          
          urls.set(cleanBase, { url: cleanBase, type: 'general' });

          $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (!href) return;
            
            try {
              const fullUrl = new URL(href, cleanBase).href;
              // Only keep internal links
              if (fullUrl.startsWith(cleanBase) && !fullUrl.includes('#') && !fullUrl.match(/\.(jpg|jpeg|png|gif|pdf|svg|css|js)$/i)) {
                const lower = fullUrl.toLowerCase();
                let type: DiscoveredUrl['type'] = 'general';
                if (lower.includes('produto') || lower.includes('product') || lower.includes('item') || lower.includes('shop') || lower.includes('loja')) {
                  type = 'product';
                } else if (lower.includes('cardapio') || lower.includes('menu') || lower.includes('prato')) {
                  type = 'menu';
                } else if (lower.includes('imovel') || lower.includes('imoveis') || lower.includes('property') || lower.includes('alugar') || lower.includes('comprar')) {
                  type = 'property';
                } else if (lower.includes('servico') || lower.includes('service') || lower.includes('tratamento')) {
                  type = 'service';
                } else if (lower.includes('catalogo') || lower.includes('catalog') || lower.includes('categoria') || lower.includes('category')) {
                  type = 'catalog';
                }
                
                urls.set(fullUrl, { url: fullUrl, type });
              }
            } catch {
              // Ignore invalid URLs
            }
          });
        }
      } catch {
        // Fallback: at least return the base url
        urls.set(cleanBase, { url: cleanBase, type: 'general' });
      }
    }

    // Return capped list (up to 50 URLs to avoid abuse in demo/lab)
    return Array.from(urls.values()).slice(0, 50);
  }

  private static async parseSitemap(sitemapUrl: string, cleanBase: string): Promise<DiscoveredUrl[]> {
    const list: DiscoveredUrl[] = [];
    try {
      const res = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'MultiplexAI-Bot/2.0 (+https://multiplex.ia)' },
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) return list;

      const xml = await res.text();
      const $ = cheerio.load(xml, { xmlMode: true });

      // Handle sitemap index
      const sitemaps = $('sitemap > loc');
      if (sitemaps.length > 0) {
        for (let i = 0; i < Math.min(sitemaps.length, 5); i++) {
          const subUrl = $(sitemaps[i]).text().trim();
          if (subUrl) {
            const subItems = await this.parseSitemap(subUrl, cleanBase);
            list.push(...subItems);
          }
        }
        return list;
      }

      // Standard sitemap urlset
      $('url').each((_, el) => {
        const loc = $(el).find('loc').text().trim();
        const lastmod = $(el).find('lastmod').text().trim() || undefined;
        if (!loc) return;

        const lower = loc.toLowerCase();
        let type: DiscoveredUrl['type'] = 'general';
        if (lower.includes('produto') || lower.includes('product') || lower.includes('/p/')) {
          type = 'product';
        } else if (lower.includes('cardapio') || lower.includes('menu') || lower.includes('prato')) {
          type = 'menu';
        } else if (lower.includes('imovel') || lower.includes('imoveis') || lower.includes('apartamento') || lower.includes('casa')) {
          type = 'property';
        } else if (lower.includes('servico') || lower.includes('service')) {
          type = 'service';
        } else if (lower.includes('catalogo') || lower.includes('categoria') || lower.includes('category')) {
          type = 'catalog';
        }

        list.push({ url: loc, type, lastmod });
      });
    } catch {
      // Ignored
    }
    return list;
  }
}
