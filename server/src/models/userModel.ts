import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose'

class Infos {
  @prop({ required: true })
  public residenceCountry!: string

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
}

class Register {
  @prop({ required: true, unique: true })
  public email!: string

  @prop({ required: true })
  public password!: string

  @prop({ required: true })
  public confirmPassword!: string

  @prop()
  public newPassword?: string

  @prop({ required: true, default: false })
  public conditions!: boolean
}

@modelOptions({
  schemaOptions: { timestamps: true },
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

  @prop({ required: true })
  public cpdLng!: string
}

export const UserModel = getModelForClass(User)
