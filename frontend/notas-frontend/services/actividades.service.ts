import api from '@/lib/axios';
import { Actividad, CreateActividadDto } from '@/types';

export const actividadesService = {
  getAll: (idParcial: number) =>
    api.get<Actividad[]>('/actividades', { params: { idParcial } }).then((r) => r.data),

  getOne: (id: number) =>
    api.get<Actividad>(`/actividades/${id}`).then((r) => r.data),

  create: (dto: CreateActividadDto) =>
    api.post<Actividad>('/actividades', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateActividadDto>) =>
    api.patch<Actividad>(`/actividades/${id}`, dto).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/actividades/${id}`).then((r) => r.data),
};
