'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';

const schema = z.object({
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
});
type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get('token');

  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Enlace inválido</h2>
          <p className="text-sm text-slate-500 mb-6">Este enlace de recuperación no es válido o ya fue utilizado.</p>
          <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: Form) => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
      setDone(true);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      if (msg === 'Token expirado') {
        setError('El enlace expiró. Solicita uno nuevo.');
      } else if (msg === 'Token inválido') {
        setError('El enlace no es válido. Solicita uno nuevo.');
      } else {
        setError('Ocurrió un error. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Proyecto Notas</h1>
          <p className="text-slate-500 text-sm mt-1">Sistema de gestión académica</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {done ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">¡Contraseña actualizada!</h2>
              <p className="text-sm text-slate-500 mb-6">
                Tu contraseña fue cambiada correctamente. Ya puedes iniciar sesión.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-700 mb-2">Nueva contraseña</h2>
              <p className="text-sm text-slate-500 mb-6">
                Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nueva contraseña
                  </label>
                  <input
                    {...register('newPassword')}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  {errors.newPassword && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <input
                    {...register('confirm')}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  {errors.confirm && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.confirm.message}</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}{' '}
                    {(error.includes('expiró') || error.includes('válido')) && (
                      <Link href="/forgot-password" className="font-medium underline hover:text-red-800">
                        Solicitar nuevo enlace
                      </Link>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Sistema académico Ecuador © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
