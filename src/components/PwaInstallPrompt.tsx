import { useEffect, useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'herenciard:pwa-install-dismissed-at:v1';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const isStandaloneDisplay = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

const recentlyDismissed = () => {
  if (typeof window === 'undefined') return true;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const timestamp = Number(raw);
  return Number.isFinite(timestamp) && Date.now() - timestamp < DISMISS_COOLDOWN_MS;
};

const rememberDismissal = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
};

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneDisplay());
  const [dismissed, setDismissed] = useState(() => recentlyDismissed());

  const canShow = useMemo(
    () => Boolean(installEvent && !isInstalled && !dismissed),
    [dismissed, installEvent, isInstalled]
  );

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (recentlyDismissed() || isStandaloneDisplay()) return;
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const onDisplayModeChange = () => setIsInstalled(isStandaloneDisplay());

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    displayModeQuery.addEventListener?.('change', onDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      displayModeQuery.removeEventListener?.('change', onDisplayModeChange);
    };
  }, []);

  if (!canShow) return null;

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice.catch(() => null);
    setInstallEvent(null);
    if (choice?.outcome === 'accepted') {
      setIsInstalled(true);
      return;
    }
    rememberDismissal();
    setDismissed(true);
  };

  const close = () => {
    rememberDismissal();
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-lg border border-legal-gold/35 bg-[#FFFDF7] p-3 shadow-xl shadow-black/20 dark:border-[#D4AF37]/30 dark:bg-[#101827] sm:bottom-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#D4AF37]/15 text-legal-blue dark:text-[#E6C768]">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-legal-blue dark:text-[#F5F7FA]">Instalar Legado Sangiovanni</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-muted-foreground">
            Agrégala a tu pantalla de inicio para abrir el expediente como app.
          </p>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" className="btn-primary" onClick={() => void install()}>
              Instalar
            </Button>
            <Button type="button" size="sm" variant="outline" className="btn-secondary" onClick={close}>
              Ahora no
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Cerrar invitación de instalación"
          className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
          onClick={close}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
