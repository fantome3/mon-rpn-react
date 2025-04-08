//Pour la gestion des montants à préléver lors de l'annonce d'un décès
import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { timestamps: true } })
export class Settings {
  public _id?: string

  @prop({ required: true, default: 10 })
  public amountPerDependent!: number
}

export const SettingsModel = getModelForClass(Settings)
