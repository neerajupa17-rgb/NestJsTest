import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductGateway } from '../websockets/product.gateway';
import { JobsService } from '../jobs/jobs.service';
import { RedisCacheService } from '../common/cache/redis-cache.store';

@Injectable()
export class ProductsService {
  private readonly CACHE_KEY_PREFIX = 'products';
  private readonly CACHE_KEY_LIST = 'products:list';
  private readonly CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private redisCache: RedisCacheService,
    private productGateway: ProductGateway,
    private jobsService: JobsService,
  ) {}

  async create(createProductDto: CreateProductDto, userId?: string) {
    const product = this.productRepository.create(createProductDto);
    const savedProduct = await this.productRepository.save(product);

    // Invalidate cache
    await this.invalidateCache();

    // Emit WebSocket event
    this.productGateway.emitProductCreated(savedProduct);

    // Log activity in background
    if (userId) {
      this.jobsService.logActivity({
        userId,
        action: 'PRODUCT_CREATED',
        details: `Product created: ${savedProduct.name} (${savedProduct.id})`,
      });
    }

    return savedProduct;
  }

  async findAll() {
    // Try to get from cache first
    const cachedProducts = await this.redisCache.get<Product[]>(
      this.CACHE_KEY_LIST,
    );

    if (cachedProducts) {
      return cachedProducts;
    }

    // If not in cache, fetch from database
    const products = await this.productRepository.find({
      order: { createdAt: 'DESC' },
    });

    // Store in cache
    await this.redisCache.set(this.CACHE_KEY_LIST, products, this.CACHE_TTL);

    return products;
  }

  async findOne(id: string) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}:${id}`;

    // Try to get from cache first
    const cachedProduct = await this.redisCache.get<Product>(cacheKey);

    if (cachedProduct) {
      return cachedProduct;
    }

    // If not in cache, fetch from database
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Store in cache
    await this.redisCache.set(cacheKey, product, this.CACHE_TTL);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.productRepository.save(product);

    // Invalidate cache
    await this.invalidateCache();
    await this.redisCache.del(`${this.CACHE_KEY_PREFIX}:${id}`);

    return updatedProduct;
  }

  async remove(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    await this.productRepository.remove(product);

    // Invalidate cache
    await this.invalidateCache();
    await this.redisCache.del(`${this.CACHE_KEY_PREFIX}:${id}`);

    return { message: 'Product deleted successfully' };
  }

  private async invalidateCache() {
    await this.redisCache.del(this.CACHE_KEY_LIST);
  }
}

