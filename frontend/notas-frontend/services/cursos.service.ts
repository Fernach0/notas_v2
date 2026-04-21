import api from '@/lib/axios';
import { Curso, CreateCursoDto, MiCurso } from '@/types';

export const cursosService = {
  getAll: (idAnioLectivo?: number) =>
    api.get<Curso[]>('/cursos', { params: idAnioLectivo ? { idAnioLectivo } : {} }).then((r) => r.data),

  getOne: (id: number) =>
    api.get<Curso>(`/cursos/${id}`).then((r) => r.data),

  getMisCursos: () =>
    api.get<MiCurso[]>('/cursos/mis-cursos').then((r) => r.data),

  create: (dto: CreateCursoDto) =>
    api.post<Curso>('/cursos', dto).then((r) => r.data),

  update: (id: number, dto: Partial<CreateCursoDto>) =>
    api.patch<Curso>(`/cursos/${id}`, dto).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/cursos/${id}`).then((r) => r.data),

  assignMateria: (idCurso: number, idMateria: number) =>
    api.post(`/cursos/${idCurso}/materias`, { idMateria }).then((r) => r.data),

  removeMateria: (idCurso: number, idMateria: number) =>
    api.delete(`/cursos/${idCurso}/materias/${idMateria}`).then((r) => r.data),
};
