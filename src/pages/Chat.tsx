import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, Paperclip, X, Square, WifiOff, RefreshCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string; images?: string[] };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;
const MAX_HISTORY_MESSAGES = 12;
const REQUEST_TIMEOUT_MS = 35000;
const MAX_RETRIES = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const trimHistory = (items: Msg[]) => {
  const firstAssistant = items[0]?.role === "assistant" ? [items[0]] : [];
  const tail = items.slice(firstAssistant.length).slice(-MAX_HISTORY_MESSAGES);
  return [...firstAssistant, ...tail];
};

const buildFriendlyError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Erreur inconnue";
  if (/timeout|timed out|aborted/i.test(message)) {
    return "Le serveur a mis trop de temps à répondre. Réessayez dans un instant.";
  }
  if (/402/.test(message)) {
    return "Le service IA a besoin de crédits pour continuer à répondre.";
  }
  if (/429/.test(message)) {
    return "Trop de demandes en même temps. Réessayez dans quelques secondes.";
  }
  if (/503|502|504|indisponible|unavailable/i.test(message)) {
    return "Le serveur IA est momentanément indisponible, mais la requête a été sécurisée.";
  }
  return `Service IA indisponible : ${message}`;
};

const ChatBubble = ({ msg }: { msg: Msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[80%]`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1 ml-1">
            <Bot className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-medium text-primary">NovalimIA</p>
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
        {msg.images?.map((img, i) => (
          <img key={i} src={img} alt="Image générée" className="mt-2 rounded-xl max-w-full max-h-80 border border-border/50" />
        ))}
      </div>
    </div>
  );
};

const Chat = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Bienvenue ! Je suis NovalimIA, l'assistant IA officiel du District Cité Novalim-CIE. 🤖\n\nJe peux répondre à vos questions, générer des images, et bien plus. Posez-moi vos questions ! 😊" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [chatStatus, setChatStatus] = useState<"ready" | "sending" | "retrying" | "offline">("ready");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastPayloadRef = useRef<{ rawMessages: Msg[]; apiMessages: any[] } | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const selectedHistoryInfo = useMemo(() => {
    const trimmed = trimHistory(messages);
    return {
      kept: trimmed.length,
      total: messages.length,
    };
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if ((!content && !attachedFile) || isLoading) return;

    const isImageGenRequest = /g[ée]n[eè]re|cr[ée]e|dessine|image|photo|illustration|logo|affiche/i.test(content) &&
      !/information|parle|qui|quoi|comment|pourquoi|quand/i.test(content);

    let userContent = content;
    let uploadedImageUrl: string | null = null;

    if (attachedFile && attachedFile.type.startsWith("image/")) {
      const ext = attachedFile.name.split(".").pop();
      const path = `chat/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("member-photos").upload(path, attachedFile);
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("member-photos").getPublicUrl(path);
        uploadedImageUrl = urlData.publicUrl;
      }
    }

    const userMsg: Msg = { role: "user", content: userContent, images: uploadedImageUrl ? [uploadedImageUrl] : undefined };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    removeAttachment();
    setIsLoading(true);
    setChatStatus("sending");

    if (isImageGenRequest) {
      try {
        const resp = await supabase.functions.invoke("chat-ai", {
          body: {
            messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            generateImage: true,
            imagePrompt: content,
          },
        });
        
        if (resp.error) throw resp.error;
        const data = resp.data;
        
        if (data?.imageUrl) {
          setMessages(prev => [...prev, { role: "assistant", content: data.text || "Voici l'image générée :", images: [data.imageUrl] }]);
        } else {
          setMessages(prev => [...prev, { role: "assistant", content: data?.text || data?.error || "Image non disponible pour le moment." }]);
        }
      } catch (err: any) {
        setMessages(prev => [...prev, { role: "assistant", content: `Désolé, erreur de génération d'image : ${err.message}` }]);
        setChatStatus("offline");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const trimmedMessages = trimHistory(newMessages);
    const apiMessages = trimmedMessages.map(m => {
      if (m.images?.[0]) {
        return { role: m.role, content: [
          { type: "text", text: m.content || "Analyse cette image" },
          { type: "image_url", image_url: { url: m.images[0] } }
        ]};
      }
      return { role: m.role, content: m.content };
    });

    lastPayloadRef.current = { rawMessages: newMessages, apiMessages };

    let assistantSoFar = "";

    try {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
        const controller = new AbortController();
        abortRef.current = controller;
        const timeoutId = window.setTimeout(() => controller.abort(new DOMException("timeout", "AbortError")), REQUEST_TIMEOUT_MS);

        try {
          if (attempt > 1) {
            setChatStatus("retrying");
            await sleep(500 * attempt);
          }

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

          if (!resp.ok || !resp.body) {
            let errMsg = `Erreur ${resp.status}`;
            try {
              const errData = await resp.json();
              errMsg = errData.error || errMsg;
            } catch {}
            if ([429, 500, 502, 503, 504].includes(resp.status) && attempt < MAX_RETRIES) {
              continue;
            }
            throw new Error(errMsg);
          }

          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let textBuffer = "";
          let streamDone = false;

          while (!streamDone) {
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
              if (jsonStr === "[DONE]") {
                streamDone = true;
                break;
              }

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

          setChatStatus("ready");
          abortRef.current = null;
          window.clearTimeout(timeoutId);
          return;
        } catch (error) {
          window.clearTimeout(timeoutId);
          const aborted = error instanceof DOMException && error.name === "AbortError";

          if (aborted && isCancelling) {
            setMessages((prev) => [...prev, { role: "assistant", content: "Requête annulée. Vous pouvez envoyer un nouveau message." }]);
            setChatStatus("ready");
            return;
          }

          if ((aborted || /429|500|502|503|504/.test(String(error))) && attempt < MAX_RETRIES) {
            continue;
          }

          throw aborted ? new Error("timeout") : error;
        } finally {
          abortRef.current = null;
        }
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: buildFriendlyError(err) },
      ]);
      setChatStatus("offline");
    } finally {
      setIsLoading(false);
      setIsCancelling(false);
    }
  };

  const cancelRequest = () => {
    if (!abortRef.current) return;
    setIsCancelling(true);
    abortRef.current.abort(new DOMException("cancelled", "AbortError"));
  };

  const retryLastRequest = async () => {
    const last = lastPayloadRef.current;
    if (!last || isLoading) return;
    setMessages(last.rawMessages);
    setIsLoading(true);
    setChatStatus("retrying");

    let assistantSoFar = "";
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(new DOMException("timeout", "AbortError")), REQUEST_TIMEOUT_MS);
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: last.apiMessages }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) throw new Error(`Erreur ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantSoFar += delta;
              setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg?.role === "assistant" && prev.length > last.rawMessages.length) {
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
      window.clearTimeout(timeoutId);
      setChatStatus("ready");
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: buildFriendlyError(err) }]);
      setChatStatus("offline");
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-16">
      <section className="py-6 lg:py-8 bg-secondary/50">
        <div className="container">
          <ScrollReveal className="text-center max-w-2xl mx-auto">
            <span className="text-sm font-semibold text-primary tracking-wide uppercase">
              NovalimIA
            </span>
            <h1 className="mt-2 text-2xl lg:text-3xl font-display font-bold text-foreground leading-tight">
              Chat Intelligent
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              Questions, images, fichiers — NovalimIA répond à tout.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border/60 px-3 py-1">
                {chatStatus === "offline" ? <WifiOff className="w-3 h-3 text-destructive" /> : <Bot className="w-3 h-3 text-primary" />}
                {chatStatus === "sending" && "Connexion au serveur IA…"}
                {chatStatus === "retrying" && "Nouvelle tentative intelligente…"}
                {chatStatus === "offline" && "Mode sécurisé : dernier essai échoué"}
                {chatStatus === "ready" && "Serveur IA stabilisé"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-card border border-border/60 px-3 py-1">
                Historique envoyé : {selectedHistoryInfo.kept}/{selectedHistoryInfo.total}
              </span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-4 lg:py-8">
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
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question ou demandez une image…"
                className="flex-1"
                disabled={isLoading}
                autoFocus
              />
              {isLoading && (
                <Button type="button" variant="outline" size="icon" onClick={cancelRequest} title="Annuler la requête">
                  <Square className="w-4 h-4" />
                </Button>
              )}
              {!isLoading && chatStatus === "offline" && (
                <Button type="button" variant="outline" size="icon" onClick={retryLastRequest} title="Réessayer la dernière requête">
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
