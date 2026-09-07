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
