'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcialesService } from '@/services/parciales.service';
import { actividadesService } from '@/services/actividades.service';
import { calificacionesService } from '@/services/calificaciones.service';
import { matriculasService } from '@/services/matriculas.service';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { Actividad } from '@/types';
import Modal from '@/components/ui/Modal';
import CalificacionForm from '@/components/forms/CalificacionForm';
import ToastContainer from '@/components/ui/Toast';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { CheckCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

export default function CalificacionesProfesorPage() {
  const searchParams = useSearchParams();
  const idCurso = Number(searchParams.get('idCurso'));
  const idMateria = Number(searchParams.get('idMateria'));
  const [parcialActivo, setParcialActivo] = useState(1);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const califModal = useModal<{ idUsuario: string; idCalificacion?: number; nota?: number; comentario?: string }>();

  const { data: parciales } = useQuery({
    queryKey: ['parciales', idCurso, idMateria],
    queryFn: () => parcialesService.getAll(idCurso, idMateria),
    enabled: !!idCurso && !!idMateria,
  });

  const parcialId = parciales?.find((p) => p.numeroParcial === parcialActivo)?.idParcial;

  const { data: actividades } = useQuery({
    queryKey: ['actividades', parcialId],
    queryFn: () => actividadesService.getAll(parcialId!),
    enabled: !!parcialId,
  });

  const { data: matriculados } = useQuery({
    queryKey: ['matriculas', idCurso],
    queryFn: () => matriculasService.getAll(idCurso),
    enabled: !!idCurso,
  });

  const { data: calificaciones, isLoading: loadingCalif } = useQuery({
    queryKey: ['calificaciones', actividadSeleccionada?.idActividad],
    queryFn: () => calificacionesService.getByActividad(actividadSeleccionada!.idActividad),
    enabled: !!actividadSeleccionada,
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => calificacionesService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calificaciones'] }); califModal.close(); show('Nota guardada'); },
    onError: () => show('Error al guardar nota', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => calificacionesService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calificaciones'] }); califModal.close(); show('Nota actualizada'); },
    onError: () => show('Error al actualizar nota', 'error'),
  });

  const getCalif = (idUsuario: string) =>
    calificaciones?.find((c) => c.idUsuario === idUsuario);

  if (!idCurso || !idMateria) {
    return <div className="text-center py-20 text-slate-500">Selecciona un curso y materia desde el <a href="/profesor" className="text-blue-600 underline">panel principal</a>.</div>;
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">Calificaciones</h1>
        <p className="text-sm text-slate-500">Curso {idCurso} · Materia {idMateria}</p>
      </div>

      {/* Tabs parciales */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
        {[1, 2, 3].map((n) => (
          <button key={n} onClick={() => { setParcialActivo(n); setActividadSeleccionada(null); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${parcialActivo === n ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            Parcial {n}
          </button>
        ))}
      </div>

      {/* Selector de actividad */}
      {actividades && actividades.length > 0 && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar actividad</label>
          <select onChange={(e) => setActividadSeleccionada(actividades.find((a) => a.idActividad === Number(e.target.value)) ?? null)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Seleccionar...</option>
            {actividades.map((a) => (
              <option key={a.idActividad} value={a.idActividad}>{a.tituloActividad ?? a.tipoActividad} (máx. {a.valorMaximo})</option>
            ))}
          </select>
        </div>
      )}

      {actividadSeleccionada && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loadingCalif ? <Spinner /> : matriculados?.length === 0 ? <EmptyState message="No hay estudiantes matriculados" /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estudiante</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nota</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Comentario</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matriculados?.map((est: any) => {
                  const c = getCalif(est.idUsuario);
                  return (
                    <tr key={est.idUsuario} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800">{est.nombreCompleto}</p>
                        <p className="text-xs text-slate-400 font-mono">{est.idUsuario}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {c ? (
                          <span className={`font-bold ${(c.nota ?? 0) >= 7 ? 'text-green-600' : 'text-red-600'}`}>{c.nota ?? '—'}</span>
                        ) : (
                          <span className="text-slate-400 text-xs">Sin nota</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{c?.comentario ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          <button
                            onClick={() => califModal.open({ idUsuario: est.idUsuario, idCalificacion: c?.idCalificacion, nota: c?.nota ?? undefined, comentario: c?.comentario })}
                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                          >
                            {c ? <PencilSquareIcon className="h-3.5 w-3.5" /> : <CheckCircleIcon className="h-3.5 w-3.5" />}
                            {c ? 'Editar' : 'Calificar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={califModal.isOpen} onClose={califModal.close} title="Registrar nota" size="sm">
        {califModal.item && (
          <CalificacionForm
            idUsuario={califModal.item.idUsuario}
            idActividad={actividadSeleccionada!.idActividad}
            valorMaximo={actividadSeleccionada!.valorMaximo}
            notaActual={califModal.item.nota}
            comentarioActual={califModal.item.comentario}
            onSubmit={async (d) => {
              if (califModal.item?.idCalificacion) {
                await updateMutation.mutateAsync({ id: califModal.item.idCalificacion, data: d });
              } else {
                await createMutation.mutateAsync({ idUsuario: califModal.item!.idUsuario, idActividad: actividadSeleccionada!.idActividad, ...d });
              }
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </Modal>
    </>
  );
}
