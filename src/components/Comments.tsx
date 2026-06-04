import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Trash2, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Comment = {
  id: string;
  actualite_id: string;
  user_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
};

export const Comments = ({ actualiteId }: { actualiteId: string }) => {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    loadCount();
  }, [actualiteId]);

  const loadCount = async () => {
    const { count: c } = await supabase
      .from("comments" as any)
      .select("*", { count: "exact", head: true })
      .eq("actualite_id", actualiteId);
    setCount(c || 0);
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("comments" as any)
      .select("*")
      .eq("actualite_id", actualiteId)
      .order("created_at", { ascending: false });
    setComments((data as any) || []);
    setCount((data as any)?.length || 0);
    setLoading(false);
  };

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && comments.length === 0) load();
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    if (!user) {
      toast.error("Connectez-vous pour commenter");
      return;
    }
    setSending(true);
    const meta = user.user_metadata || {};
    const authorName = `${meta.prenoms || ""} ${meta.nom || ""}`.trim() || user.email || "Membre";
    const { error } = await supabase.from("comments" as any).insert({
      actualite_id: actualiteId,
      user_id: user.id,
      author_name: authorName,
      content: text.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setText("");
    toast.success("Commentaire publié");
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    const { error } = await supabase.from("comments" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="pt-3 border-t border-border/40">
      <button
        onClick={toggleOpen}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {count > 0 ? `${count} commentaire${count > 1 ? "s" : ""}` : "Commenter"}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {user ? (
            <div className="flex gap-2">
              <Textarea
                rows={2}
                placeholder="Votre commentaire..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="text-sm resize-none"
              />
              <Button onClick={handleSend} disabled={sending || !text.trim()} size="sm" className="self-end">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Connectez-vous pour ajouter un commentaire.</p>
          )}

          {loading && <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />}

          <div className="space-y-2">
            {comments.map((c) => {
              const canDelete = user && (user.id === c.user_id);
              return (
                <div key={c.id} className="bg-secondary/50 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="font-semibold text-xs text-foreground">{c.author_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        · {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                    {canDelete && (
                      <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-foreground/85 whitespace-pre-wrap text-[13px] leading-relaxed">{c.content}</p>
                </div>
              );
            })}
            {!loading && comments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Aucun commentaire pour le moment. Soyez le premier !</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
