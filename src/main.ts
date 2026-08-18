import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-commerce do Lucas — Artesanato API')
    .setDescription(
      'API REST de alta performance para e-commerce: Catálogo com cache Redis, Checkout com Stripe, Idempotência e Filas BullMQ.'
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT de acesso',
        in: 'header',
      },
      'access-token'
    )
    .addTag('Health', 'Verificação de status do servidor')
    .addTag('Auth', 'Autenticação, registro e refresh de tokens')
    .addTag('Products', 'Catálogo de produtos artesanais e categorias')
    .addTag('Orders', 'Criação e consulta de pedidos com trava de estoque')
    .addTag('Payments', 'Integração com Stripe e Webhooks')
    .addTag('Notifications', 'Processamento de emails transacionais')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document);

  app.enableShutdownHooks();

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  logger.log(`E-commerce API is running on port ${port}`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/v1/docs`);
}

void bootstrap();
