import api from '@/lib/axios';
import { Parcial } from '@/types';

export const parcialesService = {
  getAll: (idCurso: number, idMateria: number) =>
    api.get<Parcial[]>('/parciales', { params: { idCurso, idMateria } }).then((r) => r.data),

  create: (dto: { idMateria: number; idCurso: number; numeroParcial: number }) =>
    api.post<Parcial>('/parciales', dto).then((r) => r.data),

  createBulk: (dto: { idMateria: number; idCurso: number }) =>
    api.post<Parcial[]>('/parciales/bulk', dto).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/parciales/${id}`).then((r) => r.data),
};
