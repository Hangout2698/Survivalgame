import { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface NotificationProps {
  message: string;
  type?: 'success' | 'warning' | 'info' | 'danger';
  onDismiss: () => void;
  autoHideDuration?: number;
}

export function Notification({
  message,
  type = 'info',
  onDismiss,
  autoHideDuration = 4000
}: NotificationProps) {
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onDismiss]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-900/90',
      borderColor: 'border-green-700',
      textColor: 'text-green-200',
      iconColor: 'text-green-400'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-900/90',
      borderColor: 'border-yellow-700',
      textColor: 'text-yellow-200',
      iconColor: 'text-yellow-400'
    },
    danger: {
      icon: AlertTriangle,
      bgColor: 'bg-red-900/90',
      borderColor: 'border-red-700',
      textColor: 'text-red-200',
      iconColor: 'text-red-400'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-900/90',
      borderColor: 'border-blue-700',
      textColor: 'text-blue-200',
      iconColor: 'text-blue-400'
    }
  };

  const style = config[type];
  const Icon = style.icon;

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50
        ${style.bgColor} ${style.borderColor} border-2 rounded-lg shadow-2xl
        px-6 py-4 flex items-center gap-3 min-w-[320px] max-w-[600px]
        animate-in slide-in-from-top duration-300`}
    >
      <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0`} />
      <p className={`${style.textColor} flex-1 font-medium`}>{message}</p>
      <button
        onClick={onDismiss}
        className={`${style.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
