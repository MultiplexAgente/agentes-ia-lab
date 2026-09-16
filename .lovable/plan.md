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

**Origem de "Hamburgueria Artesanal Anthony":** não é código nem resposta inventada. Está no seu Supabase — a empresa `1111...1111` chama-se "Hamburgueria Artesanal Anthony" e a instrução do agente `2222...2222` começa com "Você é o assistente virtual da Hamburgueria Artesanal Anthony". O nome entra no contexto enviado ao modelo porque é a empresa do tenant autenticado. **Nada será renomeado no banco sem sua confirmação** de que essa empresa é só teste/seed.

**"Multiplex IA" na interface:** já não aparece em nenhum arquivo do app. Restam textos institucionais em documentos e no código antigo — serão limpos. Nomes técnicos internos (tabelas, colunas, variáveis, endereços) ficam como estão.

## O que vou fazer

### 0. Inventário antes de qualquer alteração
Levanto tudo primeiro — telas, rotas, funções de servidor, banco, autenticação, políticas de acesso, integrações, componentes e o núcleo do agente — e monto uma matriz interna: arquivo | usado por | função | ativo? | pode remover? Nenhum arquivo é apagado nessa fase. Só avanço depois que a matriz estiver completa, e cada remoção posterior entra no relatório com a prova de que estava morto.

### 1. Fim dos 404, uma rota por vez (sem mock, sem endpoint de fachada)
Para cada um dos 11 endereços, decido nesta ordem:
1. **Existe implementação real equivalente hoje?** Se sim (catálogo, logs de conversa, configurações de empresa), aponto a tela para ela. Nada novo é criado.
2. **Não existe e a tela também não tem funcionalidade real?** Removo apenas a chamada morta e a tela vazia.
3. **A tela tem funcionalidade real mas falta o backend?** Mantenho a tela e registro como PENDENTE no relatório, com o que falta. Não crio endpoint só para virar 200, nem preencho com dado inventado.

Nenhum código funcional é apagado. O código antigo (`legacy-backend/`, `src/server/services/…`) só sai depois de eu confirmar, arquivo por arquivo, que nada ativo o usa. A prova é a rede do navegador: zero 404 nas rotas ainda usadas.

### 2. Tabelas que faltam (clientes e pedidos) — só depois do seu OK
Antes de tocar no banco, eu te mostro exatamente o que vai ser criado e confirmo que nada existente é alterado ou apagado. A mudança é **apenas aditiva**: três tabelas novas (`customers`, `orders`, `order_items`) com empresa obrigatória, permissões e políticas por vínculo em `company_users`. Nenhuma tabela existente é alterada, nenhuma linha é removida, nenhuma linha de exemplo é inserida — começa vazio.

### 3. Ferramentas reais da IA
Nove ferramentas ligadas ao seu banco: buscar produtos, ver produto, cadastrar cliente, atualizar cliente, buscar clientes, criar pedido, ver pedido, buscar pedidos e resumir a operação. Cada uma com esquema estrito, validação, autenticação, autorização, empresa derivada da sessão no servidor, tratamento de erro e registro em auditoria. Sem dados no banco, a resposta é o estado vazio honesto — nunca um número inventado.

**A IA pergunta antes de agir.** Faltando informação, ela pede: "Qual o nome do cliente?", depois telefone, e-mail, confirma e só então executa. Nunca completa um cadastro ou pedido com valor inventado, e nunca inventa produto.

### 4. Nova interface de três colunas
- **Coluna 1 (230px):** MULTIPLEX, "+ Novo chat", e apenas o que existe: Início, Conversas, Clientes, Catálogo, Pedidos, Integrações, Configurações. Página ativa destacada. No pé: nome, e-mail e plano vindos do login real (nada fixo).
- **Coluna 2 (290px):** busca + conversas reais agrupadas em Hoje / Ontem / Esta semana / Mais antigas, com título, prévia e hora. Vazio → "Nenhuma conversa ainda" + "+ Novo chat".
- **Coluna 3:** o chat ocupa o resto. Cabeçalho compacto com o nome da conversa e "Multiplex". Mensagens com avatar, markdown, listas e links. Compositor de 64px que cresce sozinho; Enter envia, Shift+Enter quebra linha. Ações rápidas discretas embaixo. Produtos vindos de busca real aparecem em cards com imagem, preço e disponibilidade.
- Tela nova: "Como posso ajudar?" com subtexto curto, sem título gigante.
- Tablet: colunas recolhíveis. Celular: uma área por vez, com gavetas.
- Visual escuro sofisticado, reaproveitando os componentes e tokens que já existem — sem gradientes, brilhos ou neon.

### 5. Conversas reais, título automático e IA em todo campo de conversa
- "+ Novo chat" cria conversa de verdade (empresa, usuário, agente, datas, título). Clicar numa conversa existente abre aquela; contextos nunca se misturam.
- O título é gerado a partir do conteúdo real depois das primeiras mensagens; nunca fica "Novo chat" com conteúdo dentro.
- Todo campo onde você escreve para o Multiplex fala com a IA real: cria conversa se não houver ativa, continua a existente quando há contexto, salva a mensagem, atualiza o histórico. Nunca reaproveita silenciosamente outra conversa.

