import { Module } from '@nestjs/common';
import { DocenciaController } from './docencia.controller';
import { DocenciaService } from './docencia.service';

@Module({
  controllers: [DocenciaController],
  providers: [DocenciaService],
  exports: [DocenciaService],
})
export class DocenciaModule {}
