import api from '@/lib/axios';
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '@/types';

export const usuariosService = {
  getAll: (params?: { rol?: number; estado?: string }) =>
    api.get<Usuario[]>('/usuarios', { params }).then((r) => r.data),

  getOne: (idUsuario: string) =>
    api.get<Usuario>(`/usuarios/${idUsuario}`).then((r) => r.data),

  create: (dto: CreateUsuarioDto) =>
    api.post<Usuario>('/usuarios', dto).then((r) => r.data),

  update: (idUsuario: string, dto: UpdateUsuarioDto) =>
    api.patch<Usuario>(`/usuarios/${idUsuario}`, dto).then((r) => r.data),

  remove: (idUsuario: string) =>
    api.delete(`/usuarios/${idUsuario}`).then((r) => r.data),

  assignRol: (idUsuario: string, idRol: number) =>
    api.post(`/usuarios/${idUsuario}/roles`, { idRol }).then((r) => r.data),

  removeRol: (idUsuario: string, idRol: number) =>
    api.delete(`/usuarios/${idUsuario}/roles/${idRol}`).then((r) => r.data),
};
