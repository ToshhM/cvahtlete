export type PackId = "starter" | "pro" | "club";

export interface PackConfig {
  name: string;
  perks: string[];
  price?: number;
  quote?: boolean;
}

export const PACKS: Record<PackId, PackConfig> = {
  starter: {
    name: "Starter CV",
    price: 79,
    perks: [
      "Repertoire complet, un lien a partager",
      "3 modifications incluses",
      "Mises a jour par contact equipe",
    ],
  },
  pro: {
    name: "Pro Athlete",
    price: 149,
    perks: [
      "Tout le Starter, sans limite",
      "Mises a jour illimitees pendant 1 an",
      "Support prioritaire + onboarding video",
    ],
  },
  club: {
    name: "Club / Academie",
    quote: true,
    perks: [
      "Gestion d'une flotte de repertoires",
      "Espace dedie multi-sport",
      "Accompagnement personnalise",
    ],
  },
};

export function isPackId(value: string): value is PackId {
  return value === "starter" || value === "pro" || value === "club";
}
