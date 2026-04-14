import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function RootPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const roles = session.user?.roles ?? [];
  if (roles.includes(1)) redirect('/admin');
  if (roles.includes(2)) redirect('/profesor');
  if (roles.includes(3)) redirect('/estudiante');

  redirect('/login');
}
