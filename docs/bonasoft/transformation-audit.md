# Relatório de Auditoria Técnica e Planejamento Arquitetural: Multiplex -> BonaSoft Commerce

**Documento:** Auditoria Técnica e Plano Estratégico de Transformação  
**Projeto Origem:** Multiplex (Fábrica de Agentes & Plataforma Conversacional)  
**Projeto Destino:** BonaSoft Commerce (Plataforma SaaS Comercial Multiempresa e Multissegmento)  
**Data:** 17 de Novembro de 2026  
**Status:** Análise Concluída - Aguardando Autorização para Implementação  

---

## 1. Visão Geral da Transformação

O projeto **Multiplex** evoluirá de uma plataforma de agentes de IA conversacionais isolada para se tornar o **Motor de Inteligência Artificial Compartilhado (AI Core Engine)** de um ecossistema comercial robusto chamado **BonaSoft Commerce**.

O BonaSoft Commerce será uma solução SaaS completa, multiempresa (*multi-tenant*) e multissegmento, desenhada para digitalizar e acelerar as operações comerciais de diferentes verticais de varejo e serviços:
- **Farmácias e Drogarias** (controle de lotes, retenção de receitas, genéricos/similares).
- **Mercados e Supermercados** (venda por peso/fração, código de barras, múltiplos departamentos).
- **Lojas de Roupas e Moda** (grade de tamanhos, cores, coleções).
- **Restaurantes, Bares e Lanchonetes** (mesas, comandas, complementos/adicionais, cozinha/KDS, delivery).
- **Beleza e Estética** (agendamento de horários, pacotes de serviços, profissionais comissionados).
- **Pet Shops** (serviços de banho/tosa, medicamentos veterinários, rações por peso).
- **Eletrônicos e Acessórios** (número de série/IMEI, garantias estendidas).
- **Materiais de Construção** (unidades métricas diversas, cálculo de frete pesado, orçamento para entrega futura).
- **Outros segmentos de comércio e serviços**.

Nesta transição, o motor de inteligência artificial já desenvolvido no Multiplex (orquestração de modelos, classificação de tarefas, ferramentas operacionais, memória e automação de canais) será totalmente preservado e integrado como uma camada inteligente nativa da plataforma BonaSoft Commerce.

---

## 2. Tecnologias Identificadas no Projeto

A auditoria identificou uma arquitetura moderna dividida entre uma aplicação fullstack principal orientada a SSR e APIs, um backend Express complementar e um frontend legado em formato de protótipo.

### 2.1. Frontend Principal (`src/`)
- **Framework & SSR:** React 19 (`19.2.0`), TanStack Start (`1.168.32`), TanStack Router (`1.170.18`), Vite 8 (`8.1.5`).
- **Linguagem:** TypeScript 5.8 (`5.8.3`).
- **Estilização & Design System:** Tailwind CSS v4 (`4.2.1`), `@tailwindcss/vite`, Radix UI Primitives (Accordion, Alert Dialog, Aspect Ratio, Avatar, Checkbox, Collapsible, Context Menu, Dialog, Dropdown Menu, Hover Card, Menubar, Navigation Menu, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Slider, Slot, Switch, Tabs, Toggle, Tooltip).
- **Ícones & Animações:** Lucide React (`0.575.0`), Motion (`13.2.0`), `tw-animate-css` (`1.3.4`).
- **Visualização de Dados & Gráficos:** Recharts (`2.15.4`).
- **Manipulação de Markdown & IA Streaming:** Streamdown (`2.6.0`) com extensões (`@streamdown/code`, `@streamdown/math`, `@streamdown/mermaid`, `@streamdown/cjk`), Shiki (`4.4.3`), `use-stick-to-bottom`.
- **Formulários & Validação:** React Hook Form (`7.71.2`), `@hookform/resolvers`, Zod (`3.25.76`).
- **Utilitários de UI:** `clsx`, `tailwind-merge`, `class-variance-authority`, Embla Carousel (`8.6.0`), Sonner (`2.0.7`), Vaul (`1.1.2`), `cmdk` (`1.1.1`), `input-otp` (`1.4.2`).

