import { Module } from '@nestjs/common';
import { TimingInterceptor } from '../common/timing.interceptor';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, TimingInterceptor],
})
export class EventsModule {}
