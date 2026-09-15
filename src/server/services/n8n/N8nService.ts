import axios from 'axios';


export class N8nService {
  private baseUrl: string;
  private webhookUrl: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/omnichannel-agent';
  }

  /**
   * Dispara um evento assíncrono para o fluxo do n8n
   */
  public async dispatchEvent(eventType: string, payload: Record<string, any>): Promise<boolean> {
    try {
      await axios.post(
        this.webhookUrl,
        {
          event: eventType,
          timestamp: new Date().toISOString(),
          data: payload
        },
        {
          timeout: 4000,
          headers: {
            'Content-Type': 'application/json',
            'X-Source': 'Omnichannel-AI-Agent-Backend'
          }
        }
      );
      return true;
    } catch (err: any) {
      // Falha silenciosa com log — o backend da IA nunca trava se o n8n estiver indisponível
      console.warn(`[N8nService] Notificação para o n8n (${eventType}) não enviada: ${err.message}`);
      return false;
    }
  }
}

export const n8nService = new N8nService();
