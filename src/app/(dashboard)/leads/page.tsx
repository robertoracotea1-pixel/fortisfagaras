"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { mockLeads } from "@/lib/mock-data";
import type { Lead, LeadStatus } from "@/lib/types";
import { Phone, Calendar, User, GripVertical, Plus, ChevronDown } from "lucide-react";

const COLUMNS: LeadStatus[] = [
  "Nou",
  "Necontactat",
  "Contactat",
  "Programare",
  "Negociere",
  "Contract",
  "Pierdut",
];

const STATUS_STYLES: Record<LeadStatus, string> = {
  Nou: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Necontactat: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  Contactat: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  Programare: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  Negociere: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Contract: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Pierdut: "bg-red-500/15 text-red-400 border-red-500/20",
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-slate-500",
};

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <div className="group bg-card border border-border rounded-xl p-4 space-y-3 hover:border-border/80 hover:shadow-md hover:shadow-black/20 transition-all cursor-grab active:cursor-grabbing">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[lead.priority]}`} />
          <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 min-w-0">
            {lead.property.title}
          </p>
        </div>
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 flex-shrink-0 mt-0.5 transition-colors" />
      </div>

      {/* Price */}
      <p className="text-sm font-bold text-foreground">
        {lead.property.price.toLocaleString("ro")} {lead.property.currency}
      </p>

      {/* Owner */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Phone className="w-3 h-3 flex-shrink-0" />
        <span className="font-medium text-foreground/80">{lead.owner.phone}</span>
      </div>

      {lead.owner.name && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{lead.owner.name}</span>
        </div>
      )}

      {/* City + type */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-border text-muted-foreground">
          {lead.property.city}
        </Badge>
        <Badge
          variant="outline"
          className={`text-[10px] h-4 px-1.5 capitalize ${
            lead.property.ownerType === "PF"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {lead.property.ownerType}
        </Badge>
      </div>

      {/* Followup */}
      {lead.nextFollowupAt && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
          <Calendar className="w-3 h-3" />
          {new Date(lead.nextFollowupAt).toLocaleDateString("ro", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}

      {/* Note preview */}
      {lead.notes && (
        <p className="text-[10px] text-muted-foreground/70 line-clamp-2 leading-relaxed border-t border-border/50 pt-2">
          {lead.notes}
        </p>
      )}

      {/* Assigned */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 border-t border-border/50 pt-2">
        <span className="truncate">{lead.assignedTo}</span>
        <span>
          {new Date(lead.updatedAt).toLocaleDateString("ro", { day: "2-digit", month: "short" })}
        </span>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [leads] = useState<Lead[]>(mockLeads);

  const byStatus = (status: LeadStatus) => leads.filter((l) => l.status === status);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="CRM Leads"
        subtitle={`${leads.length} lead-uri active · Kanban view`}
      />

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 min-w-max h-full">
          {COLUMNS.map((status) => {
            const items = byStatus(status);
            return (
              <div key={status} className="flex flex-col w-72 flex-shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[status]}`}>
                      {status}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Column body */}
                <div
                  className={`flex-1 min-h-24 rounded-xl border-2 border-dashed p-3 space-y-3 transition-colors ${
                    items.length > 0
                      ? "border-border/30 bg-muted/10"
                      : "border-border/15 bg-muted/5"
                  }`}
                >
                  {items.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}

                  {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/30">
                      <p className="text-xs">Niciun lead</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
