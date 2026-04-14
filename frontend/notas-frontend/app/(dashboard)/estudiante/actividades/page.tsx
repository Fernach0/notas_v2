'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parcialesService } from '@/services/parciales.service';
import { actividadesService } from '@/services/actividades.service';
import { evidenciasService } from '@/services/evidencias.service';
import { calificacionesService } from '@/services/calificaciones.service';
import { aniosLectivosService } from '@/services/anios-lectivos.service';
import { matriculasService } from '@/services/matriculas.service';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { Actividad } from '@/types';
import Modal from '@/components/ui/Modal';
import EvidenciaUploadForm from '@/components/forms/EvidenciaUploadForm';
import ToastContainer from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { DocumentArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';

const fmt = (d: string) => new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
const isVencida = (fin: string) => new Date(fin) < new Date();

const TIPO_COLORS: Record<string, 'blue' | 'red' | 'green' | 'yellow'> = {
  TAREA: 'blue', EXAMEN: 'red', PROYECTO: 'green', LECCION: 'yellow',
};

export default function ActividadesEstudiantePage() {
  const { user } = useAuth();
  const [parcialActivo, setParcialActivo] = useState(1);
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const uploadModal = useModal<Actividad>();

  const { data: anios } = useQuery({
    queryKey: ['anios-lectivos'],
    queryFn: () => aniosLectivosService.getAll('ACTIVO'),
  });
  const anioActivo = anios?.[0];

  // Obtener el idCurso del estudiante
  const { data: matriculas } = useQuery({
    queryKey: ['mis-matriculas', user?.idUsuario],
    queryFn: async () => {
      // El estudiante puede estar en múltiples cursos; usamos el primer curso del año activo
      return [];
    },
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => evidenciasService.upload(fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evidencias'] }); uploadModal.close(); show('Evidencia subida correctamente'); },
    onError: () => show('Error al subir la evidencia', 'error'),
  });

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">Actividades</h1>
        <p className="text-sm text-slate-500">Tus tareas, exámenes y proyectos</p>
      </div>

      {/* Tabs parciales */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
        {[1, 2, 3].map((n) => (
          <button key={n} onClick={() => setParcialActivo(n)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${parcialActivo === n ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Parcial {n}
          </button>
        ))}
      </div>

      <div className="text-sm text-slate-500 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p>Tus actividades aparecen aquí según el curso al que estés matriculado. Si no ves actividades, consulta con el administrador o el profesor.</p>
      </div>

      {/* Modal subida evidencia */}
      <Modal isOpen={uploadModal.isOpen} onClose={uploadModal.close} title="Subir evidencia PDF" size="sm">
        {uploadModal.item && (
          <EvidenciaUploadForm
            idActividad={uploadModal.item.idActividad}
            nombreActividad={uploadModal.item.tituloActividad ?? 'Actividad'}
            tipoActividad={uploadModal.item.tipoActividad}
            onSubmit={(fd) => uploadMutation.mutateAsync(fd)}
            isLoading={uploadMutation.isPending}
          />
        )}
      </Modal>
    </>
  );
}
