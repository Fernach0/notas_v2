import api from '@/lib/axios';
import { Materia, CreateMateriaDto } from '@/types';

export const materiasService = {
  getAll: () =>
    api.get<Materia[]>('/materias').then((r) => r.data),

  create: (dto: CreateMateriaDto) =>
    api.post<Materia>('/materias', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateMateriaDto>) =>
    api.patch<Materia>(`/materias/${id}`, dto).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/materias/${id}`).then((r) => r.data),
};
