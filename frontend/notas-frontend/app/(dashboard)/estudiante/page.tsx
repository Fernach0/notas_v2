'use client';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { matriculasService } from '@/services/matriculas.service';
import { promediosService } from '@/services/promedios.service';
import { aniosLectivosService } from '@/services/anios-lectivos.service';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';

export default function EstudianteDashboard() {
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
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-1">Mi Panel</h1>
      <p className="text-sm text-slate-500 mb-6">Resumen académico del año lectivo actual.</p>

      {isLoading ? (
        <Spinner />
      ) : promedios?.length === 0 ? (
        <div className="text-slate-500 text-sm">Aún no tienes promedios registrados.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promedios?.map((p) => (
            <div key={p.idPromedioMateria} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-xs text-slate-400 font-mono mb-1">Materia {p.idMateria}</p>
              <div className="space-y-2 mt-3">
                {[
                  { label: 'Parcial 1', val: p.promedioParcial1 },
                  { label: 'Parcial 2', val: p.promedioParcial2 },
                  { label: 'Parcial 3', val: p.promedioParcial3 },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                      <span>{label}</span>
                      <span className="font-medium text-slate-700">{val ?? '—'}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${val && val >= 7 ? 'bg-green-500' : val ? 'bg-red-400' : 'bg-slate-200'}`}
                        style={{ width: `${val ? Math.min((val / 10) * 100, 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {p.promedioFinalMateria && (
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
        <Link href="/estudiante/actividades" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
          Ver actividades
        </Link>
        <Link href="/estudiante/evidencias" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
          Mis evidencias
        </Link>
      </div>
    </div>
  );
}
