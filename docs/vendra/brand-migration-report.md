# VENDRA by BonaSoft — Relatório de Migração de Marca

## 1. Sumário Executivo

Este documento formaliza a migração completa da identidade visual e nomenclatura comercial do projeto para **VENDRA** com assinatura institucional **by BonaSoft**.

A transformação foi realizada de forma cirúrgica, atualizando todas as interfaces públicas, cabeçalhos, metadados, títulos, prompts de IA voltados ao usuário e documentos de apresentação, ao mesmo tempo em que preservou integralmente a compatibilidade de código, bancos de dados, integrações e o motor técnico subjacente **Multiplex AI**.

---

## 2. Tabela Comparativa de Identidade

| Elemento | Identidade Anterior | Nova Identidade Oficial |
| :--- | :--- | :--- |
| **Marca Principal** | BonaSoft Commerce | **VENDRA** |
| **Assinatura / Chancela** | BonaSoft | **by BonaSoft** |
| **Slogan Principal** | "Seu negócio. Uma plataforma. Controle total." | **"Seu negócio. Seu próximo nível."** |
| **Mensagem Complementar** | N/A | **"Uma plataforma. Todas as operações. Mais possibilidades."** |
| **Sistema ERP** | BonaSoft Commerce ERP | **Vendra ERP** |
| **Frente de Caixa (PDV)** | BonaSoft Commerce PDV | **Vendra POS** |
| **App Operacional** | Aplicativo Gestor | **Vendra Mobile** |
| **Portal E-commerce** | Catálogo Online | **Vendra Store** |
| **Inteligência Artificial** | BonaSoft Commerce AI | **Vendra AI** (powered by Multiplex) |
| **Logo / Monograma** | BS | **V** (Esmeralda no fundo Deep Obsidian) |
| **Comprovante de Venda** | `BONASOFT COMMERCE - FRENTE DE CAIXA` | `VENDRA POS - FRENTE DE CAIXA\nby BonaSoft` |

---

## 3. Auditoria de Arquivos Alterados

### 3.1 Aplicação Principal e Rotas
- `src/routes/__root.tsx`: Atualização de metadados globais, OpenGraph, Twitter Cards e título base da aplicação para "VENDRA | Plataforma Inteligente de Gestão Comercial e ERP by BonaSoft".
- `src/routes/index.tsx`: Reformulação completa da Landing Page Cinematográfica com a marca VENDRA, apresentação dos 5 produtos (ERP, POS, Mobile, Store, AI), seletor de segmentos com domínios `*.vendra.com`, planos STARTER (€29), BUSINESS (€59) e PREMIUM (€129) e rodapé institucional.
- `src/routes/entrar.tsx`: Tela de autenticação com monograma `V`, tipografia VENDRA, chancela "by BonaSoft" e slogan "Seu negócio. Seu próximo nível.".
- `src/routes/app.tsx`: Tela de transição para o ecossistema VENDRA by BonaSoft.
- `src/routes/inicio.tsx`: Título e metadados atualizados para "Painel Geral | VENDRA ERP".
- `src/routes/pdv.tsx`: Frente de caixa com metadados e cabeçalho "Vendra POS by BonaSoft".
- `src/routes/catalogo.tsx`: Título e metadados atualizados para "Catálogo de Produtos | VENDRA ERP".
- `src/routes/pedidos.tsx`: Título e metadados atualizados para "Gestão de Pedidos | VENDRA ERP".
- `src/routes/clientes.tsx`: Título e metadados atualizados para "Clientes & CRM | VENDRA ERP".
- `src/routes/integracoes.tsx`: Título e metadados atualizados para "Canais & Integrações | VENDRA ERP".
- `src/routes/conversas.tsx`: Título e metadados atualizados para "Vendra AI | Assistente Inteligente Empresarial".
- `src/routes/empresa.tsx`: Atualização de cabeçalhos de configurações para VENDRA ERP e Vendra AI.
- `src/routes/admin.ai-routing.tsx`: Painel de auditoria do motor técnico atualizado para "Auditoria Vendra AI | Motor Multiplex by BonaSoft".

### 3.2 Componentes e Camada de Domínio
- `src/components/multiplex/AppShell.tsx`: Barra de navegação com monograma `V`, marca VENDRA by BonaSoft e atalho para "Nova conversa Vendra AI".
- `src/components/multiplex/ChatWorkspace.tsx`: Hero e tela vazia do assistente apresentando "Vendra AI by BonaSoft · Assistente Inteligente Empresarial".
- `src/lib/commerce/pdv/transaction.server.ts`: Cabeçalho do cupom térmico atualizado para `VENDRA POS - FRENTE DE CAIXA by BonaSoft` e rodapé `VENDRA Cloud by BonaSoft`.
- `src/lib/multiplex/pipeline.server.ts`: Prompt de identidade da IA atualizado:
  > *"Você é o Vendra AI, assistente inteligente empresarial do VENDRA (desenvolvido pela BonaSoft), impulsionado pelo motor de inteligência artificial Multiplex."*
- `src/lib/commerce/contracts.ts`, `attributes.ts`, `company-segments.ts`, `segments.ts`, `pdv/cart.ts`, `pdv/cash-register.ts`, `pdv/money.ts`: Cabeçalhos e documentação de código alinhados à marca VENDRA (by BonaSoft).

### 3.3 Testes Automatizados
- `tests/commerce-segments.test.ts`: Títulos das suítes de teste alinhados a "VENDRA (by BonaSoft)".
- `tests/pdv-transactional.test.ts`: Validação de emissão de comprovante atualizada para conferência estrita de `"VENDRA POS - FRENTE DE CAIXA"`.

---

## 4. Preservações Técnicas Obrigatórias

Conforme estipulado nas diretrizes do projeto, as seguintes referências e estruturas técnicas foram **estritamente preservadas** para manter compatibilidade binária e integridade de dados:

1. **Diretório do Motor de IA**: `src/lib/multiplex/` mantido inalterado.
2. **Nome Interno do Motor**: "Multiplex" e "Multiplex AI Engine" preservados em arquivos técnicos, contratos internos e no `admin.ai-routing.tsx`.
3. **Variáveis de Ambiente**: `MULTIPLEX_SUPABASE_URL`, `MULTIPLEX_SUPABASE_PUBLISHABLE_KEY`, etc.
4. **Tabelas do Banco de Dados**: `companies`, `company_users`, `products`, `orders`, `order_items`, `payments`, `customers`, `channels`, etc.
5. **Rotas de API REST**: `/api/company/...`, `/api/ai/...`, etc. mantidas idênticas para não quebrar integrações existentes.
6. **Bancos de Dados Protegidos**: Nenhuma migration destrutiva foi executada no banco de dados.

---

## 5. Resultados de Validação e Qualidade

- **Testes Unitários e de Integração**: **60 testes aprovados** (100% de sucesso em 6 arquivos de teste).
- **Verificação Estrita TypeScript**: `npx tsc --noEmit` executado com código de retorno 0.
- **Backend Build**: `npm run build:backend` executado com código de retorno 0.
- **Frontend & SSR Build**: `npm run build` gerando todos os artefatos de produção em `.output/` sem qualquer advertência impeditiva.
- **Sincronização Git**: Commit gerado e enviado aos remotos `origin` e `gravity-hug` na branch `main`.
