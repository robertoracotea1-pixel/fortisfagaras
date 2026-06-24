"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockProperties } from "@/lib/mock-data";
import type { Property } from "@/lib/types";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Phone,
  ExternalLink,
  TrendingDown,
  Copy,
  Grid3X3,
  List,
  Building2,
  Home,
  TreePine,
} from "lucide-react";

const PLATFORM_COLORS: Record<string, string> = {
  OLX: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Publi24: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Storia: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  HomeZZ: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Facebook: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  Imobiliare: "bg-pink-500/15 text-pink-400 border-pink-500/20",
  Anunturi: "bg-orange-500/15 text-orange-400 border-orange-500/20",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  apartament: Building2,
  casa: Home,
  teren: TreePine,
  garsoniera: Building2,
  spatiu_comercial: Building2,
};

function PropertyCard({ p }: { p: Property }) {
  const hasPriceDrop = p.priceHistory.length > 1;
  const lastChange = p.priceHistory[p.priceHistory.length - 1]?.changePct;
  const Icon = TYPE_ICONS[p.type] ?? Building2;

  return (
    <Card className="border-border bg-card/60 hover:bg-card/80 hover:border-border/80 transition-all group cursor-pointer overflow-hidden">
      <CardContent className="p-0">
        {/* Image / placeholder */}
        <div className="relative h-36 bg-muted/50 flex items-center justify-center overflow-hidden border-b border-border/50">
          <Icon className="w-10 h-10 text-muted-foreground/20" />
          {p.isNew && (
            <span className="absolute top-2 left-2 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              NOU
            </span>
          )}
          {p.ownerType === "PF" && (
            <span className="absolute top-2 right-2 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              PF
            </span>
          )}
          {p.isDuplicate && (
            <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-semibold bg-violet-500/20 text-violet-400 border border-violet-500/30 px-1.5 py-0.5 rounded-full">
              <Copy className="w-2.5 h-2.5" />
              {p.sources.length} surse
            </span>
          )}
        </div>

        <div className="p-4 space-y-2.5">
          {/* Price + trend */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-base font-bold text-foreground">
                {p.price.toLocaleString("ro")} {p.currency}
              </p>
              {hasPriceDrop && lastChange && lastChange < 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <TrendingDown className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {Math.abs(lastChange)}% reducere
                  </span>
                </div>
              )}
            </div>
            {p.surfaceM2 && (
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50 whitespace-nowrap">
                {p.surfaceM2} m²
                {p.rooms ? ` · ${p.rooms} cam.` : ""}
              </span>
            )}
          </div>

          {/* Title */}
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {p.title}
          </p>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{p.city}{p.street ? ` · ${p.street}` : ""}</span>
          </div>

          {/* Owner */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="w-3 h-3 flex-shrink-0" />
            <span className="font-medium text-foreground/80">{p.owner.phone}</span>
            {p.owner.name && <span className="text-muted-foreground/60">· {p.owner.name}</span>}
          </div>

          {/* Sources */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {p.sources.map((src) => (
              <Badge
                key={src.platform}
                variant="outline"
                className={`text-[10px] h-4 px-1.5 font-semibold ${PLATFORM_COLORS[src.platform] ?? ""}`}
              >
                {src.platform}
              </Badge>
            ))}
            <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground/50">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(p.firstSeenAt).toLocaleDateString("ro")}
            </span>
          </div>

          {/* Action */}
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-[11px] gap-1.5 border-border hover:border-primary/50 hover:text-primary transition-all mt-1"
          >
            <ExternalLink className="w-3 h-3" />
            Deschide proprietatea
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = mockProperties.filter((p) => {
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.owner.phone.includes(search);
    const matchOwner = ownerFilter === "all" || p.ownerType === ownerFilter;
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchOwner && matchType;
  });

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Proprietăți"
        subtitle={`${mockProperties.length} proprietăți indexate · Făgăraș + 20km rază`}
      />

      <div className="p-6 space-y-4">
        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Caută după titlu, oraș, telefon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-muted/40 border-border text-sm"
            />
          </div>

          <Select value={ownerFilter} onValueChange={(v) => setOwnerFilter(v ?? "all")}>
            <SelectTrigger className="w-40 h-9 bg-muted/40 border-border text-sm">
              <SelectValue placeholder="Tip proprietar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți proprietarii</SelectItem>
              <SelectItem value="PF">Persoană fizică</SelectItem>
              <SelectItem value="AG">Agenție</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "all")}>
            <SelectTrigger className="w-44 h-9 bg-muted/40 border-border text-sm">
              <SelectValue placeholder="Tip proprietate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate tipurile</SelectItem>
              <SelectItem value="apartament">Apartament</SelectItem>
              <SelectItem value="casa">Casă</SelectItem>
              <SelectItem value="teren">Teren</SelectItem>
              <SelectItem value="garsoniera">Garsonieră</SelectItem>
              <SelectItem value="spatiu_comercial">Spațiu comercial</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-9 gap-2 border-border">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtre avansate
          </Button>

          <div className="flex items-center gap-1 ml-auto bg-muted/40 border border-border rounded-lg p-1">
            <button
              onClick={() => setView("grid")}
              className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> proprietăți găsite
          {ownerFilter === "PF" && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-emerald-500/30 text-emerald-400">
              Filtrezi PF
            </Badge>
          )}
        </div>

        {/* Grid */}
        <div className={`grid gap-4 ${view === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
          {filtered.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nicio proprietate găsită pentru filtrele selectate.</p>
          </div>
        )}
      </div>
    </div>
  );
}
