import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ActividadesService } from './actividades.service';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('actividades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(2)
@Controller('actividades')
export class ActividadesController {
  constructor(private readonly service: ActividadesService) {}

  @Post()
  create(@Body() dto: CreateActividadDto) { return this.service.create(dto); }

  @Get()
  findAll(@Query('idParcial') idParcial?: string) {
    return this.service.findAll(idParcial ? +idParcial : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateActividadDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
