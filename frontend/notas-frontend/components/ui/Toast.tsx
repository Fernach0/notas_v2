'use client';

import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

const styles = {
  success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', Icon: CheckCircleIcon, iconColor: 'text-green-500' },
  error: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', Icon: XCircleIcon, iconColor: 'text-red-500' },
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', Icon: InformationCircleIcon, iconColor: 'text-blue-500' },
};

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const s = styles[toast.type];
        return (
          <div key={toast.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${s.bg} min-w-64 max-w-sm`}>
            <s.Icon className={`h-5 w-5 mt-0.5 shrink-0 ${s.iconColor}`} />
            <p className={`text-sm font-medium flex-1 ${s.text}`}>{toast.message}</p>
            <button onClick={() => onRemove(toast.id)} className="text-slate-400 hover:text-slate-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
