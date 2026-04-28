'use client';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { promediosService } from '@/services/promedios.service';
import { matriculasService } from '@/services/matriculas.service';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { ChartBarIcon } from '@heroicons/react/24/outline';

function Celda({ v }: { v?: number | null }) {
  if (v == null) return <span className="text-slate-300 tabular-nums">—</span>;
  return (
    <span className={`font-semibold tabular-nums ${v >= 7 ? 'text-green-600' : 'text-red-500'}`}>
      {v.toFixed(2)}
    </span>
  );
}

export default function CalificacionesEstudiantePage() {
  const { user } = useAuth();

  const { data: miMatricula, isLoading: loadingMatricula } = useQuery({
    queryKey: ['mi-matricula'],
    queryFn: () => matriculasService.getMiMatricula(),
    enabled: !!user?.idUsuario,
  });

  const idAnioLectivo = miMatricula?.curso?.anioLectivo?.idAnioLectivo;

  const { data: promedios, isLoading: loadingPromedios } = useQuery({
    queryKey: ['promedios-materia', user?.idUsuario, idAnioLectivo],
    queryFn: () => promediosService.getByMateria(user!.idUsuario, idAnioLectivo!),
    enabled: !!user?.idUsuario && !!idAnioLectivo,
  });

  const isLoading = loadingMatricula || loadingPromedios;

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 shadow shrink-0">
          <ChartBarIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mis Calificaciones</h1>
          <p className="text-sm text-slate-500">
            {miMatricula
              ? `${miMatricula.curso.nombreCurso} · ${miMatricula.curso.anioLectivo.fechaInicio.slice(0, 4)}–${miMatricula.curso.anioLectivo.fechaFinal.slice(0, 4)}`
              : 'Año lectivo actual'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !miMatricula ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-sm text-amber-700">
          <p className="font-semibold mb-1">No estás matriculado en ningún curso activo</p>
          <p>Consulta con el administrador para que te asigne a un curso.</p>
        </div>
      ) : !promedios?.length ? (
        <EmptyState message="Aún no hay calificaciones registradas para este año lectivo" />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Materia</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Parcial 1</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Parcial 2</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Parcial 3</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-indigo-600 uppercase tracking-wide bg-indigo-50">Promedio Final</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promedios.map((p) => {
                const final = p.promedioFinalMateria;
                return (
                  <tr key={p.idMateria} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {p.materia?.nombreMateria ?? `Materia ${p.idMateria}`}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-center text-base"><Celda v={p.promedioParcial1} /></td>
                    <td className="px-5 py-4 text-center text-base"><Celda v={p.promedioParcial2} /></td>
                    <td className="px-5 py-4 text-center text-base"><Celda v={p.promedioParcial3} /></td>
                    <td className="px-5 py-4 text-center text-lg bg-indigo-50"><Celda v={final} /></td>
                    <td className="px-5 py-4 text-center">
                      {final == null ? (
                        <span className="text-xs text-slate-400">Sin datos</span>
                      ) : final >= 7 ? (
                        <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">Aprobado</span>
                      ) : (
                        <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">Reprobado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
