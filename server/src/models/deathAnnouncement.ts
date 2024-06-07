import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose'

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class DeathAnnouncement {
  public _id?: string

  @prop({ required: true })
  public firstName!: string

  @prop({ required: true })
  public deathCause!: string

  @prop({ required: true })
  public deathPlace!: string

  @prop({ required: true })
  public deathDate!: Date
}

export const DeathAnnouncementModel = getModelForClass(DeathAnnouncement)
