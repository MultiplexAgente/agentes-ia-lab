import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SUBSCRIPTION_PLANS } from './billing.js';

export const authRouter = Router();

// Usuários cadastrados em memória
interface UserAccount {
  id: string;
  name: string;
  email: string;
  company_name: string;
  phone?: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  avatar_initials: string;
  role: 'admin' | 'member';
  created_at: string;
}

const users: Map<string, UserAccount> = new Map();

// Seed do usuário padrão Anthony Both
users.set('anthony@amboth.com.br', {
  id: 'usr_anthony_01',
  name: 'Anthony Both',
  email: 'anthony@amboth.com.br',
  company_name: 'Anthony Burgers & Delivery',
  phone: '+55 11 99999-8888',
  plan_id: 'plan_pro',
  billing_cycle: 'monthly',
  avatar_initials: 'AN',
  role: 'admin',
  created_at: new Date().toISOString()
});

// Login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório para login.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  let user = users.get(normalizedEmail);

  // Se o usuário ainda não existe na memória, cria um dinâmico para facilitar o acesso
  if (!user) {
    const namePart = normalizedEmail.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const initials = formattedName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2) || 'US';

    user = {
      id: uuidv4(),
      name: formattedName || 'Usuário Multiplex',
      email: normalizedEmail,
      company_name: 'Minha Empresa',
      plan_id: 'plan_pro',
      billing_cycle: 'monthly',
      avatar_initials: initials,
      role: 'admin',
      created_at: new Date().toISOString()
    };
    users.set(normalizedEmail, user);
  }

  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === user?.plan_id) || SUBSCRIPTION_PLANS[1];

  return res.json({
    success: true,
    token: `token_${uuidv4().replace(/-/g, '')}`,
    user,
    plan: selectedPlan
  });
});

// Cadastro de Nova Conta com Escolha de Plano
authRouter.post('/register', (req: Request, res: Response) => {
  const { name, email, password, company_name, phone, plan_id, billing_cycle } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const initials = String(name)
    .trim()
    .split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'US';

  const chosenPlanId = plan_id || 'plan_pro';
  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === chosenPlanId) || SUBSCRIPTION_PLANS[1];

  const newUser: UserAccount = {
    id: uuidv4(),
    name: name.trim(),
    email: normalizedEmail,
    company_name: company_name ? company_name.trim() : 'Minha Empresa',
    phone: phone ? phone.trim() : '',
    plan_id: selectedPlan.id,
    billing_cycle: billing_cycle === 'yearly' ? 'yearly' : 'monthly',
    avatar_initials: initials,
    role: 'admin',
    created_at: new Date().toISOString()
  };

  users.set(normalizedEmail, newUser);

  return res.status(201).json({
    success: true,
    message: 'Conta criada e plano ativado com sucesso!',
    token: `token_${uuidv4().replace(/-/g, '')}`,
    user: newUser,
    plan: selectedPlan
  });
});

// Obter Usuário Atual
authRouter.get('/me', (req: Request, res: Response) => {
  const email = (req.query.email as string) || 'anthony@amboth.com.br';
  const user = users.get(email.toLowerCase()) || users.get('anthony@amboth.com.br');

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === user.plan_id) || SUBSCRIPTION_PLANS[1];

  return res.json({
    user,
    plan: selectedPlan
  });
});
