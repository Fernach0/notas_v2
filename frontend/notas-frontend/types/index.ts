// ============================================================
// Enums del backend
// ============================================================
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
export type EstadoLectivo = 'ACTIVO' | 'FINALIZADO' | 'PLANIFICADO';
export type EstadoEvidencia = 'ACTIVO' | 'ELIMINADO';
export type TipoActividad = 'TAREA' | 'EXAMEN' | 'PROYECTO' | 'LECCION';
export type TipoNotificacion = 'NUEVA_ACTIVIDAD' | 'CALIFICACION' | 'RECORDATORIO' | 'SISTEMA';

// ============================================================
// Entidades
// ============================================================
export interface Rol {
  idRol: number;
  nombreRol: string;
}

export interface Usuario {
  idUsuario: string;
  nombreCompleto: string;
  estadoUsuario: EstadoUsuario;
  email?: string;
  roles: { idRol: number }[];
}

export interface AnioLectivo {
  idAnioLectivo: number;
  fechaInicio: string;
  fechaFinal: string;
  estadoLectivo: EstadoLectivo;
}

export interface Curso {
  idCurso: number;
  idAnioLectivo: number;
  nombreCurso: string;
  anioLectivo?: AnioLectivo;
}

export interface Materia {
  idMateria: number;
  nombreMateria: string;
}

export interface Parcial {
  idParcial: number;
  idMateria: number;
  idCurso: number;
  numeroParcial: number;
}

export interface Actividad {
  idActividad: number;
  idParcial: number;
  tipoActividad: TipoActividad;
  fechaInicioEntrega: string;
  fechaFinEntrega: string;
  descripcion?: string;
  tituloActividad?: string;
  valorMaximo: number;
}

export interface Calificacion {
  idCalificacion: number;
  idUsuario: string;
  idActividad: number;
  nota: number;
  comentario?: string;
}

export interface Evidencia {
  idEvidencia: number;
  idUsuario: string;
  idActividad: number;
  urlArchivo?: string;
  nombreArchivo: string;
  fechaSubida?: string;
  estado: EstadoEvidencia;
  nombreActividad: string;
  codigoActividad: string;
  tipoActividad: string;
}

export interface Notificacion {
  idNotificacion: number;
  idUsuario: string;
  idActividad?: number;
  tipoNotificacion: TipoNotificacion;
  mensajeNotificacion: string;
  fechaNotificacion: string;
  leida: boolean;
}

export interface PromedioMateria {
  idPromedioMateria: number;
  idUsuario: string;
  idAnioLectivo: number;
  idCurso: number;
  idMateria: number;
  promedioParcial1?: number;
  promedioParcial2?: number;
  promedioParcial3?: number;
  promedioFinalMateria?: number;
  fechaActualizacion?: string;
}

export interface PromedioGeneral {
  idPromedioGeneral: number;
  idUsuario: string;
  idCurso: number;
  promedioGeneral: number;
  comportamiento: string;
}

// ============================================================
// DTOs de creación / actualización
// ============================================================
export interface CreateUsuarioDto {
  idUsuario: string;
  nombreCompleto: string;
  contrasenaUsuario: string;
  email?: string;
  estadoUsuario: EstadoUsuario;
  roles?: number[];
}

export interface UpdateUsuarioDto {
  nombreCompleto?: string;
  email?: string;
  estadoUsuario?: EstadoUsuario;
}

export interface CreateAnioLectivoDto {
  fechaInicio: string;
  fechaFinal: string;
  estadoLectivo: EstadoLectivo;
}

export interface CreateCursoDto {
  idAnioLectivo: number;
  nombreCurso: string;
}

export interface CreateMateriaDto {
  nombreMateria: string;
}

export interface CreateMatriculaDto {
  idUsuario: string;
  idCurso: number;
}

export interface CreateDocenciaDto {
  idUsuario: string;
  idCurso: number;
  idMateria: number;
}

export interface CreateActividadDto {
  idParcial: number;
  tipoActividad: TipoActividad;
  fechaInicioEntrega: string;
  fechaFinEntrega: string;
  descripcion?: string;
  tituloActividad?: string;
  valorMaximo?: number;
}

export interface CreateCalificacionDto {
  idUsuario: string;
  idActividad: number;
  nota: number;
  comentario?: string;
}

export interface BulkCalificacionItemDto {
  idUsuario: string;
  nota: number;
  comentario?: string;
}

export interface BulkCalificacionDto {
  idActividad: number;
  calificaciones: BulkCalificacionItemDto[];
}

// ============================================================
// NextAuth session extension
// ============================================================
declare module 'next-auth' {
  interface Session {
    user: {
      accessToken: string;
      idUsuario: string;
      roles: number[];
      nombreCompleto: string;
      email?: string;
    };
  }
}
