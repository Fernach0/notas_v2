'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docenciasService } from '@/services/docencias.service';
import { cursosService } from '@/services/cursos.service';
import { materiasService } from '@/services/materias.service';
import { parcialesService } from '@/services/parciales.service';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/Toast';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { BookOpenIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function MisCursosProfesorPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();

  const { data: docencias, isLoading } = useQuery({
    queryKey: ['docencias', user?.idUsuario],
    queryFn: () => docenciasService.getAll(user?.idUsuario),
    enabled: !!user?.idUsuario,
  });

  const bulkParcialMutation = useMutation({
    mutationFn: ({ idCurso, idMateria }: { idCurso: number; idMateria: number }) =>
      parcialesService.createBulk({ idCurso, idMateria }),
    onSuccess: () => show('Parciales 1, 2 y 3 creados correctamente'),
    onError: () => show('Error al crear parciales (puede que ya existan)', 'error'),
  });

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">Mis Cursos y Materias</h1>
        <p className="text-sm text-slate-500">Materias que tienes asignadas como docente</p>
      </div>

      {isLoading ? <Spinner /> : docencias?.length === 0 ? <EmptyState message="No tienes materias asignadas" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {docencias?.map((d: any) => (
            <div key={`${d.idCurso}-${d.idMateria}`} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100">
                  <BookOpenIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{d.materia?.nombreMateria ?? `Materia ${d.idMateria}`}</p>
                  <p className="text-xs text-slate-500">{d.curso?.nombreCurso ?? `Curso ${d.idCurso}`}</p>
                </div>
              </div>
              <button
                onClick={() => bulkParcialMutation.mutate({ idCurso: d.idCurso, idMateria: d.idMateria })}
                disabled={bulkParcialMutation.isPending}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium border border-slate-200 rounded-lg py-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 disabled:opacity-50 transition"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Crear parciales 1, 2 y 3
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
