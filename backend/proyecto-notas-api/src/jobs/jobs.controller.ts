import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RetencionEvidenciasService } from './retencion-evidencias.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
@Controller('jobs')
export class JobsController {
  constructor(private readonly retencionService: RetencionEvidenciasService) {}

  @Post('retencion-evidencias/ejecutar')
  ejecutar(@Body() body: { idAnioLectivo?: number; confirmacion?: string }) {
    if (body.confirmacion && !body.confirmacion.startsWith('ELIMINAR_PDFS')) {
      return { message: 'Confirmación requerida' };
    }
    return this.retencionService.ejecutar(body.idAnioLectivo);
  }

  @Get('retencion-evidencias/ultimo-estado')
  getStatus() {
    return this.retencionService.getLastRunStatus();
  }
}
