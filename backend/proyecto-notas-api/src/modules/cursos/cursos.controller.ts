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
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CursosService } from './cursos.service';
import { CreateCursoDto } from './dto/create-curso.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('cursos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
@Controller('cursos')
export class CursosController {
  constructor(private readonly service: CursosService) {}

  @Post()
  create(@Body() dto: CreateCursoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('idAnioLectivo') id?: string) {
    return this.service.findAll(id ? +id : undefined);
  }

  // Ruta estática ANTES de /:id para evitar conflicto de matching
  @Roles(1, 2)
  @Get('mis-cursos')
  getMisCursos(@CurrentUser() user: { idUsuario: string }) {
    return this.service.getMisCursos(user.idUsuario);
  }

  @Roles(1, 2)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateCursoDto>,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Post(':id/materias')
  assignMateria(
    @Param('id', ParseIntPipe) id: number,
    @Body('idMateria') idMateria: number,
  ) {
    return this.service.assignMateria(id, idMateria);
  }

  @Delete(':id/materias/:idMateria')
  removeMateria(
    @Param('id', ParseIntPipe) id: number,
    @Param('idMateria', ParseIntPipe) idMateria: number,
  ) {
    return this.service.removeMateria(id, idMateria);
  }
}
