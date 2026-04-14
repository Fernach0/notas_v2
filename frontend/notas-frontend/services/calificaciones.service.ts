import api from '@/lib/axios';
import { Calificacion, CreateCalificacionDto, BulkCalificacionDto } from '@/types';

export const calificacionesService = {
  getByActividad: (idActividad: number) =>
    api.get<Calificacion[]>('/calificaciones', { params: { idActividad } }).then((r) => r.data),

  getByEstudiante: (idUsuario: string, idAnioLectivo: number) =>
    api.get<Calificacion[]>(`/calificaciones/estudiante/${idUsuario}`, {
      params: { idAnioLectivo },
    }).then((r) => r.data),

  create: (dto: CreateCalificacionDto) =>
    api.post<Calificacion>('/calificaciones', dto).then((r) => r.data),

  createBulk: (dto: BulkCalificacionDto) =>
    api.post('/calificaciones/bulk', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateCalificacionDto>) =>
    api.patch<Calificacion>(`/calificaciones/${id}`, dto).then((r) => r.data),
};
