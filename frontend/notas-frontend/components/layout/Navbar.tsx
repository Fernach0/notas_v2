'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { BellIcon, ArrowRightStartOnRectangleIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificacionesService } from '@/services/notificaciones.service';
import { Notificacion } from '@/types';

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Navbar() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifs } = useQuery({
    queryKey: ['notificaciones', false],
    queryFn: () => notificacionesService.getAll(false),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const { data: allNotifs } = useQuery({
    queryKey: ['notificaciones-all'],
    queryFn: () => notificacionesService.getAll(),
    enabled: open && !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificacionesService.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificaciones'] });
      qc.invalidateQueries({ queryKey: ['notificaciones-all'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificacionesService.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notificaciones'] });
      qc.invalidateQueries({ queryKey: ['notificaciones-all'] });
    },
  });

  // Close panel on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close panel on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const unread = notifs?.length ?? 0;
  const displayed: Notificacion[] = allNotifs ?? [];

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-slate-200 shrink-0 relative">
      {/* Saludo */}
      <p className="text-sm text-slate-600">
        Bienvenido,{' '}
        <span className="font-semibold text-slate-800">{user?.nombreCompleto}</span>
      </p>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        {/* Campana de notificaciones */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Notificaciones"
        >
          <BellIcon className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200" />

        {/* Avatar + Logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold">
            {user?.nombreCompleto?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-500 transition"
          >
            <ArrowRightStartOnRectangleIcon className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Notifications panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute top-14 right-4 z-50 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-800">
              Notificaciones {unread > 0 && <span className="text-blue-600">({unread})</span>}
            </span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  title="Marcar todas como leídas"
                  className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition text-xs flex items-center gap-1"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Leer todas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {displayed.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">No tienes notificaciones</div>
            ) : (
              displayed.map((n) => (
                <div
                  key={n.idNotificacion}
                  className={`px-4 py-3 flex gap-3 hover:bg-slate-50 transition ${!n.leida ? 'bg-blue-50/50' : ''}`}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${!n.leida ? 'bg-blue-500' : 'bg-slate-200'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-relaxed">{n.mensajeNotificacion}</p>
                    {n.fechaNotificacion && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{fmt(n.fechaNotificacion)}</p>
                    )}
                  </div>
                  {!n.leida && (
                    <button
                      onClick={() => markReadMutation.mutate(n.idNotificacion)}
                      disabled={markReadMutation.isPending}
                      title="Marcar como leída"
                      className="shrink-0 p-1 rounded text-slate-300 hover:text-blue-500 hover:bg-blue-100 transition"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}
