'use client';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { docenciasService } from '@/services/docencias.service';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import Link from 'next/link';

export default function ProfesorDashboard() {
  const { user } = useAuth();

  const { data: docencias, isLoading } = useQuery({
    queryKey: ['docencias', user?.idUsuario],
    queryFn: () => docenciasService.getAll(user?.idUsuario),
    enabled: !!user?.idUsuario,
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-1">Panel del Profesor</h1>
      <p className="text-sm text-slate-500 mb-6">Tus materias y cursos asignados.</p>

      {isLoading ? (
        <Spinner />
      ) : docencias?.length === 0 ? (
        <EmptyState message="No tienes materias asignadas aún." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docencias?.map((d: any) => (
            <div key={`${d.idCurso}-${d.idMateria}`} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100">
                  <BookOpenIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{d.materia?.nombreMateria ?? `Materia ${d.idMateria}`}</p>
                  <p className="text-xs text-slate-500">{d.curso?.nombreCurso ?? `Curso ${d.idCurso}`}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/profesor/actividades?idCurso=${d.idCurso}&idMateria=${d.idMateria}`} className="flex-1 text-center text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg py-1.5 transition">
                  Actividades
                </Link>
                <Link href={`/profesor/calificaciones?idCurso=${d.idCurso}&idMateria=${d.idMateria}`} className="flex-1 text-center text-xs font-medium bg-slate-100 hover:bg-green-50 hover:text-green-700 text-slate-600 rounded-lg py-1.5 transition">
                  Calificaciones
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
