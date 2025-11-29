export type ForfaitType = "etudiant" | "travailleur" | "famille";
export type MembershipStatus = "membre" | "nouveau-arrivant" | "non-membre";

const MEMBERSHIP_DISCOUNTS: Record<MembershipStatus, number> = {
  membre: 0.9,
  "nouveau-arrivant": 0.9,
  "non-membre": 0.5,
};

interface ForfaitDefinition {
  label: string;
  description?: string;
  prices: Record<MembershipStatus, number>;
}

const FORFAIT_DEFINITIONS: Record<ForfaitType, ForfaitDefinition> = {
  etudiant: {
    label: "Étudiant",
    description: "une preuve peut être demandée.",
    prices: {
      membre: 5,
      "nouveau-arrivant": 5,
      "non-membre": 40,
    },
  },
  travailleur: {
    label: "Participant individuel",
    // description: "Si vous ne pouvez pas bénéficier du tarif étudiant.",
    prices: {
      membre: 5,
      "nouveau-arrivant": 5,
      "non-membre": 40,
    },
  },
  famille: {
    label: "Famille",
    description: "2 adultes + enfants (gratuit).",
    prices: {
      membre: 15,
      "nouveau-arrivant": 15,
      "non-membre": 70,
    },
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

  static getDiscountFor(status: MembershipStatus): number {
    return MEMBERSHIP_DISCOUNTS[status] ?? 0;
  }

  get type(): ForfaitType {
    return this.typeValue;
  }

  get label(): string {
    return this.forfaitInfo.label;
  }

  get description(): string {
    return this.forfaitInfo?.description || "";
  }

  getPrice(status: MembershipStatus): number {
    return this.forfaitInfo.prices[status];
  }

  getReferencePrice(status: MembershipStatus): number {
    const finalPrice = this.getPrice(status);
    const discount = Forfait.getDiscountFor(status);
    if (discount <= 0 || discount >= 1) {
      return finalPrice;
    }
    return Number((finalPrice / (1 - discount)).toFixed(2));
  }

  getDiscount(status: MembershipStatus): number {
    return Forfait.getDiscountFor(status);
  }
}