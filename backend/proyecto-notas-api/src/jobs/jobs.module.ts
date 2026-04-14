import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsController } from './jobs.controller';
import { RetencionEvidenciasService } from './retencion-evidencias.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [JobsController],
  providers: [RetencionEvidenciasService],
})
export class JobsModule {}
