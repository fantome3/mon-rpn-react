//Pour la gestion des montants à préléver lors de l'annonce d'un décès
import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { timestamps: true } })
export class Settings {
  public _id?: string

  // Montant pour la participation au RPN par personne
  @prop({ required: true, default: 10 })
  public amountPerDependent!: number

  // Montant annuel par personne pour conserver le statut de membre
  @prop({ required: true, default: 10 })
  public membershipUnitAmount!: number

  // Solde minimum requis pour ne pas recevoir d’alerte
  @prop({ required: true, default: 50 })
  public minimumBalanceRPN!: number
}

export const SettingsModel = getModelForClass(Settings)
