import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';

export interface ActivityLogJobData {
  userId: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Processor('activity-log')
export class ActivityLogProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityLogProcessor.name);

  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {
    super();
  }

  async process(job: Job<ActivityLogJobData>) {
    this.logger.log(`Processing activity log job ${job.id}`);

    try {
      const { userId, action, details, ipAddress, userAgent } = job.data;

      const activityLog = this.activityLogRepository.create({
        userId,
        action,
        details,
        ipAddress,
        userAgent,
      });

      await this.activityLogRepository.save(activityLog);

      this.logger.log(`Activity log saved: ${activityLog.id}`);
      return activityLog;
    } catch (error) {
      this.logger.error(`Error processing activity log job: ${error.message}`);
      throw error;
    }
  }
}

