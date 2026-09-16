# Multiplex — correção da infraestrutura + nova interface

## O que a auditoria encontrou

**Causa única de todos os 404:** a tela grande atual (`src/app/App.tsx`, 7.113 linhas) foi escrita para um servidor Express antigo que não existe mais neste projeto. Ela chama 40+ endereços (`/api/knowledge`, `/api/dashboard`, `/api/billing/current`, `/api/sources`, `/api/logs`, `/api/channels`, `/api/agent/config`, `/api/builder/modules`, `/api/teach/history`, `/api/sources/catalog/items`, `/api/billing/plans`) que nunca foram reconstruídos aqui.

O que existe e funciona hoje, ligado ao seu Supabase externo:

| Endereço real | Função |
|---|---|
| `/api/ai/conversation/chat` | conversa com a IA real (OpenAI), grava mensagens, auditoria e consumo |
| `/api/admin/ai-routing` | painel administrativo com motor escolhido, tokens e custo |
| `/api/products`, `/api/company/products` | catálogo real |
| `/api/company/login`, `/workspace`, `/settings` | acesso e configuração da empresa |
| `/api/public/whatsapp/webhook` | canal WhatsApp |

**Origem de "Hamburgueria Artesanal Anthony":** não é código nem resposta inventada. Está no seu Supabase — a empresa `1111...1111` chama-se "Hamburgueria Artesanal Anthony" e a instrução do agente `2222...2222` começa com "Você é o assistente virtual da Hamburgueria Artesanal Anthony". O nome entra no contexto enviado ao modelo. Será renomeado para Multiplex.

**"Multiplex IA" na interface:** já não aparece em nenhum arquivo do app. Restam textos institucionais em documentos e no código morto — serão limpos junto.

## O que vou fazer

### 1. Fim dos 404 (sem mock, sem dado falso)
- Aposentar as telas mortas que só existiam para o servidor antigo: Ensinar IA, Builder de módulos, Fontes/Crawler, Faturamento, Logs antigos, Dashboard antigo, Canais antigos. Nenhuma delas lê dados reais hoje.
- Apagar o código morto (`legacy-backend/`, `src/server/services/…`) que contém respostas prontas e prompts com identidade de outra empresa.
- Depois disso não sobra nenhuma chamada para endereço inexistente. Vou provar rodando o app e conferindo a rede: zero 404.

### 2. Tabelas que faltam (clientes e pedidos)
Migration nova no seu Supabase: `customers` e `orders` + `order_items`, com empresa obrigatória, permissões e políticas por vínculo em `company_users` — mesma regra já usada nas outras tabelas. Sem nenhuma linha de exemplo; começa vazio.

### 3. Ações que funcionam de verdade
A IA passa a ter ferramentas reais: buscar produtos, cadastrar cliente, criar pedido, consultar pedidos, resumir números da operação. Cada uma escreve/lê no seu Supabase, sempre pela empresa do usuário autenticado (nunca pela empresa enviada pelo navegador). Sem dados, a resposta é estado vazio honesto.

### 4. Nova interface de três colunas
- **Coluna 1 (230px):** MULTIPLEX, "+ Novo chat", e apenas o que existe: Início, Conversas, Clientes, Catálogo, Pedidos, Integrações, Configurações. Página ativa destacada. No pé: nome, e-mail e plano vindos do login real (nada fixo).
- **Coluna 2 (290px):** busca + conversas reais agrupadas em Hoje / Ontem / Esta semana / Mais antigas, com título, prévia e hora. Vazio → "Nenhuma conversa ainda" + "+ Novo chat".
- **Coluna 3:** o chat ocupa o resto. Cabeçalho compacto com o nome da conversa e "Multiplex". Mensagens com avatar, markdown, listas e links. Compositor de 64px que cresce sozinho; Enter envia, Shift+Enter quebra linha. Ações rápidas discretas embaixo. Produtos vindos de busca real aparecem em cards com imagem, preço e disponibilidade.
- Tela nova: "Como posso ajudar?" com subtexto curto, sem título gigante.
- Tablet: colunas recolhíveis. Celular: uma área por vez, com gavetas.
- Visual escuro sofisticado, reaproveitando os componentes e tokens que já existem — sem gradientes, brilhos ou neon.

### 5. Conversas reais e título automático
"+ Novo chat" cria conversa de verdade (empresa, usuário, agente, datas, título). O título é gerado a partir do conteúdo real depois das primeiras mensagens; nunca fica "Novo chat" com conteúdo dentro.

### 6. Identidade
Empresa e instrução do agente renomeadas para Multiplex no seu Supabase, mantendo o catálogo. Em nenhum lugar aparece "Multiplex IA", nem menção a GPT/Claude/Gemini.

### 7. Testes antes de dizer que está pronto
- Cinco mensagens reais: "oi", "qual modelo é vc?", "como funciona?", "quais produtos tenho?", "quero cadastrar um cliente" — cada uma passando pela IA real, com identificador da resposta, tokens e motor conferidos no banco.
- Cadastro de cliente e criação de pedido conferidos direto nas tabelas.
- Isolamento entre empresas: sem sessão → 401; empresa forjada → recusa.
- Navegador em 1920x1080, 1440x900, tablet e celular, com a rede aberta para confirmar zero 404.

## Detalhes técnicos
- Todo backend novo entra como rota TanStack (`src/routes/api/...`) ou server function, usando os módulos já existentes em `src/lib/multiplex/*`. Nenhum servidor paralelo.
- Migration `db/007_customers_orders.sql`: GRANTs explícitos, RLS ligado e policies por `company_users`, aplicada via `psql` no projeto `mbjqzjipiuwtgmoxsqfu`.
- Ferramentas da IA registradas no pipeline atual (`pipeline.server.ts`) com esquemas estritos; empresa sempre derivada da sessão no servidor.
- `App.tsx` substituído por um shell enxuto com rotas dedicadas por seção; `LandingChatPage` reaproveitado para o chat público.
- Sem fallback textual: falha de IA vira erro visível, nunca resposta fingida.

## Relatório final
Ao terminar entrego: endereços 404 e a causa de cada um, correções feitas, origem da identidade da hamburgueria, confirmação da remoção de "Multiplex IA", motor real usado, arquivos alterados, testes executados com resultados e o que ficou pendente.
