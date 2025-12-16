import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ActivityLogJobData } from './processors/activity-log.processor';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('activity-log')
    private activityLogQueue: Queue<ActivityLogJobData>,
  ) {}

  async logActivity(data: ActivityLogJobData) {
    await this.activityLogQueue.add('log-activity', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000, // Keep last 1000 completed jobs
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    });
  }
}

