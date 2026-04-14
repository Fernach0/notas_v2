'use client';

import { useRef, useState } from 'react';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

interface Props {
  idActividad: number;
  nombreActividad: string;
  tipoActividad: string;
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading: boolean;
}

const MAX_MB = 10;

export default function EvidenciaUploadForm({ idActividad, nombreActividad, tipoActividad, onSubmit, isLoading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Solo se aceptan archivos PDF.'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setError(`El archivo supera los ${MAX_MB} MB.`); return; }
    setArchivo(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) { setError('Selecciona un archivo PDF.'); return; }
    const fd = new FormData();
    fd.append('file', archivo);
    fd.append('idActividad', String(idActividad));
    fd.append('nombreActividad', nombreActividad);
    fd.append('tipoActividad', tipoActividad);
    await onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
      >
        <DocumentArrowUpIcon className="h-10 w-10 text-slate-400 mb-2" />
        {archivo ? (
          <>
            <p className="text-sm font-medium text-slate-700">{archivo.name}</p>
            <p className="text-xs text-slate-400">{(archivo.size / 1024).toFixed(1)} KB</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-600">Haz clic para seleccionar un PDF</p>
            <p className="text-xs text-slate-400">Máximo {MAX_MB} MB</p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={isLoading || !archivo} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
          {isLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          Subir evidencia
        </button>
      </div>
    </form>
  );
}
