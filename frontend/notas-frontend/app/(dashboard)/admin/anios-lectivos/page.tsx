'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aniosLectivosService } from '@/services/anios-lectivos.service';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { useSearchDebounce } from '@/hooks/useSearchDebounce';
import { AnioLectivo } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AnioLectivoForm from '@/components/forms/AnioLectivoForm';
import ToastContainer from '@/components/ui/Toast';
import Badge, { estadoLectivoBadge } from '@/components/ui/Badge';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import SearchBar from '@/components/ui/SearchBar';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function AniosLectivosPage() {
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const createModal = useModal();
  const editModal = useModal<AnioLectivo>();
  const deleteModal = useModal<AnioLectivo>();
  const { searchInput, setSearchInput, debouncedSearch } = useSearchDebounce(200);

  const { data: anios, isLoading } = useQuery({
    queryKey: ['anios-lectivos'],
    queryFn: () => aniosLectivosService.getAll(),
  });

  const aniosFiltrados = (anios ?? []).filter((a) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      a.estadoLectivo.toLowerCase().includes(q) ||
      a.fechaInicio.includes(q) ||
      a.fechaFinal.includes(q) ||
      String(a.idAnioLectivo).includes(q)
    );
  });

  const createMutation = useMutation({
    mutationFn: aniosLectivosService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anios-lectivos'] }); createModal.close(); show('Año lectivo creado'); },
    onError: () => show('Error al crear', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => aniosLectivosService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anios-lectivos'] }); editModal.close(); show('Año lectivo actualizado'); },
    onError: () => show('Error al actualizar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aniosLectivosService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['anios-lectivos'] }); deleteModal.close(); show('Año lectivo eliminado'); },
    onError: () => show('Error al eliminar', 'error'),
  });

  const fmt = (d: string) => new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Años Lectivos</h1>
          <p className="text-sm text-slate-500">Gestiona los períodos académicos</p>
        </div>
        <button onClick={() => createModal.open()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
          <PlusIcon className="h-4 w-4" /> Nuevo año lectivo
        </button>
      </div>

      <div className="mb-4">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Buscar por estado, fecha o ID..."
          className="w-72"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? <Spinner /> : aniosFiltrados.length === 0 ? <EmptyState message={debouncedSearch ? 'Sin resultados para esa búsqueda' : 'No hay años lectivos creados'} /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Inicio</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fin</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aniosFiltrados.map((a) => (
                <tr key={a.idAnioLectivo} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{a.idAnioLectivo}</td>
                  <td className="px-5 py-3.5 text-slate-700">{fmt(a.fechaInicio)}</td>
                  <td className="px-5 py-3.5 text-slate-700">{fmt(a.fechaFinal)}</td>
                  <td className="px-5 py-3.5">
                    <Badge label={a.estadoLectivo} variant={estadoLectivoBadge(a.estadoLectivo)} />
                  </td>
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

      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Nuevo año lectivo">
        <AnioLectivoForm onSubmit={(d) => createMutation.mutateAsync(d)} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Editar año lectivo">
        <AnioLectivoForm item={editModal.item} onSubmit={(d) => updateMutation.mutateAsync({ id: editModal.item!.idAnioLectivo, data: d })} isLoading={updateMutation.isPending} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => deleteMutation.mutate(deleteModal.item!.idAnioLectivo)}
        message={`¿Eliminar el año lectivo ${fmt(deleteModal.item?.fechaInicio ?? '')} — ${fmt(deleteModal.item?.fechaFinal ?? '')}?`}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
