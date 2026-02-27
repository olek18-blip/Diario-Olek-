import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Play, Clock, Calendar, Sparkles, Volume2, Square } from 'lucide-react';
import { VoiceEntry } from '@/hooks/useDiaryStore';
import { cn } from '@/lib/utils';

interface EntryCardProps {
  entry: VoiceEntry;
  isSelected?: boolean;
  onClick: () => void;
  onPlay?: (text: string, id: string) => void;
  isPlaying?: boolean;
}

export const EntryCard = ({ entry, isSelected, onClick, onPlay, isPlaying }: EntryCardProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        isSelected
          ? "bg-primary/10 border-2 border-primary/30"
          : "bg-card border border-border/50 hover:border-primary/20"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Play button */}
        <div className={cn(
          "p-2.5 rounded-full shrink-0",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
          <Play className="w-4 h-4" fill={isSelected ? "currentColor" : "none"} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Time and duration */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(entry.created_at), "d MMM, HH:mm", { locale: es })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(entry.duration)}
            </span>
          </div>

          {/* Transcript preview */}
          <p className="text-sm text-foreground line-clamp-2 mb-2">
            {entry.transcript || 'Sin transcripción'}
          </p>

          {/* Summary tag and play button */}
          <div className="flex items-center justify-between">
            {entry.summary && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <Sparkles className="w-3 h-3" />
                <span className="line-clamp-1">{entry.summary}</span>
              </div>
            )}
            {onPlay && entry.transcript && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(entry.transcript!, entry.id);
                }}
                className={cn(
                  "p-1.5 rounded-full transition-colors shrink-0 ml-auto",
                  isPlaying
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                title={isPlaying ? "Detener lectura" : "Leer en voz alta"}
              >
                {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
