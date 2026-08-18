# E-commerce do Lucas (Nível 3) 🚀

Este projeto é uma plataforma de e-commerce robusta e escalável, projetada para suportar alta concorrência (~500 usuários/dia) sem perder vendas por indisponibilidade. O backend foi construído seguindo rigorosamente os princípios da **Clean Architecture**, **Domain-Driven Design (DDD)** e padrões avançados de resiliência.

## 🏗 Arquitetura e Stack Tecnológico

A aplicação foi desenhada para a Nuvem (pronta para AWS) e separa claramente a lógica de negócios da infraestrutura externa.

| Camada              | Tecnologia                    | Propósito                                                     |
| ------------------- | ----------------------------- | ------------------------------------------------------------- |
| **Framework**       | NestJS + TypeScript (Node.js) | Tipagem forte, performance e estrutura modular nativa         |
| **Database**        | PostgreSQL + Prisma ORM       | Relacionamentos complexos, otimização e controle transacional |
| **Cache**           | Redis                         | Sessões de usuário, cache de catálogo (Cache-Aside)           |
| **Fila/Mensageria** | AWS SQS / BullMQ              | Processamento assíncrono confiável                            |
| **Pagamentos**      | Stripe                        | PCI DSS compliance, tokenização, processamento via Webhooks   |
| **Email**           | SendGrid / MailHog (Local)    | Emails transacionais (pedidos, boas vindas)                   |
| **Container**       | Docker + Docker Compose       | Ambiente isolado e Multi-stage builds para produção           |

---

## 🔒 Segurança em Nível de Produção

- Autenticação JWT (com suporte a Refresh Tokens).
- Proteção de senhas com _Bcrypt_.
- Controle de acessos baseado em Funções (Role-Based Access Control - RBAC).
- Prevenção de cobrança dupla via cabeçalhos de **Idempotência** (`Idempotency-Key`).
- Headers HTTP seguros via `helmet`.
- Rate limiting implementado para prevenção de ataques DDoS locais.

---

## ⚡ Performance e Resiliência

- Prevenção ativa de _N+1 Queries_ nas rotas de pedidos e produtos.
- **Circuit Breaker & Retries:** O `StripeAdapter` possui controle de _timeout_ (10s) e retentativas configuradas (até 3x) em caso de falhas da API externa.
- Paginação implementada nos endpoints de listagem.
- Logs Estruturados utilizando _Pino_ para auditoria, integrável facilmente ao Sentry ou AWS CloudWatch.

---

## 💻 Como Executar Localmente

Você precisará ter o **Docker** e o **Node.js 22+** instalados em sua máquina.

### 1. Clonar e Instalar Dependências

```bash
git clone https://github.com/niqueborges/app-ecommerce.git
cd app-ecommerce
npm install
```

### 2. Configurar as Variáveis de Ambiente

Copie o arquivo de exemplo e edite se necessário (para dev local, as chaves de teste do Stripe podem ser usadas):

```bash
cp .env.example .env
```

### 3. Iniciar a Infraestrutura (Banco de Dados, Redis e Mailhog)

```bash
docker-compose up -d
```

> Isso iniciará o PostgreSQL, Redis e o MailHog (servidor de e-mails de teste).

### 4. Rodar as Migrations e o Seed

```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Iniciar a Aplicação Backend

```bash
npm run start:dev
```

A API estará rodando em: `http://localhost:3000/api/v1`
A documentação interativa (Swagger) estará em: `http://localhost:3000/api/v1/docs`

---

## 🧪 Testes

A aplicação conta com uma robusta suíte de testes.

```bash
# Executar testes unitários e de Use Cases
npm run test

# Checar Linter e formatação de código
npm run lint
```

---

## 📚 Estrutura do Projeto (Clean Architecture)

A estrutura está dividida da seguinte maneira:

- `src/domain`: Contém as entidades principais e abstrações puras.
- `src/application`: Casos de uso (Use Cases) e Portas (Ports - interfaces de repositórios e gateways).
- `src/infrastructure`: Implementações concretas (Prisma, Controladores HTTP NestJS, StripeAdapter).

Para mais detalhes da construção passo a passo do zero, os scripts de automação podem ser encontrados no guia [comandos_terminal.md](./docs_config/comandos_terminal.md).
