import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const InstallPWA = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("Application installée ! 🎉");
    });
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) return null;

  const handleInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") toast.success("Installation lancée !");
      setDeferred(null);
      return;
    }
    if (isIOS) {
      setShowIosTip(true);
      return;
    }
    toast.info("Menu navigateur → « Installer l'application »");
  };

  return (
    <>
      <Button
        onClick={handleInstall}
        size="sm"
        className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white shadow-md"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Installer l'app</span>
        <span className="sm:hidden">Installer</span>
      </Button>

      {showIosTip && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIosTip(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Installer sur iPhone</h3>
              </div>
              <button onClick={() => setShowIosTip(false)} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="text-sm space-y-2 text-foreground/90 list-decimal pl-5">
              <li>Touchez l'icône <b>Partager</b> ⬆️ en bas de Safari</li>
              <li>Choisissez <b>« Sur l'écran d'accueil »</b></li>
              <li>Appuyez sur <b>Ajouter</b></li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3">
              L'application s'ouvrira ensuite comme une vraie app.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
