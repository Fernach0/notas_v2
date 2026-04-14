import { Module } from '@nestjs/common';
import { ParcialesController } from './parciales.controller';
import { ParcialesService } from './parciales.service';

@Module({
  controllers: [ParcialesController],
  providers: [ParcialesService],
  exports: [ParcialesService],
})
export class ParcialesModule {}
