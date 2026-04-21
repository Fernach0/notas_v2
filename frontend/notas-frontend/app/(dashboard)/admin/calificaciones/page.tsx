'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cursosService } from '@/services/cursos.service';
import { parcialesService } from '@/services/parciales.service';
import { actividadesService } from '@/services/actividades.service';
import { calificacionesService } from '@/services/calificaciones.service';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';

const TIPO_COLORS: Record<string, 'blue' | 'red' | 'green' | 'yellow'> = {
  TAREA: 'blue', EXAMEN: 'red', PROYECTO: 'green', LECCION: 'yellow',
};

export default function AdminCalificacionesPage() {
  const [idCurso, setIdCurso] = useState<number | undefined>();
  const [idMateria, setIdMateria] = useState<number | undefined>();
  const [idParcial, setIdParcial] = useState<number | undefined>();
  const [idActividad, setIdActividad] = useState<number | undefined>();

  const { data: cursos, isLoading: loadingCursos } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => cursosService.getAll(),
  });

  const materias = cursos?.find((c) => c.idCurso === idCurso)?.materias ?? [];

  const { data: parciales } = useQuery({
    queryKey: ['parciales', idCurso, idMateria],
    queryFn: () => parcialesService.getAll(idCurso!, idMateria!),
    enabled: !!idCurso && !!idMateria,
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

  const handleCursoChange = (val: string) => {
    setIdCurso(val ? Number(val) : undefined);
    setIdMateria(undefined);
    setIdParcial(undefined);
    setIdActividad(undefined);
  };

  const handleMateriaChange = (val: string) => {
    setIdMateria(val ? Number(val) : undefined);
    setIdParcial(undefined);
    setIdActividad(undefined);
  };

  const handleParcialChange = (val: string) => {
    setIdParcial(val ? Number(val) : undefined);
    setIdActividad(undefined);
  };

  const selectClass = 'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">Calificaciones</h1>
        <p className="text-sm text-slate-500">Consulta las calificaciones por curso, materia, parcial y actividad</p>
      </div>

      {/* Cascading selects */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className={selectClass}
          value={idCurso ?? ''}
          onChange={(e) => handleCursoChange(e.target.value)}
          disabled={loadingCursos}
        >
          <option value="">— Curso —</option>
          {cursos?.map((c) => (
            <option key={c.idCurso} value={c.idCurso}>{c.nombreCurso}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={idMateria ?? ''}
          onChange={(e) => handleMateriaChange(e.target.value)}
          disabled={!idCurso}
        >
          <option value="">— Materia —</option>
          {materias.map((m) => (
            <option key={m.materia.idMateria} value={m.materia.idMateria}>{m.materia.nombreMateria}</option>
          ))}
        </select>

        <select
          className={selectClass}
          value={idParcial ?? ''}
          onChange={(e) => handleParcialChange(e.target.value)}
          disabled={!idMateria}
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

      {/* Results */}
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
            <span className="text-sm font-medium text-slate-700">
              {actividades?.find((a) => a.idActividad === idActividad)?.tituloActividad}
            </span>
            <Badge
              label={actividades?.find((a) => a.idActividad === idActividad)?.tipoActividad ?? ''}
              variant={TIPO_COLORS[actividades?.find((a) => a.idActividad === idActividad)?.tipoActividad ?? ''] ?? 'gray'}
            />
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estudiante</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID Usuario</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nota</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Comentario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calificaciones.map((cal) => (
                <tr key={cal.idCalificacion} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {cal.usuario?.nombreCompleto ?? `Estudiante ${cal.idUsuario}`}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                    {cal.idUsuario}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-mono font-semibold ${
                      cal.nota === null ? 'text-slate-400' :
                      cal.nota >= 7 ? 'text-green-600' :
                      cal.nota >= 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {cal.nota !== null ? cal.nota.toFixed(2) : '—'}
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
  );
}
