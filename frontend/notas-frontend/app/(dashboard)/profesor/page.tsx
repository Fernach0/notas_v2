'use client';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { cursosService } from '@/services/cursos.service';
import { BookOpenIcon, AcademicCapIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import Link from 'next/link';

const CARD_GRADIENTS = [
  'from-indigo-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

function gradientFor(idCurso: number) {
  return CARD_GRADIENTS[idCurso % CARD_GRADIENTS.length];
}

export default function ProfesorDashboard() {
  const { user } = useAuth();

  const { data: cursos, isLoading } = useQuery({
    queryKey: ['mis-cursos', user?.idUsuario],
    queryFn: () => cursosService.getMisCursos(),
    enabled: !!user?.idUsuario,
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow">
          <AcademicCapIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel del Profesor</h1>
          <p className="text-sm text-slate-500">Tus cursos y materias asignados</p>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !cursos?.length ? (
        <EmptyState message="No tienes cursos asignados aún." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cursos.map((c) => (
            <div
              key={c.idCurso}
              className={`rounded-2xl bg-gradient-to-br ${gradientFor(c.idCurso)} p-5 text-white shadow-lg`}
            >
              {/* Curso header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Curso</p>
                  <h2 className="text-lg font-bold leading-tight">{c.nombreCurso}</h2>
                  <p className="text-xs opacity-70 mt-0.5">
                    {c.anioLectivo.fechaInicio.split('T')[0].slice(0, 4)} — {c.anioLectivo.fechaFinal.split('T')[0].slice(0, 4)}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                  <BookOpenIcon className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* Materias */}
              <div className="mb-4 space-y-1.5">
                {c.materias.map((m) => (
                  <div key={m.idMateria} className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2">
                    <ClipboardDocumentListIcon className="h-3.5 w-3.5 opacity-80 shrink-0" />
                    <span className="text-sm font-medium truncate">{m.nombreMateria}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                {c.materias.map((m) => (
                  <Link
                    key={`act-${m.idMateria}`}
                    href={`/profesor/actividades?idCurso=${c.idCurso}&idMateria=${m.idMateria}`}
                    className="text-center text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 py-1.5 transition"
                  >
                    Actividades
                  </Link>
                ))}
                {c.materias.map((m) => (
                  <Link
                    key={`cal-${m.idMateria}`}
                    href={`/profesor/calificaciones?idCurso=${c.idCurso}&idMateria=${m.idMateria}`}
                    className="text-center text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 py-1.5 transition"
                  >
                    Calificaciones
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
