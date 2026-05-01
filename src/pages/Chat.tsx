import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Loader2, Image, Paperclip, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string; images?: string[] };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;

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
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
      } finally {
        setIsLoading(false);
      }
      return;
    }

    let assistantSoFar = "";

    try {
      const apiMessages = newMessages.map(m => {
        if (m.images?.[0]) {
          return { role: m.role, content: [
            { type: "text", text: m.content || "Analyse cette image" },
            { type: "image_url", image_url: { url: m.images[0] } }
          ]};
        }
        return { role: m.role, content: m.content };
      });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok || !resp.body) {
        let errMsg = `Erreur ${resp.status}`;
        try { const errData = await resp.json(); errMsg = errData.error || errMsg; } catch {}
        throw new Error(errMsg);
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
