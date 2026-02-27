import { Bell, BellOff, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const NotificationPrompt = () => {
  const { permission, isSupported, requestPermission } = useNotifications();
  const [dismissed, setDismissed] = useState(false);

  if (!isSupported || permission === 'granted' || dismissed) {
    return null;
  }

  return (
    <div className="glass-card p-4 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm text-foreground">
            Activa las notificaciones
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Te avisaremos de tus eventos y recordatorios importantes.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="bg-gradient-warm hover:opacity-90"
              onClick={requestPermission}
            >
              Activar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              Ahora no
            </Button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
