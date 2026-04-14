import api from '@/lib/axios';
import { CreateMatriculaDto, Usuario } from '@/types';

export const matriculasService = {
  getAll: (idCurso: number) =>
    api.get<Usuario[]>('/matriculas', { params: { idCurso } }).then((r) => r.data),

  create: (dto: CreateMatriculaDto) =>
    api.post('/matriculas', dto).then((r) => r.data),

  remove: (dto: CreateMatriculaDto) =>
    api.delete('/matriculas', { data: dto }).then((r) => r.data),
};
