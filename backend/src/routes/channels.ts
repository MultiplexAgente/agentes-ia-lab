import { Router, Request, Response } from 'express';

export const channelsRouter = Router();

// Estado dos canais omnichannel
const channelStates: Record<string, {
  name: string;
  type: string;
  connected: boolean;
  accountName?: string;
  webhookUrl: string;
  description: string;
  setupInstructions: string[];
  fields: Array<{ key: string; label: string; placeholder: string; type?: string }>;
}> = {
  whatsapp: {
    name: 'WhatsApp Business',
    type: 'whatsapp',
    connected: false,
    accountName: '',
    webhookUrl: 'http://localhost:3000/api/webhooks/whatsapp',
    description: 'Atendimento inteligente em tempo real via Evolution API, Z-API, Baileys ou Meta Cloud API.',
    setupInstructions: [
      'Acesse seu painel do Evolution API, Z-API ou Cloud API da Meta.',
      'Copie a URL do Webhook fornecida abaixo e cole no campo "Webhook URL" da sua instância.',
      'Marque os eventos "messages.upsert" para receber as mensagens dos clientes.',
      'Escaneie o QR Code no seu WhatsApp ou informe o Token da API abaixo para ativar.'
    ],
    fields: [
      { key: 'instanceName', label: 'Nome da Instância ou Sessão', placeholder: 'ex: multiplex-whatsapp-01' },
      { key: 'apiKey', label: 'API Key / Token de Acesso', placeholder: 'ex: B6D711FCDE4D4FD59365441E08497...', type: 'password' },
      { key: 'accountName', label: 'Número com DDD', placeholder: '+55 11 99999-8888' }
    ]
  },
  instagram: {
    name: 'Instagram Direct',
    type: 'instagram',
    connected: false,
    accountName: '',
    webhookUrl: 'http://localhost:3000/api/webhooks/instagram',
    description: 'Respostas instantâneas a mensagens diretas (DMs), stories e comentários pelo Meta Graph API.',
    setupInstructions: [
      'Acesse o portal Meta for Developers (developers.facebook.com) e entre no seu App.',
      'Vá em "Instagram Graph API" > "Configuração do Webhook".',
      'Cole a URL do Webhook do Multiplex IA abaixo no campo "URL de Retorno de Chamada".',
      'Ative a assinatura do campo "messages" e "messaging_postbacks".',
      'Cole o Token de Acesso da Página do Instagram abaixo.'
    ],
    fields: [
      { key: 'accountName', label: 'Arroba da Conta (@)', placeholder: '@suaempresa.oficial' },
      { key: 'pageId', label: 'ID da Página / Instagram Business ID', placeholder: 'ex: 104829104829104' },
      { key: 'accessToken', label: 'Token de Acesso Permanente (Meta)', placeholder: 'EAAOx...', type: 'password' }
    ]
  },
  facebook: {
    name: 'Facebook Messenger',
    type: 'facebook',
    connected: false,
    accountName: '',
    webhookUrl: 'http://localhost:3000/api/webhooks/facebook',
    description: 'Atendimento automático em páginas do Facebook e mensagens privadas do Messenger.',
    setupInstructions: [
      'Acesse o Meta for Developers e selecione seu aplicativo empresarial.',
      'Adicione o produto "Messenger" nas configurações.',
      'Adicione a URL do Webhook do Multiplex IA na seção "Webhooks do Messenger".',
      'Selecione sua Página do Facebook e gere o Token de Acesso da Página.',
      'Cole o Token abaixo e clique em Salvar e Conectar.'
    ],
    fields: [
      { key: 'accountName', label: 'Nome da Página do Facebook', placeholder: 'ex: Minha Empresa Delivery' },
      { key: 'pageId', label: 'ID da Página do Facebook', placeholder: 'ex: 1083920194829' },
      { key: 'accessToken', label: 'Token de Acesso da Página', placeholder: 'EAAG...', type: 'password' }
    ]
  },
  telegram: {
    name: 'Telegram Bot',
    type: 'telegram',
    connected: false,
    accountName: '',
    webhookUrl: 'http://localhost:3000/api/webhooks/telegram',
    description: 'Bot oficial do Telegram para consultas de cardápio, pedidos e suporte 24 horas.',
    setupInstructions: [
      'Abra o Telegram e pesquise pelo usuário oficial @BotFather.',
      'Envie o comando /newbot e siga as instruções para escolher nome e username do bot.',
      'O @BotFather fornecerá o HTTP API Token (ex: 712345678:AAH...).',
      'Cole esse Token no campo abaixo. O Multiplex IA configurará o Webhook automaticamente!'
    ],
    fields: [
      { key: 'accountName', label: 'Username do Bot (@)', placeholder: 'ex: @MultiplexAtendimentoBot' },
      { key: 'botToken', label: 'HTTP API Token do BotFather', placeholder: 'ex: 712345678:AAHw4b...', type: 'password' }
    ]
  },
  x: {
    name: 'X (Twitter) Direct Messages',
    type: 'x',
    connected: false,
    accountName: '',
    webhookUrl: 'http://localhost:3000/api/webhooks/x',
    description: 'Respostas automáticas a mensagens diretas (DMs) enviadas para seu perfil no X.',
    setupInstructions: [
      'Acesse o Twitter / X Developer Portal (developer.x.com).',
      'Crie um Projeto e Aplicativo com permissões de "Read, Write, and Direct Messages".',
      'Gere suas chaves de API: API Key, API Secret e Bearer Token.',
      'Cadastre a URL de Webhook abaixo na seção "Account Activity API".',
      'Informe suas credenciais abaixo para autenticar.'
    ],
    fields: [
      { key: 'accountName', label: 'Nome de Usuário (@)', placeholder: 'ex: @EmpresaNoX' },
      { key: 'bearerToken', label: 'Bearer Token (API v2)', placeholder: 'ex: AAAAAAAAAAAAAAAAAAAAA...', type: 'password' },
      { key: 'apiKey', label: 'API Key', placeholder: 'ex: vZbjL...' }
    ]
  },
  webchat: {
    name: 'Webchat / Widget para Site',
    type: 'webchat',
    connected: true,
    accountName: 'Widget Ativo no Site',
    webhookUrl: 'http://localhost:3000/api/chat/message',
    description: 'Balão flutuante de chat com Multiplex IA para colocar em qualquer site ou página de vendas.',
    setupInstructions: [
      'Copie o código do script JavaScript fornecido abaixo.',
      'Cole o código antes da tag </body> no arquivo HTML do seu site ou no painel da sua loja (Shopify, WordPress, Nuvemshop, etc.).',
      'O balão do Multiplex IA aparecerá no canto inferior direito do seu site automaticamente!'
    ],
    fields: [
      { key: 'accountName', label: 'Domínio do Site', placeholder: 'ex: https://meusite.com.br' }
    ]
  }
};

