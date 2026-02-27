import { type PremiumFeature, usePremium } from '@/hooks/usePremium';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  /** What to show when locked. Defaults to a small upgrade prompt. */
  fallback?: React.ReactNode;
}

/**
 * Wraps premium-only UI. Shows children if user has access,
 * otherwise shows an upgrade prompt.
 */
export const PremiumGate = ({ feature, children, fallback }: PremiumGateProps) => {
  const { hasFeature, upgrade } = usePremium();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 px-4 rounded-xl border border-border/50 bg-muted/30 text-center">
      <div className="p-2 rounded-full bg-primary/10">
        <Crown className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Función Premium</p>
        <p className="text-xs text-muted-foreground mt-1">
          Desbloquea esta función con la suscripción premium
        </p>
      </div>
      <Button size="sm" onClick={upgrade} className="gap-1.5">
        <Crown className="w-3.5 h-3.5" />
        Mejorar a Premium
      </Button>
    </div>
  );
};
