import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnioLectivoService } from './anio-lectivo.service';
import { CreateAnioLectivoDto } from './dto/create-anio-lectivo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { EstadoLectivo } from '@prisma/client';

@ApiTags('anios-lectivos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
@Controller('anios-lectivos')
export class AnioLectivoController {
  constructor(private readonly service: AnioLectivoService) {}

  @Post()
  create(@Body() dto: CreateAnioLectivoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('estado') estado?: EstadoLectivo) {
    return this.service.findAll(estado);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateAnioLectivoDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
