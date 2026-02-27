import { useState, useEffect, useCallback } from 'react';
import { Sparkles, X, Lightbulb, Heart, Star, Coffee, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

const prompts = [
  { icon: Sparkles, text: "¿Qué fue lo mejor de hoy?", color: "text-amber-500" },
  { icon: Heart, text: "¿Por qué estás agradecido/a hoy?", color: "text-rose-500" },
  { icon: Lightbulb, text: "¿Qué aprendiste hoy?", color: "text-yellow-500" },
  { icon: Star, text: "¿Cuál es tu objetivo para mañana?", color: "text-purple-500" },
  { icon: Coffee, text: "¿Cómo empezaste el día?", color: "text-orange-500" },
  { icon: Sun, text: "¿Qué te hizo sonreír hoy?", color: "text-amber-400" },
  { icon: Moon, text: "¿Cómo te sientes ahora?", color: "text-indigo-500" },
  { icon: Sparkles, text: "¿Qué conversación importante tuviste?", color: "text-emerald-500" },
  { icon: Heart, text: "¿A quién viste hoy?", color: "text-pink-500" },
  { icon: Lightbulb, text: "¿Qué decisión tomaste?", color: "text-cyan-500" },
];

interface EngagementPromptProps {
  onPromptClick?: (prompt: string) => void;
}

export const EngagementPrompt = ({ onPromptClick }: EngagementPromptProps) => {
  const [currentPrompt, setCurrentPrompt] = useState(() => 
    prompts[Math.floor(Math.random() * prompts.length)]
  );
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const rotatePrompt = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      const newIndex = Math.floor(Math.random() * prompts.length);
      setCurrentPrompt(prompts[newIndex]);
      setIsAnimating(false);
    }, 200);
  }, []);

  useEffect(() => {
    const interval = setInterval(rotatePrompt, 15000);
    return () => clearInterval(interval);
  }, [rotatePrompt]);

  if (!isVisible) return null;

  const IconComponent = currentPrompt.icon;

  return (
    <div 
      className={cn(
        "relative p-4 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/10 border border-primary/10 cursor-pointer group transition-all duration-300 hover:shadow-md",
        isAnimating && "opacity-0 scale-95"
      )}
      onClick={() => onPromptClick?.(currentPrompt.text)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
        }}
        className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
      
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-xl bg-background/50", currentPrompt.color)}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">Idea para grabar</p>
          <p className="text-sm font-medium text-foreground">
            {currentPrompt.text}
          </p>
        </div>
      </div>

      <div className="flex gap-1 mt-3 justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-colors",
              i === prompts.indexOf(currentPrompt) % 3 
                ? "bg-primary" 
                : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    </div>
  );
};
