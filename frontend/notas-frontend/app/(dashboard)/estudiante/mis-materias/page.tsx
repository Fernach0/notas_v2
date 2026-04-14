'use client';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { promediosService } from '@/services/promedios.service';
import { aniosLectivosService } from '@/services/anios-lectivos.service';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const scoreColor = (val?: number) => {
  if (!val) return 'text-slate-400';
  return val >= 7 ? 'text-green-600' : 'text-red-500';
};

const barColor = (val?: number) => {
  if (!val) return 'bg-slate-200';
  return val >= 7 ? 'bg-green-500' : 'bg-red-400';
};

export default function MisMateriasPage() {
  const { user } = useAuth();

  const { data: anios } = useQuery({
    queryKey: ['anios-lectivos'],
    queryFn: () => aniosLectivosService.getAll('ACTIVO'),
  });
  const anioActivo = anios?.[0];

  const { data: promedios, isLoading } = useQuery({
    queryKey: ['promedios-materia', user?.idUsuario, anioActivo?.idAnioLectivo],
    queryFn: () => promediosService.getByMateria(user!.idUsuario, anioActivo!.idAnioLectivo),
    enabled: !!user?.idUsuario && !!anioActivo,
  });

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">Mis Materias</h1>
        <p className="text-sm text-slate-500">Promedios por materia del año lectivo actual</p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !promedios?.length ? (
        <EmptyState message="No tienes promedios registrados aún" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promedios.map((p) => {
            const parciales = [
              { label: 'Parcial 1', val: p.promedioParcial1 },
              { label: 'Parcial 2', val: p.promedioParcial2 },
              { label: 'Parcial 3', val: p.promedioParcial3 },
            ];

            return (
              <div key={p.idPromedioMateria} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-100">
                    <BookOpenIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Materia {p.idMateria}</p>
                    <p className="text-xs text-slate-400">Curso {p.idCurso}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {parciales.map(({ label, val }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{label}</span>
                        <span className={`font-semibold ${scoreColor(val)}`}>
                          {val !== undefined && val !== null ? val.toFixed(2) : '—'}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(val)}`}
                          style={{ width: `${val ? Math.min((val / 10) * 100, 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {p.promedioFinalMateria !== undefined && p.promedioFinalMateria !== null && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">Promedio final</span>
                    <span className={`text-base font-bold ${p.promedioFinalMateria >= 7 ? 'text-green-600' : 'text-red-500'}`}>
                      {p.promedioFinalMateria.toFixed(2)}
                    </span>
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
