import api from '@/lib/axios';
import { PerfilUsuario } from '@/types';

export const authService = {
  getMe: () => api.get<PerfilUsuario>('/auth/me').then((r) => r.data),
};
