import api from '@/lib/axios';
import { AnioLectivo, CreateAnioLectivoDto } from '@/types';

export const aniosLectivosService = {
  getAll: (estado?: string) =>
    api.get<AnioLectivo[]>('/anios-lectivos', { params: estado ? { estado } : {} }).then((r) => r.data),

  create: (dto: CreateAnioLectivoDto) =>
    api.post<AnioLectivo>('/anios-lectivos', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateAnioLectivoDto>) =>
    api.patch<AnioLectivo>(`/anios-lectivos/${id}`, dto).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/anios-lectivos/${id}`).then((r) => r.data),
};
