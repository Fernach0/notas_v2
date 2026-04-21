'use client';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { docenciasService } from '@/services/docencias.service';
import { BookOpenIcon, ClipboardDocumentListIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import Link from 'next/link';

export default function MisCursosProfesorPage() {
  const { user } = useAuth();

  const { data: docencias, isLoading } = useQuery({
    queryKey: ['docencias', user?.idUsuario],
    queryFn: () => docenciasService.getAll(user?.idUsuario),
    enabled: !!user?.idUsuario,
  });

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">Mis Cursos y Materias</h1>
        <p className="text-sm text-slate-500">Materias que tienes asignadas como docente</p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : docencias?.length === 0 ? (
        <EmptyState message="No tienes materias asignadas" />
      ) : (
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
              <div className="flex gap-2">
                <Link
                  href={`/profesor/actividades?idCurso=${d.idCurso}&idMateria=${d.idMateria}`}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-slate-200 rounded-lg py-2 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition"
                >
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                  Actividades
                </Link>
                <Link
                  href={`/profesor/calificaciones?idCurso=${d.idCurso}&idMateria=${d.idMateria}`}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-slate-200 rounded-lg py-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition"
                >
                  <ChartBarIcon className="h-4 w-4" />
                  Calificaciones
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
