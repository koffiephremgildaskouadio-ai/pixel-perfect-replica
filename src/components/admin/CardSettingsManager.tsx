import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, CreditCard, Award } from "lucide-react";
import { toast } from "sonner";

type Settings = Record<string, string>;

const useSetting = (key: string) => {
  const [data, setData] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: row } = await supabase.from("site_content").select("metadata").eq("key", key).maybeSingle();
      setData(((row?.metadata as any) ?? {}) as Settings);
      setLoading(false);
    })();
  }, [key]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_content")
      .upsert({ key, metadata: data, title: key, content: "" }, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Paramètres enregistrés");
  };

  return { data, setData, save, loading, saving };
};

const Field = ({ label, value, onChange, type = "text", rows }: { label: string; value: string; onChange: (v: string) => void; type?: string; rows?: number }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {rows ? (
      <Textarea rows={rows} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    ) : (
      <Input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    )}
  </div>
);

export const CardSettingsManager = () => {
  const card = useSetting("card_settings");
  const cert = useSetting("certificate_settings");

  if (card.loading || cert.loading) {
    return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Carte de membre</h3>
        <Field label="En-tête supérieur" value={card.data.header_top} onChange={(v) => card.setData({ ...card.data, header_top: v })} />
        <Field label="Titre principal" value={card.data.header_main} onChange={(v) => card.setData({ ...card.data, header_main: v })} />
        <Field label="Période de validité" value={card.data.validity} onChange={(v) => card.setData({ ...card.data, validity: v })} />
        <Field label="Numéro d'urgence (verso)" value={card.data.emergency_phone} onChange={(v) => card.setData({ ...card.data, emergency_phone: v })} />
        <Field label="Mention légale (verso)" value={card.data.verso_text} onChange={(v) => card.setData({ ...card.data, verso_text: v })} rows={3} />
        <Field label="URL Facebook (QR code verso)" value={card.data.facebook_url} onChange={(v) => card.setData({ ...card.data, facebook_url: v })} />
        <Field label="URL Site web (QR code verso)" value={card.data.site_url} onChange={(v) => card.setData({ ...card.data, site_url: v })} />
        <Button onClick={card.save} disabled={card.saving} className="w-full">
          {card.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Enregistrer la carte
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><Award className="w-5 h-5 text-orange-600" /> Certificat</h3>
        <Field label="Titre du certificat" value={cert.data.title} onChange={(v) => cert.setData({ ...cert.data, title: v })} />
        <Field label="Sous-titre" value={cert.data.subtitle} onChange={(v) => cert.setData({ ...cert.data, subtitle: v })} />
        <Field label="Autorité signataire" value={cert.data.authority} onChange={(v) => cert.setData({ ...cert.data, authority: v })} />
        <Field label="Nom du signataire" value={cert.data.signatory} onChange={(v) => cert.setData({ ...cert.data, signatory: v })} />
        <Field label="Mention de pied" value={cert.data.footer} onChange={(v) => cert.setData({ ...cert.data, footer: v })} rows={2} />
        <Button onClick={cert.save} disabled={cert.saving} className="w-full">
          {cert.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Enregistrer le certificat
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Les modifications s'appliquent immédiatement aux cartes et certificats nouvellement générés.
      </p>
    </div>
  );
};
