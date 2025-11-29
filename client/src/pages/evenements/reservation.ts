import { Compte } from "./compte";
import { Forfait, ForfaitType, MembershipStatus } from "./forfait";
import { Personne } from "./personne";

export interface ReservationMetaPayload {
  membershipStatus: MembershipStatus;
  etablissement?: string;
  numEtudiant?: string;
}

export interface ReservationPayload {
  forfaitType: ForfaitType;
  compte: ReturnType<Compte["toJSON"]>;
  accompagnateurs: ReturnType<Personne["toJSON"]>[];
  interacCode: string;
  participantCount: number;
  unitPrice: number;
  totalAmount: number;
  discountMultiplier: number;
  meta: ReservationMetaPayload;
}

export class Reservation {
  constructor(
    private readonly forfait: Forfait,
    private readonly compte: Compte,
    private readonly accompagnateurs: Personne[],
    private readonly interacCode: string,
    private readonly discountMultiplier: number,
    private readonly membershipStatus: MembershipStatus,
    private readonly meta: Omit<ReservationMetaPayload, "membershipStatus">
  ) {}

  get participantCount(): number {
    return this.accompagnateurs.length + 1;
  }

  get unitPrice(): number {
    return this.forfait.getPrice(this.membershipStatus);
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
      meta: {
        membershipStatus: this.membershipStatus,
        ...this.meta,
      },
    };
  }
}
