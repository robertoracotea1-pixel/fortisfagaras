import { Header } from "@/components/layout/header";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  return (
    <div className="flex flex-col min-h-full">
      <Header title="Favorite" subtitle="Proprietățile salvate de tine" />
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 py-24">
        <Heart className="w-10 h-10 opacity-20" />
        <p className="text-sm">Nu ai nicio proprietate salvată încă.</p>
        <p className="text-xs opacity-60">Adaugă proprietăți la favorite din pagina Proprietăți.</p>
      </div>
    </div>
  );
}
