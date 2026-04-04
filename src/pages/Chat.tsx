import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { nom: string | null; prenoms: string | null } | null;
}

const ChatBubble = ({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) => {
  const name = msg.profiles
    ? `${msg.profiles.nom || ""} ${msg.profiles.prenoms || ""}`.trim()
    : "Membre";
  const time = new Date(msg.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <p className="text-xs font-medium text-primary mb-1 ml-1">{name}</p>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-secondary text-secondary-foreground rounded-bl-md"
          }`}
        >
          {msg.content}
        </div>
        <p className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? "text-right mr-1" : "ml-1"}`}>
          {time}
        </p>
      </div>
    </div>
  );
};

const ChatRoom = ({ session }: { session: Session }) => {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, user_id, content, created_at, profiles(nom, prenoms)")
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data as ChatMessage[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;
    setSending(true);
    setNewMessage("");
    try {
      const { error } = await supabase
        .from("messages")
        .insert({ user_id: session.user.id, content });
      if (error) throw error;
    } catch {
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[700px]">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-secondary/20 rounded-t-2xl border border-b-0 border-border/50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">Chargement…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <MessageCircle className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              Aucun message. Soyez le premier à écrire !
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} isOwn={msg.user_id === session.user.id} />
          ))
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 p-3 bg-card border border-border/50 rounded-b-2xl"
      >
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écrire un message…"
          className="flex-1"
          disabled={sending}
          autoFocus
        />
        <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

const Chat = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <div className="pt-16">
      <section className="py-8 lg:py-12 bg-secondary/50">
        <div className="container">
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">
              Communication
            </span>
            <h1 className="mt-2 text-2xl lg:text-4xl font-display font-bold text-foreground leading-tight">
              Chat Communautaire
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Échangez en temps réel avec les membres du district.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="container max-w-2xl">
          {session ? (
            <ChatRoom session={session} />
          ) : (
            <ScrollReveal>
              <div className="text-center py-16 px-8 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  Connectez-vous pour discuter
                </h3>
                <p className="text-sm text-muted-foreground">
                  Le chat est accessible uniquement aux membres enregistrés du district.
                </p>
                <Link to="/connexion">
                  <Button variant="default" size="lg" className="mt-2">
                    <LogIn className="w-4 h-4 mr-2" />
                    Se connecter
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          )}
        </div>
      </section>
    </div>
  );
};

export default Chat;
