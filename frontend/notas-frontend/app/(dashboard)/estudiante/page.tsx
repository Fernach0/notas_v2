'use client';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { matriculasService } from '@/services/matriculas.service';
import { promediosService } from '@/services/promedios.service';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

export default function EstudianteDashboard() {
  const { user } = useAuth();

  const { data: miMatricula, isLoading: loadingMatricula } = useQuery({
    queryKey: ['mi-matricula'],
    queryFn: () => matriculasService.getMiMatricula(),
  });

  const anioLectivo = miMatricula?.curso?.anioLectivo;

  const { data: promedios, isLoading: loadingPromedios } = useQuery({
    queryKey: ['promedios-materia', user?.idUsuario, anioLectivo?.idAnioLectivo],
    queryFn: () => promediosService.getByMateria(user!.idUsuario, anioLectivo!.idAnioLectivo),
    enabled: !!user?.idUsuario && !!anioLectivo,
  });

  const isLoading = loadingMatricula || loadingPromedios;

  return (
    <div>
      {/* Header con curso */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shrink-0">
          <AcademicCapIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mi Panel</h1>
          {miMatricula ? (
            <p className="text-sm text-slate-500">
              {miMatricula.curso.nombreCurso}
              {' · '}
              {anioLectivo?.fechaInicio.slice(0, 4)}–{anioLectivo?.fechaFinal.slice(0, 4)}
            </p>
          ) : (
            <p className="text-sm text-slate-400">Sin curso asignado</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !miMatricula ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-700">
          <p className="font-semibold">No estás matriculado en ningún curso activo.</p>
          <p className="mt-1">Consulta con el administrador para que te asigne a un curso.</p>
        </div>
      ) : !promedios?.length ? (
        <div className="text-slate-500 text-sm bg-slate-50 border border-slate-200 rounded-xl p-5">
          Aún no tienes promedios registrados. Aparecerán aquí cuando el profesor registre calificaciones.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promedios.map((p) => (
            <div key={p.idPromedioMateria} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                {(p as any).materia?.nombreMateria ?? `Materia ${p.idMateria}`}
              </p>
              <div className="space-y-2">
                {[
                  { label: 'Parcial 1', val: p.promedioParcial1 },
                  { label: 'Parcial 2', val: p.promedioParcial2 },
                  { label: 'Parcial 3', val: p.promedioParcial3 },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                      <span>{label}</span>
                      <span className="font-medium text-slate-700">
                        {val != null ? val.toFixed(2) : '—'}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          val != null && val >= 7 ? 'bg-green-500' : val != null ? 'bg-red-400' : 'bg-slate-200'
                        }`}
                        style={{ width: `${val != null ? Math.min((val / 10) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {p.promedioFinalMateria != null && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm">
                  <span className="text-slate-500">Promedio final</span>
                  <span className={`font-bold ${p.promedioFinalMateria >= 7 ? 'text-green-600' : 'text-red-600'}`}>
                    {p.promedioFinalMateria.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link
          href="/estudiante/actividades"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Ver actividades
        </Link>
        <Link
          href="/estudiante/mis-materias"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Mis materias
        </Link>
      </div>
    </div>
  );
}
