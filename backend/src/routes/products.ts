import { Router, Request, Response } from 'express';
import { store } from '../config/database.js';
import { Product, ProductCategory } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const productsRouter = Router();
const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

// Listar produtos
productsRouter.get('/', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  const products = store.products.get(companyId) || [];
  return res.json(products);
});

// Criar produto
productsRouter.post('/', (req: Request, res: Response) => {
  const companyId = (req.body.companyId as string) || DEFAULT_COMPANY_ID;
  const { name, description, price, category_id, ingredients, variations } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });
  }

  const newProduct: Product = {
    id: uuidv4(),
    company_id: companyId,
    category_id,
    name,
    description: description || '',
    price: Number(price),
    available: true,
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    variations: variations || []
  };

  const products = store.products.get(companyId) || [];
  products.push(newProduct);
  store.products.set(companyId, products);

  return res.status(201).json(newProduct);
});

// Atualizar produto
productsRouter.put('/:id', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  const { id } = req.params;
  const products = store.products.get(companyId) || [];
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  products[index] = {
    ...products[index],
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : products[index].price
  };

  store.products.set(companyId, products);
  return res.json(products[index]);
});

// Excluir produto
productsRouter.delete('/:id', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  const { id } = req.params;
  let products = store.products.get(companyId) || [];
  products = products.filter(p => p.id !== id);
  store.products.set(companyId, products);
  return res.json({ success: true });
});

// Listar categorias
productsRouter.get('/categories', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  const categories = store.categories.get(companyId) || [];
  return res.json(categories);
});

// Criar categoria
productsRouter.post('/categories', (req: Request, res: Response) => {
  const companyId = (req.body.companyId as string) || DEFAULT_COMPANY_ID;
  const { name, slug, description, sort_order } = req.body;

  if (!name) return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });

  const category: ProductCategory = {
    id: uuidv4(),
    company_id: companyId,
    name,
    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
    description,
    sort_order: sort_order || 1
  };

  const categories = store.categories.get(companyId) || [];
  categories.push(category);
  store.categories.set(companyId, categories);

  return res.status(201).json(category);
});

