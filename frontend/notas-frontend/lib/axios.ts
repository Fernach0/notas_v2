import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar JWT en cada request automáticamente
api.interceptors.request.use(async (config) => {
  try {
    const session = await getSession();
    if (session?.user?.accessToken) {
      config.headers.Authorization = `Bearer ${session.user.accessToken}`;
    }
  } catch {
    // Si no se puede obtener la sesión, el request continúa sin auth
    // El interceptor de 401 se encargará de redirigir
  }
  return config;
});

// Manejar 401: redirigir al login cuando el token expiró
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      globalThis.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
