'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cursosService } from '@/services/cursos.service';
import { matriculasService, EstudianteMatriculado } from '@/services/matriculas.service';
import { MiCurso } from '@/types';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { UsersIcon, AcademicCapIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const CARD_GRADIENTS = [
  'from-indigo-500 to-blue-600', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600', 'from-cyan-500 to-sky-600',
];
const gradientFor = (id: number) => CARD_GRADIENTS[id % CARD_GRADIENTS.length];

export default function ParticipantesPage() {
  const [cursoSeleccionado, setCursoSeleccionado] = useState<MiCurso | null>(null);

  const { data: cursos, isLoading: loadingCursos } = useQuery({
    queryKey: ['mis-cursos'],
    queryFn: () => cursosService.getMisCursos(),
  });

  const { data: matriculados, isLoading: loadingEstudiantes } = useQuery({
    queryKey: ['matriculas', cursoSeleccionado?.idCurso],
    queryFn: () => matriculasService.getAll(cursoSeleccionado!.idCurso),
    enabled: !!cursoSeleccionado,
  });

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 shadow shrink-0">
          <UsersIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Participantes</h1>
          <p className="text-sm text-slate-500">
            {cursoSeleccionado
              ? `Estudiantes matriculados en ${cursoSeleccionado.nombreCurso}`
              : 'Selecciona un curso para ver sus estudiantes'}
          </p>
        </div>
      </div>

      {/* ── Sin curso seleccionado → mostrar cards ── */}
      {!cursoSeleccionado && (
        <>
          {loadingCursos ? (
            <Spinner />
          ) : !cursos?.length ? (
            <EmptyState message="No tienes cursos asignados" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cursos.map((c) => (
                <button
                  key={c.idCurso}
                  onClick={() => setCursoSeleccionado(c)}
                  className={`rounded-2xl bg-gradient-to-br ${gradientFor(c.idCurso)} p-5 text-white shadow-lg text-left hover:scale-[1.02] transition-transform`}
                >
                  <p className="text-xs font-medium opacity-80 uppercase tracking-wide mb-1">Curso</p>
                  <h2 className="text-lg font-bold">{c.nombreCurso}</h2>
                  <p className="text-xs opacity-70 mt-0.5">
                    {c.anioLectivo.fechaInicio.slice(0, 4)} — {c.anioLectivo.fechaFinal.slice(0, 4)}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold bg-white/20 rounded-lg px-3 py-1.5 w-fit">
                    <UsersIcon className="h-3.5 w-3.5" />
                    Ver estudiantes
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Con curso seleccionado → tabla de estudiantes ── */}
      {cursoSeleccionado && (
        <>
          {/* Botón volver */}
          <button
            onClick={() => setCursoSeleccionado(null)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Cambiar curso
          </button>

          {/* Info del curso */}
          <div className="flex items-center gap-3 mb-5 bg-white rounded-xl border border-slate-200 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 shrink-0">
              <AcademicCapIcon className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{cursoSeleccionado.nombreCurso}</p>
              <p className="text-xs text-slate-400">
                Año lectivo {cursoSeleccionado.anioLectivo.fechaInicio.slice(0, 4)}–{cursoSeleccionado.anioLectivo.fechaFinal.slice(0, 4)}
                {' · '}
                {cursoSeleccionado.materias.map((m) => m.nombreMateria).join(', ')}
              </p>
            </div>
            {!loadingEstudiantes && (
              <span className="ml-auto text-sm font-semibold text-slate-600">
                {matriculados?.length ?? 0} estudiante{matriculados?.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {loadingEstudiantes ? (
              <Spinner />
            ) : !matriculados?.length ? (
              <EmptyState message="No hay estudiantes matriculados en este curso" />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estudiante</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cédula</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Correo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matriculados.map((est: EstudianteMatriculado, idx) => (
                    <tr key={est.usuario.idUsuario} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">{idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 shrink-0">
                            <span className="text-xs font-bold text-indigo-600">
                              {est.usuario.nombreCompleto.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <p className="font-medium text-slate-800">{est.usuario.nombreCompleto}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{est.usuario.idUsuario}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{est.usuario.email ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <Badge
                          label={est.usuario.estadoUsuario}
                          variant={est.usuario.estadoUsuario === 'ACTIVO' ? 'green' : est.usuario.estadoUsuario === 'BLOQUEADO' ? 'red' : 'yellow'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}
