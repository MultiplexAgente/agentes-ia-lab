# Multiplex IA: backend real, roteamento automático e WhatsApp

## Arquitetura atual encontrada

- A aplicação visível roda em TanStack Start, mas não possui rotas `/api/*` ativas. As telas chamam endpoints que existem apenas no backend Express legado, que não é iniciado pelo projeto atual.
- Há duas cópias dos serviços (`legacy-backend/` e `src/server/`). Ambas usam principalmente mapas em memória; por isso catálogo, produtos, conversas e logs não persistem e aparecem vazios.
- Existem três motores separados de conversa (público, administrativo e atendimento), todos acoplados diretamente à OpenAI. Não existe `AIModelRouter` nem abstração real de providers.
- O fluxo atual contém modelos antigos/hardcoded, tokens fictícios, custo não calculado e fallbacks com respostas prontas. Isso impede auditoria confiável.
- O esquema Supabase já prevê empresas, agentes, catálogo, conversas, mensagens, memória, knowledge, tools e logs, mas as migrations não têm grants/policies multi-tenant utilizáveis e incluem dados demonstrativos inventados.
- WhatsApp já possui parser e envio pela Meta Cloud API, porém está preso ao Express inativo e retorna sucesso simulado quando faltam credenciais.
- O frontend envia um `companyId` fixo; não existe autenticação real derivando a empresa da sessão.

## O que será reutilizado

- Interface limpa atual com identidade pública “Multiplex IA” e AI Elements.
- Conceitos existentes de conversas, mensagens, catálogo, memória, knowledge e tools.
- Definições úteis do `ToolRegistry`, busca de catálogo e estrutura do adaptador WhatsApp, após remover dados e sucessos simulados.
- Estrutura SQL existente como referência, corrigindo segurança, dados fictícios e compatibilidade com o Supabase externo `mbjqzjipiuwtgmoxsqfu`.

## Implementação

### 1. Conectar o Supabase externo com segurança

- Configurar URL, chave pública e chave de serviço do projeto externo somente no ambiente seguro do backend.
- Criar os clientes Supabase adequados para navegador, usuário autenticado e operações administrativas.
- Implantar migrations incrementais com grants, RLS e políticas por empresa; não reaplicar o seed fictício da hamburgueria.
- Criar vínculo seguro entre usuário autenticado e empresa; remover a confiança em `companyId` recebido do navegador.
- Migrar catálogo, produtos, conversas, mensagens, memória, knowledge e logs do armazenamento em memória para o Supabase.

### 2. Ativar o backend TanStack

- Portar apenas os endpoints realmente usados para rotas/server functions TanStack; o Express legado deixará de ser a dependência de produção.
- Centralizar o fluxo de conversa em um único Agent Core compartilhado pelo chat web e pelo WhatsApp.
- Manter histórico completo persistido e montar apenas contexto relevante por solicitação.
- Retornar erros reais da IA e dos canais; remover respostas genéricas ou sucessos simulados.

### 3. Criar o `AIModelRouter`

- Classificar cada mensagem nas categorias solicitadas: conversa simples, pergunta, texto longo, documento, resumo, raciocínio, comparação, código, dados, visão, catálogo, produto, imóvel, comercial, suporte, ferramenta, saída estruturada, tarefa complexa e desconhecida.
- Avaliar complexidade e capacidades obrigatórias: visão, contexto longo, ferramentas, raciocínio, estrutura, precisão e conhecimento externo.
- Criar catálogo interno somente com IDs reais e disponíveis; providers sem credencial ou sem disponibilidade ficarão como “não configurados”.
- Implementar estratégias por empresa: `QUALITY_FIRST`, `BALANCED`, `SPEED_FIRST` e `COST_FIRST`, sem sacrificar capacidades obrigatórias.
- Selecionar automaticamente entre os modelos OpenAI suportados e configurados que você nomeou, validando uma chamada real antes de habilitar cada opção.
- Executar via Responses API com streaming, histórico completo e tool calling; registrar o `response.model` real retornado.
- Criar fallback apenas entre modelos compatíveis. Nenhuma resposta hardcoded será usada como fallback.

### 4. Contexto, tools e dados reais

- Criar um `ContextBuilder` único para histórico recente, resumo, memória, knowledge, identidade, regras, empresa e resultados de ferramentas.
- Fazer perguntas sobre catálogo, preço e disponibilidade consultarem o Supabase antes da resposta.
- Manter contexto mesmo quando o modelo muda dentro da conversa.
- Deixar anexos/documentos preparados para pipelines específicos; nesta entrega, somente capacidades realmente suportadas e testadas serão habilitadas.

### 5. Observabilidade e área administrativa

- Registrar por execução: empresa, agente, conversa, mensagem, categoria, complexidade, provider, modelo solicitado, `response.model`, motivo, esforço de raciocínio, tokens reais, custo estimado, latência, fallback e ferramentas.
- Criar a área “AI Routing” para administradores, com filtros, detalhes por mensagem, custos, tokens, latência e fallback.
- Permitir ao administrador ajustar a estratégia de routing por empresa e habilitar/desabilitar modelos disponíveis.
- O nome técnico do modelo será visível somente nessa área administrativa. No chat, o usuário verá apenas “Multiplex IA”, “Pensando...” e uma explicação não técnica da escolha quando solicitada.

### 6. WhatsApp real

- Portar webhook público de verificação e recebimento da Meta para uma rota pública TanStack.
- Validar assinatura da Meta, garantir idempotência no Supabase e resolver a empresa pelo número/conta configurada — nunca por query string enviada externamente.
- Persistir cliente, conversa e mensagens de entrada/saída no mesmo conjunto mostrado pelo Multiplex.
- Passar mensagens recebidas pelo mesmo Router, ContextBuilder e tools do chat web.
- Enviar respostas pela API oficial e registrar falhas reais; sem modo mock.
- Nesta primeira entrega, Instagram e Telegram permanecem não configurados, conforme sua escolha de priorizar WhatsApp.

## Testes reais e comprovação

- Aplicar e validar as migrations no Supabase externo; confirmar RLS e isolamento entre empresas.
- Cadastrar um produto real informado por você ou já existente no banco; não criar catálogo fictício.
- Enviar conversas reais cobrindo tarefa simples, raciocínio e consulta de catálogo, demonstrando pelo menos três decisões justificáveis. Modelos diferentes só serão mostrados quando realmente selecionados e disponíveis.
- Demonstrar continuidade de contexto na sequência de busca de imóvel.
- Simular falha controlada do modelo principal e confirmar fallback compatível, sem texto pronto.
- Comparar seleção registrada com `response.model`, tokens, custo e latência reais.
- Testar webhook WhatsApp e confirmar que a conversa aparece no chat administrativo.
- Validar que usuários finais nunca recebem nome de provider/modelo e que administradores conseguem auditá-los.

## Credenciais necessárias durante a execução

- Supabase externo: URL do projeto, chave pública e chave de serviço do projeto `mbjqzjipiuwtgmoxsqfu`.
- WhatsApp Business: token de acesso, Phone Number ID, App Secret e verify token.
- A conexão de IA usará somente credencial segura no backend; nenhuma chave será enviada ao navegador, banco público, HTML ou logs.

As credenciais serão solicitadas em formulários seguros após a aprovação deste plano, nunca no chat.
