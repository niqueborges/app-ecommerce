import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly redis: Redis;

  constructor(private readonly prisma: PrismaService) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      lazyConnect: true,
    });
    this.redis.connect().catch((err) => {
      this.logger.warn(`Redis connection error: ${(err as Error).message}`);
    });
  }

  async findAll(categoryId?: string, search?: string) {
    const cacheKey = `catalog:products:${categoryId || 'all'}:${search || 'none'}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        ...(categoryId ? { categoryId } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redis.set(cacheKey, JSON.stringify(products), 'EX', 3600); // 1h TTL
    return products;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product || !product.active) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: dto,
    });

    // Invalidação de cache de catálogo
    const keys = await this.redis.keys('catalog:products:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    return product;
  }
}
