'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  nota: z.coerce.number().min(0, 'Mínimo 0').max(100, 'Máximo 100'),
  comentario: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  idUsuario: string;
  idActividad: number;
  valorMaximo: number;
  notaActual?: number;
  comentarioActual?: string;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
}

export default function CalificacionForm({ idUsuario, valorMaximo, notaActual, comentarioActual, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema.refine((d) => d.nota <= valorMaximo, { message: `Máximo ${valorMaximo}`, path: ['nota'] })),
    defaultValues: { nota: notaActual, comentario: comentarioActual ?? '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-xs text-slate-500">Estudiante: <span className="font-mono font-medium text-slate-700">{idUsuario}</span></p>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nota <span className="text-slate-400">(máx. {valorMaximo})</span>
        </label>
        <input type="number" step="0.01" {...register('nota')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {errors.nota && <p className="mt-1 text-xs text-red-500">{errors.nota.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Comentario (opcional)</label>
        <textarea {...register('comentario')} rows={2} maxLength={200} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isLoading} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
          {isLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          Guardar nota
        </button>
      </div>
    </form>
  );
}
