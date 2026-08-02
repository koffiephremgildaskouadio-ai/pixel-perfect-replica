import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, Paperclip, X, Square, WifiOff, RefreshCcw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string; images?: string[] };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;
const MAX_HISTORY_MESSAGES = 14;
const CONNECT_TIMEOUT_MS = 30000;
const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const trimHistory = (items: Msg[]) => items.slice(-MAX_HISTORY_MESSAGES);

const buildFriendlyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (/timeout|timed out|aborted|abort/i.test(message))
    return "Le serveur a mis trop de temps à répondre. Réessayez dans un instant.";
  if (/402/.test(message)) return "Le service IA a besoin de crédits pour continuer.";
  if (/429/.test(message)) return "Trop de demandes en même temps. Réessayez dans quelques secondes.";
  if (/Failed to fetch|NetworkError/i.test(message))
    return "Connexion internet interrompue. Vérifiez votre réseau puis réessayez.";
  return "Le service IA est momentanément indisponible. Réessayez dans quelques secondes.";
};

const SUGGESTIONS = [
  "Quoi de neuf à Yopougon aujourd'hui ?",
  "Programme de la fête de l'indépendance",
  "Qui compose le bureau du district ?",
  "Génère une affiche pour la jeunesse",
];

const ChatBubble = ({ msg }: { msg: Msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3 animate-fade-in`}>
      <div className="max-w-[85%]">
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1 ml-1">
            <Bot className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-medium text-primary">NovalimIA</p>
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border/60 text-card-foreground rounded-bl-md"
          }`}
        >
          {msg.content}
        </div>
        {msg.images?.map((img, i) => (
          <img key={i} src={img} alt="Image générée" loading="lazy" className="mt-2 rounded-xl max-w-full max-h-80 border border-border/50" />
        ))}
      </div>
    </div>
  );
};

