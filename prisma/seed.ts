import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando seed do E-commerce do Lucas...');
  const passwordHash = await bcrypt.hash('SenhaForte@123', 10);

  // 1. Admin / Lucas
  const admin = await prisma.user.upsert({
    where: { email: 'lucas@artesanato.com.br' },
    update: {},
    create: {
      email: 'lucas@artesanato.com.br',
      passwordHash,
      name: 'Lucas Artesão',
      role: 'ADMIN',
    },
  });

  // 2. Cliente de teste
  const customer = await prisma.user.upsert({
    where: { email: 'maria.cliente@gmail.com' },
    update: {},
    create: {
      email: 'maria.cliente@gmail.com',
      passwordHash,
      name: 'Maria Compradora',
      role: 'CUSTOMER',
    },
  });

  // 3. Categorias
  const ceramica = await prisma.category.upsert({
    where: { slug: 'ceramica-artesanal' },
    update: {},
    create: {
      name: 'Cerâmica Artesanal',
      slug: 'ceramica-artesanal',
      description: 'Vasos, canecas e pratos feitos e pintados à mão.',
    },
  });

  const madeira = await prisma.category.upsert({
    where: { slug: 'entalhe-em-madeira' },
    update: {},
    create: {
      name: 'Entalhe em Madeira',
      slug: 'entalhe-em-madeira',
      description: 'Esculturas e tábuas gourmet em madeira nobre.',
    },
  });

  // 4. Produtos
  await prisma.product.upsert({
    where: { slug: 'caneca-ceramica-rustica' },
    update: {},
    create: {
      name: 'Caneca Cerâmica Rústica 350ml',
      slug: 'caneca-ceramica-rustica',
      description: 'Caneca artesanal esmaltada com acabamento texturizado.',
      priceInCents: 6500, // R$ 65,00
      stock: 25,
      categoryId: ceramica.id,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
    },
  });

  await prisma.product.upsert({
    where: { slug: 'tabua-corte-madeira-teca' },
    update: {},
    create: {
      name: 'Tábua Gourmet Madeira Teca',
      slug: 'tabua-corte-madeira-teca',
      description: 'Tábua maciça selada com cera de abelha natural.',
      priceInCents: 14000, // R$ 140,00
      stock: 12,
      categoryId: madeira.id,
      imageUrl: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600',
    },
  });

  console.log('Seed do E-commerce concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
