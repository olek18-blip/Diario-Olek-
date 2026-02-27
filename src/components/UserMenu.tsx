import { useState } from 'react';
import { User, LogOut, Crown, Trophy, Settings, HelpCircle, Sparkles, FileText, Volume2, Palette, ShieldOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const premiumFeatures = [
  { icon: Volume2, label: 'Lectura en voz alta (TTS)', description: 'Escucha tus entradas narradas' },
  { icon: Palette, label: 'Personalización de voz', description: 'Elige entre diferentes voces' },
  { icon: Sparkles, label: 'Asistente IA avanzado', description: 'Preguntas ilimitadas a tu diario' },
  { icon: FileText, label: 'Exportar diario', description: 'Descarga en PDF o texto' },
  { icon: ShieldOff, label: 'Sin anuncios', description: 'Experiencia limpia sin interrupciones' },
];

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { isPremium, upgrade, manage, plan } = usePremium();
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const userName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Usuario';

  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleUpdateName = async () => {
    if (!displayName.trim()) return;
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    });
    if (error) {
      toast.error('Error al actualizar el nombre');
    } else {
      toast.success('Nombre actualizado');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 z-[60] bg-popover border border-border shadow-lg">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              {isPremium && (
                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                  <Crown className="w-3 h-3" /> Premium
                </span>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setPremiumOpen(true)} className="gap-2 cursor-pointer">
            <Crown className="w-4 h-4" />
            {isPremium ? 'Gestionar suscripción' : 'Mejorar a Premium'}
          </DropdownMenuItem>

          <DropdownMenuItem className="gap-2 cursor-pointer" disabled>
            <Trophy className="w-4 h-4" />
            Logros
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => {
            setDisplayName(userName);
            setSettingsOpen(true);
          }} className="gap-2 cursor-pointer">
            <Settings className="w-4 h-4" />
            Ajustes
          </DropdownMenuItem>

          <DropdownMenuItem className="gap-2 cursor-pointer" disabled>
            <HelpCircle className="w-4 h-4" />
            Ayuda
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => signOut()} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Premium Dialog */}
      <Dialog open={premiumOpen} onOpenChange={setPremiumOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <Crown className="w-5 h-5 text-primary" />
              {isPremium ? 'Tu suscripción Premium' : 'Mejora a Premium'}
            </DialogTitle>
            <DialogDescription>
              {isPremium
                ? 'Estás disfrutando de todas las funciones premium.'
                : 'Desbloquea todas las funciones de tu diario.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {premiumFeatures.map((feature) => (
              <div key={feature.label} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <feature.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{feature.label}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {isPremium ? (
            <Button onClick={() => { manage(); setPremiumOpen(false); }} className="w-full">
              Gestionar suscripción
            </Button>
          ) : (
            <div className="space-y-3">
              <Button onClick={() => { upgrade(); setPremiumOpen(false); }} className="w-full bg-gradient-warm text-primary-foreground">
                <Sparkles className="w-4 h-4 mr-2" />
                Suscribirse — Próximamente
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Los pagos estarán disponibles pronto vía Stripe.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <Settings className="w-5 h-5 text-muted-foreground" />
              Ajustes
            </DialogTitle>
            <DialogDescription>
              Personaliza tu experiencia en Mi Diario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Display name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre para mostrar</label>
              <div className="flex gap-2">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Tu nombre"
                />
                <Button size="sm" onClick={handleUpdateName}>
                  Guardar
                </Button>
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Correo electrónico</label>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                {user?.email}
              </p>
            </div>

            {/* Notifications toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Notificaciones</p>
                <p className="text-xs text-muted-foreground">Recibe recordatorios diarios</p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>

            {/* Plan info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <div>
                <p className="text-sm font-medium">Plan actual</p>
                <p className="text-xs text-muted-foreground capitalize">{plan}</p>
              </div>
              {!isPremium && (
                <Button size="sm" variant="outline" onClick={() => { setSettingsOpen(false); setPremiumOpen(true); }}>
                  <Crown className="w-3 h-3 mr-1" /> Mejorar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
