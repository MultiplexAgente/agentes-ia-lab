# MULTIPLEX — Ícone na saudação + GPT / CLAUDE / DEEPSEEK

## 1. Correção visual imediata

- O ponto verde some. No lugar dele, o ícone do Multiplex (a imagem `multiplex-atom` já existente no projeto) aparece **na mesma linha da frase**, à esquerda do texto: `[ícone] Como posso ajudar?`.
- O mesmo ícone passa a ser o avatar das respostas do Multiplex, substituindo as letras "MX".
- Tema escuro por padrão em todas as telas, com botão de troca para claro no topo.
- Os avisos de "entre na sua empresa" deixam de ser um bloco vermelho: passam a ser um aviso discreto com o botão Entrar, no padrão do resto do app.

## 2. Escolha do modelo: apenas 3 opções

Na conversa (troca rápida) e em Configurações (padrão da empresa), aparecem somente:

```text
┌──────────┐  ┌──────────┐  ┌────────────┐
│ GPT      │  │ CLAUDE   │  │ DEEPSEEK   │
└──────────┘  └──────────┘  └────────────┘
```

Nenhum nome técnico de modelo aparece para o usuário. A opção escolhida fica salva por usuário/empresa.

## 3. Como o sistema escolhe

- O modelo escolhido é **sempre o primeiro a responder** e é ele que gera a resposta final: conversa, decisões, uso de ferramentas, confirmações.
- Modelos auxiliares (mais rápidos/baratos) só entram em trabalho pesado de apoio: lotes grandes de texto, classificação, extração, resumo intermediário, preparação de contexto. O resultado volta para o modelo principal, que escreve a resposta.
- Nunca trocar o modelo principal por um mais barato. Troca só acontece por falha real (erro, indisponibilidade, limite de uso), registrada como "fallback" com motivo, provedor original e provedor usado.
- Modo automático existe internamente e só é usado quando a empresa ligar essa opção.

## 4. Um só cérebro para os três

Memória, conhecimento, catálogo, clientes, pedidos, permissões e histórico continuam sendo do Multiplex. Trocar de GPT para Claude ou DeepSeek no meio da conversa **não recomeça nada**: o contexto e a memória seguem. As mesmas 9 ferramentas já criadas valem para os três.

## 5. Chaves e segurança

- Vou pedir as chaves da Anthropic e da DeepSeek em formulário seguro; elas ficam somente no servidor.
- Nenhuma chave em tela, endereço, histórico do navegador ou registro. O app recebe apenas: qual opção está ativa e se está disponível.
- Se um modelo pedido não existir na conta, eu leio a lista real do provedor e uso o mais avançado disponível daquele mesmo serviço, registrando qual foi. Nada é inventado.

## 6. Registro e painel administrativo

Cada conversa passa a registrar provedor, modelo real, identificador da resposta, tokens de entrada/saída, custo estimado, tempo de resposta, tarefa identificada, motivo da escolha e se houve fallback. O painel administrativo passa a mostrar isso separado por GPT, CLAUDE e DEEPSEEK.

Para o custo sair em dinheiro, os preços por milhão de tokens de cada provedor ficam configuráveis em Configurações — sem isso, o custo continua marcado como não configurado.

## 7. Identidade

Na interface e nas respostas, o nome é **MULTIPLEX**. Nada de "Powered by GPT/Claude/DeepSeek". Se a empresa autorizar revelar o modelo, é mostrado o modelo real que atendeu — nunca um nome diferente do que respondeu.

## 8. Testes reais antes de dizer que está pronto

1. "Olá" em GPT, Claude e DeepSeek — conferindo provedor, modelo real, identificador da resposta e tokens.
2. Contexto: dizer o nome no GPT, perguntar de novo, trocar para Claude e depois DeepSeek — todos devem lembrar.
3. "Quais produtos tenho?" nos três — todos consultando o mesmo catálogo real.
4. Cadastro de cliente e criação de pedido — a IA pergunta o que falta e não inventa produto nem preço.
5. Trabalho pesado: modelo auxiliar processa, principal conclui.
6. Falha simulada de um provedor — fallback registrado com motivo.
7. Segurança: sem login 401, sem permissão 403, empresa falsa negada, nenhuma chave acessível pelo navegador.
8. Comparação resposta do provedor x banco x tela, e varredura para garantir zero resposta pronta escondida.
9. Telas em desktop, tablet e celular.

Relatório final separado em IMPLEMENTADO / TESTADO / NÃO IMPLEMENTADO / PENDENTE / ERROS, com provedor, modelo, identificador, tokens e tempo de cada teste.

## Detalhes técnicos

- Novo `src/lib/multiplex/model-registry.server.ts`: aliases `gpt` / `claude` / `deepseek` → `{ provider, modelId, tier, status, capabilities, contextWindow, toolCalling, vision, reasoning, streaming, latencyClass }` + `ModelPricingRegistry`. IDs configuráveis por tabela de configuração, nunca espalhados no código. Validação contra a API de cada provedor no boot da rota (lista de modelos), com resolução para o flagship disponível quando o ID pedido não existir; `deprecated`/`retired`/`disabled` nunca são escolhidos automaticamente.
- Provedores via AI SDK: `@ai-sdk/openai` (já instalado, Responses API), `@ai-sdk/anthropic`, `@ai-sdk/deepseek` (`https://api.deepseek.com`). Adapters normalizam tool calls para `{ id, name, arguments }`; `buildTools` e o Agent Core (`pipeline.server.ts`) continuam únicos.
- `router.server.ts` vira `AIModelRouter` + `TaskModelSelector`: classificação da tarefa (SIMPLE_CHAT, CATALOG_SEARCH, TOOL_EXECUTION, CREATE_ORDER, DOCUMENT_ANALYSIS, BATCH_PROCESSING, etc.), ordem de decisão capacidade → qualidade → confiabilidade → velocidade → custo, e prioridade absoluta do alias escolhido pelo usuário para a resposta final.
- Migração aditiva no Supabase externo: `user_ai_preferences` (user_id, company_id, primary_provider, primary_model_alias) com GRANTs e políticas por `is_company_member`; colunas novas em `ai_routing_audit`/`ai_usage` para `provider`, `model_alias`, `fallback_triggered`, `fallback_from`, `fallback_reason`, `task_type`, `routing_reason`. Nada é renomeado ou removido.
- Segredos `ANTHROPIC_API_KEY` e `DEEPSEEK_API_KEY` lidos apenas dentro dos handlers; rota única `/api/ai/conversation/chat` mantida.
- Fila simples `ai_background_jobs` para processamento pesado assíncrono, com resultado consultado pelo modelo principal.
