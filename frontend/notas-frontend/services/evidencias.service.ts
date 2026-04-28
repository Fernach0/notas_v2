import api from '@/lib/axios';
import { Evidencia } from '@/types';

export interface MiEvidencia {
  idEvidencia: number;
  idActividad: number;
  nombreArchivo: string;
  fechaSubida: string | null;
  estado: string;
}

async function fetchBlob(id: number) {
  const res = await api.get<Blob>(`/evidencias/${id}/descargar`, { responseType: 'blob' });
  const disposition = res.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="(.+?)"/);
  const filename = match ? decodeURIComponent(match[1]) : 'evidencia.pdf';
  return { blob: res.data, filename };
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

  // Abre el PDF en una nueva pestaña con el token incluido
  verEnPestana: async (id: number): Promise<boolean> => {
    try {
      const { blob } = await fetchBlob(id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return true;
    } catch {
      return false;
    }
  },

  // Descarga el archivo directamente al equipo
  descargar: async (id: number): Promise<boolean> => {
    try {
      const { blob, filename } = await fetchBlob(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  },

  softDelete: (id: number) => api.delete(`/evidencias/${id}`).then((r) => r.data),
};
