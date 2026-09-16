# Multiplex 🚀

Plataforma SaaS & Fábrica de Agentes de IA Omnichannel (WhatsApp, Instagram, Web) integrada ao Supabase, n8n e modelos de IA de última geração.

- **Repositório Oficial:** [MultiplexAgente/gravity-hug](https://github.com/MultiplexAgente/gravity-hug)
- **Live App (Lovable):** [gravity-hug.lovable.app](https://gravity-hug.lovable.app)
- **Supabase Organization:** [Dashboard Supabase](https://supabase.com/dashboard/org/npkdkomqdaxeqqlkqusn)

---

## 🎯 Arquitetura & Módulos

1. **Frontend & App TanStack Start / Lovable (`src/`):**
   - Chat-first workspace interativo e responsivo.
   - Rotas empresariais: Catálogo, Clientes, Pedidos, Integrações, Admin de Roteamento de IA.
   - Design moderno com Tailwind CSS v4, Lucide Icons, Radix UI e componentes de IA.

2. **Backend & Agente Omnichannel (`backend/` & `src/lib/multiplex/`):**
   - Sistema de IA conversacional e auto-recuperação contextual.
   - Memória empresarial de longo prazo (Episódica, Semântica e Perfil de Cliente).
   - Catálogo Universal de Negócios (Restaurantes, Clínicas, Hotéis, Cursos, Vagas, Eventos).
   - Webhooks WhatsApp / Instagram e integração com fluxos n8n.

3. **Banco de Dados & Migrations (`supabase/migrations/` & `db/`):**
   - `001_initial_schema.sql`: Estrutura base de multi-tenant e conversas.
   - `002_seed_demo_data.sql`: Dados de demonstração.
   - `003_ai_app_builder.sql`: Configurações de construtor de agentes.
   - `004_memory_enterprise.sql`: Motor de memória empresarial profunda.
   - `005_catalog_universal.sql`: Catálogo universal de produtos, serviços e vagas.

---

## 🛠️ Desenvolvimento Local

```sh
# Instalação de dependências
npm install

# Rodar servidor de desenvolvimento (TanStack Start / Vite)
npm run dev

# Ou rodar módulos específicos:
npm run dev:backend   # API Express e Webhooks
npm run dev:frontend  # Dashboard frontend legado / standalone
```
