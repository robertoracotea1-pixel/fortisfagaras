import { Header } from "@/components/layout/header";
import { Users } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header title="Echipă" subtitle="Agenți și administratori" />
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 py-24">
        <Users className="w-10 h-10 opacity-20" />
        <p className="text-sm">Modulul de echipă vine în Etapa 3.</p>
      </div>
    </div>
  );
}
