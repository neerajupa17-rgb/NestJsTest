import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobsService } from './jobs.service';
import { ActivityLogJobData } from './processors/activity-log.processor';

describe('JobsService', () => {
  let service: JobsService;
  let activityLogQueue: Queue;

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getQueueToken('activity-log'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    activityLogQueue = module.get<Queue>(getQueueToken('activity-log'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logActivity', () => {
    it('should add activity log job to queue', async () => {
      const activityData: ActivityLogJobData = {
        userId: 'user-id',
        action: 'USER_LOGIN',
        details: 'User logged in',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };

      mockQueue.add.mockResolvedValue({ id: 'job-id' });

      await service.logActivity(activityData);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'log-activity',
        activityData,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 3600,
            count: 1000,
          },
          removeOnFail: {
            age: 86400,
          },
        },
      );
    });
  });
});

