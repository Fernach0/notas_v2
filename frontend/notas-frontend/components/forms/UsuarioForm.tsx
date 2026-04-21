'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Usuario } from '@/types';

function validarCedula(cedula: string): boolean {
  if (cedula.length !== 10 || isNaN(Number(cedula))) return false;
  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let val = parseInt(cedula[i]) * coeficientes[i];
    if (val >= 10) val -= 9;
    suma += val;
  }
  const verificador = suma % 10 === 0 ? 0 : 10 - (suma % 10);
  return verificador === parseInt(cedula[9]);
}

const schema = z.object({
  idUsuario: z.string().refine(validarCedula, { message: 'Cédula ecuatoriana inválida' }),
  nombreCompleto: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  contrasenaUsuario: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  estadoUsuario: z.enum(['ACTIVO', 'INACTIVO', 'BLOQUEADO']),
  idRol: z.coerce.number({ required_error: 'Selecciona un rol' }).int().min(1, 'Selecciona un rol'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: Usuario | null;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
}

const rolesOpciones = [
  { id: 1, label: 'Administrador', color: 'text-violet-700 border-violet-300 bg-violet-50' },
  { id: 2, label: 'Profesor',      color: 'text-blue-700 border-blue-300 bg-blue-50' },
  { id: 3, label: 'Estudiante',    color: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
];

export default function UsuarioForm({ item, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          idUsuario: item.idUsuario,
          nombreCompleto: item.nombreCompleto,
          email: item.email ?? '',
          estadoUsuario: item.estadoUsuario,
          idRol: item.roles[0]?.idRol ?? undefined,
          contrasenaUsuario: '',
        }
      : { estadoUsuario: 'ACTIVO' },
  });

  const rolSeleccionado = watch('idRol');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cédula</label>
          <input
            {...register('idUsuario')}
            placeholder="0102030400"
            disabled={!!item}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
          />
          {errors.idUsuario && <p className="mt-1 text-xs text-red-500">{errors.idUsuario.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
          <select
            {...register('estadoUsuario')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
            <option value="BLOQUEADO">Bloqueado</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
        <input
          {...register('nombreCompleto')}
          placeholder="Ej: María López Pérez"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.nombreCompleto && <p className="mt-1 text-xs text-red-500">{errors.nombreCompleto.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          {...register('email')}
          type="email"
          placeholder="usuario@notas.edu.ec"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {item ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
        </label>
        <input
          {...register('contrasenaUsuario')}
          type="password"
          placeholder="••••••••"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.contrasenaUsuario && <p className="mt-1 text-xs text-red-500">{errors.contrasenaUsuario.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Rol</label>
        <div className="grid grid-cols-3 gap-2">
          {rolesOpciones.map((rol) => (
            <label
              key={rol.id}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 cursor-pointer transition-all text-sm font-medium ${
                Number(rolSeleccionado) === rol.id
                  ? `${rol.color} border-current`
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                value={rol.id}
                {...register('idRol')}
                className="sr-only"
              />
              {rol.label}
            </label>
          ))}
        </div>
        {errors.idRol && <p className="mt-1 text-xs text-red-500">{errors.idRol.message}</p>}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
        >
          {isLoading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {item ? 'Actualizar' : 'Crear usuario'}
        </button>
      </div>
    </form>
  );
}
