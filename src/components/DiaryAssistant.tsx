import { useState, useRef, useCallback } from 'react';
import { MessageCircle, Send, Loader2, Sparkles, Mic, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const DiaryAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en la transcripción');
    }

    const data = await response.json();
    return data.transcript;
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
      let selectedMimeType = '';
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) { selectedMimeType = mt; break; }
      }

      const recorder = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : {});
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error('Mic error:', error);
      toast({ title: "Error", description: "No se pudo acceder al micrófono", variant: "destructive" });
    }
  }, [toast]);

  const handleStopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !streamRef.current) return;
    setIsRecording(false);
    setIsTranscribing(true);

    mediaRecorderRef.current.stop();
    streamRef.current.getTracks().forEach(t => t.stop());

    await new Promise<void>((resolve) => {
      if (mediaRecorderRef.current) mediaRecorderRef.current.onstop = () => resolve();
      else resolve();
    });

    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

    try {
      const transcript = await transcribeAudio(audioBlob);
      if (transcript) {
        setQuestion(transcript);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({ title: "Error", description: "No se pudo transcribir el audio", variant: "destructive" });
    } finally {
      setIsTranscribing(false);
      audioChunksRef.current = [];
    }
  }, [transcribeAudio, toast]);

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return;

    const userMessage = question.trim();
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ask-diary', {
        body: { question: userMessage },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error('Error asking diary:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo procesar tu pregunta",
        variant: "destructive",
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "¿Cuántos días trabajé el mes pasado?",
    "Resúmeme la semana pasada",
    "¿Qué eventos tengo próximamente?",
    "¿De qué hablé más este mes?",
  ];

  return (
    <div className="glass-card p-5 animate-fade-in">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-serif text-base font-medium text-foreground">
              Pregunta a tu diario
            </h3>
            <p className="text-xs text-muted-foreground">
              Escribe o habla tu pregunta
            </p>
          </div>
        </div>
        <MessageCircle className={cn(
          "w-5 h-5 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* Messages */}
          {messages.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-xl text-sm",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground ml-8"
                      : "bg-muted mr-8"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {isLoading && (
                <div className="bg-muted p-3 rounded-xl mr-8 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setQuestion(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input with voice */}
          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={isTranscribing ? "Transcribiendo..." : "Escribe o graba tu pregunta..."}
              className="min-h-[60px] resize-none"
              disabled={isTranscribing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isLoading || isTranscribing}
                size="icon"
                variant={isRecording ? "destructive" : "outline"}
                className="shrink-0"
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-4 h-4 fill-current" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!question.trim() || isLoading}
                size="icon"
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