const Chat = () => {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Bonjour 👋 Posez votre question : actualité de Yopougon et du CCJY, vie du District Cité Novalim-CIE, génération d'images, analyse de documents…",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState<"ready" | "sending" | "retrying" | "offline">("ready");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const lastPayloadRef = useRef<any[] | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else setFilePreview(null);
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Streams one attempt. Returns true when at least one token was received. */
  const streamOnce = async (apiMessages: any[], baseLength: number) => {
    const controller = new AbortController();
    abortRef.current = controller;
    let firstByte = false;
    const timeoutId = window.setTimeout(() => {
      if (!firstByte) controller.abort();
    }, CONNECT_TIMEOUT_MS);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      const contentType = resp.headers.get("content-type") || "";

      // Non-stream JSON answer (fallback path of the edge function)
      if (contentType.includes("application/json")) {
        const payload = await resp.json().catch(() => ({} as any));
        if (payload?.text && !payload?.fallback) {
          setMessages((prev) => [...prev, { role: "assistant", content: payload.text }]);
          return true;
        }
        throw new Error(payload?.error || `Erreur ${resp.status}`);
      }

      if (!resp.ok || !resp.body) throw new Error(`Erreur ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let done = false;

      while (!done) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            done = true;
            break;
          }
          let delta: string | undefined;
          try {
            delta = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
          if (!delta) continue;
          firstByte = true;
          acc += delta;
          setMessages((prev) => {
            if (prev.length > baseLength && prev[prev.length - 1].role === "assistant") {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m));
            }
            return [...prev, { role: "assistant", content: acc }];
          });
        }
      }

      if (!acc.trim() && !firstByte) throw new Error("Réponse vide");
      return true;
    } finally {
      window.clearTimeout(timeoutId);
      abortRef.current = null;
    }
  };

  const runConversation = async (apiMessages: any[], baseLength: number) => {
    lastPayloadRef.current = apiMessages;
    cancelledRef.current = false;
    setIsLoading(true);
    setChatStatus("sending");

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await streamOnce(apiMessages, baseLength);
        setChatStatus("ready");
        setIsLoading(false);
        inputRef.current?.focus();
        return;
      } catch (error) {
        if (cancelledRef.current) {
          setChatStatus("ready");
          setIsLoading(false);
          return;
        }
        if (attempt < MAX_ATTEMPTS) {
          setChatStatus("retrying");
          await sleep(700 * attempt);
          continue;
        }
        setMessages((prev) => [...prev, { role: "assistant", content: buildFriendlyError(error) }]);
        setChatStatus("offline");
        setIsLoading(false);
        return;
      }
    }
  };

  const toApiMessages = (items: Msg[]) =>
    trimHistory(items).map((m) =>
      m.images?.[0]
        ? {
            role: m.role,
            content: [
              { type: "text", text: m.content || "Analyse cette image" },
              { type: "image_url", image_url: { url: m.images[0] } },
            ],
          }
        : { role: m.role, content: m.content },
    );

  const submit = async (rawText: string) => {
    const content = rawText.trim();
    if ((!content && !attachedFile) || isLoading) return;

    const isImageGenRequest =
      /g[ée]n[eè]re|dessine|illustration|affiche|logo/i.test(content) &&
      !/information|actualit|parle|qui |quoi |comment|pourquoi|quand/i.test(content);

    let uploadedImageUrl: string | null = null;
    if (attachedFile && attachedFile.type.startsWith("image/")) {
      const ext = attachedFile.name.split(".").pop();
      const path = `chat/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("member-photos").upload(path, attachedFile);
      if (!upErr) {
        const { data } = supabase.storage.from("member-photos").getPublicUrl(path);
        uploadedImageUrl = data.publicUrl;
      }
    }

    const userMsg: Msg = { role: "user", content, images: uploadedImageUrl ? [uploadedImageUrl] : undefined };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    removeAttachment();

    if (isImageGenRequest) {
      setIsLoading(true);
      setChatStatus("sending");
      try {
        const { data, error } = await supabase.functions.invoke("chat-ai", {
          body: { messages: toApiMessages(next), generateImage: true, imagePrompt: content },
        });
        if (error) throw error;
        setMessages((prev) => [
          ...prev,
          data?.imageUrl
            ? { role: "assistant", content: data.text || "Voici l'image générée :", images: [data.imageUrl] }
            : { role: "assistant", content: data?.text || "Image non disponible pour le moment." },
        ]);
        setChatStatus("ready");
      } catch (err) {
        setMessages((prev) => [...prev, { role: "assistant", content: buildFriendlyError(err) }]);
        setChatStatus("offline");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    await runConversation(toApiMessages(next), next.length);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const cancelRequest = () => {
    cancelledRef.current = true;
    abortRef.current?.abort();
  };

  const retryLastRequest = () => {
    if (!lastPayloadRef.current || isLoading) return;
    runConversation(lastPayloadRef.current, messages.length);
  };

  return (
    <div className="pt-16">
      <section className="py-6 lg:py-8 bg-hero-gradient border-b border-border/50">
        <div className="container">
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" /> NovalimIA
            </span>
            <h1 className="mt-2 text-2xl lg:text-3xl font-display font-bold text-foreground leading-tight">
              Quoi de neuf
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Actualité de Yopougon, du CCJY et du District — en direct.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border/60 px-3 py-1">
                {chatStatus === "offline" ? <WifiOff className="w-3 h-3 text-destructive" /> : <Bot className="w-3 h-3 text-primary" />}
                {chatStatus === "sending" && "Rédaction en cours…"}
                {chatStatus === "retrying" && "Nouvelle tentative…"}
                {chatStatus === "offline" && "Hors ligne — réessayez"}
                {chatStatus === "ready" && "Assistant prêt"}
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-4 lg:py-8">
        <div className="container max-w-2xl">
          <div className="flex flex-col h-[calc(100vh-15rem)] max-h-[720px]">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 bg-secondary/20 rounded-t-2xl border border-b-0 border-border/50"
            >
              {messages.map((msg, i) => (
                <ChatBubble key={i} msg={msg} />
              ))}
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-card border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start mb-3">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border/60 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Réflexion en cours…
                  </div>
                </div>
              )}
            </div>

            {attachedFile && (
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/40 border-x border-border/50 text-xs text-muted-foreground">
                {filePreview && <img src={filePreview} alt="" className="w-10 h-10 rounded object-cover" />}
                <span className="truncate flex-1">{attachedFile.name}</span>
                <button onClick={removeAttachment}><X className="w-4 h-4" /></button>
              </div>
            )}

            <form onSubmit={handleSend} className="flex gap-2 p-3 bg-card border border-border/50 rounded-b-2xl">
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
              <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                className="flex-1"
                autoFocus
              />
              {isLoading && (
                <Button type="button" variant="outline" size="icon" onClick={cancelRequest} title="Annuler">
                  <Square className="w-4 h-4" />
                </Button>
              )}
              {!isLoading && chatStatus === "offline" && (
                <Button type="button" variant="outline" size="icon" onClick={retryLastRequest} title="Réessayer">
                  <RefreshCcw className="w-4 h-4" />
                </Button>
              )}
              <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && !attachedFile)}>
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