### 2.2. Backend & Motor de IA (`src/lib/multiplex/` & `backend/`)
- **Orquestração de Modelos:** Vercel AI SDK (`ai` v7.0.99), `@ai-sdk/openai` (`4.0.66`), `@ai-sdk/anthropic` (`4.0.53`), `@ai-sdk/deepseek` (`3.0.44`), SDK oficial `openai` (`7.15.0`).
- **Servidor SSR / Edge Runtime:** Nitro (`3.0.260603-beta`), TanStack React Start Server Entry com tratamento customizado de erros catastróficos H3 (`src/server.ts`).
- **Servidor de Suporte Express (`backend/src/server.ts`):** Express 4.21 (`4.21.2`), CORS (`2.8.5`), Dotenv (`16.4.7`), TSX (`4.19.3`), Multer (`1.4.5-lts.1`).
- **Web Scraping & Ingestão de Catálogos:** Cheerio (`1.2.0`), Axios (`1.20.0`).
- **Data & Horas:** `date-fns` (`4.1.0`), UUID (`14.0.2`), Nanoid (`6.0.1`).

### 2.3. Banco de Dados & Infraestrutura Multi-Tenant
- **Engine Principal:** PostgreSQL através do **Supabase** (`@supabase/supabase-js` `2.116.0`).
- **Segurança de Acesso:** Row Level Security (RLS) habilitado por padrão em todas as tabelas comerciais e operacionais, isolando os dados por `company_id`.
- **Camada In-Memory de Desenvolvimento / Fallback (`backend/src/config/database.ts`):** Repositório completo em memória (`InMemoryStore`) para testes rápidos de integração e execução desacoplada sem dependência forçada do banco em ambientes de CI.
- **Proteção de Segurança Estrita:** Validação em código contra conexão indevida com instâncias de banco restritas.

### 2.4. Canais de Mensageria & Automações
- **WhatsApp Cloud API:** Endpoint dedicado para verificação de webhook e recepção de mensagens em tempo real (`/api/public/whatsapp/webhook`).
- **Instagram Messaging API & Facebook Messenger:** Suporte estruturado no modelo de dados e adapters.
- **n8n Workflow Automation:** Conexão pronta com instâncias n8n locais ou em VPS para fluxos omnichannel e sincronização autônoma de catálogos via webhook.

---

## 3. Estrutura de Diretórios e Mapeamento de Componentes

A estrutura atual do repositório reflete uma transição bem sucedida de um protótipo inicial para uma aplicação escalável de padrão empresarial:

