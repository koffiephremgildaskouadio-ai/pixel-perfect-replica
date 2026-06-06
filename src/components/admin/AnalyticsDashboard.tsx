import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Users, Newspaper, MessageSquare, LayoutGrid, BookOpen,
  TrendingUp, Loader2, ShieldCheck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

type Stats = {
  members: number;
  news: number;
  comments: number;
  portals: number;
  directory: number;
  admins: number;
};

export const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [series, setSeries] = useState<{ date: string; actus: number; commentaires: number }[]>([]);
  const [categories, setCategories] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [m, n, c, p, d, r, allNews, allComm, allMembers] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("actualites").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("portals").select("*", { count: "exact", head: true }),
        supabase.from("directory_entries").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
        supabase.from("actualites").select("created_at").gte(
          "created_at",
          subDays(new Date(), 30).toISOString()
        ),
        supabase.from("comments").select("created_at").gte(
          "created_at",
          subDays(new Date(), 30).toISOString()
        ),
        supabase.from("members").select("category"),
      ]);

      setStats({
        members: m.count || 0,
        news: n.count || 0,
        comments: c.count || 0,
        portals: p.count || 0,
        directory: d.count || 0,
        admins: r.data?.length || 0,
      });

      // 30 derniers jours
      const days: Record<string, { actus: number; commentaires: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const k = format(subDays(new Date(), i), "dd/MM");
        days[k] = { actus: 0, commentaires: 0 };
      }
      (allNews.data || []).forEach((row: any) => {
        const k = format(startOfDay(new Date(row.created_at)), "dd/MM");
        if (days[k]) days[k].actus++;
      });
      (allComm.data || []).forEach((row: any) => {
        const k = format(startOfDay(new Date(row.created_at)), "dd/MM");
        if (days[k]) days[k].commentaires++;
      });
      setSeries(Object.entries(days).map(([date, v]) => ({ date, ...v })));

      // Catégories de membres
      const catMap: Record<string, number> = {};
      (allMembers.data || []).forEach((row: any) => {
        const k = row.category || "autre";
        catMap[k] = (catMap[k] || 0) + 1;
      });
      setCategories(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    { label: "Membres", value: stats?.members, icon: Users, color: "text-primary" },
    { label: "Actualités", value: stats?.news, icon: Newspaper, color: "text-accent" },
    { label: "Commentaires", value: stats?.comments, icon: MessageSquare, color: "text-primary" },
    { label: "Portails", value: stats?.portals, icon: LayoutGrid, color: "text-accent" },
    { label: "Annuaire", value: stats?.directory, icon: BookOpen, color: "text-primary" },
    { label: "Comptes admin", value: stats?.admins, icon: ShieldCheck, color: "text-accent" },
  ];

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#15803d", "#f97316", "#22c55e", "#fb923c"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold mb-1 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Tableau de bord
        </h2>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble en temps réel de l'activité du district.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {c.label}
              </span>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="text-2xl font-display font-bold">{c.value ?? 0}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-sm">Activité des 30 derniers jours</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" fontSize={10} interval={3} />
              <YAxis fontSize={10} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="actus" fill="hsl(var(--primary))" name="Actualités" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commentaires" fill="hsl(var(--accent))" name="Commentaires" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-sm">Répartition des membres par catégorie</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.name} (${entry.value})`}
                labelLine={false}
                fontSize={11}
              >
                {categories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
