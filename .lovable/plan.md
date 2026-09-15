# Auditoria definitiva da IA real do Multiplex

## Objetivo
Garantir, com evidência técnica e testes reais, que cada mensagem percorra **frontend → backend → Agent Core → OpenAI → Supabase externo → frontend**, sem respostas fictícias, sem mascarar falhas e sem vazar dados entre empresas.

## Constatações confirmadas no código atual
- O chat ativo chama `POST /api/ai/conversation/chat`, que delega para `runMultiplexTurn` e usa `@ai-sdk/openai` na Responses API.
- A resposta da OpenAI é aguardada por completo e devolvida em JSON; hoje não há streaming até a tela.
- O código registra o modelo solicitado pelo roteador, mas não prova o `response.model` efetivamente devolvido pela OpenAI, nem registra `response.id` ou `finish_reason`.
- Os nomes de modelo atuais são definidos no código; serão validados em chamada real antes de qualquer afirmação sobre o modelo usado.
- O contexto envia, em toda mensagem, até 200 produtos, 20 horários, 40 FAQs e o histórico recebido, mesmo quando esses dados não são relevantes.
- `knowledge_base`, `knowledge_items`, `knowledge_documents` e `agent_memory` existem no schema, mas não alimentam o pipeline ativo. Não há RAG seletivo hoje.
- O chat web não persiste conversas e mensagens nas tabelas correspondentes; guarda o histórico no navegador e reenvia até 12 mensagens.
- O frontend ainda possui fallback textual (`Compreendido.`) e mensagens genéricas de erro que podem esconder contrato quebrado ou falha da IA.
- Existem serviços antigos com respostas hardcoded em `src/server/services/ai` e uma cópia em `legacy-backend`; eles não fazem parte do endpoint ativo, mas confundem a auditoria e podem voltar a ser usados por engano.
- Falha crítica de isolamento: chat e administração usam o cliente privilegiado do Supabase e aceitam `companyId` do navegador sem autenticar o vínculo do usuário. A administração permite consultar e alterar outra empresa ativa.
- A tabela `ai_usage` existente é apenas um agregado diário e não atende ao registro por mensagem solicitado; o orçamento mensal também não é aplicado pelo pipeline.
- As migrations versionadas habilitam RLS em várias tabelas sem políticas por empresa. A aplicação depende hoje do cliente privilegiado e de filtros manuais.

## Implementação

### 1. Fechar o isolamento por empresa
- Para usuários logados, validar o bearer token do Supabase externo e derivar `company_id` exclusivamente de `company_users`; ignorar qualquer `companyId` enviado pelo navegador.
- Proteger `/api/admin/ai-routing` por sessão e função administrativa da empresa.
- Para o chat público escolhido pelo usuário, usar uma identificação pública de empresa configurada e resolvida no servidor, sem aceitar UUID arbitrário do navegador; permitir somente o contexto público necessário.
- Revisar todas as rotas irmãs que usam `resolveCompanyId` e o cliente privilegiado.
- Criar migrations idempotentes com grants e políticas RLS multi-tenant adequadas, preservando o Supabase externo como único banco.

### 2. Tornar o Agent Core verificável
- Refatorar o pipeline ativo sem criar um segundo backend.
- Capturar da resposta real: `response.id`, `response.model`, tokens de entrada/saída/cache/total e `finish_reason`.
- Registrar metadados seguros de request: conversa, mensagem, agente, empresa, modelo solicitado, quantidade de mensagens, tamanhos do prompt/contexto, itens recuperados, memórias e ferramentas.
- Nunca registrar chaves, bearer tokens, senhas ou credenciais.
- Preservar a identidade pública “Multiplex IA”; detalhes técnicos ficam somente na auditoria administrativa.

