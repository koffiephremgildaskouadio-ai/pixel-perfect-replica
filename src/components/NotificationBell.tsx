import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const STORAGE_KEY = "novalim_last_seen_notif";

type Notif = { id: string; title: string; created_at: string };

export const NotificationBell = () => {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  const refresh = async () => {
    const { data } = await supabase
      .from("actualites")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (!data) return;
    setItems(data);
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    const count = lastSeen
      ? data.filter((d) => new Date(d.created_at) > new Date(lastSeen)).length
      : data.length;
    setUnread(count);
  };

  useEffect(() => {
    refresh();
    // Demande de permission notifications natives (non bloquant)
    if ("Notification" in window && Notification.permission === "default") {
      setTimeout(() => Notification.requestPermission().catch(() => {}), 5000);
    }
    const channel = supabase
      .channel("realtime-actu")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "actualites" },
        (payload) => {
          const n = payload.new as Notif;
          setItems((prev) => [n, ...prev].slice(0, 10));
          setUnread((u) => u + 1);
          toast.success(`📢 Nouvelle actualité : ${n.title}`, {
            action: { label: "Voir", onClick: () => navigate("/actualites") },
          });
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("District Novalim-CIE", {
                body: n.title,
                icon: "/icon-192.png",
              });
            } catch {}
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setUnread(0);
  };

  return (
    <Popover onOpenChange={(o) => o && markRead()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <p className="text-xs text-muted-foreground">Dernières publications</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Aucune notification</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate("/actualites")}
                className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-b border-border/50 last:border-0"
              >
                <p className="text-sm font-medium line-clamp-2">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
