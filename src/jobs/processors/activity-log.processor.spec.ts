import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { ActivityLogProcessor } from './activity-log.processor';
import { ActivityLog } from '../entities/activity-log.entity';
import { ActivityLogJobData } from './activity-log.processor';

describe('ActivityLogProcessor', () => {
  let processor: ActivityLogProcessor;
  let repository: Repository<ActivityLog>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogProcessor,
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    processor = module.get<ActivityLogProcessor>(ActivityLogProcessor);
    repository = module.get<Repository<ActivityLog>>(
      getRepositoryToken(ActivityLog),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should process activity log job successfully', async () => {
      const jobData: ActivityLogJobData = {
        userId: 'user-id',
        action: 'USER_LOGIN',
        details: 'User logged in',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      const mockJob = {
        id: 'job-id',
        data: jobData,
      } as Job<ActivityLogJobData>;

      const savedLog = {
        id: 'log-id',
        ...jobData,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(savedLog);
      mockRepository.save.mockResolvedValue(savedLog);

      const result = await processor.process(mockJob);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: jobData.userId,
        action: jobData.action,
        details: jobData.details,
        ipAddress: jobData.ipAddress,
        userAgent: jobData.userAgent,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(savedLog);
      expect(result).toEqual(savedLog);
    });

    it('should handle errors gracefully', async () => {
      const jobData: ActivityLogJobData = {
        userId: 'user-id',
        action: 'USER_LOGIN',
      };

      const mockJob = {
        id: 'job-id',
        data: jobData,
      } as Job<ActivityLogJobData>;

      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(processor.process(mockJob)).rejects.toThrow('Database error');
    });
  });
});

