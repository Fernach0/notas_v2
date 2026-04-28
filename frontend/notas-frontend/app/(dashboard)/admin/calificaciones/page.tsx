'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cursosService } from '@/services/cursos.service';
import { parcialesService } from '@/services/parciales.service';
import { actividadesService } from '@/services/actividades.service';
import { calificacionesService } from '@/services/calificaciones.service';
import { promediosService } from '@/services/promedios.service';
import { matriculasService } from '@/services/matriculas.service';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';

const TIPO_COLORS: Record<string, 'blue' | 'red' | 'green' | 'yellow'> = {
  TAREA: 'blue', EXAMEN: 'red', PROYECTO: 'green', LECCION: 'yellow',
};

const selectClass = 'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed';

function CeldaPromedio({ v }: { v?: number | null }) {
  if (v == null) return <span className="text-slate-300 tabular-nums">—</span>;
  return (
    <span className={`font-semibold tabular-nums ${v >= 7 ? 'text-green-600' : 'text-red-500'}`}>
      {v.toFixed(2)}
    </span>
  );
}

type Mode = 'actividad' | 'estudiante';

export default function AdminCalificacionesPage() {
  const [mode, setMode] = useState<Mode>('estudiante');

  // ── Estado modo "Por Actividad" ──────────────────────────────────────────
  const [idCursoAct, setIdCursoAct] = useState<number | undefined>();
  const [idMateriaAct, setIdMateriaAct] = useState<number | undefined>();
  const [idParcial, setIdParcial] = useState<number | undefined>();
  const [idActividad, setIdActividad] = useState<number | undefined>();

  // ── Estado modo "Por Estudiante" ─────────────────────────────────────────
  const [idCursoEst, setIdCursoEst] = useState<number | undefined>();
  const [idUsuarioSel, setIdUsuarioSel] = useState<string | undefined>();

  // ── Queries comunes ──────────────────────────────────────────────────────
  const { data: cursos, isLoading: loadingCursos } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => cursosService.getAll(),
  });

  // ── Queries modo Por Actividad ───────────────────────────────────────────
  const materiasAct = cursos?.find((c) => c.idCurso === idCursoAct)?.materias ?? [];

  const { data: parciales } = useQuery({
    queryKey: ['parciales', idCursoAct, idMateriaAct],
    queryFn: () => parcialesService.getAll(idCursoAct!, idMateriaAct!),
    enabled: !!idCursoAct && !!idMateriaAct,
  });

  const { data: actividades } = useQuery({
    queryKey: ['actividades', idParcial],
    queryFn: () => actividadesService.getAll(idParcial!),
    enabled: !!idParcial,
  });

  const { data: calificaciones, isLoading: loadingCalifs } = useQuery({
    queryKey: ['calificaciones', idActividad],
    queryFn: () => calificacionesService.getByActividad(idActividad!),
    enabled: !!idActividad,
  });

  // ── Queries modo Por Estudiante ──────────────────────────────────────────
  const cursoDatosEst = cursos?.find((c) => c.idCurso === idCursoEst);
  const idAnioLectivo = (cursoDatosEst as any)?.anioLectivo?.idAnioLectivo as number | undefined;

  const { data: matriculados, isLoading: loadingEst } = useQuery({
    queryKey: ['matriculas', idCursoEst],
    queryFn: () => matriculasService.getAll(idCursoEst!),
    enabled: !!idCursoEst,
  });

  const { data: promedios, isLoading: loadingPromedios } = useQuery({
    queryKey: ['promedios-materia', idUsuarioSel, idAnioLectivo],
    queryFn: () => promediosService.getByMateria(idUsuarioSel!, idAnioLectivo!),
    enabled: !!idUsuarioSel && !!idAnioLectivo,
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCursoActChange = (val: string) => {
    setIdCursoAct(val ? Number(val) : undefined);
    setIdMateriaAct(undefined); setIdParcial(undefined); setIdActividad(undefined);
  };
  const handleMateriaActChange = (val: string) => {
    setIdMateriaAct(val ? Number(val) : undefined);
    setIdParcial(undefined); setIdActividad(undefined);
  };
  const handleParcialChange = (val: string) => {
    setIdParcial(val ? Number(val) : undefined);
    setIdActividad(undefined);
  };
  const handleCursoEstChange = (val: string) => {
    setIdCursoEst(val ? Number(val) : undefined);
    setIdUsuarioSel(undefined);
  };

  const actividadActiva = actividades?.find((a) => a.idActividad === idActividad);
  const estudianteSeleccionado = matriculados?.find((m) => m.usuario.idUsuario === idUsuarioSel);

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">Calificaciones</h1>
        <p className="text-sm text-slate-500">Consulta las calificaciones de estudiantes y actividades</p>
      </div>

      {/* Tabs de modo */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {([
          { key: 'estudiante', label: 'Por Estudiante' },
          { key: 'actividad',  label: 'Por Actividad'  },
        ] as { key: Mode; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${mode === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODO: POR ESTUDIANTE
         ══════════════════════════════════════════════════════════════════════ */}
      {mode === 'estudiante' && (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              className={selectClass}
              value={idCursoEst ?? ''}
              onChange={(e) => handleCursoEstChange(e.target.value)}
              disabled={loadingCursos}
            >
              <option value="">— Curso —</option>
              {cursos?.map((c) => (
                <option key={c.idCurso} value={c.idCurso}>{c.nombreCurso}</option>
              ))}
            </select>

            <select
              className={selectClass}
              value={idUsuarioSel ?? ''}
              onChange={(e) => setIdUsuarioSel(e.target.value || undefined)}
              disabled={!idCursoEst || loadingEst}
            >
              <option value="">— Estudiante —</option>
              {matriculados?.map((m) => (
                <option key={m.usuario.idUsuario} value={m.usuario.idUsuario}>
                  {m.usuario.nombreCompleto}
                </option>
              ))}
            </select>
          </div>

          {!idUsuarioSel ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Selecciona un curso y luego un estudiante para ver sus calificaciones
            </div>
          ) : loadingPromedios ? (
            <Spinner />
          ) : !promedios?.length ? (
            <EmptyState message="Este estudiante aún no tiene calificaciones registradas" />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <p className="font-semibold text-slate-800">{estudianteSeleccionado?.usuario.nombreCompleto}</p>
                <p className="text-xs text-slate-400 font-mono">{idUsuarioSel} · {cursoDatosEst?.nombreCurso}</p>
              </div>
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
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {p.materia?.nombreMateria ?? `Materia ${p.idMateria}`}
                        </td>
                        <td className="px-5 py-4 text-center text-base"><CeldaPromedio v={p.promedioParcial1} /></td>
                        <td className="px-5 py-4 text-center text-base"><CeldaPromedio v={p.promedioParcial2} /></td>
                        <td className="px-5 py-4 text-center text-base"><CeldaPromedio v={p.promedioParcial3} /></td>
                        <td className="px-5 py-4 text-center text-lg bg-indigo-50"><CeldaPromedio v={final} /></td>
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
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODO: POR ACTIVIDAD
         ══════════════════════════════════════════════════════════════════════ */}
      {mode === 'actividad' && (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <select
              className={selectClass}
              value={idCursoAct ?? ''}
              onChange={(e) => handleCursoActChange(e.target.value)}
              disabled={loadingCursos}
            >
              <option value="">— Curso —</option>
              {cursos?.map((c) => (
                <option key={c.idCurso} value={c.idCurso}>{c.nombreCurso}</option>
              ))}
            </select>

            <select
              className={selectClass}
              value={idMateriaAct ?? ''}
              onChange={(e) => handleMateriaActChange(e.target.value)}
              disabled={!idCursoAct}
            >
              <option value="">— Materia —</option>
              {materiasAct.map((m) => (
                <option key={m.materia.idMateria} value={m.materia.idMateria}>{m.materia.nombreMateria}</option>
              ))}
            </select>

            <select
              className={selectClass}
              value={idParcial ?? ''}
              onChange={(e) => handleParcialChange(e.target.value)}
              disabled={!idMateriaAct}
            >
              <option value="">— Parcial —</option>
              {parciales?.map((p) => (
                <option key={p.idParcial} value={p.idParcial}>Parcial {p.numeroParcial}</option>
              ))}
            </select>

            <select
              className={selectClass}
              value={idActividad ?? ''}
              onChange={(e) => setIdActividad(e.target.value ? Number(e.target.value) : undefined)}
              disabled={!idParcial}
            >
              <option value="">— Actividad —</option>
              {actividades?.map((a) => (
                <option key={a.idActividad} value={a.idActividad}>
                  {a.tituloActividad} ({a.tipoActividad})
                </option>
              ))}
            </select>
          </div>

          {!idActividad ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Selecciona curso, materia, parcial y actividad para ver las calificaciones
            </div>
          ) : loadingCalifs ? (
            <Spinner />
          ) : !calificaciones?.length ? (
            <EmptyState message="No hay calificaciones registradas para esta actividad" />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{actividadActiva?.tituloActividad}</span>
                <Badge
                  label={actividadActiva?.tipoActividad ?? ''}
                  variant={TIPO_COLORS[actividadActiva?.tipoActividad ?? ''] ?? 'gray'}
                />
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estudiante</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nota</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Comentario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calificaciones.map((cal) => (
                    <tr key={cal.idCalificacion} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {cal.usuario?.nombreCompleto ?? `Estudiante ${cal.idUsuario}`}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{cal.idUsuario}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`font-semibold tabular-nums ${cal.nota >= 7 ? 'text-green-600' : cal.nota >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {cal.nota.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{cal.comentario ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
                {calificaciones.length} registro{calificaciones.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
