export type ForfaitType = "etudiant" | "travailleur" | "famille";

interface ForfaitDefinition {
  basePrice: number;
  label: string;
  description?: string;
}

const FORFAIT_DEFINITIONS: Record<ForfaitType, ForfaitDefinition> = {
  etudiant: {
    basePrice: 95,
    label: "Étudiant",
    description: "Une preuve peut être demandée.",
  },
  travailleur: {
    basePrice: 160,
    label: "Travailleur",
    // description: "Accès + conso incl.",
  },
  famille: {
    basePrice: 300,
    label: "Famille",
    description: "2 adultes + enfants",
  },
};

export class Forfait {
  constructor(
    private readonly typeValue: ForfaitType,
    private readonly forfaitInfo: ForfaitDefinition
  ) {}

  static fromType(type: ForfaitType): Forfait {
    return new Forfait(type, FORFAIT_DEFINITIONS[type]);
  }

  static all(): Forfait[] {
    return (Object.keys(FORFAIT_DEFINITIONS) as ForfaitType[]).map((type) =>
      Forfait.fromType(type)
    );
  }

  get type(): ForfaitType {
    return this.typeValue;
  }

  get basePrice(): number {
    return this.forfaitInfo.basePrice;
  }

  get label(): string {
    return this.forfaitInfo.label;
  }

  get description(): string {
    return this.forfaitInfo?.description || "";
  }

  getDiscountedPrice(discountMultiplier: number): number {
    return Number((this.basePrice * (1 - discountMultiplier)).toFixed(2));
  }
}