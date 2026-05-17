import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

const EXCHANGE    = 'notification.exchange';
const ROUTING_KEY = 'notification.routing-key';

interface NotificacaoPayload {
  recipient: string;
  subject: string;
  message: string;
  sendAt: string;     // ISO-8601 LocalDateTime
  channel: 'EMAIL';
}

@Injectable()
export class NotificacaoService implements OnModuleDestroy {
  private readonly logger = new Logger(NotificacaoService.name);
  private connection: amqplib.ChannelModel | null = null;
  private channel: amqplib.Channel | null = null;
  private readonly url: string;

  constructor(@Inject(ConfigService) private config: ConfigService) {
    this.url = this.config.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
  }

  private async getChannel(): Promise<amqplib.Channel> {
    if (this.channel) return this.channel;

    const conn = await amqplib.connect(this.url);
    this.connection = conn;
    const ch = await conn.createChannel();
    await ch.assertExchange(EXCHANGE, 'direct', { durable: true });
    this.channel = ch;
    return ch;
  }

  private async publish(payload: NotificacaoPayload): Promise<void> {
    try {
      const ch = await this.getChannel();
      const body = Buffer.from(JSON.stringify(payload));
      ch.publish(EXCHANGE, ROUTING_KEY, body, { contentType: 'application/json', persistent: true });
      this.logger.log(`Notificação publicada para ${payload.recipient} [${payload.subject}]`);
    } catch (err) {
      this.logger.error(`Falha ao publicar notificação para ${payload.recipient}: ${(err as Error).message}`);
      this.channel = null;
      this.connection = null;
      // não lança — falha no envio de email nunca deve bloquear a operação principal
    }
  }

  async enviarVerificacaoEmail(email: string, nome: string, url: string): Promise<void> {
    await this.publish({
      recipient: email,
      subject: 'Confirme seu e-mail — ERP Dias',
      message: `Olá, ${nome}!\n\nConfirme seu e-mail clicando no link abaixo (válido por 24h):\n${url}`,
      sendAt: new Date().toISOString().slice(0, 19),
      channel: 'EMAIL',
    });
  }

  async enviarConvite(email: string, nome: string, empresaNome: string, url: string): Promise<void> {
    await this.publish({
      recipient: email,
      subject: `Convite para ${empresaNome} — ERP Dias`,
      message: `Olá, ${nome}!\n\nVocê foi convidado para a empresa ${empresaNome}.\nClique no link para criar sua senha e acessar o sistema (válido por 48h):\n${url}`,
      sendAt: new Date().toISOString().slice(0, 19),
      channel: 'EMAIL',
    });
  }

  async enviarAdicionadoAEmpresa(email: string, empresaNome: string, frontendUrl: string): Promise<void> {
    await this.publish({
      recipient: email,
      subject: `Você foi adicionado a ${empresaNome} — ERP Dias`,
      message: `Você foi adicionado à empresa ${empresaNome}.\nAcesse o sistema em: ${frontendUrl}`,
      sendAt: new Date().toISOString().slice(0, 19),
      channel: 'EMAIL',
    });
  }

  async enviarResetSenha(email: string, url: string): Promise<void> {
    await this.publish({
      recipient: email,
      subject: 'Recuperação de senha — ERP Dias',
      message: `Clique no link para redefinir sua senha (válido por 1 hora):\n${url}`,
      sendAt: new Date().toISOString().slice(0, 19),
      channel: 'EMAIL',
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => {});
    await this.connection?.close().catch(() => {});
  }
}
