import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: ProductsService;

  const mockProductsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get<ProductsService>(ProductsService);
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

    const mockRequest = {
      user: { id: 'user-id' },
    } as any;

    it('should create a product', async () => {
      const expectedProduct = {
        id: 'product-id',
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductsService.create.mockResolvedValue(expectedProduct);

      const result = await controller.create(createProductDto, mockRequest);

      expect(productsService.create).toHaveBeenCalledWith(
        createProductDto,
        'user-id',
      );
      expect(result).toEqual(expectedProduct);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const expectedProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          price: 99.99,
          stock: 10,
        },
      ];

      mockProductsService.findAll.mockResolvedValue(expectedProducts);

      const result = await controller.findAll();

      expect(productsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedProducts);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const productId = 'product-id';
      const expectedProduct = {
        id: productId,
        name: 'Test Product',
        price: 99.99,
        stock: 10,
      };

      mockProductsService.findOne.mockResolvedValue(expectedProduct);

      const result = await controller.findOne(productId);

      expect(productsService.findOne).toHaveBeenCalledWith(productId);
      expect(result).toEqual(expectedProduct);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const productId = 'product-id';
      const updateDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 149.99,
      };

      const expectedProduct = {
        id: productId,
        ...updateDto,
        description: 'Test Description',
        stock: 10,
        updatedAt: new Date(),
      };

      mockProductsService.update.mockResolvedValue(expectedProduct);

      const result = await controller.update(productId, updateDto);

      expect(productsService.update).toHaveBeenCalledWith(productId, updateDto);
      expect(result).toEqual(expectedProduct);
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      const productId = 'product-id';
      const expectedResult = { message: 'Product deleted successfully' };

      mockProductsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(productId);

      expect(productsService.remove).toHaveBeenCalledWith(productId);
      expect(result).toEqual(expectedResult);
    });
  });
});

