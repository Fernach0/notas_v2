'use client';

import { useState, useEffect, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cursosService } from '@/services/cursos.service';
import { parcialesService } from '@/services/parciales.service';
import { actividadesService } from '@/services/actividades.service';
import { calificacionesService } from '@/services/calificaciones.service';
import { evidenciasService } from '@/services/evidencias.service';
import { matriculasService, EstudianteMatriculado } from '@/services/matriculas.service';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { Actividad, MiCurso } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ActividadForm from '@/components/forms/ActividadForm';
import CalificacionForm from '@/components/forms/CalificacionForm';
import ToastContainer from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import {
  PlusIcon, PencilSquareIcon, TrashIcon, AcademicCapIcon,
  BookOpenIcon, ClipboardDocumentListIcon, ArrowLeftIcon,
  ArrowDownTrayIcon, EyeIcon, CheckCircleIcon, ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

// ── Constantes ────────────────────────────────────────────────────────────────
const TIPO_COLORS: Record<string, 'blue' | 'red' | 'green' | 'yellow'> = {
  TAREA: 'blue', EXAMEN: 'red', PROYECTO: 'green', PRUEBA: 'yellow',
};
const TIPO_PESO: Record<string, string> = {
  TAREA: '20%', PRUEBA: '20%', PROYECTO: '25%', EXAMEN: '35%',
};
const CARD_GRADIENTS = [
  'from-indigo-500 to-blue-600', 'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600', 'from-cyan-500 to-sky-600',
];
const gradientFor = (id: number) => CARD_GRADIENTS[id % CARD_GRADIENTS.length];

const fmtCorto = (d: string) =>
  new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
const fmtLargo = (d: string) =>
  new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
const isVencida = (fin: string) => new Date(fin) < new Date();

type Mode = 'actividades' | 'calificar';

// ── Breadcrumb paso a paso ────────────────────────────────────────────────────
function Paso({ num, label, activo, completado }: { num: number; label: string; activo: boolean; completado: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${activo ? 'text-blue-600' : completado ? 'text-green-600' : 'text-slate-400'}`}>
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${activo ? 'bg-blue-600 text-white' : completado ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
        {completado ? '✓' : num}
      </span>
      {label}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ActividadesProfesorPage() {
  const searchParams = useSearchParams();
  const paramIdCurso = searchParams.get('idCurso') ? Number(searchParams.get('idCurso')) : null;
  const paramIdMateria = searchParams.get('idMateria') ? Number(searchParams.get('idMateria')) : null;

  // ── Estado global ────────────────────────────────────────────────────────
  const [cursoSel, setCursoSel] = useState<MiCurso | null>(null);
  const [idMateria, setIdMateria] = useState<number | null>(null);
  const [parcialActivo, setParcialActivo] = useState(1);
  const [mode, setMode] = useState<Mode>('actividades');

  // Estado del wizard de calificación
  const [parcialCalif, setParcialCalif] = useState<number | null>(null);
  const [actividadCalif, setActividadCalif] = useState<Actividad | null>(null);

  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const createModal = useModal();
  const editModal = useModal<Actividad>();
  const deleteModal = useModal<Actividad>();
  const califModal = useModal<{ idUsuario: string; idCalificacion?: number; nota?: number; comentario?: string }>();

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: cursos, isLoading: loadingCursos } = useQuery({
    queryKey: ['mis-cursos'],
    queryFn: () => cursosService.getMisCursos(),
  });

  // Pre-seleccionar desde params de URL (viene del dashboard)
  useEffect(() => {
    if (paramIdCurso && paramIdMateria && cursos && !cursoSel) {
      const c = cursos.find((c) => c.idCurso === paramIdCurso);
      if (c) { setCursoSel(c); setIdMateria(paramIdMateria); }
    }
  }, [cursos, paramIdCurso, paramIdMateria]);

  const idCurso = cursoSel?.idCurso ?? null;
  const materias = cursoSel?.materias ?? [];
  const materiaActiva = idMateria ?? materias[0]?.idMateria ?? null;

  const { data: parciales } = useQuery({
    queryKey: ['parciales', idCurso, materiaActiva],
    queryFn: () => parcialesService.getAll(idCurso!, materiaActiva!),
    enabled: !!idCurso && !!materiaActiva,
  });

  const ctx = parciales?.[0] as any;
  const nombreCurso = cursoSel?.nombreCurso ?? ctx?.curso?.nombreCurso ?? '';
  const nombreMateria = materias.find((m) => m.idMateria === materiaActiva)?.nombreMateria ?? ctx?.materia?.nombreMateria ?? '';

  const parcialId = parciales?.find((p) => p.numeroParcial === parcialActivo)?.idParcial;

  // Actividades para gestión
  const { data: actividades, isLoading } = useQuery({
    queryKey: ['actividades', parcialId],
    queryFn: () => actividadesService.getAll(parcialId!),
    enabled: !!parcialId,
  });

  // Parcial del wizard de calificación
  const parcialCalifId = parciales?.find((p) => p.numeroParcial === parcialCalif)?.idParcial;

  // Actividades del parcial seleccionado en el wizard
  const { data: actividadesCalif, isLoading: loadingActsCalif } = useQuery({
    queryKey: ['actividades', parcialCalifId],
    queryFn: () => actividadesService.getAll(parcialCalifId!),
    enabled: !!parcialCalifId,
  });

  // Estudiantes del curso
  const { data: matriculados, isLoading: loadingEst } = useQuery({
    queryKey: ['matriculas', idCurso],
    queryFn: () => matriculasService.getAll(idCurso!),
    enabled: !!idCurso && !!actividadCalif,
  });

  // Calificaciones de la actividad seleccionada
  const { data: calificaciones, isLoading: loadingCalif } = useQuery({
    queryKey: ['calificaciones', actividadCalif?.idActividad],
    queryFn: () => calificacionesService.getByActividad(actividadCalif!.idActividad),
    enabled: !!actividadCalif,
  });

  // Evidencias de la actividad seleccionada
  const { data: evidencias } = useQuery({
    queryKey: ['evidencias-actividad', actividadCalif?.idActividad],
    queryFn: () => evidenciasService.getAll(actividadCalif!.idActividad),
    enabled: !!actividadCalif,
  });

  const califMap = new Map(calificaciones?.map((c) => [c.idUsuario, c]) ?? []);
  const evidenciaMap = new Map(
    evidencias?.filter((e) => e.estado === 'ACTIVO').map((e) => [e.idUsuario, e]) ?? [],
  );

  // Auto-crear parciales si no existen
  const autoInit = useMutation({
    mutationFn: () => parcialesService.createBulk({ idCurso: idCurso!, idMateria: materiaActiva! }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parciales', idCurso, materiaActiva] }),
  });
  useEffect(() => {
    if (parciales !== undefined && parciales.length === 0 && idCurso && materiaActiva && !autoInit.isPending) {
      autoInit.mutate();
    }
  }, [parciales, idCurso, materiaActiva]);

  // ── Mutations de actividades ──────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: actividadesService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actividades'] }); createModal.close(); show('Actividad creada'); },
    onError: (e: any) => show(e?.response?.data?.message ?? 'Error al crear', 'error'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => actividadesService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actividades'] }); editModal.close(); show('Actividad actualizada'); },
    onError: () => show('Error al actualizar', 'error'),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => actividadesService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actividades'] }); deleteModal.close(); show('Actividad eliminada'); },
    onError: () => show('Error al eliminar', 'error'),
  });

  // ── Mutations de calificaciones ───────────────────────────────────────────
  const createCalif = useMutation({
    mutationFn: (d: any) => calificacionesService.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calificaciones', actividadCalif?.idActividad] });
      califModal.close(); show('Nota guardada');
    },
    onError: () => show('Error al guardar nota', 'error'),
  });
  const updateCalif = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => calificacionesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calificaciones', actividadCalif?.idActividad] });
      califModal.close(); show('Nota actualizada');
    },
    onError: () => show('Error al actualizar nota', 'error'),
  });

  const resetWizard = () => { setParcialCalif(null); setActividadCalif(null); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl shadow shrink-0 ${mode === 'calificar' ? 'bg-green-600' : 'bg-blue-600'}`}>
          {mode === 'calificar' ? <ChartBarIcon className="h-6 w-6 text-white" /> : <ClipboardDocumentListIcon className="h-6 w-6 text-white" />}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {mode === 'calificar' ? 'Calificar actividades' : 'Actividades'}
          </h1>
          <p className="text-sm text-slate-500">
            {cursoSel ? `${nombreCurso} · ${nombreMateria}` : 'Selecciona un curso para comenzar'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {cursoSel && mode === 'actividades' && (
            <button
              onClick={() => { setMode('calificar'); resetWizard(); }}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
            >
              <ChartBarIcon className="h-4 w-4" /> Calificar actividades
            </button>
          )}
          {mode === 'calificar' && (
            <button
              onClick={() => { setMode('actividades'); resetWizard(); }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Volver a actividades
            </button>
          )}
          {cursoSel && (
            <button
              onClick={() => { setCursoSel(null); setIdMateria(null); setMode('actividades'); resetWizard(); }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition border border-slate-200 rounded-lg px-3 py-1.5"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" /> Cambiar curso
            </button>
          )}
        </div>
      </div>

      {/* ── SELECCIÓN DE CURSO ────────────────────────────────────────────── */}
      {!cursoSel && (
        loadingCursos ? <Spinner /> : !cursos?.length ? <EmptyState message="No tienes cursos asignados" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cursos.map((c) => (
              <button key={c.idCurso}
                onClick={() => { setCursoSel(c); setIdMateria(c.materias[0]?.idMateria ?? null); }}
                className={`rounded-2xl bg-gradient-to-br ${gradientFor(c.idCurso)} p-5 text-white shadow-lg text-left hover:scale-[1.02] transition-transform`}
              >
                <p className="text-xs font-medium opacity-80 uppercase tracking-wide mb-1">Curso</p>
                <h2 className="text-lg font-bold">{c.nombreCurso}</h2>
                <p className="text-xs opacity-70 mb-3">{c.anioLectivo.fechaInicio.slice(0, 4)} — {c.anioLectivo.fechaFinal.slice(0, 4)}</p>
                {c.materias.map((m) => (
                  <div key={m.idMateria} className="flex items-center gap-1.5 text-xs bg-white/15 rounded-lg px-2.5 py-1 mb-1">
                    <BookOpenIcon className="h-3 w-3 opacity-80" /> {m.nombreMateria}
                  </div>
                ))}
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold bg-white/20 rounded-lg px-3 py-1.5 w-fit">
                  <ClipboardDocumentListIcon className="h-3.5 w-3.5" /> Seleccionar
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODO: GESTIÓN DE ACTIVIDADES
         ══════════════════════════════════════════════════════════════════════ */}
      {cursoSel && mode === 'actividades' && (
        <>
          {/* Tabs de materia */}
          {materias.length > 1 && (
            <div className="flex gap-1.5 mb-5 flex-wrap">
              {materias.map((m) => (
                <button key={m.idMateria} onClick={() => setIdMateria(m.idMateria)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${materiaActiva === m.idMateria ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <BookOpenIcon className="h-3.5 w-3.5" /> {m.nombreMateria}
                </button>
              ))}
            </div>
          )}

          {/* Barra de info + nueva actividad */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex flex-wrap items-center gap-x-3 text-sm text-slate-500">
              <span className="flex items-center gap-1"><AcademicCapIcon className="h-4 w-4 text-slate-400" />{nombreCurso}</span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1"><BookOpenIcon className="h-4 w-4 text-slate-400" />{nombreMateria}</span>
            </div>
            <button onClick={() => createModal.open()} disabled={!parcialId}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
              <PlusIcon className="h-4 w-4" /> Nueva actividad
            </button>
          </div>

          {/* Tabs de parcial */}
          <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
            {[1, 2, 3].map((n) => (
              <button key={n} onClick={() => setParcialActivo(n)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${parcialActivo === n ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Parcial {n}
              </button>
            ))}
          </div>

          {/* Tabla de actividades */}
          {!parcialId ? <Spinner /> : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {isLoading ? <Spinner /> : !actividades?.length ? (
                <EmptyState message="No hay actividades en este parcial. Crea la primera." />
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Título</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Período de entrega</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {actividades.map((a) => {
                      const vencida = isVencida(a.fechaFinEntrega);
                      return (
                        <tr key={a.idActividad} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-slate-800">{a.tituloActividad ?? '—'}</p>
                            {a.descripcion && <p className="text-xs text-slate-400 line-clamp-1">{a.descripcion}</p>}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge label={a.tipoActividad} variant={TIPO_COLORS[a.tipoActividad] ?? 'gray'} />
                            <p className="text-xs text-slate-400 mt-0.5">Peso: {TIPO_PESO[a.tipoActividad]}</p>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400" />
                              {fmtCorto(a.fechaInicioEntrega)} → {fmtCorto(a.fechaFinEntrega)}
                            </div>
                            <p className="text-slate-400 mt-0.5">Cierre: {fmtLargo(a.fechaFinEntrega)}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            {vencida ? (
                              <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                                <span className="h-2 w-2 rounded-full bg-red-500" /> Cerrada
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Abierta
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => editModal.open(a)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition">
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button onClick={() => deleteModal.open(a)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODO: CALIFICAR (wizard 3 pasos)
         ══════════════════════════════════════════════════════════════════════ */}
      {cursoSel && mode === 'calificar' && (
        <>
          {/* Breadcrumb de pasos */}
          <div className="flex items-center gap-3 mb-7 flex-wrap">
            <Paso num={1} label="Elegir parcial" activo={!parcialCalif} completado={!!parcialCalif} />
            <span className="text-slate-300 font-bold">›</span>
            <Paso num={2} label="Elegir actividad" activo={!!parcialCalif && !actividadCalif} completado={!!actividadCalif} />
            <span className="text-slate-300 font-bold">›</span>
            <Paso num={3} label="Calificar estudiantes" activo={!!actividadCalif} completado={false} />
          </div>

          {/* ── PASO 1: Elegir parcial ─────────────────────────────────── */}
          {!parcialCalif && (
            <>
              <p className="text-sm text-slate-500 mb-4">Selecciona el parcial cuyas actividades deseas calificar:</p>
              <div className="grid grid-cols-3 gap-4 max-w-lg">
                {[1, 2, 3].map((n) => {
                  const existe = parciales?.some((p) => p.numeroParcial === n);
                  return (
                    <button key={n}
                      onClick={() => existe && setParcialCalif(n)}
                      disabled={!existe}
                      className={`rounded-xl border-2 py-8 flex flex-col items-center gap-2 transition font-semibold ${existe ? 'border-blue-200 bg-blue-50 hover:border-blue-500 hover:bg-blue-100 text-blue-700 cursor-pointer' : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'}`}
                    >
                      <span className="text-3xl font-bold">{n}</span>
                      <span className="text-xs">Parcial {n}</span>
                      {!existe && <span className="text-xs font-normal text-slate-400">No creado</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── PASO 2: Elegir actividad ───────────────────────────────── */}
          {parcialCalif && !actividadCalif && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setParcialCalif(null)}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition">
                  <ArrowLeftIcon className="h-3.5 w-3.5" /> Parcial {parcialCalif}
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">Selecciona la actividad que deseas calificar:</p>
              {loadingActsCalif ? <Spinner /> : !actividadesCalif?.length ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-700">
                  No hay actividades en el Parcial {parcialCalif}.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {actividadesCalif.map((a) => (
                    <button key={a.idActividad} onClick={() => setActividadCalif(a)}
                      className="rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md text-left p-4 transition group">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-slate-800 group-hover:text-blue-700">{a.tituloActividad ?? `Actividad #${a.idActividad}`}</p>
                        <Badge label={a.tipoActividad} variant={TIPO_COLORS[a.tipoActividad] ?? 'gray'} />
                      </div>
                      {a.descripcion && <p className="text-xs text-slate-400 mb-2 line-clamp-2">{a.descripcion}</p>}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{fmtCorto(a.fechaInicioEntrega)} → {fmtCorto(a.fechaFinEntrega)}</span>
                        <span className={isVencida(a.fechaFinEntrega) ? 'text-red-400' : 'text-green-500 font-medium'}>
                          {isVencida(a.fechaFinEntrega) ? 'Cerrada' : 'Abierta'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── PASO 3: Tabla de estudiantes ───────────────────────────── */}
          {actividadCalif && (
            <>
              <button onClick={() => setActividadCalif(null)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition mb-4">
                <ArrowLeftIcon className="h-3.5 w-3.5" /> Parcial {parcialCalif}
              </button>

              {/* Info de la actividad seleccionada */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 mb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-blue-800 text-base">{actividadCalif.tituloActividad ?? `Actividad #${actividadCalif.idActividad}`}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-blue-600">
                      <span>Parcial {parcialCalif}</span>
                      <span>·</span>
                      <span>Peso: {TIPO_PESO[actividadCalif.tipoActividad]}</span>
                      <span>·</span>
                      <span>Entrega: {fmtCorto(actividadCalif.fechaInicioEntrega)} → {fmtCorto(actividadCalif.fechaFinEntrega)}</span>
                    </div>
                  </div>
                  <Badge label={actividadCalif.tipoActividad} variant={TIPO_COLORS[actividadCalif.tipoActividad] ?? 'gray'} />
                </div>
              </div>

              {/* Tabla de estudiantes */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {loadingEst || loadingCalif ? <Spinner /> : !matriculados?.length ? (
                  <EmptyState message="No hay estudiantes matriculados en este curso" />
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">#</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Estudiante</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Evidencia PDF</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Nota</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matriculados.map((est: EstudianteMatriculado, idx) => {
                        const { idUsuario, nombreCompleto } = est.usuario;
                        const c = califMap.get(idUsuario);
                        const ev = evidenciaMap.get(idUsuario);
                        return (
                          <tr key={idUsuario} className="hover:bg-slate-50 transition">
                            <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{idx + 1}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 shrink-0">
                                  <span className="text-xs font-bold text-slate-600">{nombreCompleto.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">{nombreCompleto}</p>
                                  <p className="text-xs text-slate-400 font-mono">{idUsuario}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {ev ? (
                                <div className="flex items-center justify-center gap-3">
                                  <button
                                    onClick={async () => { const ok = await evidenciasService.verEnPestana(ev.idEvidencia); if (!ok) show('No se pudo abrir el PDF', 'error'); }}
                                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition">
                                    <EyeIcon className="h-3.5 w-3.5" /> Ver PDF
                                  </button>
                                  <button
                                    onClick={async () => { const ok = await evidenciasService.descargar(ev.idEvidencia); if (!ok) show('No se pudo descargar el PDF', 'error'); }}
                                    className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition">
                                    <ArrowDownTrayIcon className="h-3.5 w-3.5" /> Descargar
                                  </button>
                                </div>
                              ) : (
                                <span className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                                  <span className="h-2 w-2 rounded-full bg-slate-300" /> Sin evidencia
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {c ? (
                                <span className={`font-bold text-base tabular-nums ${c.nota >= 7 ? 'text-green-600' : 'text-red-500'}`}>
                                  {Number(c.nota).toFixed(2)}
                                </span>
                              ) : <span className="text-slate-300 text-sm">—</span>}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <button
                                onClick={() => califModal.open({ idUsuario, idCalificacion: c?.idCalificacion, nota: c?.nota, comentario: c?.comentario })}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition mx-auto ${c ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                              >
                                {c ? <PencilSquareIcon className="h-3.5 w-3.5" /> : <CheckCircleIcon className="h-3.5 w-3.5" />}
                                {c ? 'Editar nota' : 'Calificar'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Modales de actividad ──────────────────────────────────────────── */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.close} title={`Nueva actividad — ${nombreMateria}`}>
        <ActividadForm idParcial={parcialId!} onSubmit={(d) => createMut.mutateAsync(d)} isLoading={createMut.isPending} />
      </Modal>
      <Modal isOpen={editModal.isOpen} onClose={editModal.close} title={`Editar actividad — ${nombreMateria}`}>
        <ActividadForm idParcial={parcialId!} item={editModal.item} onSubmit={(d) => updateMut.mutateAsync({ id: editModal.item!.idActividad, data: d })} isLoading={updateMut.isPending} />
      </Modal>
      <ConfirmDialog
        isOpen={deleteModal.isOpen} onClose={deleteModal.close}
        onConfirm={() => deleteMut.mutate(deleteModal.item!.idActividad)}
        message={`¿Eliminar "${deleteModal.item?.tituloActividad ?? 'esta actividad'}"?`}
        isLoading={deleteMut.isPending}
      />

      {/* ── Modal de calificación ─────────────────────────────────────────── */}
      <Modal isOpen={califModal.isOpen} onClose={califModal.close} title="Registrar nota" size="sm">
        {califModal.item && (
          <CalificacionForm
            idUsuario={califModal.item.idUsuario}
            idActividad={actividadCalif!.idActividad}
            valorMaximo={actividadCalif!.valorMaximo}
            notaActual={califModal.item.nota}
            comentarioActual={califModal.item.comentario}
            onSubmit={async (d) => {
              if (califModal.item?.idCalificacion) {
                await updateCalif.mutateAsync({ id: califModal.item.idCalificacion, data: d });
              } else {
                await createCalif.mutateAsync({ idUsuario: califModal.item!.idUsuario, idActividad: actividadCalif!.idActividad, ...d });
              }
            }}
            isLoading={createCalif.isPending || updateCalif.isPending}
          />
        )}
      </Modal>
    </>
  );
}
