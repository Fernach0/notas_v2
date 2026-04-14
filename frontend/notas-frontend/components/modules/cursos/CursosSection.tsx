'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cursosService } from '@/services/cursos.service';
import { aniosLectivosService } from '@/services/anios-lectivos.service';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { Curso } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import CursoForm from '@/components/forms/CursoForm';
import ToastContainer from '@/components/ui/Toast';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function CursosSection() {
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const [filtroAnio, setFiltroAnio] = useState<number | undefined>();
  const createModal = useModal();
  const editModal = useModal<Curso>();
  const deleteModal = useModal<Curso>();

  const { data: anios } = useQuery({
    queryKey: ['anios-lectivos'],
    queryFn: () => aniosLectivosService.getAll(),
  });

  const { data: cursos, isLoading } = useQuery({
    queryKey: ['cursos', filtroAnio],
    queryFn: () => cursosService.getAll(filtroAnio),
  });

  const createMutation = useMutation({
    mutationFn: cursosService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cursos'] }); createModal.close(); show('Curso creado'); },
    onError: () => show('Error al crear el curso', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => cursosService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cursos'] }); editModal.close(); show('Curso actualizado'); },
    onError: () => show('Error al actualizar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => cursosService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cursos'] }); deleteModal.close(); show('Curso eliminado'); },
    onError: () => show('Error al eliminar', 'error'),
  });

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Cursos</h1>
          <p className="text-sm text-slate-500">Gestiona los cursos por año lectivo</p>
        </div>
        <button onClick={() => createModal.open()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
          <PlusIcon className="h-4 w-4" /> Nuevo curso
        </button>
      </div>

      {/* Filtro */}
      <div className="mb-4">
        <select
          value={filtroAnio ?? ''}
          onChange={(e) => setFiltroAnio(e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los años</option>
          {anios?.map((a) => (
            <option key={a.idAnioLectivo} value={a.idAnioLectivo}>
              {a.fechaInicio.split('T')[0]} — {a.fechaFinal.split('T')[0]}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? <Spinner /> : cursos?.length === 0 ? <EmptyState message="No hay cursos para este año" /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Curso</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Año lectivo</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cursos?.map((c) => (
                <tr key={c.idCurso} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{c.nombreCurso}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs font-mono">Año {c.idAnioLectivo}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => editModal.open(c)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteModal.open(c)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
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

      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Nuevo curso" size="sm">
        <CursoForm onSubmit={(d) => createMutation.mutateAsync(d)} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Editar curso" size="sm">
        <CursoForm item={editModal.item} onSubmit={(d) => updateMutation.mutateAsync({ id: editModal.item!.idCurso, data: d })} isLoading={updateMutation.isPending} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => deleteMutation.mutate(deleteModal.item!.idCurso)}
        message={`¿Eliminar el curso "${deleteModal.item?.nombreCurso}"?`}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
