import { Save, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  variant?: 'success' | 'error';
  onDismiss?: () => void;
  visible?: boolean;
}

export function Toast({ message, variant = 'success', visible = true }: ToastProps) {
  if (!message) return null;

  const isError = variant === 'error';
  const bgColor = isError ? 'bg-red-500' : 'bg-green-500';
  const Icon = isError ? AlertCircle : Save;

  return (
    <div
      className={`fixed top-20 right-6 z-[100] transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      <div className={`flex items-center gap-2 px-4 py-3 ${bgColor} text-white rounded-lg shadow-lg`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
