import { auth } from '@/auth';
import { UsersIcon, AcademicCapIcon, BookOpenIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

export default async function AdminDashboard() {
  const session = await auth();

  const stats = [
    { label: 'Usuarios', Icon: UsersIcon, color: 'bg-blue-500', href: '/admin/usuarios' },
    { label: 'Años Lectivos', Icon: CalendarDaysIcon, color: 'bg-purple-500', href: '/admin/anios-lectivos' },
    { label: 'Cursos', Icon: AcademicCapIcon, color: 'bg-green-500', href: '/admin/cursos' },
    { label: 'Materias', Icon: BookOpenIcon, color: 'bg-orange-500', href: '/admin/materias' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-1">Panel de Administración</h1>
      <p className="text-sm text-slate-500 mb-6">Gestiona todos los recursos del sistema académico.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, Icon, color, href }) => (
          <a key={href} href={href} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition flex items-center gap-4">
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{label}</p>
              <p className="text-xs text-slate-400">Gestionar</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
