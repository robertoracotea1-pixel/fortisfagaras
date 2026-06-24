"use client";

import { useState } from "react";
import { Building2, Eye, EyeOff, ArrowRight, MapPin, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-[oklch(0.09_0.018_250)] via-[oklch(0.12_0.025_255)] to-[oklch(0.10_0.020_250)] border-r border-border overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(oklch(0.60 0.20 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.60 0.20 250) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 border border-primary/25">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground tracking-tight">FORTIS FĂGĂRAȘ</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Platformă CRM Imobiliară</p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              Proprietăți noi din<br />
              <span className="text-primary">Făgăraș și zonă</span>,<br />
              în timp real.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              Import automat din 6 platforme, detectare persoane fizice prin AI, CRM Kanban și notificări instant.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: MapPin, label: "Rază 20km Făgăraș", value: "87 proprietăți" },
              { icon: Layers, label: "Surse active", value: "OLX · Publi24 · +4" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-muted/40 border border-border p-4 space-y-1"
              >
                <item.icon className="w-4 h-4 text-primary mb-2" />
                <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 pt-2">
            {[
              { label: "Noi azi", value: "8" },
              { label: "PF detectate", value: "6" },
              { label: "Necontactate", value: "23" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-muted-foreground/50">
          © 2026 Fortis Făgăraș · Actualizare la 15 minute
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 border border-primary/25">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">FORTIS FĂGĂRAȘ</p>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Bine ai venit</h1>
            <p className="text-sm text-muted-foreground">Autentifică-te în contul tău</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/dashboard";
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="agent@fortisfagaras.ro"
                defaultValue="andrei@fortisfagaras.ro"
                className="h-10 bg-muted/40 border-border focus-visible:ring-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Parolă
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  defaultValue="parola123"
                  className="h-10 pr-10 bg-muted/40 border-border focus-visible:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border" defaultChecked />
                Ține-mă autentificat
              </label>
              <a href="#" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Parolă uitată?
              </a>
            </div>

            <Button type="submit" className="w-full h-10 text-sm font-semibold gap-2">
              Autentificare
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-muted-foreground">
            Ai nevoie de acces?{" "}
            <a href="#" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Contactează administratorul
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
