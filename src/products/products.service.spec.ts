import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductGateway } from '../websockets/product.gateway';
import { JobsService } from '../jobs/jobs.service';
import { RedisCacheService } from '../common/cache/redis-cache.store';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: Repository<Product>;
  let redisCache: RedisCacheService;
  let productGateway: ProductGateway;
  let jobsService: JobsService;

  const mockProductRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockRedisCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockProductGateway = {
    emitProductCreated: jest.fn(),
  };

  const mockJobsService = {
    logActivity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: RedisCacheService,
          useValue: mockRedisCache,
        },
        {
          provide: ProductGateway,
          useValue: mockProductGateway,
        },
        {
          provide: JobsService,
          useValue: mockJobsService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    redisCache = module.get<RedisCacheService>(RedisCacheService);
    productGateway = module.get<ProductGateway>(ProductGateway);
    jobsService = module.get<JobsService>(JobsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createProductDto: CreateProductDto = {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      stock: 10,
    };

    it('should create a product successfully', async () => {
      const savedProduct = {
        id: 'product-id',
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductRepository.create.mockReturnValue(savedProduct);
      mockProductRepository.save.mockResolvedValue(savedProduct);

      const result = await service.create(createProductDto, 'user-id');

      expect(mockProductRepository.create).toHaveBeenCalledWith(
        createProductDto,
      );
      expect(mockProductRepository.save).toHaveBeenCalled();
      expect(mockRedisCache.del).toHaveBeenCalledWith('products:list');
      expect(mockProductGateway.emitProductCreated).toHaveBeenCalledWith(
        savedProduct,
      );
      expect(mockJobsService.logActivity).toHaveBeenCalled();
      expect(result).toEqual(savedProduct);
    });
  });

  describe('findAll', () => {
    it('should return cached products if available', async () => {
      const cachedProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          price: 99.99,
          stock: 10,
        },
      ];

      mockRedisCache.get.mockResolvedValue(cachedProducts);

      const result = await service.findAll();

      expect(mockRedisCache.get).toHaveBeenCalledWith('products:list');
      expect(mockProductRepository.find).not.toHaveBeenCalled();
      expect(result).toEqual(cachedProducts);
    });

    it('should fetch from database and cache if not in cache', async () => {
      const products = [
        {
          id: 'product-1',
          name: 'Product 1',
          price: 99.99,
          stock: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRedisCache.get.mockResolvedValue(null);
      mockProductRepository.find.mockResolvedValue(products);

      const result = await service.findAll();

      expect(mockRedisCache.get).toHaveBeenCalledWith('products:list');
      expect(mockProductRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(mockRedisCache.set).toHaveBeenCalledWith(
        'products:list',
        products,
        300,
      );
      expect(result).toEqual(products);
    });
  });

  describe('findOne', () => {
    const productId = 'product-id';

    it('should return cached product if available', async () => {
      const cachedProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        stock: 10,
      };

      mockRedisCache.get.mockResolvedValue(cachedProduct);

      const result = await service.findOne(productId);

      expect(mockRedisCache.get).toHaveBeenCalledWith(
        `products:${productId}`,
      );
      expect(mockProductRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(cachedProduct);
    });

    it('should fetch from database and cache if not in cache', async () => {
      const product = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRedisCache.get.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(product);

      const result = await service.findOne(productId);

      expect(mockRedisCache.get).toHaveBeenCalledWith(
        `products:${productId}`,
      );
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockRedisCache.set).toHaveBeenCalledWith(
        `products:${productId}`,
        product,
        300,
      );
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRedisCache.get.mockResolvedValue(null);
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const productId = 'product-id';
    const updateDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 149.99,
    };

    it('should update a product successfully', async () => {
      const existingProduct = {
        id: productId,
        name: 'Original Product',
        price: 99.99,
        stock: 10,
        description: 'Original Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProduct = {
        ...existingProduct,
        ...updateDto,
        updatedAt: new Date(),
      };

      mockProductRepository.findOne.mockResolvedValue(existingProduct);
      mockProductRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.update(productId, updateDto);

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockProductRepository.save).toHaveBeenCalled();
      expect(mockRedisCache.del).toHaveBeenCalledWith('products:list');
      expect(mockRedisCache.del).toHaveBeenCalledWith(`products:${productId}`);
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const productId = 'product-id';

    it('should delete a product successfully', async () => {
      const product = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductRepository.findOne.mockResolvedValue(product);
      mockProductRepository.remove.mockResolvedValue(product);

      const result = await service.remove(productId);

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockProductRepository.remove).toHaveBeenCalledWith(product);
      expect(mockRedisCache.del).toHaveBeenCalledWith('products:list');
      expect(mockRedisCache.del).toHaveBeenCalledWith(`products:${productId}`);
      expect(result).toEqual({ message: 'Product deleted successfully' });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

