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

  @Roles(1, 2)
  @Get()
  findAll(@Query('idActividad') idActividad?: string) {
    return this.service.findAll(idActividad ? +idActividad : undefined);
  }

  @Roles(1, 2)
  @Get(':id/descargar')
  async descargar(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const filePath = await this.service.getFilePath(id);
    return res.download(filePath);
  }

  @Roles(1, 3)
  @Delete(':id')
  softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.service.softDelete(id);
  }
}