```
multiplex-ia/
├── backend/                  # Servidor Express com serviços avançados de IA e canais
│   ├── src/
│   │   ├── config/           # Configuração de banco (Supabase + InMemoryStore)
│   │   ├── routes/           # Rotas da API Express (chat, webhooks, builder, catalog, etc.)
│   │   ├── services/
│   │   │   ├── ai/           # AIService, AIToolExecutor, GlobalAIConversationService
│   │   │   ├── builder/      # AIBuilderService, DataQueryEngine, Introspection
│   │   │   ├── catalog/      # CatalogSearchService, Ranking, SearchSession
│   │   │   ├── channels/     # Adapters para canais de mensageria
│   │   │   ├── crawler/      # Ingestão de sites, sitemaps e dados estruturados
│   │   │   ├── knowledge/    # Base de conhecimento e indexação
│   │   │   ├── memory/       # Memória episódica, semântica e resolução de entidades
│   │   │   ├── n8n/          # Integração com workflows n8n
│   │   │   ├── sync/         # Agendamento e sincronização de catálogos
│   │   │   ├── teach/        # Aprendizado supervisionado e regras do agente
│   │   │   └── tools/        # Registro e execução de ferramentas
│   │   └── types/            # Tipagens do ecossistema Express
├── db/                       # Scripts SQL adicionais e políticas de segurança
│   ├── 004_ai_routing.sql    # Configurações de roteamento e auditoria de IA
│   ├── 005_company_users.sql # Gestão de usuários vinculados às empresas
│   ├── 006_ai_trace_and_tenant_security.sql # Telemetria e isolamento
│   ├── 007_multi_provider.sql # Suporte a preferências multi-provedor
│   └── 007_tenant_policies_customers_orders.sql # Políticas RLS rigorosas
├── docs/                     # Documentação de decisões, roadmaps e diretrizes
│   └── bonasoft/             # Documentação estratégica do BonaSoft Commerce
├── fluxos_n8n/               # Workflows JSON de produção para n8n
│   ├── omnichannel_agent_workflow.json
│   └── website_auto_sync_workflow.json
├── frontend/                 # Protótipo SPA inicial (App.tsx com 7.700 linhas)
│   ├── src/
│   │   ├── components/       # AIBuilderView, ExecutiveDashboardView, LandingChatPage
│   │   └── services/         # aiConversationService
├── prompts/                  # Engenharia de prompts e personas
│   └── prompt_agente_anthony.md
├── src/                      # APLICAÇÃO PRINCIPAL (TanStack Start + Lovable SSR)
│   ├── assets/               # Imagens e marcas da aplicação
│   ├── components/
│   │   ├── ai-elements/      # Componentes de renderização de chat, código, ferramentas
│   │   ├── multiplex/        # AppShell, ChatWorkspace, DataPage, ThemeToggle
│   │   └── ui/               # Design System completo baseado no Radix UI
│   ├── hooks/                # Hooks utilitários (ex: use-mobile)
│   ├── lib/
│   │   └── multiplex/        # NÚCLEO DO MOTOR DE IA (Server-side)
│   │       ├── audit.server.ts           # Gravação de auditoria e telemetria
│   │       ├── client.ts                 # Utilitários de formatação e consumo cliente
│   │       ├── company-auth.server.ts    # Validação de sessão e contexto multi-tenant
│   │       ├── context.server.ts         # Injeção de contexto empresarial no prompt
│   │       ├── conversation.server.ts    # Gestão de conversas e mensagens
│   │       ├── model-registry.server.ts  # Registro de modelos de IA e tiers
│   │       ├── pipeline.server.ts        # Pipeline completo de inferência e streaming
│   │       ├── preferences.server.ts     # Preferências de modelo por usuário
│   │       ├── providers.server.ts       # Adaptadores de provedores (OpenAI, Anthropic, DeepSeek)
│   │       ├── router.server.ts          # Roteamento inteligente autônomo
│   │       ├── settings.server.ts        # Configurações de IA da empresa
│   │       ├── supabase.server.ts        # Cliente seguro Supabase service-role
│   │       ├── task-selector.server.ts   # Classificação de 25 tipos de tarefas
│   │       ├── tools.server.ts           # Ferramentas reais com escopo de segurança
│   │       └── whatsapp.server.ts        # Processamento de mensagens WhatsApp
│   ├── routes/               # Rotas e páginas do TanStack Router
│   │   ├── __root.tsx        # Layout raiz com fontes e gerenciamento de tema
│   │   ├── index.tsx         # Chat Workspace principal com 3 colunas
│   │   ├── inicio.tsx        # Visão geral / Dashboard da empresa
│   │   ├── catalogo.tsx      # Listagem visual do catálogo de produtos
│   │   ├── pedidos.tsx       # Gestão de pedidos reais com detalhes e status
│   │   ├── clientes.tsx      # Gestão de clientes reais da empresa
│   │   ├── empresa.tsx       # Configurações da empresa e parâmetros de IA
│   │   ├── integracoes.tsx   # Status dos canais conectados (WhatsApp, Web, etc.)
│   │   ├── entrar.tsx        # Tela de login da empresa
│   │   ├── admin.ai-routing.tsx # Painel administrativo de roteamento de IA
│   │   └── api/              # Endpoints HTTP da aplicação SSR
│   │       ├── admin/ai-routing.ts
│   │       ├── ai/models.ts
│   │       ├── ai/conversation/chat.ts
│   │       ├── company/
│   │       │   ├── conversations.ts
│   │       │   ├── customers.ts
│   │       │   ├── login.ts
│   │       │   ├── messages.ts
│   │       │   ├── orders.ts
│   │       │   ├── overview.ts
│   │       │   ├── products.ts
│   │       │   ├── settings.ts
│   │       │   └── workspace.ts
│   │       ├── public/whatsapp/webhook.ts
│   │       └── products.ts
│   ├── router.tsx            # Inicialização e configuração do TanStack Router
│   ├── server.ts             # Entry point do servidor Nitro/TanStack Start
│   └── styles.css            # Folha de estilos global com Tailwind v4
└── supabase/
    └── migrations/           # Migrations declarativas do PostgreSQL
        ├── 001_initial_schema.sql
        ├── 002_seed_demo_data.sql
        ├── 003_ai_app_builder.sql
        ├── 004_memory_enterprise.sql
        └── 005_catalog_universal.sql
```

