import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsPlaying(null);
  }, []);

  const play = useCallback(async (text: string, id: string) => {
    if (isPlaying === id) { stop(); return; }
    stop();
    if (!('speechSynthesis' in window)) {
      toast({ title: 'No disponible', description: 'Tu navegador no soporta síntesis de voz.', variant: 'destructive' });
      return;
    }
    setIsPlaying(id);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; utterance.rate = 0.95; utterance.pitch = 1.0; utterance.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang === 'es-ES' && v.localService) || voices.find(v => v.lang.startsWith('es')) || voices[0];
    if (esVoice) utterance.voice = esVoice;
    utterance.onend = () => setIsPlaying(null);
    utterance.onerror = () => setIsPlaying(null);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isPlaying, stop, toast]);

  return { play, stop, isPlaying };
};
