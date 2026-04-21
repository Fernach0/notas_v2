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
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AssignRolDto } from './dto/assign-rol.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { EstadoUsuario } from '@prisma/client';

@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Get()
  findAll(
    @Query('rol') rol?: string,
    @Query('estado') estado?: EstadoUsuario,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.usuariosService.findAll(
      rol ? +rol : undefined,
      estado,
      search,
      +page,
      +limit,
    );
  }

  @Get(':idUsuario')
  findOne(@Param('idUsuario') idUsuario: string) {
    return this.usuariosService.findOne(idUsuario);
  }

  @Patch(':idUsuario')
  update(@Param('idUsuario') idUsuario: string, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(idUsuario, dto);
  }

  @Delete(':idUsuario')
  remove(@Param('idUsuario') idUsuario: string) {
    return this.usuariosService.remove(idUsuario);
  }

  @Post(':idUsuario/roles')
  assignRol(@Param('idUsuario') idUsuario: string, @Body() dto: AssignRolDto) {
    return this.usuariosService.assignRol(idUsuario, dto.idRol);
  }

  @Delete(':idUsuario/roles/:idRol')
  removeRol(
    @Param('idUsuario') idUsuario: string,
    @Param('idRol', ParseIntPipe) idRol: number,
  ) {
    return this.usuariosService.removeRol(idUsuario, idRol);
  }
}
