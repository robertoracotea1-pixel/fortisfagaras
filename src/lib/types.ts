export type UserRole = "super_admin" | "agency_admin" | "agent";

export type PropertyType =
  | "apartament"
  | "casa"
  | "teren"
  | "spatiu_comercial"
  | "garsoniera";

export type TransactionType = "vanzare" | "inchiriere";

export type OwnerType = "PF" | "AG";

export type LeadStatus =
  | "Nou"
  | "Necontactat"
  | "Contactat"
  | "Programare"
  | "Negociere"
  | "Contract"
  | "Pierdut";

export type Platform =
  | "OLX"
  | "Publi24"
  | "HomeZZ"
  | "Facebook"
  | "Storia"
  | "Imobiliare"
  | "Anunturi";

export interface Owner {
  id: string;
  name: string | null;
  phone: string;
  type: OwnerType;
  confidence: number;
  firstSeenAt: string;
  totalProperties: number;
}

export interface PropertySource {
  platform: Platform;
  url: string;
  lastScraped: string;
}

export interface PriceHistory {
  price: number;
  date: string;
  changePct?: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  transactionType: TransactionType;
  price: number;
  currency: "EUR" | "RON";
  surfaceM2: number;
  rooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  city: string;
  street: string | null;
  ownerType: OwnerType;
  owner: Owner;
  sources: PropertySource[];
  images: string[];
  priceHistory: PriceHistory[];
  firstSeenAt: string;
  lastUpdatedAt: string;
  isNew: boolean;
  isDuplicate: boolean;
  aiPfScore: number;
}

export interface Lead {
  id: string;
  property: Pick<Property, "id" | "title" | "price" | "currency" | "city" | "type" | "ownerType">;
  owner: Owner;
  assignedTo: string;
  status: LeadStatus;
  priority: "low" | "medium" | "high";
  nextFollowupAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  newToday: number;
  pfToday: number;
  uncontacted: number;
  contacted: number;
  activeSources: number;
  totalProperties: number;
  weeklyNew: number[];
  sourceBreakdown: { source: Platform; count: number }[];
}