// Extrair múltiplos produtos a partir de texto colado com Multiplex (GPT-4o)
productsRouter.post('/parse-ai', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Texto não fornecido para extração.' });
  }

  try {
    let extractedProducts: any[] = [];

    if (process.env.OPENAI_API_KEY) {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `Você é o extrator inteligente do Multiplex.
O usuário copiou e colou uma lista, cardápio ou trecho de site de produtos com nomes, valores e descrições.
Sua tarefa é analisar o texto, identificar cada produto individual e extrair:
- name: Nome claro do produto (string)
- price: Valor em reais em formato numérico float (ex: 29.90 ou 45.00). Converta R$ ou vírgulas para float. Se não houver valor, coloque 0.
- description: Descrição, ingredientes ou detalhes (string).
- category: Categoria sugerida (ex: Lanches, Hambúrgueres, Pizzas, Bebidas, Porções, Sobremesas, Geral).
- ingredients: Array de ingredientes identificados (se houver).

Texto bruto recebido:
"""
${text}
"""

Retorne EXCLUSIVAMENTE um objeto JSON no formato exato:
{
  "products": [
    {
      "name": "Nome do Produto",
      "price": 29.90,
      "description": "Ingredientes e detalhes",
      "category": "Lanches",
      "ingredients": ["Ingrediente 1", "Ingrediente 2"]
    }
  ]
}
PROIBIDO usar emojis.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: 'Você é um extrator de catálogos e produtos em JSON estrito. Responda apenas com JSON válido. PROIBIDO usar emojis.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      const rawContent = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed.products)) {
        extractedProducts = parsed.products;
      }
    }

    // Fallback inteligente caso a IA não retorne ou falhe
    if (extractedProducts.length === 0) {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        const priceMatch = line.match(/(?:r\$|\$)\s*(\d+[.,]?\d*)/i) || line.match(/(\d+[.,]\d{2})/);
        if (priceMatch) {
          const rawPrice = priceMatch[1].replace(',', '.');
          const price = parseFloat(rawPrice);
          const parts = line.split(/(?:r\$|\$|\-|\:)/i).map(p => p.trim()).filter(Boolean);
          const name = parts[0] || 'Produto';
          const description = parts.slice(1).join(' - ').replace(priceMatch[0], '').trim();
          extractedProducts.push({
            name,
            price: isNaN(price) ? 0 : price,
            description: description || 'Extraído do texto',
            category: 'Geral',
            ingredients: []
          });
        }
      }
    }

    return res.json({
      success: true,
      count: extractedProducts.length,
      products: extractedProducts
    });
  } catch (error: any) {
    console.error('Erro na extração de produtos:', error);
    return res.status(500).json({ error: error.message || 'Falha ao processar produtos com IA.' });
  }
});

// Inserir múltiplos produtos em lote (Bulk Insert)
productsRouter.post('/batch', (req: Request, res: Response) => {
  const companyId = (req.body.companyId as string) || DEFAULT_COMPANY_ID;
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Nenhum produto fornecido para inserção em lote.' });
  }

  const currentProducts = store.products.get(companyId) || [];
  const inserted: Product[] = [];

  for (const p of products) {
    if (!p.name || typeof p.name !== 'string') continue;
    const newProd: Product = {
      id: uuidv4(),
      company_id: companyId,
      category_id: p.category_id,
      name: p.name.trim(),
      description: p.description || '',
      price: Number(p.price) || 0,
      available: true,
      ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
      variations: Array.isArray(p.variations) ? p.variations : []
    };
    currentProducts.push(newProd);
    inserted.push(newProd);
  }

  store.products.set(companyId, currentProducts);

  return res.status(201).json({
    success: true,
    message: `${inserted.length} produtos adicionados com sucesso ao catálogo.`,
    count: inserted.length,
    products: inserted
  });
});

// Extrair produtos, imóveis e catálogo completo direto de um site/link com Multiplex
productsRouter.post('/scrape-website', async (req: Request, res: Response) => {
  let { url, companyId, autoSave } = req.body;
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return res.status(400).json({ error: 'URL do site não informada.' });
  }

  companyId = companyId || DEFAULT_COMPANY_ID;
  let targetUrl = url.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  try {
    // 1. Fazer requisição HTTP para o site do cliente
    let html = '';
    try {
      const response = await axios.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        timeout: 18000,
        maxRedirects: 5
      });
      html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    } catch (fetchErr: any) {
      console.warn(`[Scrape] Erro ao buscar URL ${targetUrl}:`, fetchErr.message);
      return res.status(400).json({ 
        error: `Não foi possível acessar o site "${targetUrl}". Verifique se o endereço está correto e com acesso público. (${fetchErr.message})` 
      });
    }

    const $ = cheerio.load(html);
    const siteTitle = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || targetUrl;
    const siteDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

    // 2. Extrair dados estruturados JSON-LD (Schema.org) se existirem
    const jsonLdItems: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const rawJson = $(el).html();
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          const processObj = (item: any) => {
            if (!item) return;
            const type = (item['@type'] || '').toLowerCase();
            if (['product', 'menuitem', 'restaurant', 'menu', 'accommodation', 'realestatelisting', 'singlefamilyresidence', 'apartment', 'offer'].some(t => type.includes(t))) {
              jsonLdItems.push(item);
            }
            if (Array.isArray(item.itemListElement)) {
              item.itemListElement.forEach(processObj);
            }
            if (Array.isArray(item.hasMenuItem)) {
              item.hasMenuItem.forEach(processObj);
            }
            if (Array.isArray(item['@graph'])) {
              item['@graph'].forEach(processObj);
            }
          };
          processObj(parsed);
        }
      } catch (e) {
        // Ignora erros de parse de tags de terceiros inválidas
      }
    });

    // 3. Limpar elementos desnecessários para focar no conteúdo de produtos/catálogo
    $('script, style, noscript, svg, iframe, nav, footer, header').remove();
    
    // Buscar seletores comuns de produtos, imóveis e catálogo
    const candidateBlocks: string[] = [];
    $('[class*="product"], [class*="item"], [class*="card"], [class*="imovel"], [class*="property"], [class*="listing"], [class*="anuncio"], [class*="menu"], article').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length > 20 && text.length < 800) {
        candidateBlocks.push(text);
      }
    });

    const pageBodyText = $('body').text().replace(/\s+/g, ' ').slice(0, 15000);
    const snippetContext = candidateBlocks.length > 0 
      ? candidateBlocks.slice(0, 60).join('\n---\n') 
      : pageBodyText;

    let extractedProducts: any[] = [];

    // 4. Utilizar IA (GPT-4o) para extração precisa de produtos, imóveis ou serviços
    if (process.env.OPENAI_API_KEY) {
      try {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const prompt = `Você é o extrator avançado do Multiplex para catálogo web comercial.
O cliente forneceu o link do site: "${targetUrl}".
Título do site: "${siteTitle}".
Descrição: "${siteDescription}".

Analise o conteúdo do site e extraia TODOS os itens individuais (produtos de loja, cardápio de restaurante/pizzaria, imóveis de imobiliária, serviços ou itens de catálogo).
Tente encontrar o maior número possível de itens existentes na página.

Para CADA item encontrado, extraia os campos:
- name: Nome do produto/imóvel/item (ex: "Apartamento 3 Quartos Centro", "Pizza Calabresa Especial", "Camiseta Masculina Algodão", "Consultoria Jurídica").
- price: Preço em Reais em número float (ex: 450000.00 para imóvel, 54.90 para pizza). Se não houver valor explícito ou for sob consulta, retorne 0.
- description: Detalhes, características, metragem/quartos/bairro (se for imóvel), ingredientes (se for comida), especificações técnicas ou diferenciais.
- category: Categoria organizada identificada (ex: "Imóveis - Venda", "Imóveis - Locação", "Pizzas", "Bebidas", "Moda", "Serviços", "Geral").
- ingredients: Array de tags ou características (ex: ["3 quartos", "2 vagas", "Piscina"] ou ["Mussarela", "Calabresa", "Cebola"] ou características chave).

Dados brutos extraídos da página:
"""
${snippetContext}
"""
${jsonLdItems.length > 0 ? `\nDados estruturados JSON-LD detectados:\n${JSON.stringify(jsonLdItems).slice(0, 4000)}` : ''}

Retorne EXCLUSIVAMENTE um objeto JSON no formato:
{
  "site_title": "${siteTitle}",
  "products": [
    {
      "name": "Nome",
      "price": 29.90,
      "description": "Detalhes",
      "category": "Categoria",
      "ingredients": ["Tag 1", "Tag 2"]
    }
  ]
}
PROIBIDO usar emojis nos nomes e categorias.`;

        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [
            { role: 'system', content: 'Você é um extrator de catálogos e produtos web em JSON estrito. Responda apenas com JSON válido. PROIBIDO usar emojis.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        });

        const rawContent = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(rawContent);
        if (Array.isArray(parsed.products)) {
          extractedProducts = parsed.products;
        }
      } catch (aiErr: any) {
        console.warn('[Scrape] Falha na chamada OpenAI, aplicando fallback heurístico:', aiErr.message);
      }
    }

    // 5. Fallback Heurístico Robusto se a IA não retornar itens
    if (extractedProducts.length === 0) {
      // Se tiver JSON-LD de produtos
      if (jsonLdItems.length > 0) {
        for (const item of jsonLdItems) {
          const name = item.name || item.headline || 'Item de Catálogo';
          let price = 0;
          if (item.offers) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            price = parseFloat(offer?.price || offer?.lowPrice || 0);
          }
          extractedProducts.push({
            name,
            price: isNaN(price) ? 0 : price,
            description: item.description || `Item extraído de ${siteTitle}`,
            category: item['@type'] || 'Catálogo Web',
            ingredients: []
          });
        }
      }

      // Se ainda vazio, varrer os blocos com regex de valores monetários
      if (extractedProducts.length === 0) {
        const blocks = candidateBlocks.length > 0 ? candidateBlocks : pageBodyText.split(/\n+/);
        for (const block of blocks) {
          const priceMatch = block.match(/(?:r\$|\$)\s*(\d+[\.,]?\d*)/i) || block.match(/(\d+[.,]\d{2})/);
          if (priceMatch) {
            const rawPrice = priceMatch[1].replace(/\./g, '').replace(',', '.');
            const price = parseFloat(rawPrice);
            const words = block.split(/(?:r\$|\$|\-|\:)/i).map((w: string) => w.trim()).filter(Boolean);
            const name = (words[0] || 'Item de Catálogo').slice(0, 80);
            const description = block.replace(priceMatch[0], '').trim().slice(0, 200);
            
            if (name.length >= 3 && !extractedProducts.some(p => p.name === name)) {
              extractedProducts.push({
                name,
                price: isNaN(price) ? 0 : price,
                description: description || `Identificado no site ${targetUrl}`,
                category: 'Geral',
                ingredients: []
              });
            }
          }
        }
      }
    }

    // Se autoSave foi solicitado, salvar diretamente no catálogo da empresa
    let savedProducts: Product[] = [];
    if (autoSave && extractedProducts.length > 0) {
      const currentProducts = store.products.get(companyId) || [];
      for (const p of extractedProducts) {
        if (!p.name) continue;
        const newProd: Product = {
          id: uuidv4(),
          company_id: companyId,
          name: String(p.name).trim(),
          description: p.description || '',
          price: Number(p.price) || 0,
          available: true,
          ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
          variations: []
        };
        currentProducts.push(newProd);
        savedProducts.push(newProd);
      }
      store.products.set(companyId, currentProducts);
    }

    return res.json({
      success: true,
      url: targetUrl,
      site_title: siteTitle,
      count: extractedProducts.length,
      products: extractedProducts,
      saved: autoSave ? savedProducts.length : 0,
      savedProducts: autoSave ? savedProducts : []
    });
  } catch (err: any) {
    console.error('Erro no web scraping de produtos:', err);
    return res.status(500).json({ error: err.message || 'Falha ao processar site do cliente.' });
  }
});


