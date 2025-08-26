//Pour la gestion des montants à préléver lors de l'annonce d'un décès
import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { timestamps: true } })
export class Settings {
  public _id?: string

  // Montant pour la participation au RPN par personne
  @prop({ required: true, default: 10 })
  public amountPerDependent!: number

  // Montant annuel pour un adulte travailleur
  @prop({ required: true, default: 50 })
  public membershipUnitAmount!: number

  // Solde minimum requis pour ne pas recevoir d’alerte (RPN)
  @prop({ required: true, default: 10 })
  public minimumBalanceRPN!: number

  @prop({ required: true, default: 5 })
  public maxMissedReminders!: number
}

export const SettingsModel = getModelForClass(Settings)