### 3. ContextBuilder seletivo
- Classificar a intenção antes de buscar contexto.
- Catálogo: buscar somente produtos/categorias relevantes à pergunta, com limite pequeno e fallback explícito quando não houver dado.
- Horários e FAQ: carregar somente para perguntas relacionadas.
- Knowledge/RAG: recuperar registros ativos da empresa por busca textual seletiva, ranquear e limitar os trechos; não enviar documentos inteiros.
- Memória: recuperar somente fatos relevantes da empresa/cliente/conversa.
- Histórico: combinar mensagens recentes, mensagens relevantes e resumo persistido quando a conversa crescer; aplicar orçamento de contexto mensurável.
- Não inventar informação ausente e não enviar catálogo, banco, knowledge ou memória completos.

### 4. Persistência e trilha de comparação
- Persistir conversa e mensagens reais no Supabase externo, com IDs UUID e vínculo obrigatório à empresa/usuário ou sessão pública autorizada.
- Garantir a sequência auditável: texto original OpenAI → resposta do backend → mensagem salva → resposta HTTP → texto renderizado.
- Evoluir `ai_usage` para registro por mensagem com `company_id`, `agent_id`, `conversation_id`, `message_id`, modelo real, tokens de entrada/cache/saída/total, custo estimado e data.
- Manter agregações administrativas derivadas dos registros reais, sem duplicar desnecessariamente o texto completo em tabelas de log.

### 5. Erros e fallbacks honestos
- Remover `Compreendido.`, `response_text` legado e qualquer fallback que se passe por resposta da IA.
- Se todos os modelos falharem, persistir status, request id quando disponível e erro técnico seguro; devolver erro controlado ao frontend.
- Exibir a falha como erro de serviço, não como mensagem da Multiplex IA.
- Manter fallback apenas entre modelos reais e registrar cada tentativa, modelo efetivamente respondente e motivo da troca.
- Isolar/remover do caminho de produção os serviços antigos e respostas hardcoded comprovadamente órfãos.

### 6. Ferramentas reais
- Definir ferramentas do Agent Core com schemas estreitos e autorização no servidor.
- A solicitação “Quero cadastrar um cliente” deve acionar uma ferramenta real, solicitar confirmação antes da escrita e persistir somente na empresa autenticada.
- Registrar ferramenta, status, parâmetros não sensíveis e resultado; nunca declarar sucesso sem confirmação do Supabase.

### 7. Administração
- Mostrar somente a administradores: modelo efetivamente retornado, response id, finish reason, tokens detalhados, custo, latência, contexto recuperado, ferramentas, fallback e erros.
- Manter nome/modelo ocultos no chat público e no chat comum.
- Calcular custo apenas com preços configurados ou preços oficiais verificados; caso contrário mostrar “preço não configurado”.

## Validação real
- Consultar o estado real do Supabase externo: tabelas, policies, grants, triggers e dados recentes de uso, antes da migration.
- Executar testes end-to-end reais para:
  1. “Oi”
  2. “Qual o valor?”
  3. “Como funciona?”
  4. “Quero cadastrar um cliente.”
  5. “Quais produtos vocês vendem?”
- Em cada teste, conferir request do frontend, request ao provider, `response.id`, `response.model`, resposta original, tokens, finish reason, linha persistida, HTTP e texto exibido.
- Confirmar respostas semanticamente diferentes, contexto relevante, ausência de resposta genérica e ausência de nome técnico na interface comum.
- Testar conversa longa com continuidade e medir a redução de tokens sem perda de contexto.
- Testar isolamento com duas empresas: usuário de uma não lê nem altera conversas, catálogo, knowledge, clientes, configurações ou auditoria da outra.
- Testar falha real da OpenAI e confirmar que nenhum texto fictício substitui o erro.

## Entrega A–K
Relatório final com: local da chamada OpenAI, modelo real comprovado, endpoint, problemas encontrados, hardcodes/fallbacks, transformações da resposta, tokens, montagem do contexto, arquivos alterados, testes executados e resultado individual de cada teste.
