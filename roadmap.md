# Multiplex — roadmap de execução

## Fase 0 — Inventário
- [ ] Matriz arquivo | usado por | função | ativo? | pode remover?
- [ ] Mapear as 11 rotas 404: chamador, equivalente real, ação

## Fase 1 — 404
- [ ] Reapontar chamadas para implementação real quando existir
- [ ] Remover chamada morta + tela sem funcionalidade
- [ ] Registrar PENDENTE quando faltar backend (sem endpoint de fachada)

## Fase 2 — Remoções com prova
- [ ] Provar que legacy-backend/ e src/server/services/ estão mortos antes de remover

## Fase 3 — Identidade
- [ ] "MULTIPLEX" na UI; nada de "Multiplex IA"/GPT/Claude/Gemini
- [ ] Identidade da empresa sempre do tenant autenticado
- [ ] NÃO renomear Hamburgueria no Supabase sem confirmação

## Fase 4-6 — IA real
- [ ] Remover fallbacks genéricos
- [ ] Rastro: response.id, response.model, tokens, latência, finish_reason
- [ ] Comparar resposta original vs banco vs frontend (hash)
- [ ] Contexto seletivo (histórico limitado, knowledge/memória por relevância)

## Fase 7 — Banco
- [ ] Migration aditiva customers/orders/order_items + RLS + GRANTs (após validação)

## Fase 8 — Ferramentas reais
- [ ] search_products, get_product, create_customer, update_customer, search_customers,
      create_order, get_order, search_orders, summarize_operations
- [ ] IA pergunta quando falta informação

## Fase 9-10 — Interface
- [ ] 3 colunas (230px / 290px / chat), perfil real, conversas reais agrupadas
- [ ] Novo chat real, título automático, contexto isolado

## Fase 11-14 — Conversa e design
- [ ] Todo campo de conversa ligado ao Agent Core
- [ ] Dark profissional, componentes existentes, responsivo

## Fase 15-18 — Testes
- [ ] 7 mensagens reais com prova completa
- [ ] Segurança: 401/403/404/company forjado/isolamento A-B
- [ ] Zero 404 nas rotas usadas (desktop/tablet/mobile)

## Fase 19 — Relatório
- [ ] IMPLEMENTADO / TESTADO / NÃO IMPLEMENTADO / PENDENTE / 404 / IA / IDENTIDADE /
      ARQUIVOS ALTERADOS / REMOVIDOS / BANCO / SEGURANÇA / REDE
