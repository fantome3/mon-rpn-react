import {
  prop,
  getModelForClass,
  modelOptions,
  Ref,
  Severity,
} from '@typegoose/typegoose'
import { FamilyMemberState } from '../../../src/domain/familyMember/FamilyMemberState'
import { stateFromName } from '../../../src/domain/familyMember/states'

class Infos {
  @prop({ required: true })
  public residenceCountry!: string

  @prop({
    required: true,
    enum: [
      'student',
      'worker',
      'canadian_citizen',
      'permanent_resident',
      'visitor',
    ],
  })
  public residenceCountryStatus!:
    | 'student'
    | 'worker'
    | 'canadian_citizen'
    | 'permanent_resident'
    | 'visitor'

  @prop({ required: true })
  public postalCode!: string

  @prop({ required: true })
  public address!: string

  @prop({ required: true })
  public tel!: string

  @prop({ required: true })
  public hasInsurance!: boolean
}

class Origines {
  @prop({ required: true })
  public firstName!: string

  @prop({ required: true })
  public lastName!: string

  @prop({ required: true })
  public birthDate!: Date

  @prop({ required: true })
  public nativeCountry!: string

  @prop({ required: true })
  public sex!: string

  @prop({ required: false })
  public id_image!: string
}

class Register {
  @prop({ required: true, unique: true })
  public email!: string

  @prop({ required: true })
  public password!: string

  @prop()
  public newPassword?: string

  @prop({ required: true, default: false })
  public conditions!: boolean

  @prop({ required: true, enum: ['student', 'worker'] })
  public occupation!: 'student' | 'worker'

  @prop()
  public institution?: string

  @prop()
  public otherInstitution?: string

  @prop()
  public studentNumber?: string

  @prop({ enum: ['part-time', 'full-time'] })
  public studentStatus?: 'part-time' | 'full-time'

  @prop()
  public workField?: string
}

class FamilyMember {
  @prop({ required: true })
  public firstName!: string

  @prop({ required: true })
  public lastName!: string

  @prop({ required: true })
  public relationship!: string

  @prop({
    required: true,
    type: () => Object,
    default: () => stateFromName('active'),
  })
  public state!: FamilyMemberState //Active, Deleted,

  @prop({
    required: true,
    enum: [
      'student',
      'worker',
      'canadian_citizen',
      'permanent_resident',
      'visitor',
    ],
  })
  public residenceCountryStatus!:
    | 'student'
    | 'worker'
    | 'canadian_citizen'
    | 'permanent_resident'
    | 'visitor'

  @prop({ required: true })
  public birthDate!: Date

  @prop()
  public tel?: string
}

class Subscription {
  @prop({ required: true, default: Date.now })
  public startDate!: Date

  @prop({
    required: true,
    default: 'registered',
    enum: ['registered', 'active', 'inactive', 'expired'],
  })
  public status!: 'registered' | 'active' | 'inactive' | 'expired'

  @prop({ default: undefined })
  public endDate?: Date

  @prop({ default: 0 })
  public missedRemindersCount?: number // Nombre de rappels ignorés

  @prop({ default: undefined })
  public scheduledDeactivationDate?: Date // Date de désactivation programmée

  @prop({ default: null }) // Ex: 2024
  public lastMembershipPaymentYear?: number

  @prop({ default: false })
  public membershipPaidThisYear?: boolean
}

@modelOptions({
  schemaOptions: { timestamps: true },
  options: {
    allowMixed: Severity.ALLOW,
    customName: 'users',
  },
})
export class User {
  public _id?: string

  @prop({ required: true })
  public register!: Register

  @prop({ required: true })
  public origines!: Origines

  @prop({ required: true })
  public infos!: Infos

  @prop({ required: true, default: false })
  public rememberMe!: boolean

  @prop({ required: true, default: false })
  public isAdmin!: boolean

  @prop()
  public cpdLng?: string

  @prop({ required: true, default: true })
  public primaryMember!: boolean

  @prop({ required: true, default: [] })
  public familyMembers!: FamilyMember[]

  @prop({ required: true, default: new Subscription() })
  public subscription!: Subscription

  @prop({})
  public referralCode?: string

  @prop({ ref: User, required: false }) // Reference to another User document
  public referredBy?: Ref<User>

  @prop()
  public deletedAt?: Date

  @prop()
  public deletedBy?: string

  @prop({ default: Date.now })
  public registerTime?: Date

  @prop({ default: Date.now })
  public originesTime?: Date

  @prop({ default: Date.now })
  public infosTime?: Date
}

export const UserModel = getModelForClass(User)
