import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../common/api-key.guard';
import { TimingInterceptor } from '../common/timing.interceptor';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, ApiKeyGuard, TimingInterceptor],
})
export class EventsModule {}
