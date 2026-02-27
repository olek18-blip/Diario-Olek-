import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Pause, Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface VoiceRecorderProps {
  onRecordingComplete: (transcript: string, duration: number) => void;
  isProcessing?: boolean;
}

export const VoiceRecorder = ({ onRecordingComplete, isProcessing }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(12).fill(0.3));
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Timer and visual effects
  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setDuration(d => d + 1);
        
        // Update audio levels from analyser if available
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const levels = Array(12).fill(0).map((_, i) => {
            const start = Math.floor(i * dataArray.length / 12);
            const end = Math.floor((i + 1) * dataArray.length / 12);
            let sum = 0;
            for (let j = start; j < end; j++) {
              sum += dataArray[j];
            }
            return Math.max(0.2, (sum / (end - start)) / 255);
          });
          setAudioLevels(levels);
        } else {
          setAudioLevels(prev => prev.map(() => 0.2 + Math.random() * 0.8));
        }
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const formatDuration = (tenths: number) => {
    const totalSeconds = Math.floor(tenths / 10);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Set up audio analyser for visualizations
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Determine best supported format
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      const options: MediaRecorderOptions = selectedMimeType ? { mimeType: selectedMimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      
      console.log('Recording started with format:', selectedMimeType || 'default');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);

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

  const handleStopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !streamRef.current) return;

    setIsRecording(false);
    setIsPaused(false);
    setIsTranscribing(true);

    const finalDuration = duration / 10;

    // Stop the media recorder
    mediaRecorderRef.current.stop();
    streamRef.current.getTracks().forEach(track => track.stop());

    // Wait for the last data chunk
    await new Promise<void>((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => resolve();
      } else {
        resolve();
      }
    });

    // Create the audio blob
    const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
    
    console.log('Recording stopped, blob size:', audioBlob.size, 'type:', mimeType);

    try {
      const transcript = await transcribeAudio(audioBlob);
      onRecordingComplete(transcript || 'No se pudo transcribir el audio.', finalDuration);
    } catch (error) {
      console.error('Transcription error:', error);
      onRecordingComplete('Error al transcribir el audio. Por favor, intenta de nuevo.', finalDuration);
    } finally {
      setIsTranscribing(false);
      setDuration(0);
      audioChunksRef.current = [];
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  }, [duration, onRecordingComplete, transcribeAudio]);

  const handlePauseResume = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  const isLoading = isProcessing || isTranscribing;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Waveform visualization */}
      <div className="flex items-center justify-center gap-1 h-24">
        {audioLevels.map((level, i) => (
          <div
            key={i}
            className={cn(
              "w-2 rounded-full transition-all duration-100",
              isRecording && !isPaused ? "bg-primary" : "bg-muted-foreground/30"
            )}
            style={{
              height: `${isRecording && !isPaused ? level * 100 : 30}%`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>

      {/* Duration display */}
      <div className="text-4xl font-light tracking-wider text-foreground/80 font-mono">
        {formatDuration(duration)}
      </div>

      {/* Recording controls */}
      <div className="flex items-center gap-6">
        {isRecording && (
          <button
            onClick={handlePauseResume}
            className="p-4 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            disabled={isLoading}
          >
            {isPaused ? (
              <Play className="w-6 h-6 text-foreground" />
            ) : (
              <Pause className="w-6 h-6 text-foreground" />
            )}
          </button>
        )}

        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isLoading}
          className={cn(
            "relative p-6 rounded-full transition-all duration-300",
            isRecording
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-gradient-warm hover:scale-105",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isRecording && !isPaused && (
            <div className="absolute inset-0 rounded-full bg-destructive/30 recording-pulse" />
          )}
          {isLoading ? (
            <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
          ) : isRecording ? (
            <Square className="w-8 h-8 text-primary-foreground fill-current" />
          ) : (
            <Mic className="w-8 h-8 text-primary-foreground" />
          )}
        </button>

        {isRecording && <div className="w-14" />}
      </div>

      {/* Status text */}
      <p className="text-sm text-muted-foreground text-center">
        {isTranscribing
          ? "Transcribiendo con IA..."
          : isProcessing
          ? "Analizando tu nota..."
          : isRecording
          ? isPaused
            ? "En pausa"
            : "Grabando... habla naturalmente"
          : "Toca para grabar tu día"}
      </p>
    </div>
  );
};
