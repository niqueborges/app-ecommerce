import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import nodemailer from 'nodemailer';

export interface OrderEmailJobData {
  email: string;
  customerName: string;
  orderId: string;
  totalInCents: number;
}

@Processor('notifications')
export class OrderEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(OrderEmailProcessor.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: false,
    });
  }

  async process(job: Job<OrderEmailJobData>): Promise<void> {
    this.logger.log(`Processando job [${job.name}] ID: ${job.id}`);
    const data = job.data;
    const formattedPrice = (data.totalInCents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    if (job.name === 'send-order-confirmation') {
      await this.transporter.sendMail({
        from: '"Lucas Artesanato" <pedidos@artesanato.com.br>',
        to: data.email,
        subject: `Pedido #${data.orderId.substring(0, 8)} Confirmado!`,
        text: `Olá ${data.customerName}, seu pedido no valor de ${formattedPrice} foi registrado com sucesso!`,
        html: `<h2>Olá, ${data.customerName}!</h2><p>Seu pedido foi registrado com sucesso no valor de <strong>${formattedPrice}</strong>.</p>`,
      });
      this.logger.log(`E-mail de confirmação enviado para ${data.email} via MailHog/SMTP`);
    }
  }
}
