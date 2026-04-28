import { Module } from '@nestjs/common';
import { CalificacionesController } from './calificaciones.controller';
import { CalificacionesService } from './calificaciones.service';
import { PromediosModule } from '../promedios/promedios.module';

@Module({
  imports: [PromediosModule],
  controllers: [CalificacionesController],
  providers: [CalificacionesService],
  exports: [CalificacionesService],
})
export class CalificacionesModule {}
