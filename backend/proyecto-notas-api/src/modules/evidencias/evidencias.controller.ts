import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';
import { EvidenciasService } from './evidencias.service';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('evidencias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('evidencias')
export class EvidenciasController {
  constructor(private readonly service: EvidenciasService) {}

  @Roles(3)
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  create(
    @CurrentUser() user: { idUsuario: string },
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateEvidenciaDto,
  ) {
    return this.service.create(user.idUsuario, dto, file);
  }

  // Profesor/Admin: todas las evidencias de una actividad (con datos del alumno)
  @Roles(1, 2)
  @Get()
  findAll(@Query('idActividad') idActividad?: string) {
    return this.service.findAll(idActividad ? +idActividad : undefined);
  }

  // Estudiante: solo sus propias evidencias (sin datos de otros alumnos)
  @Roles(3)
  @Get('mis-evidencias')
  getMisEvidencias(
    @CurrentUser() user: { idUsuario: string },
    @Query('idActividad') idActividad?: string,
  ) {
    return this.service.findByUsuario(user.idUsuario, idActividad ? +idActividad : undefined);
  }

  @Roles(1, 2)
  @Get(':id/descargar')
  async descargar(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, nombreArchivo, tipoContenido } = await this.service.getFileBuffer(id);
    res.setHeader('Content-Type', tipoContenido);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(nombreArchivo)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  @Roles(1, 3)
  @Delete(':id')
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.service.softDelete(id);
  }
}
