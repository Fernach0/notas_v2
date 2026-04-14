'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  HomeIcon, UsersIcon, AcademicCapIcon, BookOpenIcon,
  CalendarDaysIcon, ClipboardDocumentListIcon, DocumentArrowUpIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  label: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin', Icon: HomeIcon },
  { label: 'Usuarios', href: '/admin/usuarios', Icon: UsersIcon },
  { label: 'Años Lectivos', href: '/admin/anios-lectivos', Icon: CalendarDaysIcon },
  { label: 'Cursos', href: '/admin/cursos', Icon: AcademicCapIcon },
  { label: 'Materias', href: '/admin/materias', Icon: BookOpenIcon },
];

const profesorNav: NavItem[] = [
  { label: 'Dashboard', href: '/profesor', Icon: HomeIcon },
  { label: 'Mis Cursos', href: '/profesor/mis-cursos', Icon: AcademicCapIcon },
  { label: 'Actividades', href: '/profesor/actividades', Icon: ClipboardDocumentListIcon },
  { label: 'Calificaciones', href: '/profesor/calificaciones', Icon: ChartBarIcon },
];

const estudianteNav: NavItem[] = [
  { label: 'Dashboard', href: '/estudiante', Icon: HomeIcon },
  { label: 'Mis Materias', href: '/estudiante/mis-materias', Icon: BookOpenIcon },
  { label: 'Actividades', href: '/estudiante/actividades', Icon: ClipboardDocumentListIcon },
  { label: 'Evidencias', href: '/estudiante/evidencias', Icon: DocumentArrowUpIcon },
];

interface SidebarProps {
  roles: number[];
}

export default function Sidebar({ roles }: SidebarProps) {
  const pathname = usePathname();

  const navItems = roles.includes(1)
    ? adminNav
    : roles.includes(2)
    ? profesorNav
    : estudianteNav;

  const roleLabel = roles.includes(1)
    ? { label: 'Administrador', color: 'bg-purple-100 text-purple-700' }
    : roles.includes(2)
    ? { label: 'Profesor', color: 'bg-blue-100 text-blue-700' }
    : { label: 'Estudiante', color: 'bg-green-100 text-green-700' };

  return (
    <aside className="flex flex-col w-56 shrink-0 h-full bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
          <AcademicCapIcon className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-slate-800 text-sm">Proyecto Notas</span>
      </div>

      {/* Rol badge */}
      <div className="px-5 py-3">
        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${roleLabel.color}`}>
          {roleLabel.label}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5">
        {navItems.map(({ label, href, Icon }) => {
          const isActive = pathname === href || (href !== '/admin' && href !== '/profesor' && href !== '/estudiante' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className={clsx('h-4.5 w-4.5', isActive ? 'text-blue-600' : 'text-slate-400')} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
