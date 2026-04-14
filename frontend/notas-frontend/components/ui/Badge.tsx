interface BadgeProps {
  label: string;
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
}

const variants = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-slate-100 text-slate-600',
};

export default function Badge({ label, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}

// Helpers para mapear valores del backend a variantes
export function estadoUsuarioBadge(estado: string) {
  const map: Record<string, 'green' | 'red' | 'yellow'> = {
    ACTIVO: 'green', INACTIVO: 'yellow', BLOQUEADO: 'red',
  };
  return map[estado] ?? 'gray';
}

export function estadoLectivoBadge(estado: string) {
  const map: Record<string, 'green' | 'blue' | 'gray'> = {
    ACTIVO: 'green', PLANIFICADO: 'blue', FINALIZADO: 'gray',
  };
  return map[estado] ?? 'gray';
}
