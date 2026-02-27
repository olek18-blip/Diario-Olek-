import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notificaciones no soportadas",
        description: "Tu navegador no soporta notificaciones push.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "¡Notificaciones activadas!",
          description: "Te avisaremos de tus eventos próximos.",
        });
        return true;
      } else {
        toast({
          title: "Notificaciones bloqueadas",
          description: "Puedes habilitarlas en la configuración del navegador.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [toast]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [permission]);

  const scheduleEventReminder = useCallback((eventTitle: string, eventDate: Date, reminderMinutes: number = 60) => {
    const now = new Date();
    const timeDiff = eventDate.getTime() - now.getTime();
    
    const reminderTime = timeDiff - (reminderMinutes * 60 * 1000);
    
    if (reminderTime > 0) {
      const label = reminderMinutes >= 1440 
        ? `${Math.floor(reminderMinutes / 1440)} día(s)`
        : reminderMinutes >= 60 
          ? `${Math.floor(reminderMinutes / 60)} hora(s)`
          : `${reminderMinutes} minutos`;
      
      setTimeout(() => {
        sendNotification(`📅 Recordatorio: ${eventTitle}`, {
          body: `Tu evento es en ${label}`,
          tag: `event-${eventTitle}`,
        });
      }, reminderTime);
    }
  }, [sendNotification]);

  return {
    permission,
    isSupported: 'Notification' in window,
    requestPermission,
    sendNotification,
    scheduleEventReminder,
  };
};
