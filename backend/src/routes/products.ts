import { Router, Request, Response } from 'express';
import { store } from '../config/database.js';
import { Product, ProductCategory } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

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

// Extrair múltiplos produtos a partir de texto colado com Multiplex IA (GPT-4o)
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
      const prompt = `Você é o extrator inteligente do Multiplex IA.
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

