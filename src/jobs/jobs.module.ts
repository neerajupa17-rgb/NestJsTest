import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { ActivityLogProcessor } from './processors/activity-log.processor';
import { ActivityLog } from './entities/activity-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog]),
    BullModule.registerQueue({
      name: 'activity-log',
    }),
  ],
  providers: [JobsService, ActivityLogProcessor],
  exports: [JobsService],
})
export class JobsModule {}

