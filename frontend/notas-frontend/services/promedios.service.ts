import api from '@/lib/axios';
import { PromedioMateria, PromedioGeneral } from '@/types';

export const promediosService = {
  getByMateria: (idUsuario: string, idAnioLectivo: number) =>
    api.get<PromedioMateria[]>('/promedios/materia', {
      params: { idUsuario, idAnioLectivo },
    }).then((r) => r.data),

  getGeneral: (idUsuario: string, idCurso: number) =>
    api.get<PromedioGeneral>('/promedios/general', {
      params: { idUsuario, idCurso },
    }).then((r) => r.data),

  getByCursoMateria: (idCurso: number, idMateria: number) =>
    api.get<Array<PromedioMateria & { usuario: { idUsuario: string; nombreCompleto: string } }>>(
      '/promedios/curso-materia',
      { params: { idCurso, idMateria } },
    ).then((r) => r.data),

  getRanking: (idCurso: number) =>
    api.get(`/promedios/curso/${idCurso}/ranking`).then((r) => r.data),

  recalcularMateria: (dto: {
    idUsuario: string;
    idCurso: number;
    idMateria: number;
    idAnioLectivo: number;
  }) => api.post('/promedios/materia/recalcular', dto).then((r) => r.data),

  recalcularGeneral: (dto: { idUsuario: string; idCurso: number }) =>
    api.post('/promedios/general/recalcular', dto).then((r) => r.data),
};
