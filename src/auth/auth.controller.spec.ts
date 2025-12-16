import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JobsService } from '../jobs/jobs.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let jobsService: JobsService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockJobsService = {
    logActivity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JobsService,
          useValue: mockJobsService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jobsService = module.get<JobsService>(JobsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockRequest = {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    } as any;

    it('should register a user and log activity', async () => {
      const expectedResult = {
        accessToken: 'jwt-token',
        user: {
          id: 'user-id',
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto, mockRequest);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(jobsService.logActivity).toHaveBeenCalledWith({
        userId: expectedResult.user.id,
        action: 'USER_REGISTERED',
        details: `User registered: ${registerDto.email}`,
        ipAddress: mockRequest.ip,
        userAgent: mockRequest.get('user-agent'),
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockRequest = {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    } as any;

    it('should login a user and log activity', async () => {
      const expectedResult = {
        accessToken: 'jwt-token',
        user: {
          id: 'user-id',
          email: loginDto.email,
          firstName: 'Test',
          lastName: 'User',
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, mockRequest);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(jobsService.logActivity).toHaveBeenCalledWith({
        userId: expectedResult.user.id,
        action: 'USER_LOGIN',
        details: `User logged in: ${loginDto.email}`,
        ipAddress: mockRequest.ip,
        userAgent: mockRequest.get('user-agent'),
      });
      expect(result).toEqual(expectedResult);
    });
  });
});

