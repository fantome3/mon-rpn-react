import { Compte } from "./compte";
import { Forfait } from "./forfait";
import { Personne } from "./personne";

export interface ReservationPayload {
  forfaitType: string;
  compte: ReturnType<Compte["toJSON"]>;
  accompagnateurs: ReturnType<Personne["toJSON"]>[];
  interacCode: string;
  participantCount: number;
  unitPrice: number;
  totalAmount: number;
  discountMultiplier: number;
}

export class Reservation {
  constructor(
    private readonly forfait: Forfait,
    private readonly compte: Compte,
    private readonly accompagnateurs: Personne[],
    private readonly interacCode: string,
    private readonly discountMultiplier: number
  ) {}

  get participantCount(): number {
    return this.accompagnateurs.length + 1;
  }

  get unitPrice(): number {
    return this.forfait.getDiscountedPrice(this.discountMultiplier);
  }

  get totalAmount(): number {
    return Number((this.unitPrice * this.participantCount).toFixed(2));
  }

  toPayload(): ReservationPayload {
    return {
      forfaitType: this.forfait.type,
      compte: this.compte.toJSON(),
      accompagnateurs: this.accompagnateurs.map((personne) => personne.toJSON()),
      interacCode: this.interacCode.trim(),
      participantCount: this.participantCount,
      unitPrice: this.unitPrice,
      totalAmount: this.totalAmount,
      discountMultiplier: this.discountMultiplier,
    };
  }
}

export type ForfaitType = "etudiant" | "travailleur" | "famille";
