import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookOpen, Mic, Loader2, Clock, Volume2, Square } from 'lucide-react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { MiniCalendar } from '@/components/MiniCalendar';
import { EntryCard } from '@/components/EntryCard';
import { UpcomingEvents } from '@/components/UpcomingEvents';
import { DailySummary } from '@/components/DailySummary';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { AuthForm } from '@/components/AuthForm';
import { AchievementBadge } from '@/components/AchievementBadge';
import { DiaryAssistant } from '@/components/DiaryAssistant';
import { EngagementPrompt } from '@/components/EngagementPrompt';
import { InstallPrompt } from '@/components/InstallPrompt';
import { UserMenu } from '@/components/UserMenu';
import { BottomNav } from '@/components/BottomNav';
import { useDiaryStore } from '@/hooks/useDiaryStore';
import { useAuth } from '@/hooks/useAuth';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { cn } from '@/lib/utils';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeView, setActiveView] = useState<'record' | 'entries'>('record');
  const { user, loading: authLoading } = useAuth();
  const { play, stop, isPlaying } = useTextToSpeech();
  const { 
    entries, 
    isProcessing, 
    isLoading,
    addEntry, 
    getEntriesForDate, 
    getUpcomingEvents 
  } = useDiaryStore();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const selectedDateEntries = getEntriesForDate(selectedDate);
  const upcomingEvents = getUpcomingEvents();

  const handleRecordingComplete = async (transcript: string, duration: number) => {
    await addEntry(transcript, duration);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-warm rounded-xl">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-semibold text-foreground">Mi Diario</h1>
                <p className="text-xs text-muted-foreground capitalize">
                  {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>

            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar - Calendar and Events */}
          <aside className={cn(
            "lg:col-span-3 space-y-6",
            activeView === 'record' ? "hidden lg:block" : "block"
          )}>
            <NotificationPrompt />
            <DiaryAssistant />
            <MiniCalendar
              entries={entries}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <UpcomingEvents events={upcomingEvents} />
          </aside>

          {/* Center - Voice recorder */}
          <section className={cn(
            "lg:col-span-5",
            activeView === 'entries' && "hidden lg:block"
          )}>
            {/* Engagement prompt */}
            <div className="mb-6">
              <EngagementPrompt />
            </div>

            <div className="glass-card p-8 animate-scale-in">
              <div className="text-center mb-8">
                <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                  ¿Cómo fue tu día?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Cuéntame todo, guardaré tus memorias
                </p>
              </div>
              
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                isProcessing={isProcessing}
              />
            </div>

            {/* Daily summary below recorder */}
            <div className="mt-6">
              <DailySummary date={selectedDate} entries={selectedDateEntries} onPlay={play} isPlaying={isPlaying === 'summary'} />
            </div>

            {/* Today's transcribed entries below recorder */}
            {getEntriesForDate(new Date()).length > 0 && (
              <div className="mt-6 glass-card p-5 animate-fade-in">
                <h3 className="font-serif text-lg font-medium mb-4">
                  Lo que dijiste hoy
                </h3>
                <div className="space-y-4">
                  {getEntriesForDate(new Date()).map((entry, i) => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-xl bg-card border border-border/50 animate-slide-up"
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(entry.created_at), "HH:mm", { locale: es })}</span>
                          <span className="text-border">•</span>
                          <span>{Math.floor(entry.duration / 60)}:{(entry.duration % 60).toString().padStart(2, '0')} min</span>
                        </div>
                        {entry.transcript && (
                          <button
                            onClick={() => play(entry.transcript!, `today-${entry.id}`)}
                            className={cn(
                              "p-1.5 rounded-full transition-colors",
                              isPlaying === `today-${entry.id}`
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                            title={isPlaying === `today-${entry.id}` ? "Detener" : "Leer en voz alta"}
                          >
                            {isPlaying === `today-${entry.id}` ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {entry.transcript || 'Sin transcripción'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Right - Entries list */}
          <aside className={cn(
            "lg:col-span-4",
            activeView === 'record' ? "hidden lg:block" : "block"
          )}>
            <div className="glass-card p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-medium">
                  {selectedDate.toDateString() === new Date().toDateString()
                    ? 'Hoy'
                    : format(selectedDate, "d 'de' MMMM", { locale: es })}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {selectedDateEntries.length} entrada{selectedDateEntries.length !== 1 ? 's' : ''}
                </span>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : selectedDateEntries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Mic className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No hay notas para este día.<br />
                    ¡Graba tu primera entrada!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateEntries.map((entry, i) => (
                    <div
                      key={entry.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      <EntryCard
                        entry={entry}
                        onClick={() => {}}
                        onPlay={play}
                        isPlaying={isPlaying === entry.id}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Show recent entries if viewing today with no entries */}
              {selectedDateEntries.length === 0 && entries.length > 0 && !isLoading && (
                <div className="mt-8 pt-6 border-t border-border/50">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Entradas recientes
                  </h4>
                  <div className="space-y-3">
                    {entries.slice(0, 3).map((entry, i) => (
                      <div
                        key={entry.id}
                        className="animate-slide-up"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      >
                        <EntryCard
                          entry={entry}
                          onClick={() => setSelectedDate(new Date(entry.created_at))}
                          onPlay={play}
                          isPlaying={isPlaying === entry.id}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Bottom navigation - mobile */}
      <BottomNav activeView={activeView} onChangeView={setActiveView} />
      <div className="h-14 lg:hidden" /> {/* spacer for bottom nav */}
    </div>
  );
};

export default Index;
