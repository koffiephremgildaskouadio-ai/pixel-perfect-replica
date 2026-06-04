import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, CreditCard, Award, Upload, Image as ImageIcon, X } from "lucide-react";
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

const ImageField = ({
  label, value, onChange, folder,
}: { label: string; value: string; onChange: (v: string) => void; folder: string }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("member-photos").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("member-photos").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("Image envoyée");
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        {value ? (
          <div className="relative">
            <img src={value} alt="" className="w-16 h-16 object-contain rounded border bg-white" />
            <button onClick={() => onChange("")} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 border-2 border-dashed border-border rounded flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-5 h-5" />
          </div>
        )}
        <label className="flex-1">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          <div className="cursor-pointer inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border bg-secondary hover:bg-secondary/80">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {value ? "Changer l'image" : "Téléverser une image"}
          </div>
        </label>
      </div>
      <Input className="mt-1 text-xs" placeholder="ou collez une URL..." value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
};

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

        <div className="grid sm:grid-cols-2 gap-3">
          <ImageField label="Logo District (gauche)" value={card.data.logo_district} onChange={(v) => card.setData({ ...card.data, logo_district: v })} folder="branding" />
          <ImageField label="Logo CCJY (droite)" value={card.data.logo_ccjy} onChange={(v) => card.setData({ ...card.data, logo_ccjy: v })} folder="branding" />
          <ImageField label="Tampon officiel" value={card.data.tampon_url} onChange={(v) => card.setData({ ...card.data, tampon_url: v })} folder="branding" />
          <ImageField label="Signature" value={card.data.signature_url} onChange={(v) => card.setData({ ...card.data, signature_url: v })} folder="branding" />
        </div>

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

        <div className="grid sm:grid-cols-2 gap-3">
          <ImageField label="Logo District" value={cert.data.logo_district} onChange={(v) => cert.setData({ ...cert.data, logo_district: v })} folder="branding" />
          <ImageField label="Logo CCJY" value={cert.data.logo_ccjy} onChange={(v) => cert.setData({ ...cert.data, logo_ccjy: v })} folder="branding" />
          <ImageField label="Tampon" value={cert.data.tampon_url} onChange={(v) => cert.setData({ ...cert.data, tampon_url: v })} folder="branding" />
          <ImageField label="Signature" value={cert.data.signature_url} onChange={(v) => cert.setData({ ...cert.data, signature_url: v })} folder="branding" />
        </div>

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
