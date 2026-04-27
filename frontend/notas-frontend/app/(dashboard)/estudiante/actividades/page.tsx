'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcialesService } from '@/services/parciales.service';
import { actividadesService } from '@/services/actividades.service';
import { evidenciasService } from '@/services/evidencias.service';
import { matriculasService } from '@/services/matriculas.service';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { Actividad } from '@/types';
import Modal from '@/components/ui/Modal';
import EvidenciaUploadForm from '@/components/forms/EvidenciaUploadForm';
import ToastContainer from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import Spinner, { EmptyState } from '@/components/ui/Spinner';
import { DocumentArrowUpIcon, AcademicCapIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const fmt = (d: string) => new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
const isVencida = (fin: string) => new Date(fin) < new Date();

const TIPO_COLORS: Record<string, 'blue' | 'red' | 'green' | 'yellow'> = {
  TAREA: 'blue', EXAMEN: 'red', PROYECTO: 'green', PRUEBA: 'yellow',
};

// ── Indicador de estado de entrega ─────────────────────────────────────────
function EntregaIndicador({
  idActividad,
  fechaFin,
  submittedIds,
}: {
  idActividad: number;
  fechaFin: string;
  submittedIds: Set<number>;
}) {
  const entregada = submittedIds.has(idActividad);
  const vencida = isVencida(fechaFin);

  if (entregada) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
        <span className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" />
        Entregada
      </span>
    );
  }
  if (vencida) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
        No entregada
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
      <span className="h-2.5 w-2.5 rounded-full bg-slate-300 shrink-0" />
      Pendiente
    </span>
  );
}

export default function ActividadesEstudiantePage() {
  const [parcialActivo, setParcialActivo] = useState(1);
  const [idMateriaActiva, setIdMateriaActiva] = useState<number | null>(null);
  const qc = useQueryClient();
  const { toasts, show, remove } = useToast();
  const uploadModal = useModal<Actividad>();

  // 1. Matrícula activa → idCurso + materias
  const { data: miMatricula, isLoading: loadingMatricula } = useQuery({
    queryKey: ['mi-matricula'],
    queryFn: () => matriculasService.getMiMatricula(),
  });

  const materias = miMatricula?.curso?.materias?.map((m) => m.materia) ?? [];
  const idMateria = idMateriaActiva ?? materias[0]?.idMateria ?? null;
  const idCurso = miMatricula?.idCurso ?? null;

  // 2. Parciales del curso+materia seleccionados
  const { data: parciales } = useQuery({
    queryKey: ['parciales', idCurso, idMateria],
    queryFn: () => parcialesService.getAll(idCurso!, idMateria!),
    enabled: !!idCurso && !!idMateria,
  });

  const parcialId = parciales?.find((p) => p.numeroParcial === parcialActivo)?.idParcial;

  // 3. Actividades del parcial seleccionado
  const { data: actividades, isLoading: loadingActividades } = useQuery({
    queryKey: ['actividades-estudiante', parcialId],
    queryFn: () => actividadesService.getAll(parcialId!),
    enabled: !!parcialId,
  });

  // 4. Mis entregas (todas, sin filtro) para pintar los indicadores
  const { data: misEvidencias } = useQuery({
    queryKey: ['mis-evidencias'],
    queryFn: () => evidenciasService.getMisEvidencias(),
    enabled: !!miMatricula,
  });

  // Set de idActividad con evidencia entregada (estado ACTIVO)
  const submittedIds = new Set<number>(
    misEvidencias?.filter((e) => e.estado === 'ACTIVO').map((e) => e.idActividad) ?? [],
  );

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => evidenciasService.upload(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evidencias'] });
      qc.invalidateQueries({ queryKey: ['mis-evidencias'] });
      uploadModal.close();
      show('Evidencia subida correctamente');
    },
    onError: () => show('Error al subir la evidencia', 'error'),
  });

  if (loadingMatricula) return <Spinner />;

  if (!miMatricula) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-sm text-amber-700">
        <p className="font-semibold mb-1">No estás matriculado en ningún curso activo</p>
        <p>Consulta con el administrador para que te asigne a un curso del año lectivo actual.</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <AcademicCapIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Actividades</h1>
            <p className="text-sm text-slate-500">
              {miMatricula.curso.nombreCurso} ·{' '}
              {miMatricula.curso.anioLectivo.fechaInicio.slice(0, 4)}–
              {miMatricula.curso.anioLectivo.fechaFinal.slice(0, 4)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de materia */}
      {materias.length > 1 && (
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {materias.map((m) => (
            <button
              key={m.idMateria}
              onClick={() => { setIdMateriaActiva(m.idMateria); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                idMateria === m.idMateria
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpenIcon className="h-3.5 w-3.5" />
              {m.nombreMateria}
            </button>
          ))}
        </div>
      )}

      {materias.length === 1 && (
        <div className="flex items-center gap-1.5 mb-4 text-sm text-slate-600">
          <BookOpenIcon className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{materias[0].nombreMateria}</span>
        </div>
      )}

      {/* Tabs de parcial */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            onClick={() => setParcialActivo(n)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              parcialActivo === n ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Parcial {n}
          </button>
        ))}
      </div>

      {/* Sin parcial creado */}
      {!parcialId && !loadingActividades && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-sm text-slate-500">
          El profesor aún no ha creado el Parcial {parcialActivo} para esta materia.
        </div>
      )}

      {/* Tabla de actividades */}
      {parcialId && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loadingActividades ? (
            <Spinner />
          ) : !actividades?.length ? (
            <EmptyState message="No hay actividades publicadas en este parcial" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actividad</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Entrega</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actividades.map((a) => {
                  const vencida = isVencida(a.fechaFinEntrega);
                  const entregada = submittedIds.has(a.idActividad);
                  return (
                    <tr key={a.idActividad} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-800">
                          {a.tituloActividad ?? `Actividad #${a.idActividad}`}
                        </p>
                        {a.descripcion && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.descripcion}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge label={a.tipoActividad} variant={TIPO_COLORS[a.tipoActividad] ?? 'gray'} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {fmt(a.fechaInicioEntrega)} → {fmt(a.fechaFinEntrega)}
                      </td>
                      <td className="px-5 py-3.5">
                        <EntregaIndicador
                          idActividad={a.idActividad}
                          fechaFin={a.fechaFinEntrega}
                          submittedIds={submittedIds}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          {entregada ? (
                            // Ya entregó — botón para reemplazar
                            <button
                              onClick={() => uploadModal.open(a)}
                              className="flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-800 transition"
                              title="Reemplazar PDF entregado"
                            >
                              <DocumentArrowUpIcon className="h-4 w-4" />
                              Reemplazar
                            </button>
                          ) : vencida ? (
                            // Sin entregar y vencida — bloqueado
                            <span className="text-xs text-slate-300 cursor-not-allowed">
                              Plazo cerrado
                            </span>
                          ) : (
                            // Sin entregar, en plazo — botón activo
                            <button
                              onClick={() => uploadModal.open(a)}
                              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                              title="Subir evidencia PDF"
                            >
                              <DocumentArrowUpIcon className="h-4 w-4" />
                              Subir PDF
                            </button>
                          )}
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

      {/* Leyenda */}
      {parcialId && actividades && actividades.length > 0 && (
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Entregada</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /> Pendiente</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> No entregada</span>
        </div>
      )}

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