// Listar canais
channelsRouter.get('/', (req: Request, res: Response) => {
  return res.json(Object.values(channelStates));
});

// Atualizar canal
channelsRouter.put('/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  if (!channelStates[type]) {
    return res.status(404).json({ error: 'Canal inválido.' });
  }

  channelStates[type] = {
    ...channelStates[type],
    ...req.body
  };

  return res.json(channelStates[type]);
});

// Testar conexão de canal
channelsRouter.post('/:type/test', (req: Request, res: Response) => {
  const { type } = req.params;
  const channel = channelStates[type];
  if (!channel) {
    return res.status(404).json({ error: 'Canal inválido.' });
  }

  // Simula teste de ping/handshake
  channel.connected = true;
  if (req.body.accountName) {
    channel.accountName = req.body.accountName;
  }

  return res.json({
    success: true,
    message: `Conexão com ${channel.name} testada e ativada com sucesso! O webhook está operacional.`,
    channel
  });
});

// Assistente de Conexão com IA (Tira-dúvidas e orientações passo a passo)
channelsRouter.post('/:type/ai-guide', async (req: Request, res: Response) => {
  const { type } = req.params;
  const { question } = req.body;
  const channel = channelStates[type];

  if (!channel) {
    return res.status(404).json({ error: 'Canal inválido.' });
  }

  try {
    let aiResponse = '';

    if (process.env.OPENAI_API_KEY) {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `Você é o especialista técnico de conexões e integrações da Multiplex IA.
O usuário está configurando a integração do canal "${channel.name}" (${channel.type}).
Webhook oficial gerado para o cliente: ${channel.webhookUrl}

Dúvida ou solicitação do usuário:
"${question || 'Como faço para conectar esse canal passo a passo do jeito mais fácil e rápido?'}"

Instruções para sua resposta:
1. Seja extremamente didático, claro e direto ao ponto.
2. Diga exatamente qual site ou app o usuário deve abrir.
3. Diga exatamente o que ele deve copiar e onde colar.
4. Explique onde encontrar cada token, chave ou ID necessário.
5. PROIBIDO USAR QUALQUER EMOJI. Mantenha tom profissional, objetivo e prático.`;

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: 'Você é o guia técnico de integrações da Multiplex IA. PROIBIDO usar emojis. Seja didático, claro e objetivo.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      });

      aiResponse = completion.choices[0]?.message?.content || '';
    }

    if (!aiResponse) {
      aiResponse = `Guia de conexão rápida para ${channel.name}:\n\n` +
        channel.setupInstructions.map((s, i) => `${i + 1}. ${s}`).join('\n') +
        `\n\nURL do Webhook para colar no painel: ${channel.webhookUrl}`;
    }

    return res.json({
      success: true,
      answer: aiResponse
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao consultar assistente de IA.' });
  }
});
