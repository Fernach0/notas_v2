-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "EstadoLectivo" AS ENUM ('ACTIVO', 'FINALIZADO', 'PLANIFICADO');

-- CreateEnum
CREATE TYPE "EstadoEvidencia" AS ENUM ('ACTIVO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('TAREA', 'EXAMEN', 'PROYECTO', 'LECCION');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('NUEVA_ACTIVIDAD', 'CALIFICACION', 'RECORDATORIO', 'SISTEMA');

-- CreateTable
CREATE TABLE "anio_lectivo" (
    "id_aniolectivo" SERIAL NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_final" DATE NOT NULL,
    "estado_lectivo" "EstadoLectivo" NOT NULL,

    CONSTRAINT "anio_lectivo_pkey" PRIMARY KEY ("id_aniolectivo")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" VARCHAR(10) NOT NULL,
    "nombre_completo" VARCHAR(100) NOT NULL,
    "contrasena_usuario" VARCHAR(255) NOT NULL,
    "estado_usuario" "EstadoUsuario" NOT NULL,
    "email" VARCHAR(255),
    "token_recuperacion" VARCHAR(255),
    "expiracion_token" TIMESTAMP(3),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" VARCHAR(20) NOT NULL,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "usuario_rol" (
    "id_usuario" VARCHAR(10) NOT NULL,
    "id_rol" INTEGER NOT NULL,

    CONSTRAINT "usuario_rol_pkey" PRIMARY KEY ("id_usuario","id_rol")
);

-- CreateTable
CREATE TABLE "curso" (
    "id_curso" SERIAL NOT NULL,
    "id_aniolectivo" INTEGER NOT NULL,
    "nombre_curso" VARCHAR(15) NOT NULL,

    CONSTRAINT "curso_pkey" PRIMARY KEY ("id_curso")
);

-- CreateTable
CREATE TABLE "usuario_curso" (
    "id_usuario" VARCHAR(10) NOT NULL,
    "id_curso" INTEGER NOT NULL,

    CONSTRAINT "usuario_curso_pkey" PRIMARY KEY ("id_usuario","id_curso")
);

-- CreateTable
CREATE TABLE "materia" (
    "id_materia" SERIAL NOT NULL,
    "nombre_materia" VARCHAR(30) NOT NULL,

    CONSTRAINT "materia_pkey" PRIMARY KEY ("id_materia")
);

-- CreateTable
CREATE TABLE "curso_materia" (
    "id_curso" INTEGER NOT NULL,
    "id_materia" INTEGER NOT NULL,

    CONSTRAINT "curso_materia_pkey" PRIMARY KEY ("id_curso","id_materia")
);

-- CreateTable
CREATE TABLE "profesor_materia_curso" (
    "id_usuario" VARCHAR(10) NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_materia" INTEGER NOT NULL,

    CONSTRAINT "profesor_materia_curso_pkey" PRIMARY KEY ("id_usuario","id_curso","id_materia")
);

-- CreateTable
CREATE TABLE "parcial" (
    "id_parcial" SERIAL NOT NULL,
    "id_materia" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "numero_parcial" INTEGER NOT NULL,

    CONSTRAINT "parcial_pkey" PRIMARY KEY ("id_parcial")
);

-- CreateTable
CREATE TABLE "actividad" (
    "id_actividad" SERIAL NOT NULL,
    "id_parcial" INTEGER NOT NULL,
    "tipo_actividad" "TipoActividad" NOT NULL,
    "fecha_inicio_entrega" DATE NOT NULL,
    "fecha_fin_entrega" DATE NOT NULL,
    "descripcion" VARCHAR(200),
    "titulo_actividad" VARCHAR(20),
    "valor_maximo" DOUBLE PRECISION NOT NULL DEFAULT 100.0,

    CONSTRAINT "actividad_pkey" PRIMARY KEY ("id_actividad")
);

-- CreateTable
CREATE TABLE "calificacion" (
    "id_calificacion" SERIAL NOT NULL,
    "id_usuario" VARCHAR(10) NOT NULL,
    "id_actividad" INTEGER NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "comentario" VARCHAR(200),

    CONSTRAINT "calificacion_pkey" PRIMARY KEY ("id_calificacion")
);

-- CreateTable
CREATE TABLE "evidencias" (
    "id_evidencia" SERIAL NOT NULL,
    "id_usuario" VARCHAR(10) NOT NULL,
    "id_actividad" INTEGER NOT NULL,
    "url_archivo" VARCHAR(255),
    "nombre_archivo" VARCHAR(255) NOT NULL,
    "fecha_subida" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "tamanio" BIGINT NOT NULL,
    "tipo_contenido" VARCHAR(255) NOT NULL,
    "estado" "EstadoEvidencia" NOT NULL DEFAULT 'ACTIVO',
    "nombre_actividad" VARCHAR(255) NOT NULL,
    "codigo_actividad" VARCHAR(255) NOT NULL,
    "tipo_actividad" VARCHAR(255) NOT NULL,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id_evidencia")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id_notificacion" SERIAL NOT NULL,
    "id_usuario" VARCHAR(10) NOT NULL,
    "id_actividad" INTEGER,
    "tipo_notificacion" "TipoNotificacion" NOT NULL,
    "mensaje_notificacion" VARCHAR(255) NOT NULL,
    "fecha_notificacion" TIMESTAMP(3) NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateTable
CREATE TABLE "promedio_materia_estudiante" (
    "id_promedio_materia" SERIAL NOT NULL,
    "id_usuario" VARCHAR(10) NOT NULL,
    "id_aniolectivo" INTEGER NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_materia" INTEGER NOT NULL,
    "promedio_parcial1" DOUBLE PRECISION,
    "promedio_parcial2" DOUBLE PRECISION,
    "promedio_parcial3" DOUBLE PRECISION,
    "promedio_final_materia" DOUBLE PRECISION,
    "fecha_actualizacion" TIMESTAMP(3),

    CONSTRAINT "promedio_materia_estudiante_pkey" PRIMARY KEY ("id_promedio_materia")
);

-- CreateTable
CREATE TABLE "promediogeneralestudiante" (
    "id_promedio_general" SERIAL NOT NULL,
    "id_usuario" VARCHAR(10) NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "promedio_general" DOUBLE PRECISION NOT NULL,
    "comportamiento" VARCHAR(1) NOT NULL,

    CONSTRAINT "promediogeneralestudiante_pkey" PRIMARY KEY ("id_promedio_general")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_parcial_materia_curso_numero" ON "parcial"("id_materia", "id_curso", "numero_parcial");

-- CreateIndex
CREATE UNIQUE INDEX "calificacion_id_usuario_id_actividad_key" ON "calificacion"("id_usuario", "id_actividad");

-- CreateIndex
CREATE UNIQUE INDEX "evidencias_codigo_actividad_key" ON "evidencias"("codigo_actividad");

-- CreateIndex
CREATE UNIQUE INDEX "evidencias_id_usuario_id_actividad_key" ON "evidencias"("id_usuario", "id_actividad");

-- CreateIndex
CREATE UNIQUE INDEX "promedio_materia_estudiante_id_usuario_id_aniolectivo_id_cu_key" ON "promedio_materia_estudiante"("id_usuario", "id_aniolectivo", "id_curso", "id_materia");

-- CreateIndex
CREATE UNIQUE INDEX "promediogeneralestudiante_id_usuario_id_curso_key" ON "promediogeneralestudiante"("id_usuario", "id_curso");

-- AddForeignKey
ALTER TABLE "usuario_rol" ADD CONSTRAINT "usuario_rol_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_rol" ADD CONSTRAINT "usuario_rol_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso" ADD CONSTRAINT "curso_id_aniolectivo_fkey" FOREIGN KEY ("id_aniolectivo") REFERENCES "anio_lectivo"("id_aniolectivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_curso" ADD CONSTRAINT "usuario_curso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_curso" ADD CONSTRAINT "usuario_curso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_materia" ADD CONSTRAINT "curso_materia_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_materia" ADD CONSTRAINT "curso_materia_id_materia_fkey" FOREIGN KEY ("id_materia") REFERENCES "materia"("id_materia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesor_materia_curso" ADD CONSTRAINT "profesor_materia_curso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesor_materia_curso" ADD CONSTRAINT "profesor_materia_curso_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesor_materia_curso" ADD CONSTRAINT "profesor_materia_curso_id_materia_fkey" FOREIGN KEY ("id_materia") REFERENCES "materia"("id_materia") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcial" ADD CONSTRAINT "parcial_id_materia_fkey" FOREIGN KEY ("id_materia") REFERENCES "materia"("id_materia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcial" ADD CONSTRAINT "parcial_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividad" ADD CONSTRAINT "actividad_id_parcial_fkey" FOREIGN KEY ("id_parcial") REFERENCES "parcial"("id_parcial") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificacion" ADD CONSTRAINT "calificacion_id_actividad_fkey" FOREIGN KEY ("id_actividad") REFERENCES "actividad"("id_actividad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_id_actividad_fkey" FOREIGN KEY ("id_actividad") REFERENCES "actividad"("id_actividad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_id_actividad_fkey" FOREIGN KEY ("id_actividad") REFERENCES "actividad"("id_actividad") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promedio_materia_estudiante" ADD CONSTRAINT "promedio_materia_estudiante_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promedio_materia_estudiante" ADD CONSTRAINT "promedio_materia_estudiante_id_aniolectivo_fkey" FOREIGN KEY ("id_aniolectivo") REFERENCES "anio_lectivo"("id_aniolectivo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promedio_materia_estudiante" ADD CONSTRAINT "promedio_materia_estudiante_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promedio_materia_estudiante" ADD CONSTRAINT "promedio_materia_estudiante_id_materia_fkey" FOREIGN KEY ("id_materia") REFERENCES "materia"("id_materia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promediogeneralestudiante" ADD CONSTRAINT "promediogeneralestudiante_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promediogeneralestudiante" ADD CONSTRAINT "promediogeneralestudiante_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;
