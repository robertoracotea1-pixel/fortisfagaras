"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardStats, Property } from "@/lib/types";
import {
  Home,
  Users,
  PhoneOff,
  Phone,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

const PLATFORM_COLORS: Record<string, string> = {
  OLX: "#3b82f6",
  Publi24: "#10b981",
  Storia: "#8b5cf6",
  HomeZZ: "#f59e0b",
  Facebook: "#6366f1",
  Imobiliare: "#ec4899",
};

const DAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

export function DashboardClient({
  stats,
  recent,
}: {
  stats: DashboardStats;
  recent: Property[];
}) {
  const today = new Date().toLocaleDateString("ro", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Dashboard"
        subtitle={`${today} · Import activ · ${stats.activeSources} surse live`}
      />

      <div className="p-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Anunțuri noi azi",
              value: stats.newToday,
              icon: Home,
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
              trend: "ultimele 24h",
              up: true,
            },
            {
              label: "Persoane fizice noi",
              value: stats.pfToday,
              icon: Users,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
              trend: "PF detectate automat",
              up: true,
            },
            {
              label: "Total PF disponibile",
              value: stats.uncontacted,
              icon: PhoneOff,
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
              trend: "oportunități directe",
              up: false,
            },
            {
              label: "Total anunțuri",
              value: stats.totalProperties,
              icon: Phone,
              color: "text-violet-400",
              bg: "bg-violet-500/10 border-violet-500/20",
              trend: "Făgăraș + 20km",
              up: true,
            },
          ].map((kpi) => (
            <Card key={kpi.label} className={`border ${kpi.bg} bg-card/60`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${kpi.bg}`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  {kpi.up ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </div>
                <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{kpi.label}</p>
                <p className={`text-[10px] mt-1 ${kpi.up ? "text-emerald-400" : "text-amber-400"}`}>
                  {kpi.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Weekly chart */}
          <Card className="lg:col-span-2 border-border bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">
                Anunțuri noi — ultimele 7 zile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats.weeklyNew.map((v, i) => ({ day: DAYS[i], count: v }))}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "oklch(0.58 0.010 250)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "oklch(0.18 0.018 250)" }}
                    contentStyle={{
                      background: "oklch(0.14 0.018 250)",
                      border: "1px solid oklch(0.22 0.018 250)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "oklch(0.95 0.005 250)",
                    }}
                    formatter={(v) => [`${v} anunțuri`, ""]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.weeklyNew.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i === stats.weeklyNew.length - 1 ? "oklch(0.60 0.20 250)" : "oklch(0.22 0.018 250)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Source breakdown */}
          <Card className="border-border bg-card/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">Surse active</CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold">{stats.activeSources} live</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {stats.sourceBreakdown.map((src) => (
                <div key={src.source} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: PLATFORM_COLORS[src.source] ?? "#6b7280" }}
                  />
                  <span className="text-xs text-muted-foreground font-medium flex-1">{src.source}</span>
                  <span className="text-xs font-semibold text-foreground">{src.count}</span>
                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${stats.totalProperties ? (src.count / stats.totalProperties) * 100 : 0}%`,
                        background: PLATFORM_COLORS[src.source] ?? "#6b7280",
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-1 border-t border-border mt-3">
                <p className="text-[10px] text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">{stats.totalProperties}</span> anunțuri indexate
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent new properties */}
        <Card className="border-border bg-card/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                Anunțuri noi recente
              </CardTitle>
              <Link
                href="/properties"
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Vezi toate <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recent.map((p) => (
                <a
                  key={p.id}
                  href={p.sources[0]?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/50 hover:border-border transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {p.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{p.city}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground">
                        {p.sources[0]?.platform}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant={p.ownerType === "PF" ? "default" : "secondary"}
                      className={`text-[10px] font-bold h-5 px-1.5 ${
                        p.ownerType === "PF"
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : ""
                      }`}
                    >
                      {p.ownerType}
                    </Badge>
                    {p.isDuplicate && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-violet-500/30 text-violet-400">
                        {p.sources.length} surse
                      </Badge>
                    )}
                    <p className="text-sm font-bold text-foreground">
                      {p.price > 0 ? `${p.price.toLocaleString("ro")} ${p.currency}` : "la cerere"}
                    </p>
                  </div>
                </a>
              ))}
              {recent.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Niciun anunț nou în ultimele 48h.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Last sync info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 pb-2">
          <Clock className="w-3 h-3" />
          Date agregate live din OLX, Storia și Publi24 · reîmprospătare la 10 min
        </div>
      </div>
    </div>
  );
}
