import api from '@/lib/axios';
import { Evidencia } from '@/types';

export interface MiEvidencia {
  idEvidencia: number;
  idActividad: number;
  nombreArchivo: string;
  fechaSubida: string | null;
  estado: string;
}

export const evidenciasService = {
  // Para profesor/admin — evidencias de una actividad con datos del alumno
  getAll: (idActividad: number) =>
    api.get<Evidencia[]>('/evidencias', { params: { idActividad } }).then((r) => r.data),

  // Para estudiante — solo sus propias entregas
  getMisEvidencias: (idActividad?: number) =>
    api
      .get<MiEvidencia[]>('/evidencias/mis-evidencias', {
        params: idActividad ? { idActividad } : {},
      })
      .then((r) => r.data),

  upload: (formData: FormData) =>
    api
      .post<Evidencia>('/evidencias', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  getDownloadUrl: (id: number) =>
    `${process.env.NEXT_PUBLIC_API_URL}/evidencias/${id}/descargar`,

  softDelete: (id: number) => api.delete(`/evidencias/${id}`).then((r) => r.data),
};
