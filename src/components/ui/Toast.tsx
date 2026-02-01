import { Save, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  variant?: 'success' | 'error';
  onDismiss?: () => void;
}

export function Toast({ message, variant = 'success' }: ToastProps) {
  if (!message) return null;

  const isError = variant === 'error';
  const bgColor = isError ? 'bg-red-500' : 'bg-green-500';
  const Icon = isError ? AlertCircle : Save;

  return (
    <div className="fixed top-20 right-6 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className={`flex items-center gap-2 px-4 py-3 ${bgColor} text-white rounded-lg shadow-lg`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
