import {
  getModelForClass,
  modelOptions,
  prop,
} from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class ReservationPersonneSchema {
  @prop({ required: true, trim: true })
  public prenom!: string;

  @prop({ required: true, trim: true })
  public nom!: string;
}

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class ReservationCompteSchema {
  @prop({
    required: true,
    _id: false,
    type: () => ReservationPersonneSchema,
  })
  public titulaire!: ReservationPersonneSchema;

  @prop({ required: true, trim: true, lowercase: true })
  public email!: string;

  @prop({ required: true, trim: true })
  public telephone!: string;
}

@modelOptions({
  schemaOptions: {
    collection: "reservations",
    timestamps: true,
  },
})
export class ReservationEntity {
  @prop({
    required: true,
    enum: ["etudiant", "travailleur", "famille"],
    trim: true,
  })
  public forfaitType!: string;

  @prop({
    required: true,
    _id: false,
    type: () => ReservationCompteSchema,
  })
  public compte!: ReservationCompteSchema;

  @prop({
    type: () => ReservationPersonneSchema,
    default: [],
  })
  public accompagnateurs!: ReservationPersonneSchema[];

  @prop({ required: true, trim: true, uppercase: true })
  public interacCode!: string;

  @prop({ required: true })
  public participantCount!: number;

  @prop({ required: true })
  public unitPrice!: number;

  @prop({ required: true })
  public totalAmount!: number;

  @prop({ required: true })
  public discountMultiplier!: number;

  @prop({ type: () => Object })
  public meta?: Record<string, unknown>;

  @prop()
  public eventDate?: Date;

  @prop({
    enum: ["pending", "confirmed", "refunded"],
    default: "pending",
  })
  public status!: "pending" | "confirmed" | "refunded";

  @prop()
  public paymentConfirmedAt?: Date;
}

export const ReservationModel =
  getModelForClass(ReservationEntity);