'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evidenciasService } from '@/services/evidencias.service';
import { actividadesService } from '@/services/actividades.service';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { Actividad } from '@/types';
import Modal from '@/components/ui/Modal';
import EvidenciaUploadForm from '@/components/forms/EvidenciaUploadForm';
import ToastContainer from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { ArrowDownTrayIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';

const fmt = (d: string) => new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
const isVencida = (fin: string) => new Date(fin) < new Date();

export default function EvidenciasEstudiantePage() {
  const searchParams = useSearchParams();
  const idActividad = searchParams.get('idActividad') ? Number(searchParams.get('idActividad')) : null;
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const uploadModal = useModal<Actividad>();

  const { data: evidencias, isLoading } = useQuery({
    queryKey: ['evidencias', idActividad],
    queryFn: () => evidenciasService.getAll(idActividad!),
    enabled: !!idActividad,
  });

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => evidenciasService.upload(fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['evidencias'] }); uploadModal.close(); show('Evidencia subida correctamente'); },
    onError: () => show('Error al subir la evidencia', 'error'),
  });

  if (!idActividad) {
    return (
      <div>
        <h1 className="text-xl font-bold text-slate-800 mb-1">Mis Evidencias</h1>
        <p className="text-sm text-slate-500 mb-6">Accede desde una actividad para subir o ver evidencias.</p>
        <a href="/estudiante/actividades" className="text-blue-600 text-sm underline">Ver actividades</a>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Evidencias</h1>
          <p className="text-sm text-slate-500">Actividad #{idActividad}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? <Spinner /> : evidencias?.length === 0 ? <EmptyState message="No has subido evidencias aún" /> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Archivo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha subida</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descargar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evidencias?.map((e) => (
                <tr key={e.idEvidencia} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{e.nombreArchivo}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">{e.fechaSubida ? fmt(e.fechaSubida) : '—'}</td>
                  <td className="px-5 py-3.5">
                    <Badge label={e.estado} variant={e.estado === 'ACTIVO' ? 'green' : 'red'} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end">
                      {e.estado === 'ACTIVO' && (
                        <a href={evidenciasService.getDownloadUrl(e.idEvidencia)} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                          <ArrowDownTrayIcon className="h-4 w-4" /> Descargar
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={uploadModal.isOpen} onClose={uploadModal.close} title="Subir evidencia PDF" size="sm">
        {uploadModal.item && (
          <EvidenciaUploadForm
            idActividad={uploadModal.item.idActividad}
            nombreActividad={uploadModal.item.tituloActividad ?? 'Actividad'}
            tipoActividad={uploadModal.item.tipoActividad}
            onSubmit={(fd) => uploadMutation.mutateAsync(fd)}
            isLoading={uploadMutation.isPending}
          />
        )}
      </Modal>
    </>
  );
}
