import { Save } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss?: () => void;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="fixed top-20 right-6 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#06B3C4] text-white rounded-lg shadow-lg">
        <Save className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
