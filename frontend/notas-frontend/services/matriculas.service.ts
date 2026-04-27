import api from '@/lib/axios';
import { CreateMatriculaDto } from '@/types';

export interface EstudianteMatriculado {
  idCurso: number;
  usuario: {
    idUsuario: string;
    nombreCompleto: string;
    estadoUsuario: string;
    email: string | null;
  };
}

export interface MiMatricula {
  idCurso: number;
  curso: {
    idCurso: number;
    nombreCurso: string;
    idAnioLectivo: number;
    anioLectivo: { idAnioLectivo: number; fechaInicio: string; fechaFinal: string; estadoLectivo: string };
    materias: { materia: { idMateria: number; nombreMateria: string } }[];
  };
}

export const matriculasService = {
  getAll: (idCurso: number) =>
    api.get<EstudianteMatriculado[]>('/matriculas', { params: { idCurso } }).then((r) => r.data),

  getMiMatricula: (idAnioLectivo?: number) =>
    api
      .get<MiMatricula | null>('/matriculas/mi-matricula', {
        params: idAnioLectivo ? { idAnioLectivo } : {},
      })
      .then((r) => r.data),

  create: (dto: CreateMatriculaDto) =>
    api.post('/matriculas', dto).then((r) => r.data),

  remove: (dto: CreateMatriculaDto) =>
    api.delete('/matriculas', { data: dto }).then((r) => r.data),
};
