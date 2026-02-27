import { Crown } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Small badge/button shown in the header.
 * Shows "Premium" if subscribed, or "Upgrade" if free.
 */
export const PremiumBadge = () => {
  const { isPremium, upgrade, manage } = usePremium();

  return (
    <Button
      variant={isPremium ? 'outline' : 'default'}
      size="sm"
      onClick={isPremium ? manage : upgrade}
      className={cn(
        'gap-1.5 text-xs h-8',
        isPremium && 'border-primary/30 text-primary'
      )}
    >
      <Crown className="w-3.5 h-3.5" />
      {isPremium ? 'Premium' : 'Mejorar'}
    </Button>
  );
};
