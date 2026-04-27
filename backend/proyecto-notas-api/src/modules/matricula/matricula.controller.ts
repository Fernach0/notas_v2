import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MatriculaService } from './matricula.service';
import { CreateMatriculaDto } from './dto/create-matricula.dto';
import { TrasladoMatriculaDto } from './dto/traslado-matricula.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('matriculas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('matriculas')
export class MatriculaController {
  constructor(private readonly service: MatriculaService) {}

  @Roles(1)
  @Post()
  create(@Body() dto: CreateMatriculaDto) {
    return this.service.create(dto);
  }

  @Roles(1, 2)
  @Get()
  findAll(@Query('idCurso') idCurso?: string) {
    return this.service.findAll(idCurso ? +idCurso : undefined);
  }

  // Endpoint para que el estudiante (o admin/profesor) consulte su propia matrícula activa
  @Roles(1, 2, 3)
  @Get('mi-matricula')
  getMiMatricula(
    @CurrentUser() user: { idUsuario: string },
    @Query('idAnioLectivo') idAnioLectivo?: string,
  ) {
    return this.service.findMiMatricula(user.idUsuario, idAnioLectivo ? +idAnioLectivo : undefined);
  }

  @Roles(1)
  @Patch(':idUsuario/traslado')
  trasladar(
    @Param('idUsuario') idUsuario: string,
    @Body() dto: TrasladoMatriculaDto,
  ) {
    return this.service.trasladar(idUsuario, dto.idCursoDestino);
  }

  @Roles(1)
  @Delete()
  remove(@Body() dto: CreateMatriculaDto) {
    return this.service.remove(dto);
  }
}
