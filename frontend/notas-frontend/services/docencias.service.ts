import api from '@/lib/axios';
import { CreateDocenciaDto } from '@/types';

export const docenciasService = {
  getAll: (idUsuario?: string) =>
    api.get('/docencias', { params: idUsuario ? { idUsuario } : {} }).then((r) => r.data),

  create: (dto: CreateDocenciaDto) =>
    api.post('/docencias', dto).then((r) => r.data),

  remove: (dto: CreateDocenciaDto) =>
    api.delete('/docencias', { data: dto }).then((r) => r.data),
};
