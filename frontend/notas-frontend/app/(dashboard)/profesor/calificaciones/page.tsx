'use client';

import { useState } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { cursosService } from '@/services/cursos.service';
import { parcialesService } from '@/services/parciales.service';
import { actividadesService } from '@/services/actividades.service';
import { calificacionesService } from '@/services/calificaciones.service';
import { promediosService } from '@/services/promedios.service';
import { matriculasService, EstudianteMatriculado } from '@/services/matriculas.service';
import { MiCurso } from '@/types';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { ChartBarIcon, BookOpenIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

// ── Helpers ───────────────────────────────────────────────────────────────────
const CARD_GRADIENTS = [
  'from-indigo-500 to-blue-600', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600', 'from-cyan-500 to-sky-600',
];
const gradientFor = (id: number) => CARD_GRADIENTS[id % CARD_GRADIENTS.length];

function CeldaNota({ v }: { v?: number | null }) {
  if (v == null) return <span className="text-slate-300 text-xs tabular-nums">—</span>;
  return (
    <span className={`font-bold tabular-nums ${v >= 7 ? 'text-green-600' : 'text-red-500'}`}>
      {v.toFixed(2)}
    </span>
  );
}

type Tab = 'resumen' | 'parciales' | 'actividades';

// ── Página ────────────────────────────────────────────────────────────────────
export default function CalificacionesProfesorPage() {
  const [cursoSel, setCursoSel] = useState<MiCurso | null>(null);
  const [idMateria, setIdMateria] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('resumen');
  const [parcialActivo, setParcialActivo] = useState(1);

  const { data: cursos, isLoading: loadingCursos } = useQuery({
    queryKey: ['mis-cursos'],
    queryFn: () => cursosService.getMisCursos(),
  });

  const idCurso = cursoSel?.idCurso ?? null;
  const materias = cursoSel?.materias ?? [];
  const materiaActiva = idMateria ?? materias[0]?.idMateria ?? null;

  // Estudiantes matriculados
  const { data: matriculados } = useQuery({
    queryKey: ['matriculas', idCurso],
    queryFn: () => matriculasService.getAll(idCurso!),
    enabled: !!idCurso,
  });
  const estudiantes = matriculados?.map((m: EstudianteMatriculado) => m.usuario) ?? [];

  // Promedios de todos los estudiantes para curso+materia
  const { data: promedios, isLoading: loadingPromedios } = useQuery({
    queryKey: ['promedios-cm', idCurso, materiaActiva],
    queryFn: () => promediosService.getByCursoMateria(idCurso!, materiaActiva!),
    enabled: !!idCurso && !!materiaActiva,
  });
  const promedioMap = new Map(promedios?.map((p) => [p.idUsuario, p]) ?? []);

  // Parciales para la vista "Por Actividad"
  const { data: parciales } = useQuery({
    queryKey: ['parciales', idCurso, materiaActiva],
    queryFn: () => parcialesService.getAll(idCurso!, materiaActiva!),
    enabled: !!idCurso && !!materiaActiva && tab === 'actividades',
  });
  const parcialId = parciales?.find((p) => p.numeroParcial === parcialActivo)?.idParcial;

  const { data: actividades, isLoading: loadingActs } = useQuery({
    queryKey: ['actividades', parcialId],
    queryFn: () => actividadesService.getAll(parcialId!),
    enabled: !!parcialId,
  });

  // Calificaciones de todas las actividades en paralelo
  const califQueries = useQueries({
    queries: (actividades ?? []).map((a) => ({
      queryKey: ['calificaciones', a.idActividad],
      queryFn: () => calificacionesService.getByActividad(a.idActividad),
      enabled: !!a.idActividad,
    })),
  });
  const califMap = new Map<number, Map<string, any>>();
  actividades?.forEach((a, i) => {
    const m = new Map<string, any>();
    califQueries[i]?.data?.forEach((c: any) => m.set(c.idUsuario, c));
    califMap.set(a.idActividad, m);
  });

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow shrink-0">
          <ChartBarIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calificaciones</h1>
          <p className="text-sm text-slate-500">
            {cursoSel
              ? `${cursoSel.nombreCurso} · ${cursoSel.anioLectivo.fechaInicio.slice(0, 4)}–${cursoSel.anioLectivo.fechaFinal.slice(0, 4)}`
              : 'Selecciona un curso para ver las notas'}
          </p>
        </div>
        {cursoSel && (
          <button
            onClick={() => { setCursoSel(null); setIdMateria(null); setTab('resumen'); }}
            className="ml-auto flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Cambiar curso
          </button>
        )}
      </div>

      {/* ── ETAPA 1: Selección de curso ──────────────────────────────────── */}
      {!cursoSel && (
        loadingCursos ? <Spinner /> : !cursos?.length ? <EmptyState message="No tienes cursos asignados" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cursos.map((c) => (
              <button
                key={c.idCurso}
                onClick={() => { setCursoSel(c); setIdMateria(c.materias[0]?.idMateria ?? null); }}
                className={`rounded-2xl bg-gradient-to-br ${gradientFor(c.idCurso)} p-5 text-white shadow-lg text-left hover:scale-[1.02] transition-transform`}
              >
                <p className="text-xs font-medium opacity-80 uppercase tracking-wide mb-1">Curso</p>
                <h2 className="text-lg font-bold">{c.nombreCurso}</h2>
                <p className="text-xs opacity-70">{c.anioLectivo.fechaInicio.slice(0, 4)} — {c.anioLectivo.fechaFinal.slice(0, 4)}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold bg-white/20 rounded-lg px-3 py-1.5 w-fit">
                  <ChartBarIcon className="h-3.5 w-3.5" /> Ver calificaciones
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {/* ── ETAPA 2: Vistas de calificaciones ───────────────────────────── */}
      {cursoSel && (
        <>
          {/* Tabs de materia */}
          {materias.length > 1 && (
            <div className="flex gap-1.5 mb-5 flex-wrap">
              {materias.map((m) => (
                <button key={m.idMateria} onClick={() => setIdMateria(m.idMateria)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    materiaActiva === m.idMateria ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                  <BookOpenIcon className="h-3.5 w-3.5" />
                  {m.nombreMateria}
                </button>
              ))}
            </div>
          )}
          {materias.length === 1 && (
            <div className="flex items-center gap-1.5 mb-5 text-sm text-slate-600">
              <BookOpenIcon className="h-4 w-4 text-slate-400" />
              <span className="font-medium">{materias[0].nombreMateria}</span>
            </div>
          )}

          {/* Tabs de vista */}
          <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
            {([
              { key: 'resumen', label: 'Promedio Final' },
              { key: 'parciales', label: 'Por Parciales' },
              { key: 'actividades', label: 'Por Actividad' },
            ] as { key: Tab; label: string }[]).map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* ── TAB: Promedio Final ─────────────────────────────────────── */}
          {tab === 'resumen' && (
            loadingPromedios ? <Spinner /> : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Estudiante</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Promedio Final</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!estudiantes.length ? (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm">Sin estudiantes matriculados</td></tr>
                    ) : estudiantes.map((est, idx) => {
                      const p = promedioMap.get(est.idUsuario);
                      const final = p?.promedioFinalMateria;
                      return (
                        <tr key={est.idUsuario} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-800">{est.nombreCompleto}</p>
                            <p className="text-xs text-slate-400 font-mono">{est.idUsuario}</p>
                          </td>
                          <td className="px-5 py-3.5 text-center text-lg"><CeldaNota v={final} /></td>
                          <td className="px-5 py-3.5 text-center">
                            {final == null ? (
                              <span className="text-xs text-slate-400">Sin datos</span>
                            ) : final >= 7 ? (
                              <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">Aprobado</span>
                            ) : (
                              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">Reprobado</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ── TAB: Por Parciales ──────────────────────────────────────── */}
          {tab === 'parciales' && (
            loadingPromedios ? <Spinner /> : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase min-w-[180px]">Estudiante</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Parcial 1</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Parcial 2</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Parcial 3</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-indigo-600 uppercase bg-indigo-50">Promedio Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!estudiantes.length ? (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">Sin estudiantes matriculados</td></tr>
                    ) : estudiantes.map((est, idx) => {
                      const p = promedioMap.get(est.idUsuario);
                      return (
                        <tr key={est.idUsuario} className="hover:bg-slate-50">
                          <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-5 py-3.5 min-w-[180px]">
                            <p className="font-medium text-slate-800">{est.nombreCompleto}</p>
                            <p className="text-xs text-slate-400 font-mono">{est.idUsuario}</p>
                          </td>
                          <td className="px-5 py-3.5 text-center"><CeldaNota v={p?.promedioParcial1} /></td>
                          <td className="px-5 py-3.5 text-center"><CeldaNota v={p?.promedioParcial2} /></td>
                          <td className="px-5 py-3.5 text-center"><CeldaNota v={p?.promedioParcial3} /></td>
                          <td className="px-5 py-3.5 text-center bg-indigo-50 text-base"><CeldaNota v={p?.promedioFinalMateria} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ── TAB: Por Actividad (solo lectura) ───────────────────────── */}
          {tab === 'actividades' && (
            <>
              <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
                {[1, 2, 3].map((n) => (
                  <button key={n} onClick={() => setParcialActivo(n)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${parcialActivo === n ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    Parcial {n}
                  </button>
                ))}
              </div>

              {!parcialId ? (
                <div className="text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-xl p-5">
                  No existe el Parcial {parcialActivo} para esta materia.
                </div>
              ) : loadingActs ? (
                <Spinner />
              ) : !actividades?.length ? (
                <EmptyState message="No hay actividades en este parcial" />
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                  <table className="text-sm" style={{ minWidth: `${220 + actividades.length * 120}px` }}>
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 min-w-[190px]">
                          Estudiante
                        </th>
                        {actividades.map((a) => (
                          <th key={a.idActividad} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase min-w-[110px]">
                            <p className="truncate max-w-[100px]">{a.tituloActividad ?? a.tipoActividad}</p>
                            <p className="text-slate-400 font-normal normal-case">{a.tipoActividad}</p>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!estudiantes.length ? (
                        <tr><td colSpan={actividades.length + 1} className="px-5 py-8 text-center text-slate-400">Sin estudiantes</td></tr>
                      ) : estudiantes.map((est) => (
                        <tr key={est.idUsuario} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-100">
                            <p className="font-medium text-slate-800 truncate max-w-[170px]">{est.nombreCompleto}</p>
                            <p className="text-xs text-slate-400 font-mono">{est.idUsuario}</p>
                          </td>
                          {actividades.map((a) => {
                            const c = califMap.get(a.idActividad)?.get(est.idUsuario);
                            return (
                              <td key={a.idActividad} className="px-3 py-3 text-center">
                                {c ? (
                                  <span className={`font-bold tabular-nums ${c.nota >= 7 ? 'text-green-600' : 'text-red-500'}`}>
                                    {Number(c.nota).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
