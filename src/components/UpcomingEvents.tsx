import { useState } from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Calendar, Settings2, Check } from 'lucide-react';
import { DiaryEvent } from '@/hooks/useDiaryStore';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface UpcomingEventsProps {
  events: DiaryEvent[];
}

const REMINDER_OPTIONS = [
  { value: '60', label: '1 hora antes' },
  { value: '1440', label: '1 día antes' },
  { value: 'custom', label: 'Personalizar' },
];

export const UpcomingEvents = ({ events }: UpcomingEventsProps) => {
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [reminderValue, setReminderValue] = useState('60');
  const [customMinutes, setCustomMinutes] = useState('');

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, "d 'de' MMMM", { locale: es });
  };

  const getReminderLabel = (minutes: number) => {
    if (minutes === 60) return '1h antes';
    if (minutes === 1440) return '1 día antes';
    if (minutes < 60) return `${minutes} min antes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h antes`;
    return `${hours}h ${mins}min antes`;
  };

  const handleSaveReminder = async (eventId: string) => {
    const minutes = reminderValue === 'custom' ? parseInt(customMinutes) : parseInt(reminderValue);
    if (isNaN(minutes) || minutes <= 0) {
      toast({ title: "Error", description: "Introduce un tiempo válido", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('diary_events')
      .update({ reminder_minutes: minutes } as any)
      .eq('id', eventId);

    if (error) {
      console.error('Error updating reminder:', error);
      toast({ title: "Error", description: "No se pudo actualizar el recordatorio", variant: "destructive" });
    } else {
      toast({ title: "✅ Recordatorio actualizado", description: getReminderLabel(minutes) });
      setEditingEvent(null);
    }
  };

  const openReminderEditor = (event: DiaryEvent) => {
    const mins = (event as any).reminder_minutes || 60;
    if (mins === 60 || mins === 1440) {
      setReminderValue(String(mins));
    } else {
      setReminderValue('custom');
      setCustomMinutes(String(mins));
    }
    setEditingEvent(event.id);
  };

  if (events.length === 0) {
    return (
      <div className="glass-card p-5 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-serif text-lg font-medium">Próximos eventos</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-6">
          No tienes eventos próximos.<br />
          ¡Cuéntame qué tienes pendiente!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-primary" />
        <h3 className="font-serif text-lg font-medium">Próximos eventos</h3>
      </div>

      <div className="space-y-3">
        {events.map((event, i) => (
          <div
            key={event.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg bg-muted/50",
              "animate-slide-up"
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="p-2 rounded-lg bg-accent">
              <Calendar className="w-4 h-4 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{event.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatEventDate(event.event_date)}
              </p>
              {event.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {event.description}
                </p>
              )}
              <div className="flex items-center gap-1 mt-1.5">
                <Bell className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {getReminderLabel((event as any).reminder_minutes || 60)}
                </span>
              </div>
            </div>
            <Popover open={editingEvent === event.id} onOpenChange={(open) => {
              if (open) openReminderEditor(event);
              else setEditingEvent(null);
            }}>
              <PopoverTrigger asChild>
                <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
                  <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="end">
                <h4 className="text-sm font-medium mb-3">Recordatorio</h4>
                <RadioGroup value={reminderValue} onValueChange={setReminderValue} className="space-y-2">
                  {REMINDER_OPTIONS.map(opt => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.value} id={`r-${event.id}-${opt.value}`} />
                      <Label htmlFor={`r-${event.id}-${opt.value}`} className="text-sm">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {reminderValue === 'custom' && (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      placeholder="Minutos"
                      className="h-8 text-sm"
                      min={1}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">min antes</span>
                  </div>
                )}
                <Button size="sm" className="w-full mt-3" onClick={() => handleSaveReminder(event.id)}>
                  <Check className="w-3.5 h-3.5 mr-1" /> Guardar
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        ))}
      </div>
    </div>
  );
};
