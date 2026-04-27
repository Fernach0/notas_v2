'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Actividad, TipoActividad } from '@/types';

const schema = z.object({
  tipoActividad: z.enum(['TAREA', 'EXAMEN', 'PROYECTO', 'PRUEBA']),
  tituloActividad: z.string().max(20).optional(),
  descripcion: z.string().max(200).optional(),
  fechaInicioEntrega: z.string().min(1, 'Requerido'),
  fechaFinEntrega: z.string().min(1, 'Requerido'),
}).refine((d) => d.fechaFinEntrega >= d.fechaInicioEntrega, {
  message: 'La fecha de fin debe ser igual o posterior al inicio',
  path: ['fechaFinEntrega'],
});

type FormData = z.infer<typeof schema>;

interface Props {
  idParcial: number;
  item?: Actividad | null;
  onSubmit: (data: FormData & { idParcial: number }) => Promise<void>;
  isLoading: boolean;
}

export default function ActividadForm({ idParcial, item, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          tipoActividad: item.tipoActividad,
          tituloActividad: item.tituloActividad ?? '',
          descripcion: item.descripcion ?? '',
          fechaInicioEntrega: item.fechaInicioEntrega.split('T')[0],
          fechaFinEntrega: item.fechaFinEntrega.split('T')[0],
        }
      : { tipoActividad: 'TAREA' },
  });

  return (
    <form onSubmit={handleSubmit((d) => onSubmit({ ...d, idParcial }))} className="space-y-4">
      {/* Tipo — ocupa el ancho completo ahora que no hay valorMaximo */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de actividad</label>
        <select
          {...register('tipoActividad')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="TAREA">Tarea</option>
          <option value="PRUEBA">Prueba</option>
          <option value="PROYECTO">Proyecto</option>
          <option value="EXAMEN">Examen</option>
        </select>
        <p className="mt-1 text-xs text-slate-400">EXAMEN, PRUEBA y PROYECTO: máximo 1 por parcial.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
        <input
          {...register('tituloActividad')}
          placeholder="Ej: Tarea 1"
          maxLength={20}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
        <textarea
          {...register('descripcion')}
          rows={3}
          maxLength={200}
          placeholder="Instrucciones para los estudiantes..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Inicio entrega</label>
          <input
            type="date"
            {...register('fechaInicioEntrega')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.fechaInicioEntrega && <p className="mt-1 text-xs text-red-500">{errors.fechaInicioEntrega.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fin entrega</label>
          <input
            type="date"
            {...register('fechaFinEntrega')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.fechaFinEntrega && <p className="mt-1 text-xs text-red-500">{errors.fechaFinEntrega.message}</p>}
        </div>
      </div>

      {/* Nota informativa — escala */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500">
        Las notas se registran sobre <span className="font-semibold text-slate-700">10 puntos</span>.
        El promedio del parcial se calcula con ponderación automática por tipo de actividad.
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
        >
          {isLoading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          )}
          {item ? 'Actualizar' : 'Crear actividad'}
        </button>
      </div>
    </form>
  );
}
