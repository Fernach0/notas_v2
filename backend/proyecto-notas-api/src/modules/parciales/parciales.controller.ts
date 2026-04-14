import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ParcialesService } from './parciales.service';
import { CreateParcialDto, CreateBulkParcialDto } from './dto/create-parcial.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('parciales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parciales')
export class ParcialesController {
  constructor(private readonly service: ParcialesService) {}

  @Roles(1, 2)
  @Post()
  create(@Body() dto: CreateParcialDto) { return this.service.create(dto); }

  @Roles(1, 2)
  @Post('bulk')
  createBulk(@Body() dto: CreateBulkParcialDto) { return this.service.createBulk(dto); }

  @Roles(1, 2)
  @Get()
  findAll(@Query('idCurso') idCurso?: string, @Query('idMateria') idMateria?: string) {
    return this.service.findAll(idCurso ? +idCurso : undefined, idMateria ? +idMateria : undefined);
  }

  @Roles(1)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
