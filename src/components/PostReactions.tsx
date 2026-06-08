import { useEffect, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const PostReactions = ({ actualiteId }: { actualiteId: string }) => {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id ?? null);

      const { count: c } = await supabase
        .from("post_reactions")
        .select("*", { count: "exact", head: true })
        .eq("actualite_id", actualiteId);
      setCount(c ?? 0);

      if (session) {
        const { data } = await supabase
          .from("post_reactions")
          .select("id")
          .eq("actualite_id", actualiteId)
          .eq("user_id", session.user.id)
          .maybeSingle();
        setLiked(!!data);
      }
    })();

    const channel = supabase
      .channel(`reactions-${actualiteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_reactions", filter: `actualite_id=eq.${actualiteId}` },
        async () => {
          const { count: c } = await supabase
            .from("post_reactions")
            .select("*", { count: "exact", head: true })
            .eq("actualite_id", actualiteId);
          setCount(c ?? 0);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [actualiteId]);

  const toggle = async () => {
    if (!userId) {
      toast.error("Connectez-vous pour réagir.");
      return;
    }
    if (pending) return;
    setPending(true);
    if (liked) {
      await supabase
        .from("post_reactions")
        .delete()
        .eq("actualite_id", actualiteId)
        .eq("user_id", userId);
      setLiked(false);
    } else {
      await supabase
        .from("post_reactions")
        .insert({ actualite_id: actualiteId, user_id: userId, reaction: "like" });
      setLiked(true);
    }
    setPending(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
        liked
          ? "bg-accent/15 text-accent"
          : "bg-secondary text-muted-foreground hover:bg-accent/10 hover:text-accent"
      }`}
      aria-label={liked ? "Retirer le j'aime" : "J'aime"}
    >
      <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
      <span>{count}</span>
    </button>
  );
};
