'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materiasService } from '@/services/materias.service';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { Materia } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MateriaForm from '@/components/forms/MateriaForm';
import ToastContainer from '@/components/ui/Toast';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function MateriasSection() {
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const createModal = useModal();
  const editModal = useModal<Materia>();
  const deleteModal = useModal<Materia>();

  const { data: materias, isLoading } = useQuery({
    queryKey: ['materias'],
    queryFn: materiasService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: materiasService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materias'] }); createModal.close(); show('Materia creada correctamente'); },
    onError: () => show('Error al crear la materia', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => materiasService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materias'] }); editModal.close(); show('Materia actualizada'); },
    onError: () => show('Error al actualizar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => materiasService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materias'] }); deleteModal.close(); show('Materia eliminada'); },
    onError: () => show('Error al eliminar', 'error'),
  });

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Materias</h1>
          <p className="text-sm text-slate-500">Administra el catálogo de materias</p>
        </div>
        <button onClick={() => createModal.open()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
          <PlusIcon className="h-4 w-4" /> Nueva materia
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? <Spinner /> : materias?.length === 0 ? <EmptyState message="No hay materias creadas" /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materias?.map((m) => (
                <tr key={m.idMateria} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{m.idMateria}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{m.nombreMateria}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => editModal.open(m)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteModal.open(m)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
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

      {/* Modal Crear */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Nueva materia" size="sm">
        <MateriaForm onSubmit={(d) => createMutation.mutateAsync(d)} isLoading={createMutation.isPending} />
      </Modal>

      {/* Modal Editar */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Editar materia" size="sm">
        <MateriaForm item={editModal.item} onSubmit={(d) => updateMutation.mutateAsync({ id: editModal.item!.idMateria, data: d })} isLoading={updateMutation.isPending} />
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => deleteMutation.mutate(deleteModal.item!.idMateria)}
        message={`¿Eliminar la materia "${deleteModal.item?.nombreMateria}"? Esta acción no se puede deshacer.`}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
