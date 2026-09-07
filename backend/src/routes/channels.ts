import { Router, Request, Response } from 'express';

export const channelsRouter = Router();

// Estado dos canais omnichannel
const channelStates: Record<string, {
  name: string;
  type: string;
  connected: boolean;
  accountName?: string;
  webhookUrl: string;
}> = {
  whatsapp: {
    name: 'WhatsApp Business',
    type: 'whatsapp',
    connected: true,
    accountName: '+55 (11) 99999-8888',
    webhookUrl: 'http://localhost:3000/api/webhooks/whatsapp'
  },
  instagram: {
    name: 'Instagram Direct',
    type: 'instagram',
    connected: true,
    accountName: '@anthony.burgers',
    webhookUrl: 'http://localhost:3000/api/webhooks/instagram'
  },
  facebook: {
    name: 'Facebook Messenger',
    type: 'facebook',
    connected: false,
    accountName: 'Página Facebook Não Conectada',
    webhookUrl: 'http://localhost:3000/api/webhooks/facebook'
  },
  telegram: {
    name: 'Telegram Bot',
    type: 'telegram',
    connected: true,
    accountName: '@AnthonyDeliveryBot',
    webhookUrl: 'http://localhost:3000/api/webhooks/telegram'
  }
};

channelsRouter.get('/', (req: Request, res: Response) => {
  return res.json(Object.values(channelStates));
});

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
