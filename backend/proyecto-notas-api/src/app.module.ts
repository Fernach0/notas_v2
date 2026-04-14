import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AnioLectivoModule } from './modules/anio-lectivo/anio-lectivo.module';
import { CursosModule } from './modules/cursos/cursos.module';
import { MateriasModule } from './modules/materias/materias.module';
import { MatriculaModule } from './modules/matricula/matricula.module';
import { DocenciaModule } from './modules/docencia/docencia.module';
import { ParcialesModule } from './modules/parciales/parciales.module';
import { ActividadesModule } from './modules/actividades/actividades.module';
import { CalificacionesModule } from './modules/calificaciones/calificaciones.module';
import { EvidenciasModule } from './modules/evidencias/evidencias.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { PromediosModule } from './modules/promedios/promedios.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 60 }] }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    AnioLectivoModule,
    CursosModule,
    MateriasModule,
    MatriculaModule,
    DocenciaModule,
    ParcialesModule,
    ActividadesModule,
    CalificacionesModule,
    EvidenciasModule,
    NotificacionesModule,
    PromediosModule,
    JobsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
