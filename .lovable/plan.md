# Interface de conversa limpa para o Multiplex IA

## Objetivo
Transformar a primeira tela em uma experiência de conversa direta, inspirada na simplicidade do ChatGPT, sem página promocional, métricas, promessas comerciais ou informações inventadas.

## Mudanças
- Substituir a página pública atual por um chat ocupando a tela inteira.
- Remover da primeira tela: slogan comercial, estatísticas, lista de recursos, canais anunciados, oferta grátis, chamadas de venda e rodapé promocional.
- Manter apenas a identidade discreta “Multiplex IA”, a conversa, o campo de mensagem e controles essenciais.
- Usar uma abertura neutra e curta, sem afirmar capacidades ou dados que não estejam confirmados.
- Fazer o painel autenticado abrir diretamente em “Novo chat”, em vez do dashboard.
- Simplificar a área de conversa autenticada: mensagens legíveis, resposta da IA sem balão colorido, mensagem do usuário com contraste adequado e campo de envio fixo e espaçoso.
- Preservar histórico, criação de novo chat e acesso às demais áreas pela barra lateral, sem exibi-las no centro da experiência.
- Ajustar a experiência para celular e computador, mantendo o foco na conversa.

## Comportamento preservado
- O envio continuará usando a integração de IA já existente.
- As respostas, ações e resultados retornados pela IA continuarão aparecendo na conversa.
- Nenhuma nova promessa, número, preço ou capacidade será criada.

## Detalhes técnicos
- Compor a conversa com os componentes oficiais AI Elements disponíveis para mensagens, rolagem, campo de texto e estado de processamento.
- Aplicar cores e espaçamentos pelos estilos globais do projeto, removendo o excesso de estilos locais e efeitos decorativos.
- Atualizar o título e a descrição da página para refletirem uma assistente de IA, sem alegações comerciais não verificadas.
- Validar envio, nova conversa, alternância de tema e apresentação em tamanhos de tela diferentes.
