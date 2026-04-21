'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { XMarkIcon, UserCircleIcon, AcademicCapIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import Spinner from './Spinner';

const ROLE_LABELS: Record<number, string> = { 1: 'Administrador', 2: 'Profesor', 3: 'Estudiante' };
const ROLE_COLORS: Record<number, string> = {
  1: 'bg-violet-100 text-violet-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-emerald-100 text-emerald-700',
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['perfil-me'],
    queryFn: () => authService.getMe(),
    enabled: open,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-14 right-4 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-gradient-to-r from-indigo-50 to-slate-50">
        <span className="text-sm font-semibold text-slate-800">Mi perfil</span>
        <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-8"><Spinner /></div>
      ) : !perfil ? (
        <div className="px-4 py-6 text-center text-sm text-slate-400">No se pudo cargar el perfil</div>
      ) : (
        <div className="divide-y divide-slate-50">
          {/* Identity */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold">
              {perfil.nombreCompleto.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 truncate">{perfil.nombreCompleto}</p>
              <p className="font-mono text-xs text-slate-400">{perfil.idUsuario}</p>
              {perfil.email && <p className="text-xs text-slate-500 truncate">{perfil.email}</p>}
            </div>
          </div>

          {/* Roles */}
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {perfil.roles.map((r) => (
                <span key={r.idRol} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[r.idRol] ?? 'bg-slate-100 text-slate-600'}`}>
                  {ROLE_LABELS[r.idRol] ?? r.rol?.nombreRol ?? `Rol ${r.idRol}`}
                </span>
              ))}
            </div>
          </div>

          {/* Student: matricula */}
          {perfil.matricula && (
            <div className="px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                <AcademicCapIcon className="h-3.5 w-3.5" /> Matrícula
              </p>
              <p className="text-sm font-medium text-slate-800">{perfil.matricula.curso.nombreCurso}</p>
              <p className="text-xs text-slate-500">
                {perfil.matricula.curso.anioLectivo.fechaInicio.split('T')[0]} — {perfil.matricula.curso.anioLectivo.fechaFinal.split('T')[0]}
              </p>
            </div>
          )}

          {/* Profesor: docencias */}
          {perfil.docencias && perfil.docencias.length > 0 && (
            <div className="px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                <BookOpenIcon className="h-3.5 w-3.5" /> Docencias
              </p>
              <ul className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {perfil.docencias.map((d) => (
                  <li key={`${d.idCurso}-${d.idMateria}`} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium truncate mr-2">{d.materia.nombreMateria}</span>
                    <span className="text-slate-400 shrink-0">{d.curso.nombreCurso}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
