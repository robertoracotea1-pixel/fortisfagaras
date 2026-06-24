"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockDashboardStats, mockProperties } from "@/lib/mock-data";
import {
  Home,
  Users,
  PhoneOff,
  Phone,
  Wifi,
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

export default function DashboardPage() {
  const stats = mockDashboardStats;
  const recent = mockProperties.filter((p) => p.isNew).slice(0, 4);

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Dashboard"
        subtitle={`24 iunie 2026 · Import activ · Ultima sincronizare: acum 3 min`}
      />

      <div className="p-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Proprietăți noi azi",
              value: stats.newToday,
              icon: Home,
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20",
              trend: "+3 față de ieri",
              up: true,
            },
            {
              label: "Persoane fizice noi",
              value: stats.pfToday,
              icon: Users,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10 border-emerald-500/20",
              trend: "AI · 96% acuratețe",
              up: true,
            },
            {
              label: "Necontactate",
              value: stats.uncontacted,
              icon: PhoneOff,
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
              trend: "Necesită acțiune",
              up: false,
            },
            {
              label: "Contactate",
              value: stats.contacted,
              icon: Phone,
              color: "text-violet-400",
              bg: "bg-violet-500/10 border-violet-500/20",
              trend: "+2 astăzi",
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
                Proprietăți noi — ultimele 7 zile
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
                    formatter={(v) => [`${v} proprietăți`, ""]}
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
                        width: `${(src.count / stats.totalProperties) * 100}%`,
                        background: PLATFORM_COLORS[src.source] ?? "#6b7280",
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-1 border-t border-border mt-3">
                <p className="text-[10px] text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">{stats.totalProperties}</span> proprietăți indexate
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
                Proprietăți noi astăzi
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
                <Link
                  key={p.id}
                  href={`/properties/${p.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/50 hover:border-border transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
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
                      {p.price.toLocaleString("ro")} {p.currency}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Last sync info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 pb-2">
          <Clock className="w-3 h-3" />
          Ultima sincronizare completă: 24 iunie 2026, 09:45 · Următoarea în 12 minute
        </div>
      </div>
    </div>
  );
}
