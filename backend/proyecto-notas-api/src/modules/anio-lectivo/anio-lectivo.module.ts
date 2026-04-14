import { Module } from '@nestjs/common';
import { AnioLectivoController } from './anio-lectivo.controller';
import { AnioLectivoService } from './anio-lectivo.service';

@Module({
  controllers: [AnioLectivoController],
  providers: [AnioLectivoService],
  exports: [AnioLectivoService],
})
export class AnioLectivoModule {}
