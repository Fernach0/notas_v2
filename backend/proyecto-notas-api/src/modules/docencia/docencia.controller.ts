import { Controller, Get, Post, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DocenciaService } from './docencia.service';
import { CreateDocenciaDto } from './dto/create-docencia.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('docencias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
@Controller('docencias')
export class DocenciaController {
  constructor(private readonly service: DocenciaService) {}

  @Post()
  create(@Body() dto: CreateDocenciaDto) { return this.service.create(dto); }

  @Get()
  findAll(@Query('idUsuario') idUsuario?: string) {
    return this.service.findAll(idUsuario);
  }

  @Delete()
  remove(@Body() dto: CreateDocenciaDto) { return this.service.remove(dto); }
}