### 5b. Contexto enviado ao modelo
Medição do que vai em cada turno: instrução do sistema, histórico, memória, conhecimento, ferramentas, catálogo e dados da empresa/agente. O banco nunca vai inteiro: histórico com limite, conhecimento e memória por relevância, catálogo consultado por ferramenta só quando a pergunta pede.

### 6. Identidade
- Na interface, o produto e o assistente aparecem apenas como **MULTIPLEX**. Nunca "Multiplex IA", nunca menção a GPT/Claude/Gemini.
- A identidade da empresa e do agente vem sempre do tenant autenticado, lida do banco no servidor. Nenhum nome de empresa fica fixo no código nem serve de identidade global.
- Nada é renomeado no banco. Se você confirmar que a Hamburgueria é só seed, aí sim eu ajusto.

### 7. Fallbacks genéricos
Varredura por `defaultResponse`, `fallbackResponse`, `genericResponse`, `safeResponse`, `assistantResponse`, `defaultMessage`, `fallbackMessage` e por frases tipo "Entendido…", "Posso ajudar você…", "Como você deseja prosseguir…". Tudo que substitua a resposta real é removido; falha da IA vira erro visível.

### 8. Provas antes de dizer que está pronto
Rastreio completo, camada por camada: usuário → tela → servidor → núcleo do agente → provedor → `response.id` → `response.model` → tokens → resposta original → banco → tela. Comparo por hash a resposta original com a gravada no banco e com a exibida, provando que nenhuma camada troca o texto. Registro também conversa, mensagem, agente, empresa, provedor, tempo de resposta e motivo de término — nunca chaves, senhas, cookies ou segredos.

- Sete mensagens reais: "oi", "qual modelo é vc?", "como funciona?", "quais produtos tenho?", "quero cadastrar um cliente", "quero criar um pedido", "consulte meus pedidos". Para cada uma: status HTTP, `response.id`, `response.model`, tokens, conteúdo, conversa, mensagem, registro no banco e o que aparece na tela.
- Catálogo: com produtos, responde os reais; sem produtos, diz que não há cadastrados.
- Cadastro de cliente e criação de pedido conferidos direto nas tabelas.
- Segurança: sem sessão → 401; sem permissão → 403; recurso inexistente → 404; empresa forjada → recusa; empresa A tentando ler B → recusa. As políticas do banco barram mesmo se a tela tiver bug.
- Navegador em 1920x1080, 1440x900, tablet e celular, percorrendo Início, Conversas, Clientes, Catálogo, Pedidos, Integrações, Configurações, chat, novo chat e busca, com a rede aberta: zero 404 nas rotas usadas. Nenhum erro escondido por interceptador.

Só considero concluído com todos estes itens verificados: Supabase real, autenticação real, políticas de acesso reais, núcleo do agente real, provedor e motor real identificados, `response.id` e tokens comprovados, resposta original comparada com a exibida, sem fallback textual, sem mock, sem dado falso, clientes/pedidos/catálogo reais, ferramentas reais, conversas persistidas, novo chat funcionando, contexto entre mensagens, IA perguntando quando falta informação, multi-empresa testado, zero 404 nas rotas usadas, desktop/tablet/celular testados e relatório entregue. Build passar ou página abrir não conta.

## Detalhes técnicos
- Todo backend novo entra como rota TanStack (`src/routes/api/...`) ou server function, usando os módulos já existentes em `src/lib/multiplex/*`. Nenhum servidor paralelo.
- Migration `db/007_customers_orders.sql`: GRANTs explícitos, RLS ligado e policies por `company_users`, aplicada via `psql` no projeto `mbjqzjipiuwtgmoxsqfu`.
- Ferramentas da IA registradas no pipeline atual (`pipeline.server.ts`) com esquemas estritos; empresa sempre derivada da sessão no servidor.
- `App.tsx` dá lugar a um shell enxuto com rotas dedicadas por seção, migrando o que tem implementação real; `LandingChatPage` segue no chat público.
- Sem fallback textual: falha de IA vira erro visível, nunca resposta fingida.
- Nenhuma tabela, coluna, variável ou endereço interno é renomeado por causa da identidade visual.

## Relatório final
Entrego em blocos separados, na ordem:

**IMPLEMENTADO** (funcionalidade, arquivos, banco, API, teste, resultado) · **TESTADO** (teste, entrada, resultado, status, com `response.id`, `response.model` e tokens quando cabível) · **NÃO IMPLEMENTADO** · **PENDENTE** (o que depende de confirmação, credencial, integração externa ou decisão) · **404** (endereço, causa, destino, ação) · **IA** (provedor, motor, `response.id`, tokens de entrada/saída/total) · **IDENTIDADE** (produto visual = MULTIPLEX e de onde veio a identidade da empresa autenticada) · **ARQUIVOS ALTERADOS** · **ARQUIVOS REMOVIDOS** (com justificativa e prova de que estavam mortos) · **BANCO** (migrations, tabelas, políticas, confirmação de zero dado falso) · **SEGURANÇA** (401, 403, 404, políticas, isolamento entre empresas) · **REDE** (quantidade de 404 antes e depois).

Nada entra em IMPLEMENTADO sem teste real.
