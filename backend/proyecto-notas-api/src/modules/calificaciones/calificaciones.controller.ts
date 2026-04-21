import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CalificacionesService } from './calificaciones.service';
import { CreateCalificacionDto, BulkCalificacionDto } from './dto/create-calificacion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('calificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(2)
@Controller('calificaciones')
export class CalificacionesController {
  constructor(private readonly service: CalificacionesService) {}

  @Post()
  create(@Body() dto: CreateCalificacionDto) { return this.service.create(dto); }

  @Post('bulk')
  createBulk(@Body() dto: BulkCalificacionDto) { return this.service.createBulk(dto); }

  @Roles(1, 2)
  @Get()
  findByActividad(@Query('idActividad', ParseIntPipe) idActividad: number) {
    return this.service.findByActividad(idActividad);
  }

  @Roles(1, 2, 3)
  @Get('estudiante/:idUsuario')
  findByEstudiante(
    @Param('idUsuario') idUsuario: string,
    @Query('idAnioLectivo') idAnioLectivo?: string,
  ) {
    return this.service.findByEstudiante(idUsuario, idAnioLectivo ? +idAnioLectivo : undefined);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { nota?: number; comentario?: string },
  ) {
    return this.service.update(id, data);
  }
}
