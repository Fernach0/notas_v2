'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcialesService } from '@/services/parciales.service';
import { actividadesService } from '@/services/actividades.service';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { Actividad } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ActividadForm from '@/components/forms/ActividadForm';
import ToastContainer from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const TIPO_COLORS: Record<string, 'blue' | 'red' | 'green' | 'yellow'> = {
  TAREA: 'blue', EXAMEN: 'red', PROYECTO: 'green', LECCION: 'yellow',
};

const fmt = (d: string) => new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });

export default function ActividadesProfesorPage() {
  const searchParams = useSearchParams();
  const idCurso = Number(searchParams.get('idCurso'));
  const idMateria = Number(searchParams.get('idMateria'));
  const [parcialActivo, setParcialActivo] = useState(1);
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const createModal = useModal();
  const editModal = useModal<Actividad>();
  const deleteModal = useModal<Actividad>();

  const { data: parciales } = useQuery({
    queryKey: ['parciales', idCurso, idMateria],
    queryFn: () => parcialesService.getAll(idCurso, idMateria),
    enabled: !!idCurso && !!idMateria,
  });

  const parcialId = parciales?.find((p) => p.numeroParcial === parcialActivo)?.idParcial;

  const { data: actividades, isLoading } = useQuery({
    queryKey: ['actividades', parcialId],
    queryFn: () => actividadesService.getAll(parcialId!),
    enabled: !!parcialId,
  });

  const createMutation = useMutation({
    mutationFn: actividadesService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actividades'] }); createModal.close(); show('Actividad creada'); },
    onError: () => show('Error al crear', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => actividadesService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actividades'] }); editModal.close(); show('Actividad actualizada'); },
    onError: () => show('Error al actualizar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => actividadesService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actividades'] }); deleteModal.close(); show('Actividad eliminada'); },
    onError: () => show('Error al eliminar', 'error'),
  });

  if (!idCurso || !idMateria) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>Selecciona un curso y materia desde el <a href="/profesor" className="text-blue-600 underline">panel principal</a>.</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Actividades</h1>
          <p className="text-sm text-slate-500">Curso {idCurso} · Materia {idMateria}</p>
        </div>
        <button
          onClick={() => createModal.open()}
          disabled={!parcialId}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <PlusIcon className="h-4 w-4" /> Nueva actividad
        </button>
      </div>

      {/* Tabs parciales */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            onClick={() => setParcialActivo(n)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${parcialActivo === n ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Parcial {n}
          </button>
        ))}
      </div>

      {!parcialId ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          No existe el Parcial {parcialActivo} para esta materia.{' '}
          <a href="/profesor/mis-cursos" className="underline">Crear parciales</a>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? <Spinner /> : actividades?.length === 0 ? <EmptyState message="No hay actividades en este parcial" /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Título</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Entrega</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actividades?.map((a) => (
                  <tr key={a.idActividad} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{a.tituloActividad ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <Badge label={a.tipoActividad} variant={TIPO_COLORS[a.tipoActividad] ?? 'gray'} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{fmt(a.fechaInicioEntrega)} → {fmt(a.fechaFinEntrega)}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{a.valorMaximo}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => editModal.open(a)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => deleteModal.open(a)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Nueva actividad">
        <ActividadForm idParcial={parcialId!} onSubmit={(d) => createMutation.mutateAsync(d)} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Editar actividad">
        <ActividadForm idParcial={parcialId!} item={editModal.item} onSubmit={(d) => updateMutation.mutateAsync({ id: editModal.item!.idActividad, data: d })} isLoading={updateMutation.isPending} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => deleteMutation.mutate(deleteModal.item!.idActividad)}
        message={`¿Eliminar la actividad "${deleteModal.item?.tituloActividad}"?`}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
