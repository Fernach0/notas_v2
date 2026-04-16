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
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  UserGroupIcon,
  AcademicCapIcon,
  UsersIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const ROLE_LABELS: Record<number, string> = { 1: 'Admin', 2: 'Profesor', 3: 'Estudiante' };

const ROLE_COLORS: Record<number, string> = {
  1: 'bg-violet-100 text-violet-700 border border-violet-200',
  2: 'bg-blue-100 text-blue-700 border border-blue-200',
  3: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-blue-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
];

function avatarColor(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function UsuariosSection() {
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const createModal = useModal();
  const editModal = useModal<Usuario>();
  const deleteModal = useModal<Usuario>();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { roles, contrasenaUsuario, ...rest } = data;
      return usuariosService.create({ ...rest, contrasenaUsuario, roles });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      createModal.close();
      show('Usuario creado correctamente');
    },
    onError: (e: any) => show(e?.response?.data?.message ?? 'Error al crear usuario', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { contrasenaUsuario, roles, idUsuario, ...rest } = data;
      return usuariosService.update(id, rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      editModal.close();
      show('Usuario actualizado');
    },
    onError: () => show('Error al actualizar', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usuariosService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      deleteModal.close();
      show('Usuario eliminado');
    },
    onError: () => show('Error al eliminar', 'error'),
  });

  const totalAdmins = usuarios.filter((u) => u.roles.some((r) => r.idRol === 1)).length;
  const totalProfesores = usuarios.filter((u) => u.roles.some((r) => r.idRol === 2)).length;
  const totalEstudiantes = usuarios.filter((u) => u.roles.some((r) => r.idRol === 3)).length;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow">
            <UserGroupIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
            <p className="text-sm text-slate-500">Gestión de la comunidad educativa</p>
          </div>
        </div>
        <button
          onClick={() => createModal.open()}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Stats */}
      {!isLoading && usuarios.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={UsersIcon} label="Total" value={usuarios.length} color="bg-slate-600" />
          <StatCard icon={ShieldCheckIcon} label="Administradores" value={totalAdmins} color="bg-violet-600" />
          <StatCard icon={AcademicCapIcon} label="Profesores" value={totalProfesores} color="bg-blue-600" />
          <StatCard icon={UserGroupIcon} label="Estudiantes" value={totalEstudiantes} color="bg-emerald-600" />
        </div>
      )}

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <Spinner />
        ) : usuarios.length === 0 ? (
          <EmptyState message="No hay usuarios registrados" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50">
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Usuario
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Roles
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Estado
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.idUsuario} className="group hover:bg-indigo-50/40 transition-colors">
                  {/* Avatar + nombre + cédula */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(u.idUsuario)}`}
                      >
                        {getInitials(u.nombreCompleto)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{u.nombreCompleto}</p>
                        <p className="font-mono text-xs text-slate-400">{u.idUsuario}</p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-4 text-slate-500">
                    {u.email ? (
                      <span className="text-xs">{u.email}</span>
                    ) : (
                      <span className="text-xs italic text-slate-300">Sin email</span>
                    )}
                  </td>

                  {/* Roles */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {u.roles.map((r) => (
                        <span
                          key={r.idRol}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[r.idRol] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {ROLE_LABELS[r.idRol] ?? `Rol ${r.idRol}`}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-4">
                    <Badge label={u.estadoUsuario} variant={estadoUsuarioBadge(u.estadoUsuario)} />
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => editModal.open(u)}
                        title="Editar"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-100 hover:text-blue-600 transition"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteModal.open(u)}
                        title="Eliminar"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 transition"
                      >
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

      {/* Footer count */}
      {!isLoading && usuarios.length > 0 && (
        <p className="mt-3 text-right text-xs text-slate-400">
          {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} en total
        </p>
      )}

      {/* Modals */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title="Nuevo usuario" size="md">
        <UsuarioForm
          onSubmit={(d) => createMutation.mutateAsync(d)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title="Editar usuario" size="md">
        <UsuarioForm
          item={editModal.item}
          onSubmit={(d) => updateMutation.mutateAsync({ id: editModal.item!.idUsuario, data: d })}
          isLoading={updateMutation.isPending}
        />
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
