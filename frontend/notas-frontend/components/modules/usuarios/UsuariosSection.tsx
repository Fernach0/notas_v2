'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuariosService } from '@/services/usuarios.service';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { Usuario } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import UsuarioForm from '@/components/forms/UsuarioForm';
import ToastContainer from '@/components/ui/Toast';
import Badge, { estadoUsuarioBadge } from '@/components/ui/Badge';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const ROLE_LABELS: Record<number, string> = { 1: 'Admin', 2: 'Profesor', 3: 'Estudiante' };

export default function UsuariosSection() {
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const createModal = useModal();
  const editModal = useModal<Usuario>();
  const deleteModal = useModal<Usuario>();

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { roles, contrasenaUsuario, ...rest } = data;
      const usuario = await usuariosService.create({ ...rest, contrasenaUsuario, roles });
      return usuario;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); createModal.close(); show('Usuario creado correctamente'); },
    onError: (e: any) => show(e?.response?.data?.message ?? 'Error al crear usuario', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { contrasenaUsuario, roles, idUsuario, ...rest } = data;
      return usuariosService.update(id, rest);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); editModal.close(); show('Usuario actualizado'); },
    onError: () => show('Error al actualizar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usuariosService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); deleteModal.close(); show('Usuario eliminado'); },
    onError: () => show('Error al eliminar', 'error'),
  });

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-sm text-slate-500">Administra los usuarios del sistema</p>
        </div>
        <button onClick={() => createModal.open()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
          <PlusIcon className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? <Spinner /> : usuarios?.length === 0 ? <EmptyState message="No hay usuarios registrados" /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cédula</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Roles</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios?.map((u) => (
                <tr key={u.idUsuario} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{u.idUsuario}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{u.nombreCompleto}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{u.email ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1 flex-wrap">
                      {u.roles.map((r) => (
                        <span key={r.idRol} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{ROLE_LABELS[r.idRol]}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge label={u.estadoUsuario} variant={estadoUsuarioBadge(u.estadoUsuario)} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => editModal.open(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteModal.open(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
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

      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Nuevo usuario" size="md">
        <UsuarioForm onSubmit={(d) => createMutation.mutateAsync(d)} isLoading={createMutation.isPending} />
      </Modal>

      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Editar usuario" size="md">
        <UsuarioForm item={editModal.item} onSubmit={(d) => updateMutation.mutateAsync({ id: editModal.item!.idUsuario, data: d })} isLoading={updateMutation.isPending} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => deleteMutation.mutate(deleteModal.item!.idUsuario)}
        message={`¿Eliminar al usuario "${deleteModal.item?.nombreCompleto}"?`}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
