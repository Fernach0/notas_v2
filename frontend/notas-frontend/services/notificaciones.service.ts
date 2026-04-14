import api from '@/lib/axios';
import { Notificacion } from '@/types';

export const notificacionesService = {
  getAll: (leida?: boolean) =>
    api.get<Notificacion[]>('/notificaciones', {
      params: leida !== undefined ? { leida } : {},
    }).then((r) => r.data),

  markRead: (id: number) =>
    api.patch(`/notificaciones/${id}/leer`).then((r) => r.data),

  markAllRead: () =>
    api.patch('/notificaciones/leer-todas').then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/notificaciones/${id}`).then((r) => r.data),
};
