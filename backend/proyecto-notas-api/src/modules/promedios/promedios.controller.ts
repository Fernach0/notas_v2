import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PromediosService } from './promedios.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('promedios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('promedios')
export class PromediosController {
  constructor(private readonly service: PromediosService) {}

  @Roles(1, 2)
  @Post('materia/recalcular')
  recalcularMateria(
    @Body() body: { idUsuario: string; idCurso: number; idMateria: number; idAnioLectivo: number },
  ) {
    return this.service.recalcularMateria(body.idUsuario, body.idCurso, body.idMateria, body.idAnioLectivo);
  }

  @Roles(1, 2)
  @Post('general/recalcular')
  recalcularGeneral(@Body() body: { idUsuario: string; idCurso: number }) {
    return this.service.recalcularGeneral(body.idUsuario, body.idCurso);
  }

  @Roles(1, 2, 3)
  @Get('materia')
  findByMateria(@Query('idUsuario') idUsuario: string, @Query('idAnioLectivo') idAnioLectivo?: string) {
    return this.service.findByMateria(idUsuario, idAnioLectivo ? +idAnioLectivo : undefined);
  }

  @Roles(1, 2)
  @Get('curso-materia')
  findByCursoMateria(
    @Query('idCurso') idCurso: string,
    @Query('idMateria') idMateria: string,
  ) {
    return this.service.findByCursoMateria(+idCurso, +idMateria);
  }

  @Roles(1, 2, 3)
  @Get('general')
  findGeneral(@Query('idUsuario') idUsuario: string, @Query('idCurso') idCurso?: string) {
    return this.service.findGeneral(idUsuario, idCurso ? +idCurso : undefined);
  }

  @Roles(1, 2)
  @Get('curso/:idCurso/ranking')
  getRanking(@Param('idCurso', ParseIntPipe) idCurso: number) {
    return this.service.getRanking(idCurso);
  }
}
