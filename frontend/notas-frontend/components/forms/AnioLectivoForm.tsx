'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnioLectivo, EstadoLectivo } from '@/types';

const schema = z.object({
  fechaInicio: z.string().min(1, 'Requerido'),
  fechaFinal: z.string().min(1, 'Requerido'),
  estadoLectivo: z.enum(['ACTIVO', 'FINALIZADO', 'PLANIFICADO']),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: AnioLectivo | null;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
}

export default function AnioLectivoForm({ item, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? { fechaInicio: item.fechaInicio.split('T')[0], fechaFinal: item.fechaFinal.split('T')[0], estadoLectivo: item.estadoLectivo }
      : { estadoLectivo: 'PLANIFICADO' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha inicio</label>
          <input type="date" {...register('fechaInicio')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.fechaInicio && <p className="mt-1 text-xs text-red-500">{errors.fechaInicio.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha final</label>
          <input type="date" {...register('fechaFinal')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.fechaFinal && <p className="mt-1 text-xs text-red-500">{errors.fechaFinal.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
        <select {...register('estadoLectivo')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="PLANIFICADO">Planificado</option>
          <option value="ACTIVO">Activo</option>
          <option value="FINALIZADO">Finalizado</option>
        </select>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isLoading} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
          {isLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          {item ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
