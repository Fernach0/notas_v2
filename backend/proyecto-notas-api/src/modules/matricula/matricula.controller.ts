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

@ApiTags('matriculas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
@Controller('matriculas')
export class MatriculaController {
  constructor(private readonly service: MatriculaService) {}

  @Post()
  create(@Body() dto: CreateMatriculaDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('idCurso') idCurso?: string) {
    return this.service.findAll(idCurso ? +idCurso : undefined);
  }

  @Patch(':idUsuario/traslado')
  trasladar(
    @Param('idUsuario') idUsuario: string,
    @Body() dto: TrasladoMatriculaDto,
  ) {
    return this.service.trasladar(idUsuario, dto.idCursoDestino);
  }

  @Delete()
  remove(@Body() dto: CreateMatriculaDto) {
    return this.service.remove(dto);
  }
}
