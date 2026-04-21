'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Curso } from '@/types';
import { aniosLectivosService } from '@/services/anios-lectivos.service';
import { materiasService } from '@/services/materias.service';

const schema = z.object({
  idAnioLectivo: z.coerce.number().min(1, 'Selecciona un año lectivo'),
  nombreCurso: z.string().min(2, 'Mínimo 2 caracteres').max(15, 'Máximo 15 caracteres'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  item?: Curso | null;
  onSubmit: (data: FormData & { materias?: number[] }) => Promise<void>;
  isLoading: boolean;
}

export default function CursoForm({ item, onSubmit, isLoading }: Props) {
  const isEdit = !!item;
  const [selectedMaterias, setSelectedMaterias] = useState<number[]>([]);

  const { data: anios } = useQuery({
    queryKey: ['anios-lectivos'],
    queryFn: () => aniosLectivosService.getAll(),
  });

  const { data: materias } = useQuery({
    queryKey: ['materias'],
    queryFn: () => materiasService.getAll(),
    enabled: !isEdit,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item ? { idAnioLectivo: item.idAnioLectivo, nombreCurso: item.nombreCurso } : {},
  });

  const toggleMateria = (id: number) => {
    setSelectedMaterias((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleFormSubmit = (data: FormData) => {
    return onSubmit({ ...data, materias: isEdit ? undefined : selectedMaterias });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Año lectivo</label>
        <select
          {...register('idAnioLectivo')}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seleccionar...</option>
          {anios
            ?.filter((a) => a.estadoLectivo !== 'FINALIZADO')
            .map((a) => (
              <option key={a.idAnioLectivo} value={a.idAnioLectivo}>
                {a.fechaInicio.split('T')[0]} — {a.fechaFinal.split('T')[0]} ({a.estadoLectivo})
              </option>
            ))}
        </select>
        {errors.idAnioLectivo && <p className="mt-1 text-xs text-red-500">{errors.idAnioLectivo.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del curso</label>
        <input
          {...register('nombreCurso')}
          placeholder="Ej: 8vo EGB A"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.nombreCurso && <p className="mt-1 text-xs text-red-500">{errors.nombreCurso.message}</p>}
      </div>

      {!isEdit && materias && materias.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Materias <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1">
            {materias.map((m) => (
              <label key={m.idMateria} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={selectedMaterias.includes(m.idMateria)}
                  onChange={() => toggleMateria(m.idMateria)}
                  className="h-3.5 w-3.5 rounded accent-blue-600"
                />
                <span className="text-slate-700">{m.nombreMateria}</span>
              </label>
            ))}
          </div>
          {selectedMaterias.length > 0 && (
            <p className="mt-1 text-xs text-blue-600">{selectedMaterias.length} materia(s) seleccionada(s)</p>
          )}
        </div>
      )}

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
          {item ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
