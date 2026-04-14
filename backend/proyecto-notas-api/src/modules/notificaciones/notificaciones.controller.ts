import { Controller, Get, Patch, Delete, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  findAll(
    @CurrentUser() user: { idUsuario: string },
    @Query('leida') leida?: string,
  ) {
    const leidaVal = leida !== undefined ? leida === 'true' : undefined;
    return this.service.findAll(user.idUsuario, leidaVal);
  }

  @Patch(':id/leer')
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { idUsuario: string },
  ) {
    return this.service.markRead(id, user.idUsuario);
  }

  @Patch('leer-todas')
  markAllRead(@CurrentUser() user: { idUsuario: string }) {
    return this.service.markAllRead(user.idUsuario);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { idUsuario: string },
  ) {
    return this.service.remove(id, user.idUsuario);
  }
}