---

## 4. Mapeamento das Funcionalidades Já Implementadas no Multiplex

A auditoria comprovou que o projeto conta com um nível de maturidade operacional muito além de um simples chatbot. Os seguintes módulos já estão 100% funcionais no código:

### 4.1. Núcleo de IA e Roteamento Autônomo Multi-Provider
1. **Model Registry Centralizado (`model-registry.server.ts`):**
   - Abstração de nomes técnicos por aliases públicos seguros (`gpt`, `claude`, `deepseek`). O cliente final nunca acessa o identificador do modelo subjacente.
   - Suporte a modelos de ponta: OpenAI (`gpt-6-astra`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.4-nano`, `gpt-5.3-codex`), Anthropic (`claude-opus-5`, `claude-sonnet-4-5`, `claude-haiku-4-5`) e DeepSeek (`deepseek-v4-pro`, `deepseek-flash`).
2. **Task Model Selector (`task-selector.server.ts`):**
   - Classificador heurístico que categoriza a intenção do usuário em 25 tipos de tarefas (ex: `SIMPLE_CHAT`, `CREATE_ORDER`, `CATALOG_SEARCH`, `CUSTOMER_SUPPORT`, `DATA_ANALYSIS`, `SUMMARIZATION`, `DOCUMENT_ANALYSIS`, `COMMERCIAL`, etc.).
   - Suporte a modelos auxiliares para pré-processamento de textos longos ou tarefas batch antes de devolver ao modelo principal.
3. **Estratégias de Roteamento Dinâmico (`router.server.ts`):**
   - Configuração de estratégias por empresa: `QUALITY_FIRST`, `BALANCED`, `SPEED_FIRST` e `COST_FIRST`.
   - Ajustes individuais de estratégia por categoria de tarefa (ex: Catálogo = `SPEED_FIRST`, Análise = `QUALITY_FIRST`).
4. **Telemetria e Auditoria Detalhada (`audit.server.ts`):**
   - Rastreamento por chamada: ID da mensagem, provedor, modelo real resolvido, tokens de entrada/saída, latência em milissegundos, custo estimado em dólares (USD) e motivo de finalização (*finish reason*).
5. **Diretrizes Rígidas Anti-Alucinação (`pipeline.server.ts`):**
   - Identidade estável da IA sem auto-apresentação redundante em todas as respostas.
   - Proibição terminante de inventar dados: se um produto ou cliente não estiver no banco, a IA responde com precisão que não há registros.
   - Clarificação prévia passo a passo: a IA faz perguntas objetivas caso faltem dados essenciais (ex: nome do cliente ou item de compra) antes de invocar comandos de escrita.

### 4.2. Ferramentas Operacionais do Agente de IA (`tools.server.ts`)
O agente conta com execução de ferramentas reais via Tool Calling do Vercel AI SDK, com separação de privilégios (`authenticated` vs `public`):
- `search_products`: Busca produtos no catálogo da empresa por termo, categoria e disponibilidade real.
- `get_product`: Detalha ficha técnica, ingredientes/atributos e preço exato do produto.
- `search_customers`: Consulta clientes por nome, telefone ou e-mail (exclusivo para sessão autenticada).
- `create_customer`: Cadastra novos clientes após confirmação dos dados.
- `update_customer`: Atualiza informações cadastrais de clientes existentes.
- `create_order`: Criação de pedido real associado a um cliente válido e produtos reais do catálogo, calculando subtotal, taxa de entrega e total com persistência dos itens em transação.
- `get_order`: Consulta completa de status e itens de um pedido específico.
- `search_orders`: Listagem de pedidos filtrados por cliente ou status operacional.
- `summarize_operations`: Resumo consolidado em tempo real da operação comercial (quantidade de produtos, clientes ativos, volume de pedidos, faturamento bruto e divisão por status).

### 4.3. Interface e Workspace do Usuário (`src/components/multiplex/` & `src/routes/`)
- **Chat Workspace de 3 Colunas (`src/routes/index.tsx`):**
  - Coluna 1: Navegação lateral com acessos rápidos a rotas operacionais.
  - Coluna 2: Histórico de conversas reais agrupadas da empresa, com status e data.
  - Coluna 3: Janela de chat com suporte a streaming de texto, execução visual de ferramentas e seleção discreta do modelo de IA.
- **Páginas de Dados Dedicadas:**
  - `catalogo.tsx`: Visualização em grade dos itens disponíveis e indisponíveis com preços formatados em BRL.
  - `pedidos.tsx`: Lista de pedidos com status, data, cliente e itens vinculados.
  - `clientes.tsx`: Painel de relacionamento com métricas de clientes cadastrados.
  - `integracoes.tsx`: Diagnóstico visual de canais de atendimento conectados.
  - `empresa.tsx`: Painel de administração de categorias, produtos, limites de orçamento de IA e seleção de estratégias de roteamento.
  - `admin.ai-routing.tsx`: Painel analítico de distribuição de chamadas de IA por provedor e modelo.
- **Design System Profissional:**
  - Tema escuro profissional configurado como padrão e persistido em LocalStorage.
  - Responsividade total para dispositivos móveis, tablets e telas amplas.

### 4.4. Camada de Memória Empresarial e Conhecimento (`backend/src/services/memory/`)
- **EntityResolver:** Identificação e unificação do perfil do cliente entre diferentes canais (ex: vinculando o telefone do WhatsApp ao histórico cadastrado no sistema).
- **MemoryExtractor:** Extração contínua de preferências comerciais, restrições e histórico de compras.
- **StructuredKnowledgeItem:** Armazenamento vetorial e relacional de FAQs, horários de funcionamento e políticas de entrega.

### 4.5. Ingestão Automatizada de Catálogo (`backend/src/services/crawler/`)
- Rastreamento autônomo de lojas online e sitemaps XML.
- Parser de metadados Schema.org (`Product`, `Offer`, `BreadcrumbList`) com normalização de itens para importação rápida de catálogos legados.

---

## 5. Análise de Reutilização, Adaptação e Desenvolvimento

Para posicionar o BonaSoft Commerce como um SaaS de padrão industrial, classificamos cada componente do projeto atual em três categorias:

### 5.1. Funcionalidades 100% Reutilizáveis
| Módulo | Localização | Papel no BonaSoft Commerce |
| :--- | :--- | :--- |
| **Model Registry & Adapters** | `src/lib/multiplex/model-registry.server.ts` & `providers.server.ts` | Motor de conexão transparente com OpenAI, Anthropic e DeepSeek para todos os clientes do SaaS. |
| **Task Model Selector** | `src/lib/multiplex/task-selector.server.ts` | Triagem automática de custo e velocidade em mensagens operacionais. |
| **Pipeline Anti-Alucinação** | `src/lib/multiplex/pipeline.server.ts` | Garantia de que a IA do BonaSoft nunca inventará produtos, preços ou estoques inexistentes. |
| **Auditoria e Telemetria** | `src/lib/multiplex/audit.server.ts` | Cobrança transparente de consumo de IA por empresa / plano. |
| **Ferramentas Comerciais do Agent** | `src/lib/multiplex/tools.server.ts` | Operações conversacionais de catálogo, cliente e pedidos. |
| **Design System Base (UI Components)**| `src/components/ui/` | Componentes visuais de alta acessibilidade construídos sobre Radix UI. |
| **Segurança Multi-Tenant (RLS)** | `supabase/migrations/` & `db/` | Isolamento estrito de dados entre lojas e empresas diferentes. |
| **Crawler & Ingestão de Catálogos** | `backend/src/services/crawler/` | Onboarding facilitado para novos lojistas que já possuem sites ou catálogos online. |

### 5.2. Funcionalidades que Precisam ser Adaptadas
| Módulo | Situação Atual | Adaptação Necessária para BonaSoft Commerce |
| :--- | :--- | :--- |
| **Catálogo de Produtos** | Modelo focado em gastronomia (`ingredients`, `preparation_time_minutes`). | Tornar os atributos dinâmicos via campos verticais ou metadados JSONB para suportar farmácias (bula, dosagem), moda (grade tamanho/cor), pet shops (raça/porte), etc. |
| **Identidade do Sistema** | Apresenta a marca "Multiplex" na UI e no system prompt da IA. | Atualizar para a identidade oficial **BonaSoft Commerce**, mantendo o Multiplex como a marca de tecnologia do motor interno de IA. |
| **Ícones e Símbolos Visuais** | Algumas telas legadas em `frontend/` utilizavam símbolos de brilho/mágica (`Sparkles`, `Wand2`). | Remoção e substituição estrita por ícones de domínio de negócio (ex: `Wallet`, `Percent`, `ShoppingBag`, `Package`, `Truck`, `Building2`), em conformidade absoluta com as regras do usuário. |
| **Gestão de Sessão & Workspace** | Autenticação vinculada a um único tenant ativo por vez. | Permitir que usuários proprietários gerenciem múltiplas filiais ou empresas sob a mesma conta BonaSoft (visão franqueador/matriz). |
| **Rotas de Atendimento** | Chat único com foco no operador da loja. | Segmentar em dois modos: Atendimento do Lojista (Painel Interno) e Atendimento ao Consumidor Final (Widget Web / WhatsApp / Link Direto). |

### 5.3. Funcionalidades que Precisam ser Desenvolvidas (Novos Módulos)
1. **Seletor e Templates de Segmentos Comerciais:**
   - Durante a criação ou configuração da empresa, escolha do segmento de atuação (Farmácia, Moda, Restaurante, Mercado, Pet Shop, etc.), ativando automaticamente campos, regras e vocabulário específicos na IA e na interface.
2. **PDV de Balcão Ágil (Frente de Caixa):**
   - Interface rápida de caixa para leitura de código de barras, busca instantânea de itens, seleção de formas de pagamento (Pix, Cartão, Dinheiro) e emissão de comprovantes de venda.
3. **Módulo de Variações e Grade Avançada:**
   - Controle de combinações de produtos (ex: Camiseta Azul tamanho G; Ração Premium sabor Carne pacote 15kg; Paracetamol 750mg caixa com 20 comprimidos).
4. **Módulo de Controle de Estoque & Alertas:**
   - Baixa automática de estoque no fechamento de pedidos, saldo mínimo e notificações de necessidade de reposição de mercadorias.
5. **Configurador Fiscal & Meios de Pagamento:**
   - Integração com gateways de pagamento (Pix dinâmico com QR Code, split de pagamentos) e preparação para módulos de emissão fiscal.
6. **Hub Central de Notificações Comerciais:**
   - Notificação sonora e visual de novos pedidos em tempo real para a equipe da loja (cozinha, separação ou expedição).

---

## 6. Análise de Dependências, Riscos Técnicos e Segurança

### 6.1. Riscos Técnicos Identificados
1. **Duplicidade de Estruturas Backend e Frontend:**
   - Existem simultaneamente a aplicação principal em `src/` (TanStack Start fullstack com SSR) e o servidor Express em `backend/src/server.ts`, além do frontend legado em `frontend/src/App.tsx`.
   - *Mitigação:* Manter o `src/` (TanStack Start) como a aplicação comercial consolidada do BonaSoft Commerce, reaproveitando a lógica de serviços de `backend/` de maneira modular, sem quebrar os comandos e rotinas existentes no `package.json`.
2. **Divergência de Nomenclatura em Variáveis de Ambiente:**
   - O `src/` utiliza os prefixos `MULTIPLEX_SUPABASE_URL` e `MULTIPLEX_SUPABASE_SECRET_KEY`, enquanto o `backend/` utiliza `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
   - *Mitigação:* No arquivo de configuração ou na inicialização, aceitar ambos os formatos como fallback, garantindo interoperabilidade total sem quebrar nenhum dos ambientes.
3. **Dependência de Plugins e Configurações Lovable:**
   - O projeto utiliza `@lovable.dev/vite-tanstack-config`. Conforme as diretrizes do projeto, não se deve sobrescrever histórico de commits do git (não usar force push ou rebase) para garantir sincronização perfeita.

### 6.2. Análise de Segurança & Isolamento
- **Banco de Dados Proibido:** Foi inspecionada a regra de bloqueio contra o banco `nptkxlrhrlssdsevpgqe`. Nenhuma chamada ou migration do projeto afeta esse banco.
- **Isolamento por RLS:** Todas as tabelas que envolvem `customers`, `orders`, `products` e `messages` utilizam restrições rígidas baseadas no `company_id`. A segurança não depende de parâmetros enviados pelo cliente: o identificador da empresa é extraído obrigatoriamente do token JWT ou do vínculo validado na tabela `company_users`.
- **Prevenção de Abuso de IA:** As ferramentas de escrita (`create_order`, `create_customer`, `update_customer`) são bloqueadas se invocadas por sessões não autenticadas ou com permissões insuficientes.

### 6.3. Dependência de Infraestrutura Proprietária
- **Avaliação:** Não existe nenhuma dependência bloqueante. A aplicação utiliza tecnologias de padrão aberto e padrões consolidados de mercado (PostgreSQL, Docker/Node.js, Vercel AI SDK, n8n self-hosted). O sistema pode ser hospedado em qualquer VPS moderna (ex: Hetzner, DigitalOcean, AWS, GCP) ou serviços gerenciados (Supabase, Vercel, Netlify).

---

## 7. Arquitetura Recomendada para o BonaSoft Commerce

A arquitetura recomendada preserva o código existente e estabelece uma hierarquia clara de camadas:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BONASOFT COMMERCE (SaaS Platform)                     │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    Frontend & Experiência do Usuário                  │  │
│  │  - Dashboard Operacional e Financeiro por Empresa                     │  │
│  │  - Workspace de Vendas e Chat Omnichannel (3 Colunas)                │  │
│  │  - Catálogo Adaptável por Segmento (Farma, Moda, Alimentação, etc.)   │  │
│  │  - Gestão de Pedidos (Balcão, Delivery, WhatsApp, Loja Online)       │  │
│  │  - Frente de Caixa / PDV Ágil para Lojistas                           │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼────────────────────────────────────┐  │
│  │               Camada de Negócio e Serviços (BonaSoft Core)            │  │
│  │  - Gestão Multi-Tenant & Hierarquia de Usuários (RBAC)                │  │
│  │  - Motor de Regras de Negócio e Segmentos de Varejo                  │  │
│  │  - Gestão de Estoque, Lotes e Grades de Produtos                      │  │
│  │  - Controle de Transações Comerciais e Pagamentos                     │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼────────────────────────────────────┐  │
│  │            MOTOR DE IA COMPARTILHADO (Multiplex AI Engine)            │  │
│  │  - Roteador Autônomo Multi-Provider (OpenAI, Anthropic, DeepSeek)     │  │
│  │  - Classificador de Tarefas Operacionais (TaskModelSelector - 25 tipos)│  │
│  │  - Orquestrador de Ferramentas (Tool Calling com Escopo de Segurança)  │  │
│  │  - Memória Empresarial Profunda (Episódica, Semântica e Perfil)       │  │
│  │  - Rastreamento de Custos, Telemetria e Auditoria de Tokens           │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────▼────────────────────────────────────┐  │
│  │                   Infraestrutura & Integrações Externas               │  │
│  │  - PostgreSQL + Supabase com RLS Estrito por Tenant                   │  │
│  │  - Automações de Fluxo em n8n (Webhooks, Alertas, Syncs)             │  │
│  │  - Canais de Mensageria: WhatsApp Cloud API, Instagram, Webhook      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Plano de Transformação por Etapas

Para executar a transformação sem comprometer a estabilidade do sistema nem ferir as restrições obrigatórias, o projeto deve seguir o seguinte roteiro em etapas:

### Etapa 1: Auditoria Técnica e Planejamento Arquitetural (Concluída nesta fase)
- **Escopo:** Auditoria detalhada de código, inventário de componentes, identificação de tecnologias, mapeamento de riscos e formulação deste relatório.
- **Complexidade:** Média (Concluída).

### Etapa 2: Padronização de Identidade Visual e Nomenclaturas
- **Escopo:**
  - Ajuste de títulos, metadados, cabeçalhos e documentação para **BonaSoft Commerce**.
  - Garantia estrita de conformidade com a regra de proibir ícones de IA, faíscas ou estrelas em todas as telas, substituindo-os por ícones semânticos de negócios (ex: `Wallet`, `Percent`, `ShoppingBag`, `Building2`).
  - Preservação do nome **Multiplex** estritamente como a marca técnica do motor de inteligência artificial.
- **Complexidade:** Baixa.

### Etapa 3: Camada de Multi-Segmento e Flexibilização do Catálogo
- **Escopo:**
  - Criação de definições de esquemas de dados por segmento no frontend/backend para suportar: Farmácias, Mercados, Roupas/Moda, Restaurantes/Bares, Beleza/Estética, Pet Shops, Eletrônicos e Materiais de Construção.
  - Exibição condicional de campos específicos na listagem e no cadastro de produtos sem quebrar o banco existente.
- **Complexidade:** Média.

### Etapa 4: Expansão das Ferramentas da IA Comercial
- **Escopo:**
  - Adição de novas ferramentas no `tools.server.ts` para apoiar os novos segmentos (ex: busca por código de barras/EAN, busca por princípio ativo/genérico em farma, consulta de grade de tamanhos em moda).
  - Atualização do prompt do sistema para orientar a conduta do assistente conforme o segmento configurado da empresa.
- **Complexidade:** Média.

### Etapa 5: Módulo de Operação de Vendas (Balcão / Pedidos Rápidos)
- **Escopo:**
  - Criação de uma interface ágil de registro de vendas para uso presencial no balcão da loja, integrada ao catálogo existente e gerando pedidos na tabela `orders`.
  - Atualização em tempo real das métricas operacionais no dashboard da empresa.
- **Complexidade:** Média-Alta.

### Etapa 6: Consolidação de Canais e Automações (WhatsApp & n8n)
- **Escopo:**
  - Validação e aprimoramento do fluxo de recepção de pedidos e consultas via WhatsApp.
  - Sincronização automatizada de catálogos e alertas via fluxos n8n já existentes.
- **Complexidade:** Média.

### Etapa 7: Verificação de Testes, Segurança e Validação Final
- **Escopo:**
  - Execução da suíte de testes (`vitest run`, linting e typecheck).
  - Validação de isolamento entre empresas com diferentes perfis e segmentos.
  - Entrega da documentação de operação para a equipe BonaSoft.
- **Complexidade:** Baixa-Média.

---

## 9. Tabela de Estimativa de Complexidade

| Etapa | Descrição | Complexidade Estimada | Impacto no Código Existente |
| :---: | :--- | :---: | :---: |
| **1** | Auditoria Técnica e Planejamento | **Média** (100% pronta) | Zero (Apenas documentação) |
| **2** | Identidade Visual & Regras de Design | **Baixa** | Baixo (Textos, logos e ícones) |
| **3** | Modelagem Multi-Segmento | **Média** | Baixo-Médio (Aditivo e modular) |
| **4** | Adaptação de Ferramentas de IA | **Média** | Médio (Expansão do Agent Core) |
| **5** | Frente de Vendas / Balcão | **Média-Alta** | Médio (Nova interface e fluxos) |
| **6** | Integração WhatsApp & n8n | **Média** | Baixo (Ativação de canais) |
| **7** | Validação, Segurança & Testes | **Baixa-Média** | Baixo (Garantia de qualidade) |

---

## 10. Conclusão da Auditoria

O projeto Multiplex possui uma base técnica extraordinariamente sólida, moderna e profissional. A infraestrutura de inteligência artificial já desenvolvida é um diferencial competitivo poderoso que pouquíssimos sistemas de gestão de comércio possuem no mercado.

A evolução para o **BonaSoft Commerce** é perfeitamente viável sem descarte de código, sem reconstrução do zero e sem alterações destrutivas de banco de dados, posicionando a BonaSoft como pioneira em soluções comerciais inteligentes multissegmento.

> **Status:** Análise e auditoria concluídas com sucesso. O sistema permanece inalterado e pronto para a próxima etapa mediante sua autorização.
