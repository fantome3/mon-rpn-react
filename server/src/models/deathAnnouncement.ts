import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose'

export type DeathAnnouncementProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

@modelOptions({
  schemaOptions: { _id: false },
})
export class DeathAnnouncementProcessingSummary {
  @prop({ default: 0 })
  public totalUsers!: number

  @prop({ default: 0 })
  public debitedCount!: number

  @prop({ default: 0 })
  public expectedAmount!: number

  @prop({ default: 0 })
  public collectedAmount!: number

  @prop({ default: 0 })
  public insufficientFundsCount!: number

  @prop({ default: 0 })
  public missingAccountCount!: number

  @prop({ default: 0 })
  public systemErrorCount!: number
}

@modelOptions({
  schemaOptions: { _id: false },
})
export class DeathAnnouncementProcessingError {
  @prop()
  public userId?: string

  @prop()
  public email?: string

  @prop({ required: true })
  public reason!: string

  @prop()
  public detail?: string
}

@modelOptions({
  schemaOptions: { timestamps: true },
})
export class DeathAnnouncement {
  public _id?: string

  @prop({ required: true })
  public firstName!: string

  @prop({ required: true })
  public deathPlace!: string

  @prop({ required: true })
  public deathDate!: Date

  @prop({
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  })
  public processingStatus?: DeathAnnouncementProcessingStatus

  @prop()
  public processingStartedAt?: Date

  @prop()
  public processingFinishedAt?: Date

  @prop({ _id: false, type: () => DeathAnnouncementProcessingSummary })
  public processingSummary?: DeathAnnouncementProcessingSummary

  @prop({ type: () => [DeathAnnouncementProcessingError], default: [] })
  public processingErrors?: DeathAnnouncementProcessingError[]

  @prop()
  public processingFailureReason?: string
}

export const DeathAnnouncementModel = getModelForClass(DeathAnnouncement)
