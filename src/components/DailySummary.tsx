import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sparkles, TrendingUp, Volume2, Square } from 'lucide-react';
import { VoiceEntry } from '@/hooks/useDiaryStore';
import { cn } from '@/lib/utils';

interface DailySummaryProps {
  date: Date;
  entries: VoiceEntry[];
  onPlay?: (text: string, id: string) => void;
  isPlaying?: boolean;
}

export const DailySummary = ({ date, entries, onPlay, isPlaying }: DailySummaryProps) => {
  const totalDuration = entries.reduce((acc, entry) => acc + entry.duration, 0);
  
  const formatTotalDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 1) return `${seconds} seg`;
    return `${mins} min`;
  };

  // Generate a summary from entries
  const generateSummary = () => {
    if (entries.length === 0) {
      return "No hay entradas para este día. ¡Cuéntame cómo te fue!";
    }
    
    const summaries = entries
      .filter(e => e.summary)
      .map(e => e.summary)
      .join('. ');
    
    if (summaries) {
      return summaries;
    }
    
    return `${entries.length} nota${entries.length > 1 ? 's' : ''} grabada${entries.length > 1 ? 's' : ''} hoy.`;
  };

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-serif text-lg font-medium">
            Resumen del día
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onPlay && (
            <button
              onClick={() => onPlay(generateSummary(), 'summary')}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                isPlaying
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              title={isPlaying ? "Detener lectura" : "Leer resumen"}
            >
              {isPlaying ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
          <span className="text-sm text-muted-foreground capitalize">
            {format(date, "EEEE d", { locale: es })}
          </span>
        </div>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed mb-4">
        {generateSummary()}
      </p>

      <div className="flex items-center gap-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {entries.length} entrada{entries.length > 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {formatTotalDuration(totalDuration)} de audio
        </span>
      </div>
    </div>
  );
};
