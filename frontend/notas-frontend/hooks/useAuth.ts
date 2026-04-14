'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  const roles = session?.user?.roles ?? [];
  const isAdmin = roles.includes(1);
  const isProfesor = roles.includes(2);
  const isEstudiante = roles.includes(3);

  const logout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const redirectToRoleHome = () => {
    if (isAdmin) router.push('/admin');
    else if (isProfesor) router.push('/profesor');
    else if (isEstudiante) router.push('/estudiante');
    else router.push('/login');
  };

  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    user: session?.user,
    roles,
    isAdmin,
    isProfesor,
    isEstudiante,
    logout,
    redirectToRoleHome,
  };
}
