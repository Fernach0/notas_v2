'use client';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { matriculasService } from '@/services/matriculas.service';
import { promediosService } from '@/services/promedios.service';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { BookOpenIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { PromedioMateria } from '@/types';

const scoreColor = (val?: number | null) => {
  if (val == null) return 'text-slate-400';
  return val >= 7 ? 'text-green-600' : 'text-red-500';
};

const barColor = (val?: number | null) => {
  if (val == null) return 'bg-slate-200';
  return val >= 7 ? 'bg-green-500' : 'bg-red-400';
};

export default function MisMateriasPage() {
  const { user } = useAuth();

  // Matrícula → curso + materias reales del estudiante
  const { data: miMatricula, isLoading: loadingMatricula } = useQuery({
    queryKey: ['mi-matricula'],
    queryFn: () => matriculasService.getMiMatricula(),
  });

  // Promedios calculados (pueden no existir si aún no hay calificaciones)
  const { data: promedios } = useQuery({
    queryKey: ['promedios-materia', user?.idUsuario, miMatricula?.curso.idAnioLectivo],
    queryFn: () =>
      promediosService.getByMateria(user!.idUsuario, miMatricula!.curso.idAnioLectivo),
    enabled: !!user?.idUsuario && !!miMatricula,
  });

  // Índice de promedios por idMateria para lookup O(1)
  const promedioMap = new Map<number, PromedioMateria>(
    promedios?.map((p) => [p.idMateria, p]) ?? [],
  );

  const materias = miMatricula?.curso?.materias?.map((m) => m.materia) ?? [];

  if (loadingMatricula) return <Spinner />;

  if (!miMatricula) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-sm text-amber-700">
        <p className="font-semibold mb-1">No estás matriculado en ningún curso activo</p>
        <p>Consulta con el administrador para que te asigne a un curso.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
          <AcademicCapIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mis Materias</h1>
          <p className="text-sm text-slate-500">
            {miMatricula.curso.nombreCurso} ·{' '}
            {miMatricula.curso.anioLectivo.fechaInicio.slice(0, 4)}–
            {miMatricula.curso.anioLectivo.fechaFinal.slice(0, 4)}
          </p>
        </div>
      </div>

      {materias.length === 0 ? (
        <EmptyState message="El curso no tiene materias asignadas aún" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materias.map((m) => {
            const p = promedioMap.get(m.idMateria);
            const parciales = [
              { label: 'Parcial 1', val: p?.promedioParcial1 ?? null },
              { label: 'Parcial 2', val: p?.promedioParcial2 ?? null },
              { label: 'Parcial 3', val: p?.promedioParcial3 ?? null },
            ];

            return (
              <div key={m.idMateria} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-100">
                    <BookOpenIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{m.nombreMateria}</p>
                </div>

                <div className="space-y-3">
                  {parciales.map(({ label, val }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{label}</span>
                        <span className={`font-semibold ${scoreColor(val)}`}>
                          {val != null ? val.toFixed(2) : '—'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(val)}`}
                          style={{ width: `${val != null ? Math.min((val / 10) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {p?.promedioFinalMateria != null ? (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Promedio final</span>
                    <span className={`text-base font-bold ${p.promedioFinalMateria >= 7 ? 'text-green-600' : 'text-red-500'}`}>
                      {p.promedioFinalMateria.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">Sin calificaciones registradas aún</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
