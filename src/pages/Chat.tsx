import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;

const ChatBubble = ({ msg }: { msg: Msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[80%]`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1 ml-1">
            <Bot className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-medium text-primary">Assistant Novalim</p>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-secondary text-secondary-foreground rounded-bl-md"
          }`}
        >
          {msg.content}
        </div>
      </div>
    </div>
  );
};

const Chat = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Bienvenue ! Je suis l'assistant IA du District Cité Novalim-CIE. Posez-moi vos questions sur le district, le bureau, les commissions, les partenaires ou toute autre information. 😊" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || isLoading) return;

    const userMsg: Msg = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur de connexion");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantSoFar += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > newMessages.length) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Désolé, une erreur est survenue : ${err.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-16">
      <section className="py-8 lg:py-12 bg-secondary/50">
        <div className="container">
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">
              Assistant IA
            </span>
            <h1 className="mt-2 text-2xl lg:text-4xl font-display font-bold text-foreground leading-tight">
              Chat Intelligent Novalim
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Posez vos questions sur le district, le bureau, les commissions et plus encore.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="container max-w-2xl">
          <div className="flex flex-col h-[calc(100vh-14rem)] max-h-[700px]">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-secondary/20 rounded-t-2xl border border-b-0 border-border/50"
            >
              {messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start mb-3">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Réflexion en cours…
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="flex gap-2 p-3 bg-card border border-border/50 rounded-b-2xl">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                className="flex-1"
                disabled={isLoading}
                autoFocus
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Chat;
