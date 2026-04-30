'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { aniosLectivosService } from '@/services/anios-lectivos.service';
import { cursosService } from '@/services/cursos.service';
import { promediosService } from '@/services/promedios.service';
import { matriculasService } from '@/services/matriculas.service';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const selectClass = 'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed';

function CeldaPromedio({ v }: { v?: number | null }) {
  if (v == null) return <span className="text-slate-300 tabular-nums">—</span>;
  return (
    <span className={`font-semibold tabular-nums ${v >= 7 ? 'text-green-600' : 'text-red-500'}`}>
      {v.toFixed(2)}
    </span>
  );
}

function labelAnio(a: { fechaInicio: string; fechaFinal: string; estadoLectivo: string }) {
  return `${a.fechaInicio.slice(0, 4)} – ${a.fechaFinal.slice(0, 4)}${a.estadoLectivo === 'ACTIVO' ? '  (Activo)' : ''}`;
}

export default function AdminCalificacionesPage() {
  const [idAnio, setIdAnio] = useState<number | undefined>();
  const [idCurso, setIdCurso] = useState<number | undefined>();

  // 1. Años lectivos
  const { data: anios, isLoading: loadingAnios } = useQuery({
    queryKey: ['anios-lectivos'],
    queryFn: () => aniosLectivosService.getAll(),
  });

  // Pre-seleccionar el año activo al cargar
  useEffect(() => {
    if (anios && !idAnio) {
      const activo = anios.find((a) => a.estadoLectivo === 'ACTIVO');
      if (activo) setIdAnio(activo.idAnioLectivo);
    }
  }, [anios, idAnio]);

  // 2. Cursos del año seleccionado
  const { data: cursos, isLoading: loadingCursos } = useQuery({
    queryKey: ['cursos', idAnio],
    queryFn: () => cursosService.getAll(idAnio),
    enabled: !!idAnio,
  });

  const cursoDatos = cursos?.find((c) => c.idCurso === idCurso);
  const materias = cursoDatos?.materias ?? [];

  // 3. Estudiantes matriculados en el curso
  const { data: matriculados, isLoading: loadingMat } = useQuery({
    queryKey: ['matriculas', idCurso],
    queryFn: () => matriculasService.getAll(idCurso!),
    enabled: !!idCurso,
  });

  // 4. Promedios por materia — una query por cada materia del curso
  const promQueries = useQueries({
    queries: materias.map((m) => ({
      queryKey: ['promedios-cm', idCurso, m.materia.idMateria],
      queryFn: () => promediosService.getByCursoMateria(idCurso!, m.materia.idMateria),
      enabled: !!idCurso,
    })),
  });

  // Map<idMateria, Map<idUsuario, promedioFinalMateria>>
  const promMap = new Map<number, Map<string, number | null>>();
  materias.forEach((m, i) => {
    const inner = new Map<string, number | null>();
    (promQueries[i]?.data ?? []).forEach((p: any) => {
      inner.set(p.idUsuario, p.promedioFinalMateria ?? null);
    });
    promMap.set(m.materia.idMateria, inner);
  });

  const loadingTabla = loadingMat || promQueries.some((q) => q.isLoading);

  const handleAnioChange = (val: string) => {
    setIdAnio(val ? Number(val) : undefined);
    setIdCurso(undefined);
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-zone, .print-zone * { visibility: visible; }
          .print-zone { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Calificaciones</h1>
          <p className="text-sm text-slate-500">Promedio final de cada estudiante por materia</p>
        </div>
        {idCurso && (
          <button
            onClick={() => window.print()}
            className="no-print flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded-lg px-3 py-2 transition"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Descargar PDF
          </button>
        )}
      </div>

      {/* Selectores encadenados */}
      <div className="no-print flex flex-wrap items-center gap-3 mb-6">
        {/* Año lectivo */}
        <select
          className={selectClass}
          value={idAnio ?? ''}
          onChange={(e) => handleAnioChange(e.target.value)}
          disabled={loadingAnios}
        >
          <option value="">— Año lectivo —</option>
          {anios?.map((a) => (
            <option key={a.idAnioLectivo} value={a.idAnioLectivo}>
              {labelAnio(a)}
            </option>
          ))}
        </select>

        {/* Flecha separadora */}
        {idAnio && <span className="text-slate-400 text-sm select-none">›</span>}

        {/* Curso — aparece solo si hay año seleccionado */}
        {idAnio && (
          <select
            className={selectClass}
            value={idCurso ?? ''}
            onChange={(e) => setIdCurso(e.target.value ? Number(e.target.value) : undefined)}
            disabled={loadingCursos}
          >
            <option value="">— Selecciona un curso —</option>
            {cursos?.map((c) => (
              <option key={c.idCurso} value={c.idCurso}>{c.nombreCurso}</option>
            ))}
          </select>
        )}
      </div>

      {/* Contenido */}
      {!idAnio ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          Selecciona un año lectivo para comenzar
        </div>
      ) : !idCurso ? (
        <div className="text-center py-20 text-slate-400 text-sm">
          Selecciona un curso para ver las calificaciones
        </div>
      ) : loadingTabla ? (
        <Spinner />
      ) : !matriculados?.length ? (
        <EmptyState message="Este curso no tiene estudiantes matriculados" />
      ) : (
        <div className="print-zone bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <div className="px-5 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-800">{cursoDatos?.nombreCurso}</p>
            <p className="text-xs text-slate-400">
              {labelAnio(anios!.find((a) => a.idAnioLectivo === idAnio)!)} ·{' '}
              {matriculados.length} estudiante{matriculados.length !== 1 ? 's' : ''} ·{' '}
              {materias.length} materia{materias.length !== 1 ? 's' : ''}
            </p>
          </div>
          <table className="w-full text-sm" style={{ minWidth: `${200 + materias.length * 140 + 120}px` }}>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 z-10 min-w-[200px]">
                  Estudiante
                </th>
                {materias.map((m) => (
                  <th key={m.materia.idMateria} className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[130px]">
                    {m.materia.nombreMateria}
                  </th>
                ))}
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[110px]">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matriculados.map((mat) => {
                const vals = materias.map((m) =>
                  promMap.get(m.materia.idMateria)?.get(mat.usuario.idUsuario),
                );
                const algunaReprobada = vals.some((v) => v != null && v < 7);
                const todasCalificadas = vals.length > 0 && vals.every((v) => v != null);
                const aprobado = todasCalificadas && !algunaReprobada;

                return (
                  <tr key={mat.usuario.idUsuario} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 sticky left-0 bg-white z-10 border-r border-slate-100">
                      <p className="font-medium text-slate-800">{mat.usuario.nombreCompleto}</p>
                      <p className="text-xs text-slate-400 font-mono">{mat.usuario.idUsuario}</p>
                    </td>
                    {materias.map((m, i) => (
                      <td key={m.materia.idMateria} className="px-4 py-3.5 text-center text-base">
                        <CeldaPromedio v={vals[i]} />
                      </td>
                    ))}
                    <td className="px-4 py-3.5 text-center">
                      {!todasCalificadas ? (
                        <span className="text-xs text-slate-400">Pendiente</span>
                      ) : aprobado ? (
                        <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                          Aprobado
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                          Reprobado
                        </span>
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
