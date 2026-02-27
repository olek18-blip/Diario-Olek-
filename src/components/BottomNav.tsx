import { Mic, BookOpen, Calendar, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeView: 'record' | 'entries';
  onChangeView: (view: 'record' | 'entries') => void;
}

export const BottomNav = ({ activeView, onChangeView }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden backdrop-blur-xl bg-background/90 border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        <button
          onClick={() => onChangeView('record')}
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors",
            activeView === 'record'
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <Mic className="w-5 h-5" />
          <span className="text-[10px] font-medium">Grabar</span>
        </button>
        <button
          onClick={() => onChangeView('entries')}
          className={cn(
            "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors",
            activeView === 'entries'
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium">Entradas</span>
        </button>
      </div>
    </nav>
  );
};
