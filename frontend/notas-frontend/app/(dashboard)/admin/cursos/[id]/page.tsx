'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cursosService } from '@/services/cursos.service';
import { usuariosService } from '@/services/usuarios.service';
import { matriculasService } from '@/services/matriculas.service';
import { docenciasService } from '@/services/docencias.service';
import { materiasService } from '@/services/materias.service';
import { useToast } from '@/hooks/useToast';
import { useSearchDebounce } from '@/hooks/useSearchDebounce';
import ToastContainer from '@/components/ui/Toast';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import SearchBar from '@/components/ui/SearchBar';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  AcademicCapIcon,
  PlusIcon,
  TrashIcon,
  BookOpenIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-blue-500',
  'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
];
function avatarColor(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

type Tab = 'estudiantes' | 'docentes' | 'materias';

export default function CursoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const idCurso = Number(params.id);
  const [tab, setTab] = useState<Tab>('estudiantes');
  const [addEstudianteOpen, setAddEstudianteOpen] = useState(false);
  const [addDocenteOpen, setAddDocenteOpen] = useState(false);
  const [selectedProfesor, setSelectedProfesor] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('');

  const { searchInput: searchEst, setSearchInput: setSearchEst, debouncedSearch: debouncedEst } = useSearchDebounce(300);
  const [selectedNuevaMateria, setSelectedNuevaMateria] = useState('');

  // Curso con estudiantes y docentes incluidos
  const { data: curso, isLoading } = useQuery({
    queryKey: ['curso-detail', idCurso],
    queryFn: () => cursosService.getOne(idCurso),
    enabled: !!idCurso,
  });

  // Todos los estudiantes (para el picker)
  const { data: todosEstudiantes } = useQuery({
    queryKey: ['usuarios', 3, debouncedEst],
    queryFn: () => usuariosService.getAll({ rol: 3, search: debouncedEst || undefined, limit: 100 }),
    enabled: addEstudianteOpen,
  });

  // Todos los profesores (para el picker)
  const { data: todosProfesores } = useQuery({
    queryKey: ['usuarios', 2],
    queryFn: () => usuariosService.getAll({ rol: 2, limit: 200 }),
    enabled: addDocenteOpen,
  });

  // Todas las materias del sistema (para la pestaña Materias)
  const { data: todasMaterias } = useQuery({
    queryKey: ['materias'],
    queryFn: () => materiasService.getAll(),
    enabled: tab === 'materias',
  });

  // ---- Mutaciones ----
  const matricularMutation = useMutation({
    mutationFn: (idUsuario: string) =>
      matriculasService.create({ idUsuario, idCurso }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curso-detail', idCurso] });
      show('Estudiante matriculado');
    },
    onError: (e: any) => show(e?.response?.data?.message ?? 'Error al matricular', 'error'),
  });

  const desmatricularMutation = useMutation({
    mutationFn: (idUsuario: string) =>
      matriculasService.remove({ idUsuario, idCurso }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curso-detail', idCurso] });
      show('Estudiante removido del curso');
    },
    onError: () => show('Error al remover estudiante', 'error'),
  });

  const asignarDocenteMutation = useMutation({
    mutationFn: () =>
      docenciasService.create({
        idUsuario: selectedProfesor,
        idCurso,
        idMateria: Number(selectedMateria),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curso-detail', idCurso] });
      setSelectedProfesor('');
      setSelectedMateria('');
      setAddDocenteOpen(false);
      show('Profesor asignado');
    },
    onError: (e: any) => show(e?.response?.data?.message ?? 'Error al asignar docente', 'error'),
  });

  const removerDocenteMutation = useMutation({
    mutationFn: (d: { idUsuario: string; idMateria: number }) =>
      docenciasService.remove({ idUsuario: d.idUsuario, idCurso, idMateria: d.idMateria }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curso-detail', idCurso] });
      show('Profesor removido del curso');
    },
    onError: () => show('Error al remover docente', 'error'),
  });

  const agregarMateriaMutation = useMutation({
    mutationFn: (idMateria: number) => cursosService.assignMateria(idCurso, idMateria),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curso-detail', idCurso] });
      setSelectedNuevaMateria('');
      show('Materia agregada al curso');
    },
    onError: () => show('Error al agregar materia', 'error'),
  });

  const quitarMateriaMutation = useMutation({
    mutationFn: (idMateria: number) => cursosService.removeMateria(idCurso, idMateria),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['curso-detail', idCurso] });
      show('Materia removida del curso');
    },
    onError: (e: any) => show(e?.response?.data?.message ?? 'Error al quitar materia', 'error'),
  });

  if (isLoading) return <Spinner />;
  if (!curso) return <EmptyState message="Curso no encontrado" />;

  const estudiantes: any[] = (curso as any).estudiantes ?? [];
  const docentes: any[] = (curso as any).docentes ?? [];
  const materiasCurso: any[] = (curso as any).materias ?? [];

  // IDs ya matriculados para filtrar el picker
  const matriculadosIds = new Set(
    (curso as any)?.estudiantes?.map((e: any) => e.usuario.idUsuario) ?? [],
  );

  const estudiantesDisponibles = (todosEstudiantes?.data ?? []).filter(
    (u) => !matriculadosIds.has(u.idUsuario),
  );

  const materiasIds = new Set(materiasCurso.map((cm: any) => cm.idMateria));
  const materiasDisponibles = (todasMaterias ?? []).filter(
    (m) => !materiasIds.has(m.idMateria),
  );

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* Back + title */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/cursos')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver a Cursos
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{curso.nombreCurso}</h1>
            <p className="text-sm text-slate-500">
              {curso.anioLectivo
                ? `${curso.anioLectivo.fechaInicio.split('T')[0]} — ${curso.anioLectivo.fechaFinal.split('T')[0]}`
                : `Año lectivo ${curso.idAnioLectivo}`}
              {' '}·{' '}
              <span className="font-medium">{estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''}</span>
              {' '}·{' '}
              <span className="font-medium">{materiasCurso.length} materia{materiasCurso.length !== 1 ? 's' : ''}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit">
        <button
          onClick={() => setTab('estudiantes')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === 'estudiantes' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserGroupIcon className="h-4 w-4" />
          Estudiantes
          <span className={`rounded-full px-2 py-0.5 text-xs ${tab === 'estudiantes' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
            {estudiantes.length}
          </span>
        </button>
        <button
          onClick={() => setTab('docentes')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === 'docentes' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <AcademicCapIcon className="h-4 w-4" />
          Docentes
          <span className={`rounded-full px-2 py-0.5 text-xs ${tab === 'docentes' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
            {docentes.length}
          </span>
        </button>
        <button
          onClick={() => setTab('materias')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === 'materias' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpenIcon className="h-4 w-4" />
          Materias
          <span className={`rounded-full px-2 py-0.5 text-xs ${tab === 'materias' ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-500'}`}>
            {materiasCurso.length}
          </span>
        </button>
      </div>

      {/* ========== ESTUDIANTES TAB ========== */}
      {tab === 'estudiantes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">Estudiantes matriculados en este curso</p>
            <button
              onClick={() => setAddEstudianteOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow"
            >
              <PlusIcon className="h-4 w-4" />
              Matricular estudiante
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {estudiantes.length === 0 ? (
              <EmptyState message="No hay estudiantes matriculados aún" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Estudiante</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {estudiantes.map((e: any) => {
                    const u = e.usuario;
                    return (
                      <tr key={u.idUsuario} className="group hover:bg-emerald-50/30 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(u.idUsuario)}`}>
                              {initials(u.nombreCompleto)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{u.nombreCompleto}</p>
                              <p className="font-mono text-xs text-slate-400">{u.idUsuario}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {u.email ?? <span className="italic text-slate-300">Sin email</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => desmatricularMutation.mutate(u.idUsuario)}
                              disabled={desmatricularMutation.isPending}
                              title="Remover del curso"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 transition"
                            >
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
        </div>
      )}

      {/* ========== DOCENTES TAB ========== */}
      {tab === 'docentes' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">Profesores asignados por materia</p>
            <button
              onClick={() => setAddDocenteOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition shadow"
              disabled={materiasCurso.length === 0}
              title={materiasCurso.length === 0 ? 'El curso no tiene materias asignadas' : undefined}
            >
              <PlusIcon className="h-4 w-4" />
              Asignar docente
            </button>
          </div>

          {materiasCurso.length === 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Este curso no tiene materias asignadas. Ve a <strong>Cursos</strong> y edita el curso para agregar materias primero.
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {docentes.length === 0 ? (
              <EmptyState message="No hay docentes asignados aún" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Profesor</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Materia</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docentes.map((d: any) => (
                    <tr key={`${d.usuario?.idUsuario}-${d.idMateria}`} className="group hover:bg-blue-50/30 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(d.usuario?.idUsuario ?? '0')}`}>
                            {initials(d.usuario?.nombreCompleto ?? '?')}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{d.usuario?.nombreCompleto}</p>
                            <p className="font-mono text-xs text-slate-400">{d.usuario?.idUsuario}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <BookOpenIcon className="h-4 w-4 text-blue-400 shrink-0" />
                          <span className="font-medium text-slate-700">{d.materia?.nombreMateria ?? `Materia ${d.idMateria}`}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => removerDocenteMutation.mutate({ idUsuario: d.usuario?.idUsuario, idMateria: d.idMateria })}
                            disabled={removerDocenteMutation.isPending}
                            title="Remover docencia"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 transition"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========== MATERIAS TAB ========== */}
      {tab === 'materias' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">Materias asignadas a este curso</p>
          </div>

          {/* Agregar materia */}
          {materiasDisponibles.length > 0 && (
            <div className="mb-4 flex gap-2 items-center">
              <select
                value={selectedNuevaMateria}
                onChange={(e) => setSelectedNuevaMateria(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 flex-1 max-w-xs"
              >
                <option value="">Seleccionar materia para agregar...</option>
                {materiasDisponibles.map((m) => (
                  <option key={m.idMateria} value={m.idMateria}>{m.nombreMateria}</option>
                ))}
              </select>
              <button
                onClick={() => selectedNuevaMateria && agregarMateriaMutation.mutate(Number(selectedNuevaMateria))}
                disabled={!selectedNuevaMateria || agregarMateriaMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition"
              >
                <PlusIcon className="h-4 w-4" />
                Agregar
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {materiasCurso.length === 0 ? (
              <EmptyState message="Este curso no tiene materias asignadas" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-violet-50">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Materia</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materiasCurso.map((cm: any) => (
                    <tr key={cm.idMateria} className="group hover:bg-violet-50/30 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                            <BookOpenIcon className="h-4 w-4 text-violet-600" />
                          </div>
                          <span className="font-medium text-slate-800">
                            {cm.materia?.nombreMateria ?? `Materia ${cm.idMateria}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => quitarMateriaMutation.mutate(cm.idMateria)}
                            disabled={quitarMateriaMutation.isPending}
                            title="Quitar materia del curso"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 transition"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ======= MODAL: Matricular estudiante ======= */}
      <Modal isOpen={addEstudianteOpen} onClose={() => { setAddEstudianteOpen(false); setSearchEst(''); }} title="Matricular estudiante" size="md">
        <div className="space-y-3">
          <SearchBar
            value={searchEst}
            onChange={setSearchEst}
            placeholder="Buscar por nombre, email o cédula..."
            className="w-full"
          />
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {!todosEstudiantes ? (
              <Spinner size="sm" />
            ) : estudiantesDisponibles.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                {debouncedEst ? 'Sin resultados' : 'Todos los estudiantes ya están matriculados'}
              </p>
            ) : (
              estudiantesDisponibles.map((u) => (
                <div
                  key={u.idUsuario}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(u.idUsuario)}`}>
                      {initials(u.nombreCompleto)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.nombreCompleto}</p>
                      <p className="font-mono text-xs text-slate-400">{u.idUsuario}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => matricularMutation.mutate(u.idUsuario)}
                    disabled={matricularMutation.isPending}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    Matricular
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* ======= MODAL: Asignar docente ======= */}
      <Modal isOpen={addDocenteOpen} onClose={() => { setAddDocenteOpen(false); setSelectedProfesor(''); setSelectedMateria(''); }} title="Asignar docente" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Profesor</label>
            <select
              value={selectedProfesor}
              onChange={(e) => setSelectedProfesor(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar profesor...</option>
              {(todosProfesores?.data ?? []).map((u) => (
                <option key={u.idUsuario} value={u.idUsuario}>
                  {u.nombreCompleto} ({u.idUsuario})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Materia</label>
            <select
              value={selectedMateria}
              onChange={(e) => setSelectedMateria(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar materia...</option>
              {materiasCurso.map((cm: any) => (
                <option key={cm.idMateria} value={cm.idMateria}>
                  {cm.materia?.nombreMateria ?? `Materia ${cm.idMateria}`}
                </option>
              ))}
            </select>
            {materiasCurso.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">Este curso no tiene materias asignadas.</p>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => asignarDocenteMutation.mutate()}
              disabled={!selectedProfesor || !selectedMateria || asignarDocenteMutation.isPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {asignarDocenteMutation.isPending && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              Asignar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
