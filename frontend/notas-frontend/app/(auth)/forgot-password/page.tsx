'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';

const schema = z.object({
  email: z.string().email('Ingresa un email válido'),
});
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch {
      setError('Ocurrió un error. Inténtalo de nuevo.');
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
          {sent ? (
            /* Estado: email enviado */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Revisa tu correo</h2>
              <p className="text-sm text-slate-500 mb-6">
                Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
                El enlace es válido por <strong>1 hora</strong>.
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            /* Formulario */
            <>
              <h2 className="text-lg font-semibold text-slate-700 mb-2">Recuperar contraseña</h2>
              <p className="text-sm text-slate-500 mb-6">
                Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="usuario@notas.edu.ec"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-slate-500 hover:text-slate-700 transition"
                  >
                    ← Volver al inicio de sesión
                  </Link>
                </div>
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
