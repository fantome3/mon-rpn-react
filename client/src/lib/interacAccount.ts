type BasicUserInfo = {
  _id?: string
  origines?: {
    firstName?: string
    lastName?: string
  }
  infos?: {
    tel?: string
    residenceCountry?: string
  }
}

type AwaitingAccountParams = {
  createAccount: (payload: {
    firstName: string
    lastName: string
    userTel: string
    userResidenceCountry: string
    solde: number
    paymentMethod: 'interac'
    userId: string
    isAwaitingFirstPayment: boolean
  }) => Promise<unknown>
  createTransaction?: (payload: {
    userId?: string
    amount: number
    type: 'credit'
    reason: string
    status: 'awaiting_payment'
  }) => Promise<unknown>
  userInfo: BasicUserInfo
  transactionReason?: string
}

export const createAwaitingInteracAccount = async ({
  createAccount,
  createTransaction,
  userInfo,
  transactionReason = "L'utilisateur n'a pas encore effectué de paiement Interac",
}: AwaitingAccountParams) => {
  if (
    !userInfo?._id ||
    !userInfo?.origines?.firstName ||
    !userInfo?.origines?.lastName ||
    !userInfo?.infos?.tel ||
    !userInfo?.infos?.residenceCountry
  ) {
    throw new Error(
      'Informations utilisateur incomplètes pour la création du compte Interac.'
    )
  }

  const accountData = await createAccount({
    firstName: userInfo.origines.firstName,
    lastName: userInfo.origines.lastName,
    userTel: userInfo.infos.tel,
    userResidenceCountry: userInfo.infos.residenceCountry,
    solde: 0,
    paymentMethod: 'interac',
    userId: userInfo._id,
    isAwaitingFirstPayment: true,
  })

  if (createTransaction) {
    await createTransaction({
      userId: userInfo._id,
      amount: 0,
      type: 'credit',
      reason: transactionReason,
      status: 'awaiting_payment',
    })
  }

  return accountData
}